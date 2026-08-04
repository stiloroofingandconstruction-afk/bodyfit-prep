/**
 * Adaptador local: no hay servidor.
 *
 * Es la red de seguridad, y se usa en dos situaciones distintas:
 *
 *   · El flag pide sincronizar pero no hay configuracion de Supabase. Un
 *     despliegue mal configurado debe dejar la aplicacion como estaba, no
 *     inservible.
 *   · Pruebas y desarrollo, para ejercitar el motor entero sin servidor.
 *
 * Con el flag en `disabled` —produccion— ni siquiera se llega hasta aqui:
 * `store/syncRecorder.ts` sale antes de importar el motor, asi que no se abre
 * la base de datos de la cola ni se escribe un solo byte. Un usuario que ya
 * tiene la aplicacion instalada no nota absolutamente ningun cambio.
 */
import type {
  DeviceInfo,
  HealthStatus,
  PullResult,
  PushResult,
  SyncAdapter,
} from './types';
import type { SyncOperation } from '@bodyfit/domain/sync/operations';

export const localOnlyAdapter: SyncAdapter = {
  name: 'local',

  /**
   * Todo se da por bueno.
   *
   * Sin servidor, la operacion ya esta donde tiene que estar: el cambio se
   * aplico en el store local antes de encolarse. Confirmarla permite que la
   * cola se pode y no crezca sin limite en un dispositivo que nunca va a
   * sincronizar.
   */
  async pushOperations(batch: readonly SyncOperation[]): Promise<PushResult> {
    return {
      results: batch.map((op) => ({ operationId: op.operationId, status: 'applied' as const })),
      serverSeq: '0',
    };
  },

  async pullOperations(cursor: string): Promise<PullResult> {
    return { operations: [], cursor, hasMore: false };
  },

  async acknowledgeOperations(): Promise<void> {},

  async getCursor(): Promise<string> {
    return '0';
  },

  async setCursor(): Promise<void> {},

  async registerDevice(_info: DeviceInfo): Promise<void> {},

  async healthCheck(): Promise<HealthStatus> {
    return {
      reachable: true,
      serverSchema: null,
      detail: 'sin servidor: los datos viven solo en este dispositivo',
    };
  },
};
