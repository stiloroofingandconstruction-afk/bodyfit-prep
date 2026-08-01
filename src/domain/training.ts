import type {
  MovementPattern,
  MuscleGroup,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from './types';

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

/* ─────────────────────────────────── ultima sesion y progresion ───────── */

export interface LastSession {
  date: string;
  /** Solo las series efectivas, en el orden en que se hicieron. */
  sets: WorkoutSet[];
  /** Peso mas alto movido ese dia. */
  topWeight: number;
  bestE1rm: number;
}

/**
 * Ultima vez que se entreno ese ejercicio.
 *
 * Es el dato con el que se elige el peso de hoy: el record historico dice lo
 * que fuiste capaz de hacer alguna vez, no lo que toca ahora.
 */
export function lastSessionOf(
  workouts: Workout[],
  exerciseId: string,
  excludeWorkoutId?: string,
): LastSession | null {
  const ordered = [...workouts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt),
  );

  for (const w of ordered) {
    if (w.id === excludeWorkoutId) continue;
    for (const ex of w.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      const sets = ex.sets.filter(isWorkingSet);
      if (!sets.length) continue;
      return {
        date: w.date,
        sets,
        topWeight: Math.max(...sets.map((s) => s.weight)),
        bestE1rm: Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps))),
      };
    }
  }
  return null;
}

/**
 * Rango de repeticiones por defecto cuando el ejercicio no viene de una rutina.
 *
 * Un basico pesado y una elevacion lateral no comparten rango, y suponer 8–12
 * para todo hace que la progresion sugiera tonterias en los extremos.
 */
export function defaultRepRange(input: {
  compound: boolean;
  pattern: MovementPattern;
}): [number, number] {
  if (input.pattern === 'cardio' || input.pattern === 'movilidad') return [10, 15];
  if (input.pattern.startsWith('core')) return [8, 15];
  if (input.pattern === 'aislamiento') return [10, 15];
  return input.compound ? [6, 10] : [8, 12];
}

/** Incremento razonable segun el ejercicio, en kg. */
export function defaultIncrement(compound: boolean): number {
  return compound ? 2.5 : 1;
}

export type ProgressionKind = 'subir-peso' | 'consolidar' | 'sumar-repeticion';

export interface Progression {
  weight: number;
  reps: number;
  kind: ProgressionKind;
  /** Texto en espanol. La interfaz traduce `kind`; esto va a las exportaciones. */
  reason: string;
}

/** Progresion sugerida: si completaste el rango alto en todas las series, sube peso. */
export function suggestProgression(
  lastSets: WorkoutSet[],
  repRange: [number, number],
  increment = 2.5,
): Progression | null {
  const working = lastSets.filter(isWorkingSet);
  if (!working.length) return null;
  const weight = Math.max(...working.map((s) => s.weight));
  if (weight <= 0) return null;

  const atTop = working.every((s) => s.reps >= repRange[1]);
  const belowBottom = working.some((s) => s.reps < repRange[0]);

  if (atTop) {
    return {
      weight: Math.round((weight + increment) * 2) / 2,
      reps: repRange[0],
      kind: 'subir-peso',
      reason: `Completaste ${repRange[1]} reps en todas las series`,
    };
  }
  if (belowBottom) {
    return {
      weight,
      reps: repRange[0],
      kind: 'consolidar',
      reason: 'Consolida el peso antes de subir',
    };
  }
  const minReps = Math.min(...working.map((s) => s.reps));
  return {
    weight,
    reps: Math.min(repRange[1], minReps + 1),
    kind: 'sumar-repeticion',
    reason: 'Suma una repeticion',
  };
}
