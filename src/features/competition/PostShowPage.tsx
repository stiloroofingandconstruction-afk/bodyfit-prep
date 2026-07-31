import { useEffect, useMemo, useState } from 'react';
import { Heart, Info } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Stepper } from '@/components/ui/Field';
import { EmptyState, Stat } from '@/components/ui/Misc';
import { LineChart } from '@/components/ui/Chart';
import { addDays, friendlyDate, today } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { alive } from '@/store/persist';
import { usePrepStore } from '@/store/prepStore';
import { useActivePrep, useTargets } from '@/store/selectors';
import { toast } from '@/store/uiStore';

const SCALES = [
  { key: 'hunger', label: 'Hambre' },
  { key: 'sleep', label: 'Sueno' },
  { key: 'digestion', label: 'Digestion' },
  { key: 'mood', label: 'Estado de animo' },
] as const;

export default function PostShowPage() {
  const prep = useActivePrep();
  const targets = useTargets();
  const plans = usePrepStore((s) => s.postShowPlans);
  const entries = usePrepStore((s) => s.postShowEntries);
  const savePostShow = usePrepStore((s) => s.savePostShow);
  const logPostShow = usePrepStore((s) => s.logPostShow);
  const u = useUnits();

  const plan = useMemo(
    () => (prep ? alive(plans).find((p) => p.prepId === prep.id) : undefined),
    [plans, prep],
  );

  const [startKcal, setStartKcal] = useState(targets.kcal);
  const [targetKcal, setTargetKcal] = useState(Math.round(targets.kcal * 1.35));
  const [weeks, setWeeks] = useState(8);

  const [weight, setWeight] = useState(0);
  const [scales, setScales] = useState<Record<string, number>>({
    hunger: 3, sleep: 3, digestion: 3, mood: 3,
  });
  const [adherence, setAdherence] = useState(90);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (plan) {
      setStartKcal(plan.startKcal);
      setTargetKcal(plan.targetKcal);
      setWeeks(plan.weeks);
    }
  }, [plan]);

  const log = useMemo(
    () => alive(entries).sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  const weightSeries = useMemo(
    () => log.filter((e) => e.weight != null).map((e) => ({ date: e.date, value: e.weight as number })),
    [log],
  );

  /** Escalonado lineal de calorias a lo largo de las semanas previstas. */
  const ramp = useMemo(() => {
    const step = (targetKcal - startKcal) / Math.max(1, weeks);
    return Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      kcal: Math.round((startKcal + step * (i + 1)) / 10) * 10,
    }));
  }, [startKcal, targetKcal, weeks]);

  if (!prep) {
    return (
      <>
        <PageHeader title="Post-show" back />
        <Page>
          <EmptyState
            title="Sin competencia activa"
            description="El modulo post-show se activa junto al modo competencia."
          />
        </Page>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Post-show" subtitle="Recuperacion y transicion" back />

      <Page>
        <Card className="border-line/70">
          <div className="flex gap-2.5">
            <Info size={15} className="mt-0.5 shrink-0 text-sky" />
            <p className="text-[13px] text-muted">
              Subir calorias de forma gradual y seguir midiendo ayuda a que el retorno sea ordenado.
              Es normal que el peso suba rapido las primeras semanas por agua y glucogeno: eso no es
              grasa. Si aparecen sintomas fisicos o emocionales que te preocupen, habla con un
              profesional.
            </p>
          </div>
        </Card>

        {/* ─────────────────────────────────── plan de transicion */}
        <div className="mt-4">
          <SectionTitle>Plan de transicion</SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calorias de partida</Label>
                <Input
                  aria-label="Calorias de partida"
                  inputMode="numeric"
                  value={startKcal}
                  onChange={(e) => setStartKcal(Number(e.target.value) || 0)}
                  suffix="kcal"
                />
              </div>
              <div>
                <Label>Calorias objetivo</Label>
                <Input
                  aria-label="Calorias objetivo"
                  inputMode="numeric"
                  value={targetKcal}
                  onChange={(e) => setTargetKcal(Number(e.target.value) || 0)}
                  suffix="kcal"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label hint={`${weeks} semanas`}>Duracion de la transicion</Label>
              <Stepper value={weeks} onChange={setWeeks} step={1} min={2} max={20} suffix="sem" />
            </div>

            <div className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-line bg-surface2 p-3">
              {ramp.map((r) => (
                <div key={r.week} className="flex justify-between text-[13px]">
                  <span className="text-muted">Semana {r.week}</span>
                  <span className="tabular font-semibold">{r.kcal} kcal</span>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              block
              className="mt-3"
              onClick={() => {
                savePostShow({
                  prepId: prep.id,
                  startDate: addDays(prep.showDate, 1),
                  startKcal,
                  targetKcal,
                  weeks,
                });
                toast('Plan post-show guardado');
              }}
            >
              Guardar plan
            </Button>
          </Card>
        </div>

        {/* ─────────────────────────────────── seguimiento */}
        <div className="mt-5">
          <SectionTitle>Registro de hoy</SectionTitle>
          <Card>
            <div className="mb-3">
              <Label>Peso</Label>
              <Input
                aria-label="Peso"
                inputMode="decimal"
                value={weight || ''}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                suffix={u.w}
                placeholder="—"
              />
            </div>

            <div className="space-y-4">
              {SCALES.map((s) => (
                <div key={s.key}>
                  <Label hint={`${scales[s.key]} / 5`}>{s.label}</Label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setScales((v) => ({ ...v, [s.key]: n }))}
                        className={cx(
                          'pressable h-10 flex-1 rounded-xl text-[14px] font-medium',
                          scales[s.key] === n
                            ? 'bg-brand text-base'
                            : 'border border-line bg-surface2 text-muted',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <Label hint={`${adherence}%`}>Adherencia</Label>
                <input
                  type="range"
                  aria-label="Adherencia"
                  min={0}
                  max={100}
                  step={5}
                  value={adherence}
                  onChange={(e) => setAdherence(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
                  style={{
                    background: `linear-gradient(to right, var(--color-brand) ${adherence}%, var(--color-line) ${adherence}%)`,
                  }}
                />
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Como te sientes"
              className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-2.5 text-[14px] outline-none placeholder:text-faint focus:border-brand/60"
            />

            <Button
              variant="primary"
              block
              className="mt-3"
              onClick={() => {
                logPostShow({
                  date: today(),
                  ...(weight > 0 ? { weight } : {}),
                  hunger: scales.hunger,
                  sleep: scales.sleep,
                  digestion: scales.digestion,
                  mood: scales.mood,
                  adherence,
                  ...(notes.trim() ? { notes: notes.trim() } : {}),
                });
                toast('Registro guardado');
                setNotes('');
              }}
            >
              <Heart size={16} />
              Guardar registro
            </Button>
          </Card>
        </div>

        {/* ─────────────────────────────────── evolucion */}
        {log.length > 0 && (
          <div className="mt-5">
            <SectionTitle>Evolucion post-show</SectionTitle>
            <Card>
              <div className="mb-3 grid grid-cols-3 gap-3">
                <Stat label="Registros" value={log.length} />
                <Stat
                  label="Cambio de peso"
                  value={
                    weightSeries.length >= 2
                      ? `${(weightSeries[weightSeries.length - 1].value - weightSeries[0].value > 0 ? '+' : '')}${(
                          weightSeries[weightSeries.length - 1].value - weightSeries[0].value
                        ).toFixed(1)}`
                      : '—'
                  }
                  unit={u.w}
                />
                <Stat
                  label="Desde"
                  value={log[0] ? friendlyDate(log[0].date).slice(0, 10) : '—'}
                />
              </div>
              <LineChart
                data={weightSeries.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
                height={150}
                unit={` ${u.w}`}
              />
            </Card>
          </div>
        )}
      </Page>
    </>
  );
}
