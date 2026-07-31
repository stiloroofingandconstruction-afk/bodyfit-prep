/**
 * Modelo de dominio de BodyFit Prep.
 *
 * Todo registro persistido extiende `Entity`: id/createdAt/updatedAt/deletedAt.
 * Esos campos son los que permitiran sincronizar con Supabase mas adelante sin
 * migrar datos (soft delete + last-write-wins por updatedAt).
 */

export interface Entity {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt?: string | null;
  userId?: string | null; // lo rellenara Supabase; null en modo local
}

/* ------------------------------------------------------------------ macros */

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export type MacroKey = keyof Macros;

/* --------------------------------------------------------------- alimentos */

export type FoodCategory =
  | 'proteina'
  | 'carbohidrato'
  | 'grasa'
  | 'verdura'
  | 'fruta'
  | 'lacteo'
  | 'suplemento'
  | 'bebida'
  | 'snack'
  | 'condimento';

/** Rol nutricional que usa el generador automatico de comidas. */
export type FoodRole = 'protein' | 'carb' | 'fat' | 'veg' | 'free';

export interface ServingSize {
  label: string; // "1 taza", "1 scoop", "1 unidad mediana"
  grams: number;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  aliases: string[]; // terminos alternativos de busqueda
  category: FoodCategory;
  role: FoodRole;
  /** Macros por 100 g (o 100 ml si unit === 'ml'). */
  per100: Macros;
  unit: 'g' | 'ml';
  servings?: ServingSize[];
  /** Estado del alimento: crudo o cocido (importante en arroz, pasta, avena). */
  state?: 'crudo' | 'cocido';
  custom?: boolean;
}

/** Alimento creado por el usuario (se persiste). */
export interface CustomFood extends Entity, Omit<Food, 'id'> {
  custom: true;
}

/* ---------------------------------------------------------------- nutricion */

export type MealSlot = 'desayuno' | 'almuerzo' | 'cena' | 'snack' | 'pre' | 'post';

export interface FoodEntry extends Entity {
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  foodId: string;
  foodName: string; // desnormalizado: el historial no se rompe si borras el alimento
  grams: number;
  macros: Macros; // ya calculados para la cantidad registrada
}

export interface Recipe extends Entity {
  name: string;
  items: { foodId: string; grams: number }[];
}

/* ------------------------------------------------------------ entrenamiento */

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombro'
  | 'biceps'
  | 'triceps'
  | 'cuadriceps'
  | 'femoral'
  | 'gluteo'
  | 'gemelo'
  | 'core'
  | 'antebrazo'
  | 'cardio';

export type Equipment =
  | 'barra'
  | 'mancuerna'
  | 'maquina'
  | 'polea'
  | 'peso corporal'
  | 'banda'
  | 'kettlebell'
  | 'otro';

export type Difficulty = 'principiante' | 'intermedio' | 'avanzado';

export type MovementPattern =
  | 'empuje-horizontal'
  | 'empuje-vertical'
  | 'traccion-horizontal'
  | 'traccion-vertical'
  | 'sentadilla'
  | 'bisagra'
  | 'zancada'
  | 'aislamiento'
  | 'core-antiextension'
  | 'core-antirotacion'
  | 'movilidad'
  | 'cardio'
  | 'transporte';

/** Cuanta carga impone el ejercicio sobre la zona lumbar. */
export type LumbarLoad = 'bajo' | 'moderado' | 'alto';

/** Guia de tecnica. Contenido propio, sin material de terceros. */
export interface ExerciseTechnique {
  /** Resumen de una frase: lo que hay que retener si solo lees una linea. */
  summary: string;
  /** Preparacion: material, alturas, agarres. */
  setup: string[];
  /** Posicion inicial exacta antes de la primera repeticion. */
  startPosition: string[];
  /** Ejecucion paso a paso. */
  execution: string[];
  breathing: string;
  rangeOfMotion: string;
  /** Tempo sugerido, formato excentrica-pausa-concentrica-pausa. */
  tempo: string;
  commonMistakes: string[];
  /** Senales observables de que la tecnica se esta rompiendo. */
  warningSigns: string[];
  safety: string[];
  hypertrophy: string[];
  strength: string[];
  /** Advertencias especificas del ejercicio. */
  warnings: string[];
  /** Contraindicaciones generales, no consejo medico. */
  contraindications: string[];
  /** Como adaptarlo con sensibilidad lumbar. Ausente si no aplica. */
  lumbarAdaptation?: string;
  /** true cuando la guia esta escrita a mano para este ejercicio concreto. */
  authored?: boolean;
}

/**
 * Media del ejercicio. Todo es opcional y configurable por el usuario: la app
 * no incrusta videos de terceros que puedan desaparecer o tener copyright.
 */
export interface ExerciseMedia {
  /** URL propia de un MP4. */
  videoUrl?: string;
  /** URL propia de un WebM (se ofrece antes que el MP4 si existe). */
  videoWebmUrl?: string;
  /** Id de YouTube configurado por el usuario. */
  youtubeId?: string;
  /** Imagen de portada del video. */
  videoPoster?: string;
  /** Imagen estatica ilustrativa. */
  imageUrl?: string;
  /** Duracion aproximada en segundos. */
  durationSeconds?: number;
  /** Autor o canal de origen. */
  source?: string;
  /** Licencia o permiso bajo el que se usa. */
  license?: string;
  /** Fecha en la que se reviso el enlace, YYYY-MM-DD. */
  reviewedAt?: string;
  /**
   * El usuario confirma que reviso la fuente y tiene permiso o licencia.
   * Sin esto, la app muestra un aviso de "sin verificar".
   */
  verified?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  aliases?: string[];
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  equipment: Equipment;
  /** Ejercicio compuesto: pesa mas en el calculo de fatiga/volumen. */
  compound: boolean;
  unilateral?: boolean;
  difficulty: Difficulty;
  pattern: MovementPattern;
  lumbarLoad: LumbarLoad;
  /** Ejercicios equivalentes para el mismo objetivo. */
  substitutions: string[];
  /** Versiones mas faciles. */
  regressions: string[];
  /** Versiones mas exigentes. */
  progressions: string[];
  /** Alternativas cuando hay sensibilidad lumbar. */
  lumbarSafeAlternatives?: string[];
  technique: ExerciseTechnique;
  media?: ExerciseMedia;
  tags: string[];
}

export interface WorkoutSet {
  id: string;
  weight: number; // kg
  reps: number;
  rpe?: number; // 5–10
  done: boolean;
  type: 'normal' | 'calentamiento' | 'fallo' | 'dropset';
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
  restSeconds?: number;
}

export interface Workout extends Entity {
  date: string; // YYYY-MM-DD
  name: string;
  routineId?: string;
  startedAt: string;
  finishedAt?: string;
  exercises: WorkoutExercise[];
  notes?: string;
  /** Sensacion global 1–5. */
  rating?: number;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  repRange: [number, number];
  restSeconds: number;
}

export interface Routine extends Entity {
  name: string;
  description?: string;
  days: { name: string; exercises: RoutineExercise[] }[];
  builtin?: boolean;
}

/* ------------------------------------------------------- seguimiento fisico */

export interface BodyMeasurement extends Entity {
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  bodyFat?: number; // % (manual o calculado)
  neck?: number; // cm
  waist?: number;
  hip?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
  shoulder?: number;
  photoIds?: string[]; // claves en IndexedDB
  notes?: string;
}

/* ---------------------------------------------------------------- check-in */

export interface WeeklyCheckin extends Entity {
  weekStart: string; // YYYY-MM-DD (lunes)
  avgWeight: number;
  weightChange: number; // kg vs semana anterior
  waist?: number;
  adherence: number; // 0–100 %
  energy: number; // 1–5
  sleep: number; // 1–5
  hunger: number; // 1–5
  stress: number; // 1–5
  workoutsCompleted: number;
  avgKcal?: number;
  notes?: string;
  /** Ajuste de calorias aplicado tras el check-in. */
  kcalAdjustment?: number;
  newKcalTarget?: number;
}

/* ----------------------------------------------------------------- perfil */

export type Sex = 'hombre' | 'mujer';
export type Goal = 'definicion' | 'mantenimiento' | 'volumen';
export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'alto' | 'atleta';

export interface Profile {
  name: string;
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  startWeight: number;
  goalWeight?: number;
  activity: ActivityLevel;
  goal: Goal;
  /** Ritmo objetivo en % del peso corporal por semana (0.25–1.0). */
  paceWeekPct: number;
  /** g de proteina por kg de peso corporal. */
  proteinPerKg: number;
  /** g de grasa por kg de peso corporal. */
  fatPerKg: number;
  /** Override manual de calorias; si es null se calcula desde TDEE + objetivo. */
  kcalOverride: number | null;
  units: 'metric' | 'imperial';
  onboarded: boolean;
}

export interface MacroTarget {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
