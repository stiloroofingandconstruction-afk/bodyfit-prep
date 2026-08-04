/**
 * Identidad del dispositivo y su reloj logico.
 *
 * Dos cosas que tienen que sobrevivir a cerrar la aplicacion, y que no viajan
 * al servidor porque pertenecen a este dispositivo y solo a el.
 */
import { formatHlc, hlcZero, localEvent, parseHlc, remoteEvent, type Hlc } from '@bodyfit/domain/sync/hlc';
import { STORAGE_PREFIX } from '@bodyfit/domain/collections';

const DEVICE_KEY = `${STORAGE_PREFIX}sync:device`;
const CLOCK_KEY = `${STORAGE_PREFIX}sync:clock`;

/* ═══════════════════════════════════════════════════ id del dispositivo ══ */

let cachedDeviceId: string | null = null;

/**
 * Identificador estable de este dispositivo.
 *
 * **No se sincroniza a proposito.** Si viajara al servidor y volviera a otro
 * dispositivo, dos aparatos compartirian identificador y el desempate de
 * conflictos dejaria de desempatar: dos operaciones distintas podrian producir
 * exactamente el mismo HLC y el sistema perderia el determinismo.
 *
 * Si la persona borra los datos del navegador, cambia. Es correcto: a efectos
 * de sincronizacion es un dispositivo nuevo, y lo que hubiera en su cola se fue
 * con el borrado de todos modos.
 */
export function deviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored && stored.length > 0) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {
    /* Almacenamiento bloqueado (navegacion privada): se sigue con uno efimero. */
  }

  const fresh = crypto.randomUUID();
  try {
    localStorage.setItem(DEVICE_KEY, fresh);
  } catch {
    /* Sin persistencia, el id dura lo que la pestana. Degradado, no roto. */
  }
  cachedDeviceId = fresh;
  return fresh;
}

/* ════════════════════════════════════════════════════════════════ reloj ══ */

let clock: Hlc | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function load(): Hlc {
  if (clock) return clock;
  try {
    const raw = localStorage.getItem(CLOCK_KEY);
    const parsed = raw ? parseHlc(raw) : null;
    // Un reloj guardado de otro dispositivo no sirve: se descarta.
    clock = parsed && parsed.deviceId === deviceId() ? parsed : hlcZero(deviceId());
  } catch {
    clock = hlcZero(deviceId());
  }
  return clock;
}

/**
 * Guarda el reloj.
 *
 * Con `debounce` corto para no escribir en cada tecla, pero **antes** de que la
 * operacion se encole, no despues. Si se perdiera la escritura, el reloj
 * arrancaria por detras de operaciones ya emitidas por este mismo dispositivo:
 * no rompe la convergencia —el desempate por dispositivo sigue dando orden
 * total— pero puede hacer que una edicion vieja gane a una nueva.
 */
function persist(next: Hlc): void {
  clock = next;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      localStorage.setItem(CLOCK_KEY, formatHlc(next));
    } catch {
      /* Sin espacio o bloqueado: el reloj sigue vivo en memoria. */
    }
  }, 250);
}

/** Avanza el reloj para un evento propio y devuelve el HLC serializado. */
export function tick(nowMs: number = Date.now()): string {
  const next = localEvent(load(), nowMs);
  persist(next);
  return formatHlc(next);
}

/**
 * Avanza el reloj al recibir una operacion remota.
 *
 * Devuelve `true` si el reloj del otro dispositivo es tan improbable que no se
 * ha adoptado. La operacion se aplica igual: lo que se rechaza es contagiarse
 * de su hora.
 */
export function observe(remoteHlc: string, nowMs: number = Date.now()): boolean {
  const parsed = parseHlc(remoteHlc);
  if (!parsed) return false;
  const { next, clockSuspect } = remoteEvent(load(), parsed, nowMs);
  persist(next);
  return clockSuspect;
}

/** El reloj actual, sin avanzarlo. Para el diagnostico. */
export function currentClock(): string {
  return formatHlc(load());
}

/** Solo para pruebas: olvida lo cacheado y relee. */
export function resetIdentityCache(): void {
  cachedDeviceId = null;
  clock = null;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = null;
}
