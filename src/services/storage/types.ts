/**
 * Contrato de persistencia.
 *
 * Es deliberadamente minimo (clave -> documento JSON) porque es lo unico que
 * necesitan los stores. Toda la app habla con ESTA interfaz, nunca con
 * localStorage directamente: cambiar de backend es cambiar la implementacion,
 * no la aplicacion.
 *
 * Ver `supabaseAdapter.ts` para el plan de migracion.
 */
export interface StorageAdapter {
  readonly name: string;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}

/** Claves de coleccion. Una por store persistido. */
export const COLLECTIONS = {
  profile: 'profile',
  nutrition: 'nutrition',
  training: 'training',
  body: 'body',
  checkins: 'checkins',
  settings: 'settings',
} as const;

export type CollectionKey = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const STORAGE_PREFIX = 'bodyfit:v1:';
export const SCHEMA_VERSION = 1;
