/**
 * Pruebas de unidades, tecnica individual, video y traducciones.
 * Se ejecuta desde `smoke-test.mts`.
 */
import { makeUnits } from '../src/lib/useUnits';
import { cmToIn, inToCm, kgToLb, lbToKg } from '@bodyfit/domain/units';
import {
  exportMedia,
  hasErrors,
  hasPlayable,
  importMedia,
  parseYouTubeId,
  validateMedia,
} from '@bodyfit/domain/media';
import { AUTHORED_IDS, EXERCISES, EXERCISE_BY_ID } from '../src/data/exercises';
import { es } from '../src/i18n/es';
import { en } from '../src/i18n/en';
import { checkinsCSV, coachReport, weightCSV, workoutsCSV } from '../src/services/exports';
import { runMigrations, profileMigrations, checkinMigrations } from '../src/store/migrations';
import type { ExerciseMedia } from '@bodyfit/domain/types';

export function runUnitsTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  /* ─────────────────────────────────────── conversion de unidades ────── */
  line('Capa de unidades: conversion');

  const metric = makeUnits('kg', 'cm');
  const imperial = makeUnits('lb', 'in');

  check('etiquetas metricas', metric.w === 'kg' && metric.l === 'cm' && metric.d === 'km');
  check('etiquetas imperiales', imperial.w === 'lb' && imperial.l === 'in' && imperial.d === 'mi');

  check('metrico no altera el peso', metric.toDisplayWeight(82.4) === 82.4);
  check('metrico no altera la longitud', metric.toDisplayLength(92.5) === 92.5);

  check(
    '82.4 kg se muestran como 181.7 lb',
    Math.abs(imperial.toDisplayWeight(82.4) - 181.66) < 0.02,
    imperial.numWeight(82.4),
  );
  check(
    '92.5 cm se muestran como 36.42 in',
    Math.abs(imperial.toDisplayLength(92.5) - 36.417) < 0.01,
    imperial.numLength(92.5),
  );

  /* ─────────────────────────────────────── entrada y salida ──────────── */
  line('Capa de unidades: entrada y salida');

  check(
    'lo que escribe el usuario en lb vuelve a kg',
    Math.abs(imperial.toCanonicalWeight(181.66) - 82.4) < 0.01,
  );
  check(
    'lo que escribe el usuario en in vuelve a cm',
    Math.abs(imperial.toCanonicalLength(36.417) - 92.5) < 0.01,
  );

  // Sin error acumulativo: 50 idas y vueltas no deben degradar el valor
  let value = 83.7;
  for (let i = 0; i < 50; i++) {
    value = imperial.toCanonicalWeight(imperial.toDisplayWeight(value));
  }
  check(
    '50 conversiones de ida y vuelta no degradan el dato',
    Math.abs(value - 83.7) < 1e-9,
    `${value}`,
  );

  let len = 101.3;
  for (let i = 0; i < 50; i++) {
    len = imperial.toCanonicalLength(imperial.toDisplayLength(len));
  }
  check('lo mismo con longitudes', Math.abs(len - 101.3) < 1e-9, `${len}`);

  /* ─────────────────────────────────────── formato y decimales ───────── */
  line('Capa de unidades: formato');

  check('fmtWeight en kg', metric.fmtWeight(82.44) === '82.4 kg', metric.fmtWeight(82.44));
  check('fmtWeight en lb', imperial.fmtWeight(82.4) === '181.7 lb', imperial.fmtWeight(82.4));
  check('fmtLength en cm', metric.fmtLength(92.5) === '92.5 cm', metric.fmtLength(92.5));
  check('fmtLength en in usa 2 decimales', imperial.fmtLength(92.5) === '36.42 in', imperial.fmtLength(92.5));

  check('delta positivo lleva signo', metric.fmtWeightDelta(0.7) === '+0.7 kg', metric.fmtWeightDelta(0.7));
  check('delta negativo lleva signo', metric.fmtWeightDelta(-0.7) === '-0.7 kg', metric.fmtWeightDelta(-0.7));
  check('cero no se muestra como -0.0', metric.fmtWeightDelta(-0.001) === '0.0 kg', metric.fmtWeightDelta(-0.001));

  check('paso natural en kg', metric.weightStep === 0.1);
  check('paso natural en lb', imperial.weightStep === 0.2);
  check('rango de peso en kg', metric.weightRange.min === 30 && metric.weightRange.max === 300);
  check('rango de peso en lb', imperial.weightRange.min === 66 && imperial.weightRange.max === 660);

  /* ─────────────────────────────────────── ratios por peso ───────────── */
  line('Capa de unidades: ratios g/kg y g/lb');

  check('en metrico el ratio no cambia', metric.toDisplayPerWeight(2) === 2);
  check('etiqueta del ratio en metrico', metric.perW === 'g/kg');
  check('etiqueta del ratio en imperial', imperial.perW === 'g/lb');
  check(
    '2 g/kg equivalen a 0.91 g/lb',
    Math.abs(imperial.toDisplayPerWeight(2) - 0.907) < 0.01,
    imperial.toDisplayPerWeight(2).toFixed(3),
  );
  check(
    'el ratio vuelve intacto a g/kg',
    Math.abs(imperial.toCanonicalPerWeight(imperial.toDisplayPerWeight(2.2)) - 2.2) < 1e-9,
  );

  /* ─────────────────────────────────────── distancia ─────────────────── */
  line('Capa de unidades: distancia');

  check('5 km son 3.11 mi', Math.abs(imperial.toDisplayDistance(5) - 3.107) < 0.01);
  check('la distancia vuelve intacta', Math.abs(imperial.toCanonicalDistance(imperial.toDisplayDistance(7.3)) - 7.3) < 1e-9);
  check('fmtDistance en metrico', metric.fmtDistance(5) === '5.0 km', metric.fmtDistance(5));

  /* ───────────────────────── cambio de preferencia con datos previos ─── */
  line('Cambio de preferencia sobre datos existentes');

  // El dato guardado no cambia: cambia solo lo que se muestra
  const storedKg = 84.2;
  const shownMetric = metric.numWeight(storedKg);
  const shownImperial = imperial.numWeight(storedKg);
  check('el mismo dato se muestra distinto segun la preferencia', shownMetric !== shownImperial, `${shownMetric} vs ${shownImperial}`);
  check('el dato canonico no se toca', storedKg === 84.2);
  check(
    'ambas representaciones describen el mismo peso',
    Math.abs(lbToKg(Number(shownImperial)) - Number(shownMetric)) < 0.05,
  );

  /* ─────────────────────────────────────── graficas ──────────────────── */
  line('Unidades en graficas');

  const series = [
    { date: '2026-03-01', value: 85 },
    { date: '2026-03-08', value: 84.2 },
    { date: '2026-03-15', value: 83.5 },
  ];
  const converted = series.map((p) => ({ ...p, value: imperial.toDisplayWeight(p.value) }));
  check('la grafica convierte todos los puntos', converted.every((p, i) => Math.abs(p.value - kgToLb(series[i].value)) < 1e-9));
  check('la grafica conserva las fechas', converted.every((p, i) => p.date === series[i].date));
  check(
    'la tendencia se mantiene tras convertir',
    converted[0].value > converted[2].value === series[0].value > series[2].value,
  );

  /* ─────────────────────────────────────── exportaciones ─────────────── */
  line('Unidades en exportaciones');

  const readiness = [
    { id: '1', createdAt: '', updatedAt: '', date: '2026-03-01', weight: 85.2, weighTime: '07:00' },
  ];
  const measurements = [
    { id: '2', createdAt: '', updatedAt: '', date: '2026-03-02', weight: 85.0, waist: 82.5 },
  ];

  const csvKg = weightCSV(readiness, measurements, metric);
  const csvLb = weightCSV(readiness, measurements, imperial);

  check('la cabecera del CSV declara kg y cm', csvKg.includes('peso_kg') && csvKg.includes('cintura_cm'));
  check('la cabecera del CSV declara lb e in', csvLb.includes('peso_lb') && csvLb.includes('cintura_in'));
  check('el valor del CSV va convertido', csvLb.includes('187.8'), csvLb.split('\n')[1]);
  check('el CSV metrico mantiene el valor', csvKg.includes('85.2'));

  const workouts = [
    {
      id: 'w', createdAt: '', updatedAt: '', date: '2026-03-01', name: 'Push', startedAt: '',
      exercises: [
        {
          id: 'e', exerciseId: 'press-banca', exerciseName: 'Press de banca',
          sets: [{ id: 's', weight: 100, reps: 5, done: true, type: 'normal' as const }],
        },
      ],
    },
  ];
  const wKg = workoutsCSV(workouts, metric);
  const wLb = workoutsCSV(workouts, imperial);
  check('el CSV de entrenos declara la unidad', wKg.includes('peso_kg') && wLb.includes('peso_lb'));
  check('100 kg se exportan como 220.5 lb', wLb.includes('220.5'), wLb.split('\n')[1]);

  const checkins = [
    {
      id: 'c', createdAt: '', updatedAt: '', weekStart: '2026-03-02', avgWeight: 85,
      weightChange: -0.7, waist: 82, adherence: 92, energy: 4, sleep: 4, hunger: 3, stress: 2,
      workoutsCompleted: 5,
    },
  ];
  check(
    'el CSV de check-ins declara la unidad',
    checkinsCSV(checkins, imperial).includes('peso_medio_lb'),
  );

  const reportInput = {
    athleteName: 'Test', weekStart: '2026-03-16',
    avgWeight: 85.2, prevAvgWeight: 85.9, weekChange: -0.7, weekPct: -0.8,
    targets: { kcal: 2400, protein: 180, carbs: 250, fat: 70 },
    adherence: 92, cardioMinutes: 150, avgSteps: 11000, workouts: 5, posingMinutes: 60,
    sleep: 4, energy: 4, hunger: 3, stress: 2, strength: 4,
    measurements: [{ label: 'Cintura', value: 82 }], photos: 4,
  };
  const repKg = coachReport({ ...reportInput, units: metric });
  const repLb = coachReport({ ...reportInput, units: imperial });
  check('el informe metrico usa kg', repKg.includes('85.2 kg'));
  check('el informe imperial usa lb', repLb.includes('lb') && !repLb.includes('85.2 kg'));
  check('las medidas del informe siguen la unidad', repLb.includes('in') && repKg.includes('82.0 cm'));

  /* ─────────────────────────────────────── migraciones ───────────────── */
  line('Migracion de datos existentes');

  const legacy = {
    profile: { name: 'Ana', heightCm: 165, startWeight: 62.5, proteinPerKg: 2 },
  };
  const migrated = runMigrations(legacy, 1, profileMigrations) as { profile: Record<string, unknown> };
  check('la migracion conserva el peso guardado en kg', migrated.profile.startWeight === 62.5);
  check('la migracion conserva la altura en cm', migrated.profile.heightCm === 165);
  check('la migracion conserva el ratio en g/kg', migrated.profile.proteinPerKg === 2);
  check('la migracion anade unidades por defecto', migrated.profile.units === 'metric');

  const legacyCheckins = runMigrations(
    { checkins: [{ weekStart: '2026-01-05', avgWeight: 88, waist: 90 }] },
    1,
    checkinMigrations,
  ) as { checkins: Record<string, unknown>[] };
  check('los check-ins antiguos conservan sus medidas', legacyCheckins.checkins[0].waist === 90);

  /* ─────────────────────────────── tecnica individual ────────────────── */
  line('Tecnica escrita individualmente');

  const REQUIRED = [
    'press-banca', 'press-inclinado-mancuerna', 'press-maquina-pecho', 'cruce-poleas', 'fondos-pecho',
    'jalon-pecho', 'dominadas', 'remo-barra', 'remo-mancuerna', 'remo-polea', 'pullover-polea',
    'press-militar', 'press-hombro-mancuerna', 'elevaciones-laterales', 'pajaro', 'face-pull',
    'curl-barra', 'curl-inclinado', 'curl-martillo', 'curl-predicador', 'curl-polea',
    'extension-polea', 'press-frances', 'extension-sobre-cabeza', 'fondos-banco',
    'sentadilla', 'prensa', 'hack-squat', 'extension-cuadriceps', 'peso-muerto-rumano',
    'curl-femoral-sentado', 'curl-femoral', 'hip-thrust', 'bulgara', 'zancadas', 'gemelo-de-pie',
    'dead-bug', 'bird-dog', 'pallof-press', 'plancha', 'plancha-lateral', 'mcgill-curl-up',
    'hip-hinge-drill', 'puente-gluteo',
  ];

  console.log(`   ${AUTHORED_IDS.size} ejercicios con guia escrita a mano`);
  const missing = REQUIRED.filter((id) => !AUTHORED_IDS.has(id));
  check('todos los ejercicios pedidos tienen guia individual', missing.length === 0, missing.join(', '));

  const unknown = [...AUTHORED_IDS].filter((id) => !EXERCISE_BY_ID.has(id));
  check('ninguna guia apunta a un ejercicio inexistente', unknown.length === 0, unknown.join(', '));

  const authored = [...AUTHORED_IDS].map((id) => EXERCISE_BY_ID.get(id)!);
  check(
    'todas las guias individuales estan marcadas como authored',
    authored.every((e) => e.technique.authored === true),
  );
  const incomplete = authored.filter(
    (e) =>
      !(
        e.technique.summary.length > 20 &&
        e.technique.startPosition.length >= 2 &&
        e.technique.warningSigns.length >= 2 &&
        e.technique.warnings.length >= 1
      ),
  );
  check(
    'todas tienen resumen, posicion inicial, senales y advertencias',
    incomplete.length === 0,
    incomplete.map((e) => e.id).join(', '),
  );
  check(
    'todas tienen ejecucion detallada (3+ pasos)',
    authored.every((e) => e.technique.execution.length >= 3),
  );
  check(
    'todas tienen errores comunes y consejos de hipertrofia',
    authored.every((e) => e.technique.commonMistakes.length >= 2 && e.technique.hypertrophy.length >= 1),
  );

  // El contenido debe ser distinto entre ejercicios, no plantilla repetida
  const summaries = authored.map((e) => e.technique.summary);
  check(
    'ningun resumen se repite entre ejercicios',
    new Set(summaries).size === summaries.length,
    `${new Set(summaries).size}/${summaries.length}`,
  );
  const executions = authored.map((e) => e.technique.execution.join('|'));
  check(
    'ninguna ejecucion se repite entre ejercicios',
    new Set(executions).size === executions.length,
  );

  /* ─────────────────────────────── seguridad lumbar ──────────────────── */
  line('Seguridad lumbar');

  const risky = EXERCISES.filter((e) => e.lumbarLoad !== 'bajo');
  console.log(`   ${risky.length} ejercicios con carga lumbar moderada o alta`);
  check('todos los de riesgo declaran alternativas', risky.every((e) => {
    const alts = e.lumbarSafeAlternatives ?? [];
    return alts.length > 0 || EXERCISES.some((o) => o.primary === e.primary && o.lumbarLoad === 'bajo');
  }));

  const riskyAuthored = risky.filter((e) => e.technique.authored);
  check(
    'las guias individuales de riesgo explican como adaptarlo',
    riskyAuthored.every((e) => !!e.technique.lumbarAdaptation),
    riskyAuthored.filter((e) => !e.technique.lumbarAdaptation).map((e) => e.id).join(', '),
  );
  check(
    'las alternativas lumbares apuntan a ejercicios reales',
    EXERCISES.every((e) => (e.lumbarSafeAlternatives ?? []).every((id) => EXERCISE_BY_ID.has(id))),
  );
  check('existen los ejercicios de core lumbar-seguro', EXERCISE_BY_ID.has('mcgill-curl-up') && EXERCISE_BY_ID.has('hip-hinge-drill'));

  /* ─────────────────────────────── sistema de video ──────────────────── */
  line('Sistema de video');

  check('detecta id de youtu.be', parseYouTubeId('https://youtu.be/dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  check('detecta id de watch?v=', parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  check('detecta id de shorts', parseYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  check('acepta el id suelto', parseYouTubeId('dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  check('rechaza lo que no es youtube', parseYouTubeId('https://example.com/video') === null);

  const httpMedia: ExerciseMedia = { videoUrl: 'http://ejemplo.com/v.mp4' };
  check('rechaza http sin cifrar', hasErrors(validateMedia(httpMedia)));

  const badExt: ExerciseMedia = { videoUrl: 'https://ejemplo.com/pagina', verified: true, source: 'x' };
  const badExtIssues = validateMedia(badExt);
  check('avisa si la URL no parece un archivo de video', badExtIssues.some((i) => i.severity === 'aviso'));
  check('pero no lo bloquea', !hasErrors(badExtIssues));

  const goodMedia: ExerciseMedia = {
    videoUrl: 'https://ejemplo.com/press.mp4',
    source: 'Grabado por mi',
    license: 'Propio',
    reviewedAt: '2026-07-31',
    verified: true,
    durationSeconds: 45,
  };
  check('acepta una configuracion completa', validateMedia(goodMedia).length === 0);
  check('detecta que hay algo reproducible', hasPlayable(goodMedia));
  check('sin fuente ni verificacion, avisa', validateMedia({ videoUrl: 'https://x.com/a.mp4' }).length === 2);
  check('duracion fuera de rango es error', hasErrors(validateMedia({ ...goodMedia, durationSeconds: 99999 })));
  check('id de youtube invalido es error', hasErrors(validateMedia({ youtubeId: 'corto' })));
  check('sin nada configurado no hay problemas', validateMedia({}).length === 0);

  /* importacion y exportacion */
  const bundle = exportMedia({ 'press-banca': goodMedia }, '2026-07-31T00:00:00.000Z');
  const parsed = JSON.parse(bundle) as { kind: string; media: Record<string, ExerciseMedia> };
  check('la exportacion se identifica', parsed.kind === 'exercise-media');
  check('la exportacion incluye la media', parsed.media['press-banca'].videoUrl === goodMedia.videoUrl);

  const known = new Set(EXERCISE_BY_ID.keys());
  const imported = importMedia(bundle, known);
  check('la importacion recupera la configuracion', imported.imported === 1);

  const dirty = JSON.stringify({
    media: {
      'press-banca': goodMedia,
      'ejercicio-que-no-existe': goodMedia,
      sentadilla: { videoUrl: 'http://inseguro.com/v.mp4' },
    },
  });
  const dirtyResult = importMedia(dirty, known);
  check('la importacion descarta ids desconocidos', dirtyResult.skipped.some((s) => s.id === 'ejercicio-que-no-existe'));
  check('la importacion descarta URLs invalidas', dirtyResult.skipped.some((s) => s.id === 'sentadilla'));
  check('y conserva lo valido', dirtyResult.imported === 1);

  /* ─────────────────────────────── traducciones ──────────────────────── */
  line('Traducciones');

  const esKeys = Object.keys(es);
  const enKeys = Object.keys(en);
  console.log(`   ${esKeys.length} claves en espanol, ${enKeys.length} en ingles`);

  const missingInEn = esKeys.filter((k) => !(k in en));
  check('el ingles cubre todas las claves declaradas', missingInEn.length === 0, missingInEn.join(', '));

  const extraInEn = enKeys.filter((k) => !(k in es));
  check('el ingles no tiene claves huerfanas', extraInEn.length === 0, extraInEn.join(', '));

  const emptyEs = esKeys.filter((k) => !String((es as Record<string, string>)[k]).trim());
  check('ninguna clave espanola esta vacia', emptyEs.length === 0, emptyEs.join(', '));

  const emptyEn = enKeys.filter((k) => !String((en as Record<string, string>)[k] ?? '').trim());
  check('ninguna clave inglesa esta vacia', emptyEn.length === 0, emptyEn.join(', '));

  /*
   * Una cadena identica en ambos idiomas no siempre es un olvido: hay plantillas
   * que solo colocan valores ("{n} min · {division}") y terminos tecnicos que no
   * se traducen ("Service worker", "Peak week"). Se ignoran quitando primero los
   * marcadores y quedandose con las letras que de verdad habria que traducir.
   */
  const TECHNICAL = /^(peak week|post\-show|prep|posing|liss|service worker|bodyfit prep|youtube|indexeddb)$/i;
  const untranslated = esKeys.filter((k) => {
    const value = (es as Record<string, string>)[k];
    if (value !== (en as Record<string, string>)[k]) return false;
    const words = value.replace(/\{[^}]*\}/g, ' ').replace(/[^\p{L} ]+/gu, ' ').trim();
    if (words.length <= 12) return false;
    return !TECHNICAL.test(words);
  });
  check(
    'los textos largos estan realmente traducidos',
    untranslated.length === 0,
    untranslated.slice(0, 3).join(', '),
  );

  // La interpolacion debe conservarse en ambos idiomas
  const withVars = esKeys.filter((k) => /\{\w+\}/.test((es as Record<string, string>)[k]));
  check(
    'las claves con variables las conservan en ingles',
    withVars.every((k) => /\{\w+\}/.test((en as Record<string, string>)[k] ?? '')),
    withVars.join(', '),
  );
}
