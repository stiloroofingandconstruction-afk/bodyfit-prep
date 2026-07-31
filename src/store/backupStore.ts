import { create } from 'zustand';
import { persisted } from './persist';
import { nowISO } from '@/lib/utils';

/**
 * Estado de las copias de seguridad.
 *
 * Va en su propio store para que sobreviva a cualquier cosa: si la nutricion o
 * el entrenamiento se corrompen, la fecha de la ultima copia sigue ahi y el
 * usuario sabe a que punto puede volver.
 */
interface BackupState {
  /** ISO de la ultima copia creada correctamente. */
  lastBackupAt: string | null;
  /** Numero de copias creadas. Solo informativo. */
  backupCount: number;
  /** ISO de la ultima restauracion. */
  lastRestoreAt: string | null;

  /** Recordatorio interno activo. */
  remindEnabled: boolean;
  /** Cada cuantos dias recordar. */
  remindEveryDays: number;
  /** El usuario aplazo el aviso; no volver a mostrarlo hasta pasado un dia. */
  remindSnoozedAt: string | null;

  /**
   * Descarga automatica: al abrir la app, si toca copia, se genera y se
   * descarga sin pedir nada. Desactivado por defecto porque en iOS cada
   * descarga abre un dialogo del sistema.
   */
  autoDownload: boolean;

  markBackedUp: () => void;
  markRestored: () => void;
  snooze: () => void;
  update: (patch: Partial<BackupState>) => void;
}

export const useBackupStore = create<BackupState>()(
  persisted<BackupState>('backup', (set) => ({
    lastBackupAt: null,
    backupCount: 0,
    lastRestoreAt: null,
    remindEnabled: true,
    remindEveryDays: 7,
    remindSnoozedAt: null,
    autoDownload: false,

    markBackedUp: () =>
      set((s) => ({
        lastBackupAt: nowISO(),
        backupCount: s.backupCount + 1,
        remindSnoozedAt: null,
      })),

    markRestored: () => set({ lastRestoreAt: nowISO() }),

    snooze: () => set({ remindSnoozedAt: nowISO() }),

    update: (patch) => set(patch),
  })),
);
