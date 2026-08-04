import type { Food, Macros, MacroTarget } from './types';

export const EMPTY_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/** Calorias derivadas de los macros (Atwater). */
export function kcalFromMacros(protein: number, carbs: number, fat: number): number {
  return protein * KCAL_PER_G.protein + carbs * KCAL_PER_G.carbs + fat * KCAL_PER_G.fat;
}

/** Macros de `grams` gramos de un alimento (su tabla es por 100 g). */
export function macrosFor(food: Pick<Food, 'per100'>, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: round1(food.per100.kcal * f),
    protein: round1(food.per100.protein * f),
    carbs: round1(food.per100.carbs * f),
    fat: round1(food.per100.fat * f),
    fiber: round1(food.per100.fiber * f),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function sumMacros(list: Macros[]): Macros {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  for (const m of list) {
    kcal += m.kcal;
    protein += m.protein;
    carbs += m.carbs;
    fat += m.fat;
    fiber += m.fiber;
  }
  return { kcal: round1(kcal), protein: round1(protein), carbs: round1(carbs), fat: round1(fat), fiber: round1(fiber) };
}

/** Lo que falta para llegar al objetivo (nunca negativo salvo que pidas signo). */
export function remainingMacros(target: MacroTarget, consumed: Macros, allowNegative = false): Macros {
  const r = {
    kcal: target.kcal - consumed.kcal,
    protein: target.protein - consumed.protein,
    carbs: target.carbs - consumed.carbs,
    fat: target.fat - consumed.fat,
    fiber: target.fiber - consumed.fiber,
  };
  if (allowNegative) return r;
  return {
    kcal: Math.max(0, r.kcal),
    protein: Math.max(0, r.protein),
    carbs: Math.max(0, r.carbs),
    fat: Math.max(0, r.fat),
    fiber: Math.max(0, r.fiber),
  };
}

/** Reparto energetico en % (proteina/carbos/grasa). */
export function macroSplit(m: Macros): { protein: number; carbs: number; fat: number } {
  const total = kcalFromMacros(m.protein, m.carbs, m.fat) || 1;
  return {
    protein: Math.round((m.protein * 4 * 100) / total),
    carbs: Math.round((m.carbs * 4 * 100) / total),
    fat: Math.round((m.fat * 9 * 100) / total),
  };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round0(n: number): number {
  return Math.round(n);
}
