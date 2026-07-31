import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Footprints, PersonStanding, Timer, Trophy } from 'lucide-react';
import { ActionLink, Card, SectionTitle } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Misc';
import { Ring } from '@/components/ui/Ring';
import { PROJECTION_LABEL, PROJECTION_TONE } from '@/domain/competition';
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
        text: `Solo ${trend.daysLogged14} pesos en 14 dias. Con menos de 7 no se puede leer la tendencia.`,
      });
    }
    if (weekStats.adherence < 80 && weekStats.adherence > 0) {
      out.push({
        tone: 'text-carbs',
        text: `Adherencia del ${weekStats.adherence}% esta semana. Los ajustes solo valen sobre un plan cumplido.`,
      });
    }
    if (weekStats.sleep != null && weekStats.sleep <= 2.5) {
      out.push({ tone: 'text-rose', text: `Sueno medio de ${weekStats.sleep}/5. Afecta al peso y al rendimiento.` });
    }
    if (cd && cd.daysOut <= 14 && cd.daysOut >= 0) {
      out.push({
        tone: 'text-violet',
        text: `Quedan ${cd.daysOut} dias. Revisa la logistica del show si aun no lo has hecho.`,
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
                {cd.daysOut < 0 ? 'dias despues' : 'dias'}
              </span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] text-faint">
                <Trophy size={12} className="text-brand" />
                <span className="truncate">{prep.showName}</span>
              </p>
              <p className={cx('mt-1 text-[17px] leading-tight font-bold', cd.phase.tone)}>
                {cd.phase.label}
              </p>
              <p className="mt-1 text-[12px] text-muted">{cd.phase.focus}</p>
            </div>
          </div>
        </Card>
      </Link>

      {/* ─────────────────────────────────── peso y ritmo */}
      <div className="mt-3">
        <SectionTitle
          action={
            <ActionLink to="/diario">Registrar</ActionLink>
          }
        >
          Peso y ritmo
        </SectionTitle>
        <Card>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Media 7d" value={trend.avg7 != null ? u.numWeight(trend.avg7) : '—'} unit={u.w} />
            <Stat
              label="Semanal"
              value={trend.weekChange != null ? u.fmtWeightDelta(trend.weekChange).replace(` ${u.w}`, '') : '—'}
              unit={u.w}
            />
            <Stat
              label="Ritmo"
              value={trend.weekPct != null ? `${trend.weekPct > 0 ? '+' : ''}${trend.weekPct.toFixed(1)}` : '—'}
              unit="%"
            />
            <Stat
              label="Total"
              value={trend.avg7 != null ? u.fmtWeightDelta(trend.avg7 - prep.startWeight).replace(` ${u.w}`, '') : '—'}
              unit={u.w}
            />
          </div>

          {projection && (
            <div className="mt-3 border-t border-line pt-3">
              <p className={cx('text-[13px] font-semibold', PROJECTION_TONE[projection.status])}>
                {PROJECTION_LABEL[projection.status]}
              </p>
              <p className="mt-1 text-[12px] text-muted">{projection.explanation}</p>
            </div>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────── nutricion */}
      <div className="mt-3">
        <SectionTitle
          action={
            <ActionLink to="/nutricion">Ver</ActionLink>
          }
        >
          Objetivo de hoy
        </SectionTitle>
        <Card>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Kcal" value={targets.kcal} tone="text-brand" sub={`${Math.round(consumed.kcal)} hoy`} />
            <Stat label="Prot" value={`${targets.protein}g`} tone="text-protein" />
            <Stat label="Carb" value={`${targets.carbs}g`} tone="text-carbs" />
            <Stat label="Gras" value={`${targets.fat}g`} tone="text-fat" />
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────── semana */}
      <div className="mt-3">
        <SectionTitle>Esta semana</SectionTitle>
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/cardio" className="pressable">
              <Stat
                label="Cardio"
                value={week.cardioMinutes}
                unit="min"
                sub={week.cardioPlanned ? `de ${week.cardioPlanned} plan.` : undefined}
              />
            </Link>
            <Link to="/cardio" className="pressable">
              <Stat
                label="Pasos / dia"
                value={week.avgSteps || '—'}
                sub={week.avgSteps ? `${Math.round((week.avgSteps / stepGoal) * 100)}% objetivo` : undefined}
              />
            </Link>
            <Link to="/posing" className="pressable">
              <Stat label="Posing" value={week.posingMinutes} unit="min" />
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <Stat label="Adherencia" value={`${weekStats.adherence}%`} />
            <Stat label="Entrenos" value={weekStats.workouts} />
            <Stat label="Sueno" value={weekStats.sleep != null ? `${weekStats.sleep}/5` : '—'} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <Stat label="Energia" value={weekStats.energy != null ? `${weekStats.energy}/5` : '—'} />
            <Stat label="Hambre" value={weekStats.hunger != null ? `${weekStats.hunger}/5` : '—'} />
            <Stat label="Estres" value={weekStats.stress != null ? `${weekStats.stress}/5` : '—'} />
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────── alertas */}
      {alerts.length > 0 && (
        <div className="mt-3">
          <SectionTitle>A tener en cuenta</SectionTitle>
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
        <Quick to="/diario" label="Diario" Icon={Timer} />
        <Quick to="/cardio" label="Cardio" Icon={Footprints} />
        <Quick to="/posing" label="Posing" Icon={PersonStanding} />
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
