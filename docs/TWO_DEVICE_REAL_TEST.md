# Prueba real con dos dispositivos

**No se puede automatizar y no se da por superada hasta que la hagas tú.**

Playwright con dos contextos prueba que el aislamiento y el cableado funcionan.
No prueba Safari real en iOS: ni el ciclo de vida de la PWA al bloquear la
pantalla, ni la suspensión de IndexedDB en segundo plano, ni el retorno desde
Mail, ni qué pasa cuando iOS mata la aplicación para recuperar memoria.

Esas son exactamente las cosas que rompen las aplicaciones sincronizadas en
producción, y solo se ven en un teléfono de verdad.

---

## Antes de empezar

| Requisito | Estado |
|---|---|
| Proyecto Supabase de staging con las migraciones aplicadas | ⬜ |
| Preview de Vercel con `VITE_SYNC_FLAG=internal` | ⬜ |
| Redirect URLs de staging configuradas | ⬜ |
| `npm run audit:rls` en verde | ⬜ |
| `npm run audit:adapter` en verde | ⬜ |

Si alguna casilla está vacía, esta prueba todavía no toca.

**Dispositivo A**: iPhone con BodyFit instalada desde la pantalla de inicio.
**Dispositivo B**: navegador de escritorio o un segundo teléfono.

En el iPhone, entra con el **código del correo**, no con el enlace: el
enlace del correo abre Safari y la sesión acabaría fuera de la PWA.

---

## El guion

Marca cada paso. Si uno falla, **para y anótalo**: seguir adelante contamina
los siguientes.

### Puesta a punto

- [ ] **1.** A: entrar con la cuenta de prueba desde la PWA, usando el código.
- [ ] **2.** B: entrar con **la misma cuenta**.
- [ ] **3.** Los dos muestran el mismo correo enmascarado en Ajustes → Cuenta.
- [ ] **4.** Los `deviceId` de A y B son **distintos** (Ajustes → Sincronización).

### Ida y vuelta

- [ ] **5.** A: registrar una comida. Anota qué y cuánto.
- [ ] **6.** B: esperar y sincronizar. **La comida aparece con los mismos gramos.**
- [ ] **7.** B: registrar un entrenamiento con al menos tres series y su RIR.
- [ ] **8.** A: sincronizar. **El entrenamiento aparece con las tres series y los RIR correctos.**

### Sin red

- [ ] **9.** A: activar el modo avión.
- [ ] **10.** A: modificar el peso de la **serie 2** del entrenamiento. Anota el valor.
- [ ] **11.** B (con red): modificar el peso de **esa misma serie 2**. Anota el valor y la hora.
- [ ] **12.** A: quitar el modo avión y sincronizar.
- [ ] **13.** Los dos dispositivos muestran **el mismo peso**, y es el del cambio **más reciente**.
- [ ] **14.** El otro valor no ha desaparecido del historial de operaciones (Ajustes → Sincronización → Descargar diagnóstico).

### Borrar, editar, restaurar

- [ ] **15.** A: borrar una comida.
- [ ] **16.** B: **sin sincronizar todavía**, editar esa misma comida.
- [ ] **17.** Sincronizar los dos. **La comida queda borrada** y la edición no la resucita.
- [ ] **18.** A: restaurar la comida borrada.
- [ ] **19.** B: sincronizar. **La comida vuelve, con la edición del paso 16 aplicada.**

Este bloque es el que encontró el fallo más grave del motor durante el
desarrollo. Si algo va a romperse, es aquí.

### Ciclo de vida

- [ ] **20.** A: cerrar la PWA por completo (deslizar hacia arriba en el selector de apps).
- [ ] **21.** A: bloquear el teléfono cinco minutos.
- [ ] **22.** A: abrir la PWA. **La sesión sigue iniciada** y no pide entrar otra vez.
- [ ] **23.** B: recargar. **Nada se ha duplicado.**
- [ ] **24.** Contar las comidas del día en los dos: **el mismo número.**
- [ ] **25.** Contar las series del entrenamiento en los dos: **el mismo número.**

### Fotos

- [ ] **26.** A: hacer una foto de progreso.
- [ ] **27.** B: sincronizar y abrir Fotos.
- [ ] **28.** Aparece la ficha con **«Solo en el dispositivo original»**, no un rectángulo cargando eternamente.

### Cierre de sesión

- [ ] **29.** B: cerrar sesión.
- [ ] **30.** **Todos los datos siguen en B.** No ha desaparecido nada.
- [ ] **31.** B: volver a entrar con la misma cuenta. No se duplica nada.

### Cuenta distinta

- [ ] **32.** B: cerrar sesión y entrar con **otra cuenta**.
- [ ] **33.** La aplicación **avisa de que los datos locales son de otra cuenta** y **no ofrece fusionar**.

---

## Qué anotar si algo falla

Para cada fallo:

1. En qué paso.
2. Qué esperabas y qué pasó.
3. Ajustes → Sincronización → **Descargar diagnóstico**, en los dos dispositivos.
4. El `deviceId` de cada uno.

El archivo de diagnóstico no lleva el contenido de tus comidas, pesos ni notas:
solo identificadores, colecciones, estados y momentos. Se puede compartir sin
exponer datos de salud.

---

## Solo cuando los 33 pasos estén marcados

Entonces, y no antes, tiene sentido plantearse mover el flag de producción de
`disabled` a `beta`. Hasta ese momento la sincronización está construida y
probada contra servidores —simulado y de staging—, que no es lo mismo que
probada.
