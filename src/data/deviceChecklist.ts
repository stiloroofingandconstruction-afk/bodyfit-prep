/**
 * Lista de comprobacion para un iPhone real.
 *
 * Todo lo que hay aqui es lo que un navegador de escritorio NO puede verificar,
 * por mucho que emule el tamano de pantalla: instalacion desde Safari, area
 * segura real con la isla dinamica, teclado del sistema, camara, persistencia
 * del almacenamiento tras dias sin abrir la app, y comportamiento sin conexion
 * con datos moviles apagados.
 *
 * Ningun elemento de esta lista se marca solo. Una prueba que requiere un
 * dispositivo fisico no puede darse por aprobada desde un script.
 */

export interface ChecklistItem {
  id: string;
  title: string;
  /** Como comprobarlo, paso a paso. */
  how: string;
  /** Que se considera correcto. */
  expected: string;
  /** Por que no se puede automatizar. */
  whyManual: string;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export const DEVICE_CHECKLIST: ChecklistGroup[] = [
  {
    id: 'instalacion',
    title: 'Instalacion',
    items: [
      {
        id: 'install-safari',
        title: 'Anadir a la pantalla de inicio',
        how: 'Abre la app en Safari, pulsa Compartir y elige "Anadir a pantalla de inicio".',
        expected:
          'Aparece el icono de BodyFit Prep, con fondo propio y sin el recuadro gris por defecto de iOS.',
        whyManual: 'El menu Compartir es del sistema operativo; ningun navegador de pruebas lo expone.',
      },
      {
        id: 'install-standalone',
        title: 'Se abre a pantalla completa',
        how: 'Abre la app desde el icono de la pantalla de inicio.',
        expected: 'No hay barra de direcciones ni barra de pestanas de Safari.',
        whyManual: 'El modo standalone real solo existe cuando iOS lanza la app desde el icono.',
      },
      {
        id: 'install-splash',
        title: 'Arranque sin pantalla en blanco',
        how: 'Cierra la app del multitarea y vuelve a abrirla tres veces seguidas.',
        expected: 'Siempre aparece la pantalla de carga de la app, nunca un fondo blanco.',
        whyManual: 'El arranque en frio depende de como iOS gestione la memoria en ese momento.',
      },
    ],
  },
  {
    id: 'pantalla',
    title: 'Pantalla y area segura',
    items: [
      {
        id: 'safe-top',
        title: 'Nada debajo de la isla dinamica',
        how: 'Recorre Inicio, Nutricion, Entreno, Progreso y Ajustes.',
        expected: 'Los titulos y botones superiores quedan por debajo del recorte de la camara.',
        whyManual:
          'La altura real de env(safe-area-inset-top) depende del modelo; el emulador la aproxima.',
      },
      {
        id: 'safe-bottom',
        title: 'La barra inferior respeta el indicador de inicio',
        how: 'Mira la barra de pestanas en cualquier pantalla.',
        expected: 'Los iconos no quedan tapados por la barra horizontal del sistema.',
        whyManual: 'El indicador de inicio no se dibuja en un navegador de escritorio.',
      },
      {
        id: 'rotacion',
        title: 'Giro de pantalla',
        how: 'Gira el telefono en Inicio, Progreso y una sesion de entrenamiento activa.',
        expected: 'No aparece scroll horizontal ni texto cortado.',
        whyManual: 'El giro fisico dispara eventos que un cambio de tamano de ventana no reproduce igual.',
      },
      {
        id: 'texto-grande',
        title: 'Tamano de texto del sistema',
        how: 'Ajustes de iOS → Pantalla y brillo → Tamano del texto: subelo al maximo.',
        expected: 'La app sigue siendo utilizable: nada se solapa ni desaparece.',
        whyManual: 'El escalado dinamico de iOS no se puede simular desde el navegador.',
      },
    ],
  },
  {
    id: 'entrada',
    title: 'Teclado y entrada',
    items: [
      {
        id: 'teclado-numerico',
        title: 'Teclado numerico en los campos de peso',
        how: 'Registra el peso en Progreso y una serie en una sesion activa.',
        expected: 'Sale el teclado numerico, no el alfabetico completo.',
        whyManual: 'El teclado que elige iOS depende del sistema, no solo del atributo inputmode.',
      },
      {
        id: 'teclado-tapa',
        title: 'El teclado no tapa el campo activo',
        how: 'Escribe en los campos del final de un formulario largo (Check-in, Ajustes).',
        expected: 'El campo se desplaza por encima del teclado y se ve mientras escribes.',
        whyManual: 'La altura del teclado y el desplazamiento automatico los gestiona iOS.',
      },
      {
        id: 'zoom-focus',
        title: 'Sin zoom al enfocar un campo',
        how: 'Toca cualquier campo de texto.',
        expected: 'La pagina no hace zoom automatico.',
        whyManual: 'Safari solo aplica ese zoom en dispositivos tactiles reales.',
      },
    ],
  },
  {
    id: 'fotos',
    title: 'Fotos de progreso',
    items: [
      {
        id: 'foto-camara',
        title: 'Tomar una foto con la camara',
        how: 'Progreso → Fotos → anadir, y elige Camara.',
        expected: 'La foto se guarda, aparece en la cuadricula y sigue ahi tras cerrar la app.',
        whyManual: 'No hay camara en el entorno de pruebas.',
      },
      {
        id: 'foto-galeria',
        title: 'Elegir una foto de la fototeca',
        how: 'Anade una foto HEIC hecha con el propio iPhone.',
        expected: 'Se guarda y se muestra correctamente, sin quedar en negro.',
        whyManual: 'HEIC es el formato por defecto del iPhone y no existe en el entorno de pruebas.',
      },
      {
        id: 'foto-persistencia',
        title: 'Las fotos sobreviven al reinicio',
        how: 'Reinicia el telefono y vuelve a abrir la app.',
        expected: 'Todas las fotos siguen visibles.',
        whyManual:
          'Es la comprobacion clave del almacen de fotos en el motor real de Safari, no en su emulacion.',
      },
    ],
  },
  {
    id: 'datos',
    title: 'Datos y copias',
    items: [
      {
        id: 'copia-crear',
        title: 'Crear una copia de seguridad',
        how: 'Ajustes → Datos y respaldo → Crear copia.',
        expected: 'iOS ofrece guardar el archivo en Archivos o iCloud Drive.',
        whyManual: 'La hoja de guardado es del sistema operativo.',
      },
      {
        id: 'copia-restaurar',
        title: 'Restaurar esa copia',
        how: 'Borra los datos, vuelve a instalar y restaura el archivo guardado.',
        expected:
          'Vuelven el perfil, los registros, los ajustes y todas las fotos, con los mismos valores.',
        whyManual: 'Requiere el selector de archivos de iOS y una instalacion real.',
      },
      {
        id: 'persistencia',
        title: 'Almacenamiento protegido concedido',
        how: 'Ajustes → Datos y respaldo, y mira el indicador tras usar la app varios dias.',
        expected: 'El estado pasa a "Si". Puede tardar dias en concederse.',
        whyManual: 'Safari decide segun el uso real acumulado en el dispositivo.',
      },
      {
        id: 'sin-uso',
        title: 'Los datos siguen ahi tras dos semanas',
        how: 'No abras la app durante dos semanas y vuelve a abrirla.',
        expected: 'Todo sigue en su sitio.',
        whyManual:
          'Safari borra datos de sitios poco usados; solo el paso real del tiempo lo comprueba.',
      },
    ],
  },
  {
    id: 'offline',
    title: 'Sin conexion',
    items: [
      {
        id: 'modo-avion',
        title: 'La app abre en modo avion',
        how: 'Activa el modo avion y abre la app desde el icono.',
        expected: 'Carga completa y se puede navegar por todas las pantallas.',
        whyManual: 'El modo avion real corta tambien la red del sistema, no solo la del navegador.',
      },
      {
        id: 'offline-registro',
        title: 'Registrar sin conexion',
        how: 'Con el modo avion activo, apunta una comida, una serie y el peso.',
        expected: 'Todo se guarda y sigue ahi al recuperar la conexion.',
        whyManual: 'Confirma que no queda ninguna llamada de red bloqueando el guardado.',
      },
      {
        id: 'actualizacion',
        title: 'La actualizacion entra al reabrir',
        how: 'Publica una version nueva, abre la app, cierrala del multitarea y vuelve a abrirla.',
        expected: 'La segunda apertura muestra ya la version nueva.',
        whyManual: 'El ciclo de vida del service worker en iOS depende de como iOS suspenda la app.',
      },
    ],
  },
  {
    id: 'rendimiento',
    title: 'Rendimiento y bateria',
    items: [
      {
        id: 'scroll',
        title: 'Desplazamiento fluido',
        how: 'Recorre el historial y la biblioteca de ejercicios con muchos registros.',
        expected: 'Sin tirones perceptibles.',
        whyManual: 'La fluidez real depende de la GPU y del compositor del dispositivo.',
      },
      {
        id: 'temporizador',
        title: 'El temporizador de descanso con la pantalla bloqueada',
        how: 'Inicia un descanso, bloquea el telefono y espera a que termine.',
        expected: 'Al desbloquear, el tiempo restante es correcto.',
        whyManual: 'iOS suspende los temporizadores de JavaScript al bloquear; hay que verlo en vivo.',
      },
    ],
  },
];

export const CHECKLIST_ITEM_COUNT = DEVICE_CHECKLIST.reduce((n, g) => n + g.items.length, 0);
