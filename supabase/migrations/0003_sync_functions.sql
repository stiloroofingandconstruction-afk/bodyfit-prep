-- ═══════════════════════════════════════════════════════════════════════════
-- 0003 · Funciones de sincronizacion
--
-- Reversion: 0003_sync_functions.down.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- `set search_path` en TODAS las funciones, no solo en las `security definer`.
--
-- Sin el, una funcion resuelve los nombres con el search_path de quien llama:
-- alguien con permiso para crear esquemas puede colocar una tabla con el mismo
-- nombre por delante y hacer que la funcion lea o escriba ahi. El linter de
-- Supabase lo marca, y marcarlo solo en las definer deja la mitad del problema.

-- Version de esquema que entiende este servidor.
-- Regla: el servidor entiende N y N-1 SIEMPRE. Nunca se rompe la compatibilidad
-- hacia atras en un solo despliegue, porque el cliente viejo y el nuevo
-- conviven durante semanas.
create or replace function sync_server_schema() returns int
language sql immutable set search_path = '' as $$
  select 3;
$$;

create or replace function sync_min_schema() returns int
language sql immutable set search_path = '' as $$
  select 2;
$$;

-- ─────────────────────────────────────────────────────── comprobacion ──

create or replace function sync_health()
returns table (reachable boolean, server_schema int, min_schema int)
language sql stable security invoker set search_path = public as $$
  select true, sync_server_schema(), sync_min_schema();
$$;

-- ──────────────────────────────────────────────────────── dispositivo ──

create or replace function register_device(
  p_device_id      text,
  p_label          text,
  p_platform       text,
  p_client_version text
) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sin sesion';
  end if;

  insert into devices (id, user_id, label, platform, client_version)
  values (p_device_id::uuid, auth.uid(), p_label, p_platform, p_client_version)
  on conflict (id) do update
    set last_seen_at   = now(),
        label          = excluded.label,
        client_version = excluded.client_version;

  insert into sync_user_state (user_id) values (auth.uid())
  on conflict (user_id) do nothing;
end $$;

-- ──────────────────────────────────────────────────────────────── push ──
--
-- `security definer` porque tiene que escribir en las tablas normalizadas
-- dentro de la misma transaccion que el log. Por eso LO PRIMERO que hace es
-- comprobar `auth.uid()` y rechazar toda operacion cuyo user_id no coincida:
-- un `security definer` sin esa comprobacion es un agujero por el que
-- cualquiera escribe en los datos de cualquiera.

create or replace function sync_push(p_ops jsonb)
returns table (operation_id uuid, status text, reason text)
language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_op     jsonb;
  v_id     uuid;
  v_seq    bigint;
  v_schema int;
begin
  if v_user is null then
    raise exception 'sin sesion';
  end if;

  if jsonb_typeof(p_ops) <> 'array' then
    raise exception 'se esperaba un array de operaciones';
  end if;

  -- Limite de lote. Uno mas grande no es un uso legitimo.
  if jsonb_array_length(p_ops) > 100 then
    raise exception 'lote demasiado grande: maximo 100 operaciones';
  end if;

  insert into sync_user_state (user_id) values (v_user)
  on conflict (user_id) do nothing;

  for v_op in select * from jsonb_array_elements(p_ops)
  loop
    v_id := (v_op->>'operationId')::uuid;

    -- 1 · Nadie escribe en nombre de otro.
    if (v_op->>'userId') is not null and (v_op->>'userId')::uuid <> v_user then
      operation_id := v_id; status := 'rejected';
      reason := 'la operacion pertenece a otro usuario';
      return next; continue;
    end if;

    -- 2 · Esquema comprensible. Uno mas nuevo significa cliente por delante del
    --     servidor: se rechaza en vez de aplicar algo que no se entiende.
    v_schema := (v_op->>'schemaVersion')::int;
    if v_schema > sync_server_schema() then
      operation_id := v_id; status := 'rejected';
      reason := format('esquema %s por encima del servidor (%s)', v_schema, sync_server_schema());
      return next; continue;
    end if;
    if v_schema < sync_min_schema() then
      operation_id := v_id; status := 'rejected';
      reason := format('esquema %s por debajo del minimo (%s)', v_schema, sync_min_schema());
      return next; continue;
    end if;

    -- 3 · Idempotencia. Reenviar es seguro, y por eso el reintento del cliente
    --     puede ser agresivo.
    if exists (select 1 from sync_operations o where o.operation_id = v_id) then
      operation_id := v_id; status := 'duplicate'; reason := null;
      return next; continue;
    end if;

    -- 4 · Secuencia bajo bloqueo de fila: sin huecos y en orden de confirmacion.
    update sync_user_state s
       set last_seq = s.last_seq + 1
     where s.user_id = v_user
    returning s.last_seq into v_seq;

    insert into sync_operations (
      operation_id, user_id, device_id, seq, collection, entity_id,
      operation_type, payload, hlc, created_at, schema_version,
      client_version, checksum
    ) values (
      v_id, v_user, v_op->>'deviceId', v_seq, v_op->>'collection', v_op->>'entityId',
      (v_op->>'operationType')::sync_op_type, coalesce(v_op->'payload', '{}'::jsonb),
      v_op->>'hlc', (v_op->>'createdAt')::timestamptz, v_schema,
      v_op->>'clientVersion', v_op->>'checksum'
    )
    on conflict (operation_id) do nothing;

    operation_id := v_id; status := 'applied'; reason := null;
    return next;
  end loop;
end $$;

revoke all on function sync_push(jsonb) from public;
grant execute on function sync_push(jsonb) to authenticated;

-- ──────────────────────────────────────────────────────────────── pull ──
--
-- Se lee POR `seq`, nunca por HLC. El HLC ordena semanticamente; el orden de
-- entrega lo tiene que dar el servidor. Pedir "operaciones con HLC mayor que el
-- ultimo que vi" pierde en silencio las de un dispositivo que estuvo offline:
-- su HLC es viejo y nunca superaria el cursor.

create or replace function sync_pull(p_cursor bigint, p_limit int default 500)
returns table (
  operation_id uuid, seq bigint, device_id text, collection text, entity_id text,
  operation_type text, payload jsonb, hlc text, created_at timestamptz,
  schema_version int, client_version text, checksum text
)
language sql stable security invoker set search_path = public as $$
  select o.operation_id, o.seq, o.device_id, o.collection, o.entity_id,
         o.operation_type::text, o.payload, o.hlc, o.created_at,
         o.schema_version, o.client_version, o.checksum
    from sync_operations o
   where o.user_id = auth.uid()
     and o.seq > coalesce(p_cursor, 0)
   order by o.seq
   limit least(coalesce(p_limit, 500), 500);
$$;

-- ────────────────────────────────────────────────────────────── cursor ──

create or replace function sync_set_cursor(p_device_id text, p_cursor bigint)
returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sin sesion';
  end if;
  insert into sync_cursors (user_id, device_id, cursor)
  values (auth.uid(), p_device_id, greatest(p_cursor, 0))
  on conflict (user_id, device_id) do update
    -- El cursor solo avanza. Uno que retrocede solo obliga a releer, pero
    -- guardarlo hacia atras dejaria al dispositivo repitiendo trabajo cada vez.
    set cursor = greatest(sync_cursors.cursor, excluded.cursor),
        updated_at = now();
end $$;

create or replace function sync_get_cursor(p_device_id text)
returns bigint
language sql stable security invoker set search_path = public as $$
  select coalesce(
    (select c.cursor from sync_cursors c
      where c.user_id = auth.uid() and c.device_id = p_device_id),
    0
  );
$$;

-- ─────────────────────────────────────────────────────────── bootstrap ──
--
-- Un dispositivo nuevo NO reproduce el log entero: seria absurdo pedirle a
-- alguien con dos anos de datos que descargue cientos de miles de operaciones
-- para estrenar un telefono. Lee el estado actual, anota la secuencia y sigue
-- desde ahi. Es lo que permite podar el log a los 90 dias sin perder nada.

create or replace function sync_bootstrap_seq()
returns bigint
language sql stable security invoker set search_path = public as $$
  select coalesce((select last_seq from sync_user_state where user_id = auth.uid()), 0);
$$;
