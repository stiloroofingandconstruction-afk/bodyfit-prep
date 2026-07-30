import { create } from 'zustand';
import { uid } from '@/lib/utils';

export interface Toast {
  id: string;
  message: string;
  tone: 'ok' | 'info' | 'warn' | 'error';
}

interface UIState {
  toasts: Toast[];
  toast: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: string) => void;

  /** Cronometro de descanso entre series. */
  restEndsAt: number | null;
  restTotal: number;
  startRest: (seconds: number) => void;
  stopRest: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],

  toast: (message, tone = 'ok') => {
    const t: Toast = { id: uid(), message, tone };
    set((s) => ({ toasts: [...s.toasts, t] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) })), 2600);
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  restEndsAt: null,
  restTotal: 0,
  startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }),
  stopRest: () => set({ restEndsAt: null, restTotal: 0 }),
}));

export const toast = (message: string, tone?: Toast['tone']) =>
  useUIStore.getState().toast(message, tone);
