import { STORAGE_PREFIX, type StorageAdapter } from './types';

/**
 * Adaptador sobre localStorage.
 *
 * Es sincrono por dentro pero expone una API asincrona para que el dia que
 * entre Supabase no haya que tocar ni una linea de los stores.
 */
export const localAdapter: StorageAdapter = {
  name: 'localStorage',

  async getItem(key) {
    try {
      return window.localStorage.getItem(STORAGE_PREFIX + key);
    } catch {
      return null; // modo privado de Safari puede lanzar
    }
  },

  async setItem(key, value) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (err) {
      // Cuota agotada: lo mas probable es que sean fotos. Se avisa por consola
      // en vez de romper la app; las fotos viven en IndexedDB por este motivo.
      console.error('[storage] no se pudo guardar', key, err);
    }
  },

  async removeItem(key) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* ignorar */
    }
  },

  async listKeys() {
    const out: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) out.push(k.slice(STORAGE_PREFIX.length));
      }
    } catch {
      /* ignorar */
    }
    return out;
  },
};
