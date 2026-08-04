/**
 * Operaciones sincronizables: forma, construccion y validacion.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE OPERACIONES Y NO ESTADO
 *
 * Subir el documento entero de nutricion es la forma facil de sincronizar y la
 * forma segura de perder datos: dos dispositivos que registran comidas el mismo
 * dia se pisan la coleccion completa, y el ultimo en escribir borra el dia del
 * otro sin que nadie se entere.
 *
 * Una operacion describe un cambio sobre UNA entidad. Dos dispositivos que
 * tocan entidades distintas no compiten, y cuando compiten se resuelve entidad
 * a entidad con una regla explicita.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { COLLECTION_REGISTRY, type CollectionKey } from '../collections';
import { APP_SCHEMA_VERSION, MIN_SUPPORTED_SCHEMA, checksum } from '../versioning';
import { parseHlc } from './hlc';

/* ═══════════════════════════════════════════════════════════ colecciones ══ */

/**
 * Las colecciones que pueden sincronizarse, como tipo.
 *
 * No es una lista escrita a mano: se deriva de `sync: true` en el registro
 * central. Una coleccion que no lo declare **no compila** dentro de una
 * operacion. Es lo que impide que algo empiece a viajar al servidor porque
 * alguien lo dio por hecho.
 */
export type SyncCollectionKey = {
  [K in CollectionKey]: (typeof COLLECTION_REGISTRY)[K]['sync'] extends true ? K : never;
}[CollectionKey];

/** Las mismas, en tiempo de ejecucion, para validar lo que llega de fuera. */
export const SYNC_COLLECTION_KEYS: SyncCollectionKey[] = (
  Object.keys(COLLECTION_REGISTRY) as CollectionKey[]
).filter((k): k is SyncCollectionKey => COLLECTION_REGISTRY[k].sync);

export function isSyncCollection(value: string): value is SyncCollectionKey {
  return (SYNC_COLLECTION_KEYS as string[]).includes(value);
}

/* ══════════════════════════════════════════════════════════════ la forma ══ */

/**
 * Tres tipos, y solo tres.
 *
 * `upsert` no distingue crear de actualizar a proposito: separarlos obligaria
 * al cliente a saber si la entidad existe ya en el servidor, y sin conexion no
 * puede saberlo. Fundirlos es lo que hace que reintentar sea trivialmente
 * seguro.
 *
 * `restore` existe porque deshacer un borrado tiene que ser un acto explicito
 * con su propio momento en el tiempo. Ver `applyTo` en `conflict.ts`.
 */
export type OperationType = 'upsert' | 'delete' | 'restore';

export const OPERATION_TYPES: OperationType[] = ['upsert', 'delete', 'restore'];

export interface SyncOperation {
  /** UUID v4. Identidad global y clave de idempotencia. */
  readonly operationId: string;
  /** Dueno. `null` mientras la aplicacion funciona sin cuenta. */
  readonly userId: string | null;
  /** Que dispositivo la origino. Ultimo criterio de desempate. */
  readonly deviceId: string;
  readonly collection: SyncCollectionKey;
  readonly entityId: string;
  readonly operationType: OperationType;
  /** Los campos tocados. Vacio en `delete` y en `restore`. */
  readonly payload: Readonly<Record<string, unknown>>;
  /** Reloj logico hibrido serializado. **Esto** ordena, y nada mas. */
  readonly hlc: string;
  /**
   * Hora de pared del dispositivo al crearla.
   *
   * Informativa: sirve para mirar que paso, nunca para decidir quien gana. Si
   * algun dia alguien ordena por este campo, habra reintroducido justo el fallo
   * que el HLC existe para evitar.
   */
  readonly createdAt: string;
  readonly schemaVersion: number;
  readonly clientVersion: string;
  readonly checksum: string;
}

/* ══════════════════════════════════════════════════════════════ limites ══ */

/** Un payload mas grande que esto no es un cambio, es un error. */
export const MAX_PAYLOAD_BYTES = 64 * 1024;
/** Un lote que falla se reintenta entero: conviene que sea pequeno. */
export const MAX_BATCH_OPERATIONS = 100;
export const MAX_BATCH_BYTES = 512 * 1024;
export const MAX_PULL_OPERATIONS = 500;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/* ═════════════════════════════════════════════════════════ construccion ══ */

export type OperationDraft = Omit<SyncOperation, 'checksum'>;

/**
 * El checksum se calcula sobre la operacion canonicalizada **sin el propio
 * checksum**. Detecta corrupcion en transito y edicion a mano del archivo de
 * la outbox.
 *
 * No es criptografico: no resiste a alguien que quiera falsificar una operacion
 * a proposito. Contra eso protege RLS en el servidor, no este numero.
 */
export function operationChecksum(draft: OperationDraft): string {
  return checksum(draft);
}

/**
 * Forma canonica de una marca de tiempo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTO EXISTE, Y POR QUE ES CRITICO
 *
 * El cliente emite `2026-07-01T07:00:02.500Z`. Postgres lo guarda como
 * `timestamptz` y PostgREST lo devuelve como `2026-07-01T07:00:02.5+00:00`:
 * mismo instante, OTRA CADENA. El checksum se calcula sobre el texto, asi que
 * al reconstruir la operacion en el dispositivo receptor no coincidia y
 * `validateOperation` la descartaba.
 *
 * El resultado era el peor fallo posible de todos los imaginables aqui: la
 * sincronizacion parecia sana —sin errores, el cursor avanzando, la cola
 * vaciandose— y NO LLEGABA NADA al otro dispositivo. Silencioso y total.
 *
 * Lo encontro la auditoria de dos dispositivos contra el Supabase real: 150
 * operaciones en el servidor, cursores cuadrados, y 74 de 130 entidades.
 *
 * Normalizando aqui, el ida y vuelta por la base de datos deja la operacion
 * byte a byte como se emitio.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function canonicalTimestamp(raw: string): string {
  const ms = Date.parse(raw);
  // Una fecha ilegible se deja tal cual: ya la rechazara `validateOperation`,
  // que dira que la fecha no es valida en vez de que el checksum no cuadra.
  return Number.isNaN(ms) ? raw : new Date(ms).toISOString();
}

/**
 * Sella una operacion. Pura: el `operationId` y el `hlc` los trae quien llama.
 *
 * Normaliza `createdAt` antes de firmar. Es el unico punto donde se construye
 * una operacion —al emitirla y al reconstruirla de lo que devuelve el
 * servidor— asi que normalizar aqui garantiza que las dos den el mismo
 * checksum.
 */
export function createOperation(draft: OperationDraft): SyncOperation {
  const canonical: OperationDraft = {
    ...draft,
    createdAt: canonicalTimestamp(draft.createdAt),
  };
  return { ...canonical, checksum: operationChecksum(canonical) };
}

export function verifyChecksum(op: SyncOperation): boolean {
  const { checksum: stored, ...draft } = op;
  return operationChecksum(draft as OperationDraft) === stored;
}

/* ═══════════════════════════════════════════════════════════ validacion ══ */

/**
 * Devuelve los problemas encontrados. Lista vacia = valida.
 *
 * No lanza y no descarta. Una operacion invalida va a `dead-letter` con el
 * motivo escrito, porque tirarla en silencio es exactamente el fallo que todo
 * este subsistema existe para no cometer.
 */
export function validateOperation(op: SyncOperation): string[] {
  const problems: string[] = [];

  if (!UUID.test(op.operationId)) problems.push('operationId no es un UUID');
  if (typeof op.deviceId !== 'string' || op.deviceId.length === 0) {
    problems.push('deviceId vacio');
  }
  if (op.userId !== null && (typeof op.userId !== 'string' || op.userId.length === 0)) {
    problems.push('userId debe ser un identificador o null');
  }

  if (!isSyncCollection(op.collection)) {
    problems.push(`la coleccion "${op.collection}" no esta registrada como sincronizable`);
  }
  if (typeof op.entityId !== 'string' || op.entityId.length === 0) {
    problems.push('entityId vacio');
  }
  if (!OPERATION_TYPES.includes(op.operationType)) {
    problems.push(`tipo de operacion desconocido: "${op.operationType}"`);
  }

  /*
   * Un borrado que lleve payload significa que alguien intento colar datos por
   * una via que no los aplica. Se rechaza antes de que llegue al servidor.
   */
  if (op.operationType !== 'upsert' && Object.keys(op.payload ?? {}).length > 0) {
    problems.push(`una operacion "${op.operationType}" no puede llevar payload`);
  }
  if (op.operationType === 'upsert' && Object.keys(op.payload ?? {}).length === 0) {
    problems.push('un upsert sin campos no cambia nada');
  }

  const parsed = parseHlc(op.hlc);
  if (!parsed) problems.push('hlc ilegible');
  else if (parsed.deviceId !== op.deviceId) {
    problems.push('el hlc pertenece a otro dispositivo');
  }

  if (typeof op.createdAt !== 'string' || !ISO.test(op.createdAt)) {
    problems.push('createdAt no es una fecha ISO');
  }

  if (!Number.isInteger(op.schemaVersion)) problems.push('schemaVersion no es un entero');
  else if (op.schemaVersion < MIN_SUPPORTED_SCHEMA) {
    problems.push(`esquema ${op.schemaVersion} por debajo del minimo ${MIN_SUPPORTED_SCHEMA}`);
  } else if (op.schemaVersion > APP_SCHEMA_VERSION) {
    problems.push(
      `esquema ${op.schemaVersion} por encima del que entiende esta version (${APP_SCHEMA_VERSION}): hay que actualizar`,
    );
  }

  if (typeof op.clientVersion !== 'string' || op.clientVersion.length === 0) {
    problems.push('clientVersion vacio');
  }

  if (operationSize(op) > MAX_PAYLOAD_BYTES) {
    problems.push(`payload por encima de ${MAX_PAYLOAD_BYTES} bytes`);
  }

  if (!verifyChecksum(op)) problems.push('checksum incorrecto: la operacion viene alterada');

  return problems;
}

/** Tamano serializado del payload, en bytes. */
export function operationSize(op: SyncOperation): number {
  const text = JSON.stringify(op.payload ?? {});
  // Sin TextEncoder: el dominio no puede depender de APIs del navegador.
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i++; // par suplente: se cuenta una vez
    } else bytes += 3;
  }
  return bytes;
}

/**
 * Parte una lista de operaciones en lotes que caben.
 *
 * Respeta las dos cotas a la vez —numero y bytes— porque cien operaciones
 * pequenas y tres enormes son problemas distintos. Una operacion que por si
 * sola supera el limite de bytes viaja sola: partirla no es posible, y
 * descartarla no es una opcion.
 */
export function batchOperations(
  ops: readonly SyncOperation[],
  maxOps = MAX_BATCH_OPERATIONS,
  maxBytes = MAX_BATCH_BYTES,
): SyncOperation[][] {
  const batches: SyncOperation[][] = [];
  let current: SyncOperation[] = [];
  let bytes = 0;

  for (const op of ops) {
    const size = operationSize(op);
    if (current.length > 0 && (current.length >= maxOps || bytes + size > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(op);
    bytes += size;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * Ordena por HLC. Determinista y estable en cualquier dispositivo.
 *
 * Aplicar un conjunto de operaciones en este orden da siempre el mismo estado
 * final, llegue como llegue. Es la propiedad que hace converger el sistema.
 */
export function sortOperations(ops: readonly SyncOperation[]): SyncOperation[] {
  return [...ops].sort((a, b) => (a.hlc < b.hlc ? -1 : a.hlc > b.hlc ? 1 : 0));
}
