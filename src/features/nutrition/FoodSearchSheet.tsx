import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, Star } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { NumberPad } from '@/components/ui/NumberPad';
import { Chip, EmptyState } from '@/components/ui/Misc';
import { CATEGORY_LABEL } from '@/data/foods';
import { searchFoods } from '@/data/foodSearch';
import { macrosFor } from '@/domain/macros';
import { cx, fmtNum } from '@/lib/utils';
import { useNutritionStore } from '@/store/nutritionStore';
import { useCatalog, useFoodLookup } from '@/store/selectors';
import { toast } from '@/store/uiStore';
import type { Food, MealSlot } from '@/domain/types';

interface Props {
  open: boolean;
  onClose: () => void;
  slot: MealSlot;
  date: string;
  onCreateCustom?: () => void;
}

/**
 * Flujo de registro en dos pasos:
 *   1. Escribes "Pollo"
 *   2. La app pregunta "¿Cuantos gramos?" y calcula los macros sola.
 */
export function FoodSearchSheet({ open, onClose, slot, date, onCreateCustom }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const catalog = useCatalog();
  const lookup = useFoodLookup();
  const favorites = useNutritionStore((s) => s.favorites);
  const recent = useNutritionStore((s) => s.recent);
  const toggleFavorite = useNutritionStore((s) => s.toggleFavorite);
  const addEntry = useNutritionStore((s) => s.addEntry);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(null);
      // Pequeno retardo: iOS ignora el focus mientras la hoja se anima
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    if (query.trim()) return searchFoods(query, 30).map((r) => r.food);
    const ids = [...favorites, ...recent];
    const seen = new Set<string>();
    const list: Food[] = [];
    for (const id of ids) {
      const f = lookup.get(id);
      if (f && !seen.has(id)) {
        seen.add(id);
        list.push(f);
      }
    }
    return list.length ? list : catalog.slice(0, 20);
  }, [query, favorites, recent, lookup, catalog]);

  if (selected) {
    return (
      <GramsStep
        open={open}
        food={selected}
        onBack={() => setSelected(null)}
        onClose={onClose}
        onConfirm={(grams) => {
          addEntry({ food: selected, grams, slot, date });
          toast(`${selected.name} · ${grams} ${selected.unit}`);
          onClose();
        }}
      />
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Anadir alimento" height="full">
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-3 bg-surface px-4 pt-4 pb-3">
        <div className="relative">
          <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pollo, arroz, avena, Fairlife..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-12 w-full rounded-2xl border border-line bg-surface2 pr-3 pl-10 text-[15px] outline-none placeholder:text-faint focus:border-brand/60"
          />
        </div>
        {!query && (favorites.length > 0 || recent.length > 0) && (
          <p className="mt-2 px-1 text-[11px] tracking-wider text-faint uppercase">
            {favorites.length ? 'Favoritos y recientes' : 'Recientes'}
          </p>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description={`No encontramos "${query}". Puedes crearlo con sus macros y quedara guardado.`}
          action={
            onCreateCustom && (
              <Button variant="primary" onClick={onCreateCustom}>
                Crear alimento
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {results.map((food) => (
            <li key={food.id}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(food)}
                  className="pressable flex flex-1 items-center gap-3 rounded-2xl border border-line bg-surface2 px-3.5 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">
                      {food.name}
                      {food.brand && <span className="ml-1.5 text-[12px] text-faint">{food.brand}</span>}
                    </p>
                    <p className="mt-0.5 text-[12px] text-faint">
                      {Math.round(food.per100.kcal)} kcal · P {fmtNum(food.per100.protein)} · C{' '}
                      {fmtNum(food.per100.carbs)} · G {fmtNum(food.per100.fat)}
                      <span className="ml-1">/ 100 {food.unit}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] text-faint">
                    {CATEGORY_LABEL[food.category]}
                  </span>
                </button>
                <button
                  onClick={() => toggleFavorite(food.id)}
                  className="pressable flex size-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface2"
                  aria-label="Favorito"
                >
                  <Star
                    size={16}
                    className={cx(favorites.includes(food.id) ? 'fill-brand text-brand' : 'text-faint')}
                  />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {onCreateCustom && results.length > 0 && (
        <button
          onClick={onCreateCustom}
          className="mt-4 w-full py-3 text-center text-[13px] text-muted underline underline-offset-4"
        >
          No esta en la lista — crear alimento
        </button>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------- paso de gramos -- */

function GramsStep({
  open,
  food,
  onBack,
  onClose,
  onConfirm,
}: {
  open: boolean;
  food: Food;
  onBack: () => void;
  onClose: () => void;
  onConfirm: (grams: number) => void;
}) {
  const [raw, setRaw] = useState('');
  const grams = Number(raw || 0);
  const macros = macrosFor(food, grams);

  const quick = useMemo(() => {
    const presets = food.servings?.length
      ? food.servings.map((s) => ({ label: s.label, grams: s.grams }))
      : [];
    const base =
      food.role === 'fat'
        ? [10, 15, 30]
        : food.category === 'suplemento'
          ? [30, 33, 46]
          : [100, 150, 200];
    return [...presets, ...base.map((g) => ({ label: `${g} ${food.unit}`, grams: g }))].slice(0, 5);
  }, [food]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <button onClick={onBack} className="text-[15px] font-semibold">
          ← {food.name}
        </button>
      }
      footer={
        <Button variant="primary" size="lg" block disabled={grams <= 0} onClick={() => onConfirm(grams)}>
          <Check size={18} />
          Anadir {grams > 0 ? `${grams} ${food.unit}` : ''}
        </Button>
      }
    >
      <p className="text-center text-[13px] text-muted">¿Cuantos {food.unit === 'ml' ? 'mililitros' : 'gramos'}?</p>

      <div className="mt-2 mb-4 text-center">
        <span className="text-[52px] leading-[1.1] font-bold tabular">{raw || '0'}</span>
        <span className="ml-1 text-[20px] text-faint">{food.unit}</span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-surface2 p-3 text-center">
        <Macro label="kcal" value={Math.round(macros.kcal)} tone="text-brand" />
        <Macro label="Prot" value={fmtNum(macros.protein)} tone="text-protein" />
        <Macro label="Carb" value={fmtNum(macros.carbs)} tone="text-carbs" />
        <Macro label="Gras" value={fmtNum(macros.fat)} tone="text-fat" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {quick.map((q) => (
          <Chip key={q.label} onClick={() => setRaw(String(q.grams))} active={grams === q.grams}>
            {q.label}
          </Chip>
        ))}
      </div>

      <NumberPad value={raw} onChange={setRaw} maxLength={4} />
    </Sheet>
  );
}

function Macro({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div>
      <p className={cx('text-[17px] font-semibold tabular', tone)}>{value}</p>
      <p className="text-[10px] text-faint">{label}</p>
    </div>
  );
}
