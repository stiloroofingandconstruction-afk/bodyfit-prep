/**
 * Puente entre los stores y la cola de sincronizacion.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL ORDEN IMPORTA Y ES SIEMPRE EL MISMO
 *
 *   1. El store aplica el cambio. La interfaz ya responde.
 *   2. Se llama aqui.
 *
 * Nunca al reves. Si se registrara la operacion antes de aplicar el cambio y el
 * encolado fallara, la persona veria en pantalla algo que no llego a ocurrir.
 * Al reves, lo peor que pasa es que el cambio existe en el dispositivo y tarda
 * en viajar — que es exactamente el comportamiento que se busca.
 *
 * Con el feature flag en `disabled` —produccion— esto no hace absolutamente
 * nada: ni abre IndexedDB, ni escribe, ni cuesta un milisegundo. Un usuario que
 * ya tiene la aplicacion instalada no nota ningun cambio.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { SyncCollectionKey } from '@bodyfit/domain/sync/operations';
import type { Entity } from '@bodyfit/domain/types';
import { syncEnabled } from '@/services/sync/flag';

/**
 * Registra la creacion o edicion de una entidad.
 *
 * Se manda la entidad entera y no solo los campos tocados. Es mas trafico —unos
 * cientos de bytes— a cambio de que una operacion perdida no deje a la entidad
 * a medias en el otro dispositivo. En una aplicacion de este tamano el trafico
 * no es el problema; los datos incompletos si.
 */
export function recordUpsert(collection: SyncCollectionKey, entity: Entity): void {
  if (!syncEnabled()) return;
  void emit(collection, entity.id, 'upsert', stripInternals(entity));
}

/** Registra un borrado logico. El payload va vacio: el tombstone es el dato. */
export function recordDelete(collection: SyncCollectionKey, entityId: string): void {
  if (!syncEnabled()) return;
  void emit(collection, entityId, 'delete');
}

/** Registra la reversion de un borrado. Explicita, con su propio momento. */
export function recordRestore(collection: SyncCollectionKey, entityId: string): void {
  if (!syncEnabled()) return;
  void emit(collection, entityId, 'restore');
}

/** Varias entidades de golpe: duplicar un dia, repetir un entrenamiento. */
export function recordUpsertMany(collection: SyncCollectionKey, entities: readonly Entity[]): void {
  if (!syncEnabled()) return;
  for (const entity of entities) recordUpsert(collection, entity);
}

/**
 * Carga el motor solo cuando hace falta.
 *
 * El `import()` diferido mantiene el motor, la cola y el reloj fuera del chunk
 * de arranque. Con la sincronizacion desactivada nunca llega a evaluarse, asi
 * que no pesa ni un byte para quien no la usa. Es la misma regla que saco los
 * catalogos del arranque en D4.
 */
async function emit(
  collection: SyncCollectionKey,
  entityId: string,
  operationType: 'upsert' | 'delete' | 'restore',
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    const { recordChange } = await import('@/services/sync/engine');
    await recordChange({ collection, entityId, operationType, payload });

    /*
     * Y se pide un ciclo. Sin esto la operacion se quedaba en la cola hasta que
     * alguien entrara en ajustes y pulsara "Sincronizar ahora" — que es lo que
     * pasaba, y hacia que esto no fuera sincronizacion sino exportacion manual.
     */
    const { syncSoon } = await import('@/services/sync/scheduler');
    syncSoon();
  } catch (err) {
    /*
     * Un fallo al encolar no puede tumbar la accion del usuario: el cambio ya
     * esta guardado en local, que es lo que de verdad importa. Se registra para
     * que aparezca en el diagnostico en vez de desaparecer.
     */
    console.error('[sync] no se pudo encolar la operacion', collection, entityId, err);
  }
}

/**
 * Quita del payload lo que el servidor calcula o no debe recibir.
 *
 * `userId` lo pone el servidor a partir de la sesion —aceptar el que mande el
 * cliente permitiria escribir en nombre de otro— y `deletedAt` lo decide el
 * tipo de operacion, no un campo del payload.
 */
function stripInternals(entity: Entity): Record<string, unknown> {
  const { userId: _userId, deletedAt: _deletedAt, ...rest } = entity as Entity &
    Record<string, unknown>;
  return rest;
}
