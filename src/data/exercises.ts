import type { Equipment, Exercise, MuscleGroup } from '@/domain/types';

function e(
  id: string,
  name: string,
  primary: MuscleGroup,
  equipment: Equipment,
  compound: boolean,
  secondary: MuscleGroup[] = [],
  aliases: string[] = [],
): Exercise {
  return { id, name, primary, equipment, compound, secondary, aliases };
}

export const EXERCISES: Exercise[] = [
  /* ------------------------------------------------------------- PECHO -- */
  e('press-banca', 'Press de banca', 'pecho', 'barra', true, ['triceps', 'hombro'], ['bench press', 'banca']),
  e('press-inclinado-barra', 'Press inclinado con barra', 'pecho', 'barra', true, ['hombro', 'triceps']),
  e('press-banca-mancuerna', 'Press de banca con mancuernas', 'pecho', 'mancuerna', true, ['triceps', 'hombro']),
  e('press-inclinado-mancuerna', 'Press inclinado con mancuernas', 'pecho', 'mancuerna', true, ['hombro', 'triceps']),
  e('press-declinado', 'Press declinado', 'pecho', 'barra', true, ['triceps']),
  e('aperturas-mancuerna', 'Aperturas con mancuernas', 'pecho', 'mancuerna', false, ['hombro']),
  e('cruce-poleas', 'Cruce de poleas', 'pecho', 'polea', false, [], ['cable fly', 'cruces']),
  e('press-maquina-pecho', 'Press de pecho en maquina', 'pecho', 'maquina', true, ['triceps']),
  e('pec-deck', 'Pec deck / Contractor', 'pecho', 'maquina', false, []),
  e('fondos-pecho', 'Fondos en paralelas', 'pecho', 'peso corporal', true, ['triceps', 'hombro'], ['dips']),
  e('flexiones', 'Flexiones', 'pecho', 'peso corporal', true, ['triceps', 'core'], ['push ups', 'lagartijas']),

  /* ----------------------------------------------------------- ESPALDA -- */
  e('dominadas', 'Dominadas', 'espalda', 'peso corporal', true, ['biceps'], ['pull ups', 'pull-ups']),
  e('jalon-pecho', 'Jalon al pecho', 'espalda', 'polea', true, ['biceps'], ['lat pulldown', 'polea alta']),
  e('remo-barra', 'Remo con barra', 'espalda', 'barra', true, ['biceps', 'femoral'], ['barbell row']),
  e('remo-mancuerna', 'Remo con mancuerna', 'espalda', 'mancuerna', true, ['biceps'], ['remo a una mano']),
  e('remo-polea', 'Remo en polea baja', 'espalda', 'polea', true, ['biceps'], ['seated row']),
  e('remo-t', 'Remo en T', 'espalda', 'maquina', true, ['biceps']),
  e('peso-muerto', 'Peso muerto', 'espalda', 'barra', true, ['femoral', 'gluteo', 'core'], ['deadlift']),
  e('peso-muerto-rumano', 'Peso muerto rumano', 'femoral', 'barra', true, ['gluteo', 'espalda'], ['rdl']),
  e('pullover', 'Pullover', 'espalda', 'mancuerna', false, ['pecho']),
  e('face-pull', 'Face pull', 'hombro', 'polea', false, ['espalda']),
  e('encogimiento', 'Encogimientos de hombro', 'espalda', 'mancuerna', false, [], ['shrugs', 'trapecio']),
  e('hiperextension', 'Hiperextensiones', 'espalda', 'peso corporal', false, ['gluteo', 'femoral']),

  /* ------------------------------------------------------------ HOMBRO -- */
  e('press-militar', 'Press militar', 'hombro', 'barra', true, ['triceps'], ['overhead press', 'ohp']),
  e('press-hombro-mancuerna', 'Press de hombro con mancuernas', 'hombro', 'mancuerna', true, ['triceps']),
  e('elevaciones-laterales', 'Elevaciones laterales', 'hombro', 'mancuerna', false, [], ['laterales']),
  e('elevaciones-frontales', 'Elevaciones frontales', 'hombro', 'mancuerna', false, []),
  e('pajaro', 'Pajaro / Deltoide posterior', 'hombro', 'mancuerna', false, ['espalda'], ['rear delt', 'posterior']),
  e('press-arnold', 'Press Arnold', 'hombro', 'mancuerna', true, ['triceps']),
  e('elevacion-polea-lateral', 'Elevacion lateral en polea', 'hombro', 'polea', false, []),

  /* ------------------------------------------------------------ BICEPS -- */
  e('curl-barra', 'Curl con barra', 'biceps', 'barra', false, ['antebrazo']),
  e('curl-mancuerna', 'Curl con mancuernas', 'biceps', 'mancuerna', false, ['antebrazo']),
  e('curl-martillo', 'Curl martillo', 'biceps', 'mancuerna', false, ['antebrazo'], ['hammer curl']),
  e('curl-predicador', 'Curl predicador', 'biceps', 'maquina', false, [], ['scott', 'preacher']),
  e('curl-inclinado', 'Curl inclinado', 'biceps', 'mancuerna', false, []),
  e('curl-polea', 'Curl en polea', 'biceps', 'polea', false, []),
  e('curl-concentrado', 'Curl concentrado', 'biceps', 'mancuerna', false, []),

  /* ----------------------------------------------------------- TRICEPS -- */
  e('press-frances', 'Press frances', 'triceps', 'barra', false, [], ['skull crusher', 'rompecraneos']),
  e('extension-polea', 'Extension de triceps en polea', 'triceps', 'polea', false, [], ['pushdown', 'jalon triceps']),
  e('extension-sobre-cabeza', 'Extension sobre la cabeza', 'triceps', 'mancuerna', false, []),
  e('fondos-banco', 'Fondos en banco', 'triceps', 'peso corporal', false, ['pecho'], ['bench dips']),
  e('press-cerrado', 'Press cerrado', 'triceps', 'barra', true, ['pecho'], ['close grip']),
  e('patada-triceps', 'Patada de triceps', 'triceps', 'mancuerna', false, [], ['kickback']),

  /* -------------------------------------------------------------- PIERNA */
  e('sentadilla', 'Sentadilla', 'cuadriceps', 'barra', true, ['gluteo', 'femoral', 'core'], ['squat', 'sentadillas']),
  e('sentadilla-frontal', 'Sentadilla frontal', 'cuadriceps', 'barra', true, ['gluteo', 'core'], ['front squat']),
  e('prensa', 'Prensa de piernas', 'cuadriceps', 'maquina', true, ['gluteo'], ['leg press']),
  e('hack-squat', 'Hack squat', 'cuadriceps', 'maquina', true, ['gluteo']),
  e('extension-cuadriceps', 'Extension de cuadriceps', 'cuadriceps', 'maquina', false, [], ['leg extension']),
  e('curl-femoral', 'Curl femoral tumbado', 'femoral', 'maquina', false, [], ['leg curl', 'femoral']),
  e('curl-femoral-sentado', 'Curl femoral sentado', 'femoral', 'maquina', false, []),
  e('zancadas', 'Zancadas', 'cuadriceps', 'mancuerna', true, ['gluteo'], ['lunges', 'estocadas']),
  e('bulgara', 'Sentadilla bulgara', 'cuadriceps', 'mancuerna', true, ['gluteo'], ['bulgarian split squat']),
  e('hip-thrust', 'Hip thrust', 'gluteo', 'barra', true, ['femoral'], ['empuje de cadera']),
  e('patada-gluteo', 'Patada de gluteo en polea', 'gluteo', 'polea', false, []),
  e('abduccion', 'Abduccion de cadera', 'gluteo', 'maquina', false, []),
  e('good-morning', 'Good morning', 'femoral', 'barra', true, ['gluteo', 'espalda']),
  e('gemelo-de-pie', 'Elevacion de gemelos de pie', 'gemelo', 'maquina', false, [], ['calf raise', 'pantorrilla']),
  e('gemelo-sentado', 'Elevacion de gemelos sentado', 'gemelo', 'maquina', false, []),
  e('peso-muerto-piernas-rigidas', 'Peso muerto piernas rigidas', 'femoral', 'barra', true, ['gluteo']),

  /* ---------------------------------------------------------------- CORE */
  e('plancha', 'Plancha', 'core', 'peso corporal', false, [], ['plank']),
  e('crunch-polea', 'Crunch en polea', 'core', 'polea', false, []),
  e('elevacion-piernas', 'Elevacion de piernas colgado', 'core', 'peso corporal', false, [], ['hanging leg raise']),
  e('abdominales', 'Abdominales', 'core', 'peso corporal', false, [], ['crunch', 'sit ups']),
  e('rueda-abdominal', 'Rueda abdominal', 'core', 'otro', false, [], ['ab wheel']),
  e('russian-twist', 'Russian twist', 'core', 'peso corporal', false, []),

  /* -------------------------------------------------------------- CARDIO */
  e('caminadora', 'Caminadora', 'cardio', 'maquina', false, [], ['treadmill', 'cinta', 'correr']),
  e('bicicleta', 'Bicicleta estatica', 'cardio', 'maquina', false, [], ['bici', 'spinning']),
  e('eliptica', 'Eliptica', 'cardio', 'maquina', false, []),
  e('remo-ergometro', 'Remo ergometro', 'cardio', 'maquina', false, ['espalda'], ['rower']),
  e('escaladora', 'Escaladora', 'cardio', 'maquina', false, ['gluteo'], ['stairmaster']),
  e('cuerda', 'Cuerda / Salto', 'cardio', 'otro', false, [], ['jump rope', 'saltar cuerda']),
];

export const EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map(EXERCISES.map((x) => [x.id, x]));

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro: 'Hombro',
  biceps: 'Biceps',
  triceps: 'Triceps',
  cuadriceps: 'Cuadriceps',
  femoral: 'Femoral',
  gluteo: 'Gluteo',
  gemelo: 'Gemelo',
  core: 'Core',
  antebrazo: 'Antebrazo',
  cardio: 'Cardio',
};

export const MUSCLE_ORDER: MuscleGroup[] = [
  'pecho', 'espalda', 'hombro', 'biceps', 'triceps',
  'cuadriceps', 'femoral', 'gluteo', 'gemelo', 'core', 'antebrazo', 'cardio',
];

/** Busqueda simple de ejercicios (el catalogo es pequeno: filtro directo). */
export function searchExercises(query: string, limit = 20): Exercise[] {
  const q = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!q) return EXERCISES.slice(0, limit);

  const scored: { ex: Exercise; score: number }[] = [];
  for (const ex of EXERCISES) {
    const name = ex.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (ex.aliases?.some((a) => a.includes(q))) score = 50;
    else if (MUSCLE_LABEL[ex.primary].toLowerCase().includes(q)) score = 30;
    if (score) scored.push({ ex, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.ex);
}
