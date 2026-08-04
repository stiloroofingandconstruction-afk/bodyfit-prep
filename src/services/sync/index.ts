/**
 * Punto de entrada de la sincronizacion.
 *
 * **Una sola configuracion decide todo**: el feature flag. Con `disabled` —el
 * valor de produccion— se usa `LocalOnlyAdapter` y la aplicacion se comporta
 * exactamente como antes de que existiera este subsistema.
 */
import { localOnlyAdapter } from './adapters/localOnly';
import { SUPABASE_CONFIGURED, supabaseSyncAdapter } from './adapters/supabase';
import type { SyncAdapter } from './adapters/types';
import { syncEnabled } from './flag';
import { useAdapter } from './engine';

/**
 * El adaptador que corresponde ahora mismo.
 *
 * Si el flag pide sincronizar pero no hay configuracion de Supabase, se cae al
 * local en vez de fallar. Un despliegue mal configurado no debe dejar la
 * aplicacion inservible: debe dejarla como estaba.
 */
export function selectAdapter(): SyncAdapter {
  if (!syncEnabled()) return localOnlyAdapter;
  if (!SUPABASE_CONFIGURED) return localOnlyAdapter;
  return supabaseSyncAdapter;
}

/** Aplica la seleccion al motor. Se llama al arrancar y al cambiar el flag. */
export function applyAdapterSelection(): SyncAdapter {
  const adapter = selectAdapter();
  useAdapter(adapter);
  return adapter;
}

export { syncFlag, setSyncFlag, syncEnabled, accountUiVisible, SYNC_FLAGS, SYNC_FLAG_LABEL } from './flag';
export type { SyncFlag } from './flag';
export {
  initSync,
  flush,
  pull,
  recordChange,
  syncStatus,
  subscribeToSync,
  outboxEntries,
  retryDeadLetter,
  type SyncStatus,
} from './engine';
export { deviceId, currentClock } from './identity';
export { currentSession, isSignedIn, signOut } from './auth';
export type { SyncAdapter } from './adapters/types';
