import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { Stat } from '@/components/ui/Misc';
import { BarChart, LineChart } from '@/components/ui/Chart';
import { ProgressTabs } from '@/features/body/ProgressTabs';
import { MacroSummary } from '@/features/nutrition/MacroSummary';
import { sumMacros } from '@/domain/macros';
import { weightSeries } from '@/domain/body';
import { workoutSetCount, workoutVolume } from '@/domain/training';
import { addDays, dayInitial, friendlyDate, fromISODate, monthName, toISODate, today } from '@/lib/date';
import { cx } from '@/lib/utils';
import { useUnits } from '@/lib/useUnits';
import { alive } from '@/store/persist';
import { useNutritionStore } from '@/store/nutritionStore';
import { useMeasurements, useTargets, useWorkouts } from '@/store/selectors';

export default function HistoryPage() {
  const entries = useNutritionStore((s) => s.entries);
  const workouts = useWorkouts();
  const measurements = useMeasurements();
  const target = useTargets();
  const u = useUnits();

  const [cursor, setCursor] = useState(() => {
    const d = fromISODate(today());
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);

  /* Indice dia -> resumen. Se calcula una vez por cambio de datos. */
  const byDay = useMemo(() => {
    const map = new Map<string, { kcal: number; protein: number; workouts: number }>();
    for (const e of alive(entries)) {
      const cur = map.get(e.date) ?? { kcal: 0, protein: 0, workouts: 0 };
      cur.kcal += e.macros.kcal;
      cur.protein += e.macros.protein;
      map.set(e.date, cur);
    }
    for (const w of workouts) {
      const cur = map.get(w.date) ?? { kcal: 0, protein: 0, workouts: 0 };
      cur.workouts += 1;
      map.set(w.date, cur);
    }
    return map;
  }, [entries, workouts]);

  const grid = useMemo(() => buildMonth(cursor.year, cursor.month), [cursor]);

  const last14 = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => addDays(today(), -13 + i));
    return days.map((d) => ({
      label: dayInitial(d),
      value: Math.round(byDay.get(d)?.kcal ?? 0),
      highlight: d === today(),
    }));
  }, [byDay]);

  const proteinSeries = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => addDays(today(), -29 + i));
    return days
      .filter((d) => byDay.has(d))
      .map((d) => ({ date: d, value: Math.round(byDay.get(d)!.protein) }));
  }, [byDay]);

  const weights = useMemo(() => weightSeries(measurements).slice(-60), [measurements]);

  const monthStats = useMemo(() => {
    const days = grid.filter((d) => d.iso && d.inMonth).map((d) => d.iso!);
    const logged = days.filter((d) => byDay.has(d));
    const kcals = logged.map((d) => byDay.get(d)!.kcal).filter((v) => v > 0);
    return {
      logged: logged.length,
      workouts: days.reduce((n, d) => n + (byDay.get(d)?.workouts ?? 0), 0),
      avgKcal: kcals.length ? Math.round(kcals.reduce((a, b) => a + b, 0) / kcals.length) : 0,
    };
  }, [grid, byDay]);

  return (
    <>
      <PageHeader title="Historial" subtitle="Todo lo que has registrado" />

      <Page>
        <ProgressTabs />

        {/* -------------------------------------------------------- calendario */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setCursor(shiftMonth(cursor, -1))}
              className="pressable flex size-8 items-center justify-center rounded-full bg-surface2 text-muted"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={17} />
            </button>
            <p className="text-[15px] font-semibold capitalize">
              {monthName(cursor.month)} {cursor.year}
            </p>
            <button
              onClick={() => setCursor(shiftMonth(cursor, 1))}
              className="pressable flex size-8 items-center justify-center rounded-full bg-surface2 text-muted"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-faint">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              if (!cell.iso) return <div key={i} />;
              const info = byDay.get(cell.iso);
              const isToday = cell.iso === today();
              const hit = info && info.kcal > 0;
              const ratio = hit ? info.kcal / target.kcal : 0;
              return (
                <button
                  key={cell.iso}
                  onClick={() => setSelected(cell.iso!)}
                  className={cx(
                    'relative flex aspect-square flex-col items-center justify-center rounded-xl text-[13px] transition-colors',
                    !cell.inMonth && 'opacity-30',
                    isToday ? 'border border-brand text-brand' : 'text-ink',
                    hit ? 'bg-brand/12' : 'bg-surface2',
                  )}
                >
                  <span className="tabular">{cell.day}</span>
                  <span className="mt-0.5 flex gap-0.5">
                    {hit && (
                      <i
                        className="block size-1 rounded-full"
                        style={{
                          background:
                            ratio > 1.05 ? 'var(--color-rose)' : ratio > 0.85 ? 'var(--color-brand)' : 'var(--color-carbs)',
                        }}
                      />
                    )}
                    {info?.workouts ? <i className="block size-1 rounded-full bg-sky" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <Stat label="Dias con registro" value={monthStats.logged} />
            <Stat label="Entrenos" value={monthStats.workouts} />
            <Stat label="Media kcal" value={monthStats.avgKcal} />
          </div>
        </Card>

        {/* ------------------------------------------------------------ graficas */}
        <div className="mt-5">
          <SectionTitle action={<span className="text-[11px] text-faint">objetivo {target.kcal}</span>}>
            Calorias · ultimos 14 dias
          </SectionTitle>
          <Card>
            <BarChart data={last14} unit=" kcal" height={150} />
          </Card>
        </div>

        <div className="mt-5">
          <SectionTitle action={<span className="text-[11px] text-faint">objetivo {target.protein} g</span>}>
            Proteina · ultimos 30 dias
          </SectionTitle>
          <Card>
            <LineChart data={proteinSeries} color="var(--color-protein)" unit=" g" zeroBased />
          </Card>
        </div>

        <div className="mt-5">
          <SectionTitle>Peso</SectionTitle>
          <Card>
            <LineChart
              data={weights.map((p) => ({ ...p, value: u.toDisplayWeight(p.value) }))}
              unit={` ${u.w}`}
            />
          </Card>
        </div>
      </Page>

      <DaySheet date={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/* --------------------------------------------------------- detalle del dia */

function DaySheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  const entries = useNutritionStore((s) => s.entries);
  const workouts = useWorkouts();
  const target = useTargets();
  const u = useUnits();

  const dayEntries = useMemo(
    () => (date ? alive(entries).filter((e) => e.date === date) : []),
    [entries, date],
  );
  const consumed = useMemo(() => sumMacros(dayEntries.map((e) => e.macros)), [dayEntries]);
  const dayWorkouts = date ? workouts.filter((w) => w.date === date) : [];

  if (!date) return null;

  return (
    <Sheet open onClose={onClose} title={friendlyDate(date)} height="full">
      <Card>
        <MacroSummary consumed={consumed} target={target} compact />
      </Card>

      {dayWorkouts.length > 0 && (
        <div className="mt-4">
          <SectionTitle>Entrenamiento</SectionTitle>
          {dayWorkouts.map((w) => (
            <div key={w.id} className="mb-1.5 rounded-2xl border border-line bg-surface2 px-3.5 py-3">
              <p className="text-[15px] font-medium">{w.name}</p>
              <p className="text-[12px] tabular text-faint">
                {workoutSetCount(w)} series · {u.numWeight(workoutVolume(w), 0)} {u.w}
              </p>
              <div className="mt-2 space-y-0.5">
                {w.exercises.map((ex) => (
                  <p key={ex.id} className="text-[12px] text-muted">
                    {ex.exerciseName}
                    <span className="ml-2 text-faint tabular">
                      {ex.sets.map((s) => `${s.weight}×${s.reps}`).join('  ')}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <SectionTitle>Alimentos</SectionTitle>
        {dayEntries.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-faint">Sin registros este dia</p>
        ) : (
          <div className="space-y-1.5">
            {dayEntries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface2 px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px]">{e.foodName}</p>
                  <p className="text-[11px] text-faint capitalize">
                    {e.slot} · {e.grams} g
                  </p>
                </div>
                <span className="shrink-0 text-[14px] font-semibold tabular text-brand">
                  {Math.round(e.macros.kcal)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------- calendario */

interface Cell {
  iso: string | null;
  day: number;
  inMonth: boolean;
}

/** Rejilla del mes empezando en lunes, con relleno de dias vecinos. */
function buildMonth(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(year, month, 1 - offset);
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (i >= 35 && d.getMonth() !== month) break;
    cells.push({ iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

function shiftMonth(c: { year: number; month: number }, delta: number) {
  const d = new Date(c.year, c.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
