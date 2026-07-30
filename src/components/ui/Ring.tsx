import { useId, type ReactNode } from 'react';
import { clamp } from '@/lib/utils';

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  /** Muestra el exceso en rojo cuando se supera el objetivo. */
  warnOver?: boolean;
}

/**
 * Anillo de progreso en SVG puro. Sin librerias de graficas: son 2 circulos.
 */
export function Ring({
  value,
  max,
  size = 120,
  stroke = 10,
  color = 'var(--color-brand)',
  track = 'var(--color-line)',
  children,
  warnOver = true,
}: Props) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? value / max : 0;
  const over = warnOver && ratio > 1.02;
  const pct = clamp(ratio, 0, 1);
  const dash = c * pct;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={over ? 'var(--color-rose)' : color} />
            <stop offset="100%" stopColor={over ? 'var(--color-rose)' : color} stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray 420ms cubic-bezier(0.32,0.72,0,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
