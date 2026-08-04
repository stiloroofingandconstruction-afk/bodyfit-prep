-- ═══════════════════════════════════════════════════════════════════════════
-- 0001 · Nucleo de sincronizacion
--
-- Dispositivos, log de operaciones, secuencia por usuario y cursores.
-- Reversion: 0001_sync_core.down.sql
-- ═══════════════════════════════════════════════════════════════════════════

create type sync_op_type as enum ('upsert', 'delete', 'restore');

-- ─────────────────────────────────────────────────────────── dispositivos ──

create table devices (
  id             uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  label          text,
  platform       text,
  client_version text,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);

create index devices_user on devices (user_id);

-- ──────────────────────────────────────────────── secuencia por usuario ──
--
-- La pieza que impide perder operaciones en silencio.
--
-- La tentacion es usar un `bigserial` global, y esta mal: dos transacciones
-- pueden obtener los numeros 100 y 101 y confirmarse en orden inverso. Un
-- lector que llegue justo en medio ve la 101, avanza su cursor, y NO VUELVE A
-- VER NUNCA la 100.
--
-- Aqui la secuencia se asigna con un UPDATE sobre la fila del usuario, dentro
-- de la misma transaccion que el insert. El bloqueo de fila serializa a los
-- escritores de ese usuario: sin huecos, y el orden de confirmacion coincide
-- con el orden de `seq`. Una persona escribe unas pocas operaciones por minuto
-- desde dos o tres dispositivos, asi que el coste del bloqueo es irrelevante.

create table sync_user_state (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  last_seq bigint not null default 0
);

-- ───────────────────────────────────────────────── log de operaciones ──

create table sync_operations (
  operation_id   uuid primary key,
  user_id        uuid   not null references auth.users(id) on delete cascade,
  device_id      text   not null,
  seq            bigint not null,
  collection     text   not null,
  entity_id      text   not null,
  operation_type sync_op_type not null,
  payload        jsonb  not null default '{}'::jsonb,
  -- El HLC serializado. Ordena SEMANTICAMENTE; `seq` ordena la ENTREGA.
  hlc            text   not null,
  created_at     timestamptz not null,
  received_at    timestamptz not null default now(),
  schema_version int    not null,
  client_version text   not null,
  checksum       text   not null,
  unique (user_id, seq)
);

-- El indice que sostiene todo el pull
create index sync_operations_pull   on sync_operations (user_id, seq);
create index sync_operations_entity on sync_operations (user_id, collection, entity_id);

-- ────────────────────────────────────────────────────────────── cursores ──

create table sync_cursors (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  device_id  text   not null,
  cursor     bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);

-- ══════════════════════════════════════════════════ row level security ══
--
-- `using` controla que filas se ven; `with check` que filas se pueden escribir.
-- Sin `with check` un usuario puede INSERTAR filas con el user_id de otro
-- aunque no pueda leerlas. Van siempre los dos.

alter table devices          enable row level security;
alter table sync_user_state  enable row level security;
alter table sync_operations  enable row level security;
alter table sync_cursors     enable row level security;

create policy "propio" on devices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "propio" on sync_user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "propio" on sync_cursors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- El log es inmutable para el cliente: puede leer lo suyo e insertar, nunca
-- modificar ni borrar. Una operacion ya aceptada no se reescribe.
create policy "leer lo propio" on sync_operations
  for select using (auth.uid() = user_id);

create policy "insertar lo propio" on sync_operations
  for insert with check (auth.uid() = user_id);
