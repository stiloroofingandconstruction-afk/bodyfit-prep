-- Reversion de 0003. Primero las funciones: nada depende de ellas.
drop function if exists sync_bootstrap_seq();
drop function if exists sync_get_cursor(text);
drop function if exists sync_set_cursor(text, bigint);
drop function if exists sync_pull(bigint, int);
drop function if exists sync_push(jsonb);
drop function if exists register_device(text, text, text, text);
drop function if exists sync_health();
drop function if exists sync_min_schema();
drop function if exists sync_server_schema();
