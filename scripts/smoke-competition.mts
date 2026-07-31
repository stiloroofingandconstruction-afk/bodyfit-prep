/**
 * Pruebas de la suite de competencia.
 * Se ejecuta desde `smoke-test.mts`.
 */
import {
  countdown,
  daysBetween,
  phaseForWeeksOut,
  projectToShow,
  weightTrend,
  type CompetitionPrep,
} from '../src/domain/competition';
import { recommend } from '../src/domain/recommendations';
import { compareMetrics } from '../src/domain/weeklySummary';
import { cmToIn, inToCm, kgToLb, lbToKg, storeWeight, displayWeight } from '../src/domain/units';
import { runMigrations, checkinMigrations, profileMigrations } from '../src/store/migrations';
import { planDay, suggestComplement } from '../src/domain/autoMeal';
import { EXERCISES, EXERCISE_BY_ID, lumbarAlternativesFor, searchExercises } from '../src/data/exercises';
import { FOODS } from '../src/data/foods';
import { posesFor, POSES } from '../src/data/poses';
import { coachReport, toCSV, weightCSV } from '../src/services/exports';
import { makeUnits } from '../src/lib/useUnits';
import { DAY_TYPE_FACTOR } from '../src/domain/prepTypes';

export function runCompetitionTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  /* ───────────────────────────────────────────── fechas y fases ──────── */
  line('Fechas y fases del prep');

  check('daysBetween cuenta dias naturales', daysBetween('2026-01-01', '2026-01-31') === 30);
  check('daysBetween cruza meses', daysBetween('2026-02-25', '2026-03-05') === 8);
  check('daysBetween cruza anos', daysBetween('2025-12-25', '2026-01-05') === 11);
  check('daysBetween con anos bisiestos', daysBetween('2028-02-28', '2028-03-01') === 2, '2028 es bisiesto');

  check('20 semanas fuera -> preparacion inicial', phaseForWeeksOut(20).id === 'preparacion-inicial');
  check('12 semanas fuera -> perdida progresiva', phaseForWeeksOut(12).id === 'perdida-progresiva');
  check('6 semanas fuera -> fase avanzada', phaseForWeeksOut(6).id === 'fase-avanzada');
  check('3 semanas fuera -> ultimas cuatro', phaseForWeeksOut(3).id === 'ultimas-cuatro');
  check('1 semana fuera -> peak week', phaseForWeeksOut(1).id === 'peak-week');
  check('0 semanas -> dia del show', phaseForWeeksOut(0).id === 'dia-del-show');
  check('despues del show -> post-show', phaseForWeeksOut(-1).id === 'post-show');

  const prep: CompetitionPrep = {
    id: 'p1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    showName: 'Test Show',
    federation: 'NPC',
    division: "Men's Physique",
    category: 'Open',
    showDate: '2026-06-06',
    prepStartDate: '2026-01-05',
    startWeight: 90,
    targetWeight: 80,
    status: 'activo',
  };

  const cd = countdown(prep, '2026-03-06');
  console.log(`   ${cd.daysOut} dias · ${cd.weeksOut} semanas · fase "${cd.phase.label}" · ${cd.progressPct}%`);
  check('cuenta atras: dias correctos', cd.daysOut === 92, `${cd.daysOut}`);
  check('cuenta atras: progreso entre 0 y 100', cd.progressPct >= 0 && cd.progressPct <= 100);

  const cdShow = countdown(prep, '2026-06-06');
  check('el dia del show marca 0 dias', cdShow.daysOut === 0 && cdShow.phase.id === 'dia-del-show');

  const cdAfter = countdown(prep, '2026-06-10');
  check('tras el show pasa a post-show', cdAfter.isPast && cdAfter.phase.id === 'post-show');

  /* ───────────────────────────────────────────── media movil ─────────── */
  line('Media movil y tendencia de peso');

  // 21 dias bajando 100 g/dia desde 90 kg, con ruido de agua alternante
  const entries: { date: string; weight: number }[] = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(Date.UTC(2026, 2, 1 + i));
    const iso = d.toISOString().slice(0, 10);
    entries.push({ date: iso, weight: 90 - i * 0.1 + (i % 2 === 0 ? 0.4 : -0.4) });
  }
  const trend = weightTrend(entries, '2026-03-21');
  console.log(
    `   media 7d ${trend.avg7} · anterior ${trend.prevAvg7} · cambio ${trend.weekChange} · pendiente ${trend.slope14}`,
  );
  check('media de 7 dias calculada', trend.avg7 != null);
  check('tendencia fiable con 14 dias', trend.reliable, `${trend.daysLogged14} dias`);
  check(
    'el ruido de agua no altera la media (~-0.7 kg/sem)',
    trend.weekChange != null && Math.abs(trend.weekChange + 0.7) < 0.15,
    `${trend.weekChange}`,
  );
  check(
    'la pendiente coincide con el ritmo real',
    trend.slope14 != null && Math.abs(trend.slope14 + 0.7) < 0.2,
    `${trend.slope14}`,
  );

  const sparse = weightTrend(entries.slice(0, 4), '2026-03-21');
  check('con 4 dias no se considera fiable', !sparse.reliable);

  /* ───────────────────────────────────────────── proyeccion ──────────── */
  line('Proyeccion al show');

  const proj = projectToShow(prep, trend, '2026-03-21');
  console.log(`   ${proj.status}: proyectado ${proj.projectedWeight} kg (objetivo ${prep.targetWeight})`);
  check('proyecta un peso', proj.projectedWeight != null);
  check('calcula el ritmo necesario', proj.requiredWeekly != null);
  check('el estado es uno de los definidos', ['en-ritmo', 'ligeramente-fuera', 'fuera-de-ritmo'].includes(proj.status));

  const noData = projectToShow(prep, weightTrend([], '2026-03-21'), '2026-03-21');
  check('sin datos lo dice explicitamente', noData.status === 'sin-datos');

  /* ───────────────────────────────────────────── recomendaciones ─────── */
  line('Motor de recomendaciones');

  const base = {
    trend,
    projection: proj,
    adherence: 95,
    energy: 4,
    sleep: 4,
    hunger: 2,
    stress: 2,
    strength: 4,
    cardioMinutes: 120,
    workouts: 5,
    currentKcal: 2400,
    weeksOut: 12,
  };

  const lowAdherence = recommend({ ...base, adherence: 55 });
  check(
    'adherencia baja bloquea cualquier cambio',
    lowAdherence.action === 'mejorar-adherencia' && lowAdherence.kcalDelta === 0,
  );

  const noData2 = recommend({ ...base, trend: weightTrend(entries.slice(0, 3), '2026-03-21') });
  check('datos insuficientes -> mantener sin cambios', noData2.action === 'mantener' && noData2.kcalDelta === 0);

  const fatigued = recommend({ ...base, energy: 1, sleep: 2, strength: 2 });
  check('tres senales de fatiga -> recuperacion', fatigued.action === 'recuperacion');
  check('recuperacion nunca recorta calorias', fatigued.kcalDelta >= 0);

  // Estancado: peso plano
  const flat: { date: string; weight: number }[] = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(Date.UTC(2026, 2, 1 + i));
    flat.push({ date: d.toISOString().slice(0, 10), weight: 85 + (i % 2 === 0 ? 0.2 : -0.2) });
  }
  const flatTrend = weightTrend(flat, '2026-03-21');
  const stalled = recommend({ ...base, trend: flatTrend });
  console.log(`   estancado -> ${stalled.action} (${stalled.kcalDelta} kcal, ${stalled.cardioMinutesDelta} min)`);
  check(
    'estancado -> recorta calorias o sube cardio',
    ['reducir-calorias', 'aumentar-cardio'].includes(stalled.action),
  );
  check('el recorte nunca supera 150 kcal', Math.abs(stalled.kcalDelta) <= 150, `${stalled.kcalDelta}`);

  // Demasiado rapido: -1.5% semanal
  const fast: { date: string; weight: number }[] = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(Date.UTC(2026, 2, 1 + i));
    fast.push({ date: d.toISOString().slice(0, 10), weight: 85 - i * 0.2 });
  }
  const fastRec = recommend({ ...base, trend: weightTrend(fast, '2026-03-21') });
  console.log(`   demasiado rapido -> ${fastRec.action} (${fastRec.kcalDelta} kcal)`);
  check('bajada demasiado rapida -> subir calorias', fastRec.action === 'aumentar-calorias');
  check('la subida nunca supera 200 kcal', fastRec.kcalDelta <= 200);

  check('toda recomendacion incluye los datos usados', base && recommend(base).dataUsed.length >= 5);
  check('toda recomendacion incluye razonamiento', recommend(base).reasoning.length >= 2);

  /* ───────────────────────────────────────────── resumen semanal ─────── */
  line('Resumen semanal');

  const summary = compareMetrics([
    { key: 'w', label: 'Peso', current: 84, previous: 85, higherIsBetter: false, threshold: 0.2, unit: ' kg' },
    { key: 'c', label: 'Cintura', current: 82, previous: 83, higherIsBetter: false, threshold: 0.5, unit: ' cm' },
    { key: 'e', label: 'Energia', current: 2, previous: 4, higherIsBetter: true, threshold: 0.4 },
    { key: 's', label: 'Sueno', current: 3, previous: 3, higherIsBetter: true, threshold: 0.4 },
    { key: 'x', label: 'Pasos', current: null, previous: 8000, higherIsBetter: true, threshold: 500 },
  ]);
  check('clasifica las mejoras', summary.improved.length === 2, summary.improved.map((m) => m.label).join(', '));
  check('clasifica los empeoramientos', summary.worsened.length === 1, summary.worsened.map((m) => m.label).join(', '));
  check('clasifica lo estable', summary.stable.length === 1);
  check('marca lo que no tiene datos', summary.missing.length === 1);
  check('genera un titular', summary.headline.length > 10, summary.headline);

  /* ───────────────────────────────────────────── unidades ────────────── */
  line('Conversion de unidades');

  check('100 kg = 220.46 lb', Math.abs(kgToLb(100) - 220.462) < 0.01, `${kgToLb(100).toFixed(3)}`);
  check('220.462 lb = 100 kg', Math.abs(lbToKg(220.462) - 100) < 0.01);
  check('ida y vuelta kg->lb->kg es exacta', Math.abs(lbToKg(kgToLb(83.4)) - 83.4) < 1e-9);
  check('100 cm = 39.37 in', Math.abs(cmToIn(100) - 39.370) < 0.01, `${cmToIn(100).toFixed(3)}`);
  check('ida y vuelta cm->in->cm es exacta', Math.abs(inToCm(cmToIn(92.5)) - 92.5) < 1e-9);
  check('storeWeight normaliza a kg', Math.abs(storeWeight(200, 'lb') - 90.718) < 0.01);
  check('displayWeight respeta kg', displayWeight(80, 'kg') === 80);

  /* ───────────────────────────────────────────── migraciones ─────────── */
  line('Migraciones de almacenamiento');

  const oldProfile = { profile: { name: 'Ana', heightCm: 165 } };
  const migrated = runMigrations(oldProfile, 1, profileMigrations) as {
    profile: Record<string, unknown>;
  };
  check('la migracion conserva los datos previos', migrated.profile.name === 'Ana');
  check('la migracion anade los campos nuevos', migrated.profile.units === 'metric');
  check('la migracion anade restricciones', Array.isArray(migrated.profile.restrictions));

  const oldCheckins = { checkins: [{ weekStart: '2026-01-05', avgWeight: 88 }] };
  const migratedCheckins = runMigrations(oldCheckins, 1, checkinMigrations) as {
    checkins: Record<string, unknown>[];
  };
  check('los check-ins antiguos conservan su peso', migratedCheckins.checkins[0].avgWeight === 88);
  check('los check-ins reciben los campos nuevos', migratedCheckins.checkins[0].digestion === 3);

  const broken = runMigrations({ a: 1 }, 1, {
    1: () => {
      throw new Error('fallo simulado');
    },
  });
  check('una migracion que falla no rompe el estado', (broken as { a: number }).a === 1);

  /* ───────────────────────────────────────────── planear el dia ──────── */
  line('Planear mi dia');

  const dayTarget = { kcal: 2400, protein: 180, carbs: 250, fat: 70, fiber: 30 };
  const day = planDay(dayTarget, { catalog: FOODS, meals: 4, carbAroundTraining: 0.2 });
  for (const m of day) {
    console.log(
      `   ${m.label}: ${m.result.portions.map((p) => `${p.food.name} ${p.grams}${p.food.unit}`).join(' · ')}`,
    );
  }
  check('genera las 4 comidas pedidas', day.length === 4, `${day.length}`);

  const dayTotals = day.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.result.total.kcal,
      protein: acc.protein + m.result.total.protein,
      carbs: acc.carbs + m.result.total.carbs,
      fat: acc.fat + m.result.total.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  console.log(
    `   total: ${Math.round(dayTotals.kcal)} kcal, P ${dayTotals.protein.toFixed(0)}, C ${dayTotals.carbs.toFixed(0)}, G ${dayTotals.fat.toFixed(0)}`,
  );
  check(
    'la proteina del dia queda dentro de +/-15 g',
    Math.abs(dayTotals.protein - dayTarget.protein) <= 15,
    `${dayTotals.protein.toFixed(0)} vs ${dayTarget.protein}`,
  );
  check(
    'las calorias del dia quedan dentro del 10%',
    Math.abs(dayTotals.kcal - dayTarget.kcal) / dayTarget.kcal <= 0.1,
    `${Math.round(dayTotals.kcal)} vs ${dayTarget.kcal}`,
  );
  check('no repite alimentos entre comidas', (() => {
    const ids = day.flatMap((m) => m.result.portions.map((p) => p.food.id));
    return new Set(ids).size === ids.length;
  })());

  const comp = suggestComplement({ kcal: 500, protein: 60, carbs: 40, fat: 5, fiber: 5 }, dayTarget, FOODS);
  check('detecta el macro mas deficitario', comp != null, comp ? `${comp.macro}: ${comp.food.name}` : '');

  /* ───────────────────────────────────────────── tipos de dia ────────── */
  line('Refeeds y tipos de dia');

  check('el refeed sube calorias', DAY_TYPE_FACTOR.refeed > 1);
  check('el diet break sube calorias', DAY_TYPE_FACTOR['diet-break'] > 1);
  check('el dia de descanso baja calorias', DAY_TYPE_FACTOR.descanso < 1);
  check('el dia bajo baja calorias', DAY_TYPE_FACTOR.bajo < 1);
  check(
    'ningun factor es extremo (0.85–1.3)',
    Object.values(DAY_TYPE_FACTOR).every((f) => f >= 0.85 && f <= 1.3),
  );

  /* ───────────────────────────────────────────── ejercicios ──────────── */
  line('Biblioteca de ejercicios');

  console.log(`   ${EXERCISES.length} ejercicios`);
  check('mas de 80 ejercicios', EXERCISES.length >= 80, `${EXERCISES.length}`);
  check('sin ids duplicados', new Set(EXERCISES.map((e) => e.id)).size === EXERCISES.length);
  check('todos tienen guia de tecnica completa', EXERCISES.every((e) =>
    e.technique.setup.length > 0 &&
    e.technique.execution.length > 0 &&
    e.technique.breathing.length > 0 &&
    e.technique.tempo.length > 0 &&
    e.technique.commonMistakes.length > 0 &&
    e.technique.safety.length > 0,
  ));
  check('todos declaran carga lumbar', EXERCISES.every((e) => !!e.lumbarLoad));
  check('todos declaran dificultad y patron', EXERCISES.every((e) => !!e.difficulty && !!e.pattern));

  const brokenRefs = EXERCISES.flatMap((e) =>
    [...e.substitutions, ...e.regressions, ...e.progressions, ...(e.lumbarSafeAlternatives ?? [])]
      .filter((id) => !EXERCISE_BY_ID.has(id))
      .map((id) => `${e.id} -> ${id}`),
  );
  check('todas las referencias entre ejercicios existen', brokenRefs.length === 0, brokenRefs.join(', '));

  const highLumbar = EXERCISES.filter((e) => e.lumbarLoad === 'alto');
  console.log(`   ${highLumbar.length} ejercicios de carga lumbar alta`);
  check('los de carga lumbar alta ofrecen alternativas', highLumbar.every((e) => lumbarAlternativesFor(e).length > 0));
  check('hay ejercicios etiquetados como lumbar-amable', EXERCISES.some((e) => e.tags.includes('lumbar-amable')));

  const groups = ['pecho', 'espalda', 'hombro', 'biceps', 'triceps', 'cuadriceps', 'femoral', 'gluteo', 'gemelo', 'core', 'cardio'];
  const missingGroups = groups.filter((g) => !EXERCISES.some((e) => e.primary === g));
  check('todos los grupos musculares tienen ejercicios', missingGroups.length === 0, missingGroups.join(', '));
  check('hay ejercicios de movilidad', EXERCISES.some((e) => e.pattern === 'movilidad'));
  check('hay ejercicios de calentamiento', EXERCISES.some((e) => e.tags.includes('calentamiento')));

  check('busca "sentadilla"', searchExercises('sentadilla', 3).some((e) => e.id === 'sentadilla'));
  check('busca por alias en ingles', searchExercises('deadlift', 3).some((e) => e.id === 'peso-muerto'));
  check('busca por etiqueta', searchExercises('lumbar-amable', 10).length > 0);

  /* ───────────────────────────────────────────── posing ──────────────── */
  line('Posing');

  check('hay poses definidas', POSES.length >= 12, `${POSES.length}`);
  for (const div of ["Men's Physique", 'Classic Physique', 'Bodybuilding', 'Bikini', 'Wellness', 'Figure'] as const) {
    check(`${div} tiene poses`, posesFor(div).length > 0, `${posesFor(div).length}`);
  }
  check('todas las poses tienen indicaciones', POSES.every((p) => p.cues.length > 0));
  check('todas las poses tienen tiempo de mantenimiento', POSES.every((p) => p.holdSeconds > 0));

  /* ───────────────────────────────────────────── exportaciones ───────── */
  line('Exportaciones');

  const csv = toCSV(['a', 'b'], [['x,y', 'z"w'], [1, 2]]);
  check('el CSV escapa comas', csv.includes('"x,y"'));
  check('el CSV escapa comillas', csv.includes('"z""w"'));
  check('el CSV lleva BOM para Excel', csv.charCodeAt(0) === 0xfeff);

  const units = makeUnits('kg', 'cm');
  const wcsv = weightCSV(
    [{ id: '1', createdAt: '', updatedAt: '', date: '2026-03-01', weight: 85.2, weighTime: '07:00' }],
    [{ id: '2', createdAt: '', updatedAt: '', date: '2026-03-02', weight: 85.0, waist: 82 }],
    units,
  );
  check('el CSV de peso incluye la cabecera', wcsv.includes('fecha,peso_kg,hora'));
  check('el CSV de peso incluye ambas fuentes', wcsv.includes('2026-03-01') && wcsv.includes('2026-03-02'));

  const report = coachReport({
    athleteName: 'Test',
    showName: 'Show',
    daysOut: 60,
    phase: 'Perdida progresiva',
    weekStart: '2026-03-16',
    avgWeight: 85.2,
    prevAvgWeight: 85.9,
    weekChange: -0.7,
    weekPct: -0.8,
    targets: { kcal: 2400, protein: 180, carbs: 250, fat: 70 },
    adherence: 92,
    cardioMinutes: 150,
    avgSteps: 11000,
    workouts: 5,
    posingMinutes: 60,
    sleep: 4,
    energy: 4,
    hunger: 3,
    stress: 2,
    strength: 4,
    measurements: [{ label: 'Cintura', value: 82 }],
    photos: 4,
    units,
  });
  check('el informe incluye el peso medio', report.includes('85.2'));
  check('el informe incluye la adherencia', report.includes('92%'));
  check('el informe incluye la fase', report.includes('Perdida progresiva'));
  check('el informe avisa de que los datos son locales', report.toLowerCase().includes('localmente'));
}
