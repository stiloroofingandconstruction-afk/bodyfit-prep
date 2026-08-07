# Supabase staging

Entorno de pruebas de BodyFit Prep 2.1. **Producción no está conectada a nada**
y sigue con la sincronización apagada.

---

## El proyecto

| | |
|---|---|
| Nombre | `bodyfit-staging` |
| Ref | `pdzpysyozpiipkyxtlfp` |
| URL | `https://pdzpysyozpiipkyxtlfp.supabase.co` |
| Región | `us-east-1` |
| Plan | Free · 0 €/mes |
| Postgres | 17 |

Es un proyecto **exclusivo de BodyFit**. No comparte nada con los proyectos de
Stilo ni con `mlb-picks-tracker`.

> **`mlb-picks-tracker` quedó pausado** para liberar la plaza del plan free, que
> permite 2 proyectos activos por cuenta. Conserva todos sus datos y se
> reactiva desde Supabase → el proyecto → Settings → General → *Restore
> project*. Cuando termine la validación de dos dispositivos, lo natural es
> pausar `bodyfit-staging` y reactivar aquel.

---

## Estado

| Pieza | Estado |
|---|---|
| Migraciones aplicadas | ✅ 4, desde una base vacía |
| Ciclo revertir → reaplicar | ✅ probado: 20 tablas → 0 → 20, idéntico |
| Auditoría de RLS (2 usuarios reales) | ✅ 130 comprobaciones |
| Auditoría del adaptador | ✅ 27 comprobaciones, 500 operaciones reales |
| Avisos de seguridad de Supabase | ✅ 0 (queda 1 informativo, ver abajo) |
| Usuarios de prueba | ✅ 2, con el correo confirmado |
| Site URL / Redirect URLs | ✅ configuradas y **probadas**: el `verify` redirige al preview |
| Despliegue de staging en Vercel | ✅ con las variables, verificado en el bundle |
| Magic Link de extremo a extremo | ✅ **validado** — ver abajo |
| SMTP propio (Gmail) | ✅ configurado; plantillas editables y límite a 30/hora |
| Código OTP en el correo | ✅ llega — **de 8 dígitos, no 6** |
| Producción | ✅ `disabled`, sin credenciales en el bundle |

### Esquema aplicado

```
20 tablas · 40 índices · 21 políticas RLS · 9 funciones
0 tablas sin RLS · 0 funciones sin search_path
```

### Usuarios de prueba

| Correo | Para qué |
|---|---|
| `qa-a@bodyfit.test` | Usuario A de las auditorías |
| `qa-b@bodyfit.test` | Usuario B — el que **no** debe poder ver nada de A |

Creados por SQL con `email_confirmed_at` puesto, para no depender de ningún
buzón. Las contraseñas están en `.env.local`, que está en `.gitignore`.

Son cuentas de un entorno de pruebas sin datos de nadie. **No se reutilizan en
producción.**

---

## Lo que falta y solo puedes hacer tú

Las dos cosas son ajustes de panel: no hay forma de tocarlas desde aquí.

### 1 · URLs de autenticación

Supabase → `bodyfit-staging` → **Authentication → URL Configuration**

| Campo | Valor |
|---|---|
| Site URL | `https://bodyfit-prep-git-sync-staging-validation-bodyfit.vercel.app` |
| Redirect URLs | `https://bodyfit-prep-git-sync-staging-validation-bodyfit.vercel.app/**`<br>`http://localhost:4173/**`<br>`http://localhost:5180/**` |

La de producción (`https://bodyfit-prep.vercel.app/**`) se puede dejar en la
lista de redirects **pero nunca como Site URL**: así se puede probar el día que
toque, sin que ningún correo de staging apunte a producción por defecto.

### 1 ter · Y la plantilla de CONFIRMACIÓN también

> **Encontrado al probar de verdad.** El primer correo que recibe alguien que
> entra por primera vez **no es el de Magic Link**: es el de *Confirm signup*,
> que usa otra plantilla. GoTrue crea el usuario y manda la confirmación de
> alta.
>
> Si solo se edita la plantilla de Magic Link, un usuario nuevo en un iPhone
> recibe un correo **con enlace y sin código**. El enlace abre Safari, la sesión
> se queda ahí y la PWA sigue sin cuenta — que es exactamente lo que el código
> del OTP existía para evitar, solo que en el primer acceso.

**Authentication → Email Templates → Confirm signup**, mismo contenido:

```html
<h2>Confirma tu correo y entra en BodyFit</h2>

<p>Si estás en el ordenador, usa el enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar y entrar</a></p>

<p>Si tienes BodyFit instalada en el teléfono, escribe este código dentro de
la aplicación:</p>
<p style="font-size:24px;letter-spacing:4px"><b>{{ .Token }}</b></p>
```

### El límite de correos es de 2 por hora

El SMTP integrado de Supabase, en plan free, manda **2 correos por hora y
dirección**. Al probar se choca con eso enseguida: la aplicación lo traduce a
«Demasiados intentos. Espera unos minutos antes de pedir otro» en vez de
enseñar un 429.

Para pruebas intensivas hace falta un SMTP propio (Resend, Postmark) en
**Authentication → Emails → SMTP Settings**.

### 1 bis · La plantilla del correo, o no habrá código

**Authentication → Email Templates → Magic Link.**

La plantilla por defecto solo lleva `{{ .ConfirmationURL }}`, y la documentación
de Supabase es explícita: *si está `{{ .ConfirmationURL }}` se manda un enlace;
si está `{{ .Token }}` se manda un código*. Sin `{{ .Token }}` **no llega
ningún código**.

Eso importa porque en un iPhone con la PWA instalada el enlace del correo abre
Safari y la sesión acaba fuera de la aplicación. El código es la única vía que
la deja dentro. Pega esto para tener las dos:

```html
<h2>Entrar en BodyFit</h2>

<p>Si estás en el ordenador, usa el enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Entrar</a></p>

<p>Si tienes BodyFit instalada en el teléfono, escribe este código dentro de
la aplicación:</p>
<p style="font-size:24px;letter-spacing:4px"><b>{{ .Token }}</b></p>

<p>Caduca en una hora y solo se puede usar una vez.</p>
```

### 2 · Variables en Vercel

**Preview** (Settings → Environment Variables → *Preview*):

```
VITE_SUPABASE_URL       = https://pdzpysyozpiipkyxtlfp.supabase.co
VITE_SUPABASE_ANON_KEY  = sb_publishable_-0a31LPJ33I0SmvmShzDKA_Ru3_EVIw
VITE_SYNC_FLAG          = internal
```

**Production**: **ninguna de las tres.** Producción queda protegida por dos vías
independientes: sin `VITE_SUPABASE_URL` el adaptador cae al local por
construcción, y sin `VITE_SYNC_FLAG` el flag vale `disabled`. Y
`scripts/audit-bundle.mjs` falla si alguna credencial aparece en un build de
producción.

La clave publishable es pública por diseño: viaja en el JavaScript del
navegador y lo que protege los datos es RLS, que está activo en las 20 tablas
con `using` **y** `with check` — comprobado con dos usuarios reales.

---

## Magic Link: qué se probó exactamente

Con una dirección real, contra el proyecto de staging y el preview desplegado:

| Paso | Resultado |
|---|---|
| `POST /auth/v1/otp?redirect_to=<preview>` | HTTP 200, correo enviado |
| Token generado y guardado | `confirmation_token` presente en `auth.users` |
| `GET /auth/v1/verify` | **303 al preview**, no al Site URL → la lista de Redirect URLs es correcta |
| Sesión en el fragmento | `access_token`, `refresh_token`, `expires_in` |
| La aplicación la recoge | sesión guardada, correo enmascarado `gpu***@gmail.com` |
| El token sale de la barra | `location.hash` limpio: no queda en el historial |
| La sesión sirve | `sync_health` y `sync_push` responden 200 bajo RLS |

Lo único que no cubre esto es que el correo **se vea** en la bandeja, que es
justo lo que no se puede automatizar.

---

## Cómo repetir las auditorías

```bash
npm run audit:rls       # políticas, con dos usuarios reales
npm run audit:adapter   # los siete métodos del contrato, 500 operaciones
npm run audit:staging   # las dos
```

Leen `.env.local`. **Ninguna usa `service_role`**: una auditoría que pudiera
saltarse RLS no estaría auditando nada.

---

## Migraciones

| Archivo | Qué hace |
|---|---|
| `0001_sync_core.sql` | `devices`, `sync_user_state`, `sync_operations`, `sync_cursors` |
| `0002_domain_tables.sql` | 16 tablas de dominio, índices, RLS |
| `0003_sync_functions.sql` | `sync_push`, `sync_pull`, cursores, `register_device`, `sync_health` |
| `0004_sync_push_hardening.sql` | Las dos correcciones que solo aparecieron contra Postgres real |

Se aplican en orden ascendente y se revierten en descendente. **El ciclo
completo está probado contra staging**: revertidas las cuatro, base vacía
confirmada (0 tablas, 0 funciones, 0 tipos), y reconstruidas hasta el mismo
recuento exacto.

`npm run audit:sql` valida la sintaxis sin base de datos, con el parser real de
Postgres. Está dentro de `npm run test:all`.

---

## El aviso que queda

**Leaked password protection disabled.** Supabase puede comprobar contraseñas
contra HaveIBeenPwned. No se ha activado y no aplica al producto: BodyFit entra
con enlace mágico y código, **sin contraseñas**. Las únicas que existen en este
proyecto son las de los dos usuarios de auditoría, generadas al azar.

Si algún día se añade login por contraseña, hay que activarlo antes.

---

## Lo que sigue sin poder automatizarse

La prueba con dos dispositivos físicos: [TWO_DEVICE_REAL_TEST.md](TWO_DEVICE_REAL_TEST.md).
