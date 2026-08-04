import { create } from 'zustand';
import { alive, newEntity, persisted, softDelete, touch } from './persist';
import { checkinMigrations } from './migrations';
import type { Entity, WeeklyCheckin } from '@bodyfit/domain/types';

type CheckinInput = Omit<WeeklyCheckin, keyof Entity>;

interface CheckinState {
  checkins: WeeklyCheckin[];
  /** Un check-in por semana: si ya existe el de esa semana, se actualiza. */
  upsert: (input: CheckinInput) => WeeklyCheckin;
  remove: (id: string) => void;
}

export const useCheckinStore = create<CheckinState>()(
  persisted<CheckinState>('checkins', (set, get) => ({
    checkins: [],

    upsert: (input) => {
      const existing = alive(get().checkins).find((c) => c.weekStart === input.weekStart);
      if (existing) {
        const updated = touch(existing, input);
        set((s) => ({ checkins: s.checkins.map((c) => (c.id === existing.id ? updated : c)) }));
        return updated;
      }
      const created = newEntity(input) as WeeklyCheckin;
      set((s) => ({ checkins: [...s.checkins, created] }));
      return created;
    },

    remove: (id) =>
      set((s) => ({ checkins: s.checkins.map((c) => (c.id === id ? softDelete(c) : c)) })),
  }), { migrations: checkinMigrations }),
);
