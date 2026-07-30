# BodyFit Prep

Aplicación de bodybuilding, nutrición inteligente y seguimiento físico.
PWA instalable en iPhone desde Safari, funciona sin conexión y se comporta como una app nativa.

> Proyecto independiente. No comparte código, datos ni dependencias con ningún otro proyecto.

## Arranque

```bash
npm install
npm run dev          # http://localhost:5180
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck + build de producción |
| `npm run preview` | Sirve el build (para probar la PWA de verdad) |
| `npm run typecheck` | Solo TypeScript |
| `npm run test:domain` | Prueba de humo de toda la lógica de dominio |
| `npm run icons` | Regenera los iconos PNG de la PWA |

## Arquitectura

Cuatro capas con dependencias en **una sola dirección**:

```
features/  (pantallas y UI)
    ↓
store/     (estado con Zustand + selectores derivados)
    ↓
services/  (persistencia: adaptador intercambiable)
    ↓
domain/    (lógica pura: sin React, sin storage, sin efectos)
    ↑
data/      (catálogos: alimentos y ejercicios)
```

### `domain/` — lógica pura

Cero dependencias de React o del navegador. Todo son funciones puras y por eso
`npm run test:domain` puede verificarlas en Node directamente.

| Archivo | Responsabilidad |
|---|---|
| `types.ts` | Modelo de datos completo |
| `macros.ts` | Cálculo y suma de macros, Atwater 4/4/9 |
| `energy.ts` | BMR (Mifflin-St Jeor), TDEE, objetivo calórico y reparto de macros |
| `solver.ts` | **Solver de porciones** |
| `autoMeal.ts` | Generador de comidas y detección de macros que no se pueden cubrir |
| `training.ts` | 1RM estimado (Epley), volumen, récords, progresión |
| `body.ts` | % grasa (Navy), masa magra, IMC, media móvil y tendencia |
| `checkin.ts` | Análisis semanal y recomendación de ajuste calórico |

### `services/storage/` — el punto de intercambio a Supabase

Toda la app habla con una única interfaz:

```ts
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}
```

Hoy la implementa `localAdapter`. Para migrar a Supabase se cambia **una línea**
en `services/storage/index.ts`. La API ya es asíncrona precisamente para que ese
cambio no obligue a tocar ningún componente.

Además, **cada registro** lleva desde el primer día `id`, `createdAt`,
`updatedAt`, `deletedAt` (borrado lógico) y `userId`. Eso es exactamente lo que
necesita una sincronización last-write-wins, y es lo que evita una migración
dolorosa más adelante. El esquema SQL propuesto y los pasos están escritos en
`services/storage/supabaseAdapter.ts`.

Las **fotos de progreso no van en LocalStorage**: su límite (~5 MB) se agotaría
con dos imágenes y tumbaría el resto del estado. Viven en IndexedDB
(`services/blobStore.ts`), comprimidas a 1280 px / JPEG 0.82 antes de guardarse.

## El motor de nutrición

### 1. Escribes un alimento, la app pregunta los gramos

Nunca se introducen calorías a mano. Escribes `Pollo` → la app pregunta
**"¿Cuántos gramos?"** con un teclado numérico propio (el nativo de iOS empuja
el layout y tarda en aparecer) → calcula kcal, proteína, carbohidratos y grasas.

La base local tiene **149 alimentos** con macros por 100 g, incluidas las marcas
que se usan de verdad: Fairlife (2%, 0%, Core Power, Core Power Elite),
Rice Krispies, Nitro-Tech y Nitro-Tech Whey Gold. Se pueden añadir alimentos
propios; solo se piden los macros y las calorías se derivan para que no puedan
quedar incoherentes.

La búsqueda es insensible a acentos, tolera plurales y erratas (`aguakate` →
Aguacate) y responde en microsegundos sobre un índice construido una sola vez.

### 2. "Quiero comer pollo, arroz y brócoli"

La frase se interpreta, se identifican los alimentos y el solver calcula los
gramos exactos de cada uno para cubrir **los macros que te faltan hoy**.

El problema que resuelve:

```
min_g   Σ_m  w_m · ( (Σ_j a_mj · g_j − r_m) / s_m )²
s.a.    lo_j ≤ g_j ≤ hi_j
```

donde `m` recorre {kcal, proteína, carbohidratos, grasa}, `a_mj` es el macro `m`
por gramo del alimento `j`, `r_m` lo que falta ese día y `s_m` una escala de
normalización (para que 300 kcal y 30 g de proteína pesen lo mismo).

Es una cuadrática convexa con restricciones de caja. Se resuelve por **descenso
por coordenadas usando el mínimo exacto de cada variable** —en una cuadrática el
paso de Newton es exacto— con proyección al intervalo, redondeo a múltiplos de
5 g y un refinado local. **0,01 ms por resolución** y ninguna dependencia.

Puedes fijar la cantidad de un alimento (candado) y el solver reajusta el resto.

**Cuando un macro no se puede cubrir, lo dice.** Pollo + arroz + brócoli no
tienen grasa: en vez de maquillar el resultado, la app propone *"te faltarían
16 g de grasa — añade aceite de oliva, unos 16 g"* con un toque para incluirlo.

### 3. Botón "Completar mis macros"

Elige una fuente de proteína + una de carbohidrato + una de grasa + una verdura
(priorizando tus favoritos y lo que usas a menudo), pasa cada combinación por el
solver y ofrece **3 comidas alternativas** ordenadas por precisión de ajuste.
"Otras" desplaza las listas de candidatos y trae combinaciones distintas, no las
mismas reordenadas.

## Rendimiento

- Cada pantalla es su propio chunk: el arranque solo carga el Dashboard.
- Sin librería de gráficas: los charts son SVG propio (~100 líneas).
- Índice de búsqueda precomputado; selectores memoizados; sin re-renders en cascada.
- Carga inicial: **~102 KB de JS gzip** (77 de los cuales son React) + 6 KB de CSS.

## PWA en iPhone

`display: standalone`, `apple-mobile-web-app-capable`, apple-touch-icon 180×180,
`viewport-fit=cover` con `env(safe-area-inset-*)` para el notch, barra de
pestañas inferior fija, sin zoom por doble toque, scroll con inercia y respuesta
táctil inmediata en cada pulsación.

Instalación: Safari → Compartir → Añadir a pantalla de inicio.
Los iconos se generan con `scripts/generate-icons.mjs`, un codificador PNG
escrito a mano sobre `zlib` — sin dependencias de imagen.

## Estado actual

Verificado: `tsc --noEmit` limpio, build de producción correcto y
`npm run test:domain` en verde (búsqueda, interpretación de frases, solver,
generador de comidas, energía, check-in, composición corporal e integridad del
catálogo de alimentos).
