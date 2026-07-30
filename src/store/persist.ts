import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { zustandStorage } from '@/services/storage';
import { nowISO, uid } from '@/lib/utils';
import type { Entity } from '@/domain/types';

/**
 * Envoltorio unico de persistencia. Todos los stores pasan por aqui, asi que
 * cambiar de backend (localStorage -> Supabase) es cambiar `zustandStorage`.
 */
export function persisted<T>(
  name: string,
  initializer: StateCreator<T>,
  options: Partial<PersistOptions<T, unknown>> = {},
) {
  return persist(initializer, {
    name,
    version: 1,
    storage: createJSONStorage(() => zustandStorage),
    ...options,
  } as PersistOptions<T, unknown>);
}

/** Crea una entidad nueva con los campos de sincronizacion ya rellenos. */
export function newEntity<T extends object>(data: T): T & Entity {
  const ts = nowISO();
  return { id: uid(), createdAt: ts, updatedAt: ts, deletedAt: null, userId: null, ...data };
}

/** Aplica un parche marcando `updatedAt` (base del last-write-wins al sincronizar). */
export function touch<T extends Entity>(entity: T, patch: Partial<T>): T {
  return { ...entity, ...patch, updatedAt: nowISO() };
}

/** Borrado logico: el registro se conserva para que la sincronizacion lo propague. */
export function softDelete<T extends Entity>(entity: T): T {
  return { ...entity, deletedAt: nowISO(), updatedAt: nowISO() };
}

export function alive<T extends Entity>(list: T[]): T[] {
  return list.filter((e) => !e.deletedAt);
}
