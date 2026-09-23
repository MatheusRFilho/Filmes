"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/components/AuthProvider";
import { Filters } from "@/components/Filters";
import { ItemCard } from "@/components/ItemCard";
import { SearchBar } from "@/components/SearchBar";
import { addItem, removeItem, setWatched, subscribeItems } from "@/lib/items";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  MediaFilter,
  StatusFilter,
  SuggestedFilter,
  TmdbSearchResult,
  WatchItem,
} from "@/lib/types";

export function WatchlistApp() {
  const { ready, session, profile, profiles, signOut, refreshProfiles } =
    useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [listError, setListError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [media, setMedia] = useState<MediaFilter>("all");
  const [suggestedBy, setSuggestedBy] = useState<SuggestedFilter>("all");

  useEffect(() => {
    if (!session || !isSupabaseConfigured()) return;

    setListError("");
    void refreshProfiles();

    const unsubscribe = subscribeItems(
      (next) => setItems(next),
      (error) => setListError(error.message),
    );

    return () => unsubscribe();
  }, [session, refreshProfiles]);

  const nameOptions = useMemo(() => {
    const fromProfiles = profiles.map((p) => p.displayName);
    if (fromProfiles.length > 0) return fromProfiles;
    if (profile?.displayName) return [profile.displayName];
    return ["Matheus", "Aline"];
  }, [profiles, profile]);

  const existingKeys = useMemo(() => {
    return new Set(items.map((item) => `${item.mediaType}:${item.tmdbId}`));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (status === "pending" && item.watched) return false;
      if (status === "watched" && !item.watched) return false;
      if (media !== "all" && item.mediaType !== media) return false;
      if (suggestedBy !== "all" && item.suggestedBy !== suggestedBy) return false;
      return true;
    });
  }, [items, status, media, suggestedBy]);

  async function handleAdd(result: TmdbSearchResult, who: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Configure o Supabase no .env");
    }
    await addItem({
      tmdbId: result.tmdbId,
      mediaType: result.mediaType,
      title: result.title,
      posterPath: result.posterPath,
      overview: result.overview,
      year: result.year,
      suggestedBy: who,
    });
  }

  async function handleToggle(id: string, watched: boolean) {
    setBusyId(id);
    try {
      await setWatched(id, watched);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao atualizar");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remover este título da lista?")) return;
    setBusyId(id);
    try {
      await removeItem(id);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao remover");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return <div className="boot">Carregando…</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  const supabaseOk = isSupabaseConfigured();

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <p className="eyebrow">Lista compartilhada</p>
          <button
            type="button"
            className="btn-ghost compact"
            onClick={() => void signOut()}
          >
            Sair{profile ? ` (${profile.displayName})` : ""}
          </button>
        </div>
        <h1 className="brand">Cine a Dois</h1>
        <p className="lede">
          Filmes e séries para assistir juntos — sincronizado nos dois aparelhos.
        </p>
      </header>

      {!supabaseOk ? (
        <div className="banner warn">
          Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e a{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (ou a anon legada) no{" "}
          <code>.env</code>.
        </div>
      ) : null}

      <SearchBar
        onAdd={handleAdd}
        existingKeys={existingKeys}
        names={nameOptions}
        defaultSuggestedBy={profile?.displayName ?? nameOptions[0] ?? ""}
      />

      <section className="list-section">
        <div className="list-header">
          <h2>Nossa lista</h2>
          <p className="muted">
            {filtered.length} de {items.length} título
            {items.length === 1 ? "" : "s"}
          </p>
        </div>

        <Filters
          status={status}
          media={media}
          suggestedBy={suggestedBy}
          names={nameOptions}
          onStatusChange={setStatus}
          onMediaChange={setMedia}
          onSuggestedChange={setSuggestedBy}
        />

        {listError ? <p className="form-error">{listError}</p> : null}

        {filtered.length === 0 ? (
          <p className="empty">
            {items.length === 0
              ? "Nada por aqui ainda. Busque um título acima e adicionem juntos."
              : "Nenhum título combina com esses filtros."}
          </p>
        ) : (
          <div className="item-list">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onToggleWatched={handleToggle}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
