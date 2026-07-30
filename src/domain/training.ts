import type { MuscleGroup, Workout, WorkoutExercise, WorkoutSet } from './types';

/** 1RM estimado — formula de Epley. Valida hasta ~12 repeticiones. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function isWorkingSet(s: WorkoutSet): boolean {
  return s.done && s.type !== 'calentamiento' && s.reps > 0;
}

/** Volumen = suma de peso x repeticiones de las series efectivas. */
export function exerciseVolume(ex: WorkoutExercise): number {
  return ex.sets.reduce((acc, s) => (isWorkingSet(s) ? acc + s.weight * s.reps : acc), 0);
}

export function workoutVolume(w: Workout): number {
  return Math.round(w.exercises.reduce((acc, ex) => acc + exerciseVolume(ex), 0));
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((acc, ex) => acc + ex.sets.filter(isWorkingSet).length, 0);
}

export function workoutRepCount(w: Workout): number {
  return w.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((a, s) => (isWorkingSet(s) ? a + s.reps : a), 0),
    0,
  );
}

export function workoutDurationMin(w: Workout): number | null {
  if (!w.finishedAt) return null;
  const ms = new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

/** Mejor serie del ejercicio segun 1RM estimado. */
export function bestSet(ex: WorkoutExercise): { set: WorkoutSet; e1rm: number } | null {
  let best: { set: WorkoutSet; e1rm: number } | null = null;
  for (const s of ex.sets) {
    if (!isWorkingSet(s)) continue;
    const e1rm = estimate1RM(s.weight, s.reps);
    if (!best || e1rm > best.e1rm) best = { set: s, e1rm };
  }
  return best;
}

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  e1rm: number;
  weight: number;
  reps: number;
  date: string;
}

/** Mejor marca historica por ejercicio. */
export function personalRecords(workouts: Workout[]): Map<string, ExercisePR> {
  const prs = new Map<string, ExercisePR>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const b = bestSet(ex);
      if (!b) continue;
      const cur = prs.get(ex.exerciseId);
      if (!cur || b.e1rm > cur.e1rm) {
        prs.set(ex.exerciseId, {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          e1rm: b.e1rm,
          weight: b.set.weight,
          reps: b.set.reps,
          date: w.date,
        });
      }
    }
  }
  return prs;
}

/** Series efectivas por grupo muscular (el secundario cuenta la mitad). */
export function volumeByMuscle(
  workouts: Workout[],
  exerciseMuscles: Map<string, { primary: MuscleGroup; secondary?: MuscleGroup[] }>,
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const sets = ex.sets.filter(isWorkingSet).length;
      if (!sets) continue;
      const info = exerciseMuscles.get(ex.exerciseId);
      if (!info) continue;
      acc[info.primary] = (acc[info.primary] ?? 0) + sets;
      for (const m of info.secondary ?? []) acc[m] = (acc[m] ?? 0) + sets * 0.5;
    }
  }
  for (const k of Object.keys(acc)) acc[k] = Math.round(acc[k] * 10) / 10;
  return acc;
}

/** Progresion sugerida: si completaste el rango alto en todas las series, sube peso. */
export function suggestProgression(
  lastSets: WorkoutSet[],
  repRange: [number, number],
  increment = 2.5,
): { weight: number; reps: number; reason: string } | null {
  const working = lastSets.filter(isWorkingSet);
  if (!working.length) return null;
  const weight = Math.max(...working.map((s) => s.weight));
  const atTop = working.every((s) => s.reps >= repRange[1]);
  const belowBottom = working.some((s) => s.reps < repRange[0]);

  if (atTop) {
    return {
      weight: Math.round((weight + increment) * 2) / 2,
      reps: repRange[0],
      reason: `Completaste ${repRange[1]} reps en todas las series`,
    };
  }
  if (belowBottom) {
    return { weight, reps: repRange[0], reason: 'Consolida el peso antes de subir' };
  }
  const minReps = Math.min(...working.map((s) => s.reps));
  return { weight, reps: Math.min(repRange[1], minReps + 1), reason: 'Suma una repeticion' };
}
