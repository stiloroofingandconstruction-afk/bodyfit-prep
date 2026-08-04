/**
 * Registro central de colecciones — la unica fuente de verdad.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE EXISTE ESTE ARCHIVO
 *
 * Antes habia dos listas que decian cosas distintas: una constante
 * `COLLECTIONS` con seis nombres y once stores realmente persistidos. Nadie
 * usaba la constante, asi que la divergencia no molestaba... hasta el dia en
 * que algo iterase esa lista para decidir que sincronizar o que exportar. Ese
 * dia se habrian perdido cinco colecciones enteras en silencio, sin error y
 * sin aviso.
 *
 * Ahora no hay dos listas. Hay esta. Todo lo que recorra colecciones —
 * exportar, importar, borrar, contar, respaldar, y manana sincronizar — parte
 * de aqui, y el sistema de tipos impide registrar un store que no este
 * declarado.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Este modulo es puro: sin React, sin almacenamiento, sin red. Se ejecuta
 * igual en el navegador, en Node y en una Edge Function.
 */

/** Prefijo de todas las claves en el almacenamiento del dispositivo. */
export const STORAGE_PREFIX = 'bodyfit:v1:';

/**
 * Que hace cada coleccion y como debe tratarla el resto del sistema.
 *
 * `migrations`  la coleccion tiene funciones de migracion declaradas.
 * `backup`      entra en la copia de seguridad del usuario.
 * `sync`        se sincronizara con el servidor (2.1). Lo local se queda fuera.
 * `device`      es estado de ESTE dispositivo, no del usuario.
 */
export interface CollectionSpec {
  readonly key: string;
  readonly label: string;
  readonly migrations: boolean;
  readonly backup: boolean;
  readonly sync: boolean;
  readonly device: boolean;
}

/**
 * El registro.
 *
 * Anadir una coleccion es anadir una entrada aqui. Si se olvida, el store no
 * compila (`persisted` solo acepta claves registradas) y ademas falla la
 * prueba `scripts/smoke-collections.mts`, que compara este registro con lo que
 * hay escrito de verdad en `src/store/`.
 */
export const COLLECTION_REGISTRY = {
  profile: {
    key: 'profile',
    label: 'Perfil',
    migrations: true,
    backup: true,
    sync: true,
    device: false,
  },
  settings: {
    key: 'settings',
    label: 'Ajustes',
    migrations: false,
    backup: true,
    sync: true,
    device: false,
  },
  nutrition: {
    key: 'nutrition',
    label: 'Nutricion',
    migrations: true,
    backup: true,
    sync: true,
    device: false,
  },
  training: {
    key: 'training',
    label: 'Entrenamiento',
    migrations: false,
    backup: true,
    sync: true,
    device: false,
  },
  body: {
    key: 'body',
    label: 'Cuerpo',
    migrations: true,
    backup: true,
    sync: true,
    device: false,
  },
  checkins: {
    key: 'checkins',
    label: 'Check-ins',
    migrations: true,
    backup: true,
    sync: true,
    device: false,
  },
  prep: {
    key: 'prep',
    label: 'Competencia',
    migrations: false,
    backup: true,
    sync: true,
    device: false,
  },
  activity: {
    key: 'activity',
    label: 'Cardio y pasos',
    migrations: false,
    backup: true,
    sync: true,
    device: false,
  },
  photos: {
    key: 'photos',
    label: 'Fotos',
    migrations: false,
    backup: true,
    sync: true,
    device: false,
  },
  /*
   * Las dos siguientes describen este dispositivo, no al usuario.
   *
   * Entran en la copia de seguridad porque restaurar en el mismo telefono debe
   * dejarlo todo como estaba, pero NO se sincronizaran: la fecha de la ultima
   * copia y las casillas de la prueba de iPhone son de este aparato y copiarlas
   * a otro seria mentir sobre el estado de ese otro.
   */
  backup: {
    key: 'backup',
    label: 'Copias',
    migrations: false,
    backup: true,
    sync: false,
    device: true,
  },
  deviceTest: {
    key: 'deviceTest',
    label: 'Prueba de dispositivo',
    migrations: false,
    backup: true,
    sync: false,
    device: true,
  },
} as const satisfies Record<string, CollectionSpec>;

/** Clave valida de coleccion. Cualquier otra cosa no compila. */
export type CollectionKey = keyof typeof COLLECTION_REGISTRY;

export const COLLECTION_KEYS = Object.keys(COLLECTION_REGISTRY) as CollectionKey[];

export function collectionSpec(key: CollectionKey): CollectionSpec {
  return COLLECTION_REGISTRY[key];
}

/** Colecciones que entran en la copia de seguridad del usuario. */
export const BACKUP_COLLECTIONS: CollectionKey[] = COLLECTION_KEYS.filter(
  (k) => COLLECTION_REGISTRY[k].backup,
);

/** Colecciones que viajaran al servidor en la 2.1. */
export const SYNC_COLLECTIONS: CollectionKey[] = COLLECTION_KEYS.filter(
  (k) => COLLECTION_REGISTRY[k].sync,
);

/** Colecciones con migraciones declaradas. */
export const MIGRATED_COLLECTIONS: CollectionKey[] = COLLECTION_KEYS.filter(
  (k) => COLLECTION_REGISTRY[k].migrations,
);

/** Clave completa en el almacenamiento: `bodyfit:v1:profile`. */
export function storageKey(key: CollectionKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Deduce la coleccion a partir de una clave de almacenamiento.
 *
 * Devuelve `null` para cualquier clave que no este registrada. Es deliberado:
 * al importar una copia, una clave desconocida no se aplica a ciegas.
 */
export function collectionFromStorageKey(raw: string): CollectionKey | null {
  if (!raw.startsWith(STORAGE_PREFIX)) return null;
  const key = raw.slice(STORAGE_PREFIX.length);
  return (COLLECTION_KEYS as string[]).includes(key) ? (key as CollectionKey) : null;
}

export function isCollectionKey(value: string): value is CollectionKey {
  return (COLLECTION_KEYS as string[]).includes(value);
}
