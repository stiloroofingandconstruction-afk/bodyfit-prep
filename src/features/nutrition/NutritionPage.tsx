import { useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Copy, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { Page, PageHeader } from '@/components/ui/PageHeader';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Stepper } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Misc';
import { MacroSummary } from './MacroSummary';
import { FoodSearchSheet } from './FoodSearchSheet';
import { SmartMealSheet } from './SmartMealSheet';
import { CustomFoodSheet } from './CustomFoodSheet';
import { DayPlanSheet } from './DayPlanSheet';
import { Chip } from '@/components/ui/Misc';
import { DAY_TYPE_LABEL, type NutritionDayType } from '@/domain/prepTypes';
import { dayTypeLabel } from '@/i18n/labels';
import { t, type Dict } from '@/i18n';
import { addDays, friendlyDate, today } from '@/lib/date';
import { fmtNum } from '@/lib/utils';
import { sumMacros } from '@/domain/macros';
import { useNutritionStore } from '@/store/nutritionStore';
import { useDayNutrition } from '@/store/selectors';
import { toast } from '@/store/uiStore';
import type { FoodEntry, MealSlot } from '@/domain/types';

const SLOTS: { key: MealSlot; label: keyof Dict }[] = [
  { key: 'desayuno', label: 'slot.breakfast' },
  { key: 'almuerzo', label: 'slot.lunch' },
  { key: 'cena', label: 'slot.dinner' },
  { key: 'snack', label: 'slot.snack' },
  { key: 'pre', label: 'slot.pre' },
  { key: 'post', label: 'slot.post' },
];

/** Franja sugerida segun la hora: evita elegir "Desayuno" a las 9 de la noche. */
function defaultSlot(): MealSlot {
  const h = new Date().getHours();
  if (h < 11) return 'desayuno';
  if (h < 16) return 'almuerzo';
  if (h < 21) return 'cena';
  return 'snack';
}

export default function NutritionPage() {
  const [date, setDate] = useState(today());
  const [addTo, setAddTo] = useState<MealSlot | null>(null);
  const [smart, setSmart] = useState<'plan' | 'auto' | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [planning, setPlanning] = useState(false);

  const { entries, consumed, target, remaining } = useDayNutrition(date);
  const duplicateDay = useNutritionStore((s) => s.duplicateDay);
  const dayTypes = useNutritionStore((s) => s.dayTypes);
  const setDayType = useNutritionStore((s) => s.setDayType);
  const currentDayType: NutritionDayType = dayTypes[date] ?? 'entrenamiento';

  const bySlot = useMemo(() => {
    const map = new Map<MealSlot, FoodEntry[]>();
    for (const e of entries) {
      const list = map.get(e.slot) ?? [];
      list.push(e);
      map.set(e.slot, list);
    }
    return map;
  }, [entries]);

  const visibleSlots = SLOTS.filter((s) => bySlot.has(s.key) || s.key === defaultSlot());

  return (
    <>
      <PageHeader
        title={t('screen.nutrition')}
        subtitle={friendlyDate(date)}
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
        <Card>
          <MacroSummary consumed={consumed} target={target} />
        </Card>

        {/* Tipo de dia: refeed, diet break, descanso... escala el objetivo */}
        <div className="scroll-momentum -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {(Object.keys(DAY_TYPE_LABEL) as NutritionDayType[]).map((kind) => (
            <Chip
              key={kind}
              active={currentDayType === kind}
              onClick={() => setDayType(date, kind)}
            >
              {dayTypeLabel(kind)}
            </Chip>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" size="lg" onClick={() => setSmart('plan')}>
            <Sparkles size={17} />
            {t('nut.iWantToEat')}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setSmart('auto')}>
            <Wand2 size={17} />
            {t('home.completeMacros')}
          </Button>
        </div>

        <Button variant="secondary" size="lg" block className="mt-2" onClick={() => setPlanning(true)}>
          <CalendarRange size={17} />
          {t('nut.planFullDay')}
        </Button>

        <div className="mt-5 space-y-4">
          {visibleSlots.map((slot) => {
            const list = bySlot.get(slot.key) ?? [];
            const totals = sumMacros(list.map((e) => e.macros));
            return (
              <div key={slot.key}>
                <SectionTitle
                  action={
                    <span className="text-[11px] tabular text-faint">
                      {list.length ? `${Math.round(totals.kcal)} kcal` : ''}
                    </span>
                  }
                >
                  {t(slot.label)}
                </SectionTitle>

                <div className="space-y-1.5">
                  {list.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setEditing(entry)}
                      className="pressable flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{entry.foodName}</p>
                        <p className="mt-0.5 text-[12px] tabular text-faint">
                          {entry.grams} g · P {fmtNum(entry.macros.protein)} · C{' '}
                          {fmtNum(entry.macros.carbs)} · G {fmtNum(entry.macros.fat)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[15px] font-semibold tabular text-brand">
                        {Math.round(entry.macros.kcal)}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => setAddTo(slot.key)}
                    className="pressable flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-3 text-[14px] text-muted"
                  >
                    <Plus size={16} />
                    {t('nut.addTo', { slot: t(slot.label).toLowerCase() })}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Franjas aun sin usar */}
        <div className="mt-5 flex flex-wrap gap-2">
          {SLOTS.filter((s) => !visibleSlots.includes(s)).map((s) => (
            <button
              key={s.key}
              onClick={() => setAddTo(s.key)}
              className="pressable rounded-full border border-line bg-surface2 px-3 py-1.5 text-[13px] text-muted"
            >
              <Plus size={12} className="mr-1 inline" />
              {t(s.label)}
            </button>
          ))}
        </div>

        {entries.length === 0 && (
          <EmptyState
            title={t('nut.emptyDay')}
            description={t('nut.emptyDayDesc')}
          />
        )}

        {entries.length > 0 && (
          <button
            onClick={() => {
              duplicateDay(date, today());
              toast(t('nut.dayCopied'));
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 py-3 text-[13px] text-muted"
          >
            <Copy size={14} />
            {t('nut.copyDay')}
          </button>
        )}
      </Page>

      {addTo && (
        <FoodSearchSheet
          open
          slot={addTo}
          date={date}
          onClose={() => setAddTo(null)}
          onCreateCustom={() => {
            setAddTo(null);
            setCreating(true);
          }}
        />
      )}

      {smart && (
        <SmartMealSheet
          open
          mode={smart}
          remaining={remaining}
          slot={defaultSlot()}
          date={date}
          onClose={() => setSmart(null)}
        />
      )}

      <DayPlanSheet
        open={planning}
        onClose={() => setPlanning(false)}
        remaining={remaining}
        date={date}
      />

      <CustomFoodSheet open={creating} onClose={() => setCreating(false)} />

      <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}

/* ---------------------------------------------------- edicion de entrada */

function EditEntrySheet({ entry, onClose }: { entry: FoodEntry | null; onClose: () => void }) {
  const updateEntry = useNutritionStore((s) => s.updateEntry);
  const removeEntry = useNutritionStore((s) => s.removeEntry);
  const [grams, setGrams] = useState(0);

  // Sincroniza al abrir sin necesitar un efecto
  const current = entry?.grams ?? 0;
  const [lastId, setLastId] = useState<string | null>(null);
  if (entry && entry.id !== lastId) {
    setLastId(entry.id);
    setGrams(current);
  }

  if (!entry) return null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={entry.foodName}
      footer={
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              removeEntry(entry.id);
              toast(t('nut.deleted'), 'info');
              onClose();
            }}
          >
            <Trash2 size={17} />
          </Button>
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              updateEntry(entry.id, { grams });
              onClose();
            }}
          >
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-center text-[13px] text-muted">{t('nut.adjustAmount')}</p>
      <Stepper value={grams} onChange={setGrams} step={5} min={0} max={3000} suffix="g" />

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-surface2 p-3 text-center">
        {(
          [
            ['kcal', (entry.macros.kcal / entry.grams) * grams, 'text-brand'],
            [t('field.protein'), (entry.macros.protein / entry.grams) * grams, 'text-protein'],
            [t('field.carbs'), (entry.macros.carbs / entry.grams) * grams, 'text-carbs'],
            [t('field.fat'), (entry.macros.fat / entry.grams) * grams, 'text-fat'],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label}>
            <p className={`text-[17px] font-semibold tabular ${tone}`}>{fmtNum(value || 0)}</p>
            <p className="text-[10px] text-faint">{label}</p>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
