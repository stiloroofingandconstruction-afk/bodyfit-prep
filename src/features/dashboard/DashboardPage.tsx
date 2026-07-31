import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, Dumbbell, Flame, Plus, Scale, Wand2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Misc';
import { LineChart } from '@/components/ui/Chart';
import { MacroSummary } from '@/features/nutrition/MacroSummary';
import { CompetitionDashboard } from './CompetitionDashboard';
import { SmartMealSheet } from '@/features/nutrition/SmartMealSheet';
import { FoodSearchSheet } from '@/features/nutrition/FoodSearchSheet';
import { WeightSheet } from '@/features/body/WeightSheet';
import { ema, weeklyTrend, weightSeries } from '@/domain/body';
import { workoutSetCount, workoutVolume } from '@/domain/training';
import { friendlyDate, greeting, startOfWeek, today } from '@/lib/date';
import { cx, fmtSigned } from '@/lib/utils';
import { useProfile } from '@/store/profileStore';
import {
  useCheckins,
  useCurrentWeight,
  useDayNutrition,
  useMeasurements,
  useStreak,
  useWorkouts,
} from '@/store/selectors';
import { useTrainingStore } from '@/store/trainingStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const date = today();

  const { consumed, target, remaining, entries } = useDayNutrition(date);
  const workouts = useWorkouts();
  const measurements = useMeasurements();
  const checkins = useCheckins();
  const streak = useStreak();
  const weight = useCurrentWeight();
  const active = useTrainingStore((s) => s.active);
  const startWorkout = useTrainingStore((s) => s.startWorkout);
  const competitionMode = useSettingsStore((s) => s.competitionMode);

  const [smart, setSmart] = useState<'plan' | 'auto' | null>(null);
  const [adding, setAdding] = useState(false);
  const [weighing, setWeighing] = useState(false);

  const todayWorkouts = workouts.filter((w) => w.date === date);

  const series = useMemo(() => weightSeries(measurements), [measurements]);
  const trend = useMemo(() => weeklyTrend(series.map((p) => ({ date: p.date, value: p.value }))), [series]);
  const smoothed = useMemo(() => ema(series), [series]);

  const weekStart = startOfWeek(date);
  const checkinPending = !checkins.some((c) => c.weekStart === weekStart) && new Date().getDay() === 1;

  return (
    <>
      <PageHeader
        title={`${greeting()}${profile.name ? `, ${profile.name.split(' ')[0]}` : ''}`}
        subtitle={friendlyDate(date)}
        action={
          streak > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-brand/30 bg-brand/12 px-2.5 py-1">
              <Flame size={13} className="text-brand" />
              <span className="text-[13px] font-semibold text-brand">{streak}</span>
            </div>
          )
        }
      />

      <Page>
        {/* En modo competencia el panel de prep va primero: es el contexto
            desde el que se leen todos los demas numeros. */}
        {competitionMode && <CompetitionDashboard />}

        {/* --------------------------------------------------- macros hoy */}
        <Link to="/nutricion" className={competitionMode ? 'mt-3 block' : 'block'}>
          <Card className="pressable">
            <MacroSummary consumed={consumed} target={target} />
          </Card>
        </Link>

        {/* ------------------------------------------------ acciones rapidas */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Action
            icon={<Plus size={17} />}
            label="Registrar comida"
            onClick={() => setAdding(true)}
            primary
          />
          <Action icon={<Wand2 size={17} />} label="Completar macros" onClick={() => setSmart('auto')} />
          <Action
            icon={<Dumbbell size={17} />}
            label={active ? 'Continuar entreno' : 'Empezar entreno'}
            onClick={() => {
              if (!active) startWorkout('Entreno libre');
              navigate('/entrenamiento/activo');
            }}
          />
          <Action icon={<Scale size={17} />} label="Pesarme" onClick={() => setWeighing(true)} />
        </div>

        {checkinPending && (
          <Link
            to="/checkin"
            className="pressable mt-3 flex items-center gap-3 rounded-2xl border border-violet/30 bg-violet/10 px-4 py-3"
          >
            <CalendarCheck size={18} className="shrink-0 text-violet" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-violet">Toca check-in semanal</p>
              <p className="text-[12px] text-muted">Revisa la semana y ajusta las calorias</p>
            </div>
          </Link>
        )}

        {/* ------------------------------------------------------- entreno */}
        <div className="mt-5">
          <SectionTitle action={<Link to="/entrenamiento" className="text-[12px] text-brand">Ver todo</Link>}>
            Entrenamiento de hoy
          </SectionTitle>
          <Card>
            {todayWorkouts.length > 0 ? (
              <div className="space-y-3">
                {todayWorkouts.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{w.name}</p>
                      <p className="text-[12px] tabular text-faint">
                        {workoutSetCount(w)} series · {Math.round(workoutVolume(w))} kg
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand">
                      Completado
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-[13px] text-muted">
                {active ? 'Tienes un entreno en curso' : 'Sin entreno registrado hoy'}
              </p>
            )}
          </Card>
        </div>

        {/* ---------------------------------------------------------- peso */}
        <div className="mt-5">
          <SectionTitle action={<Link to="/cuerpo" className="text-[12px] text-brand">Ver todo</Link>}>
            Peso corporal
          </SectionTitle>
          <Card>
            <div className="mb-3 flex items-end justify-between">
              <Stat label="Actual" value={weight.toFixed(1)} unit="kg" />
              <Stat
                label="Tendencia semanal"
                value={fmtSigned(trend)}
                unit="kg"
                tone={
                  trend === 0
                    ? 'text-muted'
                    : (profile.goal === 'definicion') === trend < 0
                      ? 'text-brand'
                      : 'text-amber'
                }
              />
              {profile.goalWeight && (
                <Stat label="Objetivo" value={profile.goalWeight.toFixed(1)} unit="kg" />
              )}
            </div>
            <LineChart
              data={series}
              overlay={smoothed}
              height={140}
              unit=" kg"
            />
            <p className="mt-2 text-center text-[11px] text-faint">
              La linea punteada es la media movil: filtra el ruido diario de agua y glucogeno
            </p>
          </Card>
        </div>

        {/* --------------------------------------------------------- resumen */}
        <div className="mt-5">
          <SectionTitle>Resumen de hoy</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Alimentos" value={entries.length} />
              <Stat label="Kcal restantes" value={Math.round(remaining.kcal)} tone="text-brand" />
              <Stat label="Proteina falta" value={`${Math.round(remaining.protein)}g`} tone="text-protein" />
            </div>
          </Card>
        </div>
      </Page>

      {smart && (
        <SmartMealSheet
          open
          mode={smart}
          remaining={remaining}
          slot="cena"
          date={date}
          onClose={() => setSmart(null)}
        />
      )}
      {adding && <FoodSearchSheet open slot="snack" date={date} onClose={() => setAdding(false)} />}
      <WeightSheet open={weighing} onClose={() => setWeighing(false)} />
    </>
  );
}

function Action({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'pressable flex items-center gap-2.5 rounded-2xl px-3.5 py-3.5 text-left text-[14px] font-medium',
        primary ? 'bg-brand text-base' : 'border border-line bg-surface text-ink',
      )}
    >
      <span className={cx('shrink-0', primary ? 'text-base' : 'text-brand')}>{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
