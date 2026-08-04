# Supabase staging — puesta en marcha

Lo que hace falta para que la sincronización deje de correr contra un servidor
simulado y empiece a correr contra uno real. **Solo staging.** Producción sigue
con `VITE_SYNC_FLAG=disabled` y no se toca.

---

## Estado actual

| Pieza | Estado |
|---|---|
| Motor de sincronización | ✅ construido y probado contra servidor simulado |
| Migraciones SQL | ✅ escritas · ❌ **no aplicadas contra ningún proyecto** |
| `SupabaseSyncAdapter` | ✅ escrito · ❌ **nunca ha hablado con un servidor** |
| Pantalla de cuenta | ✅ construida · ❌ sin probar contra Auth real |
| Auditoría de RLS | ✅ escrita (`npm run audit:rls`) · ❌ sin ejecutar |
| Auditoría del adaptador | ✅ escrita (`npm run audit:adapter`) · ❌ sin ejecutar |
| Proyecto de staging | ❌ **bloqueado**: ver abajo |

---

## Bloqueo actual

Intenté crear `bodyfit-staging` en tu organización. Supabase lo rechazó:

```
The following organization members have reached their maximum limits for the
number of active free projects: stiloroofingandconstruction-afk (2 project limit)
```

El plan **free** permite 2 proyectos activos por administrador. Ahora mismo hay:

| Proyecto | Estado | ¿Es de BodyFit? |
|---|---|---|
| `mlb-picks-tracker` | ACTIVE | No |
| `stiloroofingandconstruction` | ACTIVE | No |
| `stiloroofingandconstruction-afk's Project` | INACTIVE | No |

Ninguno es de BodyFit, y BodyFit Prep es un proyecto independiente: no voy a
meterlo en ninguno de esos.

### Tres salidas

1. **Pausar uno de los dos activos** desde el panel de Supabase. Un proyecto
   pausado conserva los datos y se puede reactivar. Es lo más barato y lo más
   reversible.
2. **Borrar el proyecto INACTIVE** si ya no sirve para nada — comprueba antes
   que no tiene datos que quieras.
3. **Subir la organización a Pro** (25 $/mes). Solo tiene sentido si vas a
   necesitar los tres a la vez de forma permanente.

Cuando haya hueco, dímelo y creo el proyecto yo: nombre `bodyfit-staging`,
región `us-east-1`, coste 0 €/mes. Me quedo con la URL y la clave publishable
automáticamente, sin que tengas que copiar nada.

---

## Lo que haré yo en cuanto exista el proyecto

Todo esto es automático y no necesita que hagas nada:

1. Aplicar las tres migraciones (`0001`, `0002`, `0003`).
2. Comprobar que crean las 20 tablas, los 17 índices, las 6 políticas y las 9
   funciones esperadas.
3. Crear dos usuarios de prueba, `qa-a@…` y `qa-b@…`, con contraseña.
4. Escribir `.env.local` con la URL, la clave publishable y las credenciales de
   prueba. **`.env.local` está en `.gitignore` y no se sube.**
5. Ejecutar `npm run audit:rls` — 11 tablas × 10 comprobaciones cada una, más
   el log de operaciones y las funciones del motor.
6. Ejecutar `npm run audit:adapter` — los siete métodos del contrato, 500
   operaciones reales, duplicados, cursores, esquemas incompatibles, usuario
   incorrecto, token inválido y pérdida de red.
7. Configurar Site URL y Redirect URLs de staging.
8. Ejecutar la batería completa y dejar el informe.

---

## Lo que necesito de ti (y solo esto)

### 1 · Hueco para el proyecto

Ver arriba. Es el único bloqueo real.

### 2 · Correo para los usuarios de prueba

Supabase envía un correo de confirmación al registrar un usuario. Para las
auditorías necesito dos cuentas que pueda usar sin abrir tu buzón. Dos opciones:

- **Desactivar la confirmación por correo en staging** (Authentication →
  Providers → Email → *Confirm email* apagado). Es lo normal en un entorno de
  pruebas y me permite crear los dos usuarios yo mismo.
- O darme dos direcciones reales a las que tengas acceso, y me pasas los
  códigos.

Recomiendo la primera: es staging, no hay datos de nadie.

### 3 · Variables en Vercel (cuando llegue el momento)

Esto sí lo tienes que hacer tú, porque son credenciales:

**Preview / staging** — Vercel → Settings → Environment Variables → *Preview*:

```
VITE_SUPABASE_URL       = https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY  = sb_publishable_...
VITE_SYNC_FLAG          = internal
```

**Production** — no se añade ninguna de las tres. Si `VITE_SUPABASE_URL` no
existe, el adaptador cae al local por construcción; y `VITE_SYNC_FLAG` sin
declarar vale `disabled`. Producción queda protegida por dos vías
independientes, no por una.

---

## Deep links y PWA

El enlace mágico vuelve a `${location.origin}/ajustes/cuenta`. En el panel de
Supabase, **Authentication → URL Configuration**:

| Campo | Valor |
|---|---|
| Site URL | la URL del preview de staging |
| Redirect URLs | `https://<preview>.vercel.app/**`, `http://localhost:4173/**`, `http://localhost:5180/**` |
| Redirect URLs (preparada, **no** Site URL) | `https://bodyfit-prep.vercel.app/**` |

Dejar la de producción en la lista de redirects pero **no** como Site URL
permite probar cuando llegue el momento sin que ningún correo de staging acabe
apuntando a producción por defecto.

### El problema del iPhone

En un iPhone con BodyFit instalada como PWA, un enlace desde Mail abre
**Safari**, no la aplicación. La sesión acabaría en el navegador y la PWA
seguiría sin cuenta. Por eso la pantalla ofrece las dos vías:

- **Enlace**, cómodo en escritorio.
- **Código de seis dígitos**, que se teclea dentro de la PWA y deja la sesión
  donde tiene que estar.

En el iPhone hay que usar el código. Está dicho en la propia pantalla.

---

## Lo que sigue sin poder automatizarse

La prueba con **dos dispositivos físicos**. Playwright con dos contextos prueba
que el aislamiento y el cableado funcionan, y no prueba Safari real en iOS: ni
el ciclo de vida de la PWA al bloquear la pantalla, ni la suspensión de
IndexedDB en segundo plano, ni el retorno desde Mail.

El guion exacto de esa prueba está en la sección correspondiente del informe y
se marcará como superada solo cuando la hagas tú.
