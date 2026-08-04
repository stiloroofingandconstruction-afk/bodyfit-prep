/**
 * Gestor de versiones — la unica autoridad sobre numeros de esquema.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE EXISTE ESTE ARCHIVO
 *
 * Llegaron a convivir tres numeraciones sin relacion entre si:
 *
 *   STORE_VERSION = 2      en persist.ts, para stores con migraciones
 *   version: 1             en persist.ts, para los demas stores
 *   SCHEMA_VERSION = 1     en storage/types.ts, exportada y sin usar
 *   BACKUP_FORMAT = 2      en backup.ts, para el archivo de copia
 *
 * En una app local eso es confusion. En una app sincronizada, donde un cliente
 * viejo y un servidor nuevo conviven durante semanas, es corrupcion: el primer
 * store que gane una migracion saltaria de 1 a 2 y ejecutaria transformaciones
 * que no le corresponden sobre datos que no las necesitan.
 *
 * A partir de aqui hay UN sistema. Cada coleccion declara su version, la
 * compatibilidad se decide con reglas explicitas, y el rollback tiene permiso
 * o no lo tiene.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Modulo puro: sin React, sin almacenamiento, sin red.
 */
import { COLLECTION_KEYS, COLLECTION_REGISTRY, type CollectionKey } from './collections';

/* ══════════════════════════════════════════════════════ versiones ══════ */

/**
 * Version del esquema de datos de la aplicacion.
 *
 * Sube cuando cambia la FORMA de los datos persistidos de manera que un
 * cliente anterior podria malinterpretarlos. No sube por anadir un campo
 * opcional.
 */
export const APP_SCHEMA_VERSION = 3;

/**
 * Version minima que esta build sabe leer.
 *
 * Por debajo de esto no se intenta migrar: se avisa al usuario. Es preferible
 * pedir una actualizacion a corromper datos con migraciones que ya no existen.
 */
export const MIN_SUPPORTED_SCHEMA = 1;

/** Version del formato del ARCHIVO de copia de seguridad. Concepto distinto. */
export const BACKUP_FORMAT_VERSION = 2;

/**
 * Version de migracion de cada coleccion.
 *
 * Es el numero que ve zustand. Solo sube en las colecciones que tienen
 * migraciones escritas; las demas se quedan en 1 para siempre y por eso no
 * pueden disparar una migracion por accidente.
 *
 * Para anadir una migracion a una coleccion:
 *   1. subir su numero aqui
 *   2. escribir la funcion en `store/migrations.ts` con la clave anterior
 *   3. marcar `migrations: true` en el registro de colecciones
 */
const COLLECTION_VERSIONS: Record<CollectionKey, number> = {
  profile: 2,
  nutrition: 2,
  body: 2,
  checkins: 2,
  settings: 1,
  training: 1,
  prep: 1,
  activity: 1,
  photos: 1,
  backup: 1,
  deviceTest: 1,
};

/** Version persistida de una coleccion. */
export function versionOf(collection: CollectionKey): number {
  return COLLECTION_VERSIONS[collection];
}

/**
 * Coherencia interna del propio registro.
 *
 * Una coleccion marcada con migraciones debe estar por encima de 1, y una sin
 * migraciones debe estar exactamente en 1. Se comprueba en las pruebas para
 * que la incoherencia salte al escribirla, no meses despues.
 */
export function versionRegistryProblems(): string[] {
  const out: string[] = [];
  for (const key of COLLECTION_KEYS) {
    const declared = COLLECTION_REGISTRY[key].migrations;
    const version = COLLECTION_VERSIONS[key];
    if (version == null) {
      out.push(`${key}: sin version declarada`);
      continue;
    }
    if (declared && version < 2) {
      out.push(`${key}: declara migraciones pero sigue en la version ${version}`);
    }
    if (!declared && version !== 1) {
      out.push(`${key}: esta en la version ${version} sin declarar migraciones`);
    }
  }
  return out;
}

/* ═══════════════════════════════════════════════════ compatibilidad ════ */

export type Compatibility =
  /** Misma version: se lee tal cual. */
  | { kind: 'igual' }
  /** Version anterior conocida: se migra hacia delante. */
  | { kind: 'migrar'; from: number; to: number }
  /** Version anterior a la soportada: no se toca. */
  | { kind: 'demasiado-antigua'; from: number; min: number }
  /** Version futura: la escribio una build mas nueva. */
  | { kind: 'demasiado-nueva'; from: number; current: number };

/**
 * Que hacer con unos datos que declaran la version `incoming`.
 *
 * Se usa igual para el estado persistido y para un archivo de copia: son el
 * mismo problema, leer datos escritos por otra version del programa.
 */
export function checkCompatibility(
  incoming: number,
  current = APP_SCHEMA_VERSION,
): Compatibility {
  if (!Number.isFinite(incoming) || incoming < 1) {
    return { kind: 'demasiado-antigua', from: incoming, min: MIN_SUPPORTED_SCHEMA };
  }
  if (incoming === current) return { kind: 'igual' };
  if (incoming > current) return { kind: 'demasiado-nueva', from: incoming, current };
  if (incoming < MIN_SUPPORTED_SCHEMA) {
    return { kind: 'demasiado-antigua', from: incoming, min: MIN_SUPPORTED_SCHEMA };
  }
  return { kind: 'migrar', from: incoming, to: current };
}

/** Atajo: ¿se pueden usar estos datos, migrando si hace falta? */
export function isReadable(incoming: number, current = APP_SCHEMA_VERSION): boolean {
  const c = checkCompatibility(incoming, current);
  return c.kind === 'igual' || c.kind === 'migrar';
}

/* ════════════════════════════════════════════════════════ rollback ═════ */

/**
 * ¿Se permite restaurar datos de la version `from` sobre una app en `to`?
 *
 * Hacia atras solo se permite dentro del mismo esquema. Restaurar una copia
 * escrita por una version mas nueva sobre una app vieja significa que la app
 * no entiende campos que existen, y al guardar los borraria sin avisar. Es
 * exactamente el tipo de perdida silenciosa que este trabajo elimina.
 */
export function canRollback(from: number, to = APP_SCHEMA_VERSION): boolean {
  return from <= to && from >= MIN_SUPPORTED_SCHEMA;
}

/* ════════════════════════════════════════════════════════ checksum ═════ */

/**
 * Copia con las claves de objeto ordenadas alfabeticamente.
 *
 * Sin esto el checksum dependeria del orden en que `JSON.stringify` recorre
 * las claves, que no esta garantizado entre motores ni tras un ciclo de
 * serializacion. Ordenando, la misma informacion produce siempre el mismo
 * resultado.
 */
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) out[key] = canonicalize(src[key]);
    return out;
  }
  return value;
}

/**
 * Suma de verificacion de 64 bits en hexadecimal.
 *
 * Dos pasadas FNV-1a con semillas distintas. No es criptografico — no pretende
 * serlo — pero detecta de sobra truncados, bytes cambiados y ediciones a mano,
 * que es lo unico contra lo que hay que proteger unos datos locales.
 */
export function checksum(value: unknown): string {
  const text = JSON.stringify(canonicalize(value));
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a ^= c;
    a = Math.imul(a, 0x01000193) >>> 0;
    b = (b + c) >>> 0;
    b = Math.imul(b, 0x85ebca6b) >>> 0;
    b ^= b >>> 13;
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/* ═══════════════════════════════════════════════════════ resumen ═══════ */

export interface VersionSummary {
  schema: number;
  minSupported: number;
  backupFormat: number;
  collections: { collection: CollectionKey; version: number; migrations: boolean }[];
}

/** Lo que se incluye en el diagnostico y en la cabecera de una copia. */
export function versionSummary(): VersionSummary {
  return {
    schema: APP_SCHEMA_VERSION,
    minSupported: MIN_SUPPORTED_SCHEMA,
    backupFormat: BACKUP_FORMAT_VERSION,
    collections: COLLECTION_KEYS.map((collection) => ({
      collection,
      version: COLLECTION_VERSIONS[collection],
      migrations: COLLECTION_REGISTRY[collection].migrations,
    })),
  };
}
