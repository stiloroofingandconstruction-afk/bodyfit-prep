/**
 * Resolucion de conflictos. Determinista, sin excepciones.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL ORDEN DE PREFERENCIA
 *
 *   1. Gana el HLC mayor.
 *   2. Si empatan, gana el deviceId mayor.
 *   3. Un borrado gana SOLO si su HLC es mayor. No tiene privilegio.
 *   4. Restaurar es un acto explicito.
 *   5. La fusion es por entidad, jamas por coleccion completa.
 *   6. Borrar y editar no compiten: cada uno tiene su propio reloj.
 *
 * El punto 2 es arbitrario y tiene que serlo: lo unico que importa es que sea
 * el MISMO criterio en todos los dispositivos. Un empate exacto de HLC entre
 * dos dispositivos distintos exige el mismo milisegundo y el mismo contador;
 * es practicamente imposible, y la regla existe porque "practicamente
 * imposible" no es "imposible" y sin ella el sistema dejaria de ser
 * determinista.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Todas las funciones de aqui son puras: entra un estado y una operacion, sale
 * un estado nuevo. Eso permite probar la convergencia barajando operaciones sin
 * levantar nada.
 */
import { compareHlc } from './hlc';
import type { SyncCollectionKey, SyncOperation } from './operations';

/* ══════════════════════════════════════════════════════════ estrategias ══ */

export type MergeStrategy = 'entity-lww' | 'field-lww';

/**
 * Fusion por campo solo donde el usuario edita campos distintos desde
 * dispositivos distintos con normalidad: cambiar las unidades en el telefono y
 * el objetivo en la tablet debe conservar las dos cosas.
 *
 * En el resto la fusion es por entidad. Mantener un HLC por campo en las tablas
 * grandes multiplicaria el almacenamiento para resolver un caso que no ocurre:
 * dos dispositivos editando el mismo peso de la misma serie en el mismo minuto.
 */
const FIELD_MERGE: ReadonlySet<string> = new Set<SyncCollectionKey>(['profile', 'settings']);

export function strategyFor(collection: SyncCollectionKey): MergeStrategy {
  return FIELD_MERGE.has(collection) ? 'field-lww' : 'entity-lww';
}

/* ═══════════════════════════════════════════════════════════════ estado ══ */

/**
 * Estado de una entidad.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE HAY TRES RELOJES Y NO UNO
 *
 * La primera version guardaba un solo `hlc` por entidad y comparaba contra el
 * cualquier operacion. La simulacion de catorce dias encontro el fallo:
 *
 *   El dispositivo B estuvo sin red mientras A registraba una comida. Al
 *   volver, B borro esa comida (la habia visto en otro sitio) y su borrado
 *   llego al servidor ANTES que la creacion de A. B se creo un tombstone con
 *   el HLC del borrado; cuando despues le llego la creacion, con HLC menor, la
 *   descarto entera. La comida quedo existiendo pero vacia, para siempre.
 *
 * Borrar y editar son decisiones ORTOGONALES: una decide si la entidad esta
 * viva, la otra que contiene. Hacerlas competir por el mismo reloj hace que la
 * que llega antes anule a la otra. Con relojes separados, cada decision gana o
 * pierde en su propio terreno y el resultado deja de depender del orden.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface EntityState {
  readonly entityId: string;
  readonly collection: SyncCollectionKey;
  /** El mayor HLC visto. Version de la fila, para diagnostico y para el servidor. */
  readonly hlc: string;
  /** Marca de borrado logico. La fila nunca desaparece. */
  readonly deletedAt: string | null;
  readonly fields: Readonly<Record<string, unknown>>;
  /** Ultimo `upsert` que escribio campos. Solo compite con otros `upsert`. */
  readonly fieldsHlc: string;
  /** Ultimo `delete` o `restore`. Solo compiten entre ellos. */
  readonly deleteHlc: string;
  /** Solo en `field-lww`: HLC por campo. */
  readonly fieldHlc?: Readonly<Record<string, string>>;
}

export type ApplyOutcome =
  | 'aplicada'
  | 'ignorada-por-hlc-menor'
  | 'ignorada-sin-efecto'
  | 'tombstone-anticipado';

export interface ApplyResult {
  readonly next: EntityState;
  readonly changed: boolean;
  readonly outcome: ApplyOutcome;
}

/* ══════════════════════════════════════════════════════════════ aplicar ══ */

/**
 * Aplica una operacion sobre el estado de una entidad.
 *
 * `current` a `null` significa que esta entidad no existe todavia aqui. Ojo con
 * el caso raro y real: un `delete` puede llegar ANTES que el `upsert` que creo
 * la entidad, porque el dispositivo que la creo estaba sin red mas tiempo que
 * el que la borro. Se crea entonces un tombstone vacio, y el `upsert` posterior
 * rellenara los campos sin resucitarla. Sin esto, el borrado se perderia.
 */
export function applyOperation(current: EntityState | null, op: SyncOperation): ApplyResult {
  const base = current ?? emptyState(op);
  const seenBefore = current !== null;

  if (op.operationType === 'upsert') {
    const result =
      strategyFor(op.collection) === 'field-lww'
        ? applyFieldMerge(base, op)
        : applyEntityUpsert(base, op);
    /*
     * Un `upsert` NUNCA toca `deletedAt`.
     *
     * Si lo limpiara, una edicion que quedo pendiente en un dispositivo sin red
     * resucitaria algo que la persona borro a proposito en otro. Resucitar es un
     * acto explicito: `restore`.
     */
    return result;
  }

  // `delete` y `restore` compiten solo entre ellos, en su propio reloj.
  if (compareHlc(op.hlc, base.deleteHlc) <= 0) {
    return { next: base, changed: false, outcome: 'ignorada-por-hlc-menor' };
  }

  const deletedAt = op.operationType === 'delete' ? op.createdAt : null;
  const changed = deletedAt !== base.deletedAt;

  return {
    next: {
      ...base,
      hlc: maxOf(base.hlc, op.hlc),
      deleteHlc: op.hlc,
      deletedAt,
    },
    changed,
    outcome: changed
      ? seenBefore
        ? 'aplicada'
        : op.operationType === 'delete'
          ? 'tombstone-anticipado'
          : 'aplicada'
      : 'ignorada-sin-efecto',
  };
}

/** Una entidad que todavia no existe aqui. Sin campos y sin borrar. */
function emptyState(op: SyncOperation): EntityState {
  return {
    entityId: op.entityId,
    collection: op.collection,
    hlc: '',
    deletedAt: null,
    fields: {},
    fieldsHlc: '',
    deleteHlc: '',
    ...(strategyFor(op.collection) === 'field-lww' ? { fieldHlc: {} } : {}),
  };
}

function maxOf(a: string, b: string): string {
  return compareHlc(a, b) >= 0 ? a : b;
}

/**
 * `upsert` con fusion por entidad: gana el ultimo que escribio campos.
 *
 * Se compara contra `fieldsHlc`, no contra el HLC de la entidad. Un borrado
 * posterior no impide que una creacion anterior, que llego tarde, rellene los
 * campos que faltaban.
 */
function applyEntityUpsert(current: EntityState, op: SyncOperation): ApplyResult {
  if (compareHlc(op.hlc, current.fieldsHlc) <= 0) {
    return { next: current, changed: false, outcome: 'ignorada-por-hlc-menor' };
  }
  return {
    next: {
      ...current,
      hlc: maxOf(current.hlc, op.hlc),
      fieldsHlc: op.hlc,
      fields: { ...current.fields, ...op.payload },
    },
    changed: true,
    outcome: 'aplicada',
  };
}


/**
 * Fusion campo a campo.
 *
 * Cada campo lleva su propio HLC. Un campo solo se escribe si la operacion es
 * mas reciente que la ultima que toco ESE campo. Asi cambiar el idioma en un
 * dispositivo y las unidades en otro conserva los dos cambios, aunque el HLC de
 * la entidad completa favorezca a uno.
 */
function applyFieldMerge(current: EntityState, op: SyncOperation): ApplyResult {
  const fieldHlc: Record<string, string> = { ...(current.fieldHlc ?? {}) };
  const fields: Record<string, unknown> = { ...current.fields };
  let changed = false;

  for (const [key, value] of Object.entries(op.payload)) {
    const previous = fieldHlc[key];
    if (previous !== undefined && compareHlc(op.hlc, previous) <= 0) continue;
    fields[key] = value;
    fieldHlc[key] = op.hlc;
    changed = true;
  }

  if (!changed) {
    return { next: current, changed: false, outcome: 'ignorada-por-hlc-menor' };
  }

  return {
    next: {
      ...current,
      hlc: maxOf(current.hlc, op.hlc),
      fieldsHlc: maxOf(current.fieldsHlc, op.hlc),
      fields,
      fieldHlc,
    },
    changed: true,
    outcome: 'aplicada',
  };
}

/* ═════════════════════════════════════════════════════════ convergencia ══ */

/**
 * Aplica un conjunto de operaciones y devuelve el estado final por entidad.
 *
 * **Ordena por HLC antes de aplicar.** Es lo que hace que el resultado no
 * dependa del orden de llegada: mismas operaciones, mismo estado, en cualquier
 * dispositivo. Es la propiedad que se prueba barajando.
 */
export function reduceOperations(
  ops: readonly SyncOperation[],
  initial: ReadonlyMap<string, EntityState> = new Map(),
): Map<string, EntityState> {
  const state = new Map(initial);
  const ordered = [...ops].sort((a, b) => compareHlc(a.hlc, b.hlc));

  for (const op of ordered) {
    const key = `${op.collection}/${op.entityId}`;
    const { next } = applyOperation(state.get(key) ?? null, op);
    state.set(key, next);
  }
  return state;
}

/**
 * Cual de dos operaciones en competencia gana.
 *
 * Se expone aparte de `applyOperation` porque el servidor y el diagnostico
 * necesitan poder preguntarlo sin aplicar nada.
 */
export function winner(a: SyncOperation, b: SyncOperation): SyncOperation {
  return compareHlc(a.hlc, b.hlc) >= 0 ? a : b;
}
