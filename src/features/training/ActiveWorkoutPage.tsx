import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, ChevronDown, Flag, Plus, Timer, Trash2, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Segmented } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { ExercisePickerSheet } from './ExercisePickerSheet';
import { TechniqueSheet } from '@/features/exercises/TechniqueSheet';
import { estimate1RM, personalRecords, workoutVolume } from '@/domain/training';
import { formatDuration } from '@/lib/date';
import { cx, haptic } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { useTrainingStore } from '@/store/trainingStore';
import { useWorkouts } from '@/store/selectors';
import { useUIStore } from '@/store/uiStore';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';
import type { WorkoutSet } from '@/domain/types';

export default function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const active = useTrainingStore((s) => s.active);
  const addExercise = useTrainingStore((s) => s.addExercise);
  const removeExercise = useTrainingStore((s) => s.removeExercise);
  const replaceExercise = useTrainingStore((s) => s.replaceExercise);
  const addSet = useTrainingStore((s) => s.addSet);
  const updateSet = useTrainingStore((s) => s.updateSet);
  const removeSet = useTrainingStore((s) => s.removeSet);
  const finishWorkout = useTrainingStore((s) => s.finishWorkout);
  const discardWorkout = useTrainingStore((s) => s.discardWorkout);
  const startRest = useUIStore((s) => s.startRest);
  const u = useUnits();

  const history = useWorkouts();
  const prs = useMemo(() => personalRecords(history), [history]);

  const [picking, setPicking] = useState(false);
  const [techniqueFor, setTechniqueFor] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [rating, setRating] = useState(3);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      navigate('/entrenamiento', { replace: true });
      return;
    }
    const start = new Date(active.startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [active, navigate]);

  if (!active) return null;

  const doneSets = active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.exercises.reduce((n, e) => n + e.sets.length, 0);
  const volume = workoutVolume({ ...active, exercises: active.exercises });

  const toggleDone = (exId: string, set: WorkoutSet, restSeconds?: number) => {
    const next = !set.done;
    updateSet(exId, set.id, { done: next });
    if (next) {
      haptic(12);
      if (restSeconds) startRest(restSeconds);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/* ----------------------------------------------------- cabecera -- */}
      <header className="sticky top-0 z-30 border-b border-line bg-base/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => navigate('/entrenamiento')}
            className="pressable -ml-1 flex size-9 items-center justify-center rounded-full bg-surface2 text-muted"
            aria-label={t('tr.minimize')}
          >
            <ChevronDown size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] leading-tight font-bold">{active.name}</h1>
            <p className="text-[12px] tabular text-muted">
              {formatDuration(elapsed)} · {doneSets}/{totalSets} {t('home.sets')} ·{' '}
              {t('tr.volumeOf', { weight: `${u.numWeight(volume, 0)} ${u.w}` })}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setFinishing(true)}>
            <Flag size={14} />
            {t('tr.finish')}
          </Button>
        </div>
      </header>

      {/* ---------------------------------------------------- ejercicios -- */}
      <main className="scroll-momentum mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4 pb-40">
        {active.exercises.length === 0 && (
          <EmptyState
            title={t('tr.emptySession')}
            description={t('tr.addExerciseDesc')}
            action={
              <Button variant="primary" onClick={() => setPicking(true)}>
                <Plus size={16} /> {t('tr.addExercise')}
              </Button>
            }
          />
        )}

        <div className="space-y-4">
          {active.exercises.map((ex) => {
            const pr = prs.get(ex.exerciseId);
            return (
              <div key={ex.id} className="card overflow-hidden">
                <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">{ex.exerciseName}</h2>
                    {pr && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
                        <TrendingUp size={11} />
                        {t('tr.record')}: {u.numWeight(pr.weight)} {u.w} × {pr.reps} (
                        {u.fmtWeight(pr.e1rm)} 1RM)
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setTechniqueFor(ex.exerciseId)}
                      className="pressable flex h-8 items-center gap-1 rounded-lg bg-surface2 px-2 text-[11px] font-medium text-brand"
                    >
                      <BookOpen size={13} />
                      {t('tr.viewTechnique')}
                    </button>
                    {ex.restSeconds && (
                      <button
                        onClick={() => startRest(ex.restSeconds!)}
                        className="pressable flex size-8 items-center justify-center rounded-lg bg-surface2 text-muted"
                        aria-label={t('tr.startRest')}
                      >
                        <Timer size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="pressable flex size-8 items-center justify-center rounded-lg bg-surface2 text-faint"
                      aria-label={t('tr.removeExercise')}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 px-1 text-[10px] tracking-wider text-faint uppercase">
                    <span>{t('tr.setColumn')}</span>
                    <span className="text-center">{u.w}</span>
                    <span className="text-center">{t('tr.repsColumn')}</span>
                    <span className="text-center">1RM</span>
                    <span />
                  </div>

                  {ex.sets.map((set, i) => {
                    const e1rm = estimate1RM(set.weight, set.reps);
                    const isPR = pr ? e1rm > pr.e1rm && set.done : e1rm > 0 && set.done;
                    return (
                      <div
                        key={set.id}
                        className={cx(
                          'grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 rounded-xl px-1 py-1.5',
                          set.done && 'bg-brand/8',
                        )}
                      >
                        <button
                          onClick={() =>
                            updateSet(ex.id, set.id, {
                              type: set.type === 'calentamiento' ? 'normal' : 'calentamiento',
                            })
                          }
                          className={cx(
                            'flex size-7 items-center justify-center rounded-lg text-[12px] font-semibold',
                            set.type === 'calentamiento'
                              ? 'bg-amber/15 text-amber'
                              : 'bg-surface2 text-muted',
                          )}
                          title={t('tr.markWarmup')}
                        >
                          {set.type === 'calentamiento' ? 'C' : i + 1}
                        </button>

                        {/* El peso se edita en la unidad del usuario y se guarda en kg */}
                        <NumInput
                          value={u.toDisplayWeight(set.weight)}
                          onChange={(v) =>
                            updateSet(ex.id, set.id, { weight: u.toCanonicalWeight(v) })
                          }
                          step={u.weightUnit === 'kg' ? 2.5 : 5}
                        />
                        <NumInput
                          value={set.reps}
                          onChange={(v) => updateSet(ex.id, set.id, { reps: Math.round(v) })}
                          integer
                        />

                        <span
                          className={cx(
                            'text-center text-[12px] tabular',
                            isPR ? 'font-bold text-brand' : 'text-faint',
                          )}
                        >
                          {e1rm > 0 ? u.numWeight(e1rm, 0) : '—'}
                        </span>

                        <button
                          onClick={() => toggleDone(ex.id, set, ex.restSeconds)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            removeSet(ex.id, set.id);
                          }}
                          className={cx(
                            'pressable flex size-8 items-center justify-center rounded-lg',
                            set.done ? 'bg-brand text-base' : 'border border-line bg-surface2 text-faint',
                          )}
                          aria-label={t('tr.completeSet')}
                        >
                          <Check size={15} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}

                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => addSet(ex.id)}
                      className="pressable flex-1 rounded-xl border border-dashed border-line py-2 text-[13px] text-muted"
                    >
                      <Plus size={13} className="mr-1 inline" />
                      {t('tr.addSet')}
                    </button>
                    {ex.sets.length > 1 && (
                      <button
                        onClick={() => removeSet(ex.id, ex.sets[ex.sets.length - 1].id)}
                        className="pressable rounded-xl border border-line px-3 py-2 text-faint"
                        aria-label={t('tr.removeLastSet')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {active.exercises.length > 0 && (
          <Button variant="secondary" block className="mt-4" onClick={() => setPicking(true)}>
            <Plus size={16} />
            {t('tr.addExercise')}
          </Button>
        )}

        <button
          onClick={() => {
            discardWorkout();
            toast(t('tr.discarded'), 'info');
            navigate('/entrenamiento', { replace: true });
          }}
          className="mt-6 w-full py-3 text-center text-[13px] text-rose/80"
        >
          {t('tr.discard')}
        </button>
      </main>

      <ExercisePickerSheet open={picking} onClose={() => setPicking(false)} onPick={addExercise} />

      {/* La guia se abre encima: el entrenamiento sigue montado detras */}
      <TechniqueSheet
        exerciseId={techniqueFor}
        onClose={() => setTechniqueFor(null)}
        sequence={active.exercises.map((x) => ({ id: x.exerciseId, name: x.exerciseName }))}
        onSubstitute={(fromId, toId) => {
          const slot = active.exercises.find((x) => x.exerciseId === fromId);
          if (!slot) return;
          replaceExercise(slot.id, toId);
          toast(t('tr.substituted'));
        }}
      />

      {/* ------------------------------------------------------- terminar -- */}
      <Sheet
        open={finishing}
        onClose={() => setFinishing(false)}
        title={t('tr.finishWorkout')}
        footer={
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              const done = finishWorkout(rating);
              setFinishing(false);
              if (done) {
                toast(
                  t('tr.saved', {
                    volume: `${u.numWeight(workoutVolume(done), 0)} ${u.w}`,
                  }),
                );
                navigate('/entrenamiento', { replace: true });
              }
            }}
          >
            {t('tr.saveWorkout')}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Box label={t('tr.duration')} value={formatDuration(elapsed)} />
            <Box label={t('tr.sets')} value={`${doneSets}`} />
            <Box label={t('tr.volume')} value={`${u.numWeight(volume, 0)} ${u.w}`} />
          </div>

          <div>
            <p className="mb-2 text-[13px] text-muted">{t('tr.howWasIt')}</p>
            <Segmented
              value={String(rating)}
              onChange={(v) => setRating(Number(v))}
              options={[
                { value: '1', label: t('tr.rate1') },
                { value: '2', label: t('tr.rate2') },
                { value: '3', label: t('tr.rate3') },
                { value: '4', label: t('tr.rate4') },
                { value: '5', label: t('tr.rate5') },
              ]}
            />
          </div>

          <p className="text-[12px] text-faint">
            {t('tr.uncheckedNote')}
          </p>
        </div>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ auxiliares */

function NumInput({
  value,
  onChange,
  step = 1,
  integer,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  integer?: boolean;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value ? String(value) : '');

  return (
    <input
      inputMode={integer ? 'numeric' : 'decimal'}
      value={shown}
      placeholder="0"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.');
        setText(raw);
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(integer ? Math.round(n) : Math.round(n / step) * step);
      }}
      onBlur={() => setText(null)}
      className="h-9 w-full rounded-lg border border-line bg-surface2 text-center text-[15px] font-medium tabular outline-none focus:border-brand/60"
    />
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface2 py-3">
      <p className="text-[11px] text-faint">{label}</p>
      <p className="mt-0.5 text-[17px] font-semibold tabular">{value}</p>
    </div>
  );
}
