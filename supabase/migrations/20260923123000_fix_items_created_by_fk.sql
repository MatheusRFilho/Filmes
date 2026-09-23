-- Migration: 20260923123000_fix_items_created_by_fk
-- Rode UMA vez no SQL Editor.
-- Corrige 409 Conflict ao adicionar filme (FK created_by apontando errado).

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.items'::regclass
      and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ilike '%created_by%'
  loop
    execute format('alter table public.items drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.items add column if not exists created_by uuid;

-- FK opcional e correta (pode ficar null)
alter table public.items
  add constraint items_created_by_fkey
  foreign key (created_by) references public.app_users (id) on delete set null;

insert into public.app_migrations (id)
values ('20260923123000_fix_items_created_by_fk')
on conflict (id) do nothing;
