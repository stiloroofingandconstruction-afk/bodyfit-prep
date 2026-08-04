import { create } from 'zustand';
import { newEntity, persisted, softDelete, touch } from './persist';
import { deletePhoto } from '@/services/blobStore';
import type { Entity } from '@bodyfit/domain/types';
import type { ProgressPhoto } from '@bodyfit/domain/prepTypes';
import { recordDelete, recordUpsert } from './syncRecorder';

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
      // `local-only`: en la 2.1 el binario NO sale del dispositivo.
      const photo = newEntity({ uploadState: 'local-only', ...input }) as ProgressPhoto;
      set((s) => ({ photos: [...s.photos, photo] }));
      /*
       * Viajan los metadatos, nunca el binario. `blobId` es una clave del
       * IndexedDB de ESTE dispositivo y en otro no apunta a nada: se manda para
       * que el origen sea identificable, no para que el destino la resuelva.
       */
      recordUpsert('photos', photo);
      return photo;
    },

    updatePhoto: (id, patch) =>
      set((s) => ({ photos: s.photos.map((p) => (p.id === id ? touch(p, patch) : p)) })),

    removePhoto: async (id) => {
      const photo = get().photos.find((p) => p.id === id);
      if (photo) await deletePhoto(photo.blobId).catch(() => undefined);
      set((s) => ({ photos: s.photos.map((p) => (p.id === id ? softDelete(p) : p)) }));
      recordDelete('photos', id);
    },
  })),
);
