/**
 * Motor de recomendaciones del prep.
 *
 * Filosofia: conservador por defecto. Un prep se arruina mucho mas veces por
 * cambiar demasiado y demasiado pronto que por esperar una semana mas.
 *
 * Reglas duras:
 *  1. Solo se razona sobre la MEDIA de 7 dias, nunca sobre un peso suelto.
 *  2. Minimo 7 dias de datos; con menos de 14 la confianza baja.
 *  3. La adherencia se revisa ANTES que las calorias.
 *  4. Los cambios son pequenos y acotados.
 *  5. Mantener es una recomendacion valida y frecuente.
 *  6. Si fatiga, fuerza y sueno empeoran a la vez, se prioriza recuperar.
 *  7. Nada de practicas extremas.
 *
 * La recomendacion NUNCA se aplica sola: siempre requiere que el usuario
 * acepte, rechace o modifique.
 */
import type { Projection, WeightTrend } from './competition';
import type { RecommendationAction } from './prepTypes';

export interface RecommendationInput {
  trend: WeightTrend;
  projection: Projection;
  /** 0–100. */
  adherence: number;
  /** 1–5 cada uno. */
  energy: number;
  sleep: number;
  hunger: number;
  stress: number;
  /** Sensacion de fuerza en el gimnasio, 1–5. */
  strength: number;
  /** Minutos de cardio completados esta semana. */
  cardioMinutes: number;
  /** Entrenamientos completados esta semana. */
  workouts: number;
  currentKcal: number;
  /** Semanas restantes al show; null si no hay prep activo. */
  weeksOut: number | null;
}

export interface RecommendationResult {
  action: RecommendationAction;
  headline: string;
  reasoning: string[];
  dataUsed: string[];
  kcalDelta: number;
  cardioMinutesDelta: number;
  estimatedImpact: string;
  confidence: 'baja' | 'media' | 'alta';
}

/** Techos de cambio por semana. Deliberadamente pequenos. */
const MAX_KCAL_CUT = 150;
const MAX_KCAL_ADD = 200;
const MAX_CARDIO_ADD = 60; // minutos semanales
const MAX_CARDIO_CUT = 60;

export function recommend(input: RecommendationInput): RecommendationResult {
  const { trend, projection, adherence, currentKcal } = input;

  const dataUsed = [
    trend.avg7 != null ? `Media de 7 dias: ${trend.avg7} kg` : 'Media de 7 dias: sin datos',
    trend.prevAvg7 != null ? `Semana anterior: ${trend.prevAvg7} kg` : 'Semana anterior: sin datos',
    trend.weekChange != null
      ? `Cambio: ${signed(trend.weekChange)} kg (${signed(trend.weekPct ?? 0)}%)`
      : 'Cambio: no calculable',
    `Dias con peso en 14: ${trend.daysLogged14}`,
    `Adherencia declarada: ${Math.round(adherence)}%`,
    `Cardio semanal: ${input.cardioMinutes} min`,
    `Entrenamientos: ${input.workouts}`,
    `Energia ${input.energy}/5 · Sueno ${input.sleep}/5 · Hambre ${input.hunger}/5 · Estres ${input.stress}/5 · Fuerza ${input.strength}/5`,
  ];

  const confidence: RecommendationResult['confidence'] =
    trend.daysLogged14 >= 12 ? 'alta' : trend.daysLogged14 >= 7 ? 'media' : 'baja';

  /* ── Regla 2: datos insuficientes ─────────────────────────────────────── */
  if (!trend.reliable || trend.weekChange == null) {
    return {
      action: 'mantener',
      headline: 'Aun no hay datos suficientes',
      reasoning: [
        `Solo hay ${trend.daysLogged14} pesos registrados en las ultimas 2 semanas.`,
        'Se necesitan al menos 7 para que la media movil signifique algo.',
        'Cambiar calorias ahora seria adivinar, no ajustar.',
      ],
      dataUsed,
      kcalDelta: 0,
      cardioMinutesDelta: 0,
      estimatedImpact: 'Ninguno. Registra el peso a diario, en ayunas y a la misma hora.',
      confidence: 'baja',
    };
  }

  /* ── Regla 3: la adherencia va antes que los numeros ──────────────────── */
  if (adherence < 80) {
    return {
      action: 'mejorar-adherencia',
      headline: 'Primero la adherencia, despues los ajustes',
      reasoning: [
        `La adherencia fue del ${Math.round(adherence)}%.`,
        'Si el plan no se cumplio, el peso no esta midiendo el plan: esta midiendo otra cosa.',
        'Bajar calorias sobre un plan que no se sigue solo agranda la diferencia entre lo escrito y lo real.',
      ],
      dataUsed,
      kcalDelta: 0,
      cardioMinutesDelta: 0,
      estimatedImpact: 'Ninguno esta semana. Repite el plan actual y vuelve a medir en 7 dias.',
      confidence,
    };
  }

  /* ── Regla 6: senales de fatiga acumulada ─────────────────────────────── */
  const fatigueSignals = [
    input.energy <= 2,
    input.sleep <= 2,
    input.strength <= 2,
    input.stress >= 4,
    input.hunger >= 5,
  ].filter(Boolean).length;

  if (fatigueSignals >= 3) {
    return {
      action: 'recuperacion',
      headline: 'Prioriza recuperar antes de apretar',
      reasoning: [
        'Hay tres o mas senales de fatiga a la vez (energia, sueno, fuerza, estres o hambre).',
        'En ese estado, recortar mas suele costar musculo y adherencia, no grasa.',
        'Mantener calorias una semana, dormir mas y bajar el cardio suele devolver el progreso.',
      ],
      dataUsed,
      kcalDelta: 0,
      cardioMinutesDelta: -Math.min(MAX_CARDIO_CUT, Math.round(input.cardioMinutes * 0.3)),
      estimatedImpact:
        'Semana de sostenimiento. Es habitual que la bascula se quede quieta o suba un poco por agua.',
      confidence,
    };
  }

  const weekly = trend.weekChange;
  const weeklyPct = trend.weekPct ?? 0;

  /* ── Ritmo demasiado rapido ───────────────────────────────────────────── */
  // Por encima del 1.2% del peso corporal por semana el riesgo de perder
  // musculo sube claramente.
  if (weeklyPct <= -1.2) {
    const addKcal = Math.min(MAX_KCAL_ADD, Math.round((Math.abs(weeklyPct) - 0.8) * 200));
    return {
      action: 'aumentar-calorias',
      headline: 'Estas bajando demasiado rapido',
      reasoning: [
        `El ritmo es de ${signed(weeklyPct)}% del peso corporal por semana.`,
        'Por encima del 1% semanal, una parte creciente de lo que se pierde no es grasa.',
        'Subir un poco las calorias suele conservar fuerza sin frenar el prep.',
      ],
      dataUsed,
      kcalDelta: roundTo(addKcal, 25),
      cardioMinutesDelta: input.cardioMinutes > 120 ? -30 : 0,
      estimatedImpact: `Ritmo estimado tras el ajuste: en torno a ${(weeklyPct + 0.4).toFixed(1)}% semanal.`,
      confidence,
    };
  }

  /* ── En ritmo ─────────────────────────────────────────────────────────── */
  if (projection.status === 'en-ritmo' || (weeklyPct <= -0.4 && weeklyPct >= -1.0)) {
    return {
      action: 'mantener',
      headline: 'Manten el plan',
      reasoning: [
        `El ritmo actual (${signed(weeklyPct)}% semanal) esta en el rango sostenible.`,
        projection.status === 'en-ritmo'
          ? 'La proyeccion llega al objetivo dentro del margen previsto.'
          : 'El ritmo es adecuado aunque la proyeccion aun tenga margen.',
        'Cuando algo funciona, el mejor ajuste es no tocarlo.',
      ],
      dataUsed,
      kcalDelta: 0,
      cardioMinutesDelta: 0,
      estimatedImpact: 'Continuidad. Vuelve a evaluar dentro de 7 dias.',
      confidence,
    };
  }

  /* ── Ritmo demasiado lento o estancado ────────────────────────────────── */
  const stalled = weeklyPct > -0.3;
  if (stalled) {
    // Se prefiere cardio antes que recortar mas si las calorias ya son bajas
    const kcalIsLow = input.currentKcal <= 1800;
    const cardioIsLow = input.cardioMinutes < 150;

    if (kcalIsLow && cardioIsLow) {
      return {
        action: 'aumentar-cardio',
        headline: 'Suma cardio antes de recortar mas',
        reasoning: [
          `El peso apenas se movio (${signed(weekly)} kg de media).`,
          `Las calorias ya estan en ${currentKcal} kcal: seguir recortando comprime demasiado la comida.`,
          'Anadir actividad mantiene el hueco calorico sin quitar mas alimento.',
        ],
        dataUsed,
        kcalDelta: 0,
        cardioMinutesDelta: Math.min(MAX_CARDIO_ADD, 60),
        estimatedImpact: 'Unas 250–350 kcal semanales adicionales. Efecto visible en 7–10 dias.',
        confidence,
      };
    }

    const cut = Math.min(MAX_KCAL_CUT, Math.max(100, Math.round(currentKcal * 0.06)));
    return {
      action: 'reducir-calorias',
      headline: 'Ajuste pequeno a la baja',
      reasoning: [
        `La media de 7 dias cambio ${signed(weekly)} kg (${signed(weeklyPct)}%), por debajo del ritmo previsto.`,
        'La adherencia fue buena y no hay senales de fatiga acumulada.',
        `Se propone el recorte minimo util: ${roundTo(cut, 25)} kcal, no mas.`,
      ],
      dataUsed,
      kcalDelta: -roundTo(cut, 25),
      cardioMinutesDelta: 0,
      estimatedImpact: `Deficit adicional de unas ${roundTo(cut, 25) * 7} kcal semanales, cerca de ${((roundTo(cut, 25) * 7) / 7700).toFixed(2)} kg.`,
      confidence,
    };
  }

  /* ── Lento pero moviendose ────────────────────────────────────────────── */
  return {
    action: 'mantener',
    headline: 'Ritmo algo lento, pero avanzando',
    reasoning: [
      `Cambio de ${signed(weekly)} kg (${signed(weeklyPct)}%).`,
      'Es mas lento de lo ideal, pero la direccion es correcta y la adherencia es buena.',
      'Merece la pena una semana mas de datos antes de tocar nada.',
    ],
    dataUsed,
    kcalDelta: 0,
    cardioMinutesDelta: 0,
    estimatedImpact: 'Sin cambios. Si en 7 dias sigue igual, tocara un ajuste pequeno.',
    confidence,
  };
}

export const ACTION_LABEL: Record<RecommendationAction, string> = {
  mantener: 'Mantener',
  'reducir-calorias': 'Reducir calorias',
  'aumentar-calorias': 'Aumentar calorias',
  'aumentar-cardio': 'Aumentar cardio',
  'reducir-cardio': 'Reducir cardio',
  recuperacion: 'Recuperar',
  'mejorar-adherencia': 'Mejorar adherencia',
};

export const ACTION_TONE: Record<RecommendationAction, string> = {
  mantener: 'text-brand',
  'reducir-calorias': 'text-carbs',
  'aumentar-calorias': 'text-sky',
  'aumentar-cardio': 'text-carbs',
  'reducir-cardio': 'text-sky',
  recuperacion: 'text-violet',
  'mejorar-adherencia': 'text-rose',
};

function signed(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
}

function roundTo(v: number, step: number): number {
  return Math.round(v / step) * step;
}
