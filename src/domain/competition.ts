/**
 * Modelo de dominio de la preparacion para competencia.
 *
 * Todo lo que hay aqui son funciones puras: fases, cuentas atras, tendencias,
 * proyecciones y el motor de recomendaciones. Sin React, sin storage.
 *
 * AVISO DE ALCANCE: este modulo es una herramienta de PLANIFICACION Y
 * SEGUIMIENTO. No diagnostica, no prescribe protocolos medicos y no implementa
 * manipulaciones agresivas de agua, sodio ni sustancias.
 */
import type { Entity } from './types';

/* ────────────────────────────────────────────────────────── competencia ── */

export type Federation =
  | 'IFBB Pro'
  | 'IFBB'
  | 'NPC'
  | 'OCB'
  | 'WNBF'
  | 'INBA/PNBA'
  | 'NANBF'
  | 'Musclemania'
  | 'Otra';

export type Division =
  | "Men's Physique"
  | 'Classic Physique'
  | 'Bodybuilding'
  | 'Bikini'
  | 'Wellness'
  | 'Figure'
  | 'Womens Physique'
  | 'Otra';

export type PrepStatus = 'planificado' | 'activo' | 'pausado' | 'completado' | 'cancelado';

export interface CompetitionPrep extends Entity {
  showName: string;
  federation: Federation;
  /** Categoria dentro de la division: altura, edad, peso... */
  category: string;
  division: Division;
  showDate: string; // YYYY-MM-DD
  prepStartDate: string; // YYYY-MM-DD
  startWeight: number; // kg
  targetWeight?: number; // kg
  startBodyFat?: number; // %
  targetBodyFat?: number; // %
  coach?: string;
  notes?: string;
  status: PrepStatus;
}

/* ─────────────────────────────────────────────────────────────── fases ── */

export type PrepPhaseId =
  | 'preparacion-inicial'
  | 'perdida-progresiva'
  | 'fase-avanzada'
  | 'ultimas-cuatro'
  | 'peak-week'
  | 'dia-del-show'
  | 'post-show';

export interface PrepPhase {
  id: PrepPhaseId;
  label: string;
  /** Semanas restantes al show en las que aplica esta fase (inclusive). */
  fromWeeksOut: number;
  toWeeksOut: number;
  focus: string;
  tone: string;
}

/**
 * Fases sugeridas por semanas restantes. Son orientativas: la progresion real
 * depende del punto de partida y del criterio del entrenador.
 */
export const PREP_PHASES: PrepPhase[] = [
  {
    id: 'preparacion-inicial',
    label: 'Preparacion inicial',
    fromWeeksOut: 999,
    toWeeksOut: 17,
    focus: 'Construir habitos, medir con constancia y establecer la linea base.',
    tone: 'text-sky',
  },
  {
    id: 'perdida-progresiva',
    label: 'Perdida progresiva',
    fromWeeksOut: 16,
    toWeeksOut: 9,
    focus: 'Ritmo sostenible, prioridad a la fuerza y a la adherencia.',
    tone: 'text-brand',
  },
  {
    id: 'fase-avanzada',
    label: 'Fase avanzada',
    fromWeeksOut: 8,
    toWeeksOut: 5,
    focus: 'Ajustes mas finos, vigilar fatiga, sueno y rendimiento.',
    tone: 'text-carbs',
  },
  {
    id: 'ultimas-cuatro',
    label: 'Ultimas cuatro semanas',
    fromWeeksOut: 4,
    toWeeksOut: 2,
    focus: 'Pulir condicion, practicar posing a diario, cerrar logistica.',
    tone: 'text-violet',
  },
  {
    id: 'peak-week',
    label: 'Peak week',
    fromWeeksOut: 1,
    toWeeksOut: 1,
    focus: 'Rutina conocida, cero experimentos. Logistica y descanso.',
    tone: 'text-rose',
  },
  {
    id: 'dia-del-show',
    label: 'Dia del show',
    fromWeeksOut: 0,
    toWeeksOut: 0,
    focus: 'Cronograma, comidas conocidas y disfrutar el escenario.',
    tone: 'text-brand',
  },
  {
    id: 'post-show',
    label: 'Post-show',
    fromWeeksOut: -1,
    toWeeksOut: -999,
    focus: 'Retorno gradual, recuperar rendimiento y salud.',
    tone: 'text-sky',
  },
];

export interface Countdown {
  daysOut: number;
  weeksOut: number;
  /** Dias sueltos ademas de las semanas completas. */
  extraDays: number;
  phase: PrepPhase;
  /** 0–100 del recorrido total del prep. */
  progressPct: number;
  totalDays: number;
  elapsedDays: number;
  isPast: boolean;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split('-').map(Number);
  const [y2, m2, d2] = toISO.split('-').map(Number);
  const a = Date.UTC(y1, (m1 ?? 1) - 1, d1 ?? 1);
  const b = Date.UTC(y2, (m2 ?? 1) - 1, d2 ?? 1);
  return Math.round((b - a) / 86400000);
}

export function phaseForWeeksOut(weeksOut: number): PrepPhase {
  if (weeksOut < 0) return PREP_PHASES[PREP_PHASES.length - 1];
  return (
    PREP_PHASES.find((p) => weeksOut <= p.fromWeeksOut && weeksOut >= p.toWeeksOut) ??
    PREP_PHASES[0]
  );
}

/** Cuenta atras completa desde una fecha dada (por defecto hoy). */
export function countdown(prep: CompetitionPrep, todayISO: string): Countdown {
  const daysOut = daysBetween(todayISO, prep.showDate);
  const totalDays = Math.max(1, daysBetween(prep.prepStartDate, prep.showDate));
  const elapsedDays = Math.max(0, daysBetween(prep.prepStartDate, todayISO));

  // Dia 0 es el show; a partir de 1 dia restante ya cuenta como semana en curso
  const weeksOut = daysOut <= 0 ? (daysOut === 0 ? 0 : -1) : Math.ceil(daysOut / 7);
  const extraDays = daysOut > 0 ? daysOut % 7 : 0;

  return {
    daysOut,
    weeksOut,
    extraDays,
    phase: phaseForWeeksOut(daysOut === 0 ? 0 : weeksOut),
    progressPct: Math.max(0, Math.min(100, Math.round((elapsedDays / totalDays) * 100))),
    totalDays,
    elapsedDays,
    isPast: daysOut < 0,
  };
}

/* ──────────────────────────────────────────────── registro diario ─────── */

export interface DailyReadiness extends Entity {
  date: string; // YYYY-MM-DD
  /** Peso en ayunas, kg. */
  weight?: number;
  /** Hora de la medicion, HH:MM. */
  weighTime?: string;
  sleepQuality?: number; // 1–5
  sleepHours?: number;
  hunger?: number; // 1–5
  energy?: number; // 1–5
  stress?: number; // 1–5
  digestion?: number; // 1–5
  steps?: number;
  cardioMinutes?: number;
  notes?: string;
}

/* ──────────────────────────────────────────────────── tendencias ─────── */

export interface WeightTrend {
  /** Media movil de 7 dias del ultimo dato disponible. */
  avg7: number | null;
  /** Media movil de 7 dias de la semana anterior. */
  prevAvg7: number | null;
  /** Diferencia entre ambas medias (kg). */
  weekChange: number | null;
  /** Ritmo en % del peso corporal por semana. */
  weekPct: number | null;
  /** Pendiente por regresion lineal sobre los ultimos 14 dias (kg/semana). */
  slope14: number | null;
  /** Numero de dias con peso registrado en los ultimos 14. */
  daysLogged14: number;
  /** Serie de medias moviles para graficar. */
  series: { date: string; value: number }[];
  /** Datos suficientes para razonar (>= 7 dias). */
  reliable: boolean;
}

/**
 * Media movil y tendencia del peso.
 *
 * Nunca se razona sobre un peso suelto: el agua, el glucogeno y el contenido
 * intestinal mueven la bascula mas que la grasa en una semana.
 */
export function weightTrend(
  entries: { date: string; weight?: number }[],
  todayISO: string,
): WeightTrend {
  const points = entries
    .filter((e): e is { date: string; weight: number } => typeof e.weight === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = new Map(points.map((p) => [p.date, p.weight]));

  // Media movil de 7 dias centrada en cada fecha con dato
  const series: { date: string; value: number }[] = [];
  for (const p of points) {
    const window: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = shiftISO(p.date, -i);
      const w = byDate.get(d);
      if (w != null) window.push(w);
    }
    if (window.length >= 3) {
      series.push({
        date: p.date,
        value: Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 100) / 100,
      });
    }
  }

  const avgOver = (endISO: string, days: number): number | null => {
    const vals: number[] = [];
    for (let i = 0; i < days; i++) {
      const w = byDate.get(shiftISO(endISO, -i));
      if (w != null) vals.push(w);
    }
    return vals.length >= 3 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const avg7 = avgOver(todayISO, 7);
  const prevAvg7 = avgOver(shiftISO(todayISO, -7), 7);
  const weekChange = avg7 != null && prevAvg7 != null ? avg7 - prevAvg7 : null;

  // Regresion lineal sobre los ultimos 14 dias
  const recent = points.filter((p) => daysBetween(p.date, todayISO) <= 14 && daysBetween(p.date, todayISO) >= 0);
  let slope14: number | null = null;
  if (recent.length >= 4) {
    const x0 = new Date(recent[0].date).getTime();
    const xs = recent.map((p) => (new Date(p.date).getTime() - x0) / 86400000);
    const ys = recent.map((p) => p.weight);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    if (den > 0) slope14 = Math.round((num / den) * 7 * 100) / 100;
  }

  const daysLogged14 = recent.length;

  return {
    avg7: avg7 != null ? Math.round(avg7 * 100) / 100 : null,
    prevAvg7: prevAvg7 != null ? Math.round(prevAvg7 * 100) / 100 : null,
    weekChange: weekChange != null ? Math.round(weekChange * 100) / 100 : null,
    weekPct: weekChange != null && avg7 ? Math.round((weekChange / avg7) * 1000) / 10 : null,
    slope14,
    daysLogged14,
    series,
    reliable: daysLogged14 >= 7,
  };
}

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/* ─────────────────────────────────────────────────── proyeccion ──────── */

export interface Projection {
  /** Peso estimado el dia del show manteniendo el ritmo actual. */
  projectedWeight: number | null;
  /** Diferencia contra el objetivo (negativo = llegaria por debajo). */
  vsTarget: number | null;
  /** Ritmo semanal necesario para llegar al objetivo. */
  requiredWeekly: number | null;
  /** Ritmo actual, kg/semana. */
  currentWeekly: number | null;
  status: 'sin-datos' | 'en-ritmo' | 'ligeramente-fuera' | 'fuera-de-ritmo' | 'sin-objetivo';
  /** Explicacion en datos, no en alarmas. Texto en espanol, para exportaciones. */
  explanation: string;
  /**
   * Misma explicacion en forma estructurada, para que la interfaz la traduzca y
   * la muestre en las unidades del usuario. Los pesos van SIEMPRE en kg.
   */
  detail:
    | { kind: 'no-data'; daysLogged: number }
    | { kind: 'no-target'; weeklyKg: number; projectedKg: number }
    | {
        kind: 'full';
        avgKg: number;
        weeklyKg: number;
        requiredWeeklyKg: number;
        weeksLeft: number;
        projectedKg: number;
        gapKg: number;
        above: boolean;
      };
}

export function projectToShow(
  prep: CompetitionPrep,
  trend: WeightTrend,
  todayISO: string,
): Projection {
  const daysOut = daysBetween(todayISO, prep.showDate);
  const weeksLeft = Math.max(0, daysOut / 7);
  const current = trend.avg7;

  if (!trend.reliable || current == null || trend.weekChange == null) {
    return {
      projectedWeight: null,
      vsTarget: null,
      requiredWeekly: null,
      currentWeekly: null,
      status: 'sin-datos',
      explanation: `Con ${trend.daysLogged14} dias de peso en las ultimas 2 semanas aun no hay base suficiente. Se necesitan al menos 7.`,
      detail: { kind: 'no-data', daysLogged: trend.daysLogged14 },
    };
  }

  const currentWeekly = trend.weekChange;
  const projectedWeight = Math.round((current + currentWeekly * weeksLeft) * 10) / 10;

  if (prep.targetWeight == null) {
    return {
      projectedWeight,
      vsTarget: null,
      requiredWeekly: null,
      currentWeekly,
      status: 'sin-objetivo',
      explanation: `Al ritmo actual (${fmtKgWeek(currentWeekly)}) llegarias al show sobre ${projectedWeight} kg. Define un peso objetivo para medir el ritmo.`,
      detail: { kind: 'no-target', weeklyKg: currentWeekly, projectedKg: projectedWeight },
    };
  }

  const requiredWeekly =
    weeksLeft > 0 ? Math.round(((prep.targetWeight - current) / weeksLeft) * 100) / 100 : 0;
  const vsTarget = Math.round((projectedWeight - prep.targetWeight) * 10) / 10;

  // Tolerancia: 1.5 kg o el equivalente a media semana de ritmo necesario
  const tolerance = Math.max(1.5, Math.abs(requiredWeekly) * 1.5);
  const absGap = Math.abs(vsTarget);

  let status: Projection['status'];
  if (absGap <= tolerance * 0.5) status = 'en-ritmo';
  else if (absGap <= tolerance) status = 'ligeramente-fuera';
  else status = 'fuera-de-ritmo';

  const dir = vsTarget > 0 ? 'por encima' : 'por debajo';
  const explanation =
    `Media de 7 dias: ${current} kg. Ritmo actual ${fmtKgWeek(currentWeekly)}, ` +
    `ritmo necesario ${fmtKgWeek(requiredWeekly)} durante ${weeksLeft.toFixed(1)} semanas. ` +
    `Proyeccion: ${projectedWeight} kg, ${absGap.toFixed(1)} kg ${dir} del objetivo.`;

  return {
    projectedWeight,
    vsTarget,
    requiredWeekly,
    currentWeekly,
    status,
    explanation,
    detail: {
      kind: 'full',
      avgKg: current,
      weeklyKg: currentWeekly,
      requiredWeeklyKg: requiredWeekly,
      weeksLeft: Math.round(weeksLeft * 10) / 10,
      projectedKg: projectedWeight,
      gapKg: Math.round(absGap * 10) / 10,
      above: vsTarget > 0,
    },
  };
}

function fmtKgWeek(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)} kg/sem`;
}

export const PROJECTION_TONE: Record<Projection['status'], string> = {
  'sin-datos': 'text-muted',
  'en-ritmo': 'text-brand',
  'ligeramente-fuera': 'text-carbs',
  'fuera-de-ritmo': 'text-rose',
  'sin-objetivo': 'text-sky',
};

export const PROJECTION_LABEL: Record<Projection['status'], string> = {
  'sin-datos': 'Sin datos suficientes',
  'en-ritmo': 'En ritmo',
  'ligeramente-fuera': 'Ligeramente fuera de ritmo',
  'fuera-de-ritmo': 'Fuera de ritmo',
  'sin-objetivo': 'Sin objetivo definido',
};
