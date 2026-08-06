import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Download, RotateCcw } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDeviceTestStore } from '@/store/deviceTestStore';
import {
  applyAdapterSelection,
  currentClock,
  initSync,
  outboxEntries,
  subscribeToSync,
  syncStatus,
} from '@/services/sync';
import { syncNow } from '@/services/sync/scheduler';
import { PASOS } from './twoDeviceSteps';
import { download } from '@/lib/utils';
import { toast } from '@/store/uiStore';

/**
 * Guion de la prueba con dos dispositivos, para seguirlo con el movil en la
 * mano.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NINGUN PASO SE MARCA SOLO
 *
 * La aplicacion no puede marcar sus propias casillas. Si pudiera, la lista
 * dejaria de significar nada: diria que la sincronizacion esta validada porque
 * el codigo cree que lo esta, que es exactamente lo que esta prueba existe para
 * no aceptar.
 *
 * Lo que si hace la pantalla es enseñar el estado real —cursor, pendientes,
 * reloj— al lado del paso, para no tener que ir a buscarlo a otra pantalla y
 * volver.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function TwoDeviceTestPage() {
  const { checked, toggle, reset } = useDeviceTestStore();
  const [status, setStatus] = useState(() => syncStatus());
  const [indice, setIndice] = useState(() => {
    const primero = PASOS.findIndex((p) => !useDeviceTestStore.getState().checked[p.id]);
    return primero === -1 ? 0 : primero;
  });

  const refresh = useCallback(() => setStatus(syncStatus()), []);

  useEffect(() => {
    applyAdapterSelection();
    void initSync().then(refresh);
    return subscribeToSync(refresh);
  }, [refresh]);

  const paso = PASOS[indice];
  const hechos = PASOS.filter((p) => checked[p.id]).length;
  const completo = hechos === PASOS.length;

  const exportar = () => {
    /*
     * Solo estado, nunca contenido. Este archivo se manda por correo cuando
     * algo falla, y un payload de esta aplicacion lleva pesos, calorias y notas
     * personales: son datos de salud.
     */
    const entries = outboxEntries();
    download(
      `bodyfit-qa-2disp-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(
        {
          generado: new Date().toISOString(),
          dispositivo: status.deviceId,
          reloj: currentClock(),
          cursor: status.cursor,
          esquema: status.schemaVersion,
          adaptador: status.adapter,
          ultimaSincronizacion: status.lastSyncAt,
          cola: status.outbox,
          pasos: PASOS.map((p) => ({
            id: p.id,
            grupo: p.grupo,
            dispositivo: p.dispositivo,
            hecho: Boolean(checked[p.id]),
          })),
          operaciones: entries.map((e) => ({
            coleccion: e.operation.collection,
            tipo: e.operation.operationType,
            estado: e.state,
            intentos: e.attempts,
            error: e.lastError,
          })),
        },
        null,
        2,
      ),
      'application/json',
    );
  };

  return (
    <>
      <PageHeader
        back
        title="Prueba de dos dispositivos"
        subtitle={`${hechos} de ${PASOS.length} pasos`}
      />

      <Page>
        {/* ═════════════════════════════════════════════════ progreso ══ */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface2"
          role="progressbar"
          aria-valuenow={hechos}
          aria-valuemin={0}
          aria-valuemax={PASOS.length}
        >
          <div
            className="h-full rounded-full bg-brand transition-[width]"
            style={{ width: `${(hechos / PASOS.length) * 100}%` }}
          />
        </div>

        {completo && (
          <Card className="mt-4">
            <p className="text-sm font-medium text-brand">Los 33 pasos estan marcados.</p>
            <p className="mt-1 text-xs text-faint">
              Solo ahora tiene sentido plantearse mover el flag de produccion. Hasta este
              momento la sincronizacion estaba probada contra servidores, que no es lo mismo
              que probada.
            </p>
          </Card>
        )}

        {/* ══════════════════════════════════════════════ paso actual ══ */}
        <SectionTitle>{paso.grupo}</SectionTitle>
        <Card>
          <div className="flex items-start gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                paso.dispositivo === 'ambos'
                  ? 'bg-warn/15 text-warn'
                  : 'bg-brand/15 text-brand'
              }`}
            >
              {paso.dispositivo === 'ambos' ? 'A+B' : paso.dispositivo}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-faint">
                Paso {indice + 1} de {PASOS.length}
              </p>
              <p className="mt-1 text-[15px] font-medium">{paso.instruccion}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-surface2 p-3">
            <p className="text-xs font-medium text-faint">Tiene que pasar esto</p>
            <p className="mt-1 text-sm">{paso.esperado}</p>
          </div>

          {paso.porque && <p className="mt-2 text-xs text-faint">{paso.porque}</p>}

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant={checked[paso.id] ? 'secondary' : 'primary'}
              onClick={() => {
                toggle(paso.id);
                if (!checked[paso.id] && indice < PASOS.length - 1) setIndice(indice + 1);
              }}
            >
              <Check size={16} />
              {checked[paso.id] ? 'Desmarcar' : 'Marcar como hecho'}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              className="flex items-center gap-1 text-xs text-faint disabled:opacity-40"
              onClick={() => setIndice(Math.max(0, indice - 1))}
              disabled={indice === 0}
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              className="flex items-center gap-1 text-xs text-faint disabled:opacity-40"
              onClick={() => setIndice(Math.min(PASOS.length - 1, indice + 1))}
              disabled={indice === PASOS.length - 1}
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </Card>

        {/* ═════════════════════════════════════ estado en directo ══ */}
        <SectionTitle>Estado de este dispositivo</SectionTitle>
        <Card>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-faint">Dispositivo</dt>
            <dd className="truncate text-right font-mono">{status.deviceId.slice(0, 13)}</dd>
            <dt className="text-faint">Cursor</dt>
            <dd className="text-right font-mono">{status.cursor}</dd>
            <dt className="text-faint">Pendientes</dt>
            <dd className="text-right font-mono">
              {status.outbox.pending + status.outbox.failed}
            </dd>
            <dt className="text-faint">Sin salida</dt>
            <dd
              className={`text-right font-mono ${status.outbox.deadLetter > 0 ? 'text-danger' : ''}`}
            >
              {status.outbox.deadLetter}
            </dd>
            <dt className="text-faint">Adaptador</dt>
            <dd className="text-right">{status.adapter}</dd>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void syncNow().then(refresh)}>
              Sincronizar ahora
            </Button>
            <Button variant="ghost" onClick={exportar}>
              <Download size={16} /> Diagnostico
            </Button>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════ lista completa ══ */}
        <SectionTitle>Todos los pasos</SectionTitle>
        <Card>
          <ul className="space-y-1">
            {PASOS.map((p, i) => (
              <li key={p.id}>
                <button
                  onClick={() => setIndice(i)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                    i === indice ? 'bg-surface2' : ''
                  }`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded ${
                      checked[p.id] ? 'bg-brand text-white' : 'border border-line'
                    }`}
                  >
                    {checked[p.id] && <Check size={11} />}
                  </span>
                  <span className={`truncate ${checked[p.id] ? 'text-faint line-through' : ''}`}>
                    {i + 1}. {p.instruccion}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                setIndice(0);
                toast('Progreso reiniciado');
              }}
            >
              <RotateCcw size={16} /> Empezar de cero
            </Button>
          </div>
        </Card>
      </Page>
    </>
  );
}
