/**
 * Registro local de errores y diagnostico descargable.
 *
 * Escribe directamente en localStorage, sin pasar por el adaptador de
 * almacenamiento ni por zustand. Es deliberado: este modulo tiene que seguir
 * funcionando justo cuando el resto ha fallado, y cuanto menos dependa de la
 * app, mas probable es que el registro sobreviva al fallo que intenta explicar.
 *
 * Nada de esto sale del dispositivo. El archivo de diagnostico se descarga y el
 * usuario decide si lo comparte.
 */

import { listPhotoIds } from './blobStore';

const LOG_KEY = 'bodyfit:errors';
const SAFE_KEY = 'bodyfit:safe-mode';
const MAX_ENTRIES = 50;

export interface ErrorEntry {
  at: string;
  /** Origen: pantalla, limite de error, promesa sin capturar, IndexedDB... */
  source: string;
  message: string;
  stack?: string;
  /** Ruta en la que ocurrio. */
  route?: string;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin espacio o almacenamiento bloqueado: el registro no es critico */
  }
}

/* ─────────────────────────────────────────────────────────────── registro ── */

export function logError(source: string, error: unknown, route?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const entry: ErrorEntry = {
    at: new Date().toISOString(),
    source,
    message: err.message || 'Error sin mensaje',
    stack: err.stack?.split('\n').slice(0, 12).join('\n'),
    route: route ?? (typeof location !== 'undefined' ? location.pathname : undefined),
  };
  // Los mas recientes primero, y se descartan los antiguos: un registro que
  // crece sin limite acaba ocupando el hueco que necesitan los datos reales.
  writeJSON(LOG_KEY, [entry, ...getErrors()].slice(0, MAX_ENTRIES));
  console.error(`[${source}]`, err);
}

export function getErrors(): ErrorEntry[] {
  const list = readJSON<ErrorEntry[]>(LOG_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function clearErrors(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    /* nada que hacer */
  }
}

/* ──────────────────────────────────────────────────────────── modo seguro ── */

type SafeMap = Record<string, number>;

/**
 * Cuenta los fallos de una pantalla. A partir del segundo, la app deja de
 * intentar montarla y muestra una version minima con salida.
 *
 * Reintentar indefinidamente una pantalla que revienta deja al usuario
 * atrapado: la app arranca, falla, y no hay forma de llegar a Ajustes para
 * exportar los datos. El modo seguro existe para que siempre haya salida.
 */
export function recordScreenFailure(route: string): number {
  const map = readJSON<SafeMap>(SAFE_KEY, {});
  const next = (map[route] ?? 0) + 1;
  map[route] = next;
  writeJSON(SAFE_KEY, map);
  return next;
}

export function isSafeMode(route: string): boolean {
  return (readJSON<SafeMap>(SAFE_KEY, {})[route] ?? 0) >= 2;
}

export function safeModeRoutes(): string[] {
  const map = readJSON<SafeMap>(SAFE_KEY, {});
  return Object.keys(map).filter((r) => (map[r] ?? 0) >= 2);
}

/** El usuario dice que ya esta arreglado: se le da otra oportunidad a la pantalla. */
export function clearSafeMode(route?: string): void {
  if (!route) {
    try {
      localStorage.removeItem(SAFE_KEY);
    } catch {
      /* nada que hacer */
    }
    return;
  }
  const map = readJSON<SafeMap>(SAFE_KEY, {});
  delete map[route];
  writeJSON(SAFE_KEY, map);
}

/* ────────────────────────────────────────────────────────────── diagnostico ── */

export interface Diagnostics {
  generatedAt: string;
  appVersion: string;
  userAgent: string;
  language: string;
  online: boolean;
  standalone: boolean;
  viewport: { width: number; height: number; dpr: number };
  storage: { persistent: boolean | null; usage: number | null; quota: number | null };
  /** Claves presentes y tamano en caracteres. Sin contenido: es informacion personal. */
  collections: { key: string; chars: number }[];
  indexedDB: { available: boolean; photos: number | null; error?: string };
  serviceWorker: { supported: boolean; controlled: boolean };
  safeModeRoutes: string[];
  errors: ErrorEntry[];
}

/**
 * Reune el estado del dispositivo para poder diagnosticar un fallo.
 *
 * Incluye QUE colecciones existen y cuanto ocupan, nunca su contenido: un
 * archivo de diagnostico se comparte con facilidad y no debe llevar dentro el
 * peso, las fotos ni las notas de nadie.
 */
export async function collectDiagnostics(appVersion: string): Promise<Diagnostics> {
  const diag: Diagnostics = {
    generatedAt: new Date().toISOString(),
    appVersion,
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    standalone:
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
    },
    storage: { persistent: null, usage: null, quota: null },
    collections: [],
    indexedDB: { available: typeof indexedDB !== 'undefined', photos: null },
    serviceWorker: {
      supported: 'serviceWorker' in navigator,
      controlled: Boolean(navigator.serviceWorker?.controller),
    },
    safeModeRoutes: safeModeRoutes(),
    errors: getErrors(),
  };

  try {
    if (navigator.storage?.persisted) diag.storage.persistent = await navigator.storage.persisted();
    if (navigator.storage?.estimate) {
      const { usage = null, quota = null } = await navigator.storage.estimate();
      diag.storage.usage = usage;
      diag.storage.quota = quota;
    }
  } catch {
    /* Safari privado */
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      diag.collections.push({ key, chars: localStorage.getItem(key)?.length ?? 0 });
    }
  } catch (err) {
    diag.collections.push({ key: `<no accesible: ${String(err)}>`, chars: 0 });
  }

  try {
    diag.indexedDB.photos = (await listPhotoIds()).length;
  } catch (err) {
    diag.indexedDB.error = String(err);
  }

  return diag;
}
