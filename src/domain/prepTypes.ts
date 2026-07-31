/**
 * Entidades restantes de la suite de competencia.
 * Todas extienden `Entity`, asi que ya son sincronizables con Supabase.
 */
import type { Entity, MacroTarget } from './types';
import type { Division } from './competition';

/* ────────────────────────────────────────────────────────── cardio ────── */

export type CardioType =
  | 'caminata'
  | 'cinta-inclinada'
  | 'bicicleta'
  | 'escaladora'
  | 'eliptica'
  | 'liss'
  | 'intervalos';

export const CARDIO_LABEL: Record<CardioType, string> = {
  caminata: 'Caminata',
  'cinta-inclinada': 'Cinta inclinada',
  bicicleta: 'Bicicleta',
  escaladora: 'Escaladora',
  eliptica: 'Eliptica',
  liss: 'LISS',
  intervalos: 'Intervalos',
};

export type Intensity = 'baja' | 'moderada' | 'alta';

export interface CardioSession extends Entity {
  date: string; // YYYY-MM-DD
  type: CardioType;
  minutes: number;
  intensity: Intensity;
  machine?: string;
  /** Pertenece a un plan semanal (no es una sesion suelta). */
  planned: boolean;
  completed: boolean;
  notes?: string;
}

export interface CardioPlan extends Entity {
  /** Lunes de la semana a la que aplica. */
  weekStart: string;
  /** Sesiones por semana previstas. */
  sessionsPerWeek: number;
  minutesPerSession: number;
  type: CardioType;
  intensity: Intensity;
  notes?: string;
}

export interface StepEntry extends Entity {
  date: string;
  steps: number;
}

/* ────────────────────────────────────────────────────────── posing ────── */

export interface Pose {
  id: string;
  name: string;
  /** Divisiones en las que esta pose es obligatoria o habitual. */
  divisions: Division[];
  cues: string[];
  /** Segundos sugeridos de mantenimiento. */
  holdSeconds: number;
}

export interface PosingSession extends Entity {
  date: string;
  division: Division;
  minutes: number;
  posesPracticed: string[]; // ids de Pose
  /** Poses marcadas como conseguidas en esta sesion. */
  checklist: Record<string, boolean>;
  notes?: string;
}

/* ──────────────────────────────────────────────────────── fotos ───────── */

export type PhotoAngle = 'frente' | 'lado-izquierdo' | 'lado-derecho' | 'espalda' | 'libre';

export const ANGLE_LABEL: Record<PhotoAngle, string> = {
  frente: 'Frente',
  'lado-izquierdo': 'Lado izquierdo',
  'lado-derecho': 'Lado derecho',
  espalda: 'Espalda',
  libre: 'Pose libre',
};

export interface ProgressPhoto extends Entity {
  date: string;
  angle: PhotoAngle;
  /** Clave del blob en IndexedDB. */
  blobId: string;
  weight?: number;
  /** Semana de prep en la que se tomo (si habia prep activo). */
  prepWeek?: number;
  notes?: string;
}

/* ───────────────────────────────────────────── refeeds y diet breaks ──── */

export type NutritionDayType =
  | 'entrenamiento'
  | 'descanso'
  | 'refeed'
  | 'diet-break'
  | 'alto'
  | 'bajo'
  | 'mantenimiento';

export const DAY_TYPE_LABEL: Record<NutritionDayType, string> = {
  entrenamiento: 'Dia de entrenamiento',
  descanso: 'Dia de descanso',
  refeed: 'Refeed',
  'diet-break': 'Diet break',
  alto: 'Dia alto',
  bajo: 'Dia bajo',
  mantenimiento: 'Mantenimiento',
};

/** Multiplicadores conservadores sobre las calorias base. */
export const DAY_TYPE_FACTOR: Record<NutritionDayType, number> = {
  entrenamiento: 1.0,
  descanso: 0.92,
  refeed: 1.25,
  'diet-break': 1.15,
  alto: 1.15,
  bajo: 0.9,
  mantenimiento: 1.2,
};

export interface NutritionDayPlan extends Entity {
  date: string;
  dayType: NutritionDayType;
  target: MacroTarget;
  /** Numero de comidas previstas. */
  meals?: number;
  waterMl?: number;
  sodiumMg?: number;
  caffeineMg?: number;
  notes?: string;
}

/* ───────────────────────────────────────────── recomendaciones ────────── */

export type RecommendationAction =
  | 'mantener'
  | 'reducir-calorias'
  | 'aumentar-calorias'
  | 'aumentar-cardio'
  | 'reducir-cardio'
  | 'recuperacion'
  | 'mejorar-adherencia';

export type RecommendationOutcome = 'pendiente' | 'aceptada' | 'rechazada' | 'modificada';

export interface PrepRecommendation extends Entity {
  weekStart: string;
  action: RecommendationAction;
  headline: string;
  reasoning: string[];
  /** Datos concretos en los que se apoya. */
  dataUsed: string[];
  /** Cambio propuesto en kcal/dia (0 si no aplica). */
  kcalDelta: number;
  /** Cambio propuesto en minutos de cardio semanales. */
  cardioMinutesDelta: number;
  estimatedImpact: string;
  confidence: 'baja' | 'media' | 'alta';
  outcome: RecommendationOutcome;
  /** Valores finales si el usuario la modifico. */
  appliedKcalDelta?: number;
  appliedCardioDelta?: number;
}

/* ─────────────────────────────────────────────────── peak week ────────── */

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  note?: string;
}

export interface PeakWeekPlan extends Entity {
  prepId: string;
  /** Lunes de la peak week. */
  weekStart: string;
  checklist: ChecklistItem[];
  /** Notas por dia, clave YYYY-MM-DD. */
  dailyNotes: Record<string, string>;
  logistics: ChecklistItem[];
  acknowledgedDisclaimer: boolean;
}

/* ─────────────────────────────────────────────────── dia del show ─────── */

export interface ShowDayItem {
  id: string;
  time: string; // HH:MM
  label: string;
  detail?: string;
  done: boolean;
}

export interface ShowDayPlan extends Entity {
  prepId: string;
  date: string;
  venue?: string;
  arrivalTime?: string;
  checkInTime?: string;
  tanningTime?: string;
  competitorNumber?: string;
  categoryTime?: string;
  music?: string;
  schedule: ShowDayItem[];
  checklist: ChecklistItem[];
  notes?: string;
}

/* ────────────────────────────────────────────────────── post-show ─────── */

export interface PostShowPlan extends Entity {
  prepId: string;
  startDate: string;
  /** Calorias de partida el dia despues del show. */
  startKcal: number;
  /** Calorias objetivo al final de la transicion. */
  targetKcal: number;
  /** Semanas previstas para la transicion. */
  weeks: number;
  notes?: string;
}

export interface PostShowEntry extends Entity {
  date: string;
  weight?: number;
  hunger?: number;
  sleep?: number;
  digestion?: number;
  mood?: number;
  adherence?: number;
  trained?: boolean;
  notes?: string;
}

/* ───────────────────────────────────────────────── recordatorios ──────── */

export type ReminderKind =
  | 'peso'
  | 'comida'
  | 'agua'
  | 'suplementos'
  | 'cardio'
  | 'pasos'
  | 'posing'
  | 'checkin'
  | 'fotos'
  | 'entrenamiento';

export const REMINDER_LABEL: Record<ReminderKind, string> = {
  peso: 'Peso en ayunas',
  comida: 'Registrar comida',
  agua: 'Beber agua',
  suplementos: 'Suplementos',
  cardio: 'Cardio',
  pasos: 'Pasos',
  posing: 'Practicar posing',
  checkin: 'Check-in semanal',
  fotos: 'Fotos de progreso',
  entrenamiento: 'Entrenamiento',
};

export interface Reminder extends Entity {
  kind: ReminderKind;
  enabled: boolean;
  /** HH:MM al que deberia aparecer. */
  time: string;
  /** Dias de la semana, 0 = domingo. Vacio = todos. */
  days: number[];
  label?: string;
}
