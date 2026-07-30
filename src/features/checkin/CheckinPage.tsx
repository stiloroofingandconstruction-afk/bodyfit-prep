import { useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck, Check } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label, Slider } from '@/components/ui/Field';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { ProgressTabs } from '@/features/body/ProgressTabs';
import { analyzeCheckin, VERDICT_TONE } from '@/domain/checkin';
import { addDays, friendlyDate, shortDate, startOfWeek, today, weekRange } from '@/lib/date';
import { cx, fmtSigned } from '@/lib/utils';
import { useProfile, useProfileStore } from '@/store/profileStore';
import { useCheckinStore } from '@/store/checkinStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useCheckins, useMeasurements, useTargets, useWorkouts } from '@/store/selectors';
import { alive } from '@/store/persist';
import { toast } from '@/store/uiStore';

export default function CheckinPage() {
  const profile = useProfile();
  const updateProfile = useProfileStore((s) => s.update);
  const measurements = useMeasurements();
  const workouts = useWorkouts();
  const checkins = useCheckins();
  const entries = useNutritionStore((s) => s.entries);
  const targets = useTargets();
  const upsert = useCheckinStore((s) => s.upsert);

  const weekStart = startOfWeek(today());
  const prevStart = addDays(weekStart, -7);

  /* Medias semanales de peso: comparar medias, no dias sueltos. */
  const stats = useMemo(() => {
    const avg = (from: string, to: string) => {
      const vals = measurements
        .filter((m) => m.date >= from && m.date < to && typeof m.weight === 'number')
        .map((m) => m.weight as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const thisWeek = avg(weekStart, addDays(weekStart, 7));
    const lastWeek = avg(prevStart, weekStart);
    const days = weekRange(weekStart).filter((d) => d <= today());
    const daysLogged = days.filter((d) => alive(entries).some((e) => e.date === d)).length;
    const kcalDays = days
      .map((d) => alive(entries).filter((e) => e.date === d).reduce((n, e) => n + e.macros.kcal, 0))
      .filter((v) => v > 0);

    return {
      thisWeek,
      lastWeek,
      change: thisWeek != null && lastWeek != null ? thisWeek - lastWeek : 0,
      workouts: workouts.filter((w) => w.date >= weekStart).length,
      autoAdherence: days.length ? Math.round((daysLogged / days.length) * 100) : 0,
      avgKcal: kcalDays.length ? Math.round(kcalDays.reduce((a, b) => a + b, 0) / kcalDays.length) : undefined,
    };
  }, [measurements, workouts, entries, weekStart, prevStart]);

  const [adherence, setAdherence] = useState(stats.autoAdherence);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [hunger, setHunger] = useState(3);
  const [stress, setStress] = useState(3);

  const currentWeight = stats.thisWeek ?? profile.startWeight;

  const result = useMemo(
    () =>
      analyzeCheckin({
        profile,
        currentWeight,
        weightChange: stats.change,
        adherence,
        energy,
        sleep,
        hunger,
        stress,
        workoutsCompleted: stats.workouts,
        currentKcal: targets.kcal,
      }),
    [profile, currentWeight, stats, adherence, energy, sleep, hunger, stress, targets.kcal],
  );

  const alreadyDone = checkins.some((c) => c.weekStart === weekStart);

  const save = (applyAdjustment: boolean) => {
    upsert({
      weekStart,
      avgWeight: Math.round(currentWeight * 10) / 10,
      weightChange: Math.round(stats.change * 100) / 100,
      adherence,
      energy,
      sleep,
      hunger,
      stress,
      workoutsCompleted: stats.workouts,
      avgKcal: stats.avgKcal,
      kcalAdjustment: applyAdjustment ? result.kcalAdjustment : 0,
      newKcalTarget: applyAdjustment ? result.newKcalTarget : targets.kcal,
    });
    if (applyAdjustment && result.kcalAdjustment !== 0) {
      updateProfile({ kcalOverride: result.newKcalTarget });
      toast(`Objetivo actualizado a ${result.newKcalTarget} kcal`);
    } else {
      toast('Check-in guardado');
    }
  };

  return (
    <>
      <PageHeader title="Check-in semanal" subtitle={`Semana del ${shortDate(weekStart)}`} />

      <Page>
        <ProgressTabs />

        {/* -------------------------------------------------- datos de la semana */}
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Peso medio"
              value={stats.thisWeek != null ? stats.thisWeek.toFixed(1) : '—'}
              unit="kg"
              sub={stats.lastWeek != null ? `antes ${stats.lastWeek.toFixed(1)}` : 'sin semana previa'}
            />
            <Stat
              label="Cambio"
              value={stats.thisWeek != null && stats.lastWeek != null ? fmtSigned(stats.change) : '—'}
              unit="kg"
              tone={VERDICT_TONE[result.verdict]}
            />
            <Stat label="Entrenos" value={stats.workouts} sub={stats.avgKcal ? `${stats.avgKcal} kcal/dia` : undefined} />
          </div>
        </Card>

        {/* --------------------------------------------------------- sensaciones */}
        <div className="mt-5">
          <SectionTitle>¿Como fue la semana?</SectionTitle>
          <Card>
            <div className="space-y-5">
              <div>
                <Label hint={`${adherence}%`}>Adherencia al plan</Label>
                <Slider value={adherence} onChange={setAdherence} min={0} max={100} step={5} labels={['0%', '50%', '100%']} />
                <p className="mt-1 text-[11px] text-faint">
                  Calculado: registraste comida {stats.autoAdherence}% de los dias
                </p>
              </div>
              <Scale5 label="Energia" value={energy} onChange={setEnergy} lo="Agotado" hi="Excelente" />
              <Scale5 label="Sueno" value={sleep} onChange={setSleep} lo="Fatal" hi="Perfecto" />
              <Scale5 label="Hambre" value={hunger} onChange={setHunger} lo="Saciado" hi="Voraz" />
              <Scale5 label="Estres" value={stress} onChange={setStress} lo="Tranquilo" hi="Al limite" />
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------- veredicto */}
        <div className="mt-5">
          <SectionTitle>Diagnostico</SectionTitle>
          <Card>
            <div className="flex items-start gap-3">
              <div
                className={cx(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface2',
                  VERDICT_TONE[result.verdict],
                )}
              >
                <CalendarCheck size={19} />
              </div>
              <div className="min-w-0">
                <p className={cx('text-[16px] font-semibold', VERDICT_TONE[result.verdict])}>
                  {result.headline}
                </p>
                <p className="mt-1 text-[13px] text-muted">{result.detail}</p>
              </div>
            </div>

            {result.kcalAdjustment !== 0 && (
              <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-line bg-surface2 py-3">
                <div className="text-center">
                  <p className="text-[11px] text-faint">Ahora</p>
                  <p className="text-[19px] font-semibold tabular">{targets.kcal}</p>
                </div>
                <ArrowRight size={18} className="text-brand" />
                <div className="text-center">
                  <p className="text-[11px] text-faint">Nuevo</p>
                  <p className="text-[19px] font-semibold tabular text-brand">{result.newKcalTarget}</p>
                </div>
              </div>
            )}

            {result.tips.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {result.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-[13px] text-muted">
                    <Check size={14} className="mt-0.5 shrink-0 text-brand" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="mt-3 space-y-2">
          {result.kcalAdjustment !== 0 && (
            <Button variant="primary" size="lg" block onClick={() => save(true)}>
              Aplicar {fmtSigned(result.kcalAdjustment)} kcal y guardar
            </Button>
          )}
          <Button variant="secondary" size="lg" block onClick={() => save(false)}>
            Guardar sin cambiar calorias
          </Button>
          {alreadyDone && (
            <p className="text-center text-[12px] text-faint">
              Ya hiciste el check-in de esta semana. Guardar lo sobrescribe.
            </p>
          )}
        </div>

        {/* -------------------------------------------------------- historial */}
        <div className="mt-6">
          <SectionTitle>Check-ins anteriores</SectionTitle>
          {checkins.length === 0 ? (
            <EmptyState
              title="Sin check-ins"
              description="Haz uno cada lunes. Es lo que convierte los datos sueltos en decisiones."
            />
          ) : (
            <div className="space-y-1.5">
              {checkins.map((c) => (
                <div key={c.id} className="rounded-2xl border border-line bg-surface px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-medium">Semana del {shortDate(c.weekStart)}</p>
                    <span className="text-[13px] tabular text-muted">{c.avgWeight.toFixed(1)} kg</span>
                  </div>
                  <p className="mt-0.5 text-[12px] tabular text-faint">
                    {fmtSigned(c.weightChange)} kg · {c.adherence}% adherencia · {c.workoutsCompleted} entrenos
                    {c.kcalAdjustment ? ` · ${fmtSigned(c.kcalAdjustment)} kcal` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-faint">
          Proximo check-in: {friendlyDate(addDays(weekStart, 7))}
        </p>
      </Page>
    </>
  );
}

function Scale5({
  label,
  value,
  onChange,
  lo,
  hi,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  lo: string;
  hi: string;
}) {
  return (
    <div>
      <Label hint={`${value} / 5`}>{label}</Label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cx(
              'pressable h-11 flex-1 rounded-xl text-[15px] font-medium',
              value === n ? 'bg-brand text-base' : 'border border-line bg-surface2 text-muted',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-faint">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}
