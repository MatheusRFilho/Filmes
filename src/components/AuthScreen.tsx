"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Mode = "login" | "register";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(username, password);
      } else {
        await signUp(username, password, displayName, inviteCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pin-gate">
      <div className="pin-panel">
        <p className="eyebrow">Só pra nós dois</p>
        <h1 className="brand">Cine a Dois</h1>
        <p className="lede">
          {mode === "login"
            ? "Entre com seu usuário e senha para ver a lista."
            : "Crie sua conta com o código de convite do casal."}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pin-form">
          <label className="search-field">
            <span>Usuário</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: matheus"
              required
            />
          </label>

          {mode === "register" ? (
            <label className="search-field">
              <span>Nome na lista</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como aparece em “quem sugeriu”"
              />
            </label>
          ) : null}

          <label className="search-field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {mode === "register" ? (
            <label className="search-field">
              <span>Código de convite</span>
              <input
                type="password"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Código compartilhado"
                required
              />
            </label>
          ) : null}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !username || !password}
          >
            {loading
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </div>
  );
}
