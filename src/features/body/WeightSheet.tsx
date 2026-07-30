import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Label, Stepper } from '@/components/ui/Field';
import { friendlyDate, today } from '@/lib/date';
import { useBodyStore } from '@/store/bodyStore';
import { useCurrentWeight } from '@/store/selectors';
import { toast } from '@/store/uiStore';

/** Registro rapido de peso. Es la accion mas frecuente: dos toques y fuera. */
export function WeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = useCurrentWeight();
  const upsert = useBodyStore((s) => s.upsert);
  const [weight, setWeight] = useState(current);

  useEffect(() => {
    if (open) setWeight(current);
  }, [open, current]);

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
            upsert({ date: today(), weight });
            toast(`${weight.toFixed(1)} kg registrados`);
            onClose();
          }}
        >
          Guardar
        </Button>
      }
    >
      <Label hint={friendlyDate(today())}>Peso corporal</Label>
      <div className="my-4 text-center">
        <span className="text-[56px] leading-none font-bold tabular">{weight.toFixed(1)}</span>
        <span className="ml-1 text-[20px] text-faint">kg</span>
      </div>
      <Stepper value={weight} onChange={setWeight} step={0.1} min={30} max={300} decimals={1} suffix="kg" />
      <div className="mt-3 flex justify-center gap-2">
        {[-1, -0.5, 0.5, 1].map((d) => (
          <button
            key={d}
            onClick={() => setWeight((w) => Math.round((w + d) * 10) / 10)}
            className="pressable rounded-full border border-line bg-surface2 px-3 py-1.5 text-[13px] text-muted tabular"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-[12px] text-faint">
        Pesate siempre igual: en ayunas, despues del bano y sin ropa. La comparacion vale mas que el numero.
      </p>
    </Sheet>
  );
}
