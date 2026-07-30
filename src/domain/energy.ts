import { kcalFromMacros } from './macros';
import type { ActivityLevel, Goal, MacroTarget, Profile } from './types';

/** Multiplicadores de actividad estandar sobre el BMR. */
export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
  atleta: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentario: 'Sedentario — trabajo de oficina, sin ejercicio',
  ligero: 'Ligero — 1-3 entrenos por semana',
  moderado: 'Moderado — 3-5 entrenos por semana',
  alto: 'Alto — 6-7 entrenos por semana',
  atleta: 'Atleta — doble sesion o trabajo fisico',
};

export const GOAL_LABEL: Record<Goal, string> = {
  definicion: 'Definicion',
  mantenimiento: 'Mantenimiento',
  volumen: 'Volumen',
};

export function ageFrom(birthDate: string, today = new Date()): number {
  const b = new Date(birthDate);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return Math.max(0, age);
}

/** Metabolismo basal — Mifflin-St Jeor (el mas preciso sin %grasa fiable). */
export function bmr(profile: Profile, weightKg: number): number {
  const age = ageFrom(profile.birthDate);
  const base = 10 * weightKg + 6.25 * profile.heightCm - 5 * age;
  return profile.sex === 'hombre' ? base + 5 : base - 161;
}

/** Gasto energetico total diario. */
export function tdee(profile: Profile, weightKg: number): number {
  return Math.round(bmr(profile, weightKg) * ACTIVITY_FACTOR[profile.activity]);
}

/**
 * Calorias objetivo. El deficit/superavit sale del ritmo deseado
 * (% de peso corporal por semana) — 1 kg de grasa ≈ 7700 kcal.
 */
export function targetKcal(profile: Profile, weightKg: number): number {
  if (profile.kcalOverride) return profile.kcalOverride;
  const maintenance = tdee(profile, weightKg);
  if (profile.goal === 'mantenimiento') return maintenance;

  const kgPerWeek = (weightKg * profile.paceWeekPct) / 100;
  const dailyDelta = (kgPerWeek * 7700) / 7;
  const signed = profile.goal === 'definicion' ? -dailyDelta : dailyDelta * 0.75; // el volumen se hace mas lento a proposito

  // Suelo de seguridad: nunca por debajo del BMR
  const floor = Math.round(bmr(profile, weightKg));
  return Math.max(floor, Math.round(maintenance + signed));
}

/**
 * Objetivo completo de macros.
 * Proteina y grasa se fijan por kg de peso; los carbohidratos absorben el resto.
 */
export function computeTargets(profile: Profile, weightKg: number): MacroTarget {
  const kcal = targetKcal(profile, weightKg);
  const protein = Math.round(weightKg * profile.proteinPerKg);
  let fat = Math.round(weightKg * profile.fatPerKg);

  let carbKcal = kcal - kcalFromMacros(protein, 0, fat);
  // Si no cuadra, se recorta grasa antes que proteina (nunca por debajo de 0.5 g/kg)
  if (carbKcal < 0) {
    const minFat = Math.round(weightKg * 0.5);
    fat = Math.max(minFat, Math.round((kcal - protein * 4) / 9));
    carbKcal = Math.max(0, kcal - kcalFromMacros(protein, 0, fat));
  }
  const carbs = Math.round(carbKcal / 4);
  const fiber = Math.max(25, Math.round((kcal / 1000) * 14)); // recomendacion 14 g / 1000 kcal

  return { kcal, protein, carbs, fat, fiber };
}

/** Peso corporal en la escala de agua/glucogeno: media movil exponencial. */
export function smoothWeight(series: { date: string; weight: number }[], alpha = 0.25): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  let ema: number | null = null;
  for (const p of series) {
    ema = ema === null ? p.weight : alpha * p.weight + (1 - alpha) * ema;
    out.push({ date: p.date, value: Math.round(ema * 100) / 100 });
  }
  return out;
}
