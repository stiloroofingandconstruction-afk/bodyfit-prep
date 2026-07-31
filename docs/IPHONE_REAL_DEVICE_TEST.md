# Prueba en iPhone real

> Documento generado desde `src/data/deviceChecklist.ts` con
> `node scripts/gen-device-doc.mjs`. No lo edites a mano: edita la lista.

La suite automatizada de BodyFit Prep cubre el dominio, el almacenamiento, las
migraciones, las copias de seguridad, la navegacion completa y el renderizado en
WebKit y Chromium a traves de Playwright. Lo que hay en este documento es lo que
esa suite **no puede** comprobar, por mucho que emule el tamano de un iPhone.

**Ninguna de estas comprobaciones se marca sola.** Ni este documento ni la app
dan por aprobado nada que dependa de un dispositivo fisico. La lista equivalente
dentro de la app esta en **Ajustes → Diagnostico → Prueba de iPhone**, y se puede
imprimir desde ahi.

## Antes de empezar

1. Ten a mano un iPhone con iOS 17 o superior.
2. Abre la direccion de produccion en **Safari** (no en Chrome ni en la vista web
   de otra app: la instalacion en la pantalla de inicio solo funciona en Safari).
3. Si vas a probar el borrado y la restauracion, **exporta una copia primero**
   desde Ajustes → Datos y respaldo.

## Comprobaciones (22)

### Instalacion

#### 1. Anadir a la pantalla de inicio

- **Como:** Abre la app en Safari, pulsa Compartir y elige "Anadir a pantalla de inicio".
- **Se espera:** Aparece el icono de BodyFit Prep, con fondo propio y sin el recuadro gris por defecto de iOS.
- **Por que no se automatiza:** El menu Compartir es del sistema operativo; ningun navegador de pruebas lo expone.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 2. Se abre a pantalla completa

- **Como:** Abre la app desde el icono de la pantalla de inicio.
- **Se espera:** No hay barra de direcciones ni barra de pestanas de Safari.
- **Por que no se automatiza:** El modo standalone real solo existe cuando iOS lanza la app desde el icono.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 3. Arranque sin pantalla en blanco

- **Como:** Cierra la app del multitarea y vuelve a abrirla tres veces seguidas.
- **Se espera:** Siempre aparece la pantalla de carga de la app, nunca un fondo blanco.
- **Por que no se automatiza:** El arranque en frio depende de como iOS gestione la memoria en ese momento.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

### Pantalla y area segura

#### 4. Nada debajo de la isla dinamica

- **Como:** Recorre Inicio, Nutricion, Entreno, Progreso y Ajustes.
- **Se espera:** Los titulos y botones superiores quedan por debajo del recorte de la camara.
- **Por que no se automatiza:** La altura real de env(safe-area-inset-top) depende del modelo; el emulador la aproxima.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 5. La barra inferior respeta el indicador de inicio

- **Como:** Mira la barra de pestanas en cualquier pantalla.
- **Se espera:** Los iconos no quedan tapados por la barra horizontal del sistema.
- **Por que no se automatiza:** El indicador de inicio no se dibuja en un navegador de escritorio.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 6. Giro de pantalla

- **Como:** Gira el telefono en Inicio, Progreso y una sesion de entrenamiento activa.
- **Se espera:** No aparece scroll horizontal ni texto cortado.
- **Por que no se automatiza:** El giro fisico dispara eventos que un cambio de tamano de ventana no reproduce igual.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 7. Tamano de texto del sistema

- **Como:** Ajustes de iOS → Pantalla y brillo → Tamano del texto: subelo al maximo.
- **Se espera:** La app sigue siendo utilizable: nada se solapa ni desaparece.
- **Por que no se automatiza:** El escalado dinamico de iOS no se puede simular desde el navegador.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

### Teclado y entrada

#### 8. Teclado numerico en los campos de peso

- **Como:** Registra el peso en Progreso y una serie en una sesion activa.
- **Se espera:** Sale el teclado numerico, no el alfabetico completo.
- **Por que no se automatiza:** El teclado que elige iOS depende del sistema, no solo del atributo inputmode.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 9. El teclado no tapa el campo activo

- **Como:** Escribe en los campos del final de un formulario largo (Check-in, Ajustes).
- **Se espera:** El campo se desplaza por encima del teclado y se ve mientras escribes.
- **Por que no se automatiza:** La altura del teclado y el desplazamiento automatico los gestiona iOS.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 10. Sin zoom al enfocar un campo

- **Como:** Toca cualquier campo de texto.
- **Se espera:** La pagina no hace zoom automatico.
- **Por que no se automatiza:** Safari solo aplica ese zoom en dispositivos tactiles reales.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

### Fotos de progreso

#### 11. Tomar una foto con la camara

- **Como:** Progreso → Fotos → anadir, y elige Camara.
- **Se espera:** La foto se guarda, aparece en la cuadricula y sigue ahi tras cerrar la app.
- **Por que no se automatiza:** No hay camara en el entorno de pruebas.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 12. Elegir una foto de la fototeca

- **Como:** Anade una foto HEIC hecha con el propio iPhone.
- **Se espera:** Se guarda y se muestra correctamente, sin quedar en negro.
- **Por que no se automatiza:** HEIC es el formato por defecto del iPhone y no existe en el entorno de pruebas.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 13. Las fotos sobreviven al reinicio

- **Como:** Reinicia el telefono y vuelve a abrir la app.
- **Se espera:** Todas las fotos siguen visibles.
- **Por que no se automatiza:** Es la comprobacion clave del almacen de fotos en el motor real de Safari, no en su emulacion.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

### Datos y copias

#### 14. Crear una copia de seguridad

- **Como:** Ajustes → Datos y respaldo → Crear copia.
- **Se espera:** iOS ofrece guardar el archivo en Archivos o iCloud Drive.
- **Por que no se automatiza:** La hoja de guardado es del sistema operativo.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 15. Restaurar esa copia

- **Como:** Borra los datos, vuelve a instalar y restaura el archivo guardado.
- **Se espera:** Vuelven el perfil, los registros, los ajustes y todas las fotos, con los mismos valores.
- **Por que no se automatiza:** Requiere el selector de archivos de iOS y una instalacion real.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 16. Almacenamiento protegido concedido

- **Como:** Ajustes → Datos y respaldo, y mira el indicador tras usar la app varios dias.
- **Se espera:** El estado pasa a "Si". Puede tardar dias en concederse.
- **Por que no se automatiza:** Safari decide segun el uso real acumulado en el dispositivo.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 17. Los datos siguen ahi tras dos semanas

- **Como:** No abras la app durante dos semanas y vuelve a abrirla.
- **Se espera:** Todo sigue en su sitio.
- **Por que no se automatiza:** Safari borra datos de sitios poco usados; solo el paso real del tiempo lo comprueba.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

### Sin conexion

#### 18. La app abre en modo avion

- **Como:** Activa el modo avion y abre la app desde el icono.
- **Se espera:** Carga completa y se puede navegar por todas las pantallas.
- **Por que no se automatiza:** El modo avion real corta tambien la red del sistema, no solo la del navegador.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 19. Registrar sin conexion

- **Como:** Con el modo avion activo, apunta una comida, una serie y el peso.
- **Se espera:** Todo se guarda y sigue ahi al recuperar la conexion.
- **Por que no se automatiza:** Confirma que no queda ninguna llamada de red bloqueando el guardado.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 20. La actualizacion entra al reabrir

- **Como:** Publica una version nueva, abre la app, cierrala del multitarea y vuelve a abrirla.
- **Se espera:** La segunda apertura muestra ya la version nueva.
- **Por que no se automatiza:** El ciclo de vida del service worker en iOS depende de como iOS suspenda la app.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

### Rendimiento y bateria

#### 21. Desplazamiento fluido

- **Como:** Recorre el historial y la biblioteca de ejercicios con muchos registros.
- **Se espera:** Sin tirones perceptibles.
- **Por que no se automatiza:** La fluidez real depende de la GPU y del compositor del dispositivo.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

#### 22. El temporizador de descanso con la pantalla bloqueada

- **Como:** Inicia un descanso, bloquea el telefono y espera a que termine.
- **Se espera:** Al desbloquear, el tiempo restante es correcto.
- **Por que no se automatiza:** iOS suspende los temporizadores de JavaScript al bloquear; hay que verlo en vivo.
- **Resultado:** [ ] correcto  [ ] incorrecto — notas: ______________________

## Si algo falla

1. Ve a **Ajustes → Diagnostico** y pulsa **Descargar diagnostico**. El archivo
   lista el entorno, el espacio usado y los ultimos errores registrados; no
   incluye pesos, notas ni fotos.
2. Exporta una copia de seguridad antes de tocar nada.
3. Anota el modelo de iPhone y la version de iOS: casi todos los problemas de
   area segura y de teclado dependen del modelo.

## Que cubre la suite automatizada

Para no repetir trabajo, esto ya esta comprobado y no hace falta verificarlo a mano:

- Renderizado y navegacion de todas las pantallas en **WebKit**, el mismo motor
  que usa Safari en iOS.
- Ausencia de scroll horizontal, texto cortado y objetivos tactiles pequenos en
  los tamanos de iPhone SE, iPhone moderno y iPad.
- Errores de JavaScript y de React en consola durante los recorridos completos.
- Copias de seguridad: creacion, verificacion de integridad, restauracion,
  archivos danados y formatos antiguos.
- Migraciones de esquema sin perdida de datos.
- Manifiesto, service worker, iconos y rutas SPA sobre el build de produccion.
