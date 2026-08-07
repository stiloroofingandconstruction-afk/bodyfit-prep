import { useCallback, useEffect, useState } from 'react';
import { CloudOff, RefreshCw, TriangleAlert, Wifi } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import {
  SYNC_FLAGS,
  SYNC_FLAG_LABEL,
  applyAdapterSelection,
  checkServer,
  currentClock,
  initSync,
  outboxEntries,
  retryDeadLetter,
  setSyncFlag,
  subscribeToSync,
  syncFlag,
  syncStatus,
  type SyncFlag,
} from '@/services/sync';
import { syncNow } from '@/services/sync/scheduler';
import { download } from '@/lib/utils';
import { fmtDateTime } from '@/lib/date';
import { toast } from '@/store/uiStore';

/**
 * Diagnostico de sincronizacion. Solo en modo desarrollador.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUE NO SE REGISTRA AQUI
 *
 * El contenido de las operaciones. Ni en pantalla, ni en el archivo que se
 * descarga. Un payload de esta aplicacion lleva pesos corporales, medidas,
 * calorias y notas personales: son datos de salud, y un diagnostico que la
 * persona pueda enviar por correo para pedir ayuda no puede llevarlos dentro.
 *
 * Se muestran identificadores, colecciones, estados, tamanos y momentos. Con
 * eso se depura una cola atascada; con el payload no se depura mejor.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function SyncDiagnosticsPage() {
  const [, force] = useState(0);
  const [status, setStatus] = useState(() => syncStatus());
  const [servidor, setServidor] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setStatus(syncStatus());
    force((n) => n + 1);
  }, []);

  useEffect(() => {
    /*
     * La seleccion de adaptador se aplica aqui y no al arrancar la aplicacion.
     *
     * Elegirlo al arranque obligaria a importar el adaptador de Supabase desde
     * codigo que se carga siempre, y viajaria en el chunk de arranque de todo
     * el mundo. Esta pantalla es una ruta diferida y solo existe en modo
     * desarrollador: es el sitio correcto para decidirlo.
     */
    applyAdapterSelection();
    void initSync().then(refresh);
    /*
     * El esquema del SERVIDOR, no el nuestro. Cuando los dos no coinciden es
     * exactamente lo que rompe una sincronizacion, y ensenar solo el del
     * cliente hacia imposible verlo.
     */
    void checkServer().then((h) =>
      setServidor(h.reachable ? `esquema ${h.serverSchema ?? '?'}` : `sin respuesta · ${h.detail}`),
    );
    return subscribeToSync(refresh);
  }, [refresh]);

  const entries = outboxEntries();
  const dead = entries.filter((e) => e.state === 'dead-letter');

  const exportDiagnostics = () => {
    /*
     * El archivo lleva la MISMA informacion que la pantalla: sin payload.
     * `operation` se descompone campo a campo a proposito, para que anadir un
     * campo nuevo a la operacion no lo cuele aqui sin que nadie lo decida.
     */
    const report = {
      generado: new Date().toISOString(),
      adaptador: status.adapter,
      flag: syncFlag(),
      dispositivo: status.deviceId,
      reloj: currentClock(),
      cursor: status.cursor,
      esquema: status.schemaVersion,
      ultimaSincronizacion: status.lastSyncAt,
      ultimoError: status.lastError,
      relojRemotoSospechoso: status.clockSuspect,
      cola: status.outbox,
      operaciones: entries.map((e) => ({
        id: e.operation.operationId,
        coleccion: e.operation.collection,
        tipo: e.operation.operationType,
        estado: e.state,
        intentos: e.attempts,
        hlc: e.operation.hlc,
        error: e.lastError,
      })),
    };
    download(
      `bodyfit-sync-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(report, null, 2),
      'application/json',
    );
  };

  const changeFlag = (flag: SyncFlag) => {
    setSyncFlag(flag);
    const adapter = applyAdapterSelection();
    refresh();
    toast(`Sincronizacion: ${flag} · adaptador ${adapter.name}`);
  };

  return (
    <>
      <PageHeader
        back
        title="Sincronizacion"
        subtitle="Diagnostico interno. No es una funcion del producto."
      />

      <Page>
        {/* ══════════════════════════════════════════════════════ estado ══ */}
        <SectionTitle>Estado</SectionTitle>
        <Card>
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                status.enabled ? 'bg-brand/15 text-brand' : 'bg-surface2 text-faint'
              }`}
            >
              {status.enabled ? <Wifi size={20} /> : <CloudOff size={20} />}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">
                {status.enabled
                  ? `Activa · adaptador ${status.adapter}`
                  : 'Desactivada · los datos viven solo en este dispositivo'}
              </p>
              <p className="mt-1 text-xs text-faint">
                {status.online ? 'Con conexion' : 'Sin conexion'} ·{' '}
                {status.lastSyncAt
                  ? `ultima vez ${fmtDateTime(new Date(status.lastSyncAt).toISOString())}`
                  : 'nunca sincronizado'}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Row label="Dispositivo" value={status.deviceId.slice(0, 13)} />
            <Row label="Cursor" value={status.cursor} />
            <Row label="Esquema (cliente)" value={String(status.schemaVersion)} />
            <Row label="Servidor" value={servidor ?? 'comprobando...'} />
            <Row label="Reloj" value={currentClock().slice(0, 24)} />
          </dl>

          {status.lastError && (
            <p className="mt-3 rounded-lg bg-danger/10 p-2 text-xs text-danger">
              {status.lastError}
            </p>
          )}
          {status.clockSuspect && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-warn/10 p-2 text-xs text-warn">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" />
              Algun dispositivo remoto tiene el reloj muy desviado. Sus cambios se
              aceptan, pero su hora no se ha adoptado.
            </p>
          )}
        </Card>

        {/* ════════════════════════════════════════════════════════ cola ══ */}
        <SectionTitle>Cola de salida</SectionTitle>
        <Card>
          <dl className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="Pendientes" value={status.outbox.pending} />
            <Stat label="Enviando" value={status.outbox.sending} />
            <Stat label="Fallidas" value={status.outbox.failed} />
            <Stat label="Confirmadas" value={status.outbox.acknowledged} />
            <Stat label="Sin salida" value={status.outbox.deadLetter} danger />
            <Stat label="Total" value={status.outbox.total} />
          </dl>

          {status.outbox.overWarnSize && (
            <p className="mt-3 rounded-lg bg-warn/10 p-2 text-xs text-warn">
              La cola tiene mas de 10.000 operaciones sin confirmar. No se ha
              descartado ninguna; conviene revisar por que no salen.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => void syncNow().then(refresh)}>
              <RefreshCw size={16} /> Sincronizar ahora
            </Button>
            <Button variant="ghost" onClick={exportDiagnostics}>
              Descargar diagnostico
            </Button>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════ sin salida ══ */}
        <SectionTitle>Operaciones sin salida</SectionTitle>
        {dead.length === 0 ? (
          <EmptyState title="Ninguna" description="Nada se ha quedado atascado." />
        ) : (
          <Card>
            <p className="mb-3 text-xs text-faint">
              Estas operaciones agotaron los reintentos o no eran validas.{' '}
              <b>No se han descartado</b>: siguen aqui con el motivo, y se pueden
              reintentar.
            </p>
            <ul className="space-y-2">
              {dead.map((e) => (
                <li key={e.operation.operationId} className="rounded-lg bg-surface2 p-2 text-xs">
                  <p className="font-mono">
                    {e.operation.collection} · {e.operation.operationType}
                  </p>
                  <p className="mt-1 text-faint">{e.lastError}</p>
                  <button
                    className="mt-2 text-brand underline"
                    onClick={() => void retryDeadLetter(e.operation.operationId).then(refresh)}
                  >
                    Reintentar
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════ flag ══ */}
        <SectionTitle>Modo</SectionTitle>
        <Card>
          <p className="mb-3 text-xs text-faint">
            Produccion va en <b>disabled</b>. No se cambia hasta que exista una
            prueba real en dos dispositivos fisicos.
          </p>
          <div className="space-y-2">
            {SYNC_FLAGS.map((flag) => (
              <button
                key={flag}
                onClick={() => changeFlag(flag)}
                className={`w-full rounded-lg p-2 text-left text-xs ${
                  syncFlag() === flag ? 'bg-brand/15 text-brand' : 'bg-surface2'
                }`}
              >
                <span className="font-medium">{flag}</span>
                <span className="block text-faint">{SYNC_FLAG_LABEL[flag]}</span>
              </button>
            ))}
          </div>
        </Card>
      </Page>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-faint">{label}</dt>
      <dd className="truncate text-right font-mono">{value}</dd>
    </>
  );
}

function Stat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-surface2 p-2">
      <p className={`text-lg font-semibold ${danger && value > 0 ? 'text-danger' : ''}`}>{value}</p>
      <p className="text-faint">{label}</p>
    </div>
  );
}
