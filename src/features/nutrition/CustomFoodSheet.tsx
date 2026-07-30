import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Segmented, Select } from '@/components/ui/Field';
import { CATEGORY_LABEL } from '@/data/foods';
import { kcalFromMacros } from '@/domain/macros';
import { useNutritionStore } from '@/store/nutritionStore';
import { toast } from '@/store/uiStore';
import type { FoodCategory, FoodRole } from '@/domain/types';

const ROLE_OPTIONS: { value: FoodRole; label: string }[] = [
  { value: 'protein', label: 'Proteina' },
  { value: 'carb', label: 'Carbo' },
  { value: 'fat', label: 'Grasa' },
  { value: 'veg', label: 'Verdura' },
  { value: 'free', label: 'Libre' },
];

/**
 * Alta de alimentos propios. Solo se piden los macros por 100 g: las calorias
 * se derivan (4/4/9) para que no puedan quedar incoherentes.
 */
export function CustomFoodSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCustomFood = useNutritionStore((s) => s.addCustomFood);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<FoodCategory>('proteina');
  const [role, setRole] = useState<FoodRole>('protein');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml'>('g');

  const p = Number(protein) || 0;
  const c = Number(carbs) || 0;
  const f = Number(fat) || 0;
  const kcal = Math.round(kcalFromMacros(p, c, f));
  const valid = name.trim().length >= 2 && p + c + f > 0;

  const save = () => {
    addCustomFood({
      name: name.trim(),
      ...(brand.trim() ? { brand: brand.trim() } : {}),
      aliases: [],
      category,
      role,
      unit,
      per100: { kcal, protein: p, carbs: c, fat: f, fiber: Number(fiber) || 0 },
    });
    toast(`${name.trim()} guardado`);
    setName('');
    setBrand('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nuevo alimento"
      height="full"
      footer={
        <Button variant="primary" size="lg" block disabled={!valid} onClick={save}>
          Guardar alimento
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pechuga de pavo" />
        </div>

        <div>
          <Label hint="opcional">Marca</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Fairlife" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoria</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory)}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Medida</Label>
            <Segmented
              value={unit}
              onChange={setUnit}
              options={[
                { value: 'g', label: 'Gramos' },
                { value: 'ml', label: 'ml' },
              ]}
            />
          </div>
        </div>

        <div>
          <Label hint="define como lo usa el generador automatico">Rol en el plato</Label>
          <Segmented value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </div>

        <div>
          <Label hint={`por 100 ${unit}`}>Macros</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="decimal"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="Proteina"
              suffix="g"
            />
            <Input
              inputMode="decimal"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="Carbos"
              suffix="g"
            />
            <Input
              inputMode="decimal"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="Grasas"
              suffix="g"
            />
            <Input
              inputMode="decimal"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              placeholder="Fibra"
              suffix="g"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface2 p-4 text-center">
          <p className="text-[11px] tracking-wider text-faint uppercase">Calorias calculadas</p>
          <p className="mt-1 text-[28px] font-bold tabular text-brand">{kcal}</p>
          <p className="text-[11px] text-faint">kcal por 100 {unit} · 4/4/9</p>
        </div>
      </div>
    </Sheet>
  );
}
