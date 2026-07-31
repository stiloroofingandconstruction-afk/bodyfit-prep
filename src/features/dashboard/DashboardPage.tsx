import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, Dumbbell, Flame, Plus, Scale, Wand2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { ActionLink, Card, SectionTitle } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Misc';
import { LineChart } from '@/components/ui/Chart';
import { MacroSummary } from '@/features/nutrition/MacroSummary';
import { CompetitionDashboard } from './CompetitionDashboard';
import { SmartMealSheet } from '@/features/nutrition/SmartMealSheet';
import { FoodSearchSheet } from '@/features/nutrition/FoodSearchSheet';
import { WeightSheet } from '@/features/body/WeightSheet';
import { ema } from '@/domain/body';
import { workoutSetCount, workoutVolume } from '@/domain/training';
import { friendlyDate, greeting, startOfWeek, today } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { useProfile } from '@/store/profileStore';
import {
  useCheckins,
  useCurrentWeight,
  useDayNutrition,
  useMeasurements,
  useReadiness,
  useStreak,
  useWeightTrend,
  useWorkouts,
} from '@/store/selectors';
import { useTrainingStore } from '@/store/trainingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { t } from '@/i18n';

export default function DashboardPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const date = today();

  const { consumed, target, remaining, entries } = useDayNutrition(date);
  const workouts = useWorkouts();
  const measurements = useMeasurements();
  const readiness = useReadiness();
  const checkins = useCheckins();
  const streak = useStreak();
  const weight = useCurrentWeight();
  const active = useTrainingStore((s) => s.active);
  const startWorkout = useTrainingStore((s) => s.startWorkout);
  const competitionMode = useSettingsStore((s) => s.competitionMode);
  const u = useUnits();

  const [smart, setSmart] = useState<'plan' | 'auto' | null>(null);
  const [adding, setAdding] = useState(false);
  const [weighing, setWeighing] = useState(false);

  const todayWorkouts = workouts.filter((w) => w.date === date);

  /*
   * La tendencia sale del MISMO selector que usa el panel de competencia y el
   * check-in. Antes esta tarjeta calculaba la suya solo con las mediciones,
   * ignorando el registro diario: el dashboard llegaba a mostrar "-0.8 kg" en
   * el panel de prep y "0.0 kg" justo debajo, para el mismo periodo.
   */
  const weightTrendData = useWeightTrend();
  const trend = weightTrendData.weekChange ?? 0;

  // La grafica combina ambas fuentes, igual que la tendencia
  const series = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const m of measurements) if (typeof m.weight === 'number') byDate.set(m.date, m.weight);
    for (const r of readiness) if (typeof r.weight === 'number') byDate.set(r.date, r.weight);
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, value]) => ({ date: d, value }));
  }, [measurements, readiness]);

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
            label={t('nut.logMeal')}
            onClick={() => setAdding(true)}
            primary
          />
          <Action
            icon={<Wand2 size={17} />}
            label={t('home.completeMacros')}
            onClick={() => setSmart('auto')}
          />
          <Action
            icon={<Dumbbell size={17} />}
            label={active ? t('home.continueWorkout') : t('home.startWorkout')}
            onClick={() => {
              if (!active) startWorkout(t('home.freeWorkout'));
              navigate('/entrenamiento/activo');
            }}
          />
          <Action icon={<Scale size={17} />} label={t('home.weighIn')} onClick={() => setWeighing(true)} />
        </div>

        {checkinPending && (
          <Link
            to="/checkin"
            className="pressable mt-3 flex items-center gap-3 rounded-2xl border border-violet/30 bg-violet/10 px-4 py-3"
          >
            <CalendarCheck size={18} className="shrink-0 text-violet" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-violet">{t('home.checkinDue')}</p>
              <p className="text-[12px] text-muted">{t('home.reviewWeek')}</p>
            </div>
          </Link>
        )}

        {/* ------------------------------------------------------- entreno */}
        <div className="mt-5">
          <SectionTitle action={<ActionLink to="/entrenamiento">{t('home.viewAll')}</ActionLink>}>
            {t('home.todayWorkout')}
          </SectionTitle>
          <Card>
            {todayWorkouts.length > 0 ? (
              <div className="space-y-3">
                {todayWorkouts.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{w.name}</p>
                      <p className="text-[12px] tabular text-faint">
                        {workoutSetCount(w)} {t('home.sets')} · {u.numWeight(workoutVolume(w), 0)}{' '}
                        {u.w}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand">
                      {t('home.completed')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-center text-[13px] text-muted">
                {active ? t('home.workoutInProgress') : t('home.noWorkoutToday')}
              </p>
            )}
          </Card>
        </div>

        {/* ---------------------------------------------------------- peso */}
        <div className="mt-5">
          <SectionTitle action={<ActionLink to="/cuerpo">{t('home.viewAll')}</ActionLink>}>
            {t('body.bodyWeight')}
          </SectionTitle>
          <Card>
            <div className="mb-3 flex items-end justify-between">
              <Stat label={t('home.current')} value={u.numWeight(weight)} unit={u.w} />
              <Stat
                label={t('home.weeklyTrend')}
                value={u.fmtWeightDelta(trend).replace(` ${u.w}`, '')}
                unit={u.w}
                tone={
                  trend === 0
                    ? 'text-muted'
                    : (profile.goal === 'definicion') === trend < 0
                      ? 'text-brand'
                      : 'text-amber'
                }
              />
              {profile.goalWeight && (
                <Stat label={t('home.target')} value={u.numWeight(profile.goalWeight)} unit={u.w} />
              )}
            </div>
            <LineChart
              data={series.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
              overlay={smoothed.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
              height={140}
              unit={` ${u.w}`}
            />
            <p className="mt-2 text-center text-[11px] text-faint">
              {t('body.trendNote')}
            </p>
          </Card>
        </div>

        {/* --------------------------------------------------------- resumen */}
        <div className="mt-5">
          <SectionTitle>{t('home.todaySummary')}</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <Stat label={t('home.foods')} value={entries.length} />
              <Stat label={t('home.kcalLeft')} value={Math.round(remaining.kcal)} tone="text-brand" />
              <Stat
                label={t('home.proteinLeft')}
                value={`${Math.round(remaining.protein)} g`}
                tone="text-protein"
              />
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
