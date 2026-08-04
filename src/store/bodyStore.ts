import { create } from 'zustand';
import { alive, newEntity, persisted, softDelete, touch } from './persist';
import { bodyMigrations } from './migrations';
import { today } from '@/lib/date';
import type { BodyMeasurement, Entity } from '@bodyfit/domain/types';

type MeasurementInput = Partial<Omit<BodyMeasurement, keyof Entity | 'date'>> & { date?: string };

interface BodyState {
  measurements: BodyMeasurement[];
  /** Crea o actualiza la medicion de un dia (una por fecha). */
  upsert: (input: MeasurementInput) => BodyMeasurement;
  remove: (id: string) => void;
  attachPhoto: (date: string, photoId: string) => void;
  detachPhoto: (date: string, photoId: string) => void;
}

export const useBodyStore = create<BodyState>()(
  persisted<BodyState>('body', (set, get) => ({
    measurements: [],

    upsert: (input) => {
      const date = input.date ?? today();
      const existing = alive(get().measurements).find((m) => m.date === date);

      if (existing) {
        const updated = touch(existing, { ...input, date });
        set((s) => ({ measurements: s.measurements.map((m) => (m.id === existing.id ? updated : m)) }));
        return updated;
      }
      const created = newEntity<Omit<BodyMeasurement, keyof Entity>>({
        ...input,
        date,
      } as Omit<BodyMeasurement, keyof Entity>) as BodyMeasurement;
      set((s) => ({ measurements: [...s.measurements, created] }));
      return created;
    },

    remove: (id) =>
      set((s) => ({ measurements: s.measurements.map((m) => (m.id === id ? softDelete(m) : m)) })),

    attachPhoto: (date, photoId) => {
      const m = get().upsert({ date });
      set((s) => ({
        measurements: s.measurements.map((x) =>
          x.id === m.id ? touch(x, { photoIds: [...(x.photoIds ?? []), photoId] }) : x,
        ),
      }));
    },

    detachPhoto: (date, photoId) =>
      set((s) => ({
        measurements: s.measurements.map((x) =>
          x.date === date
            ? touch(x, { photoIds: (x.photoIds ?? []).filter((id) => id !== photoId) })
            : x,
        ),
      })),
  }), { migrations: bodyMigrations }),
);
