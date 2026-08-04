import { localAdapter } from './localAdapter';
import {
  BACKUP_COLLECTIONS,
  COLLECTION_KEYS,
  collectionFromStorageKey,
  isCollectionKey,
  type CollectionKey,
} from '@bodyfit/domain/collections';
import { APP_SCHEMA_VERSION } from '@bodyfit/domain/versioning';
import type { StorageAdapter } from './types';

/**
 * ── PUNTO DE INTERCAMBIO ─────────────────────────────────────────────────────
 * Hoy: localStorage.
 * Manana: `export const storage = supabaseAdapter;` y nada mas cambia.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const storage: StorageAdapter = localAdapter;

export * from './types';
export { localAdapter } from './localAdapter';

/**
 * Puente entre el adaptador y el middleware `persist` de zustand.
 * `persist` acepta almacenamiento asincrono, asi que sirve tal cual para
 * cualquier backend remoto.
 */
export const zustandStorage = {
  getItem: (name: string) => storage.getItem(name),
  setItem: (name: string, value: string) => storage.setItem(name, value),
  removeItem: (name: string) => storage.removeItem(name),
};

/**
 * Lee todas las colecciones registradas.
 *
 * Recorre el REGISTRO, no lo que haya en el almacenamiento. La diferencia
 * importa: si manana alguien escribe una clave con el prefijo de la app pero
 * sin registrarla, no acabara en una copia de seguridad por accidente, y si
 * una coleccion registrada esta vacia se sabra que lo esta en vez de
 * suponerlo.
 */
export async function readCollections(): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  for (const collection of BACKUP_COLLECTIONS) {
    const raw = await storage.getItem(collection);
    if (raw == null) continue;
    try {
      data[collection] = JSON.parse(raw);
    } catch {
      data[collection] = raw;
    }
  }
  return data;
}

/** Exporta todo el estado de la app como un unico JSON. */
export async function exportAll(): Promise<string> {
  return JSON.stringify(
    {
      app: 'BodyFit Prep',
      schema: APP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: await readCollections(),
    },
    null,
    2,
  );
}

/**
 * Importa una copia previa.
 *
 * Solo aplica colecciones registradas. Una clave desconocida se devuelve en
 * `skipped` en lugar de escribirse a ciegas: si viene de una version mas nueva
 * no sabemos que significa, y escribirla podria dejar el almacenamiento en un
 * estado que esta build no entiende.
 */
export async function importAll(
  json: string,
): Promise<{ imported: CollectionKey[]; skipped: string[] }> {
  const parsed = JSON.parse(json) as { data?: Record<string, unknown> };
  const data = parsed.data ?? (parsed as Record<string, unknown>);

  const imported: CollectionKey[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    // Las copias antiguas guardaban la clave completa: `bodyfit:v1:profile`
    const collection = isCollectionKey(key) ? key : collectionFromStorageKey(key);
    if (!collection) {
      skipped.push(key);
      continue;
    }
    await storage.setItem(collection, typeof value === 'string' ? value : JSON.stringify(value));
    imported.push(collection);
  }
  return { imported, skipped };
}

/**
 * Borra todo.
 *
 * Recorre el registro y ademas barre las claves con el prefijo de la app, para
 * que "borrar todo" borre de verdad todo incluso si quedo algo de una version
 * anterior. Aqui la exhaustividad importa mas que la precision.
 */
export async function clearAll(): Promise<void> {
  for (const collection of COLLECTION_KEYS) await storage.removeItem(collection);
  for (const key of await storage.listKeys()) await storage.removeItem(key);
}
