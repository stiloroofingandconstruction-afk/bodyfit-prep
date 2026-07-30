/** Utilidades de fecha. Todo se guarda como YYYY-MM-DD en hora local. */

export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const today = (): string => toISODate();

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromISODate(a).getTime() - fromISODate(b).getTime()) / 86400000);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfWeek(iso: string): string {
  const d = fromISODate(iso);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  return toISODate(d);
}

export function weekRange(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function dayName(iso: string): string {
  return DAYS[fromISODate(iso).getDay()];
}

export function dayInitial(iso: string): string {
  return DAYS_SHORT[fromISODate(iso).getDay()];
}

export function monthName(monthIndex: number): string {
  return MONTHS[monthIndex];
}

export function monthShort(monthIndex: number): string {
  return MONTHS_SHORT[monthIndex];
}

/** "Hoy", "Ayer" o "Lunes 14 de julio". */
export function friendlyDate(iso: string): string {
  const t = today();
  if (iso === t) return 'Hoy';
  if (iso === addDays(t, -1)) return 'Ayer';
  if (iso === addDays(t, 1)) return 'Manana';
  const d = fromISODate(iso);
  return `${dayName(iso)} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function shortDate(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function timeOfDay(date: Date = new Date()): 'manana' | 'tarde' | 'noche' {
  const h = date.getHours();
  if (h < 12) return 'manana';
  if (h < 20) return 'tarde';
  return 'noche';
}

export function greeting(date: Date = new Date()): string {
  const t = timeOfDay(date);
  return t === 'manana' ? 'Buenos dias' : t === 'tarde' ? 'Buenas tardes' : 'Buenas noches';
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
