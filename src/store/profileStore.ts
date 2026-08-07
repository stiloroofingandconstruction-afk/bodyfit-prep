import { create } from 'zustand';
import { persisted } from './persist';
import { profileMigrations } from './migrations';
import type { Profile } from '@bodyfit/domain/types';
import { recordSingleton } from './syncRecorder';

export const DEFAULT_PROFILE: Profile = {
  name: '',
  sex: 'hombre',
  birthDate: '1995-01-01',
  heightCm: 175,
  startWeight: 80,
  goalWeight: undefined,
  activity: 'moderado',
  goal: 'definicion',
  paceWeekPct: 0.6,
  proteinPerKg: 2.0,
  fatPerKg: 0.8,
  kcalOverride: null,
  units: 'metric',
  onboarded: false,
};

interface ProfileState {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persisted<ProfileState>('profile', (set) => ({
    profile: DEFAULT_PROFILE,
    update: (patch) => {
      set((s) => ({ profile: { ...s.profile, ...patch } }));
      recordSingleton('profile', patch as Record<string, unknown>);
    },
    completeOnboarding: (patch) => {
      set((s) => ({ profile: { ...s.profile, ...patch, onboarded: true } }));
      /*
       * El onboarding tambien emite. Es donde se fija el peso inicial, y sin
       * esto cada dispositivo se quedaba con el suyo: el mismo progreso salia
       * calculado distinto en cada uno.
       */
      recordSingleton('profile', { ...patch, onboarded: true } as Record<string, unknown>);
    },
    reset: () => set({ profile: DEFAULT_PROFILE }),
  }), { migrations: profileMigrations }),
);

export const useProfile = () => useProfileStore((s) => s.profile);
