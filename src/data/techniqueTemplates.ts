/**
 * Tecnica de los ejercicios.
 *
 * Contenido original, escrito para esta app. No se reproduce material con
 * copyright de terceros.
 *
 * Estructura en dos niveles:
 *  1. `AUTHORED` — tecnica escrita a mano para los ejercicios principales.
 *  2. `templateFor()` — genera una guia coherente a partir del patron de
 *     movimiento para el resto del catalogo, de modo que NINGUN ejercicio se
 *     quede sin instrucciones utiles.
 */
import type { Exercise, ExerciseTechnique, MovementPattern } from '@bodyfit/domain/types';

/** Forma que devuelven las plantillas: la guia sin los campos transversales. */
type BaseTemplate = Omit<
  ExerciseTechnique,
  'summary' | 'startPosition' | 'warningSigns' | 'warnings' | 'authored' | 'lumbarAdaptation'
>;

/* ─────────────────────────────────────── plantillas por patron ────────── */

const PATTERN_TEMPLATE: Record<MovementPattern, (ex: Exercise) => BaseTemplate> = {
  'empuje-horizontal': (ex) => ({
    setup: [
      'Apoya los pies firmes en el suelo y junta ligeramente las escapulas.',
      'Manten el pecho alto y una curva natural en la zona lumbar.',
      'Agarre algo mas ancho que los hombros, munecas alineadas con los antebrazos.',
    ],
    execution: [
      'Baja la carga de forma controlada hacia la parte media del pecho.',
      'Detente cuando notes estiramiento sin perder la posicion de los hombros.',
      'Empuja separando el suelo con los pies y llevando la carga en linea recta.',
      'Termina sin bloquear los codos de golpe.',
    ],
    breathing: 'Inspira al bajar, expulsa el aire durante el empuje.',
    rangeOfMotion: 'Hasta notar estiramiento en el pecho, sin rebotar ni forzar el hombro.',
    tempo: '2-1-1-0 (2 s bajando, 1 s de pausa, 1 s subiendo)',
    commonMistakes: [
      'Sacar los codos a 90 grados respecto al torso: castiga el hombro.',
      'Rebotar la carga en el pecho.',
      'Perder la retraccion escapular a mitad de serie.',
    ],
    safety: [
      'Usa seguros o companero si trabajas cerca del fallo con barra.',
      `Si notas pinchazo en el hombro, reduce el rango y prueba ${ex.equipment === 'barra' ? 'mancuernas' : 'una maquina'}.`,
    ],
    hypertrophy: [
      '8–12 repeticiones con 1–3 repeticiones en reserva.',
      'Controla la fase excentrica: es donde se acumula la mayor parte del estimulo.',
    ],
    strength: ['3–6 repeticiones, descansos de 3 minutos.', 'Prioriza la velocidad de la barra.'],
    contraindications: ['Molestia aguda de hombro o pectoral.'],
  }),

  'empuje-vertical': () => ({
    setup: [
      'Pies a la anchura de las caderas y gluteos activos.',
      'Costillas hacia abajo: evita arquear la lumbar para compensar.',
      'Agarre justo por fuera de los hombros.',
    ],
    execution: [
      'Empuja la carga hacia arriba manteniendo el torso rigido.',
      'Al pasar la cabeza, permite que los hombros roten hacia arriba.',
      'Baja controlado hasta la altura de la barbilla o algo mas.',
    ],
    breathing: 'Inspira abajo, aguanta el aire durante el empuje y expulsa arriba.',
    rangeOfMotion: 'Hasta extension completa arriba sin hiperextender la lumbar.',
    tempo: '2-0-1-0',
    commonMistakes: [
      'Arquear la lumbar para ganar recorrido.',
      'Empujar hacia delante en vez de hacia arriba.',
    ],
    safety: [
      'Si tienes poca movilidad de hombro, usa agarre neutro o mancuernas.',
      'Sentado con respaldo reduce la carga lumbar frente a la version de pie.',
    ],
    hypertrophy: ['8–12 repeticiones, control en la bajada.'],
    strength: ['4–6 repeticiones con torso muy rigido.'],
    contraindications: ['Molestia de hombro en flexion por encima de la cabeza.'],
  }),

  'traccion-horizontal': () => ({
    setup: [
      'Pecho alto, hombros abajo y atras.',
      'Torso estable: si es remo libre, la cadera hace de bisagra y la espalda queda neutra.',
    ],
    execution: [
      'Inicia el tiron llevando la escapula hacia atras, no tirando con el brazo.',
      'Lleva el codo hacia la cadera manteniendo el torso quieto.',
      'Vuelve controlado permitiendo que la escapula se estire al final.',
    ],
    breathing: 'Expulsa el aire al traccionar, inspira al volver.',
    rangeOfMotion: 'Estiramiento completo al final, contraccion sin encoger el hombro.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Usar impulso de cadera en cada repeticion.',
      'Tirar solo con biceps sin mover la escapula.',
    ],
    safety: [
      'Si notas la zona lumbar, apoya el pecho en un banco inclinado o usa la version en maquina.',
    ],
    hypertrophy: ['8–15 repeticiones con pausa breve en contraccion.'],
    strength: ['5–8 repeticiones con torso muy rigido.'],
    contraindications: ['Dolor lumbar agudo en las versiones sin apoyo.'],
  }),

  'traccion-vertical': () => ({
    setup: [
      'Agarre algo mas ancho que los hombros.',
      'Pecho arriba y ligera inclinacion atras del torso.',
    ],
    execution: [
      'Baja los hombros antes de doblar los codos.',
      'Lleva los codos hacia las costillas.',
      'Sube controlado permitiendo el estiramiento completo del dorsal.',
    ],
    breathing: 'Expulsa al tirar, inspira al subir.',
    rangeOfMotion: 'Estiramiento completo arriba, contraccion a la altura del pecho.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Balancear el cuerpo para completar repeticiones.',
      'Llevar la barra por detras de la nuca.',
    ],
    safety: ['Evita la version tras nuca: exige mucha rotacion externa y castiga el hombro.'],
    hypertrophy: ['8–15 repeticiones controladas.'],
    strength: ['Lastre progresivo en dominadas, 4–8 repeticiones.'],
    contraindications: ['Molestia de codo o hombro con agarre pronado: prueba agarre neutro.'],
  }),

  sentadilla: () => ({
    setup: [
      'Pies a la anchura de los hombros, puntas ligeramente hacia fuera.',
      'Reparte el peso entre el talon y la base del dedo gordo.',
      'Toma aire y aprieta el abdomen antes de bajar.',
    ],
    execution: [
      'Baja rompiendo con caderas y rodillas a la vez.',
      'Las rodillas siguen la direccion de las puntas de los pies.',
      'Baja hasta donde puedas mantener la espalda neutra.',
      'Sube empujando el suelo, cadera y pecho al mismo ritmo.',
    ],
    breathing: 'Aire dentro antes de bajar, mantenlo durante el descenso y expulsa al pasar el punto dificil.',
    rangeOfMotion: 'Idealmente muslo paralelo o algo mas, sin que la pelvis se retroverse.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Que suba antes la cadera que el pecho.',
      'Perder la posicion neutra al final del recorrido.',
      'Rodillas que colapsan hacia dentro.',
    ],
    safety: [
      'Trabaja siempre dentro de un rack con seguros a la altura adecuada.',
      'Si tienes sensibilidad lumbar, la prensa o la sentadilla goblet reducen mucho la carga en la columna.',
    ],
    hypertrophy: ['6–12 repeticiones con recorrido completo y control.'],
    strength: ['3–5 repeticiones, descansos largos, tecnica identica en todas las series.'],
    contraindications: ['Dolor lumbar o de rodilla en carga: cambia a variante con apoyo.'],
  }),

  bisagra: () => ({
    setup: [
      'Pies bajo la cadera, barra o carga pegada al cuerpo.',
      'Espalda neutra desde la cabeza hasta la pelvis.',
      'Activa el dorsal: imagina que aprietas algo bajo las axilas.',
    ],
    execution: [
      'Lleva la cadera hacia atras manteniendo la espalda recta.',
      'Baja hasta notar estiramiento en los isquiotibiales, no mas.',
      'Vuelve empujando la cadera hacia delante y apretando gluteos.',
    ],
    breathing: 'Aire dentro arriba, mantenlo durante el recorrido y expulsa al terminar la repeticion.',
    rangeOfMotion: 'Marcado por el estiramiento del isquiotibial, nunca por redondear la espalda.',
    tempo: '3-1-1-0',
    commonMistakes: [
      'Redondear la zona lumbar al bajar.',
      'Convertirlo en una sentadilla doblando demasiado la rodilla.',
      'Hiperextender la espalda arriba.',
    ],
    safety: [
      'Es el patron que mas exige a la zona lumbar: prioriza la tecnica sobre el peso.',
      'Con sensibilidad lumbar, sustituye por curl femoral o hip thrust.',
    ],
    hypertrophy: ['8–12 repeticiones con enfasis en el estiramiento.'],
    strength: ['3–6 repeticiones con espalda perfectamente neutra.'],
    contraindications: [
      'Hernia discal sintomatica o dolor lumbar agudo: consulta con un profesional antes de cargar este patron.',
    ],
  }),

  zancada: () => ({
    setup: ['Torso erguido, mirada al frente.', 'Paso lo bastante largo para que la rodilla trasera baje comoda.'],
    execution: [
      'Baja vertical hasta que la rodilla trasera casi toque el suelo.',
      'Empuja con el talon de la pierna delantera para volver.',
      'Manten la cadera cuadrada, sin rotar.',
    ],
    breathing: 'Inspira al bajar, expulsa al subir.',
    rangeOfMotion: 'Hasta donde controles el equilibrio y la rodilla no duela.',
    tempo: '2-1-1-0',
    commonMistakes: ['Inclinar el torso hacia delante.', 'Paso demasiado corto.'],
    safety: ['Empieza con peso corporal hasta dominar el equilibrio.'],
    hypertrophy: ['8–12 repeticiones por pierna.'],
    strength: ['6–8 repeticiones por pierna con carga moderada.'],
    contraindications: ['Inestabilidad de rodilla sin valoracion previa.'],
  }),

  aislamiento: (ex) => ({
    setup: [
      'Coloca la articulacion que trabaja alineada con el eje de la maquina o de la carga.',
      'Estabiliza el resto del cuerpo: solo debe moverse el segmento implicado.',
    ],
    execution: [
      'Inicia el movimiento sin impulso.',
      'Llega a la contraccion completa y manten medio segundo.',
      'Vuelve controlado hasta el estiramiento.',
    ],
    breathing: 'Expulsa el aire en la fase de esfuerzo, inspira al volver.',
    rangeOfMotion: 'Recorrido completo: el estiramiento aporta tanto como la contraccion.',
    tempo: '2-1-1-1',
    commonMistakes: [
      'Usar impulso del torso para mover mas peso.',
      'Recortar el recorrido en las ultimas repeticiones.',
    ],
    safety: [`Carga moderada: en ${ex.name.toLowerCase()} el objetivo es tension, no peso maximo.`],
    hypertrophy: ['10–20 repeticiones, cerca del fallo tecnico.'],
    strength: ['No es el ejercicio adecuado para buscar fuerza maxima.'],
    contraindications: ['Molestia articular en el recorrido: reduce rango o carga.'],
  }),

  'core-antiextension': () => ({
    setup: ['Costillas hacia abajo y pelvis en posicion neutra.', 'Aprieta gluteos para fijar la pelvis.'],
    execution: [
      'Manten la posicion sin que la lumbar se arquee.',
      'Respira de forma superficial y constante sin perder la tension.',
    ],
    breathing: 'Respiracion continua: no aguantes el aire.',
    rangeOfMotion: 'Isometrico o recorrido muy corto y controlado.',
    tempo: 'Mantenimiento de 20–60 segundos',
    commonMistakes: ['Dejar caer la cadera.', 'Subir demasiado los gluteos.'],
    safety: ['Si notas la lumbar en vez del abdomen, acorta la palanca.'],
    hypertrophy: ['3–4 series de 30–45 segundos.'],
    strength: ['Anade carga solo cuando puedas mantener 60 segundos limpios.'],
    contraindications: ['Dolor lumbar durante el ejercicio.'],
  }),

  'core-antirotacion': () => ({
    setup: ['Base estable, caderas y hombros mirando al frente.'],
    execution: ['Resiste la rotacion sin girar el torso.', 'Vuelve despacio a la posicion inicial.'],
    breathing: 'Expulsa el aire mientras resistes.',
    rangeOfMotion: 'Controlado, sin que el torso rote.',
    tempo: '2-2-2-0',
    commonMistakes: ['Girar la cadera.', 'Perder la alineacion de las costillas.'],
    safety: ['Carga ligera: es un ejercicio de control, no de fuerza.'],
    hypertrophy: ['10–15 repeticiones por lado.'],
    strength: ['Progresa aumentando la distancia, no solo el peso.'],
    contraindications: ['Dolor al rotar el tronco.'],
  }),

  movilidad: () => ({
    setup: ['Busca una posicion comoda y estable antes de empezar.'],
    execution: [
      'Entra en el rango de forma progresiva.',
      'Manten la posicion respirando con calma.',
      'Sal del rango con el mismo control con el que entraste.',
    ],
    breathing: 'Respiracion lenta y profunda: ayuda a ganar rango.',
    rangeOfMotion: 'Hasta notar tension, nunca dolor.',
    tempo: 'Mantenimiento de 20–45 segundos',
    commonMistakes: ['Forzar con rebotes.', 'Aguantar la respiracion.'],
    safety: ['Nunca busques dolor: la tension es suficiente estimulo.'],
    hypertrophy: ['No aplica: el objetivo es rango, no tamano.'],
    strength: ['No aplica.'],
    contraindications: ['Lesion aguda sin valoracion.'],
  }),

  cardio: () => ({
    setup: ['Ajusta la maquina a tu altura antes de empezar.', 'Empieza con 3–5 minutos suaves.'],
    execution: [
      'Manten una intensidad que te permita respirar por la nariz en trabajo suave.',
      'Postura erguida, sin colgarte de los agarres.',
      'Termina con unos minutos de vuelta a la calma.',
    ],
    breathing: 'Ritmo constante y comodo.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Constante',
    commonMistakes: [
      'Apoyarse en el manillar en la cinta inclinada: reduce mucho el gasto real.',
      'Empezar demasiado fuerte.',
    ],
    safety: ['Hidratate y para si notas mareo o dolor en el pecho.'],
    hypertrophy: ['No aplica.'],
    strength: ['No aplica.'],
    contraindications: ['Sintomas cardiovasculares: consulta a un profesional sanitario.'],
  }),

  transporte: () => ({
    setup: ['Coge la carga con la espalda neutra y el pecho alto.'],
    execution: ['Camina con pasos cortos y el tronco firme.', 'No dejes que la carga te incline.'],
    breathing: 'Respiracion continua y controlada.',
    rangeOfMotion: 'No aplica.',
    tempo: 'Distancia o tiempo',
    commonMistakes: ['Inclinarse hacia un lado.', 'Encoger los hombros.'],
    safety: ['Suelta la carga con control, doblando las rodillas.'],
    hypertrophy: ['Series de 30–60 segundos.'],
    strength: ['Cargas altas en distancias cortas.'],
    contraindications: ['Dolor lumbar en carga.'],
  }),
};

/* ─────────────────────────── campos transversales por patron ──────────── */

interface Extras {
  summary: string;
  startPosition: string[];
  warningSigns: string[];
  warnings: string[];
}

const PATTERN_EXTRAS: Record<MovementPattern, Extras> = {
  'empuje-horizontal': {
    summary: 'Baja controlado con los codos a unos 45 grados del torso y empuja sin perder la posicion de los hombros.',
    startPosition: ['Escapulas juntas y deprimidas, pecho alto, pies firmes en el suelo.'],
    warningSigns: ['Los codos se abren a 90 grados.', 'Los hombros se adelantan al bajar.'],
    warnings: ['No busques el fallo con barra sin seguros o sin companero.'],
  },
  'empuje-vertical': {
    summary: 'Empuja hacia arriba con el torso rigido: la lumbar no debe arquearse para ganar recorrido.',
    startPosition: ['Carga a la altura de la clavicula, costillas abajo, gluteos apretados.'],
    warningSigns: ['La lumbar se arquea al empujar.', 'La carga viaja hacia delante en vez de hacia arriba.'],
    warnings: ['Con poca movilidad de hombro, usa agarre neutro o cambia a maquina.'],
  },
  'traccion-horizontal': {
    summary: 'Empieza el tiron con la escapula, no con el brazo, y manten el torso completamente quieto.',
    startPosition: ['Pecho alto, hombros abajo, brazos extendidos con estiramiento en la espalda.'],
    warningSigns: ['El torso se balancea en cada repeticion.', 'Solo se doblan los codos, la escapula no se mueve.'],
    warnings: ['En las versiones sin apoyo, la fatiga lumbar suele llegar antes que la de la espalda alta.'],
  },
  'traccion-vertical': {
    summary: 'Baja los hombros antes de doblar los codos y lleva los codos hacia las costillas.',
    startPosition: ['Colgado o sentado con los brazos extendidos y los hombros sin encogerse.'],
    warningSigns: ['El cuerpo se balancea para completar la repeticion.', 'La barbilla se estira hacia la barra.'],
    warnings: ['Nada de tras nuca: exige una rotacion externa que pocos hombros toleran.'],
  },
  sentadilla: {
    summary: 'Baja con cadera y rodillas a la vez manteniendo la espalda neutra, y sube con pecho y cadera al mismo ritmo.',
    startPosition: ['De pie, pies a la anchura de los hombros, abdomen apretado con aire dentro.'],
    warningSigns: ['La cadera sube antes que el pecho.', 'La pelvis se retroverse abajo.', 'Las rodillas colapsan hacia dentro.'],
    warnings: ['Trabaja siempre dentro de un rack con los seguros a la altura correcta.'],
  },
  bisagra: {
    summary: 'La cadera va hacia atras, la espalda no se mueve: el rango lo marca el isquiotibial, no la columna.',
    startPosition: ['De pie, carga pegada al cuerpo, espalda neutra de la cabeza a la pelvis.'],
    warningSigns: ['La zona lumbar se redondea al bajar.', 'La espalda se hiperextiende arriba.'],
    warnings: ['Es el patron que mas exige a la columna: la tecnica manda sobre el peso.'],
  },
  zancada: {
    summary: 'Baja vertical, torso erguido y empuja con el talon de la pierna delantera.',
    startPosition: ['Paso adelantado con la rodilla trasera lista para bajar comoda.'],
    warningSigns: ['El torso se va hacia delante.', 'La rodilla delantera se desplaza hacia dentro.'],
    warnings: ['Domina el equilibrio con peso corporal antes de cargar.'],
  },
  aislamiento: {
    summary: 'Solo se mueve la articulacion implicada: sin impulso y con recorrido completo.',
    startPosition: ['Segmento alineado con el eje de la carga y el resto del cuerpo estable.'],
    warningSigns: ['Aparece impulso del torso.', 'El recorrido se acorta en las ultimas repeticiones.'],
    warnings: ['El objetivo es tension, no peso maximo.'],
  },
  'core-antiextension': {
    summary: 'El trabajo es impedir que la lumbar se arquee, no mover el tronco.',
    startPosition: ['Costillas abajo, pelvis neutra, gluteos activos.'],
    warningSigns: ['La cadera cae.', 'Aparece sensacion en la lumbar en vez de en el abdomen.'],
    warnings: ['Si notas la zona lumbar, acorta la palanca antes de anadir tiempo.'],
  },
  'core-antirotacion': {
    summary: 'Se trata de resistir la rotacion manteniendo caderas y hombros al frente.',
    startPosition: ['Base estable, manos en el pecho, cadera y hombros alineados.'],
    warningSigns: ['La cadera gira con la carga.', 'Las costillas se abren.'],
    warnings: ['Carga ligera: es control, no fuerza.'],
  },
  movilidad: {
    summary: 'Entra en el rango de forma progresiva y respira: la tension basta, el dolor no.',
    startPosition: ['Posicion comoda y estable antes de empezar el recorrido.'],
    warningSigns: ['Aparece dolor agudo.', 'Se aguanta la respiracion.'],
    warnings: ['Nunca fuerces con rebotes.'],
  },
  cardio: {
    summary: 'Intensidad sostenible, postura erguida y sin colgarte de los agarres.',
    startPosition: ['Maquina ajustada a tu altura, 3–5 minutos suaves de entrada.'],
    warningSigns: ['Te apoyas en el manillar.', 'No puedes mantener la postura.'],
    warnings: ['Para si notas mareo o dolor en el pecho.'],
  },
  transporte: {
    summary: 'Carga firme, tronco rigido y pasos cortos: la carga no debe inclinarte.',
    startPosition: ['De pie con la carga a los lados, hombros abajo y pecho alto.'],
    warningSigns: ['El tronco se inclina a un lado.', 'Los hombros se encogen.'],
    warnings: ['Suelta la carga doblando las rodillas, nunca desde la espalda.'],
  },
};

/**
 * Genera la tecnica de un ejercicio a partir de su patron de movimiento.
 * Sirve de red de seguridad: garantiza que ningun ejercicio quede sin guia
 * completa aunque no tenga contenido escrito a mano.
 */
export function templateFor(ex: Exercise): ExerciseTechnique {
  const base = PATTERN_TEMPLATE[ex.pattern](ex);
  const extras = PATTERN_EXTRAS[ex.pattern];
  return { ...extras, ...base, authored: false };
}
