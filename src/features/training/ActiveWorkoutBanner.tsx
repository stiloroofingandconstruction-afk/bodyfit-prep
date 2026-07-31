import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { useTrainingStore } from '@/store/trainingStore';
import { useUIStore } from '@/store/uiStore';
import { t } from '@/i18n';

/** Aviso persistente de que hay un entreno abierto. */
export function ActiveWorkoutBanner() {
  const active = useTrainingStore((s) => s.active);
  const resting = useUIStore((s) => s.restEndsAt);
  const { pathname } = useLocation();

  if (!active || pathname.startsWith('/entrenamiento/activo')) return null;

  const done = active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const total = active.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <div
      className="fixed inset-x-0 z-40 px-3"
      style={{ bottom: resting ? 'calc(7.6rem + env(safe-area-inset-bottom))' : 'calc(4.2rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        to="/entrenamiento/activo"
        className="pressable mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-brand/30 bg-brand/12 px-4 py-2.5 backdrop-blur-xl"
      >
        <Dumbbell size={17} className="shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-brand">{active.name}</p>
          <p className="text-[11px] text-muted">
            {t('ex.setsCompleted', { done, total })}
          </p>
        </div>
        <ChevronRight size={17} className="shrink-0 text-brand" />
      </Link>
    </div>
  );
}
