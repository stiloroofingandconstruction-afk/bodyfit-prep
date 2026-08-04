-- ═══════════════════════════════════════════════════════════════════════════
-- 0002 · Tablas de dominio, normalizadas
--
-- NO hay una tabla `app_state` con un jsonb para todo. Sirve para migrar en una
-- tarde y no sirve para una plataforma: sin filas de verdad no hay consultas
-- por atleta, ni agregados, ni indices, ni dashboard de coach.
--
-- Reglas que cumplen todas las tablas de aqui:
--   · user_id not null + RLS activo, sin excepciones
--   · created_at, updated_at, deleted_at, hlc, device_id, schema_version
--   · pesos SIEMPRE en kilogramos, longitudes en centimetros
--   · jsonb solo para macros calculados y notas, nunca para datos consultables
--
-- Reversion: 0002_domain_tables.down.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Columnas comunes a toda entidad sincronizable.
-- `fields_hlc` y `delete_hlc` son relojes separados a proposito: borrar y
-- editar son decisiones ortogonales y hacerlas competir por un solo reloj hace
-- que la que llega antes anule a la otra. Ver §9 del plan de implementacion.
create or replace function sync_entity_columns() returns text language sql immutable as $$
  select $sql$
    id             text primary key,
    user_id        uuid not null references auth.users(id) on delete cascade,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    deleted_at     timestamptz,
    hlc            text not null,
    fields_hlc     text not null default '',
    delete_hlc     text not null default '',
    device_id      text not null,
    schema_version int  not null
  $sql$;
$$;

-- ───────────────────────────────────────────────────────────── identidad ──

create table profiles (
  id             text primary key,
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  -- Fusion por campo: cambiar las unidades en un dispositivo y el objetivo en
  -- otro debe conservar las dos cosas.
  field_hlc      jsonb not null default '{}'::jsonb,
  sex            text,
  birth_date     date,
  height_cm      numeric,
  goal           text,
  activity_level text,
  experience     text
);

create table user_settings (
  id             text primary key,
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  field_hlc      jsonb not null default '{}'::jsonb,
  weight_unit    text,
  length_unit    text,
  locale         text,
  competition_mode boolean not null default false
);

-- ─────────────────────────────────────────────────────────── entrenamiento ──

create table workouts (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  name           text not null,
  routine_id     text,
  started_at     timestamptz,
  finished_at    timestamptz,
  rating         int,
  notes          text
);

create table workout_exercises (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  workout_id     text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  exercise_id    text not null,
  exercise_name  text not null,
  position       int  not null default 0,
  rep_range_low  int,
  rep_range_high int,
  rest_seconds   int,
  notes          text
);

-- Cada serie es una entidad propia, y no un elemento dentro del entrenamiento.
-- Es lo que hace que editar la serie 3 en el telefono y la 5 en la tablet no
-- sea un conflicto: son operaciones sobre entidades distintas.
create table workout_sets (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  hlc                 text not null,
  fields_hlc          text not null default '',
  delete_hlc          text not null default '',
  device_id           text not null,
  schema_version      int  not null,
  position            int  not null default 0,
  weight_kg           numeric,
  reps                int,
  -- Repeticiones en reserva. Se guarda RIR y no RPE porque es lo que la gente
  -- estima de verdad al terminar la serie; el RPE equivalente es 10 - RIR.
  rir                 int,
  set_type            text not null default 'normal',
  done                boolean not null default false
);

-- ────────────────────────────────────────────────────────────── nutricion ──

create table custom_foods (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  name           text not null,
  category       text,
  role           text,
  kcal_100       numeric,
  protein_100    numeric,
  carbs_100      numeric,
  fat_100        numeric,
  fiber_100      numeric,
  servings       jsonb not null default '[]'::jsonb
);

create table nutrition_entries (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  slot           text not null,
  food_id        text,
  custom_food_id text,
  grams          numeric not null,
  -- Calculados: se guardan para no depender de que el catalogo no cambie.
  macros         jsonb not null default '{}'::jsonb
);

-- ─────────────────────────────────────────────────────────────── cuerpo ──

create table body_measurements (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  weight_kg      numeric,
  body_fat       numeric,
  neck_cm        numeric,
  waist_cm       numeric,
  hip_cm         numeric,
  chest_cm       numeric,
  arm_cm         numeric,
  thigh_cm       numeric,
  calf_cm        numeric,
  shoulder_cm    numeric,
  notes          text
);

create table readiness_entries (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  weight_kg      numeric,
  sleep          int,
  energy         int,
  hunger         int,
  stress         int,
  steps          int
);

create table weekly_checkins (
  id                text primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  hlc               text not null,
  fields_hlc        text not null default '',
  delete_hlc        text not null default '',
  device_id         text not null,
  schema_version    int  not null,
  week_start        date not null,
  avg_weight_kg     numeric,
  weight_change_kg  numeric,
  waist_cm          numeric,
  adherence         numeric,
  energy            int,
  sleep             int,
  hunger            int,
  stress            int,
  workouts_completed int,
  avg_kcal          numeric,
  kcal_adjustment   numeric,
  new_kcal_target   numeric,
  notes             text
);

-- ────────────────────────────────────────────────────────── competencia ──

create table competition_preps (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  hlc              text not null,
  fields_hlc       text not null default '',
  delete_hlc       text not null default '',
  device_id        text not null,
  schema_version   int  not null,
  show_name        text,
  federation       text,
  division         text,
  show_date        date,
  target_weight_kg numeric,
  start_date       date
);

create table prep_recommendations (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  prep_id        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  week           int,
  action         text,
  deltas         jsonb not null default '{}'::jsonb,
  accepted       boolean
);

create table cardio_sessions (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  modality       text,
  minutes        int,
  intensity      text,
  kcal           numeric
);

create table posing_sessions (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  minutes        int,
  poses          jsonb not null default '[]'::jsonb,
  notes          text
);

-- ───────────────────────────────────────────────────────────────── fotos ──
--
-- METADATOS UNICAMENTE. El binario se queda en el dispositivo.
--
-- `storage_path` y `upload_state` existen desde el primer dia aunque en la 2.1
-- no se suba ninguna imagen: anadir una columna despues obliga a una migracion,
-- y tenerla vacia no cuesta nada.
--
-- No se activara la subida hasta que existan politica de compresion, limite por
-- usuario, bucket privado con URL firmada y una decision explicita sobre
-- privacidad. Las fotos de progreso son el dato mas sensible de la aplicacion.

create table progress_photos (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  date           date not null,
  angle          text not null,
  -- Clave del blob en el IndexedDB del dispositivo que la tomo.
  blob_id        text,
  storage_path   text,
  upload_state   text not null default 'local-only'
    check (upload_state in ('local-only', 'pending-upload', 'synced', 'failed')),
  weight_kg      numeric,
  prep_week      int,
  notes          text
);

create table reminders (
  id             text primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  hlc            text not null,
  fields_hlc     text not null default '',
  delete_hlc     text not null default '',
  device_id      text not null,
  schema_version int  not null,
  kind           text not null,
  scheduled_for  timestamptz,
  enabled        boolean not null default true,
  payload        jsonb not null default '{}'::jsonb
);

-- ═════════════════════════════════════════════════════════════ indices ══

create index workouts_user_date            on workouts (user_id, date desc);
create index workout_exercises_workout     on workout_exercises (workout_id);
create index workout_sets_exercise         on workout_sets (workout_exercise_id);
create index nutrition_entries_user_date   on nutrition_entries (user_id, date desc);
create index body_measurements_user_date   on body_measurements (user_id, date desc);
create index readiness_entries_user_date   on readiness_entries (user_id, date desc);
create index weekly_checkins_user_week     on weekly_checkins (user_id, week_start desc);
create index cardio_sessions_user_date     on cardio_sessions (user_id, date desc);
create index posing_sessions_user_date     on posing_sessions (user_id, date desc);
create index progress_photos_user_date     on progress_photos (user_id, date desc);
create index prep_recommendations_prep     on prep_recommendations (prep_id);

-- Vivos frente a borrados: casi toda consulta filtra por esto
create index workouts_alive           on workouts (user_id) where deleted_at is null;
create index nutrition_entries_alive  on nutrition_entries (user_id) where deleted_at is null;
create index body_measurements_alive  on body_measurements (user_id) where deleted_at is null;

-- ═══════════════════════════════════════════ row level security en todas ══
--
-- La politica de coach del plan maestro NO se crea todavia. No hay dashboard de
-- coach en la 2.1, y una politica que concede lectura a terceros no debe
-- existir antes que la funcion que la necesita.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'user_settings', 'workouts', 'workout_exercises', 'workout_sets',
    'custom_foods', 'nutrition_entries', 'body_measurements', 'readiness_entries',
    'weekly_checkins', 'competition_preps', 'prep_recommendations',
    'cardio_sessions', 'posing_sessions', 'progress_photos', 'reminders'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "propio" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

drop function sync_entity_columns();
