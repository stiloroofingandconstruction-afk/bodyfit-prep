/**
 * Resumen automatico de la semana.
 *
 * Compara la semana en curso con la anterior y clasifica cada metrica en
 * mejoro / empeoro / se mantuvo. Es descriptivo, nunca alarmista: describe lo
 * que muestran los datos y deja la decision al usuario y a su entrenador.
 */

export type Direction = 'mejoro' | 'empeoro' | 'igual' | 'sin-datos';

export interface MetricComparison {
  key: string;
  label: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  direction: Direction;
  /** Formato legible del cambio. */
  detail: string;
}

export interface WeeklySummary {
  improved: MetricComparison[];
  worsened: MetricComparison[];
  stable: MetricComparison[];
  missing: MetricComparison[];
  headline: string;
}

interface MetricInput {
  key: string;
  label: string;
  current: number | null;
  previous: number | null;
  /** true si subir es mejor (energia, sueno); false si bajar es mejor (hambre, estres). */
  higherIsBetter: boolean;
  /** Cambio minimo para considerarlo significativo. */
  threshold: number;
  unit?: string;
  decimals?: number;
}

export function compareMetrics(inputs: MetricInput[]): WeeklySummary {
  const results: MetricComparison[] = inputs.map((m) => {
    if (m.current == null || m.previous == null) {
      return {
        key: m.key,
        label: m.label,
        current: m.current,
        previous: m.previous,
        delta: null,
        direction: 'sin-datos' as Direction,
        detail: 'Sin datos suficientes para comparar',
      };
    }

    const delta = m.current - m.previous;
    const decimals = m.decimals ?? 1;
    const significant = Math.abs(delta) >= m.threshold;

    let direction: Direction = 'igual';
    if (significant) {
      const improved = m.higherIsBetter ? delta > 0 : delta < 0;
      direction = improved ? 'mejoro' : 'empeoro';
    }

    const sign = delta > 0 ? '+' : '';
    const unit = m.unit ?? '';
    return {
      key: m.key,
      label: m.label,
      current: m.current,
      previous: m.previous,
      delta,
      direction,
      detail: `${m.previous.toFixed(decimals)}${unit} → ${m.current.toFixed(decimals)}${unit} (${sign}${delta.toFixed(decimals)}${unit})`,
    };
  });

  const improved = results.filter((r) => r.direction === 'mejoro');
  const worsened = results.filter((r) => r.direction === 'empeoro');
  const stable = results.filter((r) => r.direction === 'igual');
  const missing = results.filter((r) => r.direction === 'sin-datos');

  let headline: string;
  if (missing.length === results.length) {
    headline = 'Aun no hay dos semanas de datos para comparar.';
  } else if (worsened.length === 0 && improved.length > 0) {
    headline = `Semana solida: ${improved.length} metricas mejoraron y ninguna empeoro.`;
  } else if (improved.length === 0 && worsened.length > 0) {
    headline = `Semana dura: ${worsened.length} metricas empeoraron. Merece la pena mirar el descanso y la carga.`;
  } else if (improved.length >= worsened.length) {
    headline = `Balance positivo: ${improved.length} mejoraron, ${worsened.length} empeoraron.`;
  } else {
    headline = `Balance mixto: ${worsened.length} empeoraron frente a ${improved.length} que mejoraron.`;
  }

  return { improved, worsened, stable, missing, headline };
}

export const DIRECTION_TONE: Record<Direction, string> = {
  mejoro: 'text-brand',
  empeoro: 'text-rose',
  igual: 'text-muted',
  'sin-datos': 'text-faint',
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  mejoro: 'Mejoro',
  empeoro: 'Empeoro',
  igual: 'Se mantuvo',
  'sin-datos': 'Sin datos',
};
