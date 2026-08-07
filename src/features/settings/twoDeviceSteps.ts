/**
 * Los 33 pasos de la prueba con dos dispositivos.
 *
 * Es el mismo guion de `docs/TWO_DEVICE_REAL_TEST.md`, aqui dentro para poder
 * seguirlo en el telefono sin cambiar de aplicacion. El documento sigue siendo
 * la version que se lee en frio; esto es la que se usa con el movil en la mano.
 *
 * Cada paso dice DONDE se hace y QUE tiene que pasar. Un paso sin resultado
 * esperado no es un paso: es una instruccion que cada uno interpreta como
 * quiere, y dos personas marcarian cosas distintas.
 */

export type Dispositivo = 'A' | 'B' | 'ambos';

export interface PasoQA {
  readonly id: string;
  readonly grupo: string;
  readonly dispositivo: Dispositivo;
  readonly instruccion: string;
  /** Que tiene que verse para poder marcarlo. */
  readonly esperado: string;
  /** Por que este paso existe. Solo en los que no son obvios. */
  readonly porque?: string;
}

export const GRUPOS = [
  'Puesta a punto',
  'Ida y vuelta',
  'Sin red',
  'Borrar, editar, restaurar',
  'Ciclo de vida',
  'Fotos',
  'Cerrar sesion',
  'Cuenta distinta',
] as const;

export const PASOS: readonly PasoQA[] = [
  /* ─────────────────────────────────────────────── puesta a punto ─────── */
  {
    id: 'qa-01',
    grupo: 'Puesta a punto',
    dispositivo: 'A',
    instruccion: 'Entra con la cuenta de prueba desde la PWA instalada, usando el codigo que llega en el correo.',
    esperado: 'Ajustes → Cuenta muestra tu correo enmascarado.',
    porque:
      'Con el enlace no: en un iPhone el correo lo abre Safari y la sesion acabaria fuera de la aplicacion.',
  },
  {
    id: 'qa-02',
    grupo: 'Puesta a punto',
    dispositivo: 'B',
    instruccion: 'Entra con LA MISMA cuenta.',
    esperado: 'El mismo correo enmascarado que en A.',
  },
  {
    id: 'qa-03',
    grupo: 'Puesta a punto',
    dispositivo: 'ambos',
    instruccion: 'Compara los identificadores de dispositivo en esta misma pantalla.',
    esperado: 'Son DISTINTOS.',
    porque:
      'Si coincidieran, el desempate de conflictos dejaria de desempatar y el sistema perderia el determinismo.',
  },

  /* ────────────────────────────────────────────────── ida y vuelta ─────── */
  {
    id: 'qa-04',
    grupo: 'Ida y vuelta',
    dispositivo: 'A',
    instruccion: 'Registra una comida. Apunta que y cuantos gramos.',
    esperado: 'Aparece en el dia de hoy.',
  },
  {
    id: 'qa-05',
    grupo: 'Ida y vuelta',
    dispositivo: 'B',
    instruccion: 'Sincroniza y abre Nutricion.',
    esperado: 'La comida aparece con LOS MISMOS gramos.',
  },
  {
    id: 'qa-06',
    grupo: 'Ida y vuelta',
    dispositivo: 'B',
    instruccion: 'Registra un entrenamiento con al menos tres series, cada una con su RIR.',
    esperado: 'Queda guardado con las tres series.',
  },
  {
    id: 'qa-07',
    grupo: 'Ida y vuelta',
    dispositivo: 'A',
    instruccion: 'Sincroniza y abre el historial.',
    esperado: 'El entrenamiento aparece con las tres series y los RIR correctos.',
  },

  /* ───────────────────────────────────────────────────── sin red ───────── */
  {
    id: 'qa-08',
    grupo: 'Sin red',
    dispositivo: 'A',
    instruccion: 'Activa el modo avion.',
    esperado: 'La aplicacion sigue funcionando entera.',
  },
  {
    id: 'qa-09',
    grupo: 'Sin red',
    dispositivo: 'A',
    instruccion: 'Cambia el peso de la SERIE 2 del entrenamiento. Apunta el valor.',
    esperado: 'El cambio se ve al momento, sin esperar a nada.',
  },
  {
    id: 'qa-10',
    grupo: 'Sin red',
    dispositivo: 'B',
    instruccion: 'Con red, cambia el peso de ESA MISMA serie 2. Apunta el valor y la hora.',
    esperado: 'Guardado.',
  },
  {
    id: 'qa-11',
    grupo: 'Sin red',
    dispositivo: 'A',
    instruccion: 'Quita el modo avion y sincroniza.',
    esperado: 'La cola se vacia: 0 pendientes en esta pantalla.',
  },
  {
    id: 'qa-12',
    grupo: 'Sin red',
    dispositivo: 'ambos',
    instruccion: 'Compara el peso de la serie 2 en los dos.',
    esperado: 'EL MISMO valor, y es el del cambio mas reciente.',
    porque: 'Es la regla del reloj logico: gana el HLC mayor, no el que llego antes.',
  },

  /* ──────────────────────────────────── borrar, editar, restaurar ──────── */
  {
    id: 'qa-13',
    grupo: 'Borrar, editar, restaurar',
    dispositivo: 'A',
    instruccion: 'Borra una comida.',
    esperado: 'Desaparece de la lista.',
  },
  {
    id: 'qa-14',
    grupo: 'Borrar, editar, restaurar',
    dispositivo: 'B',
    instruccion: 'SIN sincronizar todavia, edita esa misma comida.',
    esperado: 'El cambio se guarda en B.',
  },
  {
    id: 'qa-15',
    grupo: 'Borrar, editar, restaurar',
    dispositivo: 'ambos',
    instruccion: 'Sincroniza los dos.',
    esperado: 'La comida queda BORRADA en los dos. La edicion no la resucita.',
    porque:
      'Un upsert no puede revivir algo borrado a proposito. Resucitar es un acto explicito.',
  },
  {
    id: 'qa-16',
    grupo: 'Borrar, editar, restaurar',
    dispositivo: 'A',
    instruccion: 'Restaura la comida borrada.',
    esperado: 'Vuelve a aparecer.',
  },
  {
    id: 'qa-17',
    grupo: 'Borrar, editar, restaurar',
    dispositivo: 'B',
    instruccion: 'Sincroniza.',
    esperado: 'La comida vuelve, Y con la edicion del paso 14 aplicada.',
    porque:
      'Es el bloque que encontro el fallo mas grave del motor. Si algo va a romperse, es aqui.',
  },

  /* ────────────────────────────────────────────── ciclo de vida ────────── */
  {
    id: 'qa-18',
    grupo: 'Ciclo de vida',
    dispositivo: 'A',
    instruccion: 'Cierra la PWA del todo: deslizala hacia arriba en el selector de apps.',
    esperado: 'Cerrada.',
  },
  {
    id: 'qa-19',
    grupo: 'Ciclo de vida',
    dispositivo: 'A',
    instruccion: 'Bloquea el telefono cinco minutos.',
    esperado: 'Pasados los cinco minutos.',
  },
  {
    id: 'qa-20',
    grupo: 'Ciclo de vida',
    dispositivo: 'A',
    instruccion: 'Abre la PWA.',
    esperado: 'La sesion SIGUE iniciada. No pide entrar otra vez.',
    porque: 'iOS suspende IndexedDB en segundo plano; esto es lo que no puede probar un navegador de escritorio.',
  },
  {
    id: 'qa-21',
    grupo: 'Ciclo de vida',
    dispositivo: 'ambos',
    instruccion: 'Cuenta las comidas de hoy en los dos dispositivos.',
    esperado: 'EL MISMO numero.',
  },
  {
    id: 'qa-22',
    grupo: 'Ciclo de vida',
    dispositivo: 'ambos',
    instruccion: 'Cuenta las series del entrenamiento en los dos.',
    esperado: 'EL MISMO numero. Nada duplicado.',
  },

  /* ────────────────────────────────────────────────────── fotos ────────── */
  {
    id: 'qa-23',
    grupo: 'Fotos',
    dispositivo: 'A',
    instruccion: 'Haz una foto de progreso.',
    esperado: 'Se ve en la cuadricula de Fotos.',
  },
  {
    id: 'qa-24',
    grupo: 'Fotos',
    dispositivo: 'B',
    instruccion: 'Sincroniza y abre Fotos.',
    esperado: 'Aparece la ficha con «Solo en el dispositivo original». NO un rectangulo cargando.',
    porque: 'La sincronizacion lleva los metadatos; el binario se queda donde se tomo. Hay que decirlo con palabras.',
  },
  {
    id: 'qa-25',
    grupo: 'Fotos',
    dispositivo: 'A',
    instruccion: 'Ajustes → Datos y respaldo → Crear copia.',
    esperado: 'El archivo se descarga e incluye la foto de verdad.',
  },

  /* ──────────────────────────────────────────────── cerrar sesion ──────── */
  {
    id: 'qa-26',
    grupo: 'Cerrar sesion',
    dispositivo: 'B',
    instruccion: 'Cierra sesion.',
    esperado: 'Vuelve al estado «Sin cuenta».',
  },
  {
    id: 'qa-27',
    grupo: 'Cerrar sesion',
    dispositivo: 'B',
    instruccion: 'Revisa nutricion, entrenamiento y cuerpo.',
    esperado: 'TODOS los datos siguen ahi. No ha desaparecido nada.',
    porque: 'Salir no es destruir. Son cosas distintas.',
  },
  {
    id: 'qa-28',
    grupo: 'Cerrar sesion',
    dispositivo: 'B',
    instruccion: 'Vuelve a entrar con la misma cuenta.',
    esperado: 'Nada se duplica.',
  },

  /* ─────────────────────────────────────────────── cuenta distinta ─────── */
  {
    id: 'qa-29',
    grupo: 'Cuenta distinta',
    dispositivo: 'B',
    instruccion: 'Cierra sesion y entra con OTRA cuenta.',
    esperado: 'La aplicacion avisa de que los datos locales son de otra cuenta.',
  },
  {
    id: 'qa-30',
    grupo: 'Cuenta distinta',
    dispositivo: 'B',
    instruccion: 'Busca la opcion de fusionar.',
    esperado: 'NO EXISTE. No se ofrece fusionar.',
    porque:
      'Mezclar los datos de dos personas no se puede deshacer despues: ya no se sabe que era de quien.',
  },
  {
    id: 'qa-31',
    grupo: 'Cuenta distinta',
    dispositivo: 'B',
    instruccion: 'Vuelve a entrar con la primera cuenta.',
    esperado: 'Los datos vuelven a estar completos.',
  },
  {
    id: 'qa-32',
    grupo: 'Cuenta distinta',
    dispositivo: 'ambos',
    instruccion: 'Cuenta otra vez comidas y series en los dos.',
    esperado: 'Los mismos numeros que en los pasos 21 y 22.',
  },
  {
    id: 'qa-33',
    grupo: 'Cuenta distinta',
    dispositivo: 'ambos',
    instruccion: 'Descarga el diagnostico en los dos dispositivos y guardalos.',
    esperado: 'Dos archivos, sin contenido de comidas ni notas dentro.',
  },
];
