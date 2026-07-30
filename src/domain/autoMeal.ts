/**
 * Generador automatico de comidas — el motor detras de "Completar mis macros".
 *
 * Elige una fuente de proteina + una de carbohidrato (+ grasa + verdura segun
 * haga falta) y deja que el solver calcule los gramos exactos.
 */
import { solvePortions, type PortionInput, type SolveResult } from './solver';
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
