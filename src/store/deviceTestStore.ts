import { create } from 'zustand';
import { persisted } from './persist';
import { nowISO } from '@/lib/utils';

/**
 * Estado de la lista de comprobacion en dispositivo real.
 *
 * Solo guarda lo que ha marcado una persona. Ningun proceso automatico escribe
 * aqui: si la app pudiera marcar sus propias casillas, la lista dejaria de
 * significar nada.
 */
interface DeviceTestState {
  checked: Record<string, boolean>;
  checkedAt: string | null;
  toggle: (id: string) => void;
  reset: () => void;
}

export const useDeviceTestStore = create<DeviceTestState>()(
  persisted<DeviceTestState>('deviceTest', (set) => ({
    checked: {},
    checkedAt: null,

    toggle: (id) =>
      set((s) => ({
        checked: { ...s.checked, [id]: !s.checked[id] },
        checkedAt: nowISO(),
      })),

    reset: () => set({ checked: {}, checkedAt: null }),
  })),
);
