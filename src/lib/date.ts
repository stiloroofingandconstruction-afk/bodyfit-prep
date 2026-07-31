/**
 * Utilidades de fecha. Todo se guarda como YYYY-MM-DD en hora local.
 *
 * El almacenamiento es siempre ISO; el idioma solo afecta a como se MUESTRA.
 * Los nombres de dia y mes salen de `Intl`, no de listas escritas a mano, asi
 * que anadir un idioma no obliga a traducir doce meses mas.
 */
import { getLocale } from '@/i18n';

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

/* ─────────────────────────────────────────────── formato segun el idioma ── */

/** Etiqueta BCP-47 del idioma activo. */
export function localeTag(): string {
  return getLocale() === 'en' ? 'en-US' : 'es-ES';
}

/*
 * Los formateadores de `Intl` son caros de construir y baratos de reutilizar,
 * asi que se cachean por (idioma + tipo). El cache se llena solo con las pocas
 * combinaciones que la app usa de verdad.
 */
const dtCache = new Map<string, Intl.DateTimeFormat>();

function dtf(options: Intl.DateTimeFormatOptions, tag = localeTag()): Intl.DateTimeFormat {
  const key = tag + JSON.stringify(options);
  let f = dtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, options);
    dtCache.set(key, f);
  }
  return f;
}

/** Capitaliza la primera letra. `Intl` devuelve los meses en minuscula en espanol. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayName(iso: string): string {
  return capitalize(dtf({ weekday: 'long' }).format(fromISODate(iso)));
}

/** Inicial del dia para las rejillas semanales. */
export function dayInitial(iso: string): string {
  return dtf({ weekday: 'narrow' }).format(fromISODate(iso)).toUpperCase();
}

export function monthName(monthIndex: number): string {
  return dtf({ month: 'long' }).format(new Date(2000, monthIndex, 1));
}

export function monthShort(monthIndex: number): string {
  return dtf({ month: 'short' }).format(new Date(2000, monthIndex, 1)).replace('.', '');
}

/** "Hoy", "Ayer" o la fecha larga del idioma activo. */
export function friendlyDate(iso: string): string {
  const t = today();
  if (iso === t) return getLocale() === 'en' ? 'Today' : 'Hoy';
  if (iso === addDays(t, -1)) return getLocale() === 'en' ? 'Yesterday' : 'Ayer';
  if (iso === addDays(t, 1)) return getLocale() === 'en' ? 'Tomorrow' : 'Manana';
  return capitalize(dtf({ weekday: 'long', day: 'numeric', month: 'long' }).format(fromISODate(iso)));
}

export function shortDate(iso: string): string {
  return dtf({ day: 'numeric', month: 'short' }).format(fromISODate(iso)).replace('.', '');
}

/**
 * Iniciales de los siete dias empezando en lunes, en el idioma activo.
 * La rejilla del historial empieza en lunes, no en domingo.
 */
export function weekdayInitials(): string[] {
  const f = dtf({ weekday: 'narrow' });
  // 2024-01-01 fue lunes: sirve de ancla estable para recorrer la semana
  return Array.from({ length: 7 }, (_, i) =>
    f.format(new Date(2024, 0, 1 + i)).toUpperCase(),
  );
}

/** Fecha con hora, para sellos de tiempo (copias de seguridad, registros). */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return dtf({ day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(d)
    .replace('.', '');
}

const nfCache = new Map<string, Intl.NumberFormat>();

/**
 * Numero con el separador decimal del idioma activo: 72,5 en espanol y 72.5 en
 * ingles. Cambiar de idioma debe cambiar tambien esto, no solo las etiquetas.
 */
export function fmtNumber(value: number, decimals = 0): string {
  const tag = localeTag();
  const key = `${tag}:${decimals}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    nfCache.set(key, f);
  }
  return f.format(value);
}

/** Vacia los formateadores cacheados. Se llama al cambiar de idioma. */
export function resetDateFormatters(): void {
  dtCache.clear();
  nfCache.clear();
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
