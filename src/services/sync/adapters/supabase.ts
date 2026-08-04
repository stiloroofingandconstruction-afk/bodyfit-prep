/**
 * Adaptador de Supabase.
 *
 * Habla con las funciones SQL de `supabase/migrations/0003_sync_functions.sql`
 * por PostgREST. No usa `@supabase/supabase-js`: para siete llamadas RPC y una
 * sesion, `fetch` basta y el cliente oficial pesa ~40 KB comprimidos que se
 * descargarian aunque la sincronizacion este desactivada, que es el caso de
 * todos los usuarios hoy.
 *
 * Cuando haga falta Realtime o Storage se anadira el cliente oficial en un
 * chunk diferido; el contrato de este archivo no cambiara.
 */
import {
  compareCursor,
  validateCursor,
  type DeviceInfo,
  type HealthStatus,
  type OperationResult,
  type PullResult,
  type PushResult,
  type SyncAdapter,
} from './types';
import { createOperation, type SyncOperation } from '@bodyfit/domain/sync/operations';
import { currentSession } from '../auth';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Sin configuracion no hay adaptador: quien lo seleccione recibe el local. */
export const SUPABASE_CONFIGURED = Boolean(URL && ANON);

/** Un intento que no responde en 20 s se da por perdido y se reintenta. */
const TIMEOUT_MS = 20_000;

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!SUPABASE_CONFIGURED) throw new Error('Supabase no configurado');

  const session = currentSession();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON!,
        Authorization: `Bearer ${session?.accessToken ?? ANON}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      /*
       * Se distingue 4xx de 5xx porque el motor los trata distinto: un 5xx se
       * reintenta con backoff, un 4xx no se arregla reintentando y la operacion
       * va a dead-letter con el motivo.
       */
      const kind = res.status >= 500 ? 'servidor' : 'peticion';
      throw new Error(`${kind} ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ══════════════════════════════════════════════════════ forma de las filas ══ */

interface PushRow {
  operation_id: string;
  status: string;
  reason: string | null;
}

interface PullRow {
  operation_id: string;
  seq: number | string;
  device_id: string;
  collection: string;
  entity_id: string;
  operation_type: string;
  payload: Record<string, unknown>;
  hlc: string;
  created_at: string;
  schema_version: number;
  client_version: string;
  checksum: string;
}

/**
 * Reconstruye la operacion tal y como la escribio el dispositivo de origen.
 *
 * El `checksum` viaja y se conserva: es lo que permite comprobar en el cliente
 * receptor que lo que llego es exactamente lo que se emitio. Se copia tal cual
 * en vez de recalcularlo — recalcularlo lo haria pasar siempre y no comprobaria
 * nada.
 */
function toOperation(row: PullRow, userId: string | null): SyncOperation {
  const rebuilt = createOperation({
    operationId: row.operation_id,
    userId,
    deviceId: row.device_id,
    collection: row.collection as SyncOperation['collection'],
    entityId: row.entity_id,
    operationType: row.operation_type as SyncOperation['operationType'],
    payload: row.payload ?? {},
    hlc: row.hlc,
    createdAt: row.created_at,
    schemaVersion: row.schema_version,
    clientVersion: row.client_version,
  });
  return { ...rebuilt, checksum: row.checksum };
}

/* ═════════════════════════════════════════════════════════════ adaptador ══ */

export const supabaseSyncAdapter: SyncAdapter = {
  name: 'supabase',

  async pushOperations(batch: readonly SyncOperation[]): Promise<PushResult> {
    const rows = await rpc<PushRow[]>('sync_push', { p_ops: batch });

    const results: OperationResult[] = rows.map((row) => ({
      operationId: row.operation_id,
      status:
        row.status === 'applied'
          ? 'applied'
          : row.status === 'duplicate'
            ? 'duplicate'
            : 'rejected',
      ...(row.reason ? { reason: row.reason } : {}),
    }));

    return { results, serverSeq: '0' };
  },

  async pullOperations(cursor: string, limit: number): Promise<PullResult> {
    const session = currentSession();
    const rows = await rpc<PullRow[]>('sync_pull', {
      p_cursor: Number(cursor),
      p_limit: limit,
    });

    const operations = rows.map((row) => toOperation(row, session?.userId ?? null));

    /*
     * El cursor nuevo es el `seq` mayor de la pagina, no `cursor + rows.length`.
     * Contar filas asume que no hay huecos, y aunque la secuencia por usuario no
     * los tenga hoy, apoyarse en eso convertiria una futura poda del log en una
     * perdida de operaciones.
     */
    const last = rows.reduce((max, row) => {
      const seq = String(row.seq);
      return compareCursor(seq, max) > 0 ? seq : max;
    }, cursor);

    return {
      operations,
      cursor: validateCursor(last) ?? cursor,
      hasMore: rows.length >= limit,
    };
  },

  /**
   * No hay nada que confirmar contra el servidor.
   *
   * La confirmacion es la respuesta de `sync_push`: si dijo `applied` o
   * `duplicate`, la operacion esta guardada. Una segunda llamada solo anadiria
   * un viaje de red y una forma nueva de fallar.
   */
  async acknowledgeOperations(): Promise<void> {},

  async getCursor(): Promise<string> {
    const { deviceId } = await import('../identity');
    const value = await rpc<number | string>('sync_get_cursor', {
      p_device_id: deviceId(),
    });
    return validateCursor(String(value ?? 0)) ?? '0';
  },

  async setCursor(cursor: string): Promise<void> {
    const { deviceId } = await import('../identity');
    await rpc<null>('sync_set_cursor', {
      p_device_id: deviceId(),
      p_cursor: Number(cursor),
    });
  },

  async registerDevice(info: DeviceInfo): Promise<void> {
    await rpc<null>('register_device', {
      p_device_id: info.deviceId,
      p_label: info.label,
      p_platform: info.platform,
      p_client_version: info.clientVersion,
    });
  },

  async healthCheck(): Promise<HealthStatus> {
    if (!SUPABASE_CONFIGURED) {
      return { reachable: false, serverSchema: null, detail: 'sin configurar' };
    }
    try {
      const rows = await rpc<{ server_schema: number }[]>('sync_health', {});
      const schema = rows[0]?.server_schema ?? null;
      return { reachable: true, serverSchema: schema, detail: `esquema ${schema}` };
    } catch (err) {
      return { reachable: false, serverSchema: null, detail: String(err) };
    }
  },
};
