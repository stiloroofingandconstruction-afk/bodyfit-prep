/**
 * Busqueda de alimentos: sin acentos, tolerante a plurales y a erratas.
 * El indice se construye una sola vez; cada consulta recorre un array plano
 * de strings ya normalizados, asi que responde en decimas de milisegundo.
 */
import type { Food } from '@/domain/types';
import { FOODS } from './foods';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s%/,]/g, ' ') // la coma se conserva: separa alimentos en una frase
    .replace(/\s+/g, ' ')
    .trim();
}

/** Singulariza de forma aproximada en espanol (suficiente para buscar). */
function singular(word: string): string {
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

interface IndexEntry {
  food: Food;
  name: string;
  nameStem: string;
  /** Nombre principal, sin variantes: "Platano / Banano" -> "platano". */
  primary: string;
  terms: string[]; // alias + marca, normalizados
  termStems: string[];
  rank: number; // posicion en el catalogo: los mas comunes van primero
}

let INDEX: IndexEntry[] | null = null;
let INDEX_SOURCE: Food[] = FOODS;

function buildIndex(foods: Food[]): IndexEntry[] {
  return foods.map((food, i) => {
    const name = normalize(food.name);
    const terms = [...food.aliases.map(normalize), ...(food.brand ? [normalize(food.brand)] : [])];
    return {
      food,
      name,
      nameStem: name.split(' ').map(singular).join(' '),
      primary: normalize(food.name.split(/[/(]/)[0]),
      terms,
      termStems: terms.map((t) => t.split(' ').map(singular).join(' ')),
      rank: i,
    };
  });
}

/** Registra los alimentos personalizados para que entren en la busqueda. */
export function setCatalog(foods: Food[]): void {
  INDEX_SOURCE = foods;
  INDEX = null;
}

function index(): IndexEntry[] {
  if (!INDEX) INDEX = buildIndex(INDEX_SOURCE);
  return INDEX;
}

export function allFoods(): Food[] {
  return INDEX_SOURCE;
}

/** Distancia de edicion acotada — solo para consultas cortas con erratas. */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let best = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function scoreEntry(e: IndexEntry, q: string, qStem: string): number {
  if (e.name === q || e.nameStem === qStem) return 1000;
  // "platano" debe traer el platano antes que el platano macho
  if (e.primary === q) return 980;
  for (const t of e.terms) if (t === q) return 900;
  for (const t of e.termStems) if (t === qStem) return 880;

  if (e.name.startsWith(q)) return 700 - e.name.length;
  if (e.nameStem.startsWith(qStem)) return 690 - e.name.length;
  for (const t of e.terms) if (t.startsWith(q)) return 600;
  for (const t of e.termStems) if (t.startsWith(qStem)) return 580;

  // Coincidencia de palabra completa dentro del nombre
  if (e.name.split(' ').some((w) => w === q || singular(w) === qStem)) return 520;
  if (e.name.includes(q)) return 400 - e.name.length;
  for (const t of e.terms) if (t.includes(q)) return 350;

  // Errata: solo si la consulta ya tiene cuerpo
  if (q.length >= 4) {
    const d = editDistance(qStem, e.nameStem.split(' ')[0], 2);
    if (d <= 2) return 250 - d * 60;
    for (const t of e.termStems) {
      const dt = editDistance(qStem, t.split(' ')[0], 2);
      if (dt <= 2) return 230 - dt * 60;
    }
  }
  return 0;
}

export interface SearchResult {
  food: Food;
  score: number;
}

export function searchFoods(query: string, limit = 12): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const qStem = q.split(' ').map(singular).join(' ');

  const out: SearchResult[] = [];
  for (const e of index()) {
    const s = scoreEntry(e, q, qStem);
    if (s > 0) out.push({ food: e.food, score: s - e.rank * 0.01 });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

export function bestMatch(query: string): Food | null {
  return searchFoods(query, 1)[0]?.food ?? null;
}

/* ------------------------------------------------ lenguaje natural ------ */

const FILLER = new Set([
  'quiero', 'comer', 'me', 'gustaria', 'apetece', 'hoy', 'ahora', 'para', 'la', 'el', 'los', 'las',
  'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'algo', 'con', 'y', 'e', 'mas', 'cena', 'comida',
  'almuerzo', 'desayuno', 'tengo', 'ganas', 'voy', 'a', 'en', 'que', 'porfa', 'porfavor', 'dame',
  'hazme', 'plato', 'solo', 'solamente', 'anade', 'agrega', 'pon', 'ponme',
]);

export interface ParsedFoodMention {
  raw: string;
  food: Food | null;
  grams?: number;
}

/**
 * Interpreta frases del tipo:
 *   "Quiero comer pollo, arroz y brocoli"
 *   "200g de pollo con arroz"
 * Devuelve los alimentos detectados en orden.
 */
export function parseFoodPhrase(phrase: string): ParsedFoodMention[] {
  const cleaned = normalize(phrase);
  if (!cleaned) return [];

  // Separadores: comas, " y ", " con ", " mas ", "+"
  const fragments = cleaned
    .split(/,| y | e | con | mas |\+|\//)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: ParsedFoodMention[] = [];

  for (const frag of fragments) {
    // Gramos explicitos: "200 g", "200g", "1.5 kg"
    let grams: number | undefined;
    const gm = frag.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramos|ml|l)\b/);
    if (gm) {
      const value = parseFloat(gm[1].replace(',', '.'));
      grams = gm[2] === 'kg' || gm[2] === 'l' ? value * 1000 : value;
    }

    const words = frag
      .replace(/\d+(?:[.,]\d+)?\s*(kg|g|gr|gramos|ml|l)\b/g, ' ')
      .split(' ')
      .filter((w) => w && !FILLER.has(w) && !/^\d+$/.test(w));

    if (!words.length) continue;

    // 1) Se prueba el fragmento entero: "pechuga de pollo" es UN alimento.
    // 2) Si no hay una coincidencia solida, se busca palabra por palabra y se
    //    aceptan TODAS: "pollo arroz" sin coma siguen siendo dos alimentos.
    const matched: Food[] = [];
    const whole = searchFoods(words.join(' '), 1)[0];
    if (whole && whole.score >= 495) {
      matched.push(whole.food);
    } else {
      for (const w of words) {
        const hit = searchFoods(w, 1)[0];
        if (hit && hit.score >= 395) matched.push(hit.food);
      }
    }

    if (!matched.length) {
      const raw = words.join(' ');
      if (!seen.has(raw)) {
        seen.add(raw);
        out.push({ raw, food: null });
      }
      continue;
    }

    for (const food of matched) {
      if (seen.has(food.id)) continue;
      seen.add(food.id);
      // Los gramos explicitos solo se aplican si el fragmento nombra un alimento
      out.push({
        raw: words.join(' '),
        food,
        ...(grams != null && matched.length === 1 ? { grams } : {}),
      });
    }
  }

  return out;
}
