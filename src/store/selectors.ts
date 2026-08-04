/**
 * Selectores derivados. Combinan varios stores y memoizan los calculos caros
 * para que ningun componente recalcule macros o indices en cada render.
 */
import { useEffect, useMemo, useState } from 'react';
import { builtinRoutines, foodCatalog } from '@/data/registry';
import { setCatalog } from '@/data/foodSearch';
import { computeTargets } from '@bodyfit/domain/energy';
import { remainingMacros, sumMacros } from '@bodyfit/domain/macros';
import {
  countdown,
  projectToShow,
  weightTrend,
  type CompetitionPrep,
  type Countdown,
  type DailyReadiness,
  type Projection,
  type WeightTrend,
} from '@bodyfit/domain/competition';
import { addDays, today } from '@/lib/date';
import { alive } from './persist';
import { useActivityStore } from './activityStore';
import { useBodyStore } from './bodyStore';
import { useCheckinStore } from './checkinStore';
import { useNutritionStore } from './nutritionStore';
import { usePhotoStore } from './photoStore';
import { usePrepStore } from './prepStore';
import { useProfileStore } from './profileStore';
import { useSettingsStore } from './settingsStore';
import { useTrainingStore } from './trainingStore';
import type { Food, FoodEntry, MacroTarget, Macros } from '@bodyfit/domain/types';
import { DAY_TYPE_FACTOR } from '@bodyfit/domain/prepTypes';
import type { ProgressPhoto } from '@bodyfit/domain/prepTypes';

/* --------------------------------------------------------------- catalogo */

let lastCatalogSignature = '';

/** Catalogo completo: base local + alimentos del usuario. */
export function useCatalog(): Food[] {
  const customFoods = useNutritionStore((s) => s.customFoods);

  return useMemo(() => {
    /*
     * El catalogo base llega por carga diferida: hasta que una pantalla de
     * nutricion lo pida, aqui solo estan los alimentos propios del usuario.
     * Es correcto: sin esas pantallas abiertas, nadie busca alimentos.
     */
    const base = foodCatalog()?.all ?? [];
    const customs = alive(customFoods).map((c) => ({ ...c, custom: true }) as Food);
    const catalog = [...base, ...customs];
    // El indice de busqueda solo se reconstruye si cambio el conjunto
    const sig = `${catalog.length}:${customs.map((c) => c.id).join(',')}`;
    if (sig !== lastCatalogSignature) {
      lastCatalogSignature = sig;
      setCatalog(catalog);
    }
    return catalog;
  }, [customFoods]);
}

export function useFoodLookup(): Map<string, Food> {
  const catalog = useCatalog();
  return useMemo(() => new Map(catalog.map((f) => [f.id, f])), [catalog]);
}

/* ----------------------------------------------------------------- perfil */

/** Peso actual: ultima medicion registrada, o el peso inicial del perfil. */
export function useCurrentWeight(): number {
  const measurements = useBodyStore((s) => s.measurements);
  const startWeight = useProfileStore((s) => s.profile.startWeight);

  return useMemo(() => {
    const withWeight = alive(measurements)
      .filter((m) => typeof m.weight === 'number')
      .sort((a, b) => b.date.localeCompare(a.date));
    return withWeight[0]?.weight ?? startWeight;
  }, [measurements, startWeight]);
}

/** Objetivo diario de macros, recalculado sobre el peso actual. */
export function useTargets(): MacroTarget {
  const profile = useProfileStore((s) => s.profile);
  const weight = useCurrentWeight();
  return useMemo(() => computeTargets(profile, weight), [profile, weight]);
}

/* -------------------------------------------------------------- nutricion */

export function useDayEntries(date: string): FoodEntry[] {
  const entries = useNutritionStore((s) => s.entries);
  return useMemo(
    () => alive(entries).filter((e) => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [entries, date],
  );
}

export function useDayMacros(date: string): Macros {
  const entries = useDayEntries(date);
  return useMemo(() => sumMacros(entries.map((e) => e.macros)), [entries]);
}

export interface DayNutrition {
  entries: FoodEntry[];
  consumed: Macros;
  target: MacroTarget;
  remaining: Macros;
  /** Restante permitiendo valores negativos (para avisar de excesos). */
  signedRemaining: Macros;
}

/**
 * Objetivo del dia ajustado por tipo de dia.
 *
 * Un refeed o un diet break no cambian el objetivo base: lo escalan solo para
 * esa fecha. La proteina se mantiene practicamente fija (es lo que protege el
 * musculo) y el ajuste recae sobre los carbohidratos.
 */
export function useDayTarget(date: string): MacroTarget {
  const base = useTargets();
  const dayTypes = useNutritionStore((s) => s.dayTypes);

  return useMemo(() => {
    const type = dayTypes[date];
    if (!type || type === 'entrenamiento') return base;

    const factor = DAY_TYPE_FACTOR[type];
    const kcal = Math.round(base.kcal * factor);
    // La proteina se mueve muy poco; la grasa algo; el resto va a carbohidratos
    const protein = Math.round(base.protein * (factor > 1 ? 1 : 1.02));
    const fat = Math.round(base.fat * (factor > 1 ? Math.min(1.15, factor) : Math.max(0.85, factor)));
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

    return { kcal, protein, carbs, fat, fiber: base.fiber };
  }, [base, dayTypes, date]);
}

export function useDayNutrition(date: string): DayNutrition {
  const entries = useDayEntries(date);
  const target = useDayTarget(date);
  const consumed = useMemo(() => sumMacros(entries.map((e) => e.macros)), [entries]);
  const remaining = useMemo(() => remainingMacros(target, consumed), [target, consumed]);
  const signedRemaining = useMemo(
    () => remainingMacros(target, consumed, true),
    [target, consumed],
  );
  return { entries, consumed, target, remaining, signedRemaining };
}

/* ------------------------------------------------------------ entrenamiento */

export function useRoutines() {
  const custom = useTrainingStore((s) => s.routines);
  return useMemo(() => [...builtinRoutines(), ...alive(custom)], [custom]);
}

export function useWorkouts() {
  const workouts = useTrainingStore((s) => s.workouts);
  return useMemo(
    () => alive(workouts).sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt)),
    [workouts],
  );
}

export function useMeasurements() {
  const measurements = useBodyStore((s) => s.measurements);
  return useMemo(
    () => alive(measurements).sort((a, b) => a.date.localeCompare(b.date)),
    [measurements],
  );
}

export function useCheckins() {
  const checkins = useCheckinStore((s) => s.checkins);
  return useMemo(
    () => alive(checkins).sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
    [checkins],
  );
}

/* ------------------------------------------------------------------ racha */

/**
 * Dias consecutivos con registro (comida o entreno) contando desde hoy.
 * Si hoy aun no hay nada, la racha sigue viva hasta el final del dia.
 */
export function useStreak(): number {
  const entries = useNutritionStore((s) => s.entries);
  const workouts = useTrainingStore((s) => s.workouts);

  return useMemo(() => {
    const days = new Set<string>();
    for (const e of alive(entries)) days.add(e.date);
    for (const w of alive(workouts)) days.add(w.date);

    let streak = 0;
    let cursor = today();
    if (!days.has(cursor)) cursor = addDays(cursor, -1); // el dia en curso no rompe la racha
    while (days.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [entries, workouts]);
}

/* ------------------------------------------------------------------ prep */

/** Preparacion activa, o null si no hay modo competencia. */
export function useActivePrep(): CompetitionPrep | null {
  const preps = usePrepStore((s) => s.preps);
  const activeId = usePrepStore((s) => s.activePrepId);
  return useMemo(() => {
    if (!activeId) return null;
    return alive(preps).find((p) => p.id === activeId) ?? null;
  }, [preps, activeId]);
}

export function useReadiness(): DailyReadiness[] {
  const readiness = usePrepStore((s) => s.readiness);
  return useMemo(() => alive(readiness).sort((a, b) => a.date.localeCompare(b.date)), [readiness]);
}

/** Tendencia del peso a partir del registro diario y de las mediciones. */
export function useWeightTrend(): WeightTrend {
  const readiness = useReadiness();
  const measurements = useBodyStore((s) => s.measurements);

  return useMemo(() => {
    // Se combinan ambas fuentes: el registro diario manda si hay dos del mismo dia
    const byDate = new Map<string, number>();
    for (const m of alive(measurements)) {
      if (typeof m.weight === 'number') byDate.set(m.date, m.weight);
    }
    for (const r of readiness) {
      if (typeof r.weight === 'number') byDate.set(r.date, r.weight);
    }
    const entries = [...byDate.entries()].map(([date, weight]) => ({ date, weight }));
    return weightTrend(entries, today());
  }, [readiness, measurements]);
}

export function useCountdown(): Countdown | null {
  const prep = useActivePrep();
  return useMemo(() => (prep ? countdown(prep, today()) : null), [prep]);
}

export function useProjection(): Projection | null {
  const prep = useActivePrep();
  const trend = useWeightTrend();
  return useMemo(() => (prep ? projectToShow(prep, trend, today()) : null), [prep, trend]);
}

/** Actividad de la semana en curso: cardio, pasos y posing. */
export function useWeekActivity(weekStart: string) {
  const cardio = useActivityStore((s) => s.cardioSessions);
  const steps = useActivityStore((s) => s.steps);
  const posing = useActivityStore((s) => s.posingSessions);

  return useMemo(() => {
    const end = addDays(weekStart, 7);
    const inWeek = <T extends { date: string }>(list: T[]) =>
      list.filter((x) => x.date >= weekStart && x.date < end);

    const sessions = inWeek(alive(cardio));
    const stepList = inWeek(alive(steps));
    const posingList = inWeek(alive(posing));

    return {
      cardioSessions: sessions,
      cardioMinutes: sessions.filter((c) => c.completed).reduce((n, c) => n + c.minutes, 0),
      cardioPlanned: sessions.reduce((n, c) => n + c.minutes, 0),
      steps: stepList,
      avgSteps: stepList.length
        ? Math.round(stepList.reduce((n, s2) => n + s2.steps, 0) / stepList.length)
        : 0,
      posingSessions: posingList,
      posingMinutes: posingList.reduce((n, p) => n + p.minutes, 0),
    };
  }, [cardio, steps, posing, weekStart]);
}

export function usePhotos(): ProgressPhoto[] {
  const photos = usePhotoStore((s) => s.photos);
  return useMemo(() => alive(photos).sort((a, b) => b.date.localeCompare(a.date)), [photos]);
}

/* -------------------------------------------------------------- hidratacion */

const PERSISTED_STORES = [
  useProfileStore,
  useNutritionStore,
  useTrainingStore,
  useBodyStore,
  useCheckinStore,
  useSettingsStore,
  usePrepStore,
  useActivityStore,
  usePhotoStore,
];

/**
 * Indica si todos los stores ya se leyeron del almacen.
 * El almacenamiento es asincrono (lo sera de verdad con Supabase), asi que la
 * app espera a la hidratacion antes de pintar y evitar un parpadeo de datos vacios.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    PERSISTED_STORES.every((s) => s.persist.hasHydrated()),
  );

  useEffect(() => {
    if (hydrated) return;
    const check = () => {
      if (PERSISTED_STORES.every((s) => s.persist.hasHydrated())) setHydrated(true);
    };
    const unsubs = PERSISTED_STORES.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubs.forEach((u) => u());
  }, [hydrated]);

  return hydrated;
}
