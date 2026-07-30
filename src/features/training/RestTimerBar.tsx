import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { formatDuration } from '@/lib/date';
import { haptic } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

/**
 * Cronometro de descanso. Vive por encima de la barra de pestanas para seguir
 * visible mientras navegas, igual que el reproductor de musica en iOS.
 */
export function RestTimerBar() {
  const restEndsAt = useUIStore((s) => s.restEndsAt);
  const restTotal = useUIStore((s) => s.restTotal);
  const stopRest = useUIStore((s) => s.stopRest);
  const startRest = useUIStore((s) => s.startRest);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!restEndsAt) return;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [restEndsAt]);

  useEffect(() => {
    if (!restEndsAt) return;
    const left = restEndsAt - Date.now();
    if (left <= 0) return;
    const id = setTimeout(() => haptic(60), left);
    return () => clearTimeout(id);
  }, [restEndsAt]);

  if (!restEndsAt) return null;

  const remaining = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
  const progress = restTotal > 0 ? 1 - remaining / restTotal : 1;
  const done = remaining === 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.2rem+env(safe-area-inset-bottom))] z-40 px-3">
      <div className="mx-auto flex max-w-lg items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface2/95 px-4 py-2.5 shadow-xl shadow-black/40 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-muted">{done ? 'Descanso terminado' : 'Descanso'}</span>
            <span className="text-[17px] font-bold tabular">{formatDuration(remaining)}</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${progress * 100}%`, transition: 'width 250ms linear' }}
            />
          </div>
        </div>
        <button
          onClick={() => startRest(remaining + 30)}
          className="pressable flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-muted"
          aria-label="Anadir 30 segundos"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={stopRest}
          className="pressable flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-muted"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
