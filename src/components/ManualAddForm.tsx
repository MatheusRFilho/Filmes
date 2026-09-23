"use client";

import { FormEvent, useState } from "react";
import type { MediaType, TmdbSearchResult } from "@/lib/types";

type ManualAddFormProps = {
  names: string[];
  defaultSuggestedBy: string;
  onAdd: (result: TmdbSearchResult, suggestedBy: string) => Promise<void>;
  onClose: () => void;
};

export function ManualAddForm({
  names,
  defaultSuggestedBy,
  onAdd,
  onClose,
}: ManualAddFormProps) {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [year, setYear] = useState("");
  const [genres, setGenres] = useState("");
  const [overview, setOverview] = useState("");
  const [suggestedByOverride, setSuggestedByOverride] = useState<string | null>(
    null,
  );
  const suggestedBy = suggestedByOverride ?? defaultSuggestedBy;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Informe o título.");
      return;
    }

    setLoading(true);
    setError("");

    const genreList = genres
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    const result: TmdbSearchResult = {
      // IDs negativos = entrada manual (TMDB usa IDs positivos)
      tmdbId: -Date.now(),
      mediaType,
      title: trimmed,
      posterPath: null,
      overview: overview.trim(),
      year: year.trim().slice(0, 4),
      genres: genreList,
    };

    try {
      await onAdd(result, suggestedBy);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao adicionar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="manual-form" onSubmit={handleSubmit}>
      <div className="manual-form-header">
        <h3>Adicionar manualmente</h3>
        <p className="muted">
          Use quando o título não aparecer na busca do TMDB.
        </p>
      </div>

      <div className="manual-grid">
        <label className="search-field grow">
          <span>Título</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome do filme ou série"
            required
          />
        </label>

        <label className="search-field">
          <span>Tipo</span>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as MediaType)}
          >
            <option value="movie">Filme</option>
            <option value="tv">Série</option>
          </select>
        </label>

        <label className="search-field">
          <span>Ano</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
            placeholder="2024"
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

        <label className="search-field full">
          <span>Gêneros</span>
          <input
            type="text"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="Ação, Comédia, Drama…"
          />
        </label>

        <label className="search-field full">
          <span>Sinopse (opcional)</span>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="Uma breve descrição…"
            rows={3}
          />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="manual-actions">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !title.trim()}
        >
          {loading ? "Salvando…" : "Salvar na lista"}
        </button>
      </div>
    </form>
  );
}
