import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Stepper } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Misc';
import { LineChart } from '@/components/ui/Chart';
import { PROJECTION_TONE } from '@/domain/competition';
import { projectionLabel } from '@/i18n/labels';
import { addDays, friendlyDate, today } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { usePrepStore } from '@/store/prepStore';
import { useActivityStore } from '@/store/activityStore';
import { useCurrentWeight, useProjection, useReadiness, useWeightTrend } from '@/store/selectors';
import { useSettingsStore } from '@/store/settingsStore';
import { alive } from '@/store/persist';
import { toast } from '@/store/uiStore';
import { localeTag } from '@/lib/date';
import { t, type Dict } from '@/i18n';

const SCALES: { key: string; label: keyof Dict; lo: keyof Dict; hi: keyof Dict }[] = [
  { key: 'sleepQuality', label: 'daily.sleep', lo: 'daily.sleepLo', hi: 'daily.sleepHi' },
  { key: 'energy', label: 'daily.energy', lo: 'daily.energyLo', hi: 'daily.energyHi' },
  { key: 'hunger', label: 'daily.hunger', lo: 'daily.hungerLo', hi: 'daily.hungerHi' },
  { key: 'stress', label: 'daily.stress', lo: 'daily.stressLo', hi: 'daily.stressHi' },
  { key: 'digestion', label: 'daily.digestion', lo: 'daily.digestionLo', hi: 'daily.digestionHi' },
];

export default function DailyLogPage() {
  const [date, setDate] = useState(today());
  const readiness = useReadiness();
  const logReadiness = usePrepStore((s) => s.logReadiness);
  const setSteps = useActivityStore((s) => s.setSteps);
  const stepEntries = useActivityStore((s) => s.steps);
  const stepGoal = useSettingsStore((s) => s.stepGoal);
  const trend = useWeightTrend();
  const projection = useProjection();
  const currentWeight = useCurrentWeight();
  const u = useUnits();

  const existing = useMemo(() => readiness.find((r) => r.date === date), [readiness, date]);
  const savedSteps = useMemo(
    () => alive(stepEntries).find((s) => s.date === date)?.steps ?? 0,
    [stepEntries, date],
  );

  const [weight, setWeight] = useState(currentWeight);
  const [weighTime, setWeighTime] = useState('07:00');
  const [scales, setScales] = useState<Record<string, number>>({});
  const [steps, setStepsLocal] = useState(0);
  const [cardioMinutes, setCardioMinutes] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setWeight(existing?.weight ?? currentWeight);
    setWeighTime(existing?.weighTime ?? '07:00');
    setScales({
      sleepQuality: existing?.sleepQuality ?? 3,
      energy: existing?.energy ?? 3,
      hunger: existing?.hunger ?? 3,
      stress: existing?.stress ?? 3,
      digestion: existing?.digestion ?? 3,
    });
    setStepsLocal(savedSteps);
    setCardioMinutes(existing?.cardioMinutes ?? 0);
    setNotes(existing?.notes ?? '');
  }, [existing, savedSteps, currentWeight, date]);

  const save = () => {
    logReadiness({
      date,
      weight,
      weighTime,
      sleepQuality: scales.sleepQuality,
      energy: scales.energy,
      hunger: scales.hunger,
      stress: scales.stress,
      digestion: scales.digestion,
      cardioMinutes,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    if (steps > 0) setSteps(date, steps);
    toast(t('daily.saved'));
  };

  const chartData = useMemo(
    () => readiness.filter((r) => r.weight != null).slice(-60).map((r) => ({ date: r.date, value: r.weight as number })),
    [readiness],
  );

  return (
    <>
      <PageHeader
        title={t('daily.title')}
        subtitle={friendlyDate(date)}
        back
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDate((d) => addDays(d, -1))}
              className="pressable flex size-9 items-center justify-center rounded-full bg-surface2 text-muted"
              aria-label={t('nut.prevDay')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setDate((d) => addDays(d, 1))}
              disabled={date >= today()}
              className="pressable flex size-9 items-center justify-center rounded-full bg-surface2 text-muted disabled:opacity-30"
              aria-label={t('nut.nextDay')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      <Page>
        {/* ───────────────────────────────────── tendencia */}
        <Card>
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Stat
              label={t('daily.avg7')}
              value={trend.avg7 != null ? u.numWeight(trend.avg7) : '—'}
              unit={u.w}
            />
            <Stat
              label={t('daily.weekChange')}
              value={trend.weekChange != null ? u.fmtWeightDelta(trend.weekChange).replace(` ${u.w}`, '') : '—'}
              unit={u.w}
            />
            <Stat
              label={t('daily.pace')}
              value={trend.weekPct != null ? `${trend.weekPct > 0 ? '+' : ''}${trend.weekPct.toFixed(1)}` : '—'}
              unit={t('daily.pacePerWeek')}
            />
          </div>

          <LineChart
            data={chartData.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
            height={150}
            unit={` ${u.w}`}
          />

          <p className="mt-2 flex gap-2 text-[11px] text-faint">
            <Info size={12} className="mt-0.5 shrink-0" />
            {t('daily.avgNote')}
          </p>

          {projection && projection.status !== 'sin-datos' && (
            <div className="mt-3 rounded-2xl border border-line bg-surface2 p-3">
              <p className={cx('text-[13px] font-semibold', PROJECTION_TONE[projection.status])}>
                {projectionLabel(projection.status)}
              </p>
              <p className="mt-1 text-[12px] text-muted">{projection.explanation}</p>
            </div>
          )}
        </Card>

        {/* ───────────────────────────────────── peso */}
        <div className="mt-5">
          <SectionTitle>{t('daily.weight')}</SectionTitle>
          <Card>
            <div className="mb-3 text-center">
              <span className="text-[44px] leading-[1.1] font-bold tabular">
                {u.numWeight(weight)}
              </span>
              <span className="ml-1 text-[18px] text-faint">{u.w}</span>
            </div>
            <Stepper
              value={u.toDisplayWeight(weight)}
              onChange={(v) => setWeight(u.toCanonicalWeight(v))}
              step={u.weightStep}
              min={u.weightRange.min}
              max={u.weightRange.max}
              decimals={1}
              suffix={u.w}
            />
            <div className="mt-3">
              <Label hint={t('daily.timeHint')}>{t('daily.timeLabel')}</Label>
              <Input
                aria-label={t('daily.timeLabel')}
                type="time"
                value={weighTime}
                onChange={(e) => setWeighTime(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* ───────────────────────────────────── sensaciones */}
        <div className="mt-5">
          <SectionTitle>{t('daily.feelings')}</SectionTitle>
          <Card>
            <div className="space-y-5">
              {SCALES.map((s) => (
                <div key={s.key}>
                  <Label hint={`${scales[s.key] ?? 3} / 5`}>{t(s.label)}</Label>
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
                    <span>{t(s.lo)}</span>
                    <span>{t(s.hi)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ───────────────────────────────────── actividad */}
        <div className="mt-5">
          <SectionTitle>{t('daily.activity')}</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div>
                <Label hint={t('daily.stepsGoal', { n: stepGoal.toLocaleString(localeTag()) })}>
                  {t('daily.steps')}
                </Label>
                <Input
                  inputMode="numeric"
                  value={steps || ''}
                  onChange={(e) => setStepsLocal(Number(e.target.value) || 0)}
                  placeholder="0"
                />
                {steps > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, (steps / stepGoal) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>{t('daily.todayCardio')}</Label>
                <Input
                  inputMode="numeric"
                  value={cardioMinutes || ''}
                  onChange={(e) => setCardioMinutes(Number(e.target.value) || 0)}
                  suffix={t('cardio.min')}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-5">
          <SectionTitle>{t('common.notes')}</SectionTitle>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('daily.notesPlaceholder')}
            className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>

        <Button variant="primary" size="lg" block className="mt-4" onClick={save}>
          {t('daily.saveLog')}
        </Button>
      </Page>
    </>
  );
}
