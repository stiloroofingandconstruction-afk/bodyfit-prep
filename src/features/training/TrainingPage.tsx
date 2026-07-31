import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell, Play, Trophy, Zap } from 'lucide-react';
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
} from '@/domain/training';
import { addDays, dayInitial, friendlyDate, startOfWeek, today, weekRange } from '@/lib/date';
import { useRoutines, useWorkouts } from '@/store/selectors';
import { useUnits } from '@/lib/useUnits';
import { useTrainingStore } from '@/store/trainingStore';
import type { Routine } from '@/domain/types';

export default function TrainingPage() {
  const navigate = useNavigate();
  const routines = useRoutines();
  const workouts = useWorkouts();
  const active = useTrainingStore((s) => s.active);
  const startWorkout = useTrainingStore((s) => s.startWorkout);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const u = useUnits();

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
        title="Entrenamiento"
        subtitle={`${last30.length} sesiones en los ultimos 30 dias`}
      />

      <Page>
        {active ? (
          <Button variant="primary" size="lg" block onClick={() => navigate('/entrenamiento/activo')}>
            <Play size={18} />
            Continuar entreno
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              startWorkout('Entreno libre');
              navigate('/entrenamiento/activo');
            }}
          >
            <Zap size={18} />
            Entreno libre
          </Button>
        )}

        <div className="mt-5">
          <SectionTitle>Rutinas</SectionTitle>
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
                    {r.days.length} dias · {r.description}
                  </p>
                </div>
                <ChevronRight size={17} className="shrink-0 text-faint" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle>Volumen de la semana</SectionTitle>
          <Card>
            <BarChart
              data={weekVolume.map((d) => ({ ...d, value: u.toDisplayWeight(d.value) }))}
              unit={` ${u.w}`}
            />
          </Card>
        </div>

        {muscleVolume.length > 0 && (
          <div className="mt-5">
            <SectionTitle action={<span className="text-[11px] text-faint">series / 30 dias</span>}>
              Reparto por musculo
            </SectionTitle>
            <Card>
              <div className="space-y-2.5">
                {muscleVolume.map(([muscle, sets]) => {
                  const max = muscleVolume[0][1] || 1;
                  return (
                    <div key={muscle}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span className="text-muted capitalize">{muscle}</span>
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
            <SectionTitle>Records recientes</SectionTitle>
            <Card>
              <div className="grid grid-cols-2 gap-4">
                {prs.map((pr) => (
                  <Stat
                    key={pr.exerciseId}
                    label={pr.exerciseName}
                    value={`${pr.weight}×${pr.reps}`}
                    sub={`${u.fmtWeight(pr.e1rm)} de 1RM`}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="mt-5">
          <SectionTitle>Historial</SectionTitle>
          {workouts.length === 0 ? (
            <EmptyState
              icon={<Trophy size={22} />}
              title="Aun no hay entrenos"
              description="Elige una rutina o empieza un entreno libre. Todo queda registrado con volumen y records."
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
                    {workoutSetCount(w)} series · {u.numWeight(workoutVolume(w), 0)} {u.w}
                    {workoutDurationMin(w) != null && ` · ${workoutDurationMin(w)} min`}
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
