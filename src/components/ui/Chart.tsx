import { useId, useMemo } from 'react';
import { shortDate } from '@/lib/date';
import { t } from '@/i18n';

export interface Point {
  date: string;
  value: number;
}

interface LineChartProps {
  data: Point[];
  /** Segunda serie opcional, dibujada punteada (por ejemplo la media movil). */
  overlay?: Point[];
  height?: number;
  color?: string;
  overlayColor?: string;
  unit?: string;
  /** Fuerza el eje Y a incluir el cero. */
  zeroBased?: boolean;
}

/**
 * Grafica de linea en SVG. Sin recharts ni d3: menos de 100 lineas, 0 KB de
 * dependencias y se repinta sin coste perceptible.
 */
export function LineChart({
  data,
  overlay,
  height = 160,
  color = 'var(--color-brand)',
  overlayColor = 'var(--color-sky)',
  unit = '',
  zeroBased = false,
}: LineChartProps) {
  const id = useId();
  const W = 320;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 20, left: 34 };

  const geometry = useMemo(() => {
    const all = [...data, ...(overlay ?? [])];
    if (data.length < 2) return null;

    const values = all.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (zeroBased) min = Math.min(0, min);
    const span = max - min || 1;
    min -= span * 0.1;
    max += span * 0.1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number, n: number) => PAD.left + (i / Math.max(1, n - 1)) * innerW;
    const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

    const toPath = (pts: Point[]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i, pts.length).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

    const line = toPath(data);
    const area = `${line} L${x(data.length - 1, data.length).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${PAD.left},${(H - PAD.bottom).toFixed(1)} Z`;

    const ticks = [max, (max + min) / 2, min].map((v) => ({ v, y: y(v) }));

    return {
      line,
      area,
      overlayPath: overlay && overlay.length > 1 ? toPath(overlay) : null,
      ticks,
      last: { x: x(data.length - 1, data.length), y: y(data[data.length - 1].value) },
    };
  }, [data, overlay, H, zeroBased]);

  if (!geometry) {
    return (
      <div className="flex items-center justify-center py-8 text-[13px] text-faint" style={{ height }}>
        {t('chart.needTwo')}
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {geometry.ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text x={2} y={t.y + 3} fontSize="9" fill="var(--color-faint)">
              {formatTick(t.v)}
            </text>
          </g>
        ))}

        <path d={geometry.area} fill={`url(#${id})`} />
        <path d={geometry.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {geometry.overlayPath && (
          <path
            d={geometry.overlayPath}
            fill="none"
            stroke={overlayColor}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
        )}
        <circle cx={geometry.last.x} cy={geometry.last.y} r="3.5" fill={color} />
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[10px] text-faint">
        <span>{shortDate(data[0].date)}</span>
        <span>
          {formatTick(data[data.length - 1].value)}
          {unit}
        </span>
        <span>{shortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

function formatTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v * 10) / 10);
}

interface BarChartProps {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
  color?: string;
  unit?: string;
}

export function BarChart({ data, height = 140, color = 'var(--color-brand)', unit = '' }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-[10px] tabular text-faint">{d.value > 0 ? Math.round(d.value) : ''}</span>
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${Math.max(2, (d.value / max) * (height - 34))}px`,
              background: d.highlight ? color : 'var(--color-line2)',
              transition: 'height 380ms cubic-bezier(0.32,0.72,0,1)',
            }}
            title={`${d.value}${unit}`}
          />
          <span className="truncate text-[10px] text-faint">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
