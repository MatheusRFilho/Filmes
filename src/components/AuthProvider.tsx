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
import type { Session, User } from "@supabase/supabase-js";
import {
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from "@/lib/constants";
import { fetchProfile, fetchProfiles } from "@/lib/profiles";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const loadProfileData = useCallback(async (userId: string | undefined) => {
    if (!userId || !isSupabaseConfigured()) {
      setProfile(null);
      setProfiles([]);
      return;
    }

    const [mine, all] = await Promise.all([
      fetchProfile(userId),
      fetchProfiles(),
    ]);
    setProfile(mine);
    setProfiles(all);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadProfileData(data.session?.user.id).finally(() => setReady(true));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfileData(nextSession?.user.id);
    });

    return () => subscription.unsubscribe();
  }, [loadProfileData]);

  const signIn = useCallback(async (username: string, password: string) => {
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      throw new Error("Usuário inválido (3–20 letras, números ou _).");
    }

    const { error } = await getSupabase().auth.signInWithPassword({
      email: usernameToEmail(normalized),
      password,
    });

    if (error) throw error;
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

      const inviteResponse = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const inviteData = (await inviteResponse.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!inviteResponse.ok || !inviteData.ok) {
        throw new Error(inviteData.error || "Código de convite inválido");
      }

      const name = displayName.trim() || normalized;
      const { error } = await getSupabase().auth.signUp({
        email: usernameToEmail(normalized),
        password,
        options: {
          data: {
            username: normalized,
            display_name: name,
          },
        },
      });

      if (error) throw error;
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
    setProfile(null);
    setProfiles([]);
  }, []);

  const refreshProfiles = useCallback(async () => {
    if (!session?.user.id) return;
    await loadProfileData(session.user.id);
  }, [loadProfileData, session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      profile,
      profiles,
      signIn,
      signUp,
      signOut,
      refreshProfiles,
    }),
    [
      ready,
      session,
      profile,
      profiles,
      signIn,
      signUp,
      signOut,
      refreshProfiles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
