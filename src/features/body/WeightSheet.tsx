import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Label, Stepper } from '@/components/ui/Field';
import { friendlyDate, today } from '@/lib/date';
import { useUnits } from '@/lib/useUnits';
import { useBodyStore } from '@/store/bodyStore';
import { useCurrentWeight } from '@/store/selectors';
import { toast } from '@/store/uiStore';

/**
 * Registro rapido de peso.
 *
 * El estado local vive en la unidad que ve el usuario; la conversion a kg
 * ocurre una sola vez, al guardar. Asi no hay redondeos encadenados.
 */
export function WeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentKg = useCurrentWeight();
  const upsert = useBodyStore((s) => s.upsert);
  const u = useUnits();

  const [shown, setShown] = useState(() => u.toDisplayWeight(currentKg));

  useEffect(() => {
    if (open) setShown(u.toDisplayWeight(currentKg));
  }, [open, currentKg, u]);

  const quickSteps = u.weightUnit === 'kg' ? [-1, -0.5, 0.5, 1] : [-2, -1, 1, 2];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Peso de hoy"
      footer={
        <Button
          variant="primary"
          size="lg"
          block
          onClick={() => {
            const kg = u.toCanonicalWeight(shown);
            upsert({ date: today(), weight: kg });
            toast(`${u.fmtWeight(kg)} registrados`);
            onClose();
          }}
        >
          Guardar
        </Button>
      }
    >
      <Label hint={friendlyDate(today())}>Peso corporal</Label>
      <div className="my-4 text-center">
        <span className="text-[56px] leading-none font-bold tabular">{shown.toFixed(1)}</span>
        <span className="ml-1 text-[20px] text-faint">{u.w}</span>
      </div>
      <Stepper
        value={shown}
        onChange={setShown}
        step={u.weightStep}
        min={u.weightRange.min}
        max={u.weightRange.max}
        decimals={1}
        suffix={u.w}
      />
      <div className="mt-3 flex justify-center gap-2">
        {quickSteps.map((d) => (
          <button
            key={d}
            onClick={() => setShown((w) => Math.round((w + d) * 10) / 10)}
            className="pressable rounded-full border border-line bg-surface2 px-3 py-1.5 text-[13px] text-muted tabular"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-[12px] text-faint">
        Pesate siempre igual: en ayunas, despues del bano y sin ropa. La comparacion vale mas que el
        numero.
      </p>
    </Sheet>
  );
}
