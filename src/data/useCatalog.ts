import { useEffect, useState } from 'react';
import {
  exerciseCatalog,
  foodCatalog,
  loadExerciseCatalog,
  loadFoodCatalog,
  type ExerciseCatalog,
  type FoodCatalog,
} from './registry';

/**
 * Carga de catalogos bajo demanda.
 *
 * Una pantalla que necesita ejercicios o alimentos llama al hook que
 * corresponda. Si el catalogo ya esta cargado devuelve el valor y no hay
 * espera; si no, lo descarga y repinta al llegar.
 *
 * Se hace explicito y no automatico a proposito: asi se ve en el codigo de
 * cada pantalla que esa pantalla paga la descarga, y quien anada una nueva
 * tiene que decidirlo en vez de heredarlo sin enterarse.
 */
export function useExerciseCatalog(): ExerciseCatalog | null {
  const [catalog, setCatalog] = useState(exerciseCatalog);

  useEffect(() => {
    if (catalog) return;
    let alive = true;
    void loadExerciseCatalog().then((c) => {
      if (alive) setCatalog(c);
    });
    return () => {
      alive = false;
    };
  }, [catalog]);

  return catalog;
}

export function useFoodCatalog(): FoodCatalog | null {
  const [catalog, setCatalog] = useState(foodCatalog);

  useEffect(() => {
    if (catalog) return;
    let alive = true;
    void loadFoodCatalog().then((c) => {
      if (alive) setCatalog(c);
    });
    return () => {
      alive = false;
    };
  }, [catalog]);

  return catalog;
}
