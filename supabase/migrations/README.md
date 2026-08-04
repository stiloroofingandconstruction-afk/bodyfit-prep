# Migraciones de Supabase

Estado: **escritas, no aplicadas contra ningún proyecto.** BodyFit Prep 2.1 se
despliega con la sincronización en `disabled`; estas migraciones existen para
que activarla sea un paso deliberado y no una sorpresa.

## Orden

| Migración | Qué crea | Reversión |
|---|---|---|
| `0001_sync_core.sql` | `devices`, `sync_user_state`, `sync_operations`, `sync_cursors`, RLS | `0001_sync_core.down.sql` |
| `0002_domain_tables.sql` | 16 tablas de dominio normalizadas, índices, RLS | `0002_domain_tables.down.sql` |
| `0003_sync_functions.sql` | `sync_push`, `sync_pull`, cursores, `register_device`, `sync_health` | `0003_sync_functions.down.sql` |

Se aplican en orden ascendente. Se revierten en orden **descendente**: primero
funciones, luego tablas de dominio, luego el núcleo. Cada `down` es idempotente
(`drop ... if exists`), así que ejecutarlo dos veces no falla.

## Cómo aplicarlas en local

```bash
npm i -g supabase          # una sola vez
supabase init              # si no existe supabase/config.toml
supabase start             # levanta Postgres y Auth en Docker
supabase db reset          # aplica todo supabase/migrations en orden
```

`supabase db reset` **borra la base local y la reconstruye**. Es lo que se
quiere en local y lo que nunca se hace contra un proyecto real.

## Cómo aplicarlas en un proyecto real

1. Crear el proyecto en supabase.com y anotar la URL y la clave anónima.
2. `supabase link --project-ref <ref>`
3. `supabase db push`

Antes de eso hay que tener un `.env.local` válido:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<clave anónima>
VITE_SYNC_FLAG=internal
```

La clave anónima es pública por diseño: lo que protege los datos es RLS, que
está activo en todas las tablas con `using` **y** `with check`. No hay ninguna
clave de servicio en el cliente, y la auditoría de `dist` comprueba que no
viajan secretos en el bundle.

## Antes de revertir

**Revertir una migración que ya recibió escrituras pierde esas escrituras.**
`0002_domain_tables.down.sql` hace `drop table ... cascade` sobre datos de
personas: entrenamientos, comidas, pesos, check-ins.

El procedimiento correcto es:

1. Exportar. Desde la aplicación, `Ajustes → Datos y respaldo → Crear copia`
   genera el archivo completo con las fotos incluidas.
2. Verificar el archivo con la propia pantalla de restauración, que comprueba
   el checksum antes de aceptarlo.
3. Solo entonces revertir.

Si la reversión es de `0003` (solo funciones) no hay riesgo: no contienen
datos.

## Compatibilidad de esquema

`sync_server_schema()` devuelve la versión que entiende el servidor y
`sync_min_schema()` la mínima aceptada. La regla es que el servidor entiende
**N y N−1 siempre**: el cliente viejo y el nuevo conviven durante semanas
después de cada despliegue, y romper la compatibilidad hacia atrás en un solo
paso deja a media base de usuarios sin poder sincronizar.

Las migraciones **solo añaden**. Renombrar una columna es: añadir la nueva,
copiar, y borrar la vieja tres versiones más tarde. Nunca en el mismo
despliegue.

## Lo que no está aquí a propósito

- **Política de coach.** El plan maestro define una política que da lectura al
  coach sobre los datos de sus atletas. No se crea todavía: no existe el
  dashboard que la necesita, y una política que concede acceso a terceros no
  debe existir antes que la función que la usa.
- **Bucket de fotos.** Los metadatos se sincronizan; el binario no se sube. La
  columna `storage_path` está preparada y vacía.
- **Tabla de suscripciones.** No hay monetización en 2.1.
