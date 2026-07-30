import { clamp, fmtNum } from '@/lib/utils';

interface Props {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
  compact?: boolean;
}

export function MacroBar({ label, value, target, color, unit = 'g', compact }: Props) {
  const ratio = target > 0 ? value / target : 0;
  const pct = clamp(ratio * 100, 0, 100);
  const over = ratio > 1.02;
  const left = Math.max(0, target - value);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span className="tabular text-[13px]">
          <span className={over ? 'text-rose' : 'text-ink'}>{fmtNum(value)}</span>
          <span className="text-faint">
            {' / '}
            {fmtNum(target)}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: over ? 'var(--color-rose)' : color,
            transition: 'width 420ms cubic-bezier(0.32,0.72,0,1)',
          }}
        />
      </div>
      {!compact && (
        <p className="mt-1 text-[11px] text-faint">
          {over ? `${fmtNum(value - target)}${unit} de mas` : `Faltan ${fmtNum(left)}${unit}`}
        </p>
      )}
    </div>
  );
}
