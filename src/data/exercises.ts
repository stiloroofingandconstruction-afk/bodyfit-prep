/**
 * Biblioteca de ejercicios.
 *
 * Cada entrada declara sus metadatos y, opcionalmente, sobrescribe partes de la
 * guia de tecnica. Lo que no se sobrescribe lo rellena la plantilla del patron
 * de movimiento (`techniqueTemplates.ts`), de modo que TODOS los ejercicios
 * tienen instrucciones completas y utiles.
 *
 * Contenido redactado para esta aplicacion. Sin material de terceros.
 */
import type {
  Difficulty,
  Equipment,
  Exercise,
  ExerciseTechnique,
  LumbarLoad,
  MovementPattern,
  MuscleGroup,
} from '@/domain/types';
import { templateFor } from './techniqueTemplates';

interface Opts {
  secondary?: MuscleGroup[];
  aliases?: string[];
  difficulty?: Difficulty;
  lumbar?: LumbarLoad;
  subs?: string[];
  reg?: string[];
  prog?: string[];
  lumbarSafe?: string[];
  tags?: string[];
  unilateral?: boolean;
  /** Sobrescribe partes de la guia generada por la plantilla. */
  tech?: Partial<ExerciseTechnique>;
}

type Base = Omit<Exercise, 'technique'>;

const raw: Base[] = [];
const OVERRIDES: Record<string, Partial<ExerciseTechnique> | undefined> = {};

function e(
  id: string,
  name: string,
  primary: MuscleGroup,
  equipment: Equipment,
  compound: boolean,
  pattern: MovementPattern,
  o: Opts = {},
): void {
  raw.push({
    id,
    name,
    primary,
    equipment,
    compound,
    pattern,
    aliases: o.aliases ?? [],
    secondary: o.secondary ?? [],
    difficulty: o.difficulty ?? 'intermedio',
    lumbarLoad: o.lumbar ?? 'bajo',
    substitutions: o.subs ?? [],
    regressions: o.reg ?? [],
    progressions: o.prog ?? [],
    ...(o.lumbarSafe ? { lumbarSafeAlternatives: o.lumbarSafe } : {}),
    ...(o.unilateral ? { unilateral: true } : {}),
    tags: o.tags ?? [],
  });
  OVERRIDES[id] = o.tech;
}

/* ═══════════════════════════════════════════════════════════════ PECHO ══ */

e('press-banca', 'Press de banca', 'pecho', 'barra', true, 'empuje-horizontal', {
  secondary: ['triceps', 'hombro'],
  aliases: ['bench press', 'banca', 'press plano'],
  subs: ['press-banca-mancuerna', 'press-maquina-pecho'],
  reg: ['press-maquina-pecho', 'flexiones'],
  prog: ['press-banca-pausa'],
  tags: ['basico', 'fuerza', 'powerlifting'],
  tech: {
    setup: [
      'Tumbate con los ojos bajo la barra y los pies planos en el suelo.',
      'Junta las escapulas y deprimelas: el pecho sube y el hombro queda protegido.',
      'Agarre entre 1.4 y 1.6 veces la anchura de hombros, munecas rectas sobre los antebrazos.',
      'Crea un arco natural en la lumbar sin despegar los gluteos del banco.',
    ],
    execution: [
      'Saca la barra del soporte y llevala sobre la linea de los hombros.',
      'Baja controlado hacia la parte baja del pecho con los codos a unos 45–70 grados del torso.',
      'Toca el pecho sin rebotar y sin perder la tension.',
      'Empuja empujando el suelo con los pies y llevando la barra en diagonal hacia los hombros.',
    ],
    commonMistakes: [
      'Abrir los codos a 90 grados: es la causa mas comun de molestia de hombro.',
      'Despegar los gluteos del banco para mover mas peso.',
      'Rebotar la barra en el pecho.',
      'Perder la retraccion escapular en las ultimas repeticiones.',
    ],
    safety: [
      'Trabaja siempre con seguros a la altura del pecho o con un companero.',
      'No uses agarre con el pulgar suelto: la barra puede resbalar.',
    ],
    hypertrophy: [
      '6–12 repeticiones dejando 1–3 en reserva.',
      'Baja en 2–3 segundos: la fase excentrica controlada es donde mas crece el pectoral.',
    ],
    strength: [
      '3–6 repeticiones al 80–90% con descansos de 3–5 minutos.',
      'Manten la misma ejecucion en todas las series, tambien en las ligeras.',
    ],
  },
});

e('press-inclinado-barra', 'Press inclinado con barra', 'pecho', 'barra', true, 'empuje-horizontal', {
  secondary: ['hombro', 'triceps'],
  aliases: ['incline press'],
  subs: ['press-inclinado-mancuerna'],
  reg: ['press-maquina-pecho'],
  tags: ['pectoral-superior'],
  tech: {
    setup: [
      'Banco entre 30 y 45 grados: mas inclinacion pasa el trabajo al hombro.',
      'Escapulas juntas y pies firmes en el suelo.',
    ],
  },
});

e('press-banca-mancuerna', 'Press de banca con mancuernas', 'pecho', 'mancuerna', true, 'empuje-horizontal', {
  secondary: ['triceps', 'hombro'],
  aliases: ['dumbbell press'],
  subs: ['press-banca', 'press-maquina-pecho'],
  reg: ['press-maquina-pecho'],
  tags: ['basico', 'articulacion-amable'],
  tech: {
    safety: [
      'Sube las mancuernas apoyandolas en los muslos y empujando con las piernas.',
      'Al terminar, bajalas a los muslos antes de incorporarte: no las sueltes desde arriba.',
      'Permiten mas rango que la barra y suelen ser mas amables con el hombro.',
    ],
  },
});

e('press-inclinado-mancuerna', 'Press inclinado con mancuernas', 'pecho', 'mancuerna', true, 'empuje-horizontal', {
  secondary: ['hombro', 'triceps'],
  subs: ['press-inclinado-barra'],
  tags: ['pectoral-superior', 'articulacion-amable'],
});

e('press-declinado', 'Press declinado', 'pecho', 'barra', true, 'empuje-horizontal', {
  secondary: ['triceps'],
  subs: ['fondos-pecho'],
  tags: ['pectoral-inferior'],
});

e('press-banca-pausa', 'Press de banca con pausa', 'pecho', 'barra', true, 'empuje-horizontal', {
  secondary: ['triceps', 'hombro'],
  difficulty: 'avanzado',
  aliases: ['paused bench'],
  subs: ['press-banca'],
  reg: ['press-banca'],
  tags: ['fuerza', 'powerlifting'],
  tech: {
    execution: [
      'Baja controlado hasta el pecho.',
      'Manten la barra apoyada sin perder tension durante 1–2 segundos completos.',
      'Empuja de forma explosiva desde parado, sin rebote.',
    ],
    tempo: '3-2-1-0 (pausa real de 2 segundos)',
  },
});

e('aperturas-mancuerna', 'Aperturas con mancuernas', 'pecho', 'mancuerna', false, 'aislamiento', {
  secondary: ['hombro'],
  aliases: ['flyes', 'aperturas'],
  subs: ['cruce-poleas', 'pec-deck'],
  tags: ['estiramiento'],
  tech: {
    safety: [
      'Manten siempre un codo ligeramente flexionado y fijo.',
      'No bajes por debajo de la linea del banco: es donde el hombro queda mas expuesto.',
    ],
  },
});

e('cruce-poleas', 'Cruce de poleas', 'pecho', 'polea', false, 'aislamiento', {
  aliases: ['cable fly', 'cruces'],
  subs: ['pec-deck', 'aperturas-mancuerna'],
  tags: ['tension-constante'],
});

e('press-maquina-pecho', 'Press de pecho en maquina', 'pecho', 'maquina', true, 'empuje-horizontal', {
  secondary: ['triceps'],
  difficulty: 'principiante',
  subs: ['press-banca-mancuerna'],
  prog: ['press-banca'],
  tags: ['principiante', 'seguro'],
});

e('pec-deck', 'Pec deck / Contractor', 'pecho', 'maquina', false, 'aislamiento', {
  difficulty: 'principiante',
  subs: ['cruce-poleas'],
  tags: ['principiante'],
});

e('fondos-pecho', 'Fondos en paralelas', 'pecho', 'peso corporal', true, 'empuje-horizontal', {
  secondary: ['triceps', 'hombro'],
  difficulty: 'avanzado',
  aliases: ['dips', 'fondos'],
  subs: ['press-declinado'],
  reg: ['fondos-banco', 'flexiones'],
  tags: ['peso-corporal'],
  tech: {
    execution: [
      'Inclina ligeramente el torso hacia delante para enfatizar el pectoral.',
      'Baja hasta que el hombro quede a la altura del codo.',
      'Sube sin bloquear el codo de golpe.',
    ],
    safety: [
      'No bajes mas alla de la horizontal del hombro: aumenta mucho el estres articular.',
      'Si notas pinzamiento, reduce el rango o cambia a press declinado.',
    ],
  },
});

e('flexiones', 'Flexiones', 'pecho', 'peso corporal', true, 'empuje-horizontal', {
  secondary: ['triceps', 'core'],
  difficulty: 'principiante',
  aliases: ['push ups', 'lagartijas', 'pushup'],
  subs: ['press-maquina-pecho'],
  prog: ['flexiones-declinadas', 'fondos-pecho'],
  tags: ['peso-corporal', 'calentamiento', 'sin-equipo'],
  tech: {
    setup: [
      'Manos algo mas anchas que los hombros, dedos hacia delante.',
      'Cuerpo en linea recta desde la cabeza hasta los talones.',
      'Aprieta gluteos y abdomen: evita que la cadera caiga.',
    ],
  },
});

e('flexiones-declinadas', 'Flexiones declinadas', 'pecho', 'peso corporal', true, 'empuje-horizontal', {
  secondary: ['hombro', 'triceps'],
  aliases: ['decline push up'],
  reg: ['flexiones'],
  tags: ['peso-corporal', 'sin-equipo'],
});

/* ═════════════════════════════════════════════════════════════ ESPALDA ══ */

e('dominadas', 'Dominadas', 'espalda', 'peso corporal', true, 'traccion-vertical', {
  secondary: ['biceps'],
  difficulty: 'avanzado',
  aliases: ['pull ups', 'pull-ups', 'dominada'],
  subs: ['jalon-pecho'],
  reg: ['jalon-pecho', 'dominadas-asistidas'],
  prog: ['dominadas-lastradas'],
  tags: ['peso-corporal', 'basico'],
  tech: {
    setup: [
      'Agarre pronado algo mas ancho que los hombros.',
      'Antes de tirar, baja los hombros: sal de la posicion de colgado pasivo.',
    ],
    execution: [
      'Inicia el movimiento bajando las escapulas.',
      'Tira llevando los codos hacia las costillas hasta pasar la barbilla.',
      'Baja controlado hasta extension completa sin dejarte caer.',
    ],
  },
});

e('dominadas-asistidas', 'Dominadas asistidas', 'espalda', 'maquina', true, 'traccion-vertical', {
  secondary: ['biceps'],
  difficulty: 'principiante',
  aliases: ['assisted pull up'],
  prog: ['dominadas'],
  tags: ['principiante'],
});

e('dominadas-lastradas', 'Dominadas lastradas', 'espalda', 'peso corporal', true, 'traccion-vertical', {
  secondary: ['biceps'],
  difficulty: 'avanzado',
  reg: ['dominadas'],
  tags: ['fuerza'],
});

e('jalon-pecho', 'Jalon al pecho', 'espalda', 'polea', true, 'traccion-vertical', {
  secondary: ['biceps'],
  difficulty: 'principiante',
  aliases: ['lat pulldown', 'polea alta', 'jalon'],
  subs: ['dominadas'],
  prog: ['dominadas'],
  tags: ['principiante', 'seguro'],
  tech: {
    safety: ['Nunca lleves la barra por detras de la nuca: exige rotacion externa extrema.'],
  },
});

e('remo-barra', 'Remo con barra', 'espalda', 'barra', true, 'traccion-horizontal', {
  secondary: ['biceps', 'femoral'],
  aliases: ['barbell row', 'remo pendlay'],
  lumbar: 'alto',
  subs: ['remo-polea', 'remo-t'],
  reg: ['remo-pecho-apoyado', 'remo-polea'],
  lumbarSafe: ['remo-pecho-apoyado', 'remo-polea', 'remo-t'],
  tags: ['basico', 'grosor'],
  tech: {
    setup: [
      'Bisagra de cadera hasta unos 45 grados con la espalda perfectamente neutra.',
      'Rodillas ligeramente flexionadas, peso en el medio del pie.',
      'Toma aire y aprieta el abdomen antes de cada repeticion.',
    ],
    safety: [
      'Mantener el torso inclinado bajo carga exige mucho a los erectores lumbares.',
      'Si notas la zona baja de la espalda antes que la espalda alta, cambia a remo con pecho apoyado.',
      'Deja el peso en el suelo entre series en lugar de aguantar la posicion.',
    ],
    contraindications: [
      'Sensibilidad o dolor lumbar: usa la version con pecho apoyado o en polea.',
    ],
  },
});

e('remo-pecho-apoyado', 'Remo con pecho apoyado', 'espalda', 'mancuerna', true, 'traccion-horizontal', {
  secondary: ['biceps'],
  difficulty: 'principiante',
  aliases: ['chest supported row', 'remo banco inclinado'],
  subs: ['remo-polea', 'remo-t'],
  tags: ['lumbar-amable', 'seguro'],
  tech: {
    setup: [
      'Banco inclinado a unos 30–45 grados, pecho apoyado en el respaldo.',
      'El apoyo elimina practicamente la carga sobre la zona lumbar.',
    ],
    safety: [
      'Es la alternativa de referencia al remo con barra cuando hay sensibilidad lumbar.',
    ],
  },
});

e('remo-mancuerna', 'Remo con mancuerna', 'espalda', 'mancuerna', true, 'traccion-horizontal', {
  secondary: ['biceps'],
  aliases: ['remo a una mano', 'one arm row'],
  unilateral: true,
  lumbar: 'moderado',
  subs: ['remo-polea'],
  lumbarSafe: ['remo-pecho-apoyado'],
  tags: ['unilateral'],
});

e('remo-polea', 'Remo en polea baja', 'espalda', 'polea', true, 'traccion-horizontal', {
  secondary: ['biceps'],
  difficulty: 'principiante',
  aliases: ['seated row', 'remo sentado'],
  subs: ['remo-t', 'remo-pecho-apoyado'],
  lumbarSafe: ['remo-pecho-apoyado'],
  tags: ['principiante', 'tension-constante'],
  tech: {
    safety: [
      'No acompanes el peso redondeando la espalda al estirar: deja que viaje la escapula, no la columna.',
    ],
  },
});

e('remo-t', 'Remo en T', 'espalda', 'maquina', true, 'traccion-horizontal', {
  secondary: ['biceps'],
  lumbar: 'moderado',
  subs: ['remo-barra'],
  lumbarSafe: ['remo-pecho-apoyado'],
  tags: ['grosor'],
});

e('peso-muerto', 'Peso muerto', 'espalda', 'barra', true, 'bisagra', {
  secondary: ['femoral', 'gluteo', 'core'],
  difficulty: 'avanzado',
  aliases: ['deadlift', 'muerto'],
  lumbar: 'alto',
  subs: ['peso-muerto-rumano', 'hip-thrust'],
  reg: ['peso-muerto-trap-bar', 'hip-thrust'],
  lumbarSafe: ['hip-thrust', 'curl-femoral', 'peso-muerto-trap-bar'],
  tags: ['basico', 'fuerza', 'powerlifting'],
  tech: {
    setup: [
      'Barra sobre el medio del pie, pies a la anchura de la cadera.',
      'Agarra la barra con los brazos verticales, justo por fuera de las piernas.',
      'Baja la cadera hasta que las espinillas toquen la barra sin perder la espalda neutra.',
      'Saca el aire, vuelve a llenar el abdomen y aprietalo como si fueras a recibir un golpe.',
    ],
    execution: [
      'Empuja el suelo con las piernas manteniendo la barra pegada al cuerpo.',
      'Cadera y pecho suben al mismo ritmo.',
      'Termina de pie apretando gluteos, sin echarte hacia atras.',
      'Baja llevando primero la cadera atras y luego doblando rodillas.',
    ],
    commonMistakes: [
      'Que la cadera suba antes que el pecho: deja toda la carga en la espalda.',
      'Separar la barra del cuerpo.',
      'Hiperextender la espalda al final.',
      'Redondear la zona lumbar en la fase inicial.',
    ],
    safety: [
      'Es el ejercicio que mas exige a la columna del catalogo: la tecnica no es negociable.',
      'Con sensibilidad lumbar, la trap bar reduce mucho el momento sobre la espalda.',
      'No busques repeticiones al fallo con este patron.',
    ],
    contraindications: [
      'Dolor lumbar agudo o hernia sintomatica: consulta con un profesional cualificado antes de cargar este patron.',
    ],
  },
});

e('peso-muerto-trap-bar', 'Peso muerto con trap bar', 'espalda', 'barra', true, 'bisagra', {
  secondary: ['cuadriceps', 'gluteo', 'femoral'],
  aliases: ['trap bar deadlift', 'barra hexagonal'],
  lumbar: 'moderado',
  subs: ['peso-muerto'],
  tags: ['lumbar-amable', 'fuerza'],
  tech: {
    safety: [
      'Al quedar dentro de la barra, la carga cae mas cerca del centro de gravedad y la zona lumbar trabaja bastante menos que en el peso muerto convencional.',
    ],
  },
});

e('peso-muerto-rumano', 'Peso muerto rumano', 'femoral', 'barra', true, 'bisagra', {
  secondary: ['gluteo', 'espalda'],
  aliases: ['rdl', 'romanian deadlift'],
  lumbar: 'alto',
  subs: ['peso-muerto-piernas-rigidas', 'curl-femoral'],
  reg: ['hip-thrust', 'curl-femoral'],
  lumbarSafe: ['curl-femoral', 'curl-femoral-sentado', 'hip-thrust'],
  tags: ['cadena-posterior', 'estiramiento'],
});

e('pullover', 'Pullover', 'espalda', 'mancuerna', false, 'aislamiento', {
  secondary: ['pecho'],
  subs: ['pullover-polea'],
  tags: ['estiramiento'],
});

e('pullover-polea', 'Pullover en polea', 'espalda', 'polea', false, 'aislamiento', {
  aliases: ['straight arm pulldown'],
  subs: ['pullover'],
  tags: ['tension-constante'],
});

e('face-pull', 'Face pull', 'hombro', 'polea', false, 'traccion-horizontal', {
  secondary: ['espalda'],
  difficulty: 'principiante',
  subs: ['pajaro'],
  tags: ['salud-hombro', 'calentamiento'],
  tech: {
    execution: [
      'Tira de la cuerda hacia la frente separando las manos.',
      'Termina con los antebrazos verticales y las escapulas juntas.',
      'Vuelve controlado.',
    ],
    hypertrophy: ['15–20 repeticiones. Es trabajo de salud articular, no de carga maxima.'],
  },
});

e('encogimiento', 'Encogimientos de hombro', 'espalda', 'mancuerna', false, 'aislamiento', {
  aliases: ['shrugs', 'trapecio'],
  difficulty: 'principiante',
  tags: ['trapecio'],
});

e('hiperextension', 'Hiperextensiones', 'espalda', 'peso corporal', false, 'bisagra', {
  secondary: ['gluteo', 'femoral'],
  aliases: ['back extension', 'banco romano'],
  lumbar: 'moderado',
  subs: ['hip-thrust'],
  tags: ['cadena-posterior'],
  tech: {
    safety: [
      'Sube solo hasta la linea del cuerpo: no hiperextiendas la espalda al final.',
      'Si el objetivo es gluteo e isquios, redondea ligeramente la parte alta y empuja con la cadera.',
    ],
  },
});

/* ══════════════════════════════════════════════════════════════ HOMBRO ══ */

e('press-militar', 'Press militar', 'hombro', 'barra', true, 'empuje-vertical', {
  secondary: ['triceps', 'core'],
  aliases: ['overhead press', 'ohp', 'press hombro'],
  lumbar: 'moderado',
  subs: ['press-hombro-mancuerna', 'press-maquina-hombro'],
  reg: ['press-hombro-sentado'],
  lumbarSafe: ['press-hombro-sentado', 'press-maquina-hombro'],
  tags: ['basico', 'fuerza'],
  tech: {
    safety: [
      'De pie, la version estricta exige mucho al core y a la lumbar si arqueas.',
      'Aprieta gluteos y manten las costillas abajo. Si arqueas, cambia a la version sentado con respaldo.',
    ],
  },
});

e('press-hombro-sentado', 'Press de hombro sentado', 'hombro', 'mancuerna', true, 'empuje-vertical', {
  secondary: ['triceps'],
  difficulty: 'principiante',
  subs: ['press-maquina-hombro'],
  tags: ['lumbar-amable', 'seguro'],
});

e('press-hombro-mancuerna', 'Press de hombro con mancuernas', 'hombro', 'mancuerna', true, 'empuje-vertical', {
  secondary: ['triceps'],
  subs: ['press-militar', 'press-hombro-sentado'],
  tags: ['articulacion-amable'],
});

e('press-maquina-hombro', 'Press de hombro en maquina', 'hombro', 'maquina', true, 'empuje-vertical', {
  secondary: ['triceps'],
  difficulty: 'principiante',
  tags: ['principiante', 'lumbar-amable'],
});

e('press-arnold', 'Press Arnold', 'hombro', 'mancuerna', true, 'empuje-vertical', {
  secondary: ['triceps'],
  subs: ['press-hombro-mancuerna'],
  tags: ['variante'],
});

e('elevaciones-laterales', 'Elevaciones laterales', 'hombro', 'mancuerna', false, 'aislamiento', {
  aliases: ['laterales', 'lateral raise'],
  difficulty: 'principiante',
  subs: ['elevacion-polea-lateral'],
  tags: ['deltoide-medio', 'volumen'],
  tech: {
    execution: [
      'Sube los brazos hacia los lados hasta la altura del hombro.',
      'Codo ligeramente flexionado y fijo durante todo el recorrido.',
      'Baja despacio: la bajada controlada es la mitad util del ejercicio.',
    ],
    commonMistakes: [
      'Usar impulso del torso.',
      'Subir por encima del hombro: el trapecio se lleva el trabajo.',
      'Encoger los hombros al subir.',
    ],
    hypertrophy: [
      '12–20 repeticiones con peso moderado. Este musculo responde al volumen, no a la carga.',
    ],
  },
});

e('elevacion-polea-lateral', 'Elevacion lateral en polea', 'hombro', 'polea', false, 'aislamiento', {
  subs: ['elevaciones-laterales'],
  unilateral: true,
  tags: ['tension-constante', 'deltoide-medio'],
});

e('elevaciones-frontales', 'Elevaciones frontales', 'hombro', 'mancuerna', false, 'aislamiento', {
  difficulty: 'principiante',
  tags: ['deltoide-anterior'],
});

e('pajaro', 'Pajaro / Deltoide posterior', 'hombro', 'mancuerna', false, 'aislamiento', {
  secondary: ['espalda'],
  aliases: ['rear delt', 'posterior', 'reverse fly'],
  subs: ['face-pull'],
  tags: ['deltoide-posterior', 'salud-hombro'],
});

/* ══════════════════════════════════════════════════════════════ BICEPS ══ */

e('curl-barra', 'Curl con barra', 'biceps', 'barra', false, 'aislamiento', {
  secondary: ['antebrazo'],
  difficulty: 'principiante',
  subs: ['curl-mancuerna', 'curl-polea'],
  tags: ['basico'],
  tech: {
    commonMistakes: [
      'Balancear el torso hacia atras para subir el peso.',
      'Adelantar los codos: convierte el curl en una elevacion frontal.',
    ],
  },
});
e('curl-mancuerna', 'Curl con mancuernas', 'biceps', 'mancuerna', false, 'aislamiento', {
  secondary: ['antebrazo'],
  difficulty: 'principiante',
  subs: ['curl-barra'],
  tags: ['basico'],
});
e('curl-martillo', 'Curl martillo', 'biceps', 'mancuerna', false, 'aislamiento', {
  secondary: ['antebrazo'],
  aliases: ['hammer curl'],
  difficulty: 'principiante',
  tags: ['braquial', 'antebrazo'],
});
e('curl-predicador', 'Curl predicador', 'biceps', 'maquina', false, 'aislamiento', {
  aliases: ['scott', 'preacher curl'],
  subs: ['curl-concentrado'],
  tags: ['pico-contraccion'],
});
e('curl-inclinado', 'Curl inclinado', 'biceps', 'mancuerna', false, 'aislamiento', {
  tags: ['estiramiento'],
  tech: { safety: ['El estiramiento es alto: entra en el rango de forma progresiva.'] },
});
e('curl-polea', 'Curl en polea', 'biceps', 'polea', false, 'aislamiento', {
  difficulty: 'principiante',
  tags: ['tension-constante'],
});
e('curl-concentrado', 'Curl concentrado', 'biceps', 'mancuerna', false, 'aislamiento', {
  unilateral: true,
  tags: ['pico-contraccion'],
});

/* ═════════════════════════════════════════════════════════════ TRICEPS ══ */

e('press-frances', 'Press frances', 'triceps', 'barra', false, 'aislamiento', {
  aliases: ['skull crusher', 'rompecraneos'],
  subs: ['extension-sobre-cabeza'],
  tags: ['cabeza-larga'],
  tech: {
    safety: [
      'Si notas los codos, usa barra Z y reduce el peso: es un ejercicio de tension, no de carga.',
    ],
  },
});
e('extension-polea', 'Extension de triceps en polea', 'triceps', 'polea', false, 'aislamiento', {
  aliases: ['pushdown', 'jalon triceps'],
  difficulty: 'principiante',
  tags: ['principiante', 'tension-constante'],
});
e('extension-sobre-cabeza', 'Extension sobre la cabeza', 'triceps', 'mancuerna', false, 'aislamiento', {
  subs: ['press-frances'],
  tags: ['cabeza-larga', 'estiramiento'],
});
e('fondos-banco', 'Fondos en banco', 'triceps', 'peso corporal', false, 'empuje-horizontal', {
  secondary: ['pecho'],
  aliases: ['bench dips'],
  difficulty: 'principiante',
  tags: ['peso-corporal'],
  tech: { safety: ['No bajes en exceso: la posicion fuerza la rotacion interna del hombro.'] },
});
e('press-cerrado', 'Press cerrado', 'triceps', 'barra', true, 'empuje-horizontal', {
  secondary: ['pecho', 'hombro'],
  aliases: ['close grip'],
  tags: ['fuerza'],
});
e('patada-triceps', 'Patada de triceps', 'triceps', 'mancuerna', false, 'aislamiento', {
  aliases: ['kickback'],
  difficulty: 'principiante',
  unilateral: true,
  tags: ['contraccion'],
});

/* ═════════════════════════════════════════════════════════ CUADRICEPS ══ */

e('sentadilla', 'Sentadilla', 'cuadriceps', 'barra', true, 'sentadilla', {
  secondary: ['gluteo', 'femoral', 'core'],
  difficulty: 'avanzado',
  aliases: ['squat', 'sentadillas', 'back squat'],
  lumbar: 'alto',
  subs: ['sentadilla-frontal', 'hack-squat', 'prensa'],
  reg: ['sentadilla-goblet', 'prensa'],
  prog: ['sentadilla-frontal'],
  lumbarSafe: ['prensa', 'sentadilla-goblet', 'extension-cuadriceps'],
  tags: ['basico', 'fuerza', 'powerlifting'],
});

e('sentadilla-frontal', 'Sentadilla frontal', 'cuadriceps', 'barra', true, 'sentadilla', {
  secondary: ['gluteo', 'core'],
  difficulty: 'avanzado',
  aliases: ['front squat'],
  lumbar: 'moderado',
  subs: ['sentadilla'],
  reg: ['sentadilla-goblet'],
  lumbarSafe: ['prensa', 'sentadilla-goblet'],
  tags: ['cuadriceps', 'fuerza'],
  tech: {
    setup: [
      'Barra apoyada en los deltoides frontales, codos altos.',
      'El torso queda mas vertical que en la sentadilla trasera: menos momento sobre la lumbar.',
    ],
  },
});

e('sentadilla-goblet', 'Sentadilla goblet', 'cuadriceps', 'mancuerna', true, 'sentadilla', {
  secondary: ['gluteo', 'core'],
  difficulty: 'principiante',
  aliases: ['goblet squat'],
  prog: ['sentadilla-frontal', 'sentadilla'],
  tags: ['principiante', 'lumbar-amable', 'aprendizaje'],
  tech: {
    setup: ['Sujeta una mancuerna o kettlebell contra el pecho, codos hacia abajo.'],
    safety: [
      'El contrapeso frontal ayuda a mantener el torso vertical: es la mejor forma de aprender el patron y la mas amable con la lumbar.',
    ],
  },
});

e('prensa', 'Prensa de piernas', 'cuadriceps', 'maquina', true, 'sentadilla', {
  secondary: ['gluteo'],
  difficulty: 'principiante',
  aliases: ['leg press'],
  subs: ['hack-squat'],
  tags: ['principiante', 'lumbar-amable', 'seguro'],
  tech: {
    safety: [
      'No dejes que la pelvis se despegue del respaldo al bajar: es lo que carga la lumbar en este ejercicio.',
      'Con el respaldo apoyado es una de las mejores opciones para entrenar pierna con sensibilidad lumbar.',
    ],
  },
});

e('hack-squat', 'Hack squat', 'cuadriceps', 'maquina', true, 'sentadilla', {
  secondary: ['gluteo'],
  subs: ['prensa'],
  tags: ['cuadriceps', 'lumbar-amable'],
});

e('extension-cuadriceps', 'Extension de cuadriceps', 'cuadriceps', 'maquina', false, 'aislamiento', {
  aliases: ['leg extension'],
  difficulty: 'principiante',
  tags: ['aislamiento', 'lumbar-amable'],
});

e('zancadas', 'Zancadas', 'cuadriceps', 'mancuerna', true, 'zancada', {
  secondary: ['gluteo'],
  aliases: ['lunges', 'estocadas'],
  unilateral: true,
  subs: ['bulgara'],
  reg: ['zancadas-estaticas'],
  tags: ['unilateral'],
});

e('zancadas-estaticas', 'Zancadas estaticas', 'cuadriceps', 'peso corporal', true, 'zancada', {
  secondary: ['gluteo'],
  difficulty: 'principiante',
  unilateral: true,
  prog: ['zancadas', 'bulgara'],
  tags: ['principiante', 'sin-equipo'],
});

e('bulgara', 'Sentadilla bulgara', 'cuadriceps', 'mancuerna', true, 'zancada', {
  secondary: ['gluteo'],
  difficulty: 'avanzado',
  aliases: ['bulgarian split squat'],
  unilateral: true,
  reg: ['zancadas-estaticas'],
  tags: ['unilateral', 'lumbar-amable'],
});

/* ═══════════════════════════════════════════════════════════ FEMORALES ══ */

e('curl-femoral', 'Curl femoral tumbado', 'femoral', 'maquina', false, 'aislamiento', {
  aliases: ['leg curl', 'femoral'],
  difficulty: 'principiante',
  subs: ['curl-femoral-sentado'],
  tags: ['aislamiento', 'lumbar-amable'],
});
e('curl-femoral-sentado', 'Curl femoral sentado', 'femoral', 'maquina', false, 'aislamiento', {
  difficulty: 'principiante',
  subs: ['curl-femoral'],
  tags: ['aislamiento', 'lumbar-amable', 'estiramiento'],
});
e('peso-muerto-piernas-rigidas', 'Peso muerto piernas rigidas', 'femoral', 'barra', true, 'bisagra', {
  secondary: ['gluteo'],
  difficulty: 'avanzado',
  lumbar: 'alto',
  subs: ['peso-muerto-rumano'],
  lumbarSafe: ['curl-femoral', 'hip-thrust'],
  tags: ['estiramiento', 'cadena-posterior'],
});
e('good-morning', 'Good morning', 'femoral', 'barra', true, 'bisagra', {
  secondary: ['gluteo', 'espalda'],
  difficulty: 'avanzado',
  lumbar: 'alto',
  subs: ['peso-muerto-rumano'],
  lumbarSafe: ['curl-femoral-sentado', 'hip-thrust'],
  tags: ['cadena-posterior'],
  tech: {
    safety: [
      'Con la barra en la espalda y el torso inclinado, el brazo de palanca sobre la lumbar es de los mas altos que existen. Carga muy conservadora.',
    ],
  },
});
e('nordic-curl', 'Nordic curl', 'femoral', 'peso corporal', false, 'aislamiento', {
  difficulty: 'avanzado',
  aliases: ['nordico'],
  reg: ['curl-femoral'],
  tags: ['excentrico', 'prevencion'],
  tech: {
    execution: [
      'Baja lo mas despacio que puedas resistiendo con los isquiotibiales.',
      'Amortigua con las manos al llegar abajo.',
      'Vuelve empujando con las manos.',
    ],
    tempo: 'Excentrica de 4–6 segundos',
  },
});

/* ═════════════════════════════════════════════════════════════ GLUTEOS ══ */

e('hip-thrust', 'Hip thrust', 'gluteo', 'barra', true, 'bisagra', {
  secondary: ['femoral'],
  aliases: ['empuje de cadera'],
  difficulty: 'principiante',
  subs: ['puente-gluteo'],
  reg: ['puente-gluteo'],
  tags: ['gluteo', 'lumbar-amable'],
  tech: {
    setup: [
      'Escapulas apoyadas en el borde del banco, pies a la anchura de la cadera.',
      'Barra sobre la cadera con almohadilla.',
      'Mete la pelvis en retroversion antes de empezar.',
    ],
    execution: [
      'Empuja con los talones hasta que el torso quede paralelo al suelo.',
      'Aprieta gluteos arriba durante un segundo.',
      'Baja controlado sin apoyar del todo entre repeticiones.',
    ],
    commonMistakes: [
      'Hiperextender la lumbar arriba en vez de apretar el gluteo.',
      'Subir la barbilla: la mirada debe seguir a la cadera.',
    ],
    safety: [
      'Manteniendo la pelvis en retroversion, la carga se queda en el gluteo y no pasa a la zona lumbar.',
    ],
  },
});

e('puente-gluteo', 'Puente de gluteo', 'gluteo', 'peso corporal', false, 'bisagra', {
  secondary: ['femoral'],
  difficulty: 'principiante',
  prog: ['hip-thrust'],
  tags: ['principiante', 'sin-equipo', 'lumbar-amable', 'calentamiento'],
});

e('patada-gluteo', 'Patada de gluteo en polea', 'gluteo', 'polea', false, 'aislamiento', {
  unilateral: true,
  difficulty: 'principiante',
  tags: ['gluteo', 'lumbar-amable'],
});

e('abduccion', 'Abduccion de cadera', 'gluteo', 'maquina', false, 'aislamiento', {
  difficulty: 'principiante',
  tags: ['gluteo-medio', 'lumbar-amable'],
});

/* ═════════════════════════════════════════════════════════════ GEMELOS ══ */

e('gemelo-de-pie', 'Elevacion de gemelos de pie', 'gemelo', 'maquina', false, 'aislamiento', {
  aliases: ['calf raise', 'pantorrilla'],
  difficulty: 'principiante',
  subs: ['gemelo-sentado'],
  tags: ['gemelo'],
  tech: {
    rangeOfMotion: 'Recorrido completo: estiramiento total abajo y contraccion maxima arriba.',
    hypertrophy: [
      '12–20 repeticiones con pausa de 1 segundo arriba y 2 segundos de estiramiento abajo.',
    ],
  },
});
e('gemelo-sentado', 'Elevacion de gemelos sentado', 'gemelo', 'maquina', false, 'aislamiento', {
  difficulty: 'principiante',
  subs: ['gemelo-de-pie'],
  tags: ['soleo'],
});

/* ════════════════════════════════════════════════════════ ABDOMEN/CORE ══ */

e('plancha', 'Plancha', 'core', 'peso corporal', false, 'core-antiextension', {
  aliases: ['plank'],
  difficulty: 'principiante',
  prog: ['rueda-abdominal'],
  tags: ['core', 'sin-equipo', 'lumbar-amable'],
});
e('plancha-lateral', 'Plancha lateral', 'core', 'peso corporal', false, 'core-antiextension', {
  difficulty: 'principiante',
  unilateral: true,
  tags: ['core', 'oblicuos', 'lumbar-amable'],
});
e('pallof-press', 'Pallof press', 'core', 'polea', false, 'core-antirotacion', {
  difficulty: 'principiante',
  tags: ['core', 'antirotacion', 'lumbar-amable'],
  tech: {
    execution: [
      'De pie, perpendicular a la polea, lleva las manos al pecho.',
      'Extiende los brazos al frente resistiendo la rotacion.',
      'Vuelve al pecho con el mismo control.',
    ],
  },
});
e('bird-dog', 'Bird dog', 'core', 'peso corporal', false, 'core-antiextension', {
  secondary: ['gluteo', 'espalda'],
  difficulty: 'principiante',
  tags: ['core', 'lumbar-amable', 'rehabilitacion', 'calentamiento'],
  tech: {
    execution: [
      'A cuatro apoyos, extiende brazo y pierna contrarios.',
      'Manten la pelvis completamente quieta.',
      'Vuelve despacio y cambia de lado.',
    ],
    safety: ['Es uno de los ejercicios de core mas seguros para espaldas sensibles.'],
  },
});
e('dead-bug', 'Dead bug', 'core', 'peso corporal', false, 'core-antiextension', {
  difficulty: 'principiante',
  tags: ['core', 'lumbar-amable', 'rehabilitacion'],
  tech: {
    execution: [
      'Tumbado boca arriba, lumbar pegada al suelo.',
      'Baja brazo y pierna contrarios sin que la espalda se despegue.',
      'Vuelve y alterna.',
    ],
    safety: ['Si la lumbar se despega del suelo, acorta el recorrido.'],
  },
});
e('crunch-polea', 'Crunch en polea', 'core', 'polea', false, 'aislamiento', {
  tags: ['abdomen'],
});
e('elevacion-piernas', 'Elevacion de piernas colgado', 'core', 'peso corporal', false, 'aislamiento', {
  difficulty: 'avanzado',
  aliases: ['hanging leg raise'],
  reg: ['elevacion-rodillas'],
  tags: ['abdomen'],
});
e('elevacion-rodillas', 'Elevacion de rodillas', 'core', 'peso corporal', false, 'aislamiento', {
  difficulty: 'principiante',
  prog: ['elevacion-piernas'],
  tags: ['abdomen'],
});
e('abdominales', 'Abdominales', 'core', 'peso corporal', false, 'aislamiento', {
  aliases: ['crunch', 'sit ups'],
  difficulty: 'principiante',
  lumbar: 'moderado',
  lumbarSafe: ['dead-bug', 'plancha', 'bird-dog'],
  tags: ['abdomen', 'sin-equipo'],
  tech: {
    safety: [
      'La flexion repetida de columna puede molestar en espaldas sensibles: en ese caso usa dead bug o plancha.',
    ],
  },
});
e('rueda-abdominal', 'Rueda abdominal', 'core', 'otro', false, 'core-antiextension', {
  difficulty: 'avanzado',
  aliases: ['ab wheel'],
  reg: ['plancha'],
  tags: ['core'],
});
e('russian-twist', 'Russian twist', 'core', 'peso corporal', false, 'aislamiento', {
  lumbar: 'moderado',
  lumbarSafe: ['pallof-press', 'plancha-lateral'],
  tags: ['oblicuos'],
});

/* ═══════════════════════════════════════════════ MOVILIDAD Y CALENTAR ══ */

e('movilidad-cadera', 'Movilidad de cadera 90/90', 'core', 'peso corporal', false, 'movilidad', {
  difficulty: 'principiante',
  aliases: ['90/90', 'movilidad cadera'],
  tags: ['movilidad', 'calentamiento', 'sin-equipo'],
});
e('movilidad-toracica', 'Movilidad toracica', 'espalda', 'peso corporal', false, 'movilidad', {
  difficulty: 'principiante',
  aliases: ['t-spine', 'rotacion toracica'],
  tags: ['movilidad', 'calentamiento', 'lumbar-amable'],
});
e('gato-camello', 'Gato-camello', 'core', 'peso corporal', false, 'movilidad', {
  difficulty: 'principiante',
  aliases: ['cat cow'],
  tags: ['movilidad', 'calentamiento', 'lumbar-amable', 'rehabilitacion'],
  tech: {
    execution: [
      'A cuatro apoyos, redondea la espalda expulsando el aire.',
      'Arquea suavemente tomando aire.',
      'Movimiento lento, sin buscar el rango maximo.',
    ],
  },
});
e('estiramiento-psoas', 'Estiramiento de psoas', 'cuadriceps', 'peso corporal', false, 'movilidad', {
  difficulty: 'principiante',
  aliases: ['flexor de cadera'],
  tags: ['movilidad', 'lumbar-amable'],
});
e('dislocaciones-hombro', 'Dislocaciones de hombro con banda', 'hombro', 'banda', false, 'movilidad', {
  difficulty: 'principiante',
  aliases: ['pass through', 'movilidad hombro'],
  tags: ['movilidad', 'calentamiento', 'salud-hombro'],
});
e('rotacion-externa-banda', 'Rotacion externa con banda', 'hombro', 'banda', false, 'aislamiento', {
  difficulty: 'principiante',
  aliases: ['manguito rotador'],
  tags: ['calentamiento', 'salud-hombro', 'prevencion'],
});

/* ══════════════════════════════════════════════════════════════ CARDIO ══ */

e('caminadora', 'Caminadora', 'cardio', 'maquina', false, 'cardio', {
  aliases: ['treadmill', 'cinta', 'correr'],
  difficulty: 'principiante',
  tags: ['cardio', 'liss'],
});
e('cinta-inclinada', 'Cinta inclinada', 'cardio', 'maquina', false, 'cardio', {
  aliases: ['incline walk', 'caminata inclinada'],
  difficulty: 'principiante',
  tags: ['cardio', 'liss', 'prep'],
  tech: {
    commonMistakes: [
      'Agarrarse al manillar: reduce mucho el gasto real y falsea las calorias de la maquina.',
    ],
    safety: ['Empieza con inclinacion moderada y sube progresivamente.'],
  },
});
e('bicicleta', 'Bicicleta estatica', 'cardio', 'maquina', false, 'cardio', {
  aliases: ['bici', 'spinning'],
  difficulty: 'principiante',
  tags: ['cardio', 'liss', 'lumbar-amable'],
});
e('eliptica', 'Eliptica', 'cardio', 'maquina', false, 'cardio', {
  difficulty: 'principiante',
  tags: ['cardio', 'liss', 'bajo-impacto'],
});
e('remo-ergometro', 'Remo ergometro', 'cardio', 'maquina', false, 'cardio', {
  secondary: ['espalda'],
  aliases: ['rower', 'remoergometro'],
  lumbar: 'moderado',
  lumbarSafe: ['bicicleta', 'eliptica'],
  tags: ['cardio', 'cuerpo-completo'],
});
e('escaladora', 'Escaladora', 'cardio', 'maquina', false, 'cardio', {
  secondary: ['gluteo'],
  aliases: ['stairmaster', 'escalera'],
  difficulty: 'principiante',
  tags: ['cardio', 'prep'],
});
e('cuerda', 'Cuerda / Salto', 'cardio', 'otro', false, 'cardio', {
  aliases: ['jump rope', 'saltar cuerda', 'comba'],
  tags: ['cardio', 'impacto'],
});
e('caminata', 'Caminata al aire libre', 'cardio', 'peso corporal', false, 'cardio', {
  aliases: ['walking', 'andar', 'pasos'],
  difficulty: 'principiante',
  tags: ['cardio', 'liss', 'pasos', 'sin-equipo'],
});

/* ══════════════════════════════════════════════════════════ TRANSPORTE ══ */

e('farmer-walk', 'Paseo del granjero', 'antebrazo', 'mancuerna', true, 'transporte', {
  secondary: ['core', 'espalda'],
  aliases: ['farmer walk', 'paseo granjero'],
  lumbar: 'moderado',
  tags: ['agarre', 'core'],
});

/* ══════════════════════════════════════════════════════════════════════ */

/** Catalogo final: metadatos + guia de tecnica completa. */
export const EXERCISES: Exercise[] = raw.map((base) => ({
  ...base,
  technique: { ...templateFor(base as Exercise), ...(OVERRIDES[base.id] ?? {}) },
}));

export const EXERCISE_BY_ID: ReadonlyMap<string, Exercise> = new Map(
  EXERCISES.map((x) => [x.id, x]),
);

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

export const PATTERN_LABEL: Record<MovementPattern, string> = {
  'empuje-horizontal': 'Empuje horizontal',
  'empuje-vertical': 'Empuje vertical',
  'traccion-horizontal': 'Traccion horizontal',
  'traccion-vertical': 'Traccion vertical',
  sentadilla: 'Sentadilla',
  bisagra: 'Bisagra de cadera',
  zancada: 'Zancada',
  aislamiento: 'Aislamiento',
  'core-antiextension': 'Core antiextension',
  'core-antirotacion': 'Core antirotacion',
  movilidad: 'Movilidad',
  cardio: 'Cardio',
  transporte: 'Transporte',
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export const LUMBAR_LABEL: Record<LumbarLoad, string> = {
  bajo: 'Carga lumbar baja',
  moderado: 'Carga lumbar moderada',
  alto: 'Carga lumbar alta',
};

export const LUMBAR_TONE: Record<LumbarLoad, string> = {
  bajo: 'text-brand',
  moderado: 'text-carbs',
  alto: 'text-rose',
};

function plain(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Busqueda por nombre, alias, musculo o etiqueta. */
export function searchExercises(query: string, limit = 20): Exercise[] {
  const q = plain(query);
  if (!q) return EXERCISES.slice(0, limit);

  const scored: { ex: Exercise; score: number }[] = [];
  for (const ex of EXERCISES) {
    const name = plain(ex.name);
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (ex.aliases?.some((a) => plain(a).includes(q))) score = 50;
    else if (plain(MUSCLE_LABEL[ex.primary]).includes(q)) score = 30;
    else if (ex.tags.some((t) => plain(t).includes(q))) score = 20;
    if (score) scored.push({ ex, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.ex);
}

/** Ejercicios de carga lumbar baja, utiles con sensibilidad en la zona. */
export function lumbarSafeExercises(): Exercise[] {
  return EXERCISES.filter((e2) => e2.lumbarLoad === 'bajo' && e2.primary !== 'cardio');
}

/** Alternativas concretas a un ejercicio que carga la lumbar. */
export function lumbarAlternativesFor(ex: Exercise): Exercise[] {
  const listed = (ex.lumbarSafeAlternatives ?? [])
    .map((id) => EXERCISE_BY_ID.get(id))
    .filter((x): x is Exercise => !!x);
  if (listed.length) return listed;
  return EXERCISES.filter(
    (o) => o.id !== ex.id && o.primary === ex.primary && o.lumbarLoad === 'bajo',
  ).slice(0, 4);
}

export function relatedExercises(
  ex: Exercise,
  key: 'substitutions' | 'regressions' | 'progressions',
): Exercise[] {
  return ex[key].map((id) => EXERCISE_BY_ID.get(id)).filter((x): x is Exercise => !!x);
}
