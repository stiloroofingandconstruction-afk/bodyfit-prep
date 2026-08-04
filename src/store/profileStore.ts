import { create } from 'zustand';
import { persisted } from './persist';
import { profileMigrations } from './migrations';
import type { Profile } from '@bodyfit/domain/types';

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
    update: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    completeOnboarding: (patch) =>
      set((s) => ({ profile: { ...s.profile, ...patch, onboarded: true } })),
    reset: () => set({ profile: DEFAULT_PROFILE }),
  }), { migrations: profileMigrations }),
);

export const useProfile = () => useProfileStore((s) => s.profile);
