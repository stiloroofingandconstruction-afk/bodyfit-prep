/**
 * Contrato del transporte de sincronizacion.
 *
 * Minimo a proposito: siete metodos. Todo lo que decide —el orden, quien gana
 * un conflicto, cuando reintentar— vive en el dominio y en el motor. Un
 * adaptador solo mueve operaciones de un lado a otro.
 *
 * Hay dos implementaciones y las dos son de produccion: `LocalOnlyAdapter` es
 * lo que corre hoy y `SupabaseSyncAdapter` lo que correra cuando se active el
 * feature flag.
 */
import type { SyncOperation } from '@bodyfit/domain/sync/operations';

/**
 * Estado de una operacion segun el servidor.
 *
 * `duplicate` **no es un error**: significa que ya habia llegado, y el cliente
 * puede confirmarla igual. Se distingue de `applied` para el diagnostico, no
 * para decidir nada.
 */
export type OperationStatus = 'applied' | 'duplicate' | 'rejected';

export interface OperationResult {
  readonly operationId: string;
  readonly status: OperationStatus;
  readonly reason?: string;
}

export interface PushResult {
  /**
   * Resultado POR OPERACION, nunca un booleano de lote.
   *
   * Si el servidor procesa 60 de 100 y se cae, hay que poder confirmar esas 60
   * exactamente. Confirmar el lote entero perderia 40 operaciones; no confirmar
   * ninguna las reenviaria todas, cosa que la idempotencia absorbe pero que
   * gasta bateria y datos sin motivo.
   */
  readonly results: readonly OperationResult[];
  /** Secuencia del servidor tras aplicar el lote. */
  readonly serverSeq: string;
}

export interface PullResult {
  readonly operations: readonly SyncOperation[];
  readonly cursor: string;
  /** Quedan mas: hay que volver a pedir. */
  readonly hasMore: boolean;
}

export interface DeviceInfo {
  readonly deviceId: string;
  readonly label: string;
  readonly platform: string;
  readonly clientVersion: string;
}

export interface HealthStatus {
  readonly reachable: boolean;
  /** Version de esquema que entiende el servidor. */
  readonly serverSchema: number | null;
  readonly detail: string;
}

export interface SyncAdapter {
  readonly name: string;
  pushOperations(batch: readonly SyncOperation[]): Promise<PushResult>;
  pullOperations(cursor: string, limit: number): Promise<PullResult>;
  acknowledgeOperations(operationIds: readonly string[]): Promise<void>;
  getCursor(): Promise<string>;
  setCursor(cursor: string): Promise<void>;
  registerDevice(info: DeviceInfo): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}

/**
 * Valida un cursor.
 *
 * Un cursor es un entero no negativo en decimal. Se maneja como cadena y no
 * como numero porque es un `bigint` de Postgres: por encima de 2^53 un `number`
 * de JavaScript empieza a perder precision en silencio, y un cursor impreciso
 * salta operaciones.
 *
 * Ante cualquier duda devuelve `null`, y quien llama reinicia a cero. Releer de
 * mas es lento; leer de menos pierde datos.
 */
export function validateCursor(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  if (!/^\d{1,19}$/.test(raw)) return null;
  return raw.replace(/^0+(?=\d)/, '');
}

export function compareCursor(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}
