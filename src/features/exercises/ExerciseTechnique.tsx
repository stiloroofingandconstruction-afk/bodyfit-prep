import { useMemo } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Shield, Star, TrendingUp } from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Misc';
import { ExerciseVideo } from '@/components/ui/ExerciseVideo';
import {
  DIFFICULTY_LABEL,
  EXERCISE_BY_ID,
  LUMBAR_LABEL,
  LUMBAR_TONE,
  MUSCLE_LABEL,
  PATTERN_LABEL,
  lumbarAlternativesFor,
  relatedExercises,
} from '@/data/exercises';
import { bestSet, estimate1RM, isWorkingSet } from '@/domain/training';
import { shortDate } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { useWorkouts } from '@/store/selectors';
import type { Exercise } from '@/domain/types';

interface Props {
  exercise: Exercise;
  /** Navegacion entre ejercicios de la sesion o de la lista. */
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  onSelect?: (id: string) => void;
}

/**
 * Guia de tecnica de un ejercicio.
 *
 * Se usa tanto en la pantalla propia (`/ejercicios/:id`) como dentro de una hoja
 * durante el entrenamiento activo, sin perder la sesion en curso.
 */
export function ExerciseTechnique({
  exercise,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  onSelect,
}: Props) {
  const workouts = useWorkouts();
  const customMedia = useSettingsStore((s) => s.exerciseMedia[exercise.id]);
  const media = customMedia ?? exercise.media;
  const tech = exercise.technique;

  /* Historial personal de este ejercicio */
  const history = useMemo(() => {
    const rows: { date: string; sets: { weight: number; reps: number }[]; e1rm: number }[] = [];
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (ex.exerciseId !== exercise.id) continue;
        const working = ex.sets.filter(isWorkingSet);
        if (!working.length) continue;
        rows.push({
          date: w.date,
          sets: working.map((s) => ({ weight: s.weight, reps: s.reps })),
          e1rm: bestSet(ex)?.e1rm ?? 0,
        });
      }
    }
    return rows.slice(0, 8);
  }, [workouts, exercise.id]);

  const pr = useMemo(() => {
    let best: { weight: number; reps: number; e1rm: number; date: string } | null = null;
    for (const row of history) {
      for (const s of row.sets) {
        const e = estimate1RM(s.weight, s.reps);
        if (!best || e > best.e1rm) best = { ...s, e1rm: e, date: row.date };
      }
    }
    return best;
  }, [history]);

  const last = history[0];
  const subs = relatedExercises(exercise, 'substitutions');
  const regs = relatedExercises(exercise, 'regressions');
  const progs = relatedExercises(exercise, 'progressions');
  const lumbarAlts = exercise.lumbarLoad !== 'bajo' ? lumbarAlternativesFor(exercise) : [];

  return (
    <div className="space-y-5">
      {/* ───────────────────────────────────────────────── navegacion */}
      {(onPrev || onNext) && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            className="pressable flex flex-1 items-center gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2 text-left text-[12px] text-muted disabled:opacity-30"
          >
            <ChevronLeft size={15} className="shrink-0" />
            <span className="truncate">{prevLabel ?? 'Anterior'}</span>
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="pressable flex flex-1 items-center justify-end gap-1.5 rounded-xl border border-line bg-surface2 px-3 py-2 text-right text-[12px] text-muted disabled:opacity-30"
          >
            <span className="truncate">{nextLabel ?? 'Siguiente'}</span>
            <ChevronRight size={15} className="shrink-0" />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────── cabecera */}
      <div>
        <h2 className="text-[22px] leading-tight font-bold">{exercise.name}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip active>{MUSCLE_LABEL[exercise.primary]}</Chip>
          {exercise.secondary?.map((m) => <Chip key={m}>{MUSCLE_LABEL[m]}</Chip>)}
        </div>
        <p className="mt-2 text-[12px] text-faint">
          {DIFFICULTY_LABEL[exercise.difficulty]} · {PATTERN_LABEL[exercise.pattern]} ·{' '}
          {exercise.equipment}
          {exercise.unilateral && ' · unilateral'}
        </p>
      </div>

      {/* ───────────────────────────────────────────────── video */}
      <ExerciseVideo media={media} title={exercise.name} />

      {/* ───────────────────────────────────── aviso de carga lumbar */}
      {exercise.lumbarLoad !== 'bajo' && (
        <Card
          className={cx(
            'border',
            exercise.lumbarLoad === 'alto' ? 'border-rose/30 bg-rose/8' : 'border-carbs/30 bg-carbs/8',
          )}
        >
          <div className="flex gap-3">
            <AlertTriangle
              size={18}
              className={cx('mt-0.5 shrink-0', LUMBAR_TONE[exercise.lumbarLoad])}
            />
            <div className="min-w-0">
              <p className={cx('text-[14px] font-semibold', LUMBAR_TONE[exercise.lumbarLoad])}>
                {LUMBAR_LABEL[exercise.lumbarLoad]}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {exercise.lumbarLoad === 'alto'
                  ? 'Este ejercicio exige mucho a la zona lumbar. Si tienes sensibilidad en la espalda baja, estas alternativas trabajan lo mismo con mucha menos carga sobre la columna.'
                  : 'Carga moderada sobre la zona lumbar. Si notas molestias, prueba estas alternativas.'}
              </p>
              {lumbarAlts.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {lumbarAlts.map((alt) => (
                    <Chip key={alt.id} onClick={onSelect ? () => onSelect(alt.id) : undefined}>
                      {alt.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ───────────────────────────────────────────────── tecnica */}
      <StepList title="Preparacion" items={tech.setup} numbered />
      <StepList title="Ejecucion paso a paso" items={tech.execution} numbered />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Line label="Respiracion" value={tech.breathing} />
          <Line label="Tempo" value={tech.tempo} />
          <Line label="Rango de movimiento" value={tech.rangeOfMotion} />
        </div>
      </Card>

      <StepList title="Errores comunes" items={tech.commonMistakes} tone="text-carbs" />
      <StepList title="Seguridad" items={tech.safety} tone="text-sky" icon={<Shield size={13} />} />
      <StepList title="Para hipertrofia" items={tech.hypertrophy} tone="text-brand" />
      <StepList title="Para fuerza" items={tech.strength} tone="text-violet" />
      {tech.contraindications.length > 0 && (
        <StepList
          title="Contraindicaciones generales"
          items={tech.contraindications}
          tone="text-rose"
          footer="Informacion general, no consejo medico. Ante dolor o sintomas, consulta con un profesional."
        />
      )}

      {/* ───────────────────────────────────────── variantes */}
      {(subs.length > 0 || regs.length > 0 || progs.length > 0) && (
        <div>
          <SectionTitle>Variantes</SectionTitle>
          <Card>
            <div className="space-y-3">
              <Related title="Sustituciones" list={subs} onSelect={onSelect} />
              <Related title="Regresiones (mas facil)" list={regs} onSelect={onSelect} />
              <Related title="Progresiones (mas dificil)" list={progs} onSelect={onSelect} />
            </div>
          </Card>
        </div>
      )}

      {/* ───────────────────────────────────────── historial */}
      <div>
        <SectionTitle>Tu historial</SectionTitle>
        <Card>
          {history.length === 0 ? (
            <p className="py-3 text-center text-[13px] text-faint">
              Aun no has registrado este ejercicio
            </p>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-3 border-b border-line pb-3">
                <Mini
                  label="Ultimo peso"
                  value={last ? `${Math.max(...last.sets.map((s) => s.weight))} kg` : '—'}
                />
                <Mini
                  label="Mejor serie"
                  value={pr ? `${pr.weight}×${pr.reps}` : '—'}
                  icon={<Star size={11} className="text-brand" />}
                />
                <Mini
                  label="Record (1RM)"
                  value={pr ? `${pr.e1rm} kg` : '—'}
                  icon={<TrendingUp size={11} className="text-brand" />}
                />
              </div>
              <div className="space-y-1.5">
                {history.map((row, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="shrink-0 text-faint">{shortDate(row.date)}</span>
                    <span className="truncate text-right tabular text-muted">
                      {row.sets.map((s) => `${s.weight}×${s.reps}`).join('  ')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── auxiliares */

function StepList({
  title,
  items,
  numbered,
  tone = 'text-muted',
  icon,
  footer,
}: {
  title: string;
  items: string[];
  numbered?: boolean;
  tone?: string;
  icon?: React.ReactNode;
  footer?: string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <Card>
        <ol className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-muted">
              {numbered ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] font-semibold text-brand">
                  {i + 1}
                </span>
              ) : (
                <span className={cx('mt-1.5 shrink-0', tone)}>
                  {icon ?? <span className="block size-1.5 rounded-full bg-current" />}
                </span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ol>
        {footer && <p className="mt-3 border-t border-line pt-2 text-[11px] text-faint">{footer}</p>}
      </Card>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] tracking-wider text-faint uppercase">{label}</p>
      <p className="mt-0.5 text-[14px] text-ink">{value}</p>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-faint">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-[15px] font-semibold tabular">{value}</p>
    </div>
  );
}

function Related({
  title,
  list,
  onSelect,
}: {
  title: string;
  list: { id: string; name: string }[];
  onSelect?: (id: string) => void;
}) {
  if (!list.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-[12px] text-faint">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((x) => (
          <Chip
            key={x.id}
            onClick={onSelect && EXERCISE_BY_ID.has(x.id) ? () => onSelect(x.id) : undefined}
          >
            {x.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
