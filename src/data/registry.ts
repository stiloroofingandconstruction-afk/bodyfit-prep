/**
 * Registro de catalogos — punteros, no datos.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE EXISTE ESTE ARCHIVO
 *
 * Los catalogos pesan: 100 ejercicios con 16 campos de tecnica cada uno, 151
 * alimentos, poses y rutinas. Antes acababan enteros en el chunk de arranque,
 * y por un motivo que no era obvio: los *stores* los importaban.
 *
 * Un store es codigo que se carga siempre, porque la barra de pestanas y el
 * dashboard lo necesitan al primer pintado. Bastaba con que `trainingStore`
 * hiciera `import { EXERCISE_BY_ID } from '@/data/exercises'` para que las 100
 * fichas tecnicas viajaran a un telefono que quiza solo iba a registrar
 * comidas.
 *
 * Este modulo rompe esa cadena. No contiene datos: contiene una referencia que
 * se rellena cuando el catalogo se carga de verdad, y los stores preguntan por
 * ella en vez de importarla.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Regla: nadie fuera de `data/` importa un catalogo directamente desde codigo
 * que se cargue siempre. Si hace falta en un store, se pide aqui.
 */
import type { Exercise, Food, Routine } from '@bodyfit/domain/types';

/* ═══════════════════════════════════════════════════════ ejercicios ═════ */

export interface ExerciseCatalog {
  all: Exercise[];
  byId: ReadonlyMap<string, Exercise>;
  routines: Routine[];
}

let exercises: ExerciseCatalog | null = null;
let exercisesPromise: Promise<ExerciseCatalog> | null = null;
/**
 * Si las rutinas de fabrica ya se registraron.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Sin esta marca, el catalogo se daba por completo teniendo solo los
 * ejercicios.
 *
 * Nueve pantallas importan `@/data/exercises` de forma estatica —es correcto:
 * son rutas diferidas, el catalogo viaja con ellas— y ese import registra los
 * ejercicios al evaluarse, dejando `routines` vacio. `exerciseCatalog()`
 * devolvia entonces un objeto no nulo, el hook concluia "ya esta cargado" y NO
 * LLEGABA A PEDIR el modulo de rutinas nunca.
 *
 * Resultado: en Entrenamiento no aparecia ninguna rutina, solo "Entreno libre",
 * y no habia forma de elegir otra cosa. El chunk de rutinas existia en `dist` y
 * el navegador no lo pedia jamas.
 * ─────────────────────────────────────────────────────────────────────────────
 */
let routinesRegistered = false;

/**
 * Lo llaman los propios modulos de catalogo al evaluarse.
 *
 * Asi el registro queda relleno lo cargue quien lo cargue: el hook de una
 * pantalla, un import estatico de otra, o una prueba. No hay un unico camino
 * correcto que haya que recordar.
 */
export function registerExercises(all: Exercise[], byId: ReadonlyMap<string, Exercise>): void {
  exercises = { all, byId, routines: exercises?.routines ?? [] };
}

export function registerRoutines(routines: Routine[]): void {
  routinesRegistered = true;
  if (exercises) exercises.routines = routines;
  else exercises = { all: [], byId: new Map(), routines };
}

/**
 * El catalogo si ya esta cargado, o `null`.
 *
 * Para codigo sincrono que no puede esperar: un store resolviendo el nombre de
 * un ejercicio. Devolver `null` no es un fallo, es "todavia no", y quien
 * pregunta debe tener un plan para ese caso.
 */
export function exerciseCatalog(): ExerciseCatalog | null {
  // Completo significa ejercicios Y rutinas. Con solo una de las dos partes,
  // quien pregunte debe seguir esperando en vez de creer que ya lo tiene todo.
  return exercises && routinesRegistered ? exercises : null;
}

/**
 * Carga el catalogo de ejercicios. Idempotente y con la promesa cacheada: diez
 * pantallas pidiendolo a la vez producen una sola descarga.
 */
export function loadExerciseCatalog(): Promise<ExerciseCatalog> {
  if (exercises && routinesRegistered) return Promise.resolve(exercises);
  exercisesPromise ??= Promise.all([import('./exercises'), import('./routines')]).then(
    ([m, r]) => {
      registerExercises(m.EXERCISES, m.EXERCISE_BY_ID);
      registerRoutines(r.BUILTIN_ROUTINES);
      return exercises!;
    },
  );
  return exercisesPromise;
}

/**
 * Nombre legible de un ejercicio, sin esperar.
 *
 * Si el catalogo no esta cargado devuelve el identificador. En la practica no
 * ocurre: para anadir un ejercicio hay que haber abierto el selector, y el
 * selector carga el catalogo. El respaldo existe para que un caso raro degrade
 * a un texto feo en vez de a un fallo.
 */
export function exerciseName(id: string): string {
  return exercises?.byId.get(id)?.name ?? id;
}

/** Rutinas de fabrica ya cargadas. Vacio mientras el catalogo no este. */
export function builtinRoutines(): Routine[] {
  return exercises?.routines ?? [];
}

/* ════════════════════════════════════════════════════════ alimentos ═════ */

export interface FoodCatalog {
  all: Food[];
}

let foods: FoodCatalog | null = null;
let foodsPromise: Promise<FoodCatalog> | null = null;

export function registerFoods(all: Food[]): void {
  foods = { all };
}

export function foodCatalog(): FoodCatalog | null {
  return foods;
}

export function loadFoodCatalog(): Promise<FoodCatalog> {
  if (foods) return Promise.resolve(foods);
  foodsPromise ??= import('./foods').then((m) => {
    registerFoods(m.FOODS);
    return foods!;
  });
  return foodsPromise;
}

/* ═════════════════════════════════════════════════════════ pruebas ══════ */

/**
 * Precarga sincrona para pruebas y para el generador de documentos.
 *
 * En Node no hay pantallas que disparen la carga, y esperar un `import()` en
 * mitad de una prueba de dominio no aporta nada.
 */
export function primeCatalogs(input: {
  exercises?: ExerciseCatalog;
  foods?: FoodCatalog;
}): void {
  if (input.exercises) exercises = input.exercises;
  if (input.foods) foods = input.foods;
}
