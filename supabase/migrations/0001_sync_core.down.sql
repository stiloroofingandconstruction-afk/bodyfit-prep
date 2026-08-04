-- Reversion de 0001. Va la ultima: 0002 y 0003 dependen de auth.users
-- y del tipo sync_op_type.
drop table if exists sync_cursors    cascade;
drop table if exists sync_operations cascade;
drop table if exists sync_user_state cascade;
drop table if exists devices         cascade;
drop type  if exists sync_op_type;
