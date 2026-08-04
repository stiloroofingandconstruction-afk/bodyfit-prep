import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell, Play, RotateCcw, Trophy, Zap } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { BarChart } from '@/components/ui/Chart';
import { EXERCISE_BY_ID } from '@/data/exercises';
import {
  personalRecords,
  volumeByMuscle,
  workoutDurationMin,
  workoutSetCount,
  workoutVolume,
} from '@bodyfit/domain/training';
import { addDays, dayInitial, friendlyDate, shortDate, startOfWeek, today, weekRange } from '@/lib/date';
import { useRoutines, useWorkouts } from '@/store/selectors';
import { useUnits } from '@/lib/useUnits';
import { useTrainingStore } from '@/store/trainingStore';
import { toast } from '@/store/uiStore';
import { muscleLabel } from '@/i18n/catalogLabels';
import { t } from '@/i18n';
import type { Routine } from '@bodyfit/domain/types';
import { useExerciseCatalog } from '@/data/useCatalog';

export default function TrainingPage() {
  // Descarga el catalogo al entrar en la pantalla, no en el arranque
  useExerciseCatalog();
  const navigate = useNavigate();
  const routines = useRoutines();
  const workouts = useWorkouts();
  const active = useTrainingStore((s) => s.active);
  const startWorkout = useTrainingStore((s) => s.startWorkout);
  const repeatWorkout = useTrainingStore((s) => s.repeatWorkout);
  const finishWorkout = useTrainingStore((s) => s.finishWorkout);
  const discardWorkout = useTrainingStore((s) => s.discardWorkout);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const u = useUnits();

  /** Series completadas en la sesion abierta. Decide si hay algo que guardar. */
  const activeDoneSets = useMemo(
    () =>
      active
        ? active.exercises.reduce((n, e) => n + e.sets.filter((st) => st.done).length, 0)
        : 0,
    [active],
  );

  const week = useMemo(() => weekRange(startOfWeek(today())), []);
  const weekVolume = useMemo(
    () =>
      week.map((d) => ({
        label: dayInitial(d),
        value: workouts.filter((w) => w.date === d).reduce((n, w) => n + workoutVolume(w), 0),
        highlight: d === today(),
      })),
    [week, workouts],
  );

  const last30 = useMemo(() => {
    const from = addDays(today(), -30);
    return workouts.filter((w) => w.date >= from);
  }, [workouts]);

  const muscleVolume = useMemo(() => {
    const map = new Map(
      [...EXERCISE_BY_ID.values()].map((e) => [
        e.id,
        { primary: e.primary, secondary: e.secondary },
      ]),
    );
    const acc = volumeByMuscle(last30, map);
    return Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [last30]);

  /** El entreno mas reciente con ejercicios: el candidato a repetir. */
  const lastWorkout = useMemo(() => workouts.find((w) => w.exercises.length > 0), [workouts]);

  const prs = useMemo(() => {
    const list = [...personalRecords(workouts).values()];
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  }, [workouts]);

  const start = (r: Routine, dayIndex: number) => {
    startWorkout(r.name, r.id, dayIndex);
    setRoutine(null);
    navigate('/entrenamiento/activo');
  };

  return (
    <>
      <PageHeader
        title={t('screen.training')}
        subtitle={t('tr.subtitle', { n: last30.length })}
      />

      <Page>
        {/*
          ─────────────────────────────────────────────────────────────────
          UNA SESION DE OTRO DIA NO PUEDE BLOQUEAR LA DE HOY

          Si alguien empieza a entrenar y no cierra la sesion —lo normal:
          suena el telefono, se acaba la bateria, se va del gimnasio— esa
          sesion se quedaba activa para siempre y la pantalla SOLO ofrecia
          continuarla. Al dia siguiente no habia forma de empezar el
          entrenamiento de hoy: la aplicacion insistia en el de ayer.

          Ahora se dice lo que hay y se resuelve en un toque. Lo que NO se
          hace es descartarla sola: puede tener series de verdad dentro.
          ─────────────────────────────────────────────────────────────────
        */}
        {active && active.date !== today() ? (
          <Card className="border-warn/30 bg-warn/5">
            <p className="text-[15px] font-semibold">{t('tr.unfinished')}</p>
            <p className="mt-1 text-xs text-faint">
              {t('tr.unfinishedFrom', { date: friendlyDate(active.date) })} ·{' '}
              {t('tr.unfinishedSets', { n: activeDoneSets })}
            </p>

            <div className="mt-4 space-y-2">
              {activeDoneSets > 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={() => {
                    finishWorkout();
                    toast(t('tr.unfinishedSaved'));
                  }}
                >
                  {t('tr.unfinishedSave')}
                </Button>
              ) : (
                /*
                 * Sin ninguna serie hecha no hay nada que guardar: guardarla
                 * solo ensuciaria el historial con una sesion vacia.
                 */
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={() => {
                    discardWorkout();
                    toast(t('tr.unfinishedDiscarded'));
                  }}
                >
                  {t('tr.unfinishedDiscardEmpty')}
                </Button>
              )}

              <Button
                variant="secondary"
                block
                onClick={() => navigate('/entrenamiento/activo')}
              >
                <Play size={18} /> {t('tr.unfinishedContinue')}
              </Button>

              {activeDoneSets > 0 && (
                <button
                  className="w-full py-2 text-xs text-faint underline"
                  onClick={() => {
                    if (!confirm(t('tr.unfinishedDiscardConfirm'))) return;
                    discardWorkout();
                    toast(t('tr.unfinishedDiscarded'));
                  }}
                >
                  {t('tr.unfinishedDiscard')}
                </button>
              )}
            </div>
          </Card>
        ) : active ? (
          <Button variant="primary" size="lg" block onClick={() => navigate('/entrenamiento/activo')}>
            <Play size={18} />
            {t('home.continueWorkout')}
          </Button>
        ) : (
          <>
            {/*
              Repetir la ultima sesion es lo que hace la mayoria: mismos
              ejercicios, mismos pesos, intentando una repeticion mas. Antes
              habia que montarla ejercicio por ejercicio cada vez.
            */}
            {lastWorkout && (
              <button
                onClick={() => {
                  if (!repeatWorkout(lastWorkout.id)) return;
                  toast(t('tr.repeated'));
                  navigate('/entrenamiento/activo');
                }}
                className="pressable mb-2 flex w-full items-center gap-3 rounded-2xl bg-brand px-4 py-3.5 text-left text-base"
              >
                <RotateCcw size={18} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">
                    {t('tr.repeatLast', { name: lastWorkout.name })}
                  </span>
                  <span className="block truncate text-[12px] opacity-80">
                    {t('tr.repeatLastHint', { date: shortDate(lastWorkout.date) })}
                  </span>
                </span>
              </button>
            )}

            <Button
              variant={lastWorkout ? 'secondary' : 'primary'}
              size="lg"
              block
              onClick={() => {
                startWorkout(t('home.freeWorkout'));
                navigate('/entrenamiento/activo');
              }}
            >
              <Zap size={18} />
              {t('home.freeWorkout')}
            </Button>
          </>
        )}

        <div className="mt-5">
          <SectionTitle>{t('tr.routines')}</SectionTitle>
          <div className="space-y-1.5">
            {routines.map((r) => (
              <button
                key={r.id}
                onClick={() => setRoutine(r)}
                className="pressable flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2 text-brand">
                  <Dumbbell size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{r.name}</p>
                  <p className="truncate text-[12px] text-faint">
                    {t('tr.routineDays', { n: r.days.length })} · {r.description}
                  </p>
                </div>
                <ChevronRight size={17} className="shrink-0 text-faint" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle>{t('tr.weekVolume')}</SectionTitle>
          <Card>
            <BarChart
              data={weekVolume.map((d) => ({ ...d, value: u.toDisplayWeight(d.value) }))}
              unit={` ${u.w}`}
            />
          </Card>
        </div>

        {muscleVolume.length > 0 && (
          <div className="mt-5">
            <SectionTitle action={<span className="text-[11px] text-faint">{t('tr.setsPer30')}</span>}>
              {t('tr.byMuscle')}
            </SectionTitle>
            <Card>
              <div className="space-y-2.5">
                {muscleVolume.map(([muscle, sets]) => {
                  const max = muscleVolume[0][1] || 1;
                  return (
                    <div key={muscle}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span className="text-muted">{muscleLabel(muscle as never)}</span>
                        <span className="tabular">{sets}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${(sets / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {prs.length > 0 && (
          <div className="mt-5">
            <SectionTitle>{t('tr.recentPRs')}</SectionTitle>
            <Card>
              <div className="grid grid-cols-2 gap-4">
                {prs.map((pr) => (
                  <Stat
                    key={pr.exerciseId}
                    label={pr.exerciseName}
                    value={`${pr.weight}×${pr.reps}`}
                    sub={t('tr.of1RM', { weight: u.fmtWeight(pr.e1rm) })}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="mt-5">
          <SectionTitle>{t('tr.history')}</SectionTitle>
          {workouts.length === 0 ? (
            <EmptyState
              icon={<Trophy size={22} />}
              title={t('tr.empty')}
              description={t('tr.emptyDesc')}
            />
          ) : (
            <div className="space-y-1.5">
              {workouts.slice(0, 12).map((w) => (
                <div key={w.id} className="rounded-2xl border border-line bg-surface px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-medium">{w.name}</p>
                    <span className="shrink-0 text-[12px] text-faint">{friendlyDate(w.date)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] tabular text-faint">
                    {workoutSetCount(w)} {t('home.sets')} · {u.numWeight(workoutVolume(w), 0)} {u.w}
                    {workoutDurationMin(w) != null &&
                      ` · ${workoutDurationMin(w)} ${t('tr.minutes')}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Page>

      {/* Seleccion del dia de la rutina */}
      <Sheet open={!!routine} onClose={() => setRoutine(null)} title={routine?.name}>
        <div className="space-y-1.5">
          {routine?.days.map((day, i) => (
            <button
              key={day.name}
              onClick={() => start(routine, i)}
              className="pressable flex w-full items-center gap-3 rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{day.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-faint">
                  {day.exercises
                    .map((e) => EXERCISE_BY_ID.get(e.exerciseId)?.name ?? e.exerciseId)
                    .join(' · ')}
                </p>
              </div>
              <Play size={16} className="shrink-0 text-brand" />
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
