import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Stepper } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Misc';
import { LineChart } from '@/components/ui/Chart';
import { PROJECTION_LABEL, PROJECTION_TONE } from '@/domain/competition';
import { addDays, friendlyDate, today } from '@/lib/date';
import { cx, fmtSigned } from '@/lib/utils';
import { usePrepStore } from '@/store/prepStore';
import { useActivityStore } from '@/store/activityStore';
import { useCurrentWeight, useProjection, useReadiness, useWeightTrend } from '@/store/selectors';
import { useSettingsStore } from '@/store/settingsStore';
import { alive } from '@/store/persist';
import { toast } from '@/store/uiStore';

const SCALES = [
  { key: 'sleepQuality', label: 'Calidad del sueno', lo: 'Fatal', hi: 'Perfecto' },
  { key: 'energy', label: 'Energia', lo: 'Agotado', hi: 'Excelente' },
  { key: 'hunger', label: 'Hambre', lo: 'Saciado', hi: 'Voraz' },
  { key: 'stress', label: 'Estres', lo: 'Tranquilo', hi: 'Al limite' },
  { key: 'digestion', label: 'Digestion', lo: 'Mala', hi: 'Perfecta' },
] as const;

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
    toast('Registro guardado');
  };

  const chartData = useMemo(
    () => readiness.filter((r) => r.weight != null).slice(-60).map((r) => ({ date: r.date, value: r.weight as number })),
    [readiness],
  );

  return (
    <>
      <PageHeader
        title="Registro diario"
        subtitle={friendlyDate(date)}
        back
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDate((d) => addDays(d, -1))}
              className="pressable flex size-9 items-center justify-center rounded-full bg-surface2 text-muted"
              aria-label="Dia anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setDate((d) => addDays(d, 1))}
              disabled={date >= today()}
              className="pressable flex size-9 items-center justify-center rounded-full bg-surface2 text-muted disabled:opacity-30"
              aria-label="Dia siguiente"
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
            <Stat label="Media 7 dias" value={trend.avg7 != null ? trend.avg7.toFixed(1) : '—'} unit="kg" />
            <Stat
              label="Cambio semanal"
              value={trend.weekChange != null ? fmtSigned(trend.weekChange) : '—'}
              unit="kg"
            />
            <Stat
              label="Ritmo"
              value={trend.weekPct != null ? fmtSigned(trend.weekPct) : '—'}
              unit="%/sem"
            />
          </div>

          <LineChart data={chartData} height={150} unit=" kg" />

          <p className="mt-2 flex gap-2 text-[11px] text-faint">
            <Info size={12} className="mt-0.5 shrink-0" />
            Las decisiones se toman sobre la media de 7 dias, nunca sobre el peso de un dia suelto:
            el agua y el glucogeno mueven la bascula mas que la grasa en una semana.
          </p>

          {projection && projection.status !== 'sin-datos' && (
            <div className="mt-3 rounded-2xl border border-line bg-surface2 p-3">
              <p className={cx('text-[13px] font-semibold', PROJECTION_TONE[projection.status])}>
                {PROJECTION_LABEL[projection.status]}
              </p>
              <p className="mt-1 text-[12px] text-muted">{projection.explanation}</p>
            </div>
          )}
        </Card>

        {/* ───────────────────────────────────── peso */}
        <div className="mt-5">
          <SectionTitle>Peso en ayunas</SectionTitle>
          <Card>
            <div className="mb-3 text-center">
              <span className="text-[44px] leading-none font-bold tabular">{weight.toFixed(1)}</span>
              <span className="ml-1 text-[18px] text-faint">kg</span>
            </div>
            <Stepper value={weight} onChange={setWeight} step={0.1} min={30} max={300} decimals={1} suffix="kg" />
            <div className="mt-3">
              <Label hint="misma hora cada dia">Hora de la medicion</Label>
              <Input type="time" value={weighTime} onChange={(e) => setWeighTime(e.target.value)} />
            </div>
          </Card>
        </div>

        {/* ───────────────────────────────────── sensaciones */}
        <div className="mt-5">
          <SectionTitle>Como te sientes</SectionTitle>
          <Card>
            <div className="space-y-5">
              {SCALES.map((s) => (
                <div key={s.key}>
                  <Label hint={`${scales[s.key] ?? 3} / 5`}>{s.label}</Label>
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
          </Card>
        </div>

        {/* ───────────────────────────────────── actividad */}
        <div className="mt-5">
          <SectionTitle>Actividad</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div>
                <Label hint={`objetivo ${stepGoal.toLocaleString('es')}`}>Pasos</Label>
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
                <Label>Cardio de hoy</Label>
                <Input
                  inputMode="numeric"
                  value={cardioMinutes || ''}
                  onChange={(e) => setCardioMinutes(Number(e.target.value) || 0)}
                  suffix="min"
                  placeholder="0"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-5">
          <SectionTitle>Notas</SectionTitle>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Como fue el dia, molestias, contexto..."
            className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>

        <Button variant="primary" size="lg" block className="mt-4" onClick={save}>
          Guardar registro
        </Button>
      </Page>
    </>
  );
}
