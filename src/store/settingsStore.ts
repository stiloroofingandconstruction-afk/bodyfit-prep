import { create } from 'zustand';
import { persisted, newEntity, softDelete, touch } from './persist';
import { setLocale, type Locale } from '@/i18n';
import type { WeightUnit, LengthUnit } from '@/domain/units';
import type { Division } from '@/domain/competition';
import type { ExerciseMedia } from '@/domain/types';
import type { Reminder, ReminderKind } from '@/domain/prepTypes';

export type Experience = 'principiante' | 'intermedio' | 'avanzado' | 'competidor';

interface SettingsState {
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  locale: Locale;

  /** Modo competencia: cambia el dashboard y habilita el modulo de prep. */
  competitionMode: boolean;
  division: Division;
  experience: Experience;
  trainingDaysPerWeek: number;

  /** Molestias declaradas por el usuario, en texto libre. */
  discomforts: string[];
  /** Ids de ejercicios que el usuario prefiere evitar. */
  avoidedExercises: string[];
  /** Ids de alimentos excluidos del generador. */
  excludedFoods: string[];

  stepGoal: number;
  /** Objetivo de agua diaria en ml. */
  waterGoalMl: number;

  /** Media propia por ejercicio: {exerciseId: media}. */
  exerciseMedia: Record<string, ExerciseMedia>;

  reminders: Reminder[];

  /** El usuario ya vio el aviso general de la app. */
  acknowledgedDisclaimer: boolean;

  setUnits: (patch: Partial<Pick<SettingsState, 'weightUnit' | 'lengthUnit'>>) => void;
  setLocaleSetting: (locale: Locale) => void;
  update: (patch: Partial<SettingsState>) => void;
  toggleAvoidedExercise: (id: string) => void;
  toggleExcludedFood: (id: string) => void;
  setExerciseMedia: (exerciseId: string, media: ExerciseMedia) => void;
  clearExerciseMedia: (exerciseId: string) => void;
  addReminder: (kind: ReminderKind, time: string, days?: number[]) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persisted<SettingsState>(
    'settings',
    (set) => ({
      weightUnit: 'kg',
      lengthUnit: 'cm',
      locale: 'es',
      competitionMode: false,
      division: "Men's Physique",
      experience: 'intermedio',
      trainingDaysPerWeek: 4,
      discomforts: [],
      avoidedExercises: [],
      excludedFoods: [],
      stepGoal: 10000,
      waterGoalMl: 3000,
      exerciseMedia: {},
      reminders: [],
      acknowledgedDisclaimer: false,

      setUnits: (patch) => set(patch),

      setLocaleSetting: (locale) => {
        setLocale(locale);
        set({ locale });
      },

      update: (patch) => set(patch),

      toggleAvoidedExercise: (id) =>
        set((s) => ({
          avoidedExercises: s.avoidedExercises.includes(id)
            ? s.avoidedExercises.filter((x) => x !== id)
            : [...s.avoidedExercises, id],
        })),

      toggleExcludedFood: (id) =>
        set((s) => ({
          excludedFoods: s.excludedFoods.includes(id)
            ? s.excludedFoods.filter((x) => x !== id)
            : [...s.excludedFoods, id],
        })),

      setExerciseMedia: (exerciseId, media) =>
        set((s) => ({ exerciseMedia: { ...s.exerciseMedia, [exerciseId]: media } })),

      clearExerciseMedia: (exerciseId) =>
        set((s) => {
          const next = { ...s.exerciseMedia };
          delete next[exerciseId];
          return { exerciseMedia: next };
        }),

      addReminder: (kind, time, days = []) => {
        const reminder = newEntity({ kind, time, days, enabled: true }) as Reminder;
        set((s) => ({ reminders: [...s.reminders, reminder] }));
      },

      updateReminder: (id, patch) =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? touch(r, patch) : r)),
        })),

      removeReminder: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? softDelete(r) : r)) })),
    }),
    {
      onRehydrateStorage: () => (state) => {
        if (state?.locale) setLocale(state.locale);
      },
    },
  ),
);
