import type { BodyMeasurement, Sex } from './types';

/**
 * % de grasa corporal — metodo de circunferencias de la US Navy.
 * Medidas en cm. Precision +/- 3% frente a DEXA; suficiente para ver tendencia.
 */
export function navyBodyFat(input: {
  sex: Sex;
  heightCm: number;
  neck: number;
  waist: number;
  hip?: number;
}): number | null {
  const { sex, heightCm, neck, waist, hip } = input;
  if (!heightCm || !neck || !waist) return null;

  if (sex === 'hombre') {
    if (waist - neck <= 0) return null;
    const bf =
      495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
    return clampPct(bf);
  }
  if (!hip || waist + hip - neck <= 0) return null;
  const bf =
    495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(heightCm)) - 450;
  return clampPct(bf);
}

function clampPct(v: number): number | null {
  if (!isFinite(v)) return null;
  return Math.round(Math.min(70, Math.max(2, v)) * 10) / 10;
}

export function leanMass(weightKg: number, bodyFatPct: number): number {
  return Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10;
}

export function fatMass(weightKg: number, bodyFatPct: number): number {
  return Math.round(weightKg * (bodyFatPct / 100) * 10) / 10;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Ratio cintura/altura: por debajo de 0.5 se considera saludable. */
export function waistToHeight(waistCm: number, heightCm: number): number {
  return Math.round((waistCm / heightCm) * 100) / 100;
}

export interface TrendPoint {
  date: string;
  value: number;
}

/** Media movil exponencial: filtra el ruido diario de agua y glucogeno. */
export function ema(points: TrendPoint[], alpha = 0.25): TrendPoint[] {
  const out: TrendPoint[] = [];
  let prev: number | null = null;
  for (const p of points) {
    prev = prev === null ? p.value : alpha * p.value + (1 - alpha) * prev;
    out.push({ date: p.date, value: Math.round(prev * 100) / 100 });
  }
  return out;
}

/** Pendiente por semana usando minimos cuadrados sobre los ultimos N dias. */
export function weeklyTrend(points: TrendPoint[], days = 28): number {
  const recent = points.slice(-days);
  if (recent.length < 3) return 0;
  const t0 = new Date(recent[0].date).getTime();
  const xs = recent.map((p) => (new Date(p.date).getTime() - t0) / 86400000);
  const ys = recent.map((p) => p.value);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return 0;
  return Math.round((num / den) * 7 * 100) / 100; // kg por semana
}

export function weightSeries(measurements: BodyMeasurement[]): TrendPoint[] {
  return measurements
    .filter((m) => typeof m.weight === 'number')
    .map((m) => ({ date: m.date, value: m.weight as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const BODYFAT_RANGES: Record<Sex, { label: string; max: number; tone: string }[]> = {
  hombre: [
    { label: 'Competicion', max: 6, tone: 'text-brand' },
    { label: 'Definido', max: 10, tone: 'text-brand' },
    { label: 'Atletico', max: 14, tone: 'text-sky' },
    { label: 'Fitness', max: 18, tone: 'text-sky' },
    { label: 'Promedio', max: 25, tone: 'text-amber' },
    { label: 'Alto', max: 100, tone: 'text-rose' },
  ],
  mujer: [
    { label: 'Competicion', max: 14, tone: 'text-brand' },
    { label: 'Definida', max: 18, tone: 'text-brand' },
    { label: 'Atletica', max: 22, tone: 'text-sky' },
    { label: 'Fitness', max: 26, tone: 'text-sky' },
    { label: 'Promedio', max: 32, tone: 'text-amber' },
    { label: 'Alto', max: 100, tone: 'text-rose' },
  ],
};

export function bodyFatCategory(sex: Sex, pct: number): { label: string; tone: string } {
  const ranges = BODYFAT_RANGES[sex];
  return ranges.find((r) => pct <= r.max) ?? ranges[ranges.length - 1];
}
