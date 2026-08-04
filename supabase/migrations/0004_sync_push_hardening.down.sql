-- Reversion de 0004.
--
-- Devuelve `sync_push` a la version de 0003. ATENCION: esa version tiene el
-- error 42702 y falla en cuanto se envia un lote. Revertir 0004 sin revertir
-- tambien 0003 deja la sincronizacion rota, no en un estado anterior sano.
--
-- En la practica, revertir 0004 casi nunca es lo que se quiere: si algo va mal
-- en esta funcion, lo correcto es una migracion 0005 hacia delante.
drop function if exists sync_push(jsonb);
