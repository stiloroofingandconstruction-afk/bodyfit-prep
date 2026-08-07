/**
 * La mitad que faltaba: volcar en la aplicacion lo que llega del servidor.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * El motor sabia traerse las operaciones y no habia NADA que las aplicara.
 *
 * Subian bien —probado contra Supabase real, 174 operaciones— y bajaban por el
 * transporte, pero se quedaban ahi: ningun codigo las escribia en los stores.
 * Una comida registrada en el telefono no aparecia jamas en el ordenador.
 *
 * Se descubrio al automatizar la prueba de dos dispositivos, preguntandose que
 * codigo pulsaba los botones. La respuesta era que ninguno, y tirando de ese
 * hilo salio que tampoco habia quien aplicara lo recibido.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Las reglas de conflicto NO se reimplementan aqui: se usa `applyOperation` del
 * dominio, el mismo que valida la simulacion de catorce dias y la auditoria
 * contra staging. Esto solo traduce su resultado a los stores.
 */
import { applyOperation } from '@bodyfit/domain/sync/conflict';
import { sortOperations, type SyncCollectionKey, type SyncOperation } from '@bodyfit/domain/sync/operations';
import type { Entity } from '@bodyfit/domain/types';
import { useNutritionStore } from '@/store/nutritionStore';
import { useTrainingStore } from '@/store/trainingStore';
import { useBodyStore } from '@/store/bodyStore';
import { useCheckinStore } from '@/store/checkinStore';
import { usePhotoStore } from '@/store/photoStore';
import { useProfileStore } from '@/store/profileStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  clockKey,
  fromEntityState,
  loadClocks,
  saveClocks,
  toEntityState,
  type EntityClock,
} from './entityClocks';

/* ══════════════════════════════════════════════════════════ el cableado ══ */

interface Applier {
  /** Lee la lista de entidades del store. */
  readonly read: () => Entity[];
  /** Escribe la lista completa de vuelta. */
  readonly write: (list: Entity[]) => void;
}

/**
 * Colecciones que son UNA sola entidad, no una lista: el perfil y los ajustes.
 *
 * No tienen `id` propio porque no hace falta: hay uno por persona. Se les da un
 * identificador fijo para que los dos dispositivos hablen de la misma entidad.
 *
 * Y se fusionan POR CAMPO, no por entidad: cambiar las unidades en el telefono
 * y el objetivo en el ordenador tiene que conservar las dos cosas. Con fusion
 * por entidad ganaria el ultimo y el otro cambio se perderia. Esa regla ya vive
 * en `conflict.ts`; aqui solo se conecta.
 */
interface SingletonApplier {
  readonly entityId: string;
  readonly read: () => Record<string, unknown>;
  readonly write: (fields: Record<string, unknown>) => void;
}

/**
 * Que campos del perfil y de los ajustes viajan.
 *
 * Se declaran uno a uno a proposito. `devMode` no viaja —es una decision de
 * este aparato— y tampoco los recordatorios, que dependen de los permisos de
 * notificacion de cada dispositivo. Una lista explicita obliga a decidir cada
 * campo nuevo en vez de sincronizarlo por inercia.
 */
const SETTINGS_FIELDS = [
  'weightUnit', 'lengthUnit', 'locale', 'competitionMode', 'division',
  'experience', 'trainingDaysPerWeek', 'discomforts', 'avoidedExercises',
  'excludedFoods', 'stepGoal', 'waterGoalMl', 'acknowledgedDisclaimer',
] as const;

const SINGLETONS: Partial<Record<SyncCollectionKey, SingletonApplier>> = {
  profile: {
    entityId: 'perfil',
    read: () => ({ ...useProfileStore.getState().profile }) as Record<string, unknown>,
    write: (fields) => useProfileStore.setState((s) => ({ profile: { ...s.profile, ...fields } as never })),
  },
  settings: {
    entityId: 'ajustes',
    read: () => {
      const state = useSettingsStore.getState() as unknown as Record<string, unknown>;
      return Object.fromEntries(SETTINGS_FIELDS.map((k) => [k, state[k]]));
    },
    write: (fields) => useSettingsStore.setState(fields as never),
  },
};

/**
 * Que store guarda cada coleccion.
 *
 * Tiene que cubrir EXACTAMENTE las mismas colecciones que emite
 * `store/syncRecorder.ts`. Emitir sin aplicar es mandar datos que el otro
 * dispositivo nunca vera; aplicar sin emitir es esperar algo que no llega. Las
 * dos mitades se comprueban juntas en la prueba de dominio.
 */
const APPLIERS: Partial<Record<SyncCollectionKey, Applier>> = {
  nutrition: {
    read: () => useNutritionStore.getState().entries,
    write: (entries) => useNutritionStore.setState({ entries } as never),
  },
  training: {
    read: () => useTrainingStore.getState().workouts,
    write: (workouts) => useTrainingStore.setState({ workouts } as never),
  },
  body: {
    read: () => useBodyStore.getState().measurements,
    write: (measurements) => useBodyStore.setState({ measurements } as never),
  },
  checkins: {
    read: () => useCheckinStore.getState().checkins,
    write: (checkins) => useCheckinStore.setState({ checkins } as never),
  },
  photos: {
    read: () => usePhotoStore.getState().photos,
    write: (photos) => usePhotoStore.setState({ photos } as never),
  },
};

/** Las colecciones que este dispositivo sabe aplicar. Para las pruebas. */
export const APPLIED_COLLECTIONS = [
  ...Object.keys(APPLIERS),
  ...Object.keys(SINGLETONS),
] as SyncCollectionKey[];

/* ═══════════════════════════════════════════════════════════ aplicacion ══ */

export interface ApplyReport {
  /** Entidades que cambiaron de verdad. */
  readonly changed: number;
  /** Operaciones ignoradas por ser mas antiguas que lo que ya habia. */
  readonly ignored: number;
  /** Operaciones de colecciones que este cliente todavia no sabe aplicar. */
  readonly unsupported: number;
}

/**
 * Aplica un lote de operaciones remotas.
 *
 * Se ordena por HLC antes de nada: es lo que hace que el resultado no dependa
 * del orden en que el servidor las devolvio.
 */
export async function applyRemoteOperations(
  ops: readonly SyncOperation[],
): Promise<ApplyReport> {
  if (ops.length === 0) return { changed: 0, ignored: 0, unsupported: 0 };

  const clocks = await loadClocks();
  const dirty = new Map<string, EntityClock>();
  /* Se acumulan los cambios por coleccion y se escribe UNA vez al final: un
   * `setState` por operacion repintaria la interfaz cien veces seguidas. */
  const pending = new Map<SyncCollectionKey, Map<string, Entity>>();

  let changed = 0;
  let ignored = 0;
  let unsupported = 0;

  for (const op of sortOperations(ops)) {
    const singleton = SINGLETONS[op.collection];
    if (singleton) {
      const key = clockKey(op.collection, op.entityId);
      const current = toEntityState(op.collection, op.entityId, singleton.read(), clocks.get(key));
      const result = applyOperation(current, op);
      clocks.set(key, fromEntityState(result.next));
      dirty.set(key, fromEntityState(result.next));
      if (result.changed) {
        singleton.write(result.next.fields as Record<string, unknown>);
        changed++;
      } else {
        ignored++;
      }
      continue;
    }

    const applier = APPLIERS[op.collection];
    if (!applier) {
      unsupported++;
      continue;
    }

    let bucket = pending.get(op.collection);
    if (!bucket) {
      bucket = new Map(applier.read().map((e) => [e.id, e]));
      pending.set(op.collection, bucket);
    }

    const key = clockKey(op.collection, op.entityId);
    const local = bucket.get(op.entityId);
    const current = toEntityState(
      op.collection,
      op.entityId,
      local ? (local as unknown as Record<string, unknown>) : null,
      clocks.get(key),
    );

    const result = applyOperation(current, op);
    clocks.set(key, fromEntityState(result.next));
    dirty.set(key, fromEntityState(result.next));

    if (!result.changed) {
      ignored++;
      continue;
    }

    /*
     * `id` y `createdAt` se conservan de lo que ya habia: el payload los trae,
     * pero si por lo que sea vinieran distintos, cambiar el `id` de una entidad
     * ya guardada la duplicaria en vez de actualizarla.
     */
    bucket.set(op.entityId, {
      ...(local ?? {}),
      ...(result.next.fields as Record<string, unknown>),
      id: op.entityId,
      deletedAt: result.next.deletedAt,
    } as Entity);
    changed++;
  }

  for (const [collection, bucket] of pending) {
    APPLIERS[collection]?.write([...bucket.values()]);
  }
  await saveClocks(dirty);

  return { changed, ignored, unsupported };
}

/**
 * Anota el reloj de una operacion que ACABAMOS de emitir.
 *
 * Sin esto, cuando esa misma operacion vuelva en el pull, el dispositivo la
 * veria como nueva —no tiene reloj guardado— y la aplicaria otra vez. No
 * corrompe nada, porque aplicarla es idempotente, pero cuenta como cambio y
 * hace repintar la pantalla sin motivo.
 */
export async function rememberLocalOperation(op: SyncOperation): Promise<void> {
  if (!APPLIERS[op.collection] && !SINGLETONS[op.collection]) return;
  const clocks = await loadClocks();
  const key = clockKey(op.collection, op.entityId);
  const current = toEntityState(op.collection, op.entityId, null, clocks.get(key));
  const result = applyOperation(current, op);
  await saveClocks(new Map([[key, fromEntityState(result.next)]]));
}
