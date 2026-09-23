"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isValidUsername, normalizeUsername } from "@/lib/constants";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  profile: Profile | null;
  profiles: Profile[];
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (
    username: string,
    password: string,
    displayName: string,
    inviteCode: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readAuthPayload(): Promise<{
  profile: Profile | null;
  profiles: Profile[];
}> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  const data = (await response.json()) as {
    profile?: Profile | null;
    profiles?: Profile[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Falha ao carregar sessão");
  }
  return {
    profile: data.profile ?? null,
    profiles: data.profiles ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const refreshProfiles = useCallback(async () => {
    const data = await readAuthPayload();
    setProfile(data.profile);
    setProfiles(data.profiles);
  }, []);

  useEffect(() => {
    void readAuthPayload()
      .then((data) => {
        setProfile(data.profile);
        setProfiles(data.profiles);
      })
      .catch(() => {
        setProfile(null);
        setProfiles([]);
      })
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      throw new Error("Usuário inválido (3–20 letras, números ou _).");
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalized, password }),
    });
    const data = (await response.json()) as {
      profile?: Profile;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || "Falha ao entrar");
    }

    setProfile(data.profile ?? null);
    const me = await readAuthPayload();
    setProfiles(me.profiles);
  }, []);

  const signUp = useCallback(
    async (
      username: string,
      password: string,
      displayName: string,
      inviteCode: string,
    ) => {
      const normalized = normalizeUsername(username);
      if (!isValidUsername(normalized)) {
        throw new Error("Usuário inválido (3–20 letras, números ou _).");
      }
      if (password.length < 6) {
        throw new Error("A senha precisa ter pelo menos 6 caracteres.");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalized,
          password,
          displayName,
          inviteCode,
        }),
      });
      const data = (await response.json()) as {
        profile?: Profile;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar conta");
      }

      setProfile(data.profile ?? null);
      const me = await readAuthPayload();
      setProfiles(me.profiles);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
    setProfiles([]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      profile,
      profiles,
      signIn,
      signUp,
      signOut,
      refreshProfiles,
    }),
    [ready, profile, profiles, signIn, signUp, signOut, refreshProfiles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
