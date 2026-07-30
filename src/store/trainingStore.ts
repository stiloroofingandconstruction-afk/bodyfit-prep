import { create } from 'zustand';
import { newEntity, persisted, softDelete, touch } from './persist';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { BUILTIN_ROUTINES } from '@/data/routines';
import { today } from '@/lib/date';
import { nowISO, uid } from '@/lib/utils';
import type { Entity, Routine, Workout, WorkoutExercise, WorkoutSet } from '@/domain/types';

interface TrainingState {
  workouts: Workout[];
  /** Rutinas creadas por el usuario. Las de fabrica viven en `BUILTIN_ROUTINES`. */
  routines: Routine[];
  /** Sesion en curso. Se persiste: si cierras la app a mitad del entreno, sigue ahi. */
  active: Workout | null;

  startWorkout: (name: string, routineId?: string, dayIndex?: number) => void;
  addExercise: (exerciseId: string) => void;
  removeExercise: (workoutExerciseId: string) => void;
  reorderExercise: (workoutExerciseId: string, direction: -1 | 1) => void;
  addSet: (workoutExerciseId: string, seed?: Partial<WorkoutSet>) => void;
  updateSet: (workoutExerciseId: string, setId: string, patch: Partial<WorkoutSet>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  setExerciseNotes: (workoutExerciseId: string, notes: string) => void;
  finishWorkout: (rating?: number, notes?: string) => Workout | null;
  discardWorkout: () => void;

  deleteWorkout: (id: string) => void;
  saveRoutine: (routine: Omit<Routine, keyof Entity>) => Routine;
  deleteRoutine: (id: string) => void;
}

function emptySet(seed: Partial<WorkoutSet> = {}): WorkoutSet {
  return { id: uid(), weight: 0, reps: 0, done: false, type: 'normal', ...seed };
}

export const useTrainingStore = create<TrainingState>()(
  persisted<TrainingState>('training', (set, get) => ({
    workouts: [],
    routines: [],
    active: null,

    startWorkout: (name, routineId, dayIndex) => {
      const routine = routineId
        ? [...BUILTIN_ROUTINES, ...get().routines].find((r) => r.id === routineId)
        : undefined;
      const day = routine && dayIndex != null ? routine.days[dayIndex] : undefined;

      const exercises: WorkoutExercise[] = (day?.exercises ?? []).map((re) => ({
        id: uid(),
        exerciseId: re.exerciseId,
        exerciseName: EXERCISE_BY_ID.get(re.exerciseId)?.name ?? re.exerciseId,
        restSeconds: re.restSeconds,
        sets: Array.from({ length: re.sets }, () => emptySet()),
      }));

      const workout = newEntity<Omit<Workout, keyof Entity>>({
        date: today(),
        name: day ? `${routine!.name} — ${day.name}` : name,
        routineId,
        startedAt: nowISO(),
        exercises,
      }) as Workout;

      set({ active: workout });
    },

    addExercise: (exerciseId) =>
      set((s) => {
        if (!s.active) return s;
        const ex: WorkoutExercise = {
          id: uid(),
          exerciseId,
          exerciseName: EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId,
          sets: [emptySet(), emptySet(), emptySet()],
          restSeconds: 120,
        };
        return { active: { ...s.active, exercises: [...s.active.exercises, ex] } };
      }),

    removeExercise: (workoutExerciseId) =>
      set((s) =>
        s.active
          ? {
              active: {
                ...s.active,
                exercises: s.active.exercises.filter((e) => e.id !== workoutExerciseId),
              },
            }
          : s,
      ),

    reorderExercise: (workoutExerciseId, direction) =>
      set((s) => {
        if (!s.active) return s;
        const list = [...s.active.exercises];
        const i = list.findIndex((e) => e.id === workoutExerciseId);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= list.length) return s;
        [list[i], list[j]] = [list[j], list[i]];
        return { active: { ...s.active, exercises: list } };
      }),

    addSet: (workoutExerciseId, seed) =>
      set((s) => {
        if (!s.active) return s;
        return {
          active: {
            ...s.active,
            exercises: s.active.exercises.map((e) => {
              if (e.id !== workoutExerciseId) return e;
              const last = e.sets[e.sets.length - 1];
              return {
                ...e,
                sets: [
                  ...e.sets,
                  emptySet({ weight: last?.weight ?? 0, reps: last?.reps ?? 0, ...seed }),
                ],
              };
            }),
          },
        };
      }),

    updateSet: (workoutExerciseId, setId, patch) =>
      set((s) => {
        if (!s.active) return s;
        return {
          active: {
            ...s.active,
            exercises: s.active.exercises.map((e) =>
              e.id !== workoutExerciseId
                ? e
                : { ...e, sets: e.sets.map((st) => (st.id === setId ? { ...st, ...patch } : st)) },
            ),
          },
        };
      }),

    removeSet: (workoutExerciseId, setId) =>
      set((s) => {
        if (!s.active) return s;
        return {
          active: {
            ...s.active,
            exercises: s.active.exercises.map((e) =>
              e.id !== workoutExerciseId ? e : { ...e, sets: e.sets.filter((st) => st.id !== setId) },
            ),
          },
        };
      }),

    setExerciseNotes: (workoutExerciseId, notes) =>
      set((s) =>
        s.active
          ? {
              active: {
                ...s.active,
                exercises: s.active.exercises.map((e) =>
                  e.id === workoutExerciseId ? { ...e, notes } : e,
                ),
              },
            }
          : s,
      ),

    finishWorkout: (rating, notes) => {
      const active = get().active;
      if (!active) return null;
      // Se descartan las series vacias para no ensuciar el historial
      const exercises = active.exercises
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps > 0) }))
        .filter((e) => e.sets.length > 0);

      const finished = touch(active, {
        finishedAt: nowISO(),
        exercises,
        ...(rating != null ? { rating } : {}),
        ...(notes ? { notes } : {}),
      });

      set((s) => ({ workouts: [...s.workouts, finished], active: null }));
      return finished;
    },

    discardWorkout: () => set({ active: null }),

    deleteWorkout: (id) =>
      set((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? softDelete(w) : w)) })),

    saveRoutine: (routine) => {
      const created = newEntity(routine) as Routine;
      set((s) => ({ routines: [...s.routines, created] }));
      return created;
    },

    deleteRoutine: (id) =>
      set((s) => ({ routines: s.routines.map((r) => (r.id === id ? softDelete(r) : r)) })),
  })),
);
