-- Migration: 20260923124000_add_item_genres
-- Rode UMA vez no SQL Editor.

alter table public.items
  add column if not exists genres text[] not null default '{}';

insert into public.app_migrations (id)
values ('20260923124000_add_item_genres')
on conflict (id) do nothing;
