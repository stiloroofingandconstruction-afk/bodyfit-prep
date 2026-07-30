/** Utilidades generales. */

/** Concatena clases ignorando falsy. Reemplaza a clsx sin la dependencia. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function uid(prefix = ''): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function pct(value: number, total: number): number {
  if (!total) return 0;
  return clamp((value / total) * 100, 0, 100);
}

/** Formatea numeros de macros: sin decimales si es grande, con uno si es pequeno. */
export function fmtNum(n: number, decimals?: number): string {
  if (decimals != null) return n.toFixed(decimals);
  if (Math.abs(n) >= 100) return Math.round(n).toString();
  if (Math.abs(n) >= 10) return (Math.round(n * 10) / 10).toString();
  return (Math.round(n * 10) / 10).toString();
}

export function fmtKg(n: number): string {
  return `${(Math.round(n * 10) / 10).toFixed(1)} kg`;
}

export function fmtSigned(n: number, unit = ''): string {
  const r = Math.round(n * 10) / 10;
  return `${r > 0 ? '+' : ''}${r}${unit}`;
}

/** Vibracion tactil corta (iOS solo la soporta parcialmente; degrada en silencio). */
export function haptic(ms = 8): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no soportado */
  }
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

export function download(filename: string, content: string, type = 'application/json'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
