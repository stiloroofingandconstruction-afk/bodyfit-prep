import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { zustandStorage } from '@/services/storage';
import { runMigrations, type Migration } from './migrations';
import { storageKey, type CollectionKey } from '@bodyfit/domain/collections';
import { versionOf } from '@bodyfit/domain/versioning';
import { nowISO, uid } from '@/lib/utils';
import type { Entity } from '@bodyfit/domain/types';

/**
 * Envoltorio unico de persistencia.
 *
 * Todos los stores pasan por aqui, asi que cambiar de backend
 * (localStorage -> Supabase) es cambiar `zustandStorage`.
 *
 * El nombre ya no es una cadena libre: es una `CollectionKey` del registro
 * central. Un store con una coleccion sin registrar no compila, que es
 * exactamente el momento en el que hay que enterarse.
 *
 * La version tampoco se decide aqui. La declara el gestor de versiones, que es
 * el unico que sabe si esa coleccion tiene migraciones y por cual va.
 */
export function persisted<T>(
  collection: CollectionKey,
  initializer: StateCreator<T>,
  options: Partial<PersistOptions<T, unknown>> & { migrations?: Record<number, Migration> } = {},
) {
  const { migrations, ...rest } = options;

  return persist(initializer, {
    name: collection,
    version: versionOf(collection),
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

export { storageKey };

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
