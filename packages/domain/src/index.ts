/**
 * Barril del paquete.
 *
 * Se prefiere importar por submodulo (`@bodyfit/domain/training`) para no
 * arrastrar el dominio entero a un chunk que solo necesita una funcion. Este
 * barril existe para consumidores que no empaquetan, como una Edge Function.
 */
export * from './autoMeal';
export * from './backup';
export * from './body';
export * from './checkin';
export * from './collections';
export * from './competition';
export * from './energy';
export * from './macros';
export * from './media';
export * from './prepTypes';
export * from './recommendations';
export * from './solver';
export * from './training';
export * from './types';
export * from './units';
export * from './versioning';
export * from './weeklySummary';
