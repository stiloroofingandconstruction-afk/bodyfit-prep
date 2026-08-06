/**
 * Motor de sincronizacion.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LO QUE PROMETE
 *
 *   1. La interfaz nunca espera al servidor.
 *   2. Ninguna operacion se descarta en silencio, jamas.
 *   3. Lo peor que puede pasar ante un error es releer de mas.
 *
 * Las tres son consecuencia de lo mismo: el cambio se aplica en el store local
 * ANTES de encolarse, y la cola es duradera. Si el servidor no existe, si esta
 * caido o si el telefono lleva tres dias sin cobertura, la aplicacion funciona
 * igual y la cola espera.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  createOperation,
  validateOperation,
  batchOperations,
  MAX_PULL_OPERATIONS,
  type OperationType,
  type SyncCollectionKey,
  type SyncOperation,
} from '@bodyfit/domain/sync/operations';
import {
  enqueue,
  markAcknowledged,
  markFailed,
  markRejected,
  markSending,
  prune,
  readyToSend,
  recoverOnStart,
  rejectInvalid,
  summarize,
  type OutboxEntry,
  type OutboxSummary,
} from '@bodyfit/domain/sync/outbox';
import { APP_SCHEMA_VERSION } from '@bodyfit/domain/versioning';
import { deviceId, observe, tick } from './identity';
import { allEntries, putEntries, putEntry, removeEntries } from './outboxStore';
import { validateCursor, type HealthStatus, type SyncAdapter } from './adapters/types';
import { localOnlyAdapter } from './adapters/localOnly';
import { syncEnabled } from './flag';
import { APP_VERSION } from '@/services/backup';

/* ══════════════════════════════════════════════════════════════ estado ══ */

export interface SyncStatus {
  readonly adapter: string;
  readonly enabled: boolean;
  readonly online: boolean;
  readonly lastSyncAt: number | null;
  readonly lastError: string | null;
  readonly cursor: string;
  readonly deviceId: string;
  readonly schemaVersion: number;
  readonly outbox: OutboxSummary;
  /** Algun dispositivo remoto tiene el reloj disparatado. */
  readonly clockSuspect: boolean;
}

let adapter: SyncAdapter = localOnlyAdapter;
let entries: OutboxEntry[] = [];
let loaded = false;
let running = false;
let lastSyncAt: number | null = null;
let lastError: string | null = null;
let cursor = '0';
let clockSuspect = false;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeToSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdapter(next: SyncAdapter): void {
  adapter = next;
}

export function syncStatus(): SyncStatus {
  return {
    adapter: adapter.name,
    enabled: syncEnabled(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    lastSyncAt,
    lastError,
    cursor,
    deviceId: deviceId(),
    schemaVersion: APP_SCHEMA_VERSION,
    outbox: summarize(entries),
    clockSuspect,
  };
}

/* ═══════════════════════════════════════════════════════════ arranque ══ */

/**
 * Carga la cola y recupera lo que quedo a medias.
 *
 * No envia nada: la sincronizacion no compite con el primer pintado. Quien
 * quiera empujar llama a `flush()` despues, cuando la aplicacion ya responde.
 */
export async function initSync(): Promise<void> {
  if (loaded) return;
  loaded = true;

  try {
    entries = recoverOnStart(await allEntries());
    await putEntries(entries);
  } catch (err) {
    // Una cola ilegible no impide usar la aplicacion.
    lastError = `no se pudo leer la cola: ${String(err)}`;
    entries = [];
  }

  try {
    cursor = validateCursor(await adapter.getCursor()) ?? '0';
  } catch {
    cursor = '0';
  }

  void announceDevice();
  notify();
}

/**
 * Da de alta este dispositivo en el servidor.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Estuvo sin llamarse nunca.
 *
 * El metodo estaba en el contrato, la funcion SQL existia y la auditoria del
 * adaptador la probaba con exito. Lo que faltaba era que la aplicacion la
 * invocara: se descubrio mirando el servidor despues de un inicio de sesion de
 * verdad, con la tabla `devices` vacia.
 *
 * Una auditoria que prueba un metodo no prueba que alguien lo use. Son cosas
 * distintas y esta se coló entre las dos.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No bloquea nada: si falla, la sincronizacion funciona igual —`sync_push` crea
 * lo que necesita— y solo se pierde el registro de que este aparato existe. Por
 * eso no se reintenta ni se propaga el error.
 */
async function announceDevice(): Promise<void> {
  if (!syncEnabled()) return;
  try {
    await adapter.registerDevice({
      deviceId: deviceId(),
      label: deviceLabel(),
      platform: typeof navigator === 'undefined' ? 'desconocida' : navigator.platform,
      clientVersion: APP_VERSION,
    });
  } catch (err) {
    console.warn('[sync] no se pudo registrar el dispositivo', err);
  }
}

/**
 * Un nombre reconocible para la lista de dispositivos.
 *
 * Del `userAgent`, no del modelo: Safari en iOS no dice si es un iPhone 12 o un
 * 15, y fingir precision que no se tiene es peor que decir "iPhone".
 */
function deviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo';
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Dispositivo';
}

/* ═══════════════════════════════════════════════════════════ encolado ══ */

export interface RecordInput {
  readonly collection: SyncCollectionKey;
  readonly entityId: string;
  readonly operationType: OperationType;
  readonly payload?: Record<string, unknown>;
  readonly userId?: string | null;
}

/**
 * Registra un cambio.
 *
 * **Se llama DESPUES de haber aplicado el cambio en local, nunca antes.** Si se
 * llamara antes y fallara el encolado, la interfaz mostraria un cambio que no
 * ocurrio. Al reves, lo peor que pasa es que el cambio existe aqui y tarda en
 * viajar, que es exactamente el comportamiento que se busca.
 */
export async function recordChange(input: RecordInput): Promise<void> {
  const operation = createOperation({
    operationId: crypto.randomUUID(),
    userId: input.userId ?? null,
    deviceId: deviceId(),
    collection: input.collection,
    entityId: input.entityId,
    operationType: input.operationType,
    payload: input.operationType === 'upsert' ? (input.payload ?? {}) : {},
    hlc: tick(),
    createdAt: new Date().toISOString(),
    schemaVersion: APP_SCHEMA_VERSION,
    clientVersion: APP_VERSION,
  });

  const problems = validateOperation(operation);
  /*
   * Una operacion invalida se guarda igual, en dead-letter y con el motivo.
   *
   * Tirarla seria perder el unico rastro de algo que la persona hizo. Guardarla
   * cuesta unos bytes y permite entender que paso y, si el fallo era del codigo
   * y se arregla, reintentarla.
   */
  const entry =
    problems.length > 0 ? rejectInvalid(operation, problems.join(' · ')) : enqueue(operation);

  entries = [...entries, entry];
  await putEntry(entry);
  notify();
}

/* ══════════════════════════════════════════════════════════════ envio ══ */

/**
 * Vacia la cola contra el servidor.
 *
 * Reentrante: si ya hay un ciclo en marcha, sale. No hay dos empujes a la vez
 * sobre la misma cola.
 */
export async function flush(nowMs: number = Date.now()): Promise<void> {
  if (running) return;
  if (!loaded) await initSync();
  running = true;

  try {
    const pendientes = readyToSend(entries, nowMs).map((e) => e.operation);
    for (const batch of batchOperations(pendientes)) {
      await sendBatch(batch, nowMs);
    }
    lastSyncAt = nowMs;
    lastError = null;
  } catch (err) {
    lastError = String(err);
  } finally {
    running = false;
    await pruneAcknowledged(nowMs);
    notify();
  }
}

async function sendBatch(batch: readonly SyncOperation[], nowMs: number): Promise<void> {
  const ids = new Set(batch.map((op) => op.operationId));
  entries = entries.map((e) => (ids.has(e.operation.operationId) ? markSending(e) : e));
  await putEntries(entries.filter((e) => ids.has(e.operation.operationId)));

  let results;
  try {
    ({ results } = await adapter.pushOperations(batch));
  } catch (err) {
    /*
     * Fallo de transporte: sin red, timeout, 5xx. Todo el lote vuelve a la cola
     * con espera. No se pierde nada y no se duplica nada, porque el servidor
     * descarta por `operationId` lo que ya tuviera.
     */
    const reason = String(err);
    entries = entries.map((e) =>
      ids.has(e.operation.operationId) ? markFailed(e, reason, nowMs, Math.random()) : e,
    );
    await putEntries(entries.filter((e) => ids.has(e.operation.operationId)));
    throw err;
  }

  /*
   * Ack POR OPERACION.
   *
   * Una respuesta parcial —el servidor proceso 60 de 100 y se cayo— deja 60
   * confirmadas y 40 en la cola. Las que no aparecen en la respuesta no se
   * tocan: siguen pendientes y se reintentaran.
   */
  const byId = new Map(results.map((r) => [r.operationId, r]));
  const confirmadas: string[] = [];

  entries = entries.map((e) => {
    const result = byId.get(e.operation.operationId);
    if (!result) return e;
    if (result.status === 'rejected') {
      return markRejected(e, result.reason ?? 'rechazada por el servidor');
    }
    confirmadas.push(e.operation.operationId);
    return markAcknowledged(e, nowMs);
  });

  await putEntries(entries.filter((e) => ids.has(e.operation.operationId)));
  if (confirmadas.length > 0) await adapter.acknowledgeOperations(confirmadas);
}

/**
 * Poda las confirmadas antiguas.
 *
 * La unica via de borrado del subsistema. `prune` decide, y solo devuelve
 * confirmadas con marca de tiempo cumplida: nada en `dead-letter` sale nunca de
 * la cola por aqui.
 */
async function pruneAcknowledged(nowMs: number): Promise<void> {
  const kept = prune(entries, nowMs);
  if (kept.length === entries.length) return;

  const keptIds = new Set(kept.map((e) => e.operation.operationId));
  const removed = entries
    .filter((e) => !keptIds.has(e.operation.operationId))
    .map((e) => e.operation.operationId);

  entries = kept;
  await removeEntries(removed);
}

/* ══════════════════════════════════════════════════════════════ lectura ══ */

export interface PullOutcome {
  readonly received: number;
  readonly applied: number;
  readonly skipped: number;
}

/**
 * Trae lo que hicieron los demas dispositivos.
 *
 * `apply` recibe las operaciones ya ordenadas por HLC y las aplica sobre los
 * stores. El motor no sabe como se guarda un entrenamiento: eso es de quien
 * llama.
 */
export async function pull(
  apply: (ops: readonly SyncOperation[]) => Promise<number>,
  nowMs: number = Date.now(),
): Promise<PullOutcome> {
  if (!loaded) await initSync();

  let received = 0;
  let applied = 0;
  let skipped = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await adapter.pullOperations(cursor, MAX_PULL_OPERATIONS);
    received += page.operations.length;

    /*
     * Una operacion invalida en el pull NO bloquea la cola.
     *
     * Se registra, se salta y se avanza el cursor. Bloquear dejaria al
     * dispositivo congelado para siempre sin forma de salir por su cuenta.
     */
    const validas: SyncOperation[] = [];
    for (const op of page.operations) {
      if (validateOperation(op).length > 0) {
        skipped++;
        continue;
      }
      if (observe(op.hlc, nowMs)) clockSuspect = true;
      validas.push(op);
    }

    if (validas.length > 0) applied += await apply(validas);

    const next = validateCursor(page.cursor);
    if (next === null) {
      /*
       * Cursor ilegible: se reinicia y se relee todo. Es lento y es seguro,
       * porque aplicar dos veces la misma operacion da el mismo estado.
       */
      cursor = '0';
      lastError = 'cursor invalido: se releera desde el principio';
      break;
    }
    cursor = next;
    await adapter.setCursor(cursor);
    hasMore = page.hasMore;
  }

  lastSyncAt = nowMs;
  notify();
  return { received, applied, skipped };
}

/**
 * Pregunta al servidor si esta vivo y que esquema entiende.
 *
 * Lo usa el diagnostico. Sin esto, la pantalla ensena la version del CLIENTE y
 * deja creer que es la del servidor: cuando las dos difieren —que es justo el
 * caso que rompe una sincronizacion— no habria forma de verlo.
 */
export async function checkServer(): Promise<HealthStatus> {
  try {
    return await adapter.healthCheck();
  } catch (err) {
    return { reachable: false, serverSchema: null, detail: String(err) };
  }
}

/* ══════════════════════════════════════════════════════════ diagnostico ══ */

/** La cola entera, para la pantalla de modo desarrollador. */
export function outboxEntries(): readonly OutboxEntry[] {
  return entries;
}

/** Reintenta a mano una operacion que quedo en dead-letter. */
export async function retryDeadLetter(operationId: string): Promise<void> {
  entries = entries.map((e) =>
    e.operation.operationId === operationId && e.state === 'dead-letter'
      ? { ...e, state: 'pending' as const, attempts: 0, nextAttemptAt: 0 }
      : e,
  );
  await putEntries(entries.filter((e) => e.operation.operationId === operationId));
  notify();
}

/** Solo para pruebas: olvida todo lo cargado en memoria. */
export function resetEngine(): void {
  entries = [];
  loaded = false;
  running = false;
  lastSyncAt = null;
  lastError = null;
  cursor = '0';
  clockSuspect = false;
  adapter = localOnlyAdapter;
}
