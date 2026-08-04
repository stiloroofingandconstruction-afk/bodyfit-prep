/**
 * Solver de porciones.
 *
 * Dado un conjunto de alimentos y los macros que te faltan hoy, calcula
 * cuantos gramos de cada uno debes comer.
 *
 * Problema:
 *
 *   min_g  SUM_m  w_m * ( (SUM_j a_mj * g_j - r_m) / s_m )^2
 *   s.a.   lo_j <= g_j <= hi_j
 *
 * donde m recorre {kcal, proteina, carbos, grasa}, a_mj es el macro m por gramo
 * del alimento j, r_m el objetivo restante y s_m una escala de normalizacion
 * (para que 300 kcal y 30 g de proteina pesen lo mismo).
 *
 * Es una cuadratica convexa con restricciones de caja: se resuelve con descenso
 * por coordenadas usando el minimo exacto de cada variable (paso de Newton, que
 * en una cuadratica es exacto) y proyeccion al intervalo. Converge en decimas de
 * milisegundo y no necesita ninguna libreria.
 */
import { macrosFor, round1 } from './macros';
import type { Food, Macros } from './types';

const ROWS = ['kcal', 'protein', 'carbs', 'fat'] as const;
type Row = (typeof ROWS)[number];

export interface PortionInput {
  food: Food;
  /** Gramos minimos (por defecto segun el rol del alimento). */
  min?: number;
  /** Gramos maximos. */
  max?: number;
  /** Redondeo final en gramos (5 por defecto, 1 para suplementos). */
  step?: number;
  /** Cantidad fijada por el usuario: no se optimiza, solo suma. */
  fixed?: number;
}

export interface Portion {
  food: Food;
  grams: number;
  macros: Macros;
  fixed: boolean;
}

export interface SolveResult {
  portions: Portion[];
  total: Macros;
  target: Partial<Macros>;
  /** Diferencia total - objetivo por macro (positivo = te pasas). */
  deltas: Record<Row, number>;
  /** 0–100: que tan cerca queda del objetivo. */
  accuracy: number;
  feasible: boolean;
}

export interface SolveOptions {
  weights?: Partial<Record<Row, number>>;
  iterations?: number;
}

/** Prioridad por defecto: la proteina manda, las calorias vienen despues. */
const DEFAULT_WEIGHTS: Record<Row, number> = {
  kcal: 1.0,
  protein: 1.6,
  carbs: 0.85,
  fat: 0.85,
};

/** Escala minima por macro para no dividir por cero cuando el objetivo es 0. */
const MIN_SCALE: Record<Row, number> = { kcal: 150, protein: 15, carbs: 20, fat: 8 };

/** Limites por defecto segun el papel del alimento en el plato. */
export function defaultBounds(food: Food): { min: number; max: number; step: number } {
  const kcal100 = food.per100.kcal || 1;
  switch (food.role) {
    case 'protein':
      return { min: 50, max: food.category === 'suplemento' ? 60 : 400, step: 5 };
    case 'carb':
      return { min: 20, max: kcal100 > 300 ? 150 : 400, step: 5 };
    case 'fat':
      return { min: 5, max: kcal100 > 600 ? 40 : 80, step: 1 };
    case 'veg':
      // 300 g ya es un plato grande de verdura: mas alla el solver empezaba a
      // usarla como relleno calorico y proponia cantidades irreales.
      return { min: 50, max: 300, step: 10 };
    default:
      return { min: 0, max: 300, step: 5 };
  }
}

function macroPerGram(food: Food): Record<Row, number> {
  return {
    kcal: food.per100.kcal / 100,
    protein: food.per100.protein / 100,
    carbs: food.per100.carbs / 100,
    fat: food.per100.fat / 100,
  };
}

/**
 * Resuelve las porciones.
 * @param items alimentos elegidos
 * @param target macros restantes del dia
 */
export function solvePortions(
  items: PortionInput[],
  target: Partial<Macros>,
  options: SolveOptions = {},
): SolveResult {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const iterations = options.iterations ?? 400;

  const r: Record<Row, number> = {
    kcal: Math.max(0, target.kcal ?? 0),
    protein: Math.max(0, target.protein ?? 0),
    carbs: Math.max(0, target.carbs ?? 0),
    fat: Math.max(0, target.fat ?? 0),
  };
  const scale: Record<Row, number> = {
    kcal: Math.max(r.kcal, MIN_SCALE.kcal),
    protein: Math.max(r.protein, MIN_SCALE.protein),
    carbs: Math.max(r.carbs, MIN_SCALE.carbs),
    fat: Math.max(r.fat, MIN_SCALE.fat),
  };
  /** Peso efectivo ya normalizado: w_m / s_m^2 */
  const wn: Record<Row, number> = {
    kcal: weights.kcal / (scale.kcal * scale.kcal),
    protein: weights.protein / (scale.protein * scale.protein),
    carbs: weights.carbs / (scale.carbs * scale.carbs),
    fat: weights.fat / (scale.fat * scale.fat),
  };

  const free: { idx: number; a: Record<Row, number>; lo: number; hi: number; step: number }[] = [];
  const grams = new Array<number>(items.length).fill(0);
  const fixedFlags = new Array<boolean>(items.length).fill(false);

  // Contribucion inicial de los alimentos fijados por el usuario
  const acc: Record<Row, number> = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  items.forEach((item, idx) => {
    const a = macroPerGram(item.food);
    if (item.fixed != null) {
      grams[idx] = item.fixed;
      fixedFlags[idx] = true;
      for (const m of ROWS) acc[m] += a[m] * item.fixed;
      return;
    }
    const d = defaultBounds(item.food);
    const lo = item.min ?? d.min;
    const hi = Math.max(lo, item.max ?? d.max);
    const step = item.step ?? d.step;
    // Arranque: reparto uniforme de calorias entre los alimentos libres
    grams[idx] = clamp((r.kcal / Math.max(1, items.length)) / Math.max(a.kcal, 0.2), lo, hi);
    free.push({ idx, a, lo, hi, step });
  });

  if (free.length === 0) {
    return buildResult(items, grams, fixedFlags, target);
  }

  // Residuo e_m = (contribucion actual) - objetivo
  const e: Record<Row, number> = { ...acc };
  for (const f of free) for (const m of ROWS) e[m] += f.a[m] * grams[f.idx];
  for (const m of ROWS) e[m] -= r[m];

  // Curvatura por variable: constante en una cuadratica, se precalcula
  const denom = free.map((f) => {
    let d = 0;
    for (const m of ROWS) d += wn[m] * f.a[m] * f.a[m];
    return d || 1e-9;
  });

  for (let it = 0; it < iterations; it++) {
    let maxMove = 0;
    for (let k = 0; k < free.length; k++) {
      const f = free[k];
      let num = 0;
      for (const m of ROWS) num += wn[m] * f.a[m] * e[m];
      const target_g = clamp(grams[f.idx] - num / denom[k], f.lo, f.hi);
      const move = target_g - grams[f.idx];
      if (move === 0) continue;
      grams[f.idx] = target_g;
      for (const m of ROWS) e[m] += f.a[m] * move;
      maxMove = Math.max(maxMove, Math.abs(move));
    }
    if (maxMove < 0.05) break;
  }

  // Redondeo al paso + refinado local (probar +/- 1 y 2 pasos y quedarse con lo mejor)
  for (const f of free) {
    const snapped = clamp(Math.round(grams[f.idx] / f.step) * f.step, f.lo, f.hi);
    const move = snapped - grams[f.idx];
    grams[f.idx] = snapped;
    for (const m of ROWS) e[m] += f.a[m] * move;
  }

  const cost = () => {
    let c = 0;
    for (const m of ROWS) c += wn[m] * e[m] * e[m];
    return c;
  };

  let best = cost();
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (const f of free) {
      for (const delta of [f.step, -f.step, 2 * f.step, -2 * f.step]) {
        const cand = clamp(grams[f.idx] + delta, f.lo, f.hi);
        const move = cand - grams[f.idx];
        if (move === 0) continue;
        for (const m of ROWS) e[m] += f.a[m] * move;
        const c = cost();
        if (c < best - 1e-12) {
          best = c;
          grams[f.idx] = cand;
          improved = true;
        } else {
          for (const m of ROWS) e[m] -= f.a[m] * move; // deshacer
        }
      }
    }
    if (!improved) break;
  }

  return buildResult(items, grams, fixedFlags, target);
}

function buildResult(
  items: PortionInput[],
  grams: number[],
  fixedFlags: boolean[],
  target: Partial<Macros>,
): SolveResult {
  const portions: Portion[] = items.map((item, i) => ({
    food: item.food,
    grams: Math.round(grams[i]),
    macros: macrosFor(item.food, grams[i]),
    fixed: fixedFlags[i],
  }));

  const total: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const p of portions) {
    total.kcal += p.macros.kcal;
    total.protein += p.macros.protein;
    total.carbs += p.macros.carbs;
    total.fat += p.macros.fat;
    total.fiber += p.macros.fiber;
  }
  total.kcal = round1(total.kcal);
  total.protein = round1(total.protein);
  total.carbs = round1(total.carbs);
  total.fat = round1(total.fat);
  total.fiber = round1(total.fiber);

  const deltas: Record<Row, number> = {
    kcal: round1(total.kcal - (target.kcal ?? 0)),
    protein: round1(total.protein - (target.protein ?? 0)),
    carbs: round1(total.carbs - (target.carbs ?? 0)),
    fat: round1(total.fat - (target.fat ?? 0)),
  };

  // Precision: error relativo medio ponderado, acotado a 0–100
  const parts: number[] = [];
  for (const m of ROWS) {
    const t = target[m] ?? 0;
    if (t <= 0) continue;
    parts.push(Math.min(1, Math.abs(deltas[m]) / t));
  }
  const err = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  const accuracy = Math.round((1 - err) * 100);

  return {
    portions,
    total,
    target,
    deltas,
    accuracy,
    feasible: accuracy >= 70,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
