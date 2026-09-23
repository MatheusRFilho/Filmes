# Cine a Dois

Lista compartilhada de filmes e séries — Next.js + Supabase Auth + TMDB.

## O que faz

- Login com **usuário e senha** (cada um com a própria conta)
- Criar conta com código de convite (`ACCESS_PIN`)
- Busca TMDB (capa + sinopse)
- Lista no Supabase com sync em tempo real
- Adicionar, remover, marcar assistido, quem sugeriu, filtros

## Setup

### 1. Env

```bash
npm install
cp .env.example .env
```

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Settings → API Keys) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable key** (mesma tela). Se o app pedir a chave antiga, use a aba **Legacy API Keys** → `anon` em `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `TMDB_API_KEY` | API do TMDB |
| `ACCESS_PIN` | código só para **criar conta** |

> Não use `service_role` nem secret key no frontend — só no servidor, e este projeto não precisa delas.

### 2. SQL no Supabase

Rode [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.

### 3. Auth do Supabase (importante)

Em **Authentication → Providers → Email**:

- Ative Email
- **Desative** “Confirm email” (usamos e-mail interno `usuario@cineadois.local`)

### 4. Criar as contas

1. `npm run dev`
2. Abra o site → **Criar conta**
3. Usuário (ex: `matheus`), senha, nome na lista, código = `ACCESS_PIN`
4. Repita para a Aline (`aline`)

Depois é só **Entrar** com usuário e senha.

### 5. Deploy

Na Vercel, configure as mesmas variáveis do `.env`.

## Observação

O Supabase Auth exige e-mail por baixo dos panos. O app converte `matheus` → `matheus@cineadois.local` automaticamente — vocês só digitam o username.
