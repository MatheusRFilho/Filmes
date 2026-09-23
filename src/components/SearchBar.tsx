"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ManualAddForm } from "@/components/ManualAddForm";
import { posterUrl } from "@/lib/constants";
import type { TmdbSearchResult } from "@/lib/types";

type SearchBarProps = {
  onAdd: (result: TmdbSearchResult, suggestedBy: string) => Promise<void>;
  existingKeys: Set<string>;
  names: string[];
  defaultSuggestedBy: string;
};

export function SearchBar({
  onAdd,
  existingKeys,
  names,
  defaultSuggestedBy,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [suggestedByOverride, setSuggestedByOverride] = useState<string | null>(
    null,
  );
  const suggestedBy = suggestedByOverride ?? defaultSuggestedBy;
  const [loading, setLoading] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          results?: TmdbSearchResult[];
          error?: string;
        };

        if (!response.ok) {
          setError(data.error || "Erro na busca");
          setResults([]);
          return;
        }

        setResults(data.results ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Não foi possível buscar agora.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  async function handleAdd(result: TmdbSearchResult) {
    const key = `${result.mediaType}:${result.tmdbId}`;
    setAddingKey(key);
    setError("");
    try {
      await onAdd(result, suggestedBy);
      setQuery("");
      setResults([]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Falha ao adicionar";
      setError(message || "Falha ao adicionar");
    } finally {
      setAddingKey(null);
    }
  }

  const trimmedQuery = query.trim();
  const searchActive = trimmedQuery.length >= 2;
  const visibleResults = searchActive ? results : [];
  const visibleError = searchActive ? error : "";
  const visibleLoading = searchActive && loading;
  const searchedEmpty =
    searchActive && !visibleLoading && visibleResults.length === 0 && !visibleError;

  return (
    <section className="search-section">
      <div className="search-toolbar">
        <label className="search-field grow">
          <span>Buscar no TMDB</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do filme ou série…"
            autoComplete="off"
          />
        </label>

        <label className="search-field">
          <span>Quem sugeriu</span>
          <select
            value={suggestedBy}
            onChange={(e) => setSuggestedByOverride(e.target.value)}
          >
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleLoading ? <p className="muted">Buscando…</p> : null}
      {visibleError ? <p className="form-error">{visibleError}</p> : null}

      {searchedEmpty && !manualOpen ? (
        <p className="muted search-empty-hint">
          Não achou no TMDB?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setManualOpen(true)}
          >
            Adicionar manualmente
          </button>
        </p>
      ) : null}

      {visibleResults.length > 0 ? (
        <ul className="search-results">
          {visibleResults.map((result) => {
            const key = `${result.mediaType}:${result.tmdbId}`;
            const already = existingKeys.has(key);
            const poster = posterUrl(result.posterPath, "w185");

            return (
              <li key={key} className="search-result">
                <div className="search-poster">
                  {poster ? (
                    <Image
                      src={poster}
                      alt=""
                      width={48}
                      height={72}
                      className="poster-img"
                    />
                  ) : (
                    <div className="poster-fallback tiny">?</div>
                  )}
                </div>
                <div className="search-info">
                  <strong>{result.title}</strong>
                  <span>
                    {result.mediaType === "tv" ? "Série" : "Filme"}
                    {result.year ? ` · ${result.year}` : ""}
                    {result.genres.length > 0
                      ? ` · ${result.genres.slice(0, 2).join(", ")}`
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-primary compact"
                  disabled={already || addingKey === key}
                  onClick={() => handleAdd(result)}
                >
                  {already
                    ? "Já na lista"
                    : addingKey === key
                      ? "Salvando…"
                      : "Adicionar"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {manualOpen ? (
        <ManualAddForm
          names={names}
          defaultSuggestedBy={defaultSuggestedBy}
          onAdd={onAdd}
          onClose={() => setManualOpen(false)}
        />
      ) : null}
    </section>
  );
}
