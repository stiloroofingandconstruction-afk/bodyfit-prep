/**
 * Outbox: la maquina de estados. Pura.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA PROMESA
 *
 * Cuando la persona toca "guardar", el cambio se aplica en local YA y la
 * interfaz responde. La operacion se encola y se enviara cuando se pueda: hoy,
 * dentro de tres dias, o cuando vuelva de la montana. La interfaz **nunca**
 * espera al servidor.
 *
 * A cambio, esta cola tiene una obligacion absoluta: NADA se descarta en
 * silencio. `dead-letter` es un cajon visible con el motivo escrito, no una
 * papelera. No existe ninguna ruta de codigo que borre una entrada que no haya
 * sido confirmada por el servidor.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Aqui vive solo la decision: dado un estado y un suceso, cual es el estado
 * siguiente. La persistencia y la red viven en `src/services/sync/`.
 */
import type { SyncOperation } from './operations';

export type OutboxState = 'pending' | 'sending' | 'acknowledged' | 'failed' | 'dead-letter';

export interface OutboxEntry {
  readonly operation: SyncOperation;
  readonly state: OutboxState;
  /** Intentos de envio consumidos. */
  readonly attempts: number;
  /** Momento (ms de epoca) a partir del cual se puede reintentar. */
  readonly nextAttemptAt: number;
  /** Por que fallo la ultima vez. Se conserva para el diagnostico. */
  readonly lastError: string | null;
  /** Cuando se confirmo. Se poda a los 7 dias. */
  readonly acknowledgedAt: number | null;
}

/* ══════════════════════════════════════════════════════════════ limites ══ */

/** Doce intentos son unos 50 minutos de reintentos antes de rendirse. */
export const MAX_ATTEMPTS = 12;
export const BASE_BACKOFF_MS = 1_000;
export const MAX_BACKOFF_MS = 5 * 60_000;
/** Aviso, no tope: por encima de esto la app lo dice, pero no descarta nada. */
export const OUTBOX_WARN_SIZE = 10_000;
/** Las confirmadas se podan a los siete dias. */
export const ACK_RETENTION_MS = 7 * 24 * 60 * 60_000;

/**
 * Espera antes del intento numero `attempts`, con dispersion.
 *
 * El `jitter` no es adorno: sin el, veinte dispositivos que vuelven del mismo
 * corte de red golpean el servidor en el mismo instante y se turnan para
 * fallar. La dispersion la aporta quien llama (`random` en [0,1)) para que la
 * funcion siga siendo pura y las pruebas reproducibles.
 */
export function backoffMs(attempts: number, random = 0.5): number {
  const exponential = Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
  const jitter = 0.8 + random * 0.4; // ±20 %
  return Math.round(exponential * jitter);
}

/* ═══════════════════════════════════════════════════════════ transiciones ══ */

export function enqueue(operation: SyncOperation): OutboxEntry {
  return {
    operation,
    state: 'pending',
    attempts: 0,
    nextAttemptAt: 0,
    lastError: null,
    acknowledgedAt: null,
  };
}

/**
 * Una operacion que no valida entra directamente en `dead-letter`.
 *
 * Con el motivo escrito. No se envia, porque el servidor la rechazaria igual, y
 * no se tira, porque puede contener el unico registro de algo que la persona
 * hizo.
 */
export function rejectInvalid(operation: SyncOperation, reason: string): OutboxEntry {
  return {
    operation,
    state: 'dead-letter',
    attempts: 0,
    nextAttemptAt: 0,
    lastError: reason,
    acknowledgedAt: null,
  };
}

export function markSending(entry: OutboxEntry): OutboxEntry {
  return { ...entry, state: 'sending', attempts: entry.attempts + 1 };
}

/**
 * El servidor la acepto — o dijo que ya la tenia, que a estos efectos es lo
 * mismo. `duplicate` no es un error: es la idempotencia funcionando.
 */
export function markAcknowledged(entry: OutboxEntry, nowMs: number): OutboxEntry {
  return { ...entry, state: 'acknowledged', lastError: null, acknowledgedAt: nowMs };
}

/**
 * Fallo recuperable: sin red, 5xx, timeout. Vuelve a la cola con espera.
 *
 * Al agotar los intentos pasa a `dead-letter`, que **no** es un borrado: la
 * operacion sigue ahi, visible y reintentable a mano.
 */
export function markFailed(
  entry: OutboxEntry,
  error: string,
  nowMs: number,
  random = 0.5,
): OutboxEntry {
  if (entry.attempts >= MAX_ATTEMPTS) {
    return { ...entry, state: 'dead-letter', lastError: error };
  }
  return {
    ...entry,
    state: 'failed',
    lastError: error,
    nextAttemptAt: nowMs + backoffMs(entry.attempts, random),
  };
}

/** Rechazo definitivo del servidor: un 4xx no se arregla reintentando. */
export function markRejected(entry: OutboxEntry, reason: string): OutboxEntry {
  return { ...entry, state: 'dead-letter', lastError: reason };
}

/** Reintento manual desde el diagnostico. Reinicia la cuenta de intentos. */
export function retryManually(entry: OutboxEntry): OutboxEntry {
  return { ...entry, state: 'pending', attempts: 0, nextAttemptAt: 0 };
}

/**
 * Recuperacion al arrancar la aplicacion.
 *
 * Lo que quedo en `sending` estaba en vuelo cuando la app murio: no se sabe si
 * llego. Se devuelve a `pending` y se reenvia, porque por idempotencia reenviar
 * algo que ya llego no cuesta nada, y **no** reenviar algo que no llego cuesta
 * un dato.
 */
export function recoverOnStart(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return entries.map((entry) =>
    entry.state === 'sending' ? { ...entry, state: 'pending', nextAttemptAt: 0 } : entry,
  );
}

/* ══════════════════════════════════════════════════════════════ consulta ══ */

/** Lo que toca enviar ahora: pendientes, y fallidas cuya espera ya vencio. */
export function readyToSend(entries: readonly OutboxEntry[], nowMs: number): OutboxEntry[] {
  return entries.filter(
    (e) =>
      (e.state === 'pending' && e.nextAttemptAt <= nowMs) ||
      (e.state === 'failed' && e.nextAttemptAt <= nowMs),
  );
}

/**
 * Poda las confirmadas antiguas. **Solo** las confirmadas.
 *
 * Es la unica funcion de todo el subsistema que elimina entradas, y por eso
 * comprueba las dos condiciones por separado: que esten en `acknowledged` y que
 * tengan marca de confirmacion. Nada en `dead-letter` se poda jamas.
 */
export function prune(
  entries: readonly OutboxEntry[],
  nowMs: number,
  retentionMs = ACK_RETENTION_MS,
): OutboxEntry[] {
  return entries.filter((e) => {
    if (e.state !== 'acknowledged') return true;
    if (e.acknowledgedAt === null) return true;
    return nowMs - e.acknowledgedAt < retentionMs;
  });
}

export interface OutboxSummary {
  readonly pending: number;
  readonly sending: number;
  readonly failed: number;
  readonly deadLetter: number;
  readonly acknowledged: number;
  readonly total: number;
  readonly overWarnSize: boolean;
}

export function summarize(entries: readonly OutboxEntry[]): OutboxSummary {
  const count = (state: OutboxState) => entries.filter((e) => e.state === state).length;
  const unconfirmed = entries.filter((e) => e.state !== 'acknowledged').length;
  return {
    pending: count('pending'),
    sending: count('sending'),
    failed: count('failed'),
    deadLetter: count('dead-letter'),
    acknowledged: count('acknowledged'),
    total: entries.length,
    overWarnSize: unconfirmed > OUTBOX_WARN_SIZE,
  };
}
