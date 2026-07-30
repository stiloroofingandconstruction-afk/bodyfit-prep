import type { Routine, RoutineExercise } from '@/domain/types';

function ex(exerciseId: string, sets: number, lo: number, hi: number, rest = 120): RoutineExercise {
  return { exerciseId, sets, repRange: [lo, hi], restSeconds: rest };
}

const STAMP = {
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  builtin: true as const,
};

/** Rutinas de fabrica. Se pueden duplicar y editar; no se borran. */
export const BUILTIN_ROUTINES: Routine[] = [
  {
    ...STAMP,
    id: 'builtin-ppl',
    name: 'Push / Pull / Legs',
    description: 'Seis dias. El estandar para hipertrofia con frecuencia 2.',
    days: [
      {
        name: 'Push A',
        exercises: [
          ex('press-banca', 4, 6, 8, 150),
          ex('press-hombro-mancuerna', 3, 8, 10),
          ex('press-inclinado-mancuerna', 3, 8, 12),
          ex('elevaciones-laterales', 4, 12, 15, 60),
          ex('extension-polea', 3, 10, 12, 60),
          ex('press-frances', 3, 8, 12, 75),
        ],
      },
      {
        name: 'Pull A',
        exercises: [
          ex('dominadas', 4, 6, 10, 150),
          ex('remo-barra', 4, 8, 10, 120),
          ex('jalon-pecho', 3, 10, 12),
          ex('face-pull', 3, 12, 15, 60),
          ex('curl-barra', 3, 8, 12, 75),
          ex('curl-martillo', 3, 10, 12, 60),
        ],
      },
      {
        name: 'Legs A',
        exercises: [
          ex('sentadilla', 4, 5, 8, 180),
          ex('peso-muerto-rumano', 3, 8, 10, 150),
          ex('prensa', 3, 10, 12, 120),
          ex('curl-femoral', 3, 10, 12, 75),
          ex('extension-cuadriceps', 3, 12, 15, 60),
          ex('gemelo-de-pie', 4, 12, 15, 45),
        ],
      },
      {
        name: 'Push B',
        exercises: [
          ex('press-inclinado-barra', 4, 6, 8, 150),
          ex('press-militar', 3, 6, 8, 120),
          ex('pec-deck', 3, 12, 15, 60),
          ex('elevaciones-laterales', 4, 12, 20, 45),
          ex('fondos-pecho', 3, 8, 12, 90),
          ex('extension-sobre-cabeza', 3, 10, 12, 60),
        ],
      },
      {
        name: 'Pull B',
        exercises: [
          ex('peso-muerto', 3, 4, 6, 210),
          ex('remo-polea', 4, 10, 12),
          ex('jalon-pecho', 3, 12, 15),
          ex('pajaro', 3, 15, 20, 45),
          ex('curl-predicador', 3, 10, 12, 60),
          ex('encogimiento', 3, 12, 15, 60),
        ],
      },
      {
        name: 'Legs B',
        exercises: [
          ex('sentadilla-frontal', 4, 6, 8, 180),
          ex('hip-thrust', 4, 8, 12, 120),
          ex('bulgara', 3, 10, 12, 90),
          ex('curl-femoral-sentado', 3, 12, 15, 60),
          ex('extension-cuadriceps', 3, 15, 20, 60),
          ex('gemelo-sentado', 4, 15, 20, 45),
        ],
      },
    ],
  },
  {
    ...STAMP,
    id: 'builtin-upper-lower',
    name: 'Upper / Lower',
    description: 'Cuatro dias. El mejor equilibrio entre resultados y vida real.',
    days: [
      {
        name: 'Upper A (fuerza)',
        exercises: [
          ex('press-banca', 4, 5, 6, 180),
          ex('remo-barra', 4, 6, 8, 150),
          ex('press-militar', 3, 6, 8, 120),
          ex('jalon-pecho', 3, 8, 10),
          ex('curl-barra', 3, 8, 10, 75),
          ex('extension-polea', 3, 10, 12, 60),
        ],
      },
      {
        name: 'Lower A (fuerza)',
        exercises: [
          ex('sentadilla', 4, 5, 6, 210),
          ex('peso-muerto-rumano', 3, 8, 10, 150),
          ex('prensa', 3, 10, 12, 120),
          ex('curl-femoral', 3, 10, 12, 75),
          ex('gemelo-de-pie', 4, 12, 15, 45),
          ex('plancha', 3, 30, 60, 45),
        ],
      },
      {
        name: 'Upper B (volumen)',
        exercises: [
          ex('press-inclinado-mancuerna', 4, 8, 12, 120),
          ex('dominadas', 4, 8, 12, 120),
          ex('press-hombro-mancuerna', 3, 10, 12),
          ex('remo-polea', 3, 12, 15),
          ex('elevaciones-laterales', 4, 12, 20, 45),
          ex('curl-martillo', 3, 10, 12, 60),
          ex('press-frances', 3, 10, 12, 60),
        ],
      },
      {
        name: 'Lower B (volumen)',
        exercises: [
          ex('hack-squat', 4, 8, 12, 150),
          ex('hip-thrust', 4, 10, 12, 120),
          ex('zancadas', 3, 10, 12, 90),
          ex('curl-femoral-sentado', 4, 12, 15, 60),
          ex('extension-cuadriceps', 3, 15, 20, 60),
          ex('gemelo-sentado', 4, 15, 20, 45),
        ],
      },
    ],
  },
  {
    ...STAMP,
    id: 'builtin-fullbody',
    name: 'Full Body 3 dias',
    description: 'Tres dias. Maximo estimulo por sesion, ideal en definicion.',
    days: [
      {
        name: 'Dia A',
        exercises: [
          ex('sentadilla', 3, 6, 8, 180),
          ex('press-banca', 3, 6, 8, 150),
          ex('remo-barra', 3, 8, 10, 120),
          ex('elevaciones-laterales', 3, 12, 15, 60),
          ex('curl-mancuerna', 2, 10, 12, 60),
          ex('plancha', 3, 30, 60, 45),
        ],
      },
      {
        name: 'Dia B',
        exercises: [
          ex('peso-muerto', 3, 5, 6, 210),
          ex('press-militar', 3, 6, 8, 150),
          ex('jalon-pecho', 3, 10, 12, 90),
          ex('prensa', 3, 10, 12, 120),
          ex('extension-polea', 3, 10, 12, 60),
          ex('gemelo-de-pie', 3, 12, 15, 45),
        ],
      },
      {
        name: 'Dia C',
        exercises: [
          ex('sentadilla-frontal', 3, 8, 10, 150),
          ex('press-inclinado-mancuerna', 3, 8, 12, 120),
          ex('dominadas', 3, 6, 10, 120),
          ex('hip-thrust', 3, 10, 12, 90),
          ex('pajaro', 3, 15, 20, 45),
          ex('curl-martillo', 2, 10, 12, 60),
        ],
      },
    ],
  },
];
