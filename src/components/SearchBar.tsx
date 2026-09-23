"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  const [suggestedBy, setSuggestedBy] = useState(defaultSuggestedBy);
  const [loading, setLoading] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (defaultSuggestedBy) {
      setSuggestedBy(defaultSuggestedBy);
    }
  }, [defaultSuggestedBy]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError("");
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
      setError(err instanceof Error ? err.message : "Falha ao adicionar");
    } finally {
      setAddingKey(null);
    }
  }

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
            onChange={(e) => setSuggestedBy(e.target.value)}
          >
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className="muted">Buscando…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {results.length > 0 ? (
        <ul className="search-results">
          {results.map((result) => {
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
    </section>
  );
}
