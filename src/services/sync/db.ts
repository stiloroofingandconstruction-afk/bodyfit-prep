/**
 * La base de datos local de sincronizacion. Una sola apertura, un solo sitio.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE ARCHIVO EXISTE
 *
 * La cola y los relojes por entidad viven en la misma base. Cuando cada modulo
 * la abria por su cuenta, uno pedia la version 1 y el otro la 2: IndexedDB
 * bloquea la actualizacion mientras haya una conexion abierta con la version
 * vieja, y la promesa del segundo NO se resuelve ni se rechaza. Se queda
 * colgada.
 *
 * El sintoma era desconcertante: la sincronizacion subia bien y al bajar no
 * pasaba nada, sin error, sin excepcion, sin nada en la consola. Simplemente no
 * volvia.
 *
 * Con una sola apertura compartida el problema no puede repetirse: hay una
 * version y un unico sitio donde se crean los almacenes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DB_NAME = 'bodyfit-sync';
/** Subirla obliga a crear aqui los almacenes nuevos. En ningun otro archivo. */
const DB_VERSION = 2;

export const OUTBOX_STORE = 'outbox';
export const CLOCKS_STORE = 'clocks';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openSyncDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = db.createObjectStore(OUTBOX_STORE, { keyPath: 'operationId' });
        outbox.createIndex('state', 'state');
      }
      if (!db.objectStoreNames.contains(CLOCKS_STORE)) {
        db.createObjectStore(CLOCKS_STORE);
      }
    };

    /*
     * Otra pestana tiene abierta una version anterior. Sin este manejador la
     * promesa se quedaba colgada en silencio, que es peor que fallar.
     */
    req.onblocked = () => reject(new Error('otra pestana bloquea la actualizacion de la base'));

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

/** Solo para pruebas: fuerza que la siguiente llamada vuelva a abrir. */
export function resetSyncDb(): void {
  dbPromise = null;
}
