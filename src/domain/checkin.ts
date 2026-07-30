import type { Goal, Profile } from './types';

export interface CheckinInput {
  profile: Profile;
  currentWeight: number;
  /** Cambio real de peso en la semana (kg, con signo). */
  weightChange: number;
  adherence: number; // 0–100
  energy: number; // 1–5
  sleep: number; // 1–5
  hunger: number; // 1–5
  stress: number; // 1–5
  workoutsCompleted: number;
  currentKcal: number;
}

export type CheckinVerdict = 'en-rumbo' | 'lento' | 'rapido' | 'sin-datos' | 'adherencia';

export interface CheckinResult {
  verdict: CheckinVerdict;
  headline: string;
  detail: string;
  /** Cambio de peso esperado esta semana segun el objetivo (kg, con signo). */
  expectedChange: number;
  /** Ajuste de calorias recomendado (positivo = subir). */
  kcalAdjustment: number;
  newKcalTarget: number;
  tips: string[];
}

const GOAL_SIGN: Record<Goal, number> = { definicion: -1, mantenimiento: 0, volumen: 1 };

/**
 * Analiza la semana y recomienda un ajuste de calorias.
 *
 * Reglas, en orden de prioridad:
 *  1. Adherencia < 80 % -> no se toca nada, primero hay que cumplir el plan.
 *  2. Se compara el cambio real con el esperado (ritmo objetivo).
 *  3. La diferencia se traduce a kcal/dia (7700 kcal por kg) y se acota a +/-250.
 *  4. Se suavizan los ajustes si hay senales de fatiga (energia/sueno bajos).
 */
export function analyzeCheckin(input: CheckinInput): CheckinResult {
  const { profile, currentWeight, weightChange, adherence, currentKcal } = input;
  const sign = GOAL_SIGN[profile.goal];
  const expectedChange =
    sign === 0 ? 0 : sign * (currentWeight * profile.paceWeekPct) / 100 * (sign > 0 ? 0.75 : 1);

  const tips: string[] = [];

  if (adherence < 80) {
    return {
      verdict: 'adherencia',
      headline: 'Primero la adherencia',
      detail: `Cumpliste el ${Math.round(adherence)} % del plan. Ajustar calorias ahora solo anadiria ruido: el problema no son los numeros, es la ejecucion.`,
      expectedChange,
      kcalAdjustment: 0,
      newKcalTarget: currentKcal,
      tips: [
        'Prepara la comida del dia siguiente la noche anterior',
        'Registra en el momento, no al final del dia',
        'Baja el objetivo a 3 comidas fijas si 5 es demasiado',
      ],
    };
  }

  /*
   * Se razona en "progreso", no en peso con signo: para definicion progresar es
   * bajar y para volumen es subir. Asi una sola comparacion sirve para ambos y
   * no hay riesgo de invertir el signo.
   */
  const progress = sign * weightChange; // positivo = vas en la direccion correcta
  const expectedProgress = Math.abs(expectedChange);
  const gap = expectedProgress - progress; // >0 demasiado lento, <0 demasiado rapido
  const toleranceKg = Math.max(0.15, expectedProgress * 0.4);

  let verdict: CheckinVerdict;
  let headline: string;
  let detail: string;
  let kcalAdjustment = 0;

  if (profile.goal === 'mantenimiento') {
    if (Math.abs(weightChange) <= 0.4) {
      verdict = 'en-rumbo';
      headline = 'Peso estable';
      detail = 'Estas en mantenimiento real. No toques nada.';
    } else {
      verdict = weightChange > 0 ? 'rapido' : 'lento';
      headline = weightChange > 0 ? 'Subiendo de peso' : 'Bajando de peso';
      detail = `Cambio de ${fmt(weightChange)} kg. Para mantener, corrige unas ${Math.abs(Math.round((weightChange * 7700) / 7))} kcal/dia.`;
      kcalAdjustment = clampAdjust(-(weightChange * 7700) / 7);
    }
  } else if (Math.abs(gap) <= toleranceKg) {
    verdict = 'en-rumbo';
    headline = 'Vas en rumbo';
    detail = `Cambio de ${fmt(weightChange)} kg frente a ${fmt(expectedChange)} kg esperados. El plan funciona: mantenlo otra semana.`;
  } else if (gap > 0) {
    // Progresas mas despacio de lo previsto: hay que apretar
    verdict = 'lento';
    headline = sign < 0 ? 'La bajada se frena' : 'La subida se frena';
    // Definicion -> menos calorias. Volumen -> mas calorias.
    kcalAdjustment = clampAdjust((sign * gap * 7700) / 7);
    detail = `Cambio de ${fmt(weightChange)} kg frente a ${fmt(expectedChange)} kg esperados. Ajusta ${signed(kcalAdjustment)} kcal/dia.`;
  } else {
    // Progresas mas rapido de lo previsto: hay que aflojar
    verdict = 'rapido';
    headline = sign < 0 ? 'Estas bajando muy rapido' : 'Estas subiendo muy rapido';
    kcalAdjustment = clampAdjust((-sign * Math.abs(gap) * 7700) / 7);
    detail =
      sign < 0
        ? `Cambio de ${fmt(weightChange)} kg. A este ritmo pierdes musculo. Sube ${signed(kcalAdjustment)} kcal/dia.`
        : `Cambio de ${fmt(weightChange)} kg. Demasiado de esa ganancia sera grasa. Baja ${signed(kcalAdjustment)} kcal/dia.`;
  }

  // Amortiguacion por fatiga: no se profundiza un deficit con el cuerpo en rojo
  const fatigued = input.energy <= 2 || input.sleep <= 2 || input.hunger >= 4 || input.stress >= 4;
  if (fatigued && kcalAdjustment < 0) {
    kcalAdjustment = Math.round(kcalAdjustment / 2 / 25) * 25;
    tips.push('Ajuste reducido a la mitad: tu energia, sueno o hambre estan en zona de alerta');
  }

  if (input.workoutsCompleted <= 2) tips.push('Menos de 3 entrenos esta semana: el estimulo es el que protege el musculo');
  if (input.hunger >= 4) tips.push('Sube volumen de verdura y proteina magra para saciarte con las mismas calorias');
  if (input.sleep <= 2) tips.push('Dormir menos de 7 h eleva el cortisol y retiene agua: falsea la bascula');
  if (verdict === 'en-rumbo') tips.push('No cambies nada. La consistencia es el ajuste.');

  const newKcalTarget = Math.max(1200, Math.round((currentKcal + kcalAdjustment) / 10) * 10);

  return { verdict, headline, detail, expectedChange, kcalAdjustment, newKcalTarget, tips };
}

function clampAdjust(kcal: number): number {
  const capped = Math.max(-250, Math.min(250, kcal));
  return Math.round(capped / 25) * 25;
}

function fmt(kg: number): string {
  return `${kg > 0 ? '+' : ''}${kg.toFixed(2)}`;
}

function signed(kcal: number): string {
  return `${kcal > 0 ? '+' : ''}${kcal}`;
}

export const VERDICT_TONE: Record<CheckinVerdict, string> = {
  'en-rumbo': 'text-brand',
  lento: 'text-amber',
  rapido: 'text-rose',
  'sin-datos': 'text-muted',
  adherencia: 'text-amber',
};
