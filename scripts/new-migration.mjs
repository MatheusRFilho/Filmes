import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const name = process.argv
  .slice(2)
  .join("_")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_]+/g, "_")
  .replace(/^_+|_+$/g, "");

if (!name) {
  console.error("Uso: yarn db:migration:new nome_da_mudanca");
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const id = `${stamp}_${name}`;
const dir = join(process.cwd(), "supabase", "migrations");
mkdirSync(dir, { recursive: true });

const filePath = join(dir, `${id}.sql`);
const contents = `-- Migration: ${id}
-- Rode este arquivo UMA vez no SQL Editor do Supabase.
-- Não rode migrations anteriores de novo.

-- Exemplo:
-- alter table public.items add column if not exists notes text;

insert into public.app_migrations (id)
values ('${id}')
on conflict (id) do nothing;
`;

writeFileSync(filePath, contents, "utf8");
console.log(`Criado: supabase/migrations/${id}.sql`);
