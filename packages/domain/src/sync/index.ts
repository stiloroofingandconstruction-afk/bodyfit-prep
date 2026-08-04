/**
 * Motor de sincronizacion — logica pura.
 *
 * Todo lo que hay aqui decide, no actua: no lee la hora, no toca la red y no
 * escribe en ningun sitio. Quien llama le pasa `nowMs` y guarda lo que devuelve.
 *
 * Eso es lo que permite probar catorce dias de dos dispositivos en
 * milisegundos, barajar operaciones para comprobar que convergen, y ejecutar
 * exactamente las mismas reglas en el navegador y en el servidor sin mantener
 * dos copias que acabarian divergiendo.
 *
 * La parte que si actua —persistir, enviar, reintentar— vive en
 * `src/services/sync/`.
 */
export * from './hlc';
export * from './operations';
export * from './conflict';
export * from './outbox';
