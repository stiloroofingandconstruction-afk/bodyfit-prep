/**
 * PLANTILLA — adaptador de Supabase.
 *
 * No esta activo. Documenta exactamente que hace falta para migrar, para que
 * el cambio sea mecanico y sin perder datos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Instalar el cliente:
 *
 *      npm i @supabase/supabase-js
 *
 * 2. Variables de entorno (.env.local):
 *
 *      VITE_SUPABASE_URL=...
 *      VITE_SUPABASE_ANON_KEY=...
 *
 * 3. Esquema SQL. Una tabla por coleccion, todas con la misma forma:
 *
 *      create table app_state (
 *        user_id    uuid    not null references auth.users(id) on delete cascade,
 *        collection text    not null,
 *        payload    jsonb   not null,
 *        updated_at timestamptz not null default now(),
 *        primary key (user_id, collection)
 *      );
 *
 *      alter table app_state enable row level security;
 *      create policy "solo mis datos" on app_state
 *        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
 *
 *    Esta forma (documento por coleccion) permite migrar en una tarde. Cuando
 *    haga falta consultar por filas — rankings, estadisticas agregadas — se
 *    normaliza a tablas reales (workouts, food_entries, measurements...). Cada
 *    entidad ya lleva id / createdAt / updatedAt / deletedAt / userId, que es
 *    justo lo que esa normalizacion necesita.
 *
 * 4. Activarlo: en `services/storage/index.ts` cambiar
 *
 *      export const storage = localAdapter;
 *    por
 *      export const storage = supabaseAdapter;
 *
 *    Nada mas. Los stores no cambian.
 *
 * 5. Migracion de datos: `migrateLocalToRemote()` copia lo que ya haya en
 *    localStorage la primera vez que el usuario inicia sesion.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { StorageAdapter } from './types';

export const SUPABASE_READY = false;

/* eslint-disable @typescript-eslint/no-unused-vars */
export const supabaseAdapterTemplate: StorageAdapter = {
  name: 'supabase',

  async getItem(_key) {
    throw new Error('supabaseAdapter no configurado. Ver instrucciones en este archivo.');
  },
  async setItem(_key, _value) {
    throw new Error('supabaseAdapter no configurado.');
  },
  async removeItem(_key) {
    throw new Error('supabaseAdapter no configurado.');
  },
  async listKeys() {
    return [];
  },
};

/**
 * Copia el estado local al backend remoto. Se llamara una sola vez, tras el
 * primer login, cuando el adaptador remoto este activo.
 */
export async function migrateLocalToRemote(
  local: StorageAdapter,
  remote: StorageAdapter,
): Promise<{ migrated: string[] }> {
  const keys = await local.listKeys();
  const migrated: string[] = [];
  for (const key of keys) {
    const value = await local.getItem(key);
    if (value == null) continue;
    const existing = await remote.getItem(key);
    if (existing != null) continue; // el remoto manda si ya hay datos
    await remote.setItem(key, value);
    migrated.push(key);
  }
  return { migrated };
}
