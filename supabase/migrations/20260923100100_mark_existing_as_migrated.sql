-- Migration: 20260923100100_mark_existing_as_migrated
-- Se você JÁ rodou o schema.sql antigo antes deste sistema de migrations,
-- rode SÓ este arquivo uma vez para registrar o estado atual.
-- (Não recria tabelas.)

create table if not exists public.app_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

insert into public.app_migrations (id)
values ('20260923100000_init')
on conflict (id) do nothing;

insert into public.app_migrations (id)
values ('20260923100100_mark_existing_as_migrated')
on conflict (id) do nothing;
