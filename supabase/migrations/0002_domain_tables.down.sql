-- Reversion de 0002.
--
-- ATENCION: esto BORRA datos de usuario. Si estas tablas recibieron
-- escrituras, exportalas antes. Ver README.md.
drop table if exists reminders            cascade;
drop table if exists progress_photos      cascade;
drop table if exists posing_sessions      cascade;
drop table if exists cardio_sessions      cascade;
drop table if exists prep_recommendations cascade;
drop table if exists competition_preps    cascade;
drop table if exists weekly_checkins      cascade;
drop table if exists readiness_entries    cascade;
drop table if exists body_measurements    cascade;
drop table if exists nutrition_entries    cascade;
drop table if exists custom_foods         cascade;
drop table if exists workout_sets         cascade;
drop table if exists workout_exercises    cascade;
drop table if exists workouts             cascade;
drop table if exists user_settings        cascade;
drop table if exists profiles             cascade;
drop function if exists sync_entity_columns();
