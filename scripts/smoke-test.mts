/**
 * Prueba de humo de la logica de dominio.
 * Se ejecuta con:  npm run test:domain
 *
 * No es un framework de tests: es la verificacion minima de que el solver, la
 * busqueda y el generador de comidas hacen lo que prometen.
 */
import { FOODS, FOOD_BY_ID } from '../src/data/foods';
import { EXERCISE_BY_ID } from '../src/data/exercises';
import { parseFoodPhrase, searchFoods, setCatalog } from '../src/data/foodSearch';
import { solvePortions } from '../src/domain/solver';
import { suggestComplement, suggestMeals } from '../src/domain/autoMeal';
import { computeTargets, tdee } from '../src/domain/energy';
import { macrosFor } from '../src/domain/macros';
import { analyzeCheckin } from '../src/domain/checkin';
import { navyBodyFat } from '../src/domain/body';
import {
  defaultIncrement,
  defaultRepRange,
  estimate1RM,
  lastSessionOf,
  suggestProgression,
} from '../src/domain/training';
import { runCompetitionTests } from './smoke-competition.mts';
import { runUnitsTests } from './smoke-units.mts';
import { runContentTests } from './smoke-content.mts';
import { runBackupTests } from './smoke-backup.mts';
import type { Profile } from '../src/domain/types';

setCatalog(FOODS);

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  ok  ' : '  FALLA'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};
const line = (t: string) => console.log(`\n${t}\n${'-'.repeat(t.length)}`);

/* ------------------------------------------------------------ busqueda -- */
line('Busqueda de alimentos');

for (const [query, expected] of [
  ['pollo', 'pollo-pechuga-cocida'],
  ['Pollo', 'pollo-pechuga-cocida'],
  ['arroz', 'arroz-blanco-cocido'],
  ['papa', 'papa-cruda'],
  ['avena', 'avena'],
  ['fairlife', 'fairlife-2'],
  ['rice krispies', 'rice-krispies'],
  ['nitro-tech', 'nitrotech'],
  ['cell tech', 'cell-tech'],
  ['celltech', 'cell-tech'],
  ['brocoli', 'brocoli'],
  ['brócoli', 'brocoli'],
  ['platano', 'platano'],
  ['huevos', 'huevo'],
  ['pollos', 'pollo-pechuga-cocida'],
  ['aguakate', 'aguacate'],
] as const) {
  const top = searchFoods(query, 3);
  const ids = top.map((r) => r.food.id);
  check(`"${query}"`, ids.includes(expected), `→ ${ids.slice(0, 3).join(', ')}`);
}

/* ----------------------------------------------------- lenguaje natural -- */
line('Frases en lenguaje natural');

const parsed = parseFoodPhrase('Quiero comer pollo, arroz y brocoli');
check(
  'Quiero comer pollo, arroz y brocoli → 3 alimentos',
  parsed.length === 3 && parsed.every((p) => p.food),
  parsed.map((p) => p.food?.name ?? `? ${p.raw}`).join(' | '),
);

const parsed2 = parseFoodPhrase('200g de pollo con arroz');
check(
  '200g de pollo con arroz → gramos detectados',
  parsed2[0]?.grams === 200 && parsed2.length === 2,
  parsed2.map((p) => `${p.food?.name} ${p.grams ?? ''}`).join(' | '),
);

/* -------------------------------------------------------------- solver -- */
line('Solver de porciones');

const remaining = { kcal: 900, protein: 70, carbs: 90, fat: 25, fiber: 10 };
const pollo = FOOD_BY_ID.get('pollo-pechuga-cocida')!;
const arroz = FOOD_BY_ID.get('arroz-blanco-cocido')!;
const brocoli = FOOD_BY_ID.get('brocoli')!;

const sol = solvePortions([{ food: pollo }, { food: arroz }, { food: brocoli }], remaining);
console.log(
  '  ',
  sol.portions.map((p) => `${p.food.name}: ${p.grams} g`).join('  |  '),
);
console.log(
  '   total →',
  `${Math.round(sol.total.kcal)} kcal, P ${sol.total.protein.toFixed(0)}, C ${sol.total.carbs.toFixed(0)}, G ${sol.total.fat.toFixed(0)}`,
  `(objetivo ${remaining.kcal} / ${remaining.protein} / ${remaining.carbs} / ${remaining.fat})`,
);
// Pollo + arroz + brocoli no tienen grasa: el hueco de grasa es inevitable y
// debe reflejarse, no maquillarse. Lo que si debe clavar son proteina y carbos.
check('proteina dentro de +/-10 g', Math.abs(sol.deltas.protein) <= 10, `${sol.deltas.protein} g`);
check('carbohidratos dentro de +/-12 g', Math.abs(sol.deltas.carbs) <= 12, `${sol.deltas.carbs} g`);
check('gramos positivos y redondeados a 5', sol.portions.every((p) => p.grams > 0 && p.grams % 5 === 0));
check('cantidades realistas (<= 350 g por alimento)', sol.portions.every((p) => p.grams <= 350));

const comp = suggestComplement(sol.total, remaining, FOODS);
console.log(`   complemento → ${comp ? `${comp.food.name} ${comp.grams} ${comp.food.unit} (${comp.reason})` : 'ninguno'}`);
check('detecta el hueco de grasa y propone como cerrarlo', comp?.macro === 'fat');

// Con una fuente de grasa en el plato el ajuste debe ser casi perfecto
const aceite = FOOD_BY_ID.get('aceite-oliva')!;
const sol4 = solvePortions(
  [{ food: pollo }, { food: arroz }, { food: brocoli }, { food: aceite }],
  remaining,
);
console.log('  ', sol4.portions.map((p) => `${p.food.name}: ${p.grams} g`).join('  |  '));
check('anadiendo aceite, precision >= 92%', sol4.accuracy >= 92, `${sol4.accuracy}%`);

// Con una cantidad fijada por el usuario
const fixed = solvePortions(
  [{ food: pollo, fixed: 200 }, { food: arroz }, { food: brocoli }],
  remaining,
);
check(
  'respeta la cantidad fijada',
  fixed.portions[0].grams === 200 && fixed.portions[0].fixed,
  fixed.portions.map((p) => `${p.food.name}: ${p.grams}`).join(', '),
);

// Rendimiento
const t0 = performance.now();
for (let i = 0; i < 1000; i++) {
  solvePortions([{ food: pollo }, { food: arroz }, { food: brocoli }], remaining);
}
const perSolve = (performance.now() - t0) / 1000;
check('menos de 1 ms por resolucion', perSolve < 1, `${perSolve.toFixed(3)} ms`);

/* ---------------------------------------------------- completar macros -- */
line('Completar mis macros');

const meals = suggestMeals({ kcal: 620, protein: 55, carbs: 60, fat: 15, fiber: 8 }, {
  catalog: FOODS,
  count: 3,
});
for (const m of meals) {
  console.log(
    `   ${m.result.accuracy}%  ${m.result.portions.map((p) => `${p.food.name} ${p.grams}${p.food.unit}`).join(' · ')}`,
  );
}
check('genera 3 propuestas', meals.length === 3);
check('la mejor supera el 85%', (meals[0]?.result.accuracy ?? 0) >= 85, `${meals[0]?.result.accuracy}%`);

/* ------------------------------------------------------------ energia --- */
line('Energia y macros');

const profile: Profile = {
  name: 'Test',
  sex: 'hombre',
  birthDate: '1995-06-15',
  heightCm: 178,
  startWeight: 82,
  activity: 'moderado',
  goal: 'definicion',
  paceWeekPct: 0.6,
  proteinPerKg: 2,
  fatPerKg: 0.8,
  kcalOverride: null,
  units: 'metric',
  onboarded: true,
};

const maint = tdee(profile, 82);
const targets = computeTargets(profile, 82);
console.log(`   mantenimiento ${maint} kcal → objetivo ${targets.kcal} kcal`);
console.log(`   P ${targets.protein} g · C ${targets.carbs} g · G ${targets.fat} g`);
check('mantenimiento en rango razonable', maint > 2300 && maint < 3200, `${maint}`);
check('deficit aplicado', targets.kcal < maint);
check('proteina = 2 g/kg', targets.protein === 164);
check(
  'las calorias cuadran con los macros',
  Math.abs(targets.protein * 4 + targets.carbs * 4 + targets.fat * 9 - targets.kcal) <= 5,
);

const m = macrosFor(pollo, 200);
check('200 g de pollo = 62 g de proteina', Math.abs(m.protein - 62) < 0.5, `${m.protein} g`);

/* ------------------------------------------------------------ check-in -- */
line('Check-in semanal');

const slow = analyzeCheckin({
  profile,
  currentWeight: 82,
  weightChange: -0.1,
  adherence: 95,
  energy: 4,
  sleep: 4,
  hunger: 2,
  stress: 2,
  workoutsCompleted: 4,
  currentKcal: 2400,
});
console.log(`   ${slow.verdict}: ${slow.headline} → ${slow.kcalAdjustment} kcal`);
check('progreso lento → recorta calorias', slow.verdict === 'lento' && slow.kcalAdjustment < 0);

const bad = analyzeCheckin({
  profile,
  currentWeight: 82,
  weightChange: -0.5,
  adherence: 60,
  energy: 3,
  sleep: 3,
  hunger: 3,
  stress: 3,
  workoutsCompleted: 3,
  currentKcal: 2400,
});
check('adherencia baja → no toca calorias', bad.verdict === 'adherencia' && bad.kcalAdjustment === 0);

/* -------------------------------------------------------------- cuerpo -- */
line('Composicion corporal y entrenamiento');

const bf = navyBodyFat({ sex: 'hombre', heightCm: 178, neck: 39, waist: 85 });
check('%grasa Navy en rango plausible', bf !== null && bf > 12 && bf < 22, `${bf}%`);
check('1RM de 100x5 ≈ 117 kg', Math.abs(estimate1RM(100, 5) - 116.7) < 0.5, `${estimate1RM(100, 5)}`);

/* ------------------------------------------------------------ catalogo -- */
line('Integridad del catalogo');

const badKcal = FOODS.filter((f) => {
  const derived = f.per100.protein * 4 + f.per100.carbs * 4 + f.per100.fat * 9;
  return f.per100.kcal > 0 && Math.abs(derived - f.per100.kcal) > f.per100.kcal * 0.18 + 12;
});
check(
  'las calorias declaradas cuadran con 4/4/9',
  badKcal.length === 0,
  badKcal.map((f) => f.name).join(', '),
);
check('sin ids duplicados', new Set(FOODS.map((f) => f.id)).size === FOODS.length);
console.log(`   ${FOODS.length} alimentos en la base local`);


/* ------------------------------------------- ultima sesion y progresion -- */
line('Ultima sesion y progresion sugerida');

const mkSet = (weight: number, reps: number, extra: Record<string, unknown> = {}) => ({
  id: `s${weight}-${reps}-${Math.random()}`,
  weight,
  reps,
  done: true,
  type: 'normal' as const,
  ...extra,
});

const mkWorkout = (id: string, date: string, exerciseId: string, sets: ReturnType<typeof mkSet>[]) => ({
  id,
  createdAt: '',
  updatedAt: '',
  date,
  name: 'Test',
  startedAt: `${date}T10:00:00.000Z`,
  exercises: [{ id: `e-${id}`, exerciseId, exerciseName: exerciseId, sets }],
});

const historial = [
  mkWorkout('w1', '2026-07-01', 'press-banca', [mkSet(100, 8), mkSet(100, 8)]),
  mkWorkout('w2', '2026-07-08', 'press-banca', [mkSet(102.5, 6), mkSet(102.5, 6), mkSet(102.5, 5)]),
  mkWorkout('w3', '2026-07-10', 'sentadilla', [mkSet(140, 5)]),
];

const ultima = lastSessionOf(historial, 'press-banca');
check('encuentra la ultima sesion del ejercicio', ultima?.date === '2026-07-08', ultima?.date);
check('trae las series de ese dia', ultima?.sets.length === 3, `${ultima?.sets.length}`);
check('calcula el peso mas alto del dia', ultima?.topWeight === 102.5, `${ultima?.topWeight}`);
check('ignora los ejercicios de otros dias', lastSessionOf(historial, 'peso-muerto') === null);
check(
  'puede excluir la sesion en curso',
  lastSessionOf(historial, 'press-banca', 'w2')?.date === '2026-07-01',
);

// Calentamientos y series sin marcar no cuentan como ultima sesion
const soloCalentamiento = [
  mkWorkout('w4', '2026-07-20', 'remo-barra', [mkSet(40, 10, { type: 'calentamiento' })]),
];
check('el calentamiento solo no cuenta como sesion', lastSessionOf(soloCalentamiento, 'remo-barra') === null);

/* ── progresion ── */
const subir = suggestProgression([mkSet(100, 8), mkSet(100, 8)], [6, 8], 2.5);
check('completar el rango alto sube el peso', subir?.kind === 'subir-peso' && subir.weight === 102.5, `${subir?.weight}`);
check('al subir el peso se vuelve al rango bajo', subir?.reps === 6, `${subir?.reps}`);

const consolidar = suggestProgression([mkSet(100, 8), mkSet(100, 4)], [6, 8], 2.5);
check('quedarse corto manda consolidar', consolidar?.kind === 'consolidar' && consolidar.weight === 100);

const sumarRep = suggestProgression([mkSet(100, 6), mkSet(100, 7)], [6, 8], 2.5);
check('en medio del rango suma una repeticion', sumarRep?.kind === 'sumar-repeticion' && sumarRep.reps === 7, `${sumarRep?.reps}`);

check('sin series efectivas no hay sugerencia', suggestProgression([], [6, 8]) === null);
check(
  'sin peso registrado no hay sugerencia',
  suggestProgression([mkSet(0, 12)], [8, 12]) === null,
);

/* ── rangos por defecto ── */
check('un basico compuesto usa 6-10', JSON.stringify(defaultRepRange({ compound: true, pattern: 'empuje-horizontal' })) === '[6,10]');
check('un aislamiento usa 10-15', JSON.stringify(defaultRepRange({ compound: false, pattern: 'aislamiento' })) === '[10,15]');
check('el core usa 8-15', JSON.stringify(defaultRepRange({ compound: false, pattern: 'core-antiextension' })) === '[8,15]');
check('el incremento distingue basico de aislamiento', defaultIncrement(true) === 2.5 && defaultIncrement(false) === 1);

// Con los ejercicios reales del catalogo la sugerencia no debe descuadrarse
const banca = FOOD_BY_ID ? EXERCISE_BY_ID.get('press-banca') : undefined;
check(
  'el rango del press de banca sale del propio ejercicio',
  banca ? defaultRepRange({ compound: banca.compound, pattern: banca.pattern })[1] <= 12 : false,
);

/* ============================== SUITE DE COMPETENCIA ================== */
runCompetitionTests(check, line);

/* ======================= UNIDADES, TECNICA, VIDEO, I18N ============== */
runUnitsTests(check, line);

/* ================== AUDITORIA DE CONTENIDO DE EJERCICIOS ============= */
runContentTests(check, line);

/* ================== COPIAS DE SEGURIDAD Y RESTAURACION =============== */
runBackupTests(check, line);

/* ---------------------------------------------------------------------- */
console.log(`\n${failures === 0 ? 'TODO CORRECTO' : `${failures} COMPROBACIONES FALLIDAS`}\n`);
process.exit(failures === 0 ? 0 : 1);
