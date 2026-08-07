/**
 * Feature flag de sincronizacion.
 *
 * Produccion queda en `disabled`. Un usuario que ya tiene la aplicacion
 * instalada no debe notar **ningun** cambio de comportamiento tras este
 * despliegue: mismo arranque, mismos datos, mismas pantallas.
 *
 * La sincronizacion se activara cuando exista una prueba real en dos
 * dispositivos fisicos, no antes, y no por el hecho de que el codigo este
 * escrito y las pruebas pasen.
 */
import { STORAGE_PREFIX } from '@bodyfit/domain/collections';

/**
 * Lee una variable de compilacion sin dar por hecho que existe `import.meta.env`.
 *
 * En el navegador Vite la sustituye; en Node —las pruebas de dominio corren
 * ahi— `import.meta.env` es `undefined`, y leerlo directamente tumbaba la
 * suite entera con un TypeError que no decia nada del problema real.
 */
function viteEnv(name: string): string | undefined {
  const meta = import.meta as { env?: Record<string, string | undefined> };
  return meta.env?.[name];
}

export type SyncFlag = 'disabled' | 'internal' | 'beta' | 'enabled';

const FLAG_KEY = `${STORAGE_PREFIX}sync:flag`;

export const SYNC_FLAGS: SyncFlag[] = ['disabled', 'internal', 'beta', 'enabled'];

export const SYNC_FLAG_LABEL: Record<SyncFlag, string> = {
  disabled: 'Desactivada — los datos viven solo en este dispositivo',
  internal: 'Interna — activa, sin interfaz de cuenta',
  beta: 'Beta — interfaz de cuenta visible, con aviso',
  enabled: 'Activada',
};

/**
 * El valor con el que se compila.
 *
 * Se lee de una variable de entorno para que un despliegue de prueba pueda
 * llevar `internal` sin tocar el codigo. Si no esta declarada —el caso normal—
 * queda desactivada.
 */
const BUILD_DEFAULT: SyncFlag = ((): SyncFlag => {
  const raw = viteEnv('VITE_SYNC_FLAG');
  return SYNC_FLAGS.includes(raw as SyncFlag) ? (raw as SyncFlag) : 'disabled';
})();

let override: SyncFlag | null = null;

function readStored(): SyncFlag | null {
  try {
    const raw = localStorage.getItem(FLAG_KEY);
    return SYNC_FLAGS.includes(raw as SyncFlag) ? (raw as SyncFlag) : null;
  } catch {
    return null;
  }
}

export function syncFlag(): SyncFlag {
  if (override) return override;
  return readStored() ?? BUILD_DEFAULT;
}

/**
 * Cambia el flag. Solo desde el modo desarrollador.
 *
 * No hay ninguna interfaz normal que llame a esto: activar la sincronizacion no
 * es una preferencia que se ofrezca todavia.
 */
export function setSyncFlag(flag: SyncFlag): void {
  override = flag;
  try {
    localStorage.setItem(FLAG_KEY, flag);
  } catch {
    /* Sin persistencia dura lo que la pestana. Suficiente para probar. */
  }
}

/** ¿Hay que hablar con un servidor? */
export function syncEnabled(): boolean {
  return syncFlag() !== 'disabled';
}

/** ¿Se muestra la interfaz de cuenta? */
export function accountUiVisible(): boolean {
  const flag = syncFlag();
  return flag === 'beta' || flag === 'enabled';
}
