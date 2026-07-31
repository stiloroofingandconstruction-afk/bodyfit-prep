/**
 * Capa de unidades para la interfaz.
 *
 * PRINCIPIO CENTRAL: el almacenamiento es SIEMPRE canonico — kg y cm. Aqui solo
 * se convierte para mostrar y para leer lo que escribe el usuario. Asi cambiar
 * de unidad no toca ni un dato guardado y no hay error acumulativo por
 * redondeos sucesivos.
 *
 *   guardado (kg) ──toDisplay──► pantalla (lb)
 *   pantalla (lb) ──toCanonical──► guardado (kg)
 */
import { useMemo } from 'react';
import {
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
  type LengthUnit,
  type WeightUnit,
} from '@/domain/units';
import { useSettingsStore } from '@/store/settingsStore';

const KM_PER_MI = 1.609344;

export interface UnitsApi {
  weightUnit: WeightUnit;
  lengthUnit: LengthUnit;
  distanceUnit: 'km' | 'mi';

  /** Etiquetas listas para pintar. */
  w: string;
  l: string;
  d: string;

  /* ── peso ──────────────────────────────────────────────────────────── */
  /** kg guardados -> numero en la unidad del usuario. */
  toDisplayWeight: (kg: number) => number;
  /** numero del usuario -> kg para guardar. */
  toCanonicalWeight: (value: number) => number;
  /** "82.4 kg" o "181.7 lb". */
  fmtWeight: (kg: number, decimals?: number) => string;
  /** "+0.4 kg" con signo. */
  fmtWeightDelta: (kgDelta: number, decimals?: number) => string;
  /** Solo el numero, sin unidad. */
  numWeight: (kg: number, decimals?: number) => string;
  /** Paso natural del control (0.1 kg / 0.2 lb). */
  weightStep: number;
  /** Limites de un control de peso corporal en la unidad activa. */
  weightRange: { min: number; max: number };

  /* ── longitud ──────────────────────────────────────────────────────── */
  toDisplayLength: (cm: number) => number;
  toCanonicalLength: (value: number) => number;
  fmtLength: (cm: number, decimals?: number) => string;
  numLength: (cm: number, decimals?: number) => string;
  lengthStep: number;

  /* ── distancia ─────────────────────────────────────────────────────── */
  toDisplayDistance: (km: number) => number;
  toCanonicalDistance: (value: number) => number;
  fmtDistance: (km: number, decimals?: number) => string;

  /* ── ratios por peso corporal (proteina y grasa) ───────────────────── */
  /** "g/kg" o "g/lb". */
  perW: string;
  /** g por kg guardados -> g por unidad del usuario. */
  toDisplayPerWeight: (gPerKg: number) => number;
  toCanonicalPerWeight: (value: number) => number;
  /** Rango y paso del control de ratio en la unidad activa. */
  perWeightRange: (minPerKg: number, maxPerKg: number) => { min: number; max: number; step: number };
}

/**
 * Construye el API de unidades. Se separa del hook para poder usarlo en
 * exportaciones y pruebas sin React.
 */
export function makeUnits(weightUnit: WeightUnit, lengthUnit: LengthUnit): UnitsApi {
  const distanceUnit: 'km' | 'mi' = lengthUnit === 'cm' ? 'km' : 'mi';

  const toDisplayWeight = (kg: number) => (weightUnit === 'kg' ? kg : kgToLb(kg));
  const toCanonicalWeight = (v: number) => (weightUnit === 'kg' ? v : lbToKg(v));
  const toDisplayLength = (cm: number) => (lengthUnit === 'cm' ? cm : cmToIn(cm));
  const toCanonicalLength = (v: number) => (lengthUnit === 'cm' ? v : inToCm(v));
  const toDisplayDistance = (km: number) => (distanceUnit === 'km' ? km : km / KM_PER_MI);
  const toCanonicalDistance = (v: number) => (distanceUnit === 'km' ? v : v * KM_PER_MI);

  /** Decimales sensatos: en libras y pulgadas un decimal ya sobra. */
  const wDec = weightUnit === 'kg' ? 1 : 1;
  const lDec = lengthUnit === 'cm' ? 1 : 2;

  const numWeight = (kg: number, decimals = wDec) => toDisplayWeight(kg).toFixed(decimals);
  const numLength = (cm: number, decimals = lDec) => toDisplayLength(cm).toFixed(decimals);

  return {
    weightUnit,
    lengthUnit,
    distanceUnit,
    w: weightUnit,
    l: lengthUnit,
    d: distanceUnit,

    toDisplayWeight,
    toCanonicalWeight,
    fmtWeight: (kg, decimals = wDec) => `${numWeight(kg, decimals)} ${weightUnit}`,
    fmtWeightDelta: (kgDelta, decimals = wDec) => {
      const v = toDisplayWeight(kgDelta);
      // -0.0 es feo y confunde: se normaliza a 0.0
      const shown = Math.abs(v) < 10 ** -decimals / 2 ? 0 : v;
      return `${shown > 0 ? '+' : ''}${shown.toFixed(decimals)} ${weightUnit}`;
    },
    numWeight,
    weightStep: weightUnit === 'kg' ? 0.1 : 0.2,
    weightRange: weightUnit === 'kg' ? { min: 30, max: 300 } : { min: 66, max: 660 },

    toDisplayLength,
    toCanonicalLength,
    fmtLength: (cm, decimals = lDec) => `${numLength(cm, decimals)} ${lengthUnit}`,
    numLength,
    lengthStep: lengthUnit === 'cm' ? 0.5 : 0.25,

    toDisplayDistance,
    toCanonicalDistance,
    fmtDistance: (km, decimals = 1) => `${toDisplayDistance(km).toFixed(decimals)} ${distanceUnit}`,

    // 2 g/kg equivalen a ~0.91 g/lb: la referencia habitual de "1 g por libra"
    perW: weightUnit === 'kg' ? 'g/kg' : 'g/lb',
    toDisplayPerWeight: (gPerKg) => (weightUnit === 'kg' ? gPerKg : gPerKg / 2.2046226218),
    toCanonicalPerWeight: (v) => (weightUnit === 'kg' ? v : v * 2.2046226218),
    perWeightRange: (minPerKg, maxPerKg) =>
      weightUnit === 'kg'
        ? { min: minPerKg, max: maxPerKg, step: 0.1 }
        : {
            min: Math.round((minPerKg / 2.2046226218) * 20) / 20,
            max: Math.round((maxPerKg / 2.2046226218) * 20) / 20,
            step: 0.05,
          },
  };
}

/**
 * Hook de unidades. Al cambiar la preferencia en Ajustes, todos los componentes
 * que lo usan se vuelven a renderizar y los valores visibles se actualizan al
 * instante, porque leen del store.
 */
export function useUnits(): UnitsApi {
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const lengthUnit = useSettingsStore((s) => s.lengthUnit);
  return useMemo(() => makeUnits(weightUnit, lengthUnit), [weightUnit, lengthUnit]);
}
