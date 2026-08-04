/**
 * Conversion de unidades. La app guarda SIEMPRE en metrico (kg, cm) y solo
 * convierte al mostrar y al leer del usuario. Asi los datos no se degradan por
 * redondeos sucesivos al cambiar de unidad.
 */
export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';

const LB_PER_KG = 2.2046226218;
const IN_PER_CM = 0.3937007874;

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}
export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}
export function cmToIn(cm: number): number {
  return cm * IN_PER_CM;
}
export function inToCm(inches: number): number {
  return inches / IN_PER_CM;
}

/** Convierte un peso guardado en kg a la unidad de visualizacion. */
export function displayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Convierte un peso introducido por el usuario a kg para guardarlo. */
export function storeWeight(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

export function displayLength(cm: number, unit: LengthUnit): number {
  return unit === 'cm' ? cm : cmToIn(cm);
}

export function storeLength(value: number, unit: LengthUnit): number {
  return unit === 'cm' ? value : inToCm(value);
}

export function fmtWeight(kg: number, unit: WeightUnit, decimals = 1): string {
  return `${displayWeight(kg, unit).toFixed(decimals)} ${unit}`;
}

export function fmtLength(cm: number, unit: LengthUnit, decimals = 1): string {
  return `${displayLength(cm, unit).toFixed(decimals)} ${unit}`;
}

/** Paso natural del control segun la unidad (0.1 kg ≈ 0.2 lb). */
export function weightStep(unit: WeightUnit): number {
  return unit === 'kg' ? 0.1 : 0.2;
}

export function lengthStep(unit: LengthUnit): number {
  return unit === 'cm' ? 0.5 : 0.25;
}
