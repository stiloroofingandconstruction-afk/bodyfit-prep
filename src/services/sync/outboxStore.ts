/**
 * La outbox, en IndexedDB.
 *
 * En IndexedDB y no en localStorage por dos motivos: el limite de ~5 MB de
 * localStorage se agota con unos miles de operaciones pendientes, y escribir la
 * cola entera en cada cambio —que es lo que obliga a hacer una clave unica— se
 * nota en la interfaz.
 *
 * La maquina de estados vive en `@bodyfit/domain/sync/outbox` y es pura. Aqui
 * solo se guarda y se lee.
 */
import type { OutboxEntry, OutboxState } from '@bodyfit/domain/sync/outbox';


import { OUTBOX_STORE as STORE, openSyncDb as open } from './db';

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
 * Fila guardada.
 *
 * `operationId` y `state` se sacan fuera de la operacion para poder indexarlos.
 * El resto viaja tal cual: guardar la operacion entera es lo que permite
 * reenviarla intacta, con su checksum original, meses despues.
 */
interface Row {
  operationId: string;
  state: OutboxState;
  entry: OutboxEntry;
}

function toRow(entry: OutboxEntry): Row {
  return { operationId: entry.operation.operationId, state: entry.state, entry };
}

export async function putEntry(entry: OutboxEntry): Promise<void> {
  await tx('readwrite', (s) => s.put(toRow(entry)));
}

export async function putEntries(entries: readonly OutboxEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    const store = t.objectStore(STORE);
    for (const entry of entries) store.put(toRow(entry));
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function allEntries(): Promise<OutboxEntry[]> {
  const rows = await tx<Row[]>('readonly', (s) => s.getAll() as IDBRequest<Row[]>);
  /*
   * Una fila ilegible no tumba la lectura entera.
   *
   * Si la base se corrompio, perder la cola completa por una entrada rota seria
   * mucho peor que saltarsela: lo que se pueda leer, se lee.
   */
  return rows.filter((r): r is Row => Boolean(r?.entry?.operation)).map((r) => r.entry);
}

/**
 * Elimina entradas por identificador.
 *
 * La UNICA via de borrado de todo el subsistema. La decide `prune`, que solo
 * devuelve confirmadas antiguas y nunca toca `dead-letter`.
 */
export async function removeEntries(operationIds: readonly string[]): Promise<void> {
  if (operationIds.length === 0) return;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    const store = t.objectStore(STORE);
    for (const id of operationIds) store.delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function countEntries(): Promise<number> {
  return tx<number>('readonly', (s) => s.count());
}

/** Solo para pruebas y para el borrado total de datos del usuario. */
export async function clearOutbox(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
}
