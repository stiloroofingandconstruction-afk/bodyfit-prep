import { create } from 'zustand';
import { newEntity, persisted, softDelete, touch } from './persist';
import { deletePhoto } from '@/services/blobStore';
import type { Entity } from '@/domain/types';
import type { ProgressPhoto } from '@/domain/prepTypes';

interface PhotoState {
  photos: ProgressPhoto[];
  addPhoto: (input: Omit<ProgressPhoto, keyof Entity>) => ProgressPhoto;
  updatePhoto: (id: string, patch: Partial<ProgressPhoto>) => void;
  /** Borra el registro y tambien el blob de IndexedDB. */
  removePhoto: (id: string) => Promise<void>;
}

export const usePhotoStore = create<PhotoState>()(
  persisted<PhotoState>('photos', (set, get) => ({
    photos: [],

    addPhoto: (input) => {
      const photo = newEntity(input) as ProgressPhoto;
      set((s) => ({ photos: [...s.photos, photo] }));
      return photo;
    },

    updatePhoto: (id, patch) =>
      set((s) => ({ photos: s.photos.map((p) => (p.id === id ? touch(p, patch) : p)) })),

    removePhoto: async (id) => {
      const photo = get().photos.find((p) => p.id === id);
      if (photo) await deletePhoto(photo.blobId).catch(() => undefined);
      set((s) => ({ photos: s.photos.map((p) => (p.id === id ? softDelete(p) : p)) }));
    },
  })),
);
