/**
 * Auditoria de contenido de la biblioteca de ejercicios.
 *
 * No comprueba que el texto sea "bueno" — eso no lo puede hacer una maquina —
 * pero si detecta lo que suele fallar cuando se escribe contenido a escala:
 * campos vacios, texto duplicado entre ejercicios, contradicciones basicas,
 * lenguaje medico o absoluto, y guias tan genericas que no dicen nada.
 */
import { AUTHORED_IDS, EXERCISES, EXERCISE_BY_ID, lumbarAlternativesFor } from '../src/data/exercises';
import type { Exercise } from '@bodyfit/domain/types';

/** Frases que no deben aparecer: prometen resultados o suenan a diagnostico. */
const FORBIDDEN_CLAIMS: [RegExp, string][] = [
  [/\bcura\b|\bcurar\b|\bcuran\b/i, 'promete curar'],
  [/\bprevien[e|en]\b.*\blesion/i, 'promete prevenir lesiones'],
  [/\bgarantiza\b|\bgarantizado\b/i, 'garantiza un resultado'],
  [/\bsiempre funciona\b|\bnunca falla\b/i, 'afirmacion absoluta'],
  [/\bdiagnostic/i, 'lenguaje de diagnostico'],
  [/\btrata\b.*\bhernia\b|\btratamiento\b/i, 'sugiere tratamiento'],
  [/\bel mejor ejercicio del mundo\b|\bel unico ejercicio\b/i, 'superlativo absoluto'],
  [/\bdebes\b.*\bsiempre\b.*\bsin excepcion\b/i, 'imperativo absoluto'],
];

/** Muletillas que indican que la guia no se escribio para ese ejercicio. */
const GENERIC_PHRASES = [
  'Coloca la articulacion que trabaja alineada con el eje',
  'Inicia el movimiento sin impulso',
  'Estabiliza el resto del cuerpo',
  'Busca una posicion comoda y estable antes de empezar',
];

export function runContentTests(
  check: (name: string, ok: boolean, detail?: string) => void,
  line: (t: string) => void,
): void {
  line('Contenido: cobertura e integridad');

  console.log(`   ${AUTHORED_IDS.size} de ${EXERCISES.length} ejercicios con guia individual`);
  check(
    'todos los ejercicios tienen guia escrita individualmente',
    AUTHORED_IDS.size === EXERCISES.length,
    `faltan: ${EXERCISES.filter((e) => !AUTHORED_IDS.has(e.id)).map((e) => e.id).join(', ')}`,
  );

  /* ── campos vacios ─────────────────────────────────────────────────── */
  const TEXT_FIELDS: (keyof Exercise['technique'])[] = ['summary', 'breathing', 'rangeOfMotion', 'tempo'];
  const LIST_FIELDS: (keyof Exercise['technique'])[] = [
    'setup', 'startPosition', 'execution', 'commonMistakes',
    'warningSigns', 'safety', 'hypertrophy', 'strength', 'warnings', 'contraindications',
  ];

  const emptyText: string[] = [];
  const emptyList: string[] = [];
  for (const ex of EXERCISES) {
    for (const f of TEXT_FIELDS) {
      const v = ex.technique[f];
      // El tempo usa notacion compacta ("3-0-1-0"): 5 caracteres ya es completo
      const min = f === 'tempo' ? 5 : 8;
      if (typeof v !== 'string' || v.trim().length < min) emptyText.push(`${ex.id}.${String(f)}`);
    }
    for (const f of LIST_FIELDS) {
      const v = ex.technique[f];
      if (!Array.isArray(v) || v.length === 0 || v.some((s) => !s || s.trim().length < 10)) {
        emptyList.push(`${ex.id}.${String(f)}`);
      }
    }
  }
  check('ningun campo de texto vacio o demasiado corto', emptyText.length === 0, emptyText.slice(0, 5).join(', '));
  check('ninguna lista vacia o con entradas triviales', emptyList.length === 0, emptyList.slice(0, 5).join(', '));

  /* ── duplicados entre ejercicios ───────────────────────────────────── */
  line('Contenido: originalidad');

  const dupCheck = (field: 'summary' | 'breathing' | 'rangeOfMotion', label: string) => {
    const seen = new Map<string, string[]>();
    for (const ex of EXERCISES) {
      const value = String(ex.technique[field]).trim().toLowerCase();
      // "No aplica" es una respuesta legitima y repetible
      if (/^no aplica/.test(value)) continue;
      const list = seen.get(value) ?? [];
      list.push(ex.id);
      seen.set(value, list);
    }
    const dups = [...seen.entries()].filter(([, ids]) => ids.length > 1);
    check(
      `${label} sin duplicados entre ejercicios`,
      dups.length === 0,
      dups.slice(0, 3).map(([, ids]) => ids.join('=')).join(' | '),
    );
  };

  dupCheck('summary', 'resumen');
  dupCheck('breathing', 'respiracion');
  dupCheck('rangeOfMotion', 'rango de movimiento');

  const execs = new Map<string, string[]>();
  for (const ex of EXERCISES) {
    const key = ex.technique.execution.join('|').toLowerCase();
    const list = execs.get(key) ?? [];
    list.push(ex.id);
    execs.set(key, list);
  }
  const dupExec = [...execs.entries()].filter(([, ids]) => ids.length > 1);
  check(
    'ejecucion sin duplicados entre ejercicios',
    dupExec.length === 0,
    dupExec.slice(0, 3).map(([, ids]) => ids.join('=')).join(' | '),
  );

  /* ── genericidad ───────────────────────────────────────────────────── */
  const generic = EXERCISES.filter((ex) => {
    const all = [
      ex.technique.summary,
      ...ex.technique.setup,
      ...ex.technique.startPosition,
      ...ex.technique.execution,
    ].join(' ');
    return GENERIC_PHRASES.some((p) => all.includes(p));
  });
  check(
    'ninguna guia usa frases de plantilla generica',
    generic.length === 0,
    generic.map((e) => e.id).join(', '),
  );

  // Un resumen util menciona algo del propio ejercicio, no solo generalidades
  const shortSummary = EXERCISES.filter((e) => e.technique.summary.length < 45);
  check(
    'todos los resumenes tienen sustancia (45+ caracteres)',
    shortSummary.length === 0,
    shortSummary.map((e) => e.id).join(', '),
  );

  const thinExecution = EXERCISES.filter((e) => e.technique.execution.length < 3);
  check(
    'toda ejecucion tiene al menos 3 pasos',
    thinExecution.length === 0,
    thinExecution.map((e) => e.id).join(', '),
  );

  /* ── lenguaje medico y absoluto ────────────────────────────────────── */
  line('Contenido: lenguaje seguro');

  const offenders: string[] = [];
  for (const ex of EXERCISES) {
    const all = [
      ex.technique.summary,
      ex.technique.breathing,
      ex.technique.rangeOfMotion,
      ...ex.technique.setup,
      ...ex.technique.startPosition,
      ...ex.technique.execution,
      ...ex.technique.commonMistakes,
      ...ex.technique.warningSigns,
      ...ex.technique.safety,
      ...ex.technique.hypertrophy,
      ...ex.technique.strength,
      ...ex.technique.warnings,
      ...ex.technique.contraindications,
      ex.technique.lumbarAdaptation ?? '',
    ].join(' ');
    for (const [re, why] of FORBIDDEN_CLAIMS) {
      if (re.test(all)) offenders.push(`${ex.id}: ${why}`);
    }
  }
  check('sin afirmaciones medicas ni absolutas', offenders.length === 0, offenders.slice(0, 5).join(' | '));

  // Las contraindicaciones deben remitir a un profesional cuando son serias
  const seriousNoReferral = EXERCISES.filter((ex) => {
    const text = ex.technique.contraindications.join(' ').toLowerCase();
    const serious = /hernia|dolor lumbar activo|luxacion|sintomas cardiovasculares|tendinitis/.test(text);
    const refers = /profesional|sanitario|medic/.test(text);
    return serious && !refers;
  });
  check(
    'las contraindicaciones serias remiten a un profesional',
    seriousNoReferral.length === 0,
    seriousNoReferral.map((e) => e.id).join(', '),
  );

  /* ── coherencia interna ────────────────────────────────────────────── */
  line('Contenido: coherencia');

  // Un ejercicio de aislamiento no deberia recomendar series de fuerza maxima
  const isoStrength = EXERCISES.filter(
    (e) =>
      e.pattern === 'aislamiento' &&
      e.technique.strength.some((s) => /\b[1-5]\s*[-–]\s*[1-6]\s*repeticiones/.test(s)),
  );
  check(
    'los ejercicios de aislamiento no prescriben series de fuerza maxima',
    isoStrength.length === 0,
    isoStrength.map((e) => e.id).join(', '),
  );

  /*
   * Cardio y movilidad no persiguen hipertrofia: deben decirlo. En fuerza, el
   * cardio tampoco aplica, pero la movilidad SI puede dar guia util (como
   * consolidar el rango ganado), asi que ahi no se exige "no aplica".
   */
  const cardioMobility = EXERCISES.filter((e) => e.pattern === 'cardio' || e.pattern === 'movilidad');
  const wrongHyper = cardioMobility.filter(
    (e) => !/no aplica/i.test(e.technique.hypertrophy.join(' ')),
  );
  check(
    'cardio y movilidad declaran que la hipertrofia no aplica',
    wrongHyper.length === 0,
    wrongHyper.map((e) => e.id).join(', '),
  );

  const cardioStrength = EXERCISES.filter(
    (e) => e.pattern === 'cardio' && !/no aplica/i.test(e.technique.strength.join(' ')),
  );
  check(
    'el cardio declara que la fuerza no aplica',
    cardioStrength.length === 0,
    cardioStrength.map((e) => e.id).join(', '),
  );

  // El tempo debe tener forma reconocible
  const badTempo = EXERCISES.filter(
    (e) => !/\d/.test(e.technique.tempo) && !/constante|continuo|distancia|mantenimiento/i.test(e.technique.tempo),
  );
  check('todo tempo es interpretable', badTempo.length === 0, badTempo.map((e) => e.id).join(', '));

  // La respiracion no puede recomendar aguantar el aire en isometricos de core
  const badBreathing = EXERCISES.filter(
    (e) =>
      (e.pattern === 'core-antiextension' || e.pattern === 'core-antirotacion') &&
      /aguanta el aire|manten el aire/i.test(e.technique.breathing),
  );
  check(
    'los ejercicios de core no recomiendan aguantar el aire',
    badBreathing.length === 0,
    badBreathing.map((e) => e.id).join(', '),
  );

  /* ── seguridad lumbar ──────────────────────────────────────────────── */
  line('Contenido: seguridad lumbar');

  const risky = EXERCISES.filter((e) => e.lumbarLoad !== 'bajo');
  console.log(`   ${risky.length} ejercicios con demanda lumbar moderada o alta`);

  const noAdaptation = risky.filter((e) => !e.technique.lumbarAdaptation);
  check(
    'todo ejercicio con demanda lumbar explica como adaptarlo',
    noAdaptation.length === 0,
    noAdaptation.map((e) => e.id).join(', '),
  );

  const noAlternatives = risky.filter((e) => lumbarAlternativesFor(e).length === 0);
  check(
    'todo ejercicio con demanda lumbar ofrece alternativas reales',
    noAlternatives.length === 0,
    noAlternatives.map((e) => e.id).join(', '),
  );

  // La adaptacion debe proponer algo concreto, no un consejo vago
  const vagueAdaptation = risky.filter(
    (e) => (e.technique.lumbarAdaptation ?? '').length < 60,
  );
  check(
    'las adaptaciones lumbares son concretas, no genericas',
    vagueAdaptation.length === 0,
    vagueAdaptation.map((e) => e.id).join(', '),
  );

  // Los de carga alta deben avisarlo tambien en warnings
  const highNoWarning = EXERCISES.filter(
    (e) => e.lumbarLoad === 'alto' && !/lumbar/i.test(e.technique.warnings.join(' ')),
  );
  check(
    'los de carga lumbar alta lo advierten explicitamente',
    highNoWarning.length === 0,
    highNoWarning.map((e) => e.id).join(', '),
  );

  /* ── referencias cruzadas ──────────────────────────────────────────── */
  line('Contenido: referencias entre ejercicios');

  const broken = EXERCISES.flatMap((e) =>
    [...e.substitutions, ...e.regressions, ...e.progressions, ...(e.lumbarSafeAlternatives ?? [])]
      .filter((id) => !EXERCISE_BY_ID.has(id))
      .map((id) => `${e.id} -> ${id}`),
  );
  check('todas las referencias apuntan a ejercicios existentes', broken.length === 0, broken.join(', '));

  const selfRef = EXERCISES.filter((e) =>
    [...e.substitutions, ...e.regressions, ...e.progressions].includes(e.id),
  );
  check('ningun ejercicio se referencia a si mismo', selfRef.length === 0, selfRef.map((e) => e.id).join(', '));

  // Una alternativa lumbar no puede tener mas carga lumbar que el original
  const worseAlt = EXERCISES.flatMap((e) =>
    (e.lumbarSafeAlternatives ?? [])
      .map((id) => EXERCISE_BY_ID.get(id))
      .filter((alt): alt is Exercise => !!alt)
      .filter((alt) => rank(alt.lumbarLoad) >= rank(e.lumbarLoad))
      .map((alt) => `${e.id} -> ${alt.id}`),
  );
  check(
    'las alternativas lumbares cargan menos que el original',
    worseAlt.length === 0,
    worseAlt.join(', '),
  );

  // Una regresion no deberia ser mas dificil que el ejercicio original
  const badRegression = EXERCISES.flatMap((e) =>
    e.regressions
      .map((id) => EXERCISE_BY_ID.get(id))
      .filter((r): r is Exercise => !!r)
      .filter((r) => diff(r.difficulty) > diff(e.difficulty))
      .map((r) => `${e.id} -> ${r.id}`),
  );
  check('ninguna regresion es mas dificil que el original', badRegression.length === 0, badRegression.join(', '));

  const badProgression = EXERCISES.flatMap((e) =>
    e.progressions
      .map((id) => EXERCISE_BY_ID.get(id))
      .filter((p): p is Exercise => !!p)
      .filter((p) => diff(p.difficulty) < diff(e.difficulty))
      .map((p) => `${e.id} -> ${p.id}`),
  );
  check('ninguna progresion es mas facil que el original', badProgression.length === 0, badProgression.join(', '));
}

function rank(load: 'bajo' | 'moderado' | 'alto'): number {
  return load === 'bajo' ? 0 : load === 'moderado' ? 1 : 2;
}

function diff(d: 'principiante' | 'intermedio' | 'avanzado'): number {
  return d === 'principiante' ? 0 : d === 'intermedio' ? 1 : 2;
}
