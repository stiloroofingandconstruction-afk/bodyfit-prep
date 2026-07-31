import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { zustandStorage } from '@/services/storage';
import { runMigrations, type Migration } from './migrations';
import { nowISO, uid } from '@/lib/utils';
import type { Entity } from '@/domain/types';

/**
 * Envoltorio unico de persistencia. Todos los stores pasan por aqui, asi que
 * cambiar de backend (localStorage -> Supabase) es cambiar `zustandStorage`.
 */
export function persisted<T>(
  name: string,
  initializer: StateCreator<T>,
  options: Partial<PersistOptions<T, unknown>> & { migrations?: Record<number, Migration> } = {},
) {
  const { migrations, ...rest } = options;

  return persist(initializer, {
    name,
    version: migrations ? STORE_VERSION : 1,
    storage: createJSONStorage(() => zustandStorage),
    /*
     * Las migraciones se conectan aqui y no en cada store para que ninguna se
     * quede sin enganchar. Antes existian escritas pero sin llamar: los datos
     * antiguos llegaban a las pantallas sin los campos nuevos.
     */
    ...(migrations
      ? {
          migrate: (state: unknown, version: number) =>
            runMigrations(state, version, migrations),
        }
      : {}),
    ...rest,
  } as PersistOptions<T, unknown>);
}

/**
 * Version actual de cualquier coleccion con migraciones.
 *
 * Sube de uno en uno y se anade la funcion correspondiente en `migrations.ts`.
 * Los stores sin migraciones se quedan en 1: no hay nada que transformar.
 */
export const STORE_VERSION = 2;

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
