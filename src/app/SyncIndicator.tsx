import { useEffect, useState } from 'react';
import { CloudOff } from 'lucide-react';
import { syncEnabled } from '@/services/sync/flag';
import type { SyncStatus } from '@/services/sync/engine';

/**
 * Indicador de estado de sincronizacion.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL SILENCIO ES LA SENAL
 *
 * Sincronizado: no se ve nada. Una aplicacion que anuncia constantemente que
 * todo va bien ensena a la gente a ignorar sus avisos, y el dia que pasa algo
 * de verdad nadie lo lee.
 *
 * Solo aparece cuando hay algo que la persona podria querer saber: que tiene
 * cambios sin enviar, o que algo lleva un rato sin poder salir.
 *
 * Con la sincronizacion apagada —produccion hoy— devuelve `null` y no ocupa un
 * pixel. No hay ningun cambio visual para los usuarios actuales.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  /*
   * El motor se importa solo si hace falta.
   *
   * Este componente vive en el Layout, que se carga siempre. Un import estatico
   * de `@/services/sync` traeria el motor, la cola y el adaptador de Supabase al
   * chunk de arranque, y los descargaria todo el mundo — incluidos los usuarios
   * para los que la sincronizacion esta apagada, que hoy son todos. Es la misma
   * regla que saco los catalogos del arranque en D4.
   */
  useEffect(() => {
    if (!syncEnabled()) return;
    let unsubscribe: (() => void) | undefined;
    let alive = true;

    void import('@/services/sync/engine').then((engine) => {
      if (!alive) return;
      const refresh = () => setStatus(engine.syncStatus());
      refresh();
      unsubscribe = engine.subscribeToSync(refresh);
    });

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  if (!status || !status.enabled) return null;

  const { pending, failed, deadLetter } = status.outbox;
  const sinEnviar = pending + failed;
  const atascado = deadLetter > 0;

  // Todo confirmado y nada atascado: no hay nada que contar.
  if (sinEnviar === 0 && !atascado) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${
        atascado ? 'bg-danger/10 text-danger' : 'bg-surface2 text-faint'
      }`}
    >
      {!status.online && <CloudOff size={12} aria-hidden />}
      <span>
        {atascado
          ? `${deadLetter} sin enviar`
          : status.online
            ? `${sinEnviar} pendiente${sinEnviar === 1 ? '' : 's'}`
            : `Sin conexion · ${sinEnviar}`}
      </span>
    </div>
  );
}
