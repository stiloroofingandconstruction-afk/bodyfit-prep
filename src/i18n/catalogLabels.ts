/**
 * Etiquetas traducidas de los catalogos grandes.
 *
 * Separadas de `labels.ts` porque importan el catalogo de ejercicios y el de
 * alimentos. Solo las cargan las pantallas que ya trabajan con esos catalogos,
 * asi que el resto de la app no paga su peso.
 *
 * Los NOMBRES de los ejercicios y de los alimentos siguen en espanol: son
 * contenido, no interfaz, y traducirlos exigiria reescribir tambien las 16
 * fichas tecnicas de cada uno.
 */
import { getLocale } from './index';
import { DIFFICULTY_LABEL, LUMBAR_LABEL, MUSCLE_LABEL, PATTERN_LABEL } from '@/data/exercises';
import { CATEGORY_LABEL, ROLE_LABEL } from '@/data/foods';
import type { Difficulty, LumbarLoad, MovementPattern, MuscleGroup } from '@bodyfit/domain/types';
import type { FoodCategory, FoodRole } from '@bodyfit/domain/types';

const EN_MUSCLE: Record<MuscleGroup, string> = {
  pecho: 'Chest',
  espalda: 'Back',
  hombro: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  cuadriceps: 'Quads',
  femoral: 'Hamstrings',
  gluteo: 'Glutes',
  gemelo: 'Calves',
  core: 'Core',
  antebrazo: 'Forearms',
  cardio: 'Cardio',
};

const EN_PATTERN: Record<MovementPattern, string> = {
  'empuje-horizontal': 'Horizontal push',
  'empuje-vertical': 'Vertical push',
  'traccion-horizontal': 'Horizontal pull',
  'traccion-vertical': 'Vertical pull',
  sentadilla: 'Squat',
  bisagra: 'Hip hinge',
  zancada: 'Lunge',
  aislamiento: 'Isolation',
  'core-antiextension': 'Core anti-extension',
  'core-antirotacion': 'Core anti-rotation',
  movilidad: 'Mobility',
  cardio: 'Cardio',
  transporte: 'Carry',
};

const EN_DIFFICULTY: Record<Difficulty, string> = {
  principiante: 'Beginner',
  intermedio: 'Intermediate',
  avanzado: 'Advanced',
};

const EN_LUMBAR: Record<LumbarLoad, string> = {
  bajo: 'Low lower-back load',
  moderado: 'Moderate lower-back load',
  alto: 'High lower-back load',
};

const EN_CATEGORY: Record<FoodCategory, string> = {
  proteina: 'Protein',
  carbohidrato: 'Carbohydrate',
  grasa: 'Fat',
  verdura: 'Vegetable',
  fruta: 'Fruit',
  lacteo: 'Dairy',
  suplemento: 'Supplement',
  bebida: 'Drink',
  snack: 'Snack',
  condimento: 'Condiment',
};

const EN_ROLE: Record<FoodRole, string> = {
  protein: 'Protein',
  carb: 'Carbohydrate',
  fat: 'Fat',
  veg: 'Vegetable',
  free: 'Free',
};

function pick<K extends string>(es: Record<K, string>, en: Record<K, string>, key: K): string {
  return (getLocale() === 'en' ? en[key] : es[key]) ?? key;
}

export const muscleLabel = (k: MuscleGroup): string => pick(MUSCLE_LABEL, EN_MUSCLE, k);
export const patternLabel = (k: MovementPattern): string => pick(PATTERN_LABEL, EN_PATTERN, k);
export const difficultyLabel = (k: Difficulty): string => pick(DIFFICULTY_LABEL, EN_DIFFICULTY, k);
export const lumbarLabel = (k: LumbarLoad): string => pick(LUMBAR_LABEL, EN_LUMBAR, k);
export const foodCategoryLabel = (k: FoodCategory): string => pick(CATEGORY_LABEL, EN_CATEGORY, k);
export const foodRoleLabel = (k: FoodRole): string => pick(ROLE_LABEL, EN_ROLE, k);

export const EN_CATALOG_MAPS = {
  muscle: EN_MUSCLE,
  pattern: EN_PATTERN,
  difficulty: EN_DIFFICULTY,
  lumbar: EN_LUMBAR,
  category: EN_CATEGORY,
  role: EN_ROLE,
};

export const ES_CATALOG_MAPS = {
  muscle: MUSCLE_LABEL,
  pattern: PATTERN_LABEL,
  difficulty: DIFFICULTY_LABEL,
  lumbar: LUMBAR_LABEL,
  category: CATEGORY_LABEL,
  role: ROLE_LABEL,
};
