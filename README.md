# Cine a Dois

Lista compartilhada de filmes e séries — Next.js + Supabase + TMDB.

Login com **usuário e senha** (sem e-mail, sem service_role).

## Setup

### 1. Env

```bash
yarn install
cp .env.example .env
```

Preencha o **`.env`**:

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SESSION_SECRET` | String longa para o cookie de sessão |
| `TMDB_API_KEY` | API do TMDB |
| `ACCESS_PIN` | Código só para **criar conta** |

### 2. Banco (migrations)

Não rode o schema inteiro a cada mudança. Veja [`supabase/migrations/README.md`](supabase/migrations/README.md).

- **Projeto novo:** rode no SQL Editor `supabase/migrations/20260923100000_init.sql`
- **Já tinha o schema:** rode `20260923100100_mark_existing_as_migrated.sql`
- **Mudança nova:**

```bash
yarn db:migration:new minha_mudanca
```

Depois cole **só** o arquivo novo no SQL Editor.

### 3. Rodar

```bash
yarn dev
```

1. Abra http://localhost:3000  
2. **Criar conta** com usuário, senha e código de convite  
3. Depois **Entrar**
