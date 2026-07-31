import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Footprints, PersonStanding, Timer, Trophy } from 'lucide-react';
import { ActionLink, Card, SectionTitle } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Misc';
import { Ring } from '@/components/ui/Ring';
import { ProjectionText } from '@/features/competition/ProjectionText';
import { phaseFocus, phaseLabel } from '@/i18n/labels';
import { startOfWeek, today, weekRange } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { alive } from '@/store/persist';
import { useNutritionStore } from '@/store/nutritionStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  useActivePrep,
  useCountdown,
  useDayNutrition,
  useProjection,
  useReadiness,
  useTargets,
  useWeekActivity,
  useWeightTrend,
  useWorkouts,
} from '@/store/selectors';
import { t } from '@/i18n';

/**
 * Panel de competencia.
 *
 * Sustituye al dashboard normal cuando el modo competencia esta activo. Todo lo
 * que muestra sale de datos reales; los indicadores explican el porque en vez de
 * lanzar avisos alarmistas.
 */
export function CompetitionDashboard() {
  const prep = useActivePrep();
  const cd = useCountdown();
  const trend = useWeightTrend();
  const projection = useProjection();
  const targets = useTargets();
  const readiness = useReadiness();
  const workouts = useWorkouts();
  const entries = useNutritionStore((s) => s.entries);
  const stepGoal = useSettingsStore((s) => s.stepGoal);
  const u = useUnits();
  const { consumed } = useDayNutrition(today());

  const weekStart = startOfWeek(today());
  const week = useWeekActivity(weekStart);

  const weekStats = useMemo(() => {
    const days = weekRange(weekStart).filter((d) => d <= today());
    const logged = days.filter((d) => alive(entries).some((e) => e.date === d)).length;
    const recent = readiness.filter((r) => r.date >= weekStart);
    const avg = (key: 'sleepQuality' | 'energy' | 'hunger' | 'stress') => {
      const vals = recent.filter((r) => r[key] != null).map((r) => r[key] as number);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    return {
      adherence: days.length ? Math.round((logged / days.length) * 100) : 0,
      workouts: workouts.filter((w) => w.date >= weekStart).length,
      sleep: avg('sleepQuality'),
      energy: avg('energy'),
      hunger: avg('hunger'),
      stress: avg('stress'),
    };
  }, [entries, readiness, workouts, weekStart]);

  /* Alertas: solo lo accionable, con el dato delante */
  const alerts = useMemo(() => {
    const out: { tone: string; text: string }[] = [];
    if (!trend.reliable) {
      out.push({
        tone: 'text-carbs',
        text: t('comp.alertTrend', { n: trend.daysLogged14 }),
      });
    }
    if (weekStats.adherence < 80 && weekStats.adherence > 0) {
      out.push({
        tone: 'text-carbs',
        text: t('comp.alertAdherence', { pct: weekStats.adherence }),
      });
    }
    if (weekStats.sleep != null && weekStats.sleep <= 2.5) {
      out.push({ tone: 'text-rose', text: t('comp.alertSleep', { n: weekStats.sleep }) });
    }
    if (cd && cd.daysOut <= 14 && cd.daysOut >= 0) {
      out.push({
        tone: 'text-violet',
        text: t('comp.alertShowSoon', { n: cd.daysOut }),
      });
    }
    return out;
  }, [trend, weekStats, cd]);

  if (!prep || !cd) return null;

  const totalDays = Math.max(1, cd.totalDays);

  return (
    <>
      {/* ─────────────────────────────────── cuenta atras */}
      <Link to="/competencia" className="block">
        <Card className="pressable">
          <div className="flex items-center gap-5">
            <Ring value={cd.elapsedDays} max={totalDays} size={112} stroke={10} warnOver={false}>
              {/* leading-[1.1] y no leading-none: con 30 px la caja de linea
                  queda mas corta que el glifo y el numero se recorta. */}
              <span className="text-[30px] leading-[1.1] font-bold tabular">
                {Math.max(0, cd.daysOut)}
              </span>
              <span className="mt-0.5 text-[10px] tracking-wider text-faint uppercase">
                {cd.daysOut < 0 ? t('comp.daysAfter') : t('comp.days')}
              </span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] text-faint">
                <Trophy size={12} className="text-brand" />
                <span className="truncate">{prep.showName}</span>
              </p>
              <p className={cx('mt-1 text-[17px] leading-tight font-bold', cd.phase.tone)}>
                {phaseLabel(cd.phase)}
              </p>
              <p className="mt-1 text-[12px] text-muted">{phaseFocus(cd.phase)}</p>
            </div>
          </div>
        </Card>
      </Link>

      {/* ─────────────────────────────────── peso y ritmo */}
      <div className="mt-3">
        <SectionTitle
          action={
            <ActionLink to="/diario">{t('comp.log')}</ActionLink>
          }
        >
          {t('home.weightAndPace')}
        </SectionTitle>
        <Card>
          <div className="grid grid-cols-4 gap-2">
            <Stat
              label={t('comp.avg7d')}
              value={trend.avg7 != null ? u.numWeight(trend.avg7) : '—'}
              unit={u.w}
            />
            <Stat
              label={t('comp.weekly')}
              value={trend.weekChange != null ? u.fmtWeightDelta(trend.weekChange).replace(` ${u.w}`, '') : '—'}
              unit={u.w}
            />
            <Stat
              label={t('daily.pace')}
              value={trend.weekPct != null ? `${trend.weekPct > 0 ? '+' : ''}${trend.weekPct.toFixed(1)}` : '—'}
              unit="%"
            />
            <Stat
              label={t('comp.total')}
              value={trend.avg7 != null ? u.fmtWeightDelta(trend.avg7 - prep.startWeight).replace(` ${u.w}`, '') : '—'}
              unit={u.w}
            />
          </div>

          {projection && (
            <div className="mt-3 border-t border-line pt-3">
              <ProjectionText projection={projection} />
            </div>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────── nutricion */}
      <div className="mt-3">
        <SectionTitle
          action={
            <ActionLink to="/nutricion">{t('comp.view')}</ActionLink>
          }
        >
          {t('home.todayTarget')}
        </SectionTitle>
        <Card>
          <div className="grid grid-cols-4 gap-2">
            <Stat
              label="kcal"
              value={targets.kcal}
              tone="text-brand"
              sub={t('comp.todayShort', { n: Math.round(consumed.kcal) })}
            />
            <Stat label={t('field.protein')} value={`${targets.protein} g`} tone="text-protein" />
            <Stat label={t('field.carbs')} value={`${targets.carbs} g`} tone="text-carbs" />
            <Stat label={t('field.fat')} value={`${targets.fat} g`} tone="text-fat" />
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────── semana */}
      <div className="mt-3">
        <SectionTitle>{t('comp.thisWeek')}</SectionTitle>
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/cardio" className="pressable">
              <Stat
                label={t('daily.cardio')}
                value={week.cardioMinutes}
                unit={t('cardio.min')}
                sub={
                  week.cardioPlanned ? t('comp.ofPlanned', { n: week.cardioPlanned }) : undefined
                }
              />
            </Link>
            <Link to="/cardio" className="pressable">
              <Stat
                label={t('comp.stepsPerDay')}
                value={week.avgSteps || '—'}
                sub={
                  week.avgSteps
                    ? t('comp.pctOfGoal', { pct: Math.round((week.avgSteps / stepGoal) * 100) })
                    : undefined
                }
              />
            </Link>
            <Link to="/posing" className="pressable">
              <Stat label={t('posing.title')} value={week.posingMinutes} unit={t('cardio.min')} />
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <Stat label={t('comp.adherence')} value={`${weekStats.adherence}%`} />
            <Stat label={t('comp.workouts')} value={weekStats.workouts} />
            <Stat label={t('comp.sleep')} value={weekStats.sleep != null ? `${weekStats.sleep}/5` : '—'} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <Stat label={t('comp.energy')} value={weekStats.energy != null ? `${weekStats.energy}/5` : '—'} />
            <Stat label={t('comp.hunger')} value={weekStats.hunger != null ? `${weekStats.hunger}/5` : '—'} />
            <Stat label={t('comp.stress')} value={weekStats.stress != null ? `${weekStats.stress}/5` : '—'} />
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────── alertas */}
      {alerts.length > 0 && (
        <div className="mt-3">
          <SectionTitle>{t('comp.watchOut')}</SectionTitle>
          <Card>
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-muted">
                  <AlertCircle size={15} className={cx('mt-0.5 shrink-0', a.tone)} />
                  {a.text}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────── accesos */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Quick to="/diario" label={t('comp.quickDaily')} Icon={Timer} />
        <Quick to="/cardio" label={t('daily.cardio')} Icon={Footprints} />
        <Quick to="/posing" label={t('posing.title')} Icon={PersonStanding} />
      </div>
    </>
  );
}

function Quick({
  to,
  label,
  Icon,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Link
      to={to}
      className="pressable flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface py-3.5"
    >
      <Icon size={19} className="text-brand" />
      <span className="text-[12px] font-medium">{label}</span>
    </Link>
  );
}
