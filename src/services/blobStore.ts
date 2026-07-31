/**
 * Almacen de fotos de progreso en IndexedDB.
 *
 * Las imagenes NO van en localStorage: su limite (~5 MB) se agota con dos fotos
 * y tumbaria el resto del estado. IndexedDB guarda Blobs sin serializar y sin
 * ese techo.
 */
const DB_NAME = 'bodyfit-media';
const DB_VERSION = 1;
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/**
 * Registro almacenado.
 *
 * IMPORTANTE: se guarda un ArrayBuffer, NO un Blob.
 *
 * WebKit — el motor de Safari, y por tanto el de cualquier navegador en iOS —
 * falla al serializar Blobs dentro de IndexedDB con el error
 * "Error preparing Blob/File data to be stored in object store". Como esta app
 * se instala sobre todo en iPhone, guardar Blobs significaba perder todas las
 * fotos de progreso justo en el dispositivo principal.
 *
 * Los ArrayBuffer se almacenan de forma fiable en todos los motores, asi que se
 * guarda el contenido junto al tipo MIME y el Blob se reconstruye al leer.
 */
interface StoredPhoto {
  type: string;
  data: ArrayBuffer;
}

export async function putPhoto(id: string, blob: Blob): Promise<void> {
  const record: StoredPhoto = {
    type: blob.type || 'image/jpeg',
    data: await blob.arrayBuffer(),
  };
  await tx('readwrite', (s) => s.put(record, id));
}

export async function getPhoto(id: string): Promise<Blob | null> {
  try {
    const stored = await tx<StoredPhoto | Blob | undefined>('readonly', (s) => s.get(id));
    if (!stored) return null;
    // Compatibilidad: entradas guardadas como Blob por versiones anteriores
    if (stored instanceof Blob) return stored;
    if (!('data' in stored)) return null;
    return new Blob([stored.data], { type: stored.type });
  } catch {
    return null;
  }
}

export async function deletePhoto(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}

export async function listPhotoIds(): Promise<string[]> {
  try {
    const keys = await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys());
    return keys.map(String);
  } catch {
    return [];
  }
}

/**
 * Reduce la imagen antes de guardarla: lado maximo 1280 px, JPEG calidad 0.82.
 * Una foto de iPhone pasa de ~4 MB a ~200 KB sin perdida visible de detalle.
 */
export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<Blob> {
  /*
   * Si cualquier paso falla — un navegador sin createImageBitmap, un formato
   * que el canvas no sabe decodificar, memoria insuficiente con una foto
   * enorme — se guarda el archivo original. Perder la compresion es un mal
   * menor; perder la foto del usuario, no.
   */
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
    // Un JPEG mayor que el original no aporta nada
    return blob && blob.size > 0 && blob.size < file.size ? blob : file;
  } catch (err) {
    console.warn('[fotos] no se pudo comprimir, se guarda el original', err);
    return file;
  }
}

/** URL de objeto para mostrar la foto. Recuerda revocarla al desmontar. */
export async function photoURL(id: string): Promise<string | null> {
  const blob = await getPhoto(id);
  return blob ? URL.createObjectURL(blob) : null;
}
