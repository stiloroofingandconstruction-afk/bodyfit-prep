/**
 * Exportacion de datos.
 *
 * Todo se genera en el dispositivo: nada sale de aqui salvo que el usuario
 * descargue el archivo a proposito.
 */
import type { FoodEntry, Workout, BodyMeasurement, WeeklyCheckin } from '@bodyfit/domain/types';
import type { DailyReadiness } from '@bodyfit/domain/competition';
import type { CardioSession, StepEntry } from '@bodyfit/domain/prepTypes';
import type { UnitsApi } from '@/lib/useUnits';

/**
 * Unidades usadas al exportar.
 *
 * Los CSV llevan la unidad EN LA CABECERA (`peso_lb`, `cintura_in`) para que el
 * archivo sea autoexplicativo: quien lo abra dentro de un ano sabe que esta
 * leyendo sin tener que adivinar.
 */
export type ExportUnits = Pick<
  UnitsApi,
  'w' | 'l' | 'numWeight' | 'numLength' | 'fmtWeight' | 'fmtLength' | 'toDisplayWeight' | 'weightUnit'
>;

/** Escapa un campo CSV segun RFC 4180. */
function cell(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(headers: string[], rows: unknown[][]): string {
  // BOM para que Excel abra los acentos correctamente
  return '﻿' + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\n');
}

export function weightCSV(
  readiness: DailyReadiness[],
  measurements: BodyMeasurement[],
  u: ExportUnits,
): string {
  const byDate = new Map<string, { weight?: number; time?: string; notes?: string; waist?: number }>();
  for (const m of measurements) {
    byDate.set(m.date, { weight: m.weight, waist: m.waist });
  }
  for (const r of readiness) {
    const prev = byDate.get(r.date) ?? {};
    byDate.set(r.date, { ...prev, weight: r.weight ?? prev.weight, time: r.weighTime, notes: r.notes });
  }
  const rows = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => [
      date,
      v.weight != null ? u.numWeight(v.weight) : '',
      v.time ?? '',
      v.waist != null ? u.numLength(v.waist) : '',
      v.notes ?? '',
    ]);
  return toCSV([`fecha`, `peso_${u.w}`, 'hora', `cintura_${u.l}`, 'notas'], rows);
}

export function nutritionCSV(entries: FoodEntry[]): string {
  const rows = entries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [
      e.date,
      e.slot,
      e.foodName,
      e.grams,
      Math.round(e.macros.kcal),
      e.macros.protein,
      e.macros.carbs,
      e.macros.fat,
      e.macros.fiber,
    ]);
  return toCSV(
    ['fecha', 'comida', 'alimento', 'gramos', 'kcal', 'proteina_g', 'carbos_g', 'grasa_g', 'fibra_g'],
    rows,
  );
}

export function workoutsCSV(workouts: Workout[], u: ExportUnits): string {
  const rows: unknown[][] = [];
  for (const w of workouts) {
    for (const ex of w.exercises) {
      ex.sets.forEach((s, i) => {
        rows.push([
          w.date, w.name, ex.exerciseName, i + 1,
          u.numWeight(s.weight), s.reps, s.rir ?? '', s.type,
        ]);
      });
    }
  }
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return toCSV(
    ['fecha', 'sesion', 'ejercicio', 'serie', `peso_${u.w}`, 'repeticiones', 'rir', 'tipo'],
    rows,
  );
}

export function checkinsCSV(checkins: WeeklyCheckin[], u: ExportUnits): string {
  const rows = checkins
    .slice()
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((c) => [
      c.weekStart,
      u.numWeight(c.avgWeight),
      u.numWeight(c.weightChange, 2),
      c.waist != null ? u.numLength(c.waist) : '',
      c.adherence,
      c.energy,
      c.sleep,
      c.hunger,
      c.stress,
      c.workoutsCompleted,
      c.avgKcal ?? '',
      c.kcalAdjustment ?? '',
      c.notes ?? '',
    ]);
  return toCSV(
    [
      'semana', `peso_medio_${u.w}`, `cambio_${u.w}`, `cintura_${u.l}`, 'adherencia_pct',
      'energia', 'sueno', 'hambre', 'estres', 'entrenos', 'kcal_medias',
      'ajuste_kcal', 'notas',
    ],
    rows,
  );
}

export function cardioCSV(sessions: CardioSession[], steps: StepEntry[]): string {
  const rows: unknown[][] = sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => [s.date, 'cardio', s.type, s.minutes, s.intensity, s.completed ? 'si' : 'no']);
  for (const s of steps.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([s.date, 'pasos', '', '', '', s.steps]);
  }
  return toCSV(['fecha', 'tipo_registro', 'modalidad', 'minutos', 'intensidad', 'valor'], rows);
}

/* ────────────────────────────────────────────── informe para el coach ── */

export interface CoachReportInput {
  athleteName: string;
  showName?: string;
  daysOut?: number;
  phase?: string;
  weekStart: string;
  avgWeight: number | null;
  prevAvgWeight: number | null;
  weekChange: number | null;
  weekPct: number | null;
  targets: { kcal: number; protein: number; carbs: number; fat: number };
  adherence: number;
  cardioMinutes: number;
  avgSteps: number;
  workouts: number;
  posingMinutes: number;
  sleep: number | null;
  energy: number | null;
  hunger: number | null;
  stress: number | null;
  strength: number | null;
  measurements: { label: string; value: number }[];
  photos: number;
  notes?: string;
  /** Unidades en las que se escribe el informe. */
  units: ExportUnits;
}

/**
 * Resumen semanal para el coach, en texto plano.
 *
 * Se entrega en Markdown porque se pega igual de bien en WhatsApp, correo o
 * cualquier app de notas, y se imprime legible.
 */
export function coachReport(input: CoachReportInput): string {
  const u = input.units;
  const n = (v: number | null, decimals = 1) =>
    v == null ? 'sin datos' : u.fmtWeight(v, decimals);
  const s = (v: number | null) => (v == null ? 'sin datos' : `${v.toFixed(1)}/5`);

  const lines: string[] = [];
  lines.push(`# Resumen semanal — ${input.athleteName || 'Atleta'}`);
  lines.push('');
  lines.push(`**Semana del:** ${input.weekStart}`);
  if (input.showName) lines.push(`**Competencia:** ${input.showName}`);
  if (input.daysOut != null) lines.push(`**Dias al show:** ${input.daysOut}`);
  if (input.phase) lines.push(`**Fase:** ${input.phase}`);
  lines.push('');

  lines.push('## Peso');
  lines.push(`- Media de 7 dias: ${n(input.avgWeight)}`);
  lines.push(`- Semana anterior: ${n(input.prevAvgWeight)}`);
  lines.push(
    `- Cambio: ${
      input.weekChange == null
        ? 'sin datos'
        : `${input.weekChange > 0 ? '+' : ''}${u.numWeight(input.weekChange, 2)} ${u.w}`
    } (${input.weekPct == null ? '—' : `${input.weekPct > 0 ? '+' : ''}${input.weekPct.toFixed(1)}%`})`,
  );
  lines.push('');

  lines.push('## Nutricion');
  lines.push(`- Objetivo: ${input.targets.kcal} kcal`);
  lines.push(
    `- Macros: P ${input.targets.protein} g · C ${input.targets.carbs} g · G ${input.targets.fat} g`,
  );
  lines.push(`- Adherencia: ${Math.round(input.adherence)}%`);
  lines.push('');

  lines.push('## Actividad');
  lines.push(`- Cardio: ${input.cardioMinutes} min`);
  lines.push(`- Pasos (media diaria): ${input.avgSteps || 'sin datos'}`);
  lines.push(`- Entrenamientos: ${input.workouts}`);
  lines.push(`- Posing: ${input.posingMinutes} min`);
  lines.push('');

  lines.push('## Sensaciones');
  lines.push(`- Sueno: ${s(input.sleep)}`);
  lines.push(`- Energia: ${s(input.energy)}`);
  lines.push(`- Hambre: ${s(input.hunger)}`);
  lines.push(`- Estres: ${s(input.stress)}`);
  lines.push(`- Fuerza: ${s(input.strength)}`);
  lines.push('');

  if (input.measurements.length) {
    lines.push('## Medidas');
    for (const m of input.measurements) lines.push(`- ${m.label}: ${u.fmtLength(m.value)}`);
    lines.push('');
  }

  lines.push(`## Fotos`);
  lines.push(
    input.photos > 0
      ? `- ${input.photos} fotos tomadas esta semana (se envian aparte: no salen del dispositivo).`
      : '- Sin fotos esta semana.',
  );
  lines.push('');

  if (input.notes) {
    lines.push('## Notas');
    lines.push(input.notes);
    lines.push('');
  }

  lines.push('---');
  lines.push('_Generado por BodyFit Prep. Los datos se guardan localmente en el dispositivo._');

  return lines.join('\n');
}
