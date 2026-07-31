/**
 * Internacionalizacion.
 *
 * La app se entrega en espanol. La estructura ya soporta ingles: el diccionario
 * `en` esta completo para las claves declaradas y anadir un idioma nuevo es
 * copiar `es.ts`, traducirlo y registrarlo en `DICTIONARIES`.
 *
 * Convencion de migracion: las pantallas nuevas usan `t('clave')`. Las pantallas
 * heredadas conservan el texto en linea y se van migrando clave a clave sin
 * romper nada, porque `t()` devuelve la clave si no la encuentra.
 */
import { es } from './es';
import { en } from './en';

export type Locale = 'es' | 'en';

export const LOCALE_LABEL: Record<Locale, string> = {
  es: 'Espanol',
  en: 'English',
};

/** Forma del diccionario: las claves de `es` con valores de texto libre. */
export type Dict = Record<keyof typeof es, string>;

const DICTIONARIES: Record<Locale, Partial<Dict>> = { es, en };

let current: Locale = 'es';

export function setLocale(locale: Locale): void {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

/**
 * Traduce una clave. Si falta en el idioma activo cae a espanol, y si tampoco
 * esta devuelve la propia clave: nunca deja la interfaz en blanco.
 *
 * Soporta interpolacion simple: t('prep.weeksOut', { n: 8 })
 */
export function t(key: keyof Dict, vars?: Record<string, string | number>): string {
  const dict = DICTIONARIES[current] ?? es;
  const raw = (dict[key] as string | undefined) ?? (es[key] as string | undefined) ?? String(key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export { es, en };
