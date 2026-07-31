import { create } from 'zustand';
import { alive, newEntity, persisted, softDelete, touch } from './persist';
import { nutritionMigrations } from './migrations';
import { macrosFor } from '@/domain/macros';
import { today } from '@/lib/date';
import type { CustomFood, Entity, Food, FoodEntry, MealSlot, Recipe } from '@/domain/types';
import type { NutritionDayType } from '@/domain/prepTypes';

interface NutritionState {
  entries: FoodEntry[];
  customFoods: CustomFood[];
  recipes: Recipe[];
  /** Alimentos marcados como favoritos: aparecen primero y alimentan al generador. */
  favorites: string[];
  /** Ultimos alimentos usados (mas recientes primero, maximo 24). */
  recent: string[];

  addEntry: (input: { food: Food; grams: number; slot: MealSlot; date?: string }) => FoodEntry;
  addEntries: (inputs: { food: Food; grams: number; slot: MealSlot; date?: string }[]) => void;
  updateEntry: (id: string, patch: { grams?: number; slot?: MealSlot }) => void;
  removeEntry: (id: string) => void;
  duplicateDay: (from: string, to: string) => void;

  /** Tipo de dia por fecha: escala el objetivo de macros. */
  dayTypes: Record<string, NutritionDayType>;
  setDayType: (date: string, type: NutritionDayType) => void;

  toggleFavorite: (foodId: string) => void;
  addCustomFood: (food: Omit<CustomFood, keyof Entity | 'custom'>) => CustomFood;
  removeCustomFood: (id: string) => void;

  addRecipe: (name: string, items: { foodId: string; grams: number }[]) => Recipe;
  removeRecipe: (id: string) => void;
}

const MAX_RECENT = 24;

export const useNutritionStore = create<NutritionState>()(
  persisted<NutritionState>('nutrition', (set, get) => ({
    entries: [],
    customFoods: [],
    recipes: [],
    favorites: [],
    recent: [],
    dayTypes: {},

    setDayType: (date, type) =>
      set((s) => ({ dayTypes: { ...s.dayTypes, [date]: type } })),

    addEntry: ({ food, grams, slot, date }) => {
      const entry = newEntity<Omit<FoodEntry, keyof Entity>>({
        date: date ?? today(),
        slot,
        foodId: food.id,
        foodName: food.name,
        grams: Math.round(grams),
        macros: macrosFor(food, grams),
      }) as FoodEntry;

      set((s) => ({
        entries: [...s.entries, entry],
        recent: [food.id, ...s.recent.filter((id) => id !== food.id)].slice(0, MAX_RECENT),
      }));
      return entry;
    },

    addEntries: (inputs) => {
      const add = get().addEntry;
      for (const input of inputs) add(input);
    },

    updateEntry: (id, patch) =>
      set((s) => ({
        entries: s.entries.map((e) => {
          if (e.id !== id) return e;
          const grams = patch.grams ?? e.grams;
          const per100 = { per100: scaleTo100(e) };
          return touch(e, {
            ...patch,
            grams: Math.round(grams),
            macros: macrosFor(per100, grams),
          });
        }),
      })),

    removeEntry: (id) =>
      set((s) => ({ entries: s.entries.map((e) => (e.id === id ? softDelete(e) : e)) })),

    duplicateDay: (from, to) => {
      const source = alive(get().entries).filter((e) => e.date === from);
      const copies = source.map(
        (e) =>
          newEntity<Omit<FoodEntry, keyof Entity>>({
            date: to,
            slot: e.slot,
            foodId: e.foodId,
            foodName: e.foodName,
            grams: e.grams,
            macros: e.macros,
          }) as FoodEntry,
      );
      set((s) => ({ entries: [...s.entries, ...copies] }));
    },

    toggleFavorite: (foodId) =>
      set((s) => ({
        favorites: s.favorites.includes(foodId)
          ? s.favorites.filter((id) => id !== foodId)
          : [foodId, ...s.favorites],
      })),

    addCustomFood: (food) => {
      const created = newEntity({ ...food, custom: true as const }) as CustomFood;
      set((s) => ({ customFoods: [...s.customFoods, created] }));
      return created;
    },

    removeCustomFood: (id) =>
      set((s) => ({ customFoods: s.customFoods.map((f) => (f.id === id ? softDelete(f) : f)) })),

    addRecipe: (name, items) => {
      const recipe = newEntity({ name, items }) as Recipe;
      set((s) => ({ recipes: [...s.recipes, recipe] }));
      return recipe;
    },

    removeRecipe: (id) =>
      set((s) => ({ recipes: s.recipes.map((r) => (r.id === id ? softDelete(r) : r)) })),
  }), { migrations: nutritionMigrations }),
);

/** Reconstruye la tabla por 100 g de una entrada ya registrada. */
function scaleTo100(entry: FoodEntry) {
  const f = 100 / (entry.grams || 100);
  return {
    kcal: entry.macros.kcal * f,
    protein: entry.macros.protein * f,
    carbs: entry.macros.carbs * f,
    fat: entry.macros.fat * f,
    fiber: entry.macros.fiber * f,
  };
}
