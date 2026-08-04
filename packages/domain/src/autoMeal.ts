/**
 * Generador automatico de comidas — el motor detras de "Completar mis macros".
 *
 * Elige una fuente de proteina + una de carbohidrato (+ grasa + verdura segun
 * haga falta) y deja que el solver calcule los gramos exactos.
 */
import { solvePortions, type PortionInput, type SolveResult } from './solver';
import { round1 } from './macros';
import type { Food, Macros } from './types';

export interface MealSuggestion {
  key: string;
  title: string;
  result: SolveResult;
}

/** Listas curadas: lo primero que se propone son alimentos limpios y comunes. */
const PREFERRED = {
  protein: [
    'pollo-pechuga-cocida', 'pollo-pechuga-cruda', 'res-molida-95', 'atun-agua', 'salmon',
    'tilapia', 'huevo', 'clara-huevo', 'pavo-pechuga', 'yogur-griego-0', 'cottage',
    'whey-concentrada', 'nitrotech-gold', 'camaron', 'tofu',
  ],
  carb: [
    'arroz-blanco-cocido', 'papa-cocida', 'camote-cocido', 'avena', 'arroz-integral-cocido',
    'pasta-cocida', 'quinoa-cocida', 'pan-integral', 'platano', 'frijol-negro',
    'tortilla-maiz', 'rice-krispies', 'lenteja-cocida',
  ],
  fat: [
    'aceite-oliva', 'aguacate', 'almendra', 'mantequilla-mani', 'nuez', 'aceite-aguacate', 'chia',
  ],
  veg: [
    'brocoli', 'espinaca', 'ejote', 'esparrago', 'calabacin', 'pimiento', 'coliflor', 'champinon',
  ],
} as const;

type Pool = keyof typeof PREFERRED;

function pool(kind: Pool, catalog: Food[], favorites: string[], pantry: string[]): Food[] {
  const byId = new Map(catalog.map((f) => [f.id, f]));
  const seen = new Set<string>();
  const out: Food[] = [];

  const push = (f?: Food) => {
    if (f && !seen.has(f.id)) {
      seen.add(f.id);
      out.push(f);
    }
  };

  const roleOf = (f: Food) => f.role;
  // 1) Favoritos y despensa del usuario que encajen en el rol
  for (const id of [...favorites, ...pantry]) {
    const f = byId.get(id);
    if (f && roleOf(f) === kind) push(f);
  }
  // 2) Lista curada
  for (const id of PREFERRED[kind]) push(byId.get(id));
  // 3) Resto del catalogo con ese rol
  for (const f of catalog) if (roleOf(f) === kind) push(f);

  return out;
}

function pick<T>(list: T[], i: number): T | undefined {
  return list.length ? list[i % list.length] : undefined;
}

export interface SuggestOptions {
  catalog: Food[];
  favorites?: string[];
  pantry?: string[];
  /** Ids a excluir (por ejemplo lo que ya comiste hoy). */
  exclude?: string[];
  count?: number;
  /** Desplazamiento en las listas: sube de 1 en 1 para pedir "otras propuestas". */
  offset?: number;
}

/**
 * Propone `count` comidas distintas que completan los macros restantes.
 */
export function suggestMeals(remaining: Partial<Macros>, options: SuggestOptions): MealSuggestion[] {
  const { catalog, favorites = [], pantry = [], exclude = [], count = 3, offset = 0 } = options;
  const excluded = new Set(exclude);
  const usable = catalog.filter((f) => !excluded.has(f.id));

  const proteins = pool('protein', usable, favorites, pantry);
  const carbs = pool('carb', usable, favorites, pantry);
  const fats = pool('fat', usable, favorites, pantry);
  const vegs = pool('veg', usable, favorites, pantry);

  const kcal = Math.max(0, remaining.kcal ?? 0);
  const needFat = (remaining.fat ?? 0) >= 10;
  const needVeg = kcal >= 300;
  const tiny = kcal > 0 && kcal < 200;

  const out: MealSuggestion[] = [];
  for (let i = 0; i < count; i++) {
    const v = i + offset;
    const items: PortionInput[] = [];
    const names: string[] = [];

    const p = pick(proteins, v);
    if (p) {
      items.push({ food: p, min: tiny ? 20 : 60, max: tiny ? 150 : 400 });
      names.push(p.name);
    }
    if (!tiny) {
      const c = pick(carbs, v);
      if (c) {
        items.push({ food: c });
        names.push(c.name);
      }
      if (needFat) {
        const g = pick(fats, v);
        if (g) {
          items.push({ food: g, min: 0, max: g.per100.kcal > 600 ? 30 : 70 });
          names.push(g.name);
        }
      }
      if (needVeg) {
        const veg = pick(vegs, v);
        if (veg) {
          items.push({ food: veg, min: 80, max: 300 });
          names.push(veg.name);
        }
      }
    }

    if (!items.length) continue;
    const result = solvePortions(items, remaining);
    out.push({
      key: items.map((i) => i.food.id).join('|'),
      title: names.slice(0, 2).join(' + ') + (names.length > 2 ? ` +${names.length - 2}` : ''),
      result,
    });
  }

  // La mejor precision primero
  return out.sort((a, b) => b.result.accuracy - a.result.accuracy);
}

/* ----------------------------------------------------- planear el dia --- */

export interface DayPlanOptions extends SuggestOptions {
  /** Numero de comidas en las que repartir el objetivo. */
  meals: number;
  /** Fraccion extra de carbohidratos alrededor del entrenamiento (0–0.4). */
  carbAroundTraining?: number;
  /** Indice de la comida pre-entreno (0 = primera). */
  trainingMealIndex?: number;
}

export interface PlannedMeal {
  index: number;
  /** Etiqueta en espanol. La usan las exportaciones; la interfaz traduce `kind`. */
  label: string;
  /** Que papel juega esta comida en el dia, para poder traducirla. */
  kind: 'training' | 'first' | 'last' | 'plain';
  target: Macros;
  result: SolveResult;
}

/**
 * Genera un dia completo repartiendo los macros restantes entre N comidas.
 *
 * Reparto:
 *  - La proteina se distribuye a partes iguales: es lo que mejor funciona para
 *    la sintesis proteica y lo mas facil de cumplir.
 *  - Los carbohidratos pueden concentrarse alrededor del entrenamiento.
 *  - La grasa se reparte de forma uniforme, algo menor en la comida pre-entreno.
 */
export function planDay(remaining: Partial<Macros>, options: DayPlanOptions): PlannedMeal[] {
  const meals = Math.max(1, Math.min(8, options.meals));
  const carbShift = Math.max(0, Math.min(0.4, options.carbAroundTraining ?? 0));
  const trainingIndex = options.trainingMealIndex ?? Math.min(meals - 1, 1);

  const total = {
    kcal: Math.max(0, remaining.kcal ?? 0),
    protein: Math.max(0, remaining.protein ?? 0),
    carbs: Math.max(0, remaining.carbs ?? 0),
    fat: Math.max(0, remaining.fat ?? 0),
    fiber: Math.max(0, remaining.fiber ?? 0),
  };

  // Pesos de carbohidrato por comida: mas alrededor del entrenamiento
  const carbWeights = Array.from({ length: meals }, (_, i) => {
    if (meals === 1) return 1;
    const near = Math.abs(i - trainingIndex) <= 1;
    return near ? 1 + carbShift : Math.max(0.2, 1 - carbShift);
  });
  const carbSum = carbWeights.reduce((a, b) => a + b, 0);

  const out: PlannedMeal[] = [];
  const used = new Set<string>(options.exclude ?? []);

  for (let i = 0; i < meals; i++) {
    const carbShare = carbWeights[i] / carbSum;
    const fatShare = i === trainingIndex ? 0.6 / meals : (1 + 0.4 / (meals - 1 || 1)) / meals;

    const target: Macros = {
      kcal: 0, // se deriva de los macros
      protein: round1(total.protein / meals),
      carbs: round1(total.carbs * carbShare),
      fat: round1(total.fat * Math.min(1, fatShare)),
      fiber: round1(total.fiber / meals),
    };
    target.kcal = round1(target.protein * 4 + target.carbs * 4 + target.fat * 9);

    const [best] = suggestMeals(target, {
      ...options,
      exclude: [...used],
      count: 1,
      offset: i,
    });

    if (!best) continue;
    for (const p of best.result.portions) used.add(p.food.id);

    out.push({
      index: i,
      label: mealLabel(i, meals, i === trainingIndex),
      kind:
        i === trainingIndex ? 'training' : i === 0 ? 'first' : i === meals - 1 ? 'last' : 'plain',
      target,
      result: best.result,
    });
  }

  return out;
}

function mealLabel(i: number, total: number, isTraining: boolean): string {
  if (isTraining) return `Comida ${i + 1} · alrededor del entreno`;
  if (i === 0) return 'Comida 1 · primera del dia';
  if (i === total - 1) return `Comida ${i + 1} · ultima del dia`;
  return `Comida ${i + 1}`;
}

/* -------------------------------------------------------- complementos -- */

export interface Complement {
  food: Food;
  grams: number;
  macro: 'protein' | 'carbs' | 'fat';
  gap: number;
  reason: string;
}

/** Alimentos "puros" para tapar el hueco de un macro concreto. */
const FILLER: Record<'protein' | 'carbs' | 'fat', string[]> = {
  protein: ['clara-huevo', 'whey-isolate', 'whey-concentrada', 'pollo-pechuga-cocida', 'atun-agua'],
  carbs: ['arroz-blanco-cocido', 'papa-cocida', 'platano', 'miel', 'avena'],
  fat: ['aceite-oliva', 'aguacate', 'almendra', 'mantequilla-mani'],
};

const MACRO_LABEL = { protein: 'proteina', carbs: 'carbohidratos', fat: 'grasa' } as const;

/**
 * Cuando el plato elegido no puede cubrir un macro — pollo, arroz y brocoli no
 * tienen grasa — propone que anadir y cuanto. Devuelve null si no hay hueco
 * relevante.
 */
export function suggestComplement(
  achieved: Macros,
  target: Partial<Macros>,
  catalog: Food[],
): Complement | null {
  const byId = new Map(catalog.map((f) => [f.id, f]));
  const macros: ('protein' | 'carbs' | 'fat')[] = ['fat', 'protein', 'carbs'];

  // Umbrales: por debajo de esto el hueco no merece una comida extra
  const MIN_GAP = { protein: 12, carbs: 20, fat: 8 } as const;

  let best: Complement | null = null;

  for (const macro of macros) {
    const goal = target[macro] ?? 0;
    const gap = goal - (achieved[macro] ?? 0);
    if (goal <= 0 || gap < MIN_GAP[macro] || gap / goal < 0.2) continue;

    for (const id of FILLER[macro]) {
      const food = byId.get(id);
      if (!food) continue;
      const perGram = food.per100[macro] / 100;
      if (perGram <= 0.05) continue;

      const step = food.role === 'fat' ? 1 : 5;
      const grams = Math.max(step, Math.round(gap / perGram / step) * step);
      const candidate: Complement = {
        food,
        grams,
        macro,
        gap: Math.round(gap * 10) / 10,
        reason: `Te faltarian ${Math.round(gap)} g de ${MACRO_LABEL[macro]}`,
      };
      // Se prioriza el hueco proporcionalmente mayor
      if (!best || gap / goal > best.gap / (target[best.macro] ?? 1)) best = candidate;
      break;
    }
  }

  return best;
}
