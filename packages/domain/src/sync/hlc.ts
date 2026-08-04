/**
 * Reloj logico hibrido (HLC).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE NO BASTA CON LA HORA DEL TELEFONO
 *
 * Ordenar cambios por `updatedAt` parece obvio y esta mal. Los relojes de los
 * telefonos mienten: zonas horarias mal puestas, arranques antes de hablar con
 * NTP, gente que cambia la fecha a mano. Un telefono con la fecha adelantada un
 * ano GANA TODOS LOS CONFLICTOS PARA SIEMPRE, y la persona ve desaparecer sus
 * cambios sin ninguna explicacion posible.
 *
 * Un HLC es (hora fisica, contador, dispositivo). Garantiza que si A causo B
 * entonces hlc(A) < hlc(B), sin exigir que los relojes coincidan, y da un orden
 * TOTAL y determinista: el mismo conjunto de operaciones produce el mismo
 * resultado en cualquier dispositivo y en cualquier orden de llegada.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Logica pura: no lee la hora ni escribe en ningun sitio. Quien lo usa le pasa
 * `nowMs` y guarda el resultado. Asi es reproducible al bit en las pruebas y
 * puede ejecutarse igual en el navegador que en una Edge Function.
 */

export interface Hlc {
  /** Milisegundos de epoca. Solo avanza, nunca retrocede. */
  readonly wallMs: number;
  /** Desempata eventos dentro del mismo milisegundo. */
  readonly counter: number;
  /** Desempata entre dispositivos. Ultimo criterio, siempre determinista. */
  readonly deviceId: string;
}

/**
 * Un reloj remoto mas de cinco minutos por delante del nuestro es sospechoso.
 *
 * No se rechaza la operacion —perder datos jamas es la opcion— pero su hora no
 * contamina nuestro reloj. Si la aceptaramos, un solo dispositivo con la fecha
 * rota arrastraria a todos los demas anos hacia el futuro, y no habria forma
 * de volver.
 */
export const MAX_DRIFT_MS = 5 * 60_000;

/** 18 digitos cubren hasta el ano 33.658. De sobra. */
const WALL_DIGITS = 18;
/** 100.000 eventos en el mismo milisegundo. Muy por encima de lo alcanzable. */
const COUNTER_DIGITS = 5;
const MAX_COUNTER = 99_999;

/**
 * Serializa a una cadena que ordena lexicograficamente igual que causalmente.
 *
 *     000001754923011234-00042-9f3c1e8a-...
 *     └──── wallMs ────┘ └cnt┘ └─ deviceId ─┘
 *
 * Que la comparacion sea de cadenas no es un detalle: el indice de Postgres,
 * el `order by` y el comparador de JavaScript ordenan igual sin una linea de
 * codigo extra, y sin posibilidad de que las tres versiones diverjan.
 */
export function formatHlc(hlc: Hlc): string {
  const wall = String(hlc.wallMs).padStart(WALL_DIGITS, '0');
  const counter = String(hlc.counter).padStart(COUNTER_DIGITS, '0');
  return `${wall}-${counter}-${hlc.deviceId}`;
}

/** Devuelve `null` si la cadena no es un HLC. No lanza: quien lee decide. */
export function parseHlc(raw: string): Hlc | null {
  if (typeof raw !== 'string') return null;
  const wallText = raw.slice(0, WALL_DIGITS);
  const counterText = raw.slice(WALL_DIGITS + 1, WALL_DIGITS + 1 + COUNTER_DIGITS);
  const deviceId = raw.slice(WALL_DIGITS + COUNTER_DIGITS + 2);

  if (raw[WALL_DIGITS] !== '-' || raw[WALL_DIGITS + COUNTER_DIGITS + 1] !== '-') return null;
  if (!/^\d+$/.test(wallText) || !/^\d+$/.test(counterText) || deviceId.length === 0) return null;

  const wallMs = Number(wallText);
  const counter = Number(counterText);
  if (!Number.isSafeInteger(wallMs) || !Number.isSafeInteger(counter)) return null;

  return { wallMs, counter, deviceId };
}

/**
 * Orden total entre dos HLC ya serializados.
 *
 * Negativo si `a` va antes, positivo si va despues, cero solo si son el mismo
 * evento del mismo dispositivo.
 */
export function compareHlc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** El HLC inicial de un dispositivo que nunca ha emitido nada. */
export function hlcZero(deviceId: string): Hlc {
  return { wallMs: 0, counter: 0, deviceId };
}

/**
 * Avanza el reloj para un evento propio: crear una operacion.
 *
 * `wallMs` toma el maximo con la hora actual, asi que **nunca retrocede**. Si
 * la persona atrasa la fecha del telefono el reloj se queda quieto y el
 * contador se encarga del orden hasta que la hora de pared lo alcanza. Es la
 * razon de que atrasar el reloj no rompa nada.
 */
export function localEvent(prev: Hlc, nowMs: number): Hlc {
  const wallMs = Math.max(prev.wallMs, nowMs);

  if (wallMs !== prev.wallMs) return { wallMs, counter: 0, deviceId: prev.deviceId };

  const counter = prev.counter + 1;
  /*
   * Desbordamiento del contador: en vez de reiniciarlo —que romperia el orden—
   * se empuja el milisegundo. Hace falta emitir 100.000 operaciones dentro del
   * mismo milisegundo para llegar aqui; existe porque "inalcanzable" no es
   * "imposible".
   */
  if (counter > MAX_COUNTER) return { wallMs: wallMs + 1, counter: 0, deviceId: prev.deviceId };

  return { wallMs, counter, deviceId: prev.deviceId };
}

export interface RemoteAdvance {
  readonly next: Hlc;
  /**
   * El reloj remoto va tan adelantado que no es creible. La operacion se
   * acepta igual; lo que no se hace es adoptar su hora.
   */
  readonly clockSuspect: boolean;
}

/**
 * Avanza el reloj al recibir una operacion remota.
 *
 * Adoptar la hora del otro es lo que propaga la causalidad: si su operacion
 * ocurrio despues, todo lo que emitamos a partir de ahora quedara despues de
 * la suya aunque nuestro reloj fisico vaya por detras.
 */
export function remoteEvent(prev: Hlc, remote: Hlc, nowMs: number): RemoteAdvance {
  const clockSuspect = remote.wallMs - nowMs > MAX_DRIFT_MS;

  /*
   * Un reloj remoto imposible se ignora para avanzar el nuestro. La operacion
   * ya se aplicara: lo que se rechaza es contagiarse de su hora.
   */
  const remoteWall = clockSuspect ? Number.NEGATIVE_INFINITY : remote.wallMs;
  const wallMs = Math.max(prev.wallMs, remoteWall, nowMs);

  let counter: number;
  if (wallMs === prev.wallMs && wallMs === remoteWall) {
    counter = Math.max(prev.counter, remote.counter) + 1;
  } else if (wallMs === prev.wallMs) {
    counter = prev.counter + 1;
  } else if (wallMs === remoteWall) {
    counter = remote.counter + 1;
  } else {
    counter = 0;
  }

  if (counter > MAX_COUNTER) {
    return { next: { wallMs: wallMs + 1, counter: 0, deviceId: prev.deviceId }, clockSuspect };
  }

  return { next: { wallMs, counter, deviceId: prev.deviceId }, clockSuspect };
}

/**
 * El mayor de dos HLC serializados. Es la operacion que decide un conflicto.
 */
export function maxHlc(a: string, b: string): string {
  return compareHlc(a, b) >= 0 ? a : b;
}
