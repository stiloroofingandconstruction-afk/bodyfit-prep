import { useMemo, useState } from 'react';
import { Check, Info, RefreshCw } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Label, Slider, Stepper } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Misc';
import { planDay } from '@/domain/autoMeal';
import { DAY_TYPE_LABEL, type NutritionDayType } from '@/domain/prepTypes';
import { cx, fmtNum } from '@/lib/utils';
import { useNutritionStore } from '@/store/nutritionStore';
import { useCatalog } from '@/store/selectors';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/store/uiStore';
import type { Macros, MealSlot } from '@/domain/types';

const SLOT_BY_INDEX: MealSlot[] = ['desayuno', 'almuerzo', 'pre', 'post', 'cena', 'snack', 'snack', 'snack'];

const DAY_TYPES: NutritionDayType[] = [
  'entrenamiento', 'descanso', 'refeed', 'diet-break', 'alto', 'bajo', 'mantenimiento',
];

interface Props {
  open: boolean;
  onClose: () => void;
  remaining: Macros;
  date: string;
}

/**
 * "Planear mi dia": reparte los macros restantes entre N comidas y propone los
 * gramos exactos de cada alimento, respetando favoritos y exclusiones.
 */
export function DayPlanSheet({ open, onClose, remaining, date }: Props) {
  const catalog = useCatalog();
  const favorites = useNutritionStore((s) => s.favorites);
  const recent = useNutritionStore((s) => s.recent);
  const addEntries = useNutritionStore((s) => s.addEntries);
  const dayTypes = useNutritionStore((s) => s.dayTypes);
  const setDayType = useNutritionStore((s) => s.setDayType);
  const excludedFoods = useSettingsStore((s) => s.excludedFoods);

  const [meals, setMeals] = useState(4);
  const [carbShift, setCarbShift] = useState(0.2);
  const [trainingMeal, setTrainingMeal] = useState(1);
  const [variant, setVariant] = useState(0);

  const usable = useMemo(
    () => catalog.filter((f) => !excludedFoods.includes(f.id)),
    [catalog, excludedFoods],
  );

  const plan = useMemo(
    () =>
      planDay(remaining, {
        catalog: usable,
        favorites,
        pantry: recent,
        meals,
        carbAroundTraining: carbShift,
        trainingMealIndex: Math.min(trainingMeal, meals - 1),
        offset: variant,
      }),
    [remaining, usable, favorites, recent, meals, carbShift, trainingMeal, variant],
  );

  const totals = useMemo(() => {
    const acc = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    for (const m of plan) {
      acc.kcal += m.result.total.kcal;
      acc.protein += m.result.total.protein;
      acc.carbs += m.result.total.carbs;
      acc.fat += m.result.total.fat;
    }
    return acc;
  }, [plan]);

  const registerAll = () => {
    const payload = plan.flatMap((m) =>
      m.result.portions
        .filter((p) => p.grams > 0)
        .map((p) => ({
          food: p.food,
          grams: p.grams,
          slot: SLOT_BY_INDEX[m.index] ?? 'snack',
          date,
        })),
    );
    if (!payload.length) return;
    addEntries(payload);
    toast(`${plan.length} comidas registradas`);
    onClose();
  };

  const currentType = dayTypes[date] ?? 'entrenamiento';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Planear mi dia"
      height="full"
      footer={
        plan.length > 0 && (
          <Button variant="primary" size="lg" block onClick={registerAll}>
            <Check size={18} />
            Registrar el dia completo
          </Button>
        )
      }
    >
      {/* ─────────────────────────── tipo de dia */}
      <div>
        <Label hint="ajusta el objetivo solo para hoy">Tipo de dia</Label>
        <div className="flex flex-wrap gap-1.5">
          {DAY_TYPES.map((t) => (
            <Chip key={t} active={currentType === t} onClick={() => setDayType(date, t)}>
              {DAY_TYPE_LABEL[t]}
            </Chip>
          ))}
        </div>
        <p className="mt-2 flex gap-2 text-[11px] text-faint">
          <Info size={12} className="mt-0.5 shrink-0" />
          Un refeed o un diet break suben los carbohidratos manteniendo la proteina. Son herramientas
          de planificacion: el criterio de cuando usarlos es tuyo y de tu entrenador.
        </p>
      </div>

      {/* ─────────────────────────── parametros */}
      <Card className="mt-4">
        <div className="space-y-4">
          <div>
            <Label hint={`${meals} comidas`}>Numero de comidas</Label>
            <Stepper value={meals} onChange={setMeals} step={1} min={1} max={8} />
          </div>
          <div>
            <Label hint={`comida ${Math.min(trainingMeal, meals - 1) + 1}`}>
              Comida alrededor del entreno
            </Label>
            <Stepper
              value={Math.min(trainingMeal, meals - 1)}
              onChange={setTrainingMeal}
              step={1}
              min={0}
              max={Math.max(0, meals - 1)}
            />
          </div>
          <div>
            <Label hint={`${Math.round(carbShift * 100)}% mas de carbos`}>
              Carbohidratos alrededor del entreno
            </Label>
            <Slider
              aria-label="Carbohidratos alrededor del entreno"
              value={carbShift}
              onChange={setCarbShift}
              min={0}
              max={0.4}
              step={0.05}
              labels={['uniforme', 'moderado', 'concentrado']}
            />
          </div>
        </div>
      </Card>

      {/* ─────────────────────────── resultado */}
      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs font-semibold tracking-wider text-faint uppercase">Tu dia</p>
        <button
          onClick={() => setVariant((v) => v + 1)}
          className="pressable flex items-center gap-1 text-[13px] text-brand"
        >
          <RefreshCw size={13} /> Otras opciones
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {plan.map((m) => (
          <div key={m.index} className="rounded-2xl border border-line bg-surface2 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[14px] font-semibold">{m.label}</p>
              <span
                className={cx(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  m.result.accuracy >= 90 ? 'bg-brand/15 text-brand' : 'bg-amber/15 text-amber',
                )}
              >
                {m.result.accuracy}%
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {/* Una porcion de 0 g significa que ese macro ya estaba cubierto */}
              {m.result.portions.filter((p) => p.grams > 0).map((p) => (
                <li key={p.food.id} className="flex justify-between gap-2 text-[13px]">
                  <span className="truncate text-muted">{p.food.name}</span>
                  <span className="shrink-0 tabular font-medium">
                    {p.grams} {p.food.unit}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-line pt-2 text-[11px] tabular text-faint">
              {Math.round(m.result.total.kcal)} kcal · P {fmtNum(m.result.total.protein)} · C{' '}
              {fmtNum(m.result.total.carbs)} · G {fmtNum(m.result.total.fat)}
            </p>
          </div>
        ))}
      </div>

      {plan.length > 0 && (
        <Card className="mt-3">
          <p className="mb-2 text-[11px] tracking-wider text-faint uppercase">Total del plan</p>
          {(
            [
              ['kcal', totals.kcal, remaining.kcal],
              ['Proteina', totals.protein, remaining.protein],
              ['Carbos', totals.carbs, remaining.carbs],
              ['Grasas', totals.fat, remaining.fat],
            ] as const
          ).map(([label, value, target]) => (
            <div key={label} className="flex justify-between text-[13px]">
              <span className="text-muted">{label}</span>
              <span className="tabular">
                <span className="text-ink">{fmtNum(value)}</span>
                <span className="text-faint"> / {fmtNum(target)}</span>
              </span>
            </div>
          ))}
        </Card>
      )}
    </Sheet>
  );
}
