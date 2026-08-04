import { create } from 'zustand';
import { alive, newEntity, persisted, softDelete, touch } from './persist';
import { today } from '@/lib/date';
import type { Entity } from '@bodyfit/domain/types';
import type { CompetitionPrep, DailyReadiness } from '@bodyfit/domain/competition';
import type {
  PeakWeekPlan,
  PostShowEntry,
  PostShowPlan,
  PrepRecommendation,
  RecommendationOutcome,
  ShowDayPlan,
} from '@bodyfit/domain/prepTypes';

interface PrepState {
  preps: CompetitionPrep[];
  /** Id del prep activo. */
  activePrepId: string | null;
  readiness: DailyReadiness[];
  recommendations: PrepRecommendation[];
  peakWeekPlans: PeakWeekPlan[];
  showDayPlans: ShowDayPlan[];
  postShowPlans: PostShowPlan[];
  postShowEntries: PostShowEntry[];

  createPrep: (input: Omit<CompetitionPrep, keyof Entity>) => CompetitionPrep;
  updatePrep: (id: string, patch: Partial<CompetitionPrep>) => void;
  deletePrep: (id: string) => void;
  setActivePrep: (id: string | null) => void;

  logReadiness: (input: Partial<Omit<DailyReadiness, keyof Entity>> & { date?: string }) => DailyReadiness;
  removeReadiness: (id: string) => void;

  saveRecommendation: (input: Omit<PrepRecommendation, keyof Entity>) => PrepRecommendation;
  resolveRecommendation: (
    id: string,
    outcome: RecommendationOutcome,
    applied?: { kcal?: number; cardio?: number },
  ) => void;

  savePeakWeek: (plan: Omit<PeakWeekPlan, keyof Entity>) => PeakWeekPlan;
  updatePeakWeek: (id: string, patch: Partial<PeakWeekPlan>) => void;

  saveShowDay: (plan: Omit<ShowDayPlan, keyof Entity>) => ShowDayPlan;
  updateShowDay: (id: string, patch: Partial<ShowDayPlan>) => void;

  savePostShow: (plan: Omit<PostShowPlan, keyof Entity>) => PostShowPlan;
  logPostShow: (input: Omit<PostShowEntry, keyof Entity>) => PostShowEntry;
}

export const usePrepStore = create<PrepState>()(
  persisted<PrepState>('prep', (set, get) => ({
    preps: [],
    activePrepId: null,
    readiness: [],
    recommendations: [],
    peakWeekPlans: [],
    showDayPlans: [],
    postShowPlans: [],
    postShowEntries: [],

    createPrep: (input) => {
      const prep = newEntity(input) as CompetitionPrep;
      set((s) => ({ preps: [...s.preps, prep], activePrepId: prep.id }));
      return prep;
    },

    updatePrep: (id, patch) =>
      set((s) => ({ preps: s.preps.map((p) => (p.id === id ? touch(p, patch) : p)) })),

    deletePrep: (id) =>
      set((s) => ({
        preps: s.preps.map((p) => (p.id === id ? softDelete(p) : p)),
        activePrepId: s.activePrepId === id ? null : s.activePrepId,
      })),

    setActivePrep: (id) => set({ activePrepId: id }),

    /** Un registro por dia: si ya existe el de esa fecha, se completa. */
    logReadiness: (input) => {
      const date = input.date ?? today();
      const existing = alive(get().readiness).find((r) => r.date === date);
      if (existing) {
        const updated = touch(existing, { ...input, date });
        set((s) => ({ readiness: s.readiness.map((r) => (r.id === existing.id ? updated : r)) }));
        return updated;
      }
      const created = newEntity({ ...input, date }) as DailyReadiness;
      set((s) => ({ readiness: [...s.readiness, created] }));
      return created;
    },

    removeReadiness: (id) =>
      set((s) => ({ readiness: s.readiness.map((r) => (r.id === id ? softDelete(r) : r)) })),

    saveRecommendation: (input) => {
      const existing = alive(get().recommendations).find((r) => r.weekStart === input.weekStart);
      if (existing) {
        const updated = touch(existing, input);
        set((s) => ({
          recommendations: s.recommendations.map((r) => (r.id === existing.id ? updated : r)),
        }));
        return updated;
      }
      const created = newEntity(input) as PrepRecommendation;
      set((s) => ({ recommendations: [...s.recommendations, created] }));
      return created;
    },

    resolveRecommendation: (id, outcome, applied) =>
      set((s) => ({
        recommendations: s.recommendations.map((r) =>
          r.id === id
            ? touch(r, {
                outcome,
                ...(applied?.kcal != null ? { appliedKcalDelta: applied.kcal } : {}),
                ...(applied?.cardio != null ? { appliedCardioDelta: applied.cardio } : {}),
              })
            : r,
        ),
      })),

    savePeakWeek: (plan) => {
      const existing = alive(get().peakWeekPlans).find((p) => p.prepId === plan.prepId);
      if (existing) {
        const updated = touch(existing, plan);
        set((s) => ({
          peakWeekPlans: s.peakWeekPlans.map((p) => (p.id === existing.id ? updated : p)),
        }));
        return updated;
      }
      const created = newEntity(plan) as PeakWeekPlan;
      set((s) => ({ peakWeekPlans: [...s.peakWeekPlans, created] }));
      return created;
    },

    updatePeakWeek: (id, patch) =>
      set((s) => ({
        peakWeekPlans: s.peakWeekPlans.map((p) => (p.id === id ? touch(p, patch) : p)),
      })),

    saveShowDay: (plan) => {
      const existing = alive(get().showDayPlans).find((p) => p.prepId === plan.prepId);
      if (existing) {
        const updated = touch(existing, plan);
        set((s) => ({
          showDayPlans: s.showDayPlans.map((p) => (p.id === existing.id ? updated : p)),
        }));
        return updated;
      }
      const created = newEntity(plan) as ShowDayPlan;
      set((s) => ({ showDayPlans: [...s.showDayPlans, created] }));
      return created;
    },

    updateShowDay: (id, patch) =>
      set((s) => ({
        showDayPlans: s.showDayPlans.map((p) => (p.id === id ? touch(p, patch) : p)),
      })),

    savePostShow: (plan) => {
      const existing = alive(get().postShowPlans).find((p) => p.prepId === plan.prepId);
      if (existing) {
        const updated = touch(existing, plan);
        set((s) => ({
          postShowPlans: s.postShowPlans.map((p) => (p.id === existing.id ? updated : p)),
        }));
        return updated;
      }
      const created = newEntity(plan) as PostShowPlan;
      set((s) => ({ postShowPlans: [...s.postShowPlans, created] }));
      return created;
    },

    logPostShow: (input) => {
      const existing = alive(get().postShowEntries).find((p) => p.date === input.date);
      if (existing) {
        const updated = touch(existing, input);
        set((s) => ({
          postShowEntries: s.postShowEntries.map((p) => (p.id === existing.id ? updated : p)),
        }));
        return updated;
      }
      const created = newEntity(input) as PostShowEntry;
      set((s) => ({ postShowEntries: [...s.postShowEntries, created] }));
      return created;
    },
  })),
);
