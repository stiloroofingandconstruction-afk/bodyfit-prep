/**
 * Llevar los datos locales a una cuenta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL MOMENTO MAS PELIGROSO DE TODA LA APLICACION
 *
 * Alguien lleva ocho meses registrando su preparacion en el telefono y crea una
 * cuenta. Si este codigo se equivoca, pierde ocho meses. No hay ninguna otra
 * operacion en BodyFit con ese potencial de dano.
 *
 * De ahi las cuatro reglas, en este orden:
 *
 *   1. Copia de seguridad completa ANTES de tocar nada. No es opcional ni
 *      configurable.
 *   2. Nunca se mezclan datos de dos personas. Si los datos locales ya tienen
 *      dueno y es otro, no se fusiona y no se ofrece fusionar.
 *   3. Es idempotente. Se puede interrumpir a la mitad y repetir.
 *   4. No borra nada local, pase lo que pase.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { SYNC_COLLECTION_KEYS, type SyncCollectionKey } from '@bodyfit/domain/sync/operations';
import { storageKey } from '@bodyfit/domain/collections';
import { currentSession } from './auth';
import { recordChange } from './engine';

/* ══════════════════════════════════════════════════════════════ el plan ══ */

export interface AdoptionSummary {
  /** Cuantas entidades vivas hay por coleccion en este dispositivo. */
  readonly byCollection: ReadonlyArray<{ collection: SyncCollectionKey; entities: number }>;
  readonly totalEntities: number;
  /** Dueno de los datos locales, si ya lo tenian. */
  readonly localOwner: string | null;
  /** La cuenta con la que se acaba de entrar. */
  readonly accountUser: string | null;
  /**
   * Los datos locales son de OTRA persona. No se fusiona: se archiva o se
   * mantienen perfiles separados. Es la regla 2.
   */
  readonly conflictOfOwner: boolean;
}

/**
 * Cuenta lo que hay en este dispositivo, sin tocar nada.
 *
 * Lee del almacenamiento y no de los stores para no depender de que las
 * pantallas esten montadas: esto puede ejecutarse desde ajustes, con la mitad
 * de la aplicacion sin cargar.
 */
export function summarizeLocalData(): AdoptionSummary {
  const byCollection: { collection: SyncCollectionKey; entities: number }[] = [];
  let total = 0;
  let localOwner: string | null = null;

  for (const collection of SYNC_COLLECTION_KEYS) {
    const entities = countAlive(collection);
    if (entities > 0) byCollection.push({ collection, entities });
    total += entities;
    localOwner ??= ownerOf(collection);
  }

  const session = currentSession();
  return {
    byCollection,
    totalEntities: total,
    localOwner,
    accountUser: session?.userId ?? null,
    conflictOfOwner:
      localOwner !== null && session !== null && localOwner !== session.userId,
  };
}

/** Entidades vivas —sin `deletedAt`— de una coleccion. */
function countAlive(collection: SyncCollectionKey): number {
  const arrays = readArrays(collection);
  let n = 0;
  for (const list of arrays) {
    for (const item of list) {
      if (isEntity(item) && !item.deletedAt) n++;
    }
  }
  return n;
}

/** El `userId` con el que se guardo cualquier entidad, si alguna lo tiene. */
function ownerOf(collection: SyncCollectionKey): string | null {
  for (const list of readArrays(collection)) {
    for (const item of list) {
      if (isEntity(item) && typeof item.userId === 'string' && item.userId) return item.userId;
    }
  }
  return null;
}

interface StoredEntity {
  id: string;
  deletedAt?: string | null;
  userId?: string | null;
  [key: string]: unknown;
}

function isEntity(value: unknown): value is StoredEntity {
  return typeof value === 'object' && value !== null && typeof (value as StoredEntity).id === 'string';
}

/**
 * Saca las listas de entidades de una coleccion persistida.
 *
 * Un store de zustand guarda `{ state: { entries: [...], recent: [...] }, version }`
 * y no todas las claves son entidades: `recent` es una lista de identificadores
 * de alimentos, no de entidades. Se recorren todos los arrays y se filtra por
 * "tiene `id`", que es lo que distingue una entidad de una lista cualquiera.
 */
function readArrays(collection: SyncCollectionKey): unknown[][] {
  try {
    const raw = localStorage.getItem(storageKey(collection));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    const state = parsed?.state;
    if (!state) return [];
    return Object.values(state).filter((v): v is unknown[] => Array.isArray(v));
  } catch {
    return [];
  }
}

/* ══════════════════════════════════════════════════════════ la adopcion ══ */

export interface AdoptionResult {
  readonly queued: number;
  readonly skipped: number;
  readonly collections: SyncCollectionKey[];
}

/**
 * Encola todo lo local como operaciones `upsert`.
 *
 * ¿Por que es idempotente? Porque cada operacion lleva el `id` que la entidad ya
 * tenia, y el servidor descarta por `operationId` lo que ya recibio y por HLC lo
 * que ya aplico. Ejecutarlo dos veces produce el mismo estado que ejecutarlo
 * una. Se puede interrumpir a la mitad —cerrar la aplicacion, quedarse sin
 * red— y repetir sin duplicar ni una fila.
 *
 * NO envia: encola. El motor se encarga despues, con sus reintentos. Asi la
 * pantalla no se queda bloqueada subiendo ocho meses de datos.
 */
export async function adoptLocalData(): Promise<AdoptionResult> {
  const session = currentSession();
  if (!session) throw new Error('no hay sesion: no se puede adoptar nada');

  const summary = summarizeLocalData();
  /*
   * Cortafuegos. Aunque la interfaz ya lo impide, esta comprobacion se queda:
   * es la ultima linea antes de mezclar los datos de dos personas, y ese error
   * no se puede deshacer despues.
   */
  if (summary.conflictOfOwner) {
    throw new Error('los datos locales pertenecen a otra cuenta: no se fusionan');
  }

  let queued = 0;
  let skipped = 0;
  const collections: SyncCollectionKey[] = [];

  for (const collection of SYNC_COLLECTION_KEYS) {
    let any = false;
    for (const list of readArrays(collection)) {
      for (const item of list) {
        if (!isEntity(item)) continue;
        if (item.deletedAt) {
          // Lo borrado no se sube como creacion. Su tombstone ya es el dato.
          skipped++;
          continue;
        }
        const { userId: _ignored, deletedAt: _also, ...payload } = item;
        await recordChange({
          collection,
          entityId: item.id,
          operationType: 'upsert',
          payload,
          userId: session.userId,
        });
        queued++;
        any = true;
      }
    }
    if (any) collections.push(collection);
  }

  return { queued, skipped, collections };
}
