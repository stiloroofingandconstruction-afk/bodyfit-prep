import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, ChevronDown, Flag, Plus, Timer, Trash2, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Segmented } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { ExercisePickerSheet } from './ExercisePickerSheet';
import { TechniqueSheet } from '@/features/exercises/TechniqueSheet';
import {
  defaultIncrement,
  defaultRepRange,
  estimate1RM,
  lastSessionOf,
  personalRecords,
  suggestProgression,
  workoutVolume,
  type LastSession,
  type Progression,
} from '@/domain/training';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { formatDuration } from '@/lib/date';
import { cx, haptic } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { useTrainingStore } from '@/store/trainingStore';
import { useWorkouts } from '@/store/selectors';
import { useUIStore } from '@/store/uiStore';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';
import { shortDate } from '@/lib/date';
import type { Dict } from '@/i18n';
import type { WorkoutExercise, WorkoutSet } from '@/domain/types';

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
  /** Id de la serie cuyo selector de RIR esta abierto. */
  const [rirFor, setRirFor] = useState<string | null>(null);
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

  /**
   * Progresion sugerida para este ejercicio a partir de la ultima sesion.
   *
   * El rango sale de la rutina si la hay; si el ejercicio se anadio suelto se
   * deduce del propio ejercicio, porque un basico pesado y una elevacion
   * lateral no comparten rango.
   */
  const progressionFor = (ex: WorkoutExercise, last: LastSession | null): Progression | null => {
    if (!last) return null;
    const info = EXERCISE_BY_ID.get(ex.exerciseId);
    const range =
      ex.repRange ??
      (info ? defaultRepRange({ compound: info.compound, pattern: info.pattern }) : [8, 12]);
    return suggestProgression(last.sets, range, defaultIncrement(info?.compound ?? false));
  };

  /** Rellena de una vez las series que aun no se han marcado. */
  const applyProgression = (ex: WorkoutExercise, prog: Progression | null) => {
    if (!prog) return;
    for (const st of ex.sets) {
      if (st.done) continue;
      updateSet(ex.id, st.id, { weight: prog.weight, reps: prog.reps });
    }
    haptic(12);
    toast(
      t('tr.applied', {
        weight: `${u.numWeight(prog.weight).replace(/[.,]0$/, '')} ${u.w}`,
        reps: prog.reps,
      }),
    );
  };

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
            const last = lastSessionOf(history, ex.exerciseId, active.id);
            const progression = progressionFor(ex, last);
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

                {/*
                  Lo que hiciste la ultima vez y lo que tocaria hoy. Es el
                  dato con el que se elige el peso: el record historico dice
                  de lo que fuiste capaz alguna vez, no lo que toca ahora.
                */}
                <LastAndNext
                  last={last}
                  progression={progression}
                  onApply={() => applyProgression(ex, progression)}
                />

                <div className="px-3 py-2">
                  <div className="mb-1 grid grid-cols-[2rem_1fr_1fr_2.75rem_2rem] items-center gap-2 px-1 text-[10px] tracking-wider text-faint uppercase">
                    <span>{t('tr.setColumn')}</span>
                    <span className="text-center">{u.w}</span>
                    <span className="text-center">{t('tr.repsColumn')}</span>
                    <span className="text-center">{t('tr.rir')}</span>
                    <span />
                  </div>

                  {ex.sets.map((set, i) => {
                    const e1rm = estimate1RM(set.weight, set.reps);
                    const isPR = pr ? e1rm > pr.e1rm && set.done : e1rm > 0 && set.done;
                    const rirOpen = rirFor === set.id;
                    return (
                      <div key={set.id}>
                        <div
                          className={cx(
                            'grid grid-cols-[2rem_1fr_1fr_2.75rem_2rem] items-center gap-2 rounded-xl px-1 py-1.5',
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

                        {/*
                          Aqui vivia el 1RM estimado: una columna entera para
                          un dato que la app puede calcular sola. El sitio lo
                          necesita el RIR, que es lo unico que solo puede
                          aportar quien acaba de hacer la serie.
                        */}
                        <button
                          onClick={() => setRirFor(rirOpen ? null : set.id)}
                          className={cx(
                            'pressable h-8 rounded-lg text-center text-[12px] font-semibold tabular',
                            set.rir != null ? 'bg-violet/15 text-violet' : 'bg-surface2 text-faint',
                            isPR && 'ring-1 ring-brand/40',
                          )}
                          aria-label={t('tr.rirLong')}
                          aria-expanded={rirOpen}
                        >
                          {set.rir == null ? '—' : set.rir >= 5 ? t('tr.rirPlus') : set.rir}
                        </button>

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

                        {rirOpen && (
                          <RirPicker
                            value={set.rir}
                            onPick={(rir) => {
                              updateSet(ex.id, set.id, { rir });
                              setRirFor(null);
                            }}
                          />
                        )}
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

const PROGRESSION_TEXT: Record<Progression['kind'], keyof Dict> = {
  'subir-peso': 'tr.progUp',
  consolidar: 'tr.progHold',
  'sumar-repeticion': 'tr.progRep',
};

/**
 * Lo de la ultima vez y lo que tocaria hoy, en dos lineas.
 *
 * Sin esto el usuario elige el peso de memoria o abriendo el historial en otra
 * pantalla. Con esto lo tiene delante mientras teclea, que es cuando lo decide.
 */
function LastAndNext({
  last,
  progression,
  onApply,
}: {
  last: LastSession | null;
  progression: Progression | null;
  onApply: () => void;
}) {
  const u = useUnits();

  /*
   * Los pesos enteros se escriben sin decimal: "100 kg", no "100.0 kg".
   * En una linea con cinco series seguidas, ese ".0" repetido es ruido puro.
   */
  const w = (kg: number) => u.numWeight(kg).replace(/[.,]0$/, '');

  if (!last) {
    return (
      <p className="border-b border-line px-4 py-2 text-[12px] text-faint">{t('tr.neverDone')}</p>
    );
  }

  return (
    <div className="border-b border-line px-4 py-2">
      <p className="text-[12px] text-faint">
        <span className="text-muted">{t('tr.lastTimeOn', { date: shortDate(last.date) })}</span>
        {' · '}
        <span className="tabular">
          {last.sets
            .slice(0, 5)
            .map((s) => `${w(s.weight)}×${s.reps}`)
            .join('  ')}
        </span>
      </p>

      {progression && (
        <button
          onClick={onApply}
          className="pressable mt-1.5 flex w-full items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-left"
        >
          <TrendingUp size={13} className="shrink-0 text-brand" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-brand tabular">
              {t('tr.suggested', {
                weight: `${w(progression.weight)} ${u.w}`,
                reps: progression.reps,
              })}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {t(PROGRESSION_TEXT[progression.kind])}
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-brand px-2.5 py-1 text-[12px] font-semibold text-base">
            {t('tr.apply')}
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * Selector de repeticiones en reserva.
 *
 * Aparece bajo la serie y se cierra al elegir: un toque para abrirlo y otro
 * para responder. Quien no lo use no paga nada por que exista.
 */
function RirPicker({
  value,
  onPick,
}: {
  value?: number;
  onPick: (rir: number | undefined) => void;
}) {
  return (
    <div className="mb-1.5 rounded-xl bg-surface2 px-2 py-2">
      <p className="mb-1.5 px-1 text-[11px] text-faint">{t('tr.rirHelp')}</p>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onPick(value === n ? undefined : n)}
            className={cx(
              'pressable h-9 flex-1 rounded-lg text-[13px] font-semibold tabular',
              value === n ? 'bg-violet text-base' : 'border border-line bg-surface text-muted',
            )}
          >
            {n === 5 ? t('tr.rirPlus') : n}
          </button>
        ))}
      </div>
    </div>
  );
}

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
