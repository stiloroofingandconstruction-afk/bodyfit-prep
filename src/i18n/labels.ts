/**
 * Etiquetas de enumeraciones traducidas.
 *
 * Los modulos de dominio guardan sus etiquetas en espanol porque tambien las
 * usan las exportaciones CSV y el informe para el coach, que no dependen del
 * idioma de la interfaz. Aqui se anaden las inglesas y se elige segun el idioma
 * activo, sin tocar el dominio.
 *
 * Solo importa modulos de dominio pequenos. Las etiquetas del catalogo de
 * ejercicios y de alimentos viven en `catalogLabels.ts` para no arrastrar esos
 * catalogos a pantallas que no los necesitan.
 */
import { getLocale } from './index';
import { ACTIVITY_LABEL, GOAL_LABEL } from '@/domain/energy';
import { ANGLE_LABEL, CARDIO_LABEL, DAY_TYPE_LABEL, REMINDER_LABEL } from '@/domain/prepTypes';
import { PROJECTION_LABEL } from '@/domain/competition';
import { ACTION_LABEL } from '@/domain/recommendations';
import { DIRECTION_LABEL } from '@/domain/weeklySummary';
import type { ActivityLevel, Goal } from '@/domain/types';
import type {
  CardioType,
  NutritionDayType,
  PhotoAngle,
  RecommendationAction,
  ReminderKind,
} from '@/domain/prepTypes';
import type { Projection } from '@/domain/competition';
import type { Direction } from '@/domain/weeklySummary';

const EN_ACTIVITY: Record<ActivityLevel, string> = {
  sedentario: 'Sedentary — desk job, no exercise',
  ligero: 'Light — 1-3 sessions per week',
  moderado: 'Moderate — 3-5 sessions per week',
  alto: 'High — 6-7 sessions per week',
  atleta: 'Athlete — two-a-days or physical work',
};

const EN_GOAL: Record<Goal, string> = {
  definicion: 'Cutting',
  mantenimiento: 'Maintenance',
  volumen: 'Bulking',
};

const EN_CARDIO: Record<CardioType, string> = {
  caminata: 'Walking',
  'cinta-inclinada': 'Incline treadmill',
  bicicleta: 'Bike',
  escaladora: 'Stair climber',
  eliptica: 'Elliptical',
  liss: 'LISS',
  intervalos: 'Intervals',
};

const EN_ANGLE: Record<PhotoAngle, string> = {
  frente: 'Front',
  'lado-izquierdo': 'Left side',
  'lado-derecho': 'Right side',
  espalda: 'Back',
  libre: 'Free pose',
};

const EN_DAY_TYPE: Record<NutritionDayType, string> = {
  entrenamiento: 'Training day',
  descanso: 'Rest day',
  refeed: 'Refeed',
  'diet-break': 'Diet break',
  alto: 'High day',
  bajo: 'Low day',
  mantenimiento: 'Maintenance',
};

const EN_REMINDER: Record<ReminderKind, string> = {
  peso: 'Fasted weigh-in',
  comida: 'Log a meal',
  agua: 'Drink water',
  suplementos: 'Supplements',
  cardio: 'Cardio',
  pasos: 'Steps',
  posing: 'Practise posing',
  checkin: 'Weekly check-in',
  fotos: 'Progress photos',
  entrenamiento: 'Training',
};

const EN_PROJECTION: Record<Projection['status'], string> = {
  'sin-datos': 'Not enough data',
  'en-ritmo': 'On track',
  'ligeramente-fuera': 'Slightly off track',
  'fuera-de-ritmo': 'Off track',
  'sin-objetivo': 'No target set',
};

const EN_ACTION: Record<RecommendationAction, string> = {
  mantener: 'Hold',
  'reducir-calorias': 'Reduce calories',
  'aumentar-calorias': 'Increase calories',
  'aumentar-cardio': 'Increase cardio',
  'reducir-cardio': 'Reduce cardio',
  recuperacion: 'Recover',
  'mejorar-adherencia': 'Improve adherence',
};

const EN_DIRECTION: Record<Direction, string> = {
  mejoro: 'Improved',
  empeoro: 'Worsened',
  igual: 'Held steady',
  'sin-datos': 'No data',
};

/** Elige la tabla del idioma activo. */
function pick<K extends string>(es: Record<K, string>, en: Record<K, string>, key: K): string {
  return (getLocale() === 'en' ? en[key] : es[key]) ?? key;
}

/** Fases del prep: etiqueta y foco. */
const EN_PHASE: Record<string, { label: string; focus: string }> = {
  'preparacion-inicial': {
    label: 'Early preparation',
    focus: 'Build habits, measure consistently and establish your baseline.',
  },
  'perdida-progresiva': {
    label: 'Progressive fat loss',
    focus: 'Sustainable pace, strength and adherence first.',
  },
  'fase-avanzada': {
    label: 'Advanced phase',
    focus: 'Finer adjustments; watch fatigue, sleep and performance.',
  },
  'ultimas-cuatro': {
    label: 'Final four weeks',
    focus: 'Sharpen conditioning, pose daily, close out the logistics.',
  },
  'peak-week': {
    label: 'Peak week',
    focus: 'Known routine, zero experiments. Logistics and rest.',
  },
  'dia-del-show': {
    label: 'Show day',
    focus: 'Schedule, familiar meals and enjoy the stage.',
  },
  'post-show': {
    label: 'Post-show',
    focus: 'Gradual return, rebuild performance and health.',
  },
};

export function phaseLabel(phase: { id: string; label: string }): string {
  return getLocale() === 'en' ? (EN_PHASE[phase.id]?.label ?? phase.label) : phase.label;
}

export function phaseFocus(phase: { id: string; focus: string }): string {
  return getLocale() === 'en' ? (EN_PHASE[phase.id]?.focus ?? phase.focus) : phase.focus;
}

export const activityLabel = (k: ActivityLevel): string => pick(ACTIVITY_LABEL, EN_ACTIVITY, k);
export const goalLabel = (k: Goal): string => pick(GOAL_LABEL, EN_GOAL, k);
export const cardioLabel = (k: CardioType): string => pick(CARDIO_LABEL, EN_CARDIO, k);
export const angleLabel = (k: PhotoAngle): string => pick(ANGLE_LABEL, EN_ANGLE, k);
export const dayTypeLabel = (k: NutritionDayType): string => pick(DAY_TYPE_LABEL, EN_DAY_TYPE, k);
export const reminderLabel = (k: ReminderKind): string => pick(REMINDER_LABEL, EN_REMINDER, k);
export const projectionLabel = (k: Projection['status']): string =>
  pick(PROJECTION_LABEL, EN_PROJECTION, k);
export const actionLabel = (k: RecommendationAction): string => pick(ACTION_LABEL, EN_ACTION, k);
export const directionLabel = (k: Direction): string => pick(DIRECTION_LABEL, EN_DIRECTION, k);

/** Tablas inglesas expuestas para la prueba de paridad. */
export const EN_LABEL_MAPS = {
  activity: EN_ACTIVITY,
  goal: EN_GOAL,
  cardio: EN_CARDIO,
  angle: EN_ANGLE,
  dayType: EN_DAY_TYPE,
  reminder: EN_REMINDER,
  projection: EN_PROJECTION,
  action: EN_ACTION,
  direction: EN_DIRECTION,
};

export const ES_LABEL_MAPS = {
  activity: ACTIVITY_LABEL,
  goal: GOAL_LABEL,
  cardio: CARDIO_LABEL,
  angle: ANGLE_LABEL,
  dayType: DAY_TYPE_LABEL,
  reminder: REMINDER_LABEL,
  projection: PROJECTION_LABEL,
  action: ACTION_LABEL,
  direction: DIRECTION_LABEL,
};
