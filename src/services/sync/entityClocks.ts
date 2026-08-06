/**
 * Relojes por entidad, guardados en este dispositivo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE HACE FALTA ESTO
 *
 * Las reglas de conflicto necesitan saber CON QUE HLC se escribio por ultima vez
 * cada entidad: si no, no hay forma de decidir si lo que llega del servidor es
 * mas nuevo o mas viejo que lo que ya hay.
 *
 * Las entidades del dominio no llevan esos relojes —`Entity` tiene `id`,
 * `createdAt`, `updatedAt` y `deletedAt`, y ya esta— y anadirselos obligaria a
 * migrar todo lo que la gente ya tiene guardado.
 *
 * Se guardan aparte. Es informacion de este aparato, como el cursor o la cola:
 * no viaja al servidor, no entra en las copias de seguridad, y si se pierde se
 * reconstruye volviendo a leer el log desde cero. Perderla cuesta releer, no
 * datos.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { EntityState } from '@bodyfit/domain/sync/conflict';
import type { SyncCollectionKey } from '@bodyfit/domain/sync/operations';

import { CLOCKS_STORE as STORE, openSyncDb as open } from './db';

/** Reloj de una entidad, sin sus campos: los campos viven en el store. */
export interface EntityClock {
  readonly hlc: string;
  readonly fieldsHlc: string;
  readonly deleteHlc: string;
  readonly fieldHlc?: Record<string, string>;
}

export function clockKey(collection: SyncCollectionKey, entityId: string): string {
  return `${collection}/${entityId}`;
}

export async function loadClocks(): Promise<Map<string, EntityClock>> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const keys = store.getAllKeys();
    const values = store.getAll();
    tx.oncomplete = () => {
      const map = new Map<string, EntityClock>();
      (keys.result as string[]).forEach((k, i) => {
        map.set(k, (values.result as EntityClock[])[i]);
      });
      resolve(map);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveClocks(entries: ReadonlyMap<string, EntityClock>): Promise<void> {
  if (entries.size === 0) return;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const [key, clock] of entries) store.put(clock, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Reconstruye el estado que necesitan las reglas de conflicto.
 *
 * Los campos salen del store —son la verdad de lo que la persona ve— y los
 * relojes de aqui. Si no hay reloj guardado, la entidad existe pero nunca se
 * sincronizo: se le dan relojes vacios, con lo que cualquier operacion remota
 * gana. Es lo correcto, porque lo local ya se subio con su propio HLC y volvera
 * en el pull.
 */
export function toEntityState(
  collection: SyncCollectionKey,
  entityId: string,
  fields: Record<string, unknown> | null,
  clock: EntityClock | undefined,
): EntityState | null {
  if (fields === null && clock === undefined) return null;
  return {
    entityId,
    collection,
    hlc: clock?.hlc ?? '',
    fieldsHlc: clock?.fieldsHlc ?? '',
    deleteHlc: clock?.deleteHlc ?? '',
    deletedAt: (fields?.deletedAt as string | undefined) ?? null,
    fields: fields ?? {},
    ...(clock?.fieldHlc ? { fieldHlc: clock.fieldHlc } : {}),
  };
}

export function fromEntityState(state: EntityState): EntityClock {
  return {
    hlc: state.hlc,
    fieldsHlc: state.fieldsHlc,
    deleteHlc: state.deleteHlc,
    ...(state.fieldHlc ? { fieldHlc: { ...state.fieldHlc } } : {}),
  };
}

/** Solo para pruebas y para el borrado total de datos. */
export async function clearClocks(): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
