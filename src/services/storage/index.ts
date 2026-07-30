import { localAdapter } from './localAdapter';
import type { StorageAdapter } from './types';

/**
 * ── PUNTO DE INTERCAMBIO ─────────────────────────────────────────────────────
 * Hoy: localStorage.
 * Manana: `export const storage = supabaseAdapter;` y nada mas cambia.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const storage: StorageAdapter = localAdapter;

export * from './types';
export { localAdapter } from './localAdapter';

/**
 * Puente entre el adaptador y el middleware `persist` de zustand.
 * `persist` acepta almacenamiento asincrono, asi que sirve tal cual para
 * cualquier backend remoto.
 */
export const zustandStorage = {
  getItem: (name: string) => storage.getItem(name),
  setItem: (name: string, value: string) => storage.setItem(name, value),
  removeItem: (name: string) => storage.removeItem(name),
};

/** Exporta todo el estado de la app como un unico JSON. */
export async function exportAll(): Promise<string> {
  const keys = await storage.listKeys();
  const data: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = await storage.getItem(key);
    if (raw == null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }
  return JSON.stringify(
    { app: 'BodyFit Prep', schema: 1, exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
}

/** Importa un backup previo. Sobrescribe las colecciones presentes en el archivo. */
export async function importAll(json: string): Promise<{ imported: string[] }> {
  const parsed = JSON.parse(json) as { data?: Record<string, unknown> };
  const data = parsed.data ?? (parsed as Record<string, unknown>);
  const imported: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    await storage.setItem(key, JSON.stringify(value));
    imported.push(key);
  }
  return { imported };
}

/** Borra todo. Usado por "Reiniciar aplicacion" en Ajustes. */
export async function clearAll(): Promise<void> {
  for (const key of await storage.listKeys()) await storage.removeItem(key);
}
