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

/*
 * Aqui vivian `COLLECTIONS`, `SCHEMA_VERSION` y `STORAGE_PREFIX`.
 *
 * `COLLECTIONS` declaraba seis colecciones cuando ya habia once persistidas, y
 * nadie la usaba: era una lista falsa esperando a que algo la recorriera para
 * dejar cinco colecciones fuera en silencio. `SCHEMA_VERSION` era una tercera
 * numeracion compitiendo con otras dos.
 *
 * Ahora hay una sola fuente para cada cosa:
 *   colecciones -> @/domain/collections
 *   versiones   -> @/domain/versioning
 *
 * Se reexportan desde aqui para que quien trabaje con almacenamiento las
 * encuentre donde espera buscarlas.
 */
export {
  BACKUP_COLLECTIONS,
  COLLECTION_KEYS,
  COLLECTION_REGISTRY,
  MIGRATED_COLLECTIONS,
  STORAGE_PREFIX,
  SYNC_COLLECTIONS,
  collectionFromStorageKey,
  collectionSpec,
  isCollectionKey,
  storageKey,
  type CollectionKey,
  type CollectionSpec,
} from '@bodyfit/domain/collections';

export {
  APP_SCHEMA_VERSION,
  BACKUP_FORMAT_VERSION,
  MIN_SUPPORTED_SCHEMA,
  canRollback,
  checkCompatibility,
  isReadable,
  versionOf,
  versionSummary,
  type Compatibility,
} from '@bodyfit/domain/versioning';
