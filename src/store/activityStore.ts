import { create } from 'zustand';
import { alive, newEntity, persisted, softDelete, touch } from './persist';
import { today } from '@/lib/date';
import type { Entity } from '@bodyfit/domain/types';
import type { CardioPlan, CardioSession, PosingSession, StepEntry } from '@bodyfit/domain/prepTypes';

interface ActivityState {
  cardioSessions: CardioSession[];
  cardioPlans: CardioPlan[];
  steps: StepEntry[];
  posingSessions: PosingSession[];

  addCardio: (input: Omit<CardioSession, keyof Entity>) => CardioSession;
  updateCardio: (id: string, patch: Partial<CardioSession>) => void;
  toggleCardioDone: (id: string) => void;
  removeCardio: (id: string) => void;

  saveCardioPlan: (plan: Omit<CardioPlan, keyof Entity>) => CardioPlan;
  /** Crea las sesiones planificadas de la semana a partir del plan. */
  materializePlan: (plan: CardioPlan, dates: string[]) => void;

  setSteps: (date: string, steps: number) => void;

  addPosing: (input: Omit<PosingSession, keyof Entity>) => PosingSession;
  removePosing: (id: string) => void;
}

export const useActivityStore = create<ActivityState>()(
  persisted<ActivityState>('activity', (set, get) => ({
    cardioSessions: [],
    cardioPlans: [],
    steps: [],
    posingSessions: [],

    addCardio: (input) => {
      const session = newEntity(input) as CardioSession;
      set((s) => ({ cardioSessions: [...s.cardioSessions, session] }));
      return session;
    },

    updateCardio: (id, patch) =>
      set((s) => ({
        cardioSessions: s.cardioSessions.map((c) => (c.id === id ? touch(c, patch) : c)),
      })),

    toggleCardioDone: (id) =>
      set((s) => ({
        cardioSessions: s.cardioSessions.map((c) =>
          c.id === id ? touch(c, { completed: !c.completed }) : c,
        ),
      })),

    removeCardio: (id) =>
      set((s) => ({
        cardioSessions: s.cardioSessions.map((c) => (c.id === id ? softDelete(c) : c)),
      })),

    saveCardioPlan: (plan) => {
      const existing = alive(get().cardioPlans).find((p) => p.weekStart === plan.weekStart);
      if (existing) {
        const updated = touch(existing, plan);
        set((s) => ({
          cardioPlans: s.cardioPlans.map((p) => (p.id === existing.id ? updated : p)),
        }));
        return updated;
      }
      const created = newEntity(plan) as CardioPlan;
      set((s) => ({ cardioPlans: [...s.cardioPlans, created] }));
      return created;
    },

    materializePlan: (plan, dates) => {
      const existing = alive(get().cardioSessions);
      const created: CardioSession[] = [];
      for (const date of dates.slice(0, plan.sessionsPerWeek)) {
        // No se duplica si ya hay una sesion planificada ese dia
        if (existing.some((c) => c.date === date && c.planned)) continue;
        created.push(
          newEntity({
            date,
            type: plan.type,
            minutes: plan.minutesPerSession,
            intensity: plan.intensity,
            planned: true,
            completed: false,
          }) as CardioSession,
        );
      }
      if (created.length) set((s) => ({ cardioSessions: [...s.cardioSessions, ...created] }));
    },

    setSteps: (date, steps) => {
      const existing = alive(get().steps).find((e) => e.date === date);
      if (existing) {
        set((s) => ({
          steps: s.steps.map((e) => (e.id === existing.id ? touch(e, { steps }) : e)),
        }));
        return;
      }
      const created = newEntity({ date: date || today(), steps }) as StepEntry;
      set((s) => ({ steps: [...s.steps, created] }));
    },

    addPosing: (input) => {
      const session = newEntity(input) as PosingSession;
      set((s) => ({ posingSessions: [...s.posingSessions, session] }));
      return session;
    },

    removePosing: (id) =>
      set((s) => ({
        posingSessions: s.posingSessions.map((p) => (p.id === id ? softDelete(p) : p)),
      })),
  })),
);
