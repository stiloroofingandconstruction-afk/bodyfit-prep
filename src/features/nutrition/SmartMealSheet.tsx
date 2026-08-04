import { useEffect, useMemo, useState } from 'react';
import { Check, Lock, Plus, RefreshCw, Sparkles, Unlock, X, Zap } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Misc';
import { searchFoods, parseFoodPhrase } from '@/data/foodSearch';
import { solvePortions, type PortionInput } from '@bodyfit/domain/solver';
import { suggestComplement, suggestMeals } from '@bodyfit/domain/autoMeal';
import { cx, fmtNum, fmtSigned } from '@/lib/utils';
import { useNutritionStore } from '@/store/nutritionStore';
import { useCatalog } from '@/store/selectors';
import { toast } from '@/store/uiStore';
import { t } from '@/i18n';
import type { Food, Macros, MealSlot } from '@bodyfit/domain/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** `plan`: el usuario dice que quiere comer. `auto`: la app propone la comida. */
  mode: 'plan' | 'auto';
  remaining: Macros;
  slot: MealSlot;
  date: string;
}

/** Macro que falta -> clave traducida, para el aviso del complemento. */
const MACRO_KEY = {
  protein: 'field.protein',
  carbs: 'field.carbs',
  fat: 'field.fat',
} as const;

interface Item {
  food: Food;
  /** Gramos fijados a mano: el solver respeta este valor y ajusta el resto. */
  fixed?: number;
}

export function SmartMealSheet({ open, onClose, mode, remaining, slot, date }: Props) {
  const catalog = useCatalog();
  const favorites = useNutritionStore((s) => s.favorites);
  const recent = useNutritionStore((s) => s.recent);
  const addEntries = useNutritionStore((s) => s.addEntries);

  const [phrase, setPhrase] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [variant, setVariant] = useState(0);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhrase('');
    setItems([]);
    setUnresolved([]);
    setVariant(0);
    setPicked(false);
  }, [open, mode]);

  /* --------------------------------------------------- propuestas (auto) */

  const suggestions = useMemo(() => {
    if (mode !== 'auto' || !open) return [];
    // `variant` desplaza las listas de candidatos: cada pulsacion de "Otras"
    // trae combinaciones distintas, no las mismas reordenadas.
    return suggestMeals(remaining, {
      catalog,
      favorites,
      pantry: recent,
      count: 3,
      offset: variant * 3,
    });
  }, [mode, open, remaining, catalog, favorites, recent, variant]);

  /* ------------------------------------------------------------- solver */

  const solution = useMemo(() => {
    if (!items.length) return null;
    const inputs: PortionInput[] = items.map((i) => ({
      food: i.food,
      ...(i.fixed != null ? { fixed: i.fixed } : {}),
    }));
    return solvePortions(inputs, remaining);
  }, [items, remaining]);

  /**
   * Si el plato no puede cubrir un macro (pollo + arroz + brocoli no tienen
   * grasa), se propone el alimento que lo cierra en lugar de callarlo.
   */
  const complement = useMemo(
    () => (solution ? suggestComplement(solution.total, remaining, catalog) : null),
    [solution, remaining, catalog],
  );

  /* -------------------------------------------------------------- acciones */

  const analyze = () => {
    const parsed = parseFoodPhrase(phrase);
    const found = parsed.filter((p) => p.food).map((p) => ({ food: p.food as Food, fixed: p.grams }));
    setItems(found);
    setUnresolved(parsed.filter((p) => !p.food).map((p) => p.raw));
    if (!found.length) toast(t('nut.phraseNotRecognized'), 'warn');
  };

  const addFood = (food: Food) => {
    if (items.some((i) => i.food.id === food.id)) return;
    setItems((prev) => [...prev, { food }]);
  };

  const register = () => {
    if (!solution) return;
    const payload = solution.portions
      .filter((p) => p.grams > 0)
      .map((p) => ({ food: p.food, grams: p.grams, slot, date }));
    if (!payload.length) return;
    addEntries(payload);
    toast(t('nut.entriesLogged', { n: payload.length }));
    onClose();
  };

  const title = mode === 'plan' ? t('nut.iWantToEat') : t('nut.completeMacrosTitle');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      height="full"
      footer={
        solution && (
          <Button variant="primary" size="lg" block onClick={register}>
            <Check size={18} />
            {t('nut.logMeal')}
          </Button>
        )
      }
    >
      <RemainingBanner remaining={remaining} />

      {/* ---------------------------------------------------- modo PLAN -- */}
      {mode === 'plan' && (
        <div className="mt-4">
          <textarea
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                analyze();
              }
            }}
            rows={2}
            placeholder={t('nut.phrasePlaceholder')}
            className="w-full resize-none rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[t('nut.example1'), t('nut.example2'), t('nut.example3')].map((ex) => (
              <Chip key={ex} onClick={() => setPhrase(ex)}>
                {ex}
              </Chip>
            ))}
          </div>
          <Button variant="primary" block className="mt-3" onClick={analyze} disabled={!phrase.trim()}>
            <Sparkles size={17} />
            {t('nut.calcGrams')}
          </Button>

          {unresolved.length > 0 && (
            <p className="mt-2 text-[12px] text-amber">
              {t('nut.unrecognized', { list: unresolved.join(', ') })}
            </p>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- modo AUTO -- */}
      {mode === 'auto' && !picked && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[13px] text-muted">{t('nut.chooseMeal')}</p>
            <button
              onClick={() => setVariant((v) => v + 1)}
              className="pressable flex items-center gap-1 text-[13px] text-brand"
            >
              <RefreshCw size={13} /> {t('nut.otherOptions')}
            </button>
          </div>

          {suggestions.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setItems(s.result.portions.map((p) => ({ food: p.food })));
                setPicked(true);
              }}
              className="pressable w-full rounded-2xl border border-line bg-surface2 p-3.5 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[15px] font-medium">{s.title}</p>
                <span
                  className={cx(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    s.result.accuracy >= 90
                      ? 'bg-brand/15 text-brand'
                      : s.result.accuracy >= 75
                        ? 'bg-amber/15 text-amber'
                        : 'bg-rose/15 text-rose',
                  )}
                >
                  {t('nut.fitPct', { pct: s.result.accuracy })}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                {s.result.portions.map((p) => `${p.food.name} ${p.grams}${p.food.unit}`).join(' · ')}
              </p>
              <p className="mt-1 text-[12px] tabular text-faint">
                {Math.round(s.result.total.kcal)} kcal · P {fmtNum(s.result.total.protein)} · C{' '}
                {fmtNum(s.result.total.carbs)} · G {fmtNum(s.result.total.fat)}
              </p>
            </button>
          ))}

          {suggestions.length === 0 && (
            <p className="py-8 text-center text-[13px] text-faint">
              {t('nut.macrosCovered')}
            </p>
          )}
        </div>
      )}

      {/* ------------------------------------------------------ resultado -- */}
      {solution && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold tracking-wider text-faint uppercase">{t('nut.yourPlate')}</p>
            <span
              className={cx(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                solution.accuracy >= 90
                  ? 'bg-brand/15 text-brand'
                  : solution.accuracy >= 75
                    ? 'bg-amber/15 text-amber'
                    : 'bg-rose/15 text-rose',
              )}
            >
              {t('nut.fitPctLong', { pct: solution.accuracy })}
            </span>
          </div>

          <ul className="space-y-1.5">
            {solution.portions.map((p, i) => (
              <li
                key={p.food.id}
                className="flex items-center gap-2 rounded-2xl border border-line bg-surface2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{p.food.name}</p>
                  <p className="text-[11px] tabular text-faint">
                    {Math.round(p.macros.kcal)} kcal · P {fmtNum(p.macros.protein)} · C{' '}
                    {fmtNum(p.macros.carbs)} · G {fmtNum(p.macros.fat)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, fixed: Math.max(0, p.grams - 10) } : it,
                        ),
                      )
                    }
                    className="pressable flex size-8 items-center justify-center rounded-lg bg-surface text-muted"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-[15px] font-semibold tabular">
                    {p.grams}
                    <span className="text-[11px] font-normal text-faint">{p.food.unit}</span>
                  </span>
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, idx) => (idx === i ? { ...it, fixed: p.grams + 10 } : it)),
                      )
                    }
                    className="pressable flex size-8 items-center justify-center rounded-lg bg-surface text-muted"
                  >
                    +
                  </button>
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { food: it.food, ...(it.fixed == null ? { fixed: p.grams } : {}) } : it,
                        ),
                      )
                    }
                    className={cx(
                      'pressable flex size-8 items-center justify-center rounded-lg',
                      p.fixed ? 'bg-brand/15 text-brand' : 'bg-surface text-faint',
                    )}
                    aria-label={p.fixed ? t('nut.unlockAmount') : t('nut.lockAmount')}
                  >
                    {p.fixed ? <Lock size={13} /> : <Unlock size={13} />}
                  </button>
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="pressable flex size-8 items-center justify-center rounded-lg bg-surface text-faint"
                    aria-label={t('nut.removeFood')}
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {complement && (
            <button
              onClick={() => addFood(complement.food)}
              className="pressable mt-3 flex w-full items-center gap-3 rounded-2xl border border-amber/30 bg-amber/10 px-3.5 py-3 text-left"
            >
              <Plus size={17} className="shrink-0 text-amber" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-amber">
                  {t('nut.missingMacro', {
                    n: Math.round(complement.gap),
                    macro: t(MACRO_KEY[complement.macro]).toLowerCase(),
                  })}
                </p>
                <p className="text-[12px] text-muted">
                  {t('nut.addComplement', {
                    food: complement.food.name,
                    grams: complement.grams,
                    unit: complement.food.unit,
                  })}
                </p>
              </div>
            </button>
          )}

          <TotalsRow total={solution.total} remaining={remaining} />
          <AddMoreFood onAdd={addFood} />
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------ auxiliares */

function RemainingBanner({ remaining }: { remaining: Macros }) {
  return (
    <div className="rounded-2xl border border-line bg-surface2 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-wider text-faint uppercase">
        <Zap size={12} className="text-brand" />
        {t('nut.missingToday')}
      </p>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Cell label="kcal" value={Math.round(remaining.kcal)} tone="text-brand" />
        <Cell label={t('field.protein')} value={fmtNum(remaining.protein)} tone="text-protein" />
        <Cell label={t('field.carbs')} value={fmtNum(remaining.carbs)} tone="text-carbs" />
        <Cell label={t('field.fat')} value={fmtNum(remaining.fat)} tone="text-fat" />
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div>
      <p className={cx('text-[18px] leading-tight font-bold tabular', tone)}>{value}</p>
      <p className="text-[10px] text-faint">{label}</p>
    </div>
  );
}

function TotalsRow({ total, remaining }: { total: Macros; remaining: Macros }) {
  const rows: [string, number, number][] = [
    ['kcal', total.kcal, remaining.kcal],
    [t('field.protein'), total.protein, remaining.protein],
    [t('field.carbs'), total.carbs, remaining.carbs],
    [t('field.fat'), total.fat, remaining.fat],
  ];
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface2 p-3">
      <p className="mb-2 text-[11px] tracking-wider text-faint uppercase">{t('nut.closesDay')}</p>
      <div className="space-y-1">
        {rows.map(([label, value, target]) => {
          const diff = value - target;
          const ok = Math.abs(diff) <= Math.max(3, target * 0.08);
          return (
            <div key={label} className="flex items-center justify-between text-[13px]">
              <span className="text-muted">{label}</span>
              <span className="tabular">
                <span className="text-ink">{fmtNum(value)}</span>
                <span className="text-faint"> / {fmtNum(target)}</span>
                <span className={cx('ml-2 text-[12px]', ok ? 'text-brand' : 'text-amber')}>
                  {fmtSigned(diff)}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddMoreFood({ onAdd }: { onAdd: (food: Food) => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => (q.trim() ? searchFoods(q, 6).map((r) => r.food) : []), [q]);

  return (
    <div className="mt-3">
      <div className="relative">
        <Plus size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('nut.addAnotherFood')}
          className="h-11 w-full rounded-2xl border border-line bg-surface2 pr-3 pl-9 text-[14px] outline-none placeholder:text-faint focus:border-brand/60"
        />
      </div>
      {results.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {results.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => {
                  onAdd(f);
                  setQ('');
                }}
                className="pressable w-full rounded-xl bg-surface px-3 py-2 text-left text-[14px]"
              >
                {f.name}
                <span className="ml-2 text-[11px] text-faint">{Math.round(f.per100.kcal)} kcal/100{f.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
