import { useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck, Camera, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { ActionLink, Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Slider } from '@/components/ui/Field';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { ProgressTabs } from '@/features/body/ProgressTabs';
import { RecommendationCard } from './RecommendationCard';
import { recommend } from '@/domain/recommendations';
import { compareMetrics, DIRECTION_TONE, type MetricComparison } from '@/domain/weeklySummary';
import { PROJECTION_LABEL, PROJECTION_TONE } from '@/domain/competition';
import { addDays, shortDate, startOfWeek, today, weekRange } from '@/lib/date';
import { cx, fmtSigned } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { alive } from '@/store/persist';
import { useProfile, useProfileStore } from '@/store/profileStore';
import { useCheckinStore } from '@/store/checkinStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useBodyStore } from '@/store/bodyStore';
import { usePrepStore } from '@/store/prepStore';
import {
  useCheckins,
  useMeasurements,
  usePhotos,
  useProjection,
  useReadiness,
  useTargets,
  useWeekActivity,
  useWeightTrend,
  useWorkouts,
} from '@/store/selectors';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';

const MEASURE_FIELDS = [
  { key: 'waist', label: 'Cintura' },
  { key: 'chest', label: 'Pecho' },
  { key: 'arm', label: 'Brazo' },
  { key: 'thigh', label: 'Muslo' },
  { key: 'hip', label: 'Cadera' },
  { key: 'calf', label: 'Pantorrilla' },
] as const;

const SCALES = [
  { key: 'energy', label: 'Energia', lo: 'Agotado', hi: 'Excelente' },
  { key: 'sleep', label: 'Sueno', lo: 'Fatal', hi: 'Perfecto' },
  { key: 'hunger', label: 'Hambre', lo: 'Saciado', hi: 'Voraz' },
  { key: 'stress', label: 'Estres', lo: 'Tranquilo', hi: 'Al limite' },
  { key: 'digestion', label: 'Digestion', lo: 'Mala', hi: 'Perfecta' },
  { key: 'strength', label: 'Fuerza en el gimnasio', lo: 'En caida', hi: 'Subiendo' },
] as const;

export default function CheckinPage() {
  const profile = useProfile();
  const updateProfile = useProfileStore((s) => s.update);
  const measurements = useMeasurements();
  const workouts = useWorkouts();
  const checkins = useCheckins();
  const readiness = useReadiness();
  const photos = usePhotos();
  const entries = useNutritionStore((s) => s.entries);
  const targets = useTargets();
  const trend = useWeightTrend();
  const projection = useProjection();
  const upsert = useCheckinStore((s) => s.upsert);
  const upsertBody = useBodyStore((s) => s.upsert);
  const saveRecommendation = usePrepStore((s) => s.saveRecommendation);
  const recommendations = usePrepStore((s) => s.recommendations);
  const u = useUnits();

  const weekStart = startOfWeek(today());
  const prevStart = addDays(weekStart, -7);
  const week = useWeekActivity(weekStart);
  const prevWeek = useWeekActivity(prevStart);

  /* ─────────────────────────────────────────── datos calculados */

  const stats = useMemo(() => {
    const days = weekRange(weekStart).filter((d) => d <= today());
    const logged = days.filter((d) => alive(entries).some((e) => e.date === d)).length;
    const kcalDays = days
      .map((d) => alive(entries).filter((e) => e.date === d).reduce((n, e) => n + e.macros.kcal, 0))
      .filter((v) => v > 0);

    const avgOf = (key: 'energy' | 'sleepQuality' | 'hunger' | 'stress' | 'digestion', from: string, to: string) => {
      const vals = readiness
        .filter((r) => r.date >= from && r.date < to && r[key] != null)
        .map((r) => r[key] as number);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    return {
      autoAdherence: days.length ? Math.round((logged / days.length) * 100) : 0,
      avgKcal: kcalDays.length ? Math.round(kcalDays.reduce((a, b) => a + b, 0) / kcalDays.length) : undefined,
      workouts: workouts.filter((w) => w.date >= weekStart).length,
      prevWorkouts: workouts.filter((w) => w.date >= prevStart && w.date < weekStart).length,
      readinessNow: {
        energy: avgOf('energy', weekStart, addDays(weekStart, 7)),
        sleep: avgOf('sleepQuality', weekStart, addDays(weekStart, 7)),
        hunger: avgOf('hunger', weekStart, addDays(weekStart, 7)),
        stress: avgOf('stress', weekStart, addDays(weekStart, 7)),
        digestion: avgOf('digestion', weekStart, addDays(weekStart, 7)),
      },
      readinessPrev: {
        energy: avgOf('energy', prevStart, weekStart),
        sleep: avgOf('sleepQuality', prevStart, weekStart),
        hunger: avgOf('hunger', prevStart, weekStart),
        stress: avgOf('stress', prevStart, weekStart),
        digestion: avgOf('digestion', prevStart, weekStart),
      },
    };
  }, [entries, readiness, workouts, weekStart, prevStart]);

  const latestMeasurement = measurements[measurements.length - 1];
  const prevMeasurement = measurements[measurements.length - 2];

  /* ─────────────────────────────────────────── formulario */

  const [adherence, setAdherence] = useState(stats.autoAdherence);
  const [scales, setScales] = useState<Record<string, number>>({
    energy: 3, sleep: 3, hunger: 3, stress: 3, digestion: 3, strength: 3,
  });
  const [measures, setMeasures] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');

  /* ─────────────────────────────────────────── resumen automatico */

  const summary = useMemo(
    () =>
      compareMetrics([
        {
          key: 'weight',
          label: 'Peso (media 7 dias)',
          current: trend.avg7,
          previous: trend.prevAvg7,
          higherIsBetter: profile.goal === 'volumen',
          threshold: 0.2,
          unit: ' kg',
        },
        {
          key: 'waist',
          label: 'Cintura',
          current: latestMeasurement?.waist ?? null,
          previous: prevMeasurement?.waist ?? null,
          higherIsBetter: false,
          threshold: 0.5,
          unit: ' cm',
        },
        {
          key: 'cardio',
          label: 'Cardio completado',
          current: week.cardioMinutes,
          previous: prevWeek.cardioMinutes,
          higherIsBetter: true,
          threshold: 15,
          unit: ' min',
          decimals: 0,
        },
        {
          key: 'steps',
          label: 'Pasos diarios',
          current: week.avgSteps || null,
          previous: prevWeek.avgSteps || null,
          higherIsBetter: true,
          threshold: 500,
          decimals: 0,
        },
        {
          key: 'workouts',
          label: 'Entrenamientos',
          current: stats.workouts,
          previous: stats.prevWorkouts,
          higherIsBetter: true,
          threshold: 1,
          decimals: 0,
        },
        {
          key: 'energy',
          label: 'Energia',
          current: stats.readinessNow.energy,
          previous: stats.readinessPrev.energy,
          higherIsBetter: true,
          threshold: 0.4,
        },
        {
          key: 'sleep',
          label: 'Sueno',
          current: stats.readinessNow.sleep,
          previous: stats.readinessPrev.sleep,
          higherIsBetter: true,
          threshold: 0.4,
        },
        {
          key: 'hunger',
          label: 'Hambre',
          current: stats.readinessNow.hunger,
          previous: stats.readinessPrev.hunger,
          higherIsBetter: false,
          threshold: 0.4,
        },
      ]),
    [trend, latestMeasurement, prevMeasurement, week, prevWeek, stats, profile.goal],
  );

  /* ─────────────────────────────────────────── recomendacion */

  const recommendation = useMemo(
    () =>
      recommend({
        trend,
        projection: projection ?? {
          projectedWeight: null,
          vsTarget: null,
          requiredWeekly: null,
          currentWeekly: trend.weekChange,
          status: 'sin-objetivo',
          explanation: '',
          detail: { kind: 'no-target', weeklyKg: trend.weekChange ?? 0, projectedKg: 0 },
        },
        adherence,
        energy: scales.energy,
        sleep: scales.sleep,
        hunger: scales.hunger,
        stress: scales.stress,
        strength: scales.strength,
        cardioMinutes: week.cardioMinutes,
        workouts: stats.workouts,
        currentKcal: targets.kcal,
        weeksOut: null,
      }),
    [trend, projection, adherence, scales, week.cardioMinutes, stats.workouts, targets.kcal],
  );

  const savedRec = useMemo(
    () => alive(recommendations).find((r) => r.weekStart === weekStart),
    [recommendations, weekStart],
  );

  const weekPhotos = photos.filter((p) => p.date >= weekStart);

  /* ─────────────────────────────────────────── guardado */

  const saveCheckin = () => {
    const patch: Record<string, number> = {};
    for (const f of MEASURE_FIELDS) {
      const n = Number(measures[f.key]);
      if (n > 0) patch[f.key] = u.toCanonicalLength(n);
    }
    if (Object.keys(patch).length) upsertBody({ date: today(), ...patch });

    upsert({
      weekStart,
      avgWeight: trend.avg7 ?? profile.startWeight,
      weightChange: trend.weekChange ?? 0,
      ...(patch.waist ? { waist: patch.waist } : {}),
      adherence,
      energy: scales.energy,
      sleep: scales.sleep,
      hunger: scales.hunger,
      stress: scales.stress,
      workoutsCompleted: stats.workouts,
      avgKcal: stats.avgKcal,
      ...(comments.trim() ? { notes: comments.trim() } : {}),
    });
    toast('Check-in guardado');
  };

  const applyRecommendation = (kcalDelta: number, cardioDelta: number) => {
    saveRecommendation({
      weekStart,
      action: recommendation.action,
      headline: recommendation.headline,
      reasoning: recommendation.reasoning,
      dataUsed: recommendation.dataUsed,
      kcalDelta: recommendation.kcalDelta,
      cardioMinutesDelta: recommendation.cardioMinutesDelta,
      estimatedImpact: recommendation.estimatedImpact,
      confidence: recommendation.confidence,
      outcome: kcalDelta === recommendation.kcalDelta ? 'aceptada' : 'modificada',
      appliedKcalDelta: kcalDelta,
      appliedCardioDelta: cardioDelta,
    });

    if (kcalDelta !== 0) {
      const next = Math.max(1200, Math.round((targets.kcal + kcalDelta) / 10) * 10);
      updateProfile({ kcalOverride: next });
      toast(`Objetivo actualizado a ${next} kcal`);
    } else {
      toast('Recomendacion registrada');
    }
    saveCheckin();
  };

  return (
    <>
      <PageHeader
        title={t('screen.checkin')}
        subtitle={t('chk.weekOfShort', { date: shortDate(weekStart) })}
      />

      <Page>
        <ProgressTabs />

        {/* ─────────────────────────── datos de la semana */}
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label={t('daily.avg7')}
              value={trend.avg7 != null ? u.numWeight(trend.avg7) : '—'}
              unit={u.w}
            />
            <Stat
              label="Cambio"
              value={trend.weekChange != null ? u.fmtWeightDelta(trend.weekChange).replace(` ${u.w}`, '') : '—'}
              unit={u.w}
            />
            <Stat label="Entrenos" value={stats.workouts} sub={stats.avgKcal ? `${stats.avgKcal} kcal/dia` : undefined} />
          </div>
          {projection && projection.status !== 'sin-datos' && (
            <div className="mt-3 border-t border-line pt-3">
              <p className={cx('text-[13px] font-semibold', PROJECTION_TONE[projection.status])}>
                {PROJECTION_LABEL[projection.status]}
              </p>
              <p className="mt-1 text-[12px] text-muted">{projection.explanation}</p>
            </div>
          )}
        </Card>

        {/* ─────────────────────────── resumen automatico */}
        <div className="mt-5">
          <SectionTitle>{t('chk.weekSummary')}</SectionTitle>
          <Card>
            <p className="mb-3 text-[14px] font-medium">{summary.headline}</p>
            <div className="space-y-2.5">
              <Group title="Mejoro" items={summary.improved} icon={<TrendingUp size={13} />} />
              <Group title="Empeoro" items={summary.worsened} icon={<TrendingDown size={13} />} />
              <Group title={t('chk.stable')} items={summary.stable} icon={<Minus size={13} />} />
            </div>
            {summary.missing.length > 0 && (
              <p className="mt-3 border-t border-line pt-2 text-[11px] text-faint">
                Sin datos para comparar: {summary.missing.map((m) => m.label).join(', ')}
              </p>
            )}
          </Card>
        </div>

        {/* ─────────────────────────── medidas */}
        <div className="mt-5">
          <SectionTitle
            action={
              latestMeasurement ? (
                <span className="text-[11px] text-faint">
                  {t('chk.lastMeasure', { date: shortDate(latestMeasurement.date) })}
                </span>
              ) : undefined
            }
          >
            {t('chk.weekMeasurements')}
          </SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              {MEASURE_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label
                    hint={
                      latestMeasurement?.[f.key] != null
                        ? t('chk.before', { value: u.numLength(latestMeasurement[f.key] as number) })
                        : undefined
                    }
                  >
                    {f.label}
                  </Label>
                  <Input
                    inputMode="decimal"
                    value={measures[f.key] ?? ''}
                    onChange={(e) => setMeasures((v) => ({ ...v, [f.key]: e.target.value }))}
                    suffix={u.l}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ─────────────────────────── fotos */}
        <div className="mt-5">
          {/* ActionLink usa Link, no <a href>: un ancla recargaria toda la app
              y se perderia el formulario del check-in a medio rellenar. */}
          <SectionTitle action={<ActionLink to="/fotos">{t('common.add')}</ActionLink>}>
            {t('chk.weekPhotos')}
          </SectionTitle>
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface2 text-faint">
                <Camera size={19} />
              </div>
              <p className="text-[13px] text-muted">
                {weekPhotos.length > 0
                  ? t('chk.photosThisWeek', { n: weekPhotos.length })
                  : t('chk.noPhotosThisWeek')}
              </p>
            </div>
          </Card>
        </div>

        {/* ─────────────────────────── sensaciones */}
        <div className="mt-5">
          <SectionTitle>{t('chk.howWasWeek')}</SectionTitle>
          <Card>
            <div className="space-y-5">
              <div>
                <Label hint={`${adherence}%`}>Adherencia al plan</Label>
                <Slider
                  aria-label="Adherencia al plan"
                  value={adherence}
                  onChange={setAdherence}
                  min={0}
                  max={100}
                  step={5}
                  labels={['0%', '50%', '100%']}
                />
                <p className="mt-1 text-[11px] text-faint">
                  Calculado: registraste comida el {stats.autoAdherence}% de los dias
                </p>
              </div>

              {SCALES.map((s) => (
                <div key={s.key}>
                  <Label hint={`${scales[s.key]} / 5`}>{s.label}</Label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setScales((v) => ({ ...v, [s.key]: n }))}
                        className={cx(
                          'pressable h-11 flex-1 rounded-xl text-[15px] font-medium',
                          scales[s.key] === n
                            ? 'bg-brand text-base'
                            : 'border border-line bg-surface2 text-muted',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-faint">
                    <span>{s.lo}</span>
                    <span>{s.hi}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Label hint={t('common.optional')}>{t('chk.comments')}</Label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder={t('chk.notesPlaceholder')}
                className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
              />
            </div>
          </Card>
        </div>

        {/* ─────────────────────────── recomendacion */}
        <div className="mt-5">
          <SectionTitle>{t('chk.recommendation')}</SectionTitle>
          <RecommendationCard
            result={recommendation}
            currentKcal={targets.kcal}
            currentCardio={week.cardioPlanned || week.cardioMinutes}
            resolved={savedRec?.outcome}
            onAccept={applyRecommendation}
            onReject={() => {
              saveRecommendation({
                weekStart,
                action: recommendation.action,
                headline: recommendation.headline,
                reasoning: recommendation.reasoning,
                dataUsed: recommendation.dataUsed,
                kcalDelta: recommendation.kcalDelta,
                cardioMinutesDelta: recommendation.cardioMinutesDelta,
                estimatedImpact: recommendation.estimatedImpact,
                confidence: recommendation.confidence,
                outcome: 'rechazada',
              });
              saveCheckin();
              toast(t('chk.rejected'), 'info');
            }}
          />
        </div>

        <Button variant="secondary" size="lg" block className="mt-3" onClick={saveCheckin}>
          {t('chk.saveWithout')}
        </Button>

        {/* ─────────────────────────── historial */}
        <div className="mt-6">
          <SectionTitle>{t('chk.previous')}</SectionTitle>
          {checkins.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={22} />}
              title={t('chk.empty')}
              description={t('chk.emptyDesc')}
            />
          ) : (
            <div className="space-y-1.5">
              {checkins.map((c) => (
                <div key={c.id} className="rounded-2xl border border-line bg-surface px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-medium">
                      {t('chk.weekOfShort', { date: shortDate(c.weekStart) })}
                    </p>
                    <span className="text-[13px] tabular text-muted">{u.fmtWeight(c.avgWeight)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] tabular text-faint">
                    {u.fmtWeightDelta(c.weightChange)} · {c.adherence}% adherencia ·{' '}
                    {c.workoutsCompleted} entrenos
                    {c.kcalAdjustment ? ` · ${fmtSigned(c.kcalAdjustment)} kcal` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-[12px] text-faint">
          Proximo check-in: {shortDate(addDays(weekStart, 7))}
          <ArrowRight size={12} />
        </p>
      </Page>
    </>
  );
}

function Group({
  title,
  items,
  icon,
}: {
  title: string;
  items: MetricComparison[];
  icon: React.ReactNode;
}) {
  if (!items.length) return null;
  const tone = DIRECTION_TONE[items[0].direction];
  return (
    <div>
      <p className={cx('mb-1 flex items-center gap-1.5 text-[12px] font-semibold', tone)}>
        {icon}
        {title}
      </p>
      <div className="space-y-1">
        {items.map((m) => (
          <div key={m.key} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-muted">{m.label}</span>
            <span className="shrink-0 tabular text-[12px] text-faint">{m.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
