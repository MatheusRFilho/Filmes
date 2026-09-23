# Migrations do banco (Supabase)

Não rode o banco inteiro de novo a cada mudança. Use arquivos em ordem.

## Como funciona

1. Cada arquivo em `migrations/` é uma mudança **única**
2. Ordem = nome do arquivo (`YYYYMMDDHHMMSS_descricao.sql`)
3. A tabela `app_migrations` registra o que já foi aplicado

## Projeto novo

Rode **só** o primeiro arquivo no SQL Editor:

`20260923100000_init.sql`

## Você já tinha o schema antigo

Rode **só**:

`20260923100100_mark_existing_as_migrated.sql`

Assim o histórico fica marcado sem recriar nada.

## Próximas mudanças

```bash
yarn db:migration:new nome_da_mudanca
```

Isso cria um arquivo vazio em `migrations/`. Escreva o SQL (ALTER, novas funções, etc.), depois cole **apenas esse arquivo** no SQL Editor.

No final do arquivo, registre:

```sql
insert into public.app_migrations (id)
values ('TIMESTAMP_nome_da_mudanca')
on conflict (id) do nothing;
```

(use o mesmo id do nome do arquivo, sem `.sql`)

## Conferir o que já rodou

No SQL Editor:

```sql
select * from public.app_migrations order by id;
```

## Regra de ouro

- Migration antiga → **não rode de novo**
- Mudança nova → **arquivo novo** + rodar só ele
