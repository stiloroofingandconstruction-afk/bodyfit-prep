/**
 * Copias de seguridad: entrada/salida.
 *
 * La logica de formato vive en `@/domain/backup`. Aqui solo se lee y se
 * escribe: localStorage a traves del adaptador, IndexedDB a traves de
 * `blobStore`, y el archivo a traves del navegador.
 *
 * Nada de esto sube datos a ningun servidor. Una copia es un archivo que
 * termina en el telefono o en el iCloud Drive del usuario, y ahi se queda.
 */
import {
  BACKUP_FORMAT,
  buildBackup,
  parseBackup,
  type BackupFile,
  type BackupPhoto,
  type BackupReport,
} from '@bodyfit/domain/backup';
import { getPhoto, listPhotoIds, putPhoto } from './blobStore';
import { readCollections, storage } from './storage';
import { BACKUP_COLLECTIONS, isCollectionKey } from '@bodyfit/domain/collections';

export const APP_VERSION = '2.1.0';

export { BACKUP_FORMAT, parseBackup };
export type { BackupFile, BackupReport };

/* ────────────────────────────────────────────────────────────── base64 ──── */

/**
 * ArrayBuffer -> base64.
 *
 * Se trocea en bloques de 8 KB: `String.fromCharCode(...bytes)` con una foto
 * entera desborda la pila de argumentos en Safari y falla justo con las fotos
 * grandes, que son las que importa no perder.
 */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function fromBase64(data: string): ArrayBuffer {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/* ───────────────────────────────────────────────────────────── creacion ──── */

export interface BackupResult {
  json: string;
  filename: string;
  bytes: number;
  photos: number;
  photosFailed: number;
  collections: number;
}

/**
 * Crea la copia completa: estado de todos los stores + fotos de progreso.
 *
 * Una foto que no se pueda leer no aborta la copia; se cuenta y se informa.
 * Es preferible una copia con 19 de 20 fotos a ninguna copia.
 */
export async function createBackup(now = new Date()): Promise<BackupResult> {
  // Recorre el registro de colecciones, no lo que haya suelto en disco
  const data = await readCollections();

  const photos: BackupPhoto[] = [];
  let photosFailed = 0;
  for (const id of await listPhotoIds()) {
    try {
      const blob = await getPhoto(id);
      if (!blob) {
        photosFailed++;
        continue;
      }
      const buffer = await blob.arrayBuffer();
      photos.push({
        id,
        type: blob.type || 'image/jpeg',
        size: buffer.byteLength,
        data: toBase64(buffer),
      });
    } catch {
      photosFailed++;
    }
  }

  const file = buildBackup({
    data,
    photos,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
  });
  const json = JSON.stringify(file);
  const stamp = now.toISOString().slice(0, 10);

  return {
    json,
    filename: `bodyfit-copia-${stamp}.json`,
    bytes: json.length,
    photos: photos.length,
    photosFailed,
    collections: Object.keys(data).length,
  };
}

/* ────────────────────────────────────────────────────────── restauracion ── */

export interface RestoreResult {
  collections: string[];
  /** Claves del archivo que no corresponden a ninguna coleccion registrada. */
  skipped: string[];
  photos: number;
  photosFailed: number;
  warnings: string[];
}

/**
 * Restaura una copia ya validada.
 *
 * Escribe primero las fotos y despues el estado: si el proceso se interrumpe a
 * media restauracion, quedan blobs huerfanos (inofensivos) en lugar de fichas
 * de foto apuntando a un blob que no existe (imagenes rotas para siempre).
 *
 * Las migraciones NO se ejecutan aqui. El estado se escribe tal cual venia, con
 * su numero de version dentro, y zustand aplica las migraciones que falten al
 * rehidratar tras el reinicio. Es el mismo camino que sigue una actualizacion
 * normal de la app, asi que no hay un segundo camino que mantener.
 */
export async function restoreBackup(report: BackupReport): Promise<RestoreResult> {
  if (!report.ok || !report.file) throw new Error('La copia no es valida');
  const file = report.file;

  let photosFailed = 0;
  for (const photo of file.photos) {
    try {
      await putPhoto(photo.id, new Blob([fromBase64(photo.data)], { type: photo.type }));
    } catch {
      photosFailed++;
    }
  }

  /*
   * Solo se escriben colecciones registradas. Una clave desconocida se anota y
   * no se aplica: si viene de una version mas nueva no sabemos que significa, y
   * escribirla dejaria el almacenamiento en un estado que esta build no
   * entiende.
   */
  const collections: string[] = [];
  const skipped: string[] = [];
  for (const [key, value] of Object.entries(file.data)) {
    if (!isCollectionKey(key)) {
      skipped.push(key);
      continue;
    }
    await storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    collections.push(key);
  }

  return {
    collections,
    skipped,
    photos: file.photos.length - photosFailed,
    photosFailed,
    warnings: report.warnings,
  };
}

/* ───────────────────────────────────────────────────── estado del disco ──── */

export interface StorageStatus {
  /** El navegador expone la API de cuota. */
  supported: boolean;
  /** El almacenamiento es persistente: el sistema no lo borrara por falta de espacio. */
  persistent: boolean;
  /** El navegador soporta solicitar persistencia. */
  canRequest: boolean;
  usage: number;
  quota: number;
  /** Porcentaje de la cuota usado, 0–100. */
  usedPct: number;
}

export async function storageStatus(): Promise<StorageStatus> {
  const s = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  const status: StorageStatus = {
    supported: false,
    persistent: false,
    canRequest: typeof s?.persist === 'function',
    usage: 0,
    quota: 0,
    usedPct: 0,
  };
  if (!s) return status;

  try {
    if (typeof s.persisted === 'function') status.persistent = await s.persisted();
  } catch {
    /* Safari en modo privado lanza aqui */
  }
  try {
    if (typeof s.estimate === 'function') {
      const { usage = 0, quota = 0 } = await s.estimate();
      status.supported = true;
      status.usage = usage;
      status.quota = quota;
      status.usedPct = quota > 0 ? Math.min(100, (usage / quota) * 100) : 0;
    }
  } catch {
    /* sin estimacion disponible */
  }
  return status;
}

/**
 * Pide al navegador que marque el almacenamiento como persistente.
 *
 * Safari en iOS no muestra ningun dialogo: concede o deniega segun sus propios
 * criterios (si la app esta en la pantalla de inicio, si se usa a menudo). Por
 * eso la interfaz nunca promete que vaya a funcionar, solo informa del
 * resultado.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (typeof navigator?.storage?.persist !== 'function') return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Cuenta cuantos registros hay ahora mismo, para decidir si toca recordar la copia. */
export async function countStoredEntries(): Promise<number> {
  let total = 0;
  for (const key of BACKUP_COLLECTIONS) {
    const raw = await storage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
      const state = parsed.state ?? (parsed as Record<string, unknown>);
      for (const v of Object.values(state)) if (Array.isArray(v)) total += v.length;
    } catch {
      /* entrada no JSON: no cuenta */
    }
  }
  return total;
}
