"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/components/AuthProvider";
import { Filters } from "@/components/Filters";
import { ItemCard } from "@/components/ItemCard";
import { SearchBar } from "@/components/SearchBar";
import { addItem, removeItem, setWatched, subscribeItems } from "@/lib/items";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  MediaFilter,
  SuggestedFilter,
  TmdbSearchResult,
  WatchItem,
} from "@/lib/types";

export function WatchlistApp() {
  const { ready, profile, profiles, signOut } = useAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [listError, setListError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaFilter>("all");
  const [suggestedBy, setSuggestedBy] = useState<SuggestedFilter>("all");

  useEffect(() => {
    if (!profile || !isSupabaseConfigured()) return;

    const unsubscribe = subscribeItems(
      (next) => {
        setItems(next);
        setListError("");
      },
      (error) => setListError(error.message),
    );

    return () => unsubscribe();
  }, [profile]);

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
      if (media !== "all" && item.mediaType !== media) return false;
      if (suggestedBy !== "all" && item.suggestedBy !== suggestedBy) return false;
      return true;
    });
  }, [items, media, suggestedBy]);

  const pendingItems = useMemo(
    () => filtered.filter((item) => !item.watched),
    [filtered],
  );

  const watchedItems = useMemo(
    () => filtered.filter((item) => item.watched),
    [filtered],
  );

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
      genres: result.genres,
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

  if (!profile) {
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
            Sair ({profile.displayName})
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
        defaultSuggestedBy={profile.displayName}
      />

      <section className="list-section">
        <div className="list-header">
          <h2>Nossa lista</h2>
          <p className="muted">
            {pendingItems.length} na fila · {watchedItems.length} assistido
            {watchedItems.length === 1 ? "" : "s"}
          </p>
        </div>

        <Filters
          media={media}
          suggestedBy={suggestedBy}
          names={nameOptions}
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
          <>
            <ItemGroup
              title="Para assistir"
              count={pendingItems.length}
              empty="Nenhum título pendente."
              tone="pending"
            >
              {pendingItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onToggleWatched={handleToggle}
                  onRemove={handleRemove}
                />
              ))}
            </ItemGroup>

            <ItemGroup
              title="Já assistimos"
              count={watchedItems.length}
              empty="Ainda não marcaram nenhum como assistido."
              tone="watched"
            >
              {watchedItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  busy={busyId === item.id}
                  onToggleWatched={handleToggle}
                  onRemove={handleRemove}
                />
              ))}
            </ItemGroup>
          </>
        )}
      </section>
    </div>
  );
}

function ItemGroup({
  title,
  count,
  empty,
  tone,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  tone: "pending" | "watched";
  children: ReactNode;
}) {
  return (
    <div className={`item-group tone-${tone}`}>
      <div className="item-group-header">
        <h3>{title}</h3>
        <span className="item-group-count">{count}</span>
      </div>
      {count === 0 ? (
        <p className="group-empty">{empty}</p>
      ) : (
        <div className="item-list">{children}</div>
      )}
    </div>
  );
}
