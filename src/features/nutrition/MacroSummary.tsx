import { Ring } from '@/components/ui/Ring';
import { MacroBar } from '@/components/ui/MacroBar';
import { fmtNum } from '@/lib/utils';
import type { MacroTarget, Macros } from '@/domain/types';

interface Props {
  consumed: Macros;
  target: MacroTarget;
  compact?: boolean;
}

/** Resumen de macros del dia: anillo de calorias + barras de cada macro. */
export function MacroSummary({ consumed, target, compact }: Props) {
  const left = Math.round(target.kcal - consumed.kcal);
  const over = left < 0;

  return (
    <div>
      <div className="flex items-center gap-5">
        <Ring value={consumed.kcal} max={target.kcal} size={compact ? 104 : 124} stroke={compact ? 9 : 11}>
          <span className="text-[26px] leading-none font-bold tabular">{Math.abs(left)}</span>
          <span className="mt-0.5 text-[10px] tracking-wider text-faint uppercase">
            {over ? 'kcal de mas' : 'kcal libres'}
          </span>
        </Ring>

        <div className="min-w-0 flex-1 space-y-3">
          <MacroBar
            label="Proteina"
            value={consumed.protein}
            target={target.protein}
            color="var(--color-protein)"
            compact
          />
          <MacroBar
            label="Carbohidratos"
            value={consumed.carbs}
            target={target.carbs}
            color="var(--color-carbs)"
            compact
          />
          <MacroBar label="Grasas" value={consumed.fat} target={target.fat} color="var(--color-fat)" compact />
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <MiniStat label="Consumidas" value={`${Math.round(consumed.kcal)}`} />
          <MiniStat label="Objetivo" value={`${target.kcal}`} />
          <MiniStat label="Fibra" value={`${fmtNum(consumed.fiber)} / ${target.fiber}g`} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-faint">{label}</p>
      <p className="text-[15px] font-semibold tabular">{value}</p>
    </div>
  );
}
