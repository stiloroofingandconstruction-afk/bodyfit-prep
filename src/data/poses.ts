/**
 * Catalogo de poses por division.
 *
 * Descripciones propias, orientadas a la practica. Los reglamentos concretos
 * varian entre federaciones y temporadas: confirma siempre las poses
 * obligatorias en la normativa oficial de tu federacion.
 */
import type { Pose } from '@/domain/prepTypes';
import type { Division } from '@/domain/competition';

const BB: Division[] = ['Bodybuilding', 'Classic Physique'];
const PHYS: Division[] = ["Men's Physique"];
const WOMEN: Division[] = ['Bikini', 'Wellness', 'Figure', 'Womens Physique'];

export const POSES: Pose[] = [
  /* ── Bodybuilding y Classic Physique ─────────────────────────────────── */
  {
    id: 'front-double-biceps',
    name: 'Doble biceps frontal',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'Pies a la anchura de los hombros, un pie ligeramente adelantado.',
      'Sube los brazos y gira las munecas para completar el pico del biceps.',
      'Baja los hombros y expande el dorsal.',
      'Aprieta abdomen y cuadriceps sin dejar de respirar.',
    ],
  },
  {
    id: 'front-lat-spread',
    name: 'Expansion dorsal frontal',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'Manos en la cintura, pulgares hacia atras.',
      'Abre el dorsal empujando los codos hacia delante.',
      'Manten el pecho alto y la cintura apretada.',
    ],
  },
  {
    id: 'side-chest',
    name: 'Pecho lateral',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'Gira de perfil, pierna cercana flexionada y apoyada en la punta.',
      'Agarra la muneca y aprieta el pectoral.',
      'Eleva el gemelo apretando la pierna de apoyo.',
    ],
  },
  {
    id: 'side-triceps',
    name: 'Triceps lateral',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'De perfil, junta las manos por detras.',
      'Extiende el brazo cercano manteniendo el codo pegado.',
      'Saca pecho y aprieta el gemelo.',
    ],
  },
  {
    id: 'back-double-biceps',
    name: 'Doble biceps de espalda',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'Un pie atras apoyado en la punta.',
      'Sube los brazos y junta las escapulas.',
      'Aprieta gluteo e isquios de la pierna de apoyo.',
    ],
  },
  {
    id: 'back-lat-spread',
    name: 'Expansion dorsal de espalda',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'Manos en la cintura, codos abiertos.',
      'Abre el dorsal lo maximo posible manteniendo la cintura estrecha.',
    ],
  },
  {
    id: 'abdominal-thigh',
    name: 'Abdominales y muslo',
    divisions: BB,
    holdSeconds: 10,
    cues: [
      'Manos detras de la cabeza, una pierna adelantada.',
      'Expulsa el aire y aprieta el abdomen.',
      'Contrae el cuadriceps de la pierna adelantada.',
    ],
  },
  {
    id: 'most-muscular',
    name: 'Most muscular',
    divisions: ['Bodybuilding'],
    holdSeconds: 8,
    cues: ['Junta las manos delante del cuerpo.', 'Contrae todo el tren superior a la vez.'],
  },
  {
    id: 'vacuum',
    name: 'Vacuum',
    divisions: ['Classic Physique'],
    holdSeconds: 8,
    cues: [
      'Expulsa todo el aire y mete el abdomen hacia dentro.',
      'Practica con el estomago vacio y sube el tiempo de forma progresiva.',
    ],
  },
  {
    id: 'classic-vacuum-pose',
    name: 'Pose clasica de medio giro',
    divisions: ['Classic Physique'],
    holdSeconds: 10,
    cues: ['Torso de tres cuartos, brazo adelantado relajado.', 'Cintura apretada y pecho alto.'],
  },

  /* ── Men's Physique ───────────────────────────────────────────────────── */
  {
    id: 'mp-front',
    name: 'Cuartos de vuelta: frente',
    divisions: PHYS,
    holdSeconds: 8,
    cues: [
      'Una mano en la cadera, otra relajada.',
      'Hombros abiertos y cintura apretada.',
      'Peso ligeramente en una pierna para dar linea.',
    ],
  },
  {
    id: 'mp-side',
    name: 'Cuartos de vuelta: perfil',
    divisions: PHYS,
    holdSeconds: 8,
    cues: ['Gira 90 grados.', 'Mete el abdomen y saca pecho.', 'Hombro cercano ligeramente atras.'],
  },
  {
    id: 'mp-back',
    name: 'Cuartos de vuelta: espalda',
    divisions: PHYS,
    holdSeconds: 8,
    cues: ['Abre el dorsal sin encoger los hombros.', 'Aprieta gluteo y mantiene la cintura estrecha.'],
  },

  /* ── Divisiones femeninas ─────────────────────────────────────────────── */
  {
    id: 'w-front',
    name: 'Frente',
    divisions: WOMEN,
    holdSeconds: 8,
    cues: [
      'Un pie adelantado, peso en la cadera trasera.',
      'Hombros atras, pecho alto y abdomen firme.',
      'Manos relajadas siguiendo la linea del cuerpo.',
    ],
  },
  {
    id: 'w-side',
    name: 'Perfil',
    divisions: WOMEN,
    holdSeconds: 8,
    cues: ['Gira de perfil manteniendo el arco lumbar natural.', 'Aprieta gluteo y estira la linea.'],
  },
  {
    id: 'w-back',
    name: 'Espalda',
    divisions: WOMEN,
    holdSeconds: 8,
    cues: ['Piernas juntas o ligeramente cruzadas.', 'Cintura estrecha y gluteo contraido.'],
  },
  {
    id: 'w-quarter',
    name: 'Cuartos de vuelta',
    divisions: WOMEN,
    holdSeconds: 8,
    cues: ['Practica la transicion entre poses: los jueces puntuan tambien como te mueves.'],
  },
];

export function posesFor(division: Division): Pose[] {
  const list = POSES.filter((p) => p.divisions.includes(division));
  return list.length ? list : POSES.filter((p) => p.divisions.includes("Men's Physique"));
}

export const POSE_BY_ID = new Map(POSES.map((p) => [p.id, p]));
