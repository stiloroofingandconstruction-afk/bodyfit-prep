/**
 * Globales universales que el dominio si puede usar.
 *
 * El `tsconfig` de este paquete no incluye `DOM` en `lib`, a proposito: es lo
 * que garantiza que nadie escriba `window`, `document` o `localStorage` aqui.
 * El efecto secundario es que tampoco declara APIs que TypeScript clasifica
 * como DOM pero que en realidad existen en los tres entornos donde este
 * paquete tiene que correr.
 *
 * `URL` es una de ellas: es el estandar WHATWG, y esta en el navegador, en
 * Node desde la version 10 y en Deno. Usarla no rompe la portabilidad.
 *
 * Esta lista debe quedarse corta. Cada entrada nueva es una promesa de que ese
 * global existe en navegador, Node y Deno; si hay duda, no se anade.
 */

declare class URL {
  constructor(url: string, base?: string);
  readonly protocol: string;
  readonly hostname: string;
  readonly pathname: string;
  readonly search: string;
  readonly searchParams: { get(name: string): string | null };
  readonly href: string;
}
