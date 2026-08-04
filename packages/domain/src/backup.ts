/**
 * Formato de copia de seguridad — logica pura.
 *
 * Este modulo no toca IndexedDB, localStorage ni el DOM: solo construye,
 * valida y migra el objeto que se escribe al archivo. Asi la parte critica
 * (la que decide si una copia es recuperable) se puede probar en Node.
 *
 * Decisiones de diseno:
 *
 * 1. Una copia es UN SOLO archivo. Nada de "exporta el JSON y ademas las
 *    fotos": si el usuario cambia de telefono debe bastar con un archivo.
 * 2. Las fotos viajan en base64 dentro del mismo JSON. Ocupa ~33% mas que el
 *    binario, pero sobrevive a AirDrop, iCloud Drive, correo y WhatsApp sin
 *    corromperse, que es exactamente lo que hace un usuario de iPhone.
 * 3. El archivo lleva la version del esquema DENTRO. Una copia de hace seis
 *    meses debe poder restaurarse en la app de hoy.
 * 4. El archivo lleva una suma de verificacion. Un JSON truncado a la mitad
 *    sigue siendo texto: sin checksum no hay forma de distinguirlo de uno
 *    bueno hasta que faltan datos.
 */

import {
  APP_SCHEMA_VERSION,
  BACKUP_FORMAT_VERSION,
  canRollback,
  checkCompatibility,
  checksum,
} from './versioning';

/*
 * El numero de formato y la funcion de checksum vivian aqui. Ahora los
 * declara el gestor de versiones, que es el unico sitio donde se decide que
 * version tiene que cosa. Se reexportan para no romper a quien los importa
 * desde este modulo.
 */
export const BACKUP_FORMAT = BACKUP_FORMAT_VERSION;
export { checksum, canonicalize } from './versioning';

/** Marca que identifica un archivo como copia de esta app. */
export const BACKUP_APP = 'BodyFit Prep';

export interface BackupPhoto {
  /** Clave del blob en IndexedDB. Coincide con `ProgressPhoto.blobId`. */
  id: string;
  /** Tipo MIME original. */
  type: string;
  /** Tamano en bytes del binario, antes de codificar. */
  size: number;
  /** Contenido en base64 sin prefijo `data:`. */
  data: string;
}

export interface BackupFile {
  app: string;
  format: number;
  /** Esquema de datos que escribio esta copia. Decide si se puede restaurar. */
  schema: number;
  appVersion: string;
  exportedAt: string;
  /** Version persistida de cada store, para diagnostico. */
  storeVersions: Record<string, number>;
  counts: { collections: number; photos: number; photoBytes: number };
  /** Suma de verificacion de `data` + `photos`. */
  checksum: string;
  data: Record<string, unknown>;
  photos: BackupPhoto[];
}

export interface BackupReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  format: number | null;
  /** Esquema de datos declarado por la copia. `null` en formatos antiguos. */
  schema: number | null;
  exportedAt: string | null;
  appVersion: string | null;
  /** Numero de registros por coleccion, para que el usuario vea que hay dentro. */
  collections: { key: string; entries: number }[];
  photos: number;
  photoBytes: number;
  /** `null` si el archivo no traia checksum (formato 1). */
  checksumOk: boolean | null;
  /** Migrado al formato actual. `null` si no se pudo leer. */
  file: BackupFile | null;
}

/* ─────────────────────────────────────────────────────────── construccion ── */

export function buildBackup(input: {
  data: Record<string, unknown>;
  photos: BackupPhoto[];
  appVersion: string;
  exportedAt: string;
}): BackupFile {
  const { data, photos, appVersion, exportedAt } = input;

  const storeVersions: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) {
    const v = (value as { version?: unknown } | null)?.version;
    if (typeof v === 'number') storeVersions[key] = v;
  }

  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schema: APP_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    storeVersions,
    counts: {
      collections: Object.keys(data).length,
      photos: photos.length,
      photoBytes: photos.reduce((sum, p) => sum + (p.size || 0), 0),
    },
    checksum: checksum({ data, photos }),
    data,
    photos,
  };
}

/* ───────────────────────────────────────────────────────────── validacion ── */

/** Cuenta registros dentro del estado persistido de un store. */
export function countEntries(value: unknown): number {
  const state = (value as { state?: unknown } | null)?.state ?? value;
  if (!state || typeof state !== 'object') return 0;
  let total = 0;
  for (const v of Object.values(state as Record<string, unknown>)) {
    if (Array.isArray(v)) total += v.length;
  }
  return total;
}

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Lee un archivo de copia y lo deja listo para restaurar.
 *
 * Nunca lanza: devuelve un informe. Restaurar es una operacion delicada y el
 * usuario merece saber exactamente que se encontro dentro antes de decidir.
 */
export function parseBackup(json: string): BackupReport {
  const report: BackupReport = {
    ok: false,
    errors: [],
    warnings: [],
    format: null,
    schema: null,
    exportedAt: null,
    appVersion: null,
    collections: [],
    photos: 0,
    photoBytes: 0,
    checksumOk: null,
    file: null,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    report.errors.push('El archivo no es un JSON valido. Puede estar truncado o no ser una copia.');
    return report;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    report.errors.push('El archivo no contiene un objeto de copia.');
    return report;
  }

  const raw = parsed as Record<string, unknown>;

  // El formato 1 usaba `schema`; el 2 usa `format`.
  const format =
    typeof raw.format === 'number' ? raw.format : typeof raw.schema === 'number' ? raw.schema : null;
  report.format = format;

  if (format == null) {
    report.errors.push('El archivo no declara version de formato.');
    return report;
  }
  if (format > BACKUP_FORMAT) {
    report.errors.push(
      `La copia usa el formato ${format} y esta version entiende hasta el ${BACKUP_FORMAT}. Actualiza la aplicacion antes de restaurar.`,
    );
    return report;
  }

  /*
   * Compatibilidad del esquema de DATOS, distinta del formato del ARCHIVO.
   *
   * Una copia escrita por una version mas nueva puede traer campos que esta
   * build no entiende; al guardarlos los perderia sin avisar. Antes que eso,
   * se rechaza y se pide actualizar.
   */
  const schema = typeof raw.schema === 'number' ? raw.schema : null;
  report.schema = schema;

  if (schema != null) {
    const compat = checkCompatibility(schema);
    if (compat.kind === 'demasiado-nueva') {
      report.errors.push(
        `La copia viene del esquema ${compat.from} y esta version usa el ${compat.current}. Actualiza la aplicacion antes de restaurar.`,
      );
      return report;
    }
    if (compat.kind === 'demasiado-antigua') {
      report.errors.push(
        `La copia viene del esquema ${compat.from}, anterior al minimo soportado (${compat.min}).`,
      );
      return report;
    }
    if (compat.kind === 'migrar') {
      report.warnings.push(
        `La copia viene del esquema ${compat.from}; se migrara al ${compat.to} al restaurar.`,
      );
    }
    if (!canRollback(schema)) {
      report.errors.push('No se permite restaurar una copia mas nueva que la aplicacion.');
      return report;
    }
  }
  if (typeof raw.app === 'string' && raw.app !== BACKUP_APP) {
    report.warnings.push(`El archivo dice pertenecer a "${raw.app}".`);
  }

  const data = raw.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    report.errors.push('La copia no contiene la seccion de datos.');
    return report;
  }

  report.exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : null;
  report.appVersion = typeof raw.appVersion === 'string' ? raw.appVersion : null;

  const dataObj = data as Record<string, unknown>;
  report.collections = Object.keys(dataObj)
    .map((key) => ({ key, entries: countEntries(dataObj[key]) }))
    .sort((a, b) => a.key.localeCompare(b.key));

  /* ── fotos ── */
  const photos: BackupPhoto[] = [];
  const rawPhotos = Array.isArray(raw.photos) ? raw.photos : [];
  let discarded = 0;
  for (const item of rawPhotos) {
    const p = item as Partial<BackupPhoto>;
    if (typeof p?.id !== 'string' || typeof p?.data !== 'string' || !BASE64.test(p.data)) {
      discarded++;
      continue;
    }
    photos.push({
      id: p.id,
      type: typeof p.type === 'string' && p.type ? p.type : 'image/jpeg',
      size: typeof p.size === 'number' ? p.size : Math.floor((p.data.length * 3) / 4),
      data: p.data,
    });
  }
  if (discarded > 0) {
    report.warnings.push(
      `${discarded} ${discarded === 1 ? 'foto ilegible' : 'fotos ilegibles'} en el archivo. El resto se restaurara igualmente.`,
    );
  }
  report.photos = photos.length;
  report.photoBytes = photos.reduce((s, p) => s + p.size, 0);

  if (format < 2) {
    report.warnings.push(
      'Copia en formato antiguo: no incluia fotos de progreso. Se restaurara el resto de los datos.',
    );
  }

  /* ── integridad ── */
  if (typeof raw.checksum === 'string') {
    report.checksumOk = checksum({ data: dataObj, photos }) === raw.checksum;
    if (!report.checksumOk) {
      report.warnings.push(
        'La suma de verificacion no coincide: el archivo se edito o se transfirio con errores. Revisa el contenido antes de restaurar.',
      );
    }
  } else if (format >= 2) {
    report.warnings.push('La copia no trae suma de verificacion; no se puede comprobar su integridad.');
  }

  if (report.collections.length === 0) {
    report.errors.push('La copia esta vacia: no hay ninguna coleccion dentro.');
    return report;
  }

  report.file = {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    schema: schema ?? APP_SCHEMA_VERSION,
    appVersion: report.appVersion ?? 'desconocida',
    exportedAt: report.exportedAt ?? '',
    storeVersions:
      raw.storeVersions && typeof raw.storeVersions === 'object'
        ? (raw.storeVersions as Record<string, number>)
        : {},
    counts: {
      collections: report.collections.length,
      photos: photos.length,
      photoBytes: report.photoBytes,
    },
    checksum: typeof raw.checksum === 'string' ? raw.checksum : '',
    data: dataObj,
    photos,
  };
  report.ok = true;
  return report;
}

/* ───────────────────────────────────────────────────────── recordatorios ── */

/** Dias transcurridos desde la ultima copia. `null` si nunca se hizo una. */
export function daysSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

/**
 * Decide si toca avisar de que hay que hacer copia.
 *
 * Sin copia nunca -> avisa solo cuando ya hay algo que perder, para no molestar
 * a alguien que acaba de instalar la app.
 */
export function backupDue(input: {
  lastBackupAt: string | null;
  everyDays: number;
  entries: number;
  now?: Date;
}): boolean {
  const { lastBackupAt, everyDays, entries, now = new Date() } = input;
  if (entries < 5) return false;
  const days = daysSince(lastBackupAt, now);
  if (days == null) return true;
  return days >= everyDays;
}

/** Tamano legible. Se queda en unidades binarias, que es lo que reporta el navegador. */
export function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
