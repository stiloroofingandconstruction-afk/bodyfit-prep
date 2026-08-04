-- ═══════════════════════════════════════════════════════════════════════════
-- 0004 · Dos correcciones que solo aparecieron al conectar con un Postgres real
--
-- Ninguna de las dos la detecto el parser de SQL, ni la simulacion de catorce
-- dias, ni las pruebas del navegador. Las dos aparecieron en el primer minuto
-- contra el servidor de staging.
--
-- Reversion: 0004_sync_push_hardening.down.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────── 1 · el ambiguo `operation_id` ──
--
-- ERROR 42702: "column reference operation_id is ambiguous. It could refer to
-- either a PL/pgSQL variable or a table column."
--
-- La funcion declara `returns table (operation_id uuid, ...)`, asi que
-- `operation_id` es TAMBIEN una variable de plpgsql. En la lista de columnas de
-- un INSERT no hay ambiguedad, pero `on conflict (operation_id)` es una
-- expresion de inferencia de indice: Postgres la resuelve como expresion y no
-- sabe a cual de los dos te refieres. Fallaba el lote entero, con las 500
-- operaciones dentro.
--
-- La solucion no es renombrar la salida —eso cambiaria las claves del JSON que
-- devuelve PostgREST y con ellas el contrato del adaptador— sino referenciar la
-- restriccion por su nombre. No hay expresion que resolver.

-- ─────────────────────────── 2 · privilegios que no hacian falta ──
--
-- `sync_push` se escribio como `security definer` porque el diseno original la
-- hacia proyectar sobre las tablas normalizadas dentro de la misma transaccion
-- que el log. Esa proyeccion se aplazo a la 2.2: hoy solo escribe en
-- `sync_operations` y en `sync_user_state`, y de las dos cosas el propio
-- usuario ya tiene permiso por RLS.
--
-- Una funcion con privilegios elevados que no los necesita es superficie de
-- ataque gratis. Con `security invoker`, si manana alguien se equivoca
-- escribiendo una consulta aqui dentro, RLS sigue estando en medio.
--
-- Ademas: `revoke ... from public` NO basta. Supabase concede EXECUTE a `anon`
-- y `authenticated` por privilegios por defecto, y esa concesion es explicita:
-- hay que quitarsela a `anon` por su nombre. El linter de seguridad de Supabase
-- lo marcaba, y sin esto un anonimo podia invocar una funcion `definer` —fallaba
-- por falta de sesion, pero podia invocarla.

create or replace function sync_push(p_ops jsonb)
returns table (operation_id uuid, status text, reason text)
language plpgsql security invoker set search_path = public as $$
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

  if jsonb_array_length(p_ops) > 100 then
    raise exception 'lote demasiado grande: maximo 100 operaciones';
  end if;

  insert into sync_user_state (user_id) values (v_user)
  on conflict on constraint sync_user_state_pkey do nothing;

  for v_op in select * from jsonb_array_elements(p_ops)
  loop
    -- Un `operationId` que no es un UUID rechaza ESA operacion, no el lote.
    -- Un cliente con un fallo no puede bloquear la cola de un dispositivo sano.
    begin
      v_id := (v_op->>'operationId')::uuid;
    exception when others then
      operation_id := '00000000-0000-0000-0000-000000000000'::uuid;
      status := 'rejected';
      reason := 'operationId no es un UUID';
      return next; continue;
    end;

    if (v_op->>'userId') is not null and (v_op->>'userId')::uuid <> v_user then
      operation_id := v_id; status := 'rejected';
      reason := 'la operacion pertenece a otro usuario';
      return next; continue;
    end if;

    v_schema := (v_op->>'schemaVersion')::int;
    if v_schema is null then
      operation_id := v_id; status := 'rejected';
      reason := 'falta schemaVersion';
      return next; continue;
    end if;
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

    if exists (select 1 from sync_operations o where o.operation_id = v_id) then
      operation_id := v_id; status := 'duplicate'; reason := null;
      return next; continue;
    end if;

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
    -- Por NOMBRE DE RESTRICCION, no por expresion. Ver el punto 1 de arriba.
    on conflict on constraint sync_operations_pkey do nothing;

    operation_id := v_id; status := 'applied'; reason := null;
    return next;
  end loop;
end $$;

revoke all on function sync_push(jsonb) from public;
revoke all on function sync_push(jsonb) from anon;
grant execute on function sync_push(jsonb) to authenticated;

-- Ningun anonimo invoca nada del motor. Todas fallan sin sesion de todos modos,
-- pero una funcion que no se puede ni llamar es una superficie menos.
revoke all on function sync_pull(bigint, int) from anon;
revoke all on function sync_set_cursor(text, bigint) from anon;
revoke all on function sync_get_cursor(text) from anon;
revoke all on function sync_bootstrap_seq() from anon;
revoke all on function register_device(text, text, text, text) from anon;
