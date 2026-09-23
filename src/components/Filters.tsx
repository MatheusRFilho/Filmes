"use client";

import type { MediaFilter, StatusFilter, SuggestedFilter } from "@/lib/types";

type FiltersProps = {
  status: StatusFilter;
  media: MediaFilter;
  suggestedBy: SuggestedFilter;
  names: readonly string[];
  onStatusChange: (value: StatusFilter) => void;
  onMediaChange: (value: MediaFilter) => void;
  onSuggestedChange: (value: SuggestedFilter) => void;
};

export function Filters({
  status,
  media,
  suggestedBy,
  names,
  onStatusChange,
  onMediaChange,
  onSuggestedChange,
}: FiltersProps) {
  return (
    <div className="filters" role="group" aria-label="Filtros da lista">
      <label className="filter-field">
        <span>Status</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        >
          <option value="all">Todos</option>
          <option value="pending">Para assistir</option>
          <option value="watched">Assistidos</option>
        </select>
      </label>

      <label className="filter-field">
        <span>Tipo</span>
        <select
          value={media}
          onChange={(e) => onMediaChange(e.target.value as MediaFilter)}
        >
          <option value="all">Filmes e séries</option>
          <option value="movie">Filmes</option>
          <option value="tv">Séries</option>
        </select>
      </label>

      <label className="filter-field">
        <span>Quem sugeriu</span>
        <select
          value={suggestedBy}
          onChange={(e) => onSuggestedChange(e.target.value)}
        >
          <option value="all">Qualquer um</option>
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
