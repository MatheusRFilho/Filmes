"use client";

import Image from "next/image";
import { posterUrl } from "@/lib/constants";
import type { WatchItem } from "@/lib/types";

type ItemCardProps = {
  item: WatchItem;
  onToggleWatched: (id: string, watched: boolean) => void;
  onRemove: (id: string) => void;
  busy?: boolean;
};

export function ItemCard({ item, onToggleWatched, onRemove, busy }: ItemCardProps) {
  const poster = posterUrl(item.posterPath, "w342");
  const typeLabel = item.mediaType === "tv" ? "Série" : "Filme";

  return (
    <article
      className={`item-row ${item.watched ? "is-watched" : "is-pending"}`}
    >
      <div className="item-poster">
        {poster ? (
          <Image
            src={poster}
            alt={`Capa de ${item.title}`}
            width={92}
            height={138}
            className="poster-img"
          />
        ) : (
          <div className="poster-fallback" aria-hidden>
            Sem capa
          </div>
        )}
        <span className={`status-badge ${item.watched ? "watched" : "pending"}`}>
          {item.watched ? "Assistido" : "Para assistir"}
        </span>
      </div>

      <div className="item-body">
        <div className="item-meta">
          <span>{typeLabel}</span>
          {item.year ? <span>{item.year}</span> : null}
          {item.tmdbId < 0 ? <span>Manual</span> : null}
          <span>Sugerido por {item.suggestedBy}</span>
        </div>
        <h3>{item.title}</h3>
        {item.genres.length > 0 ? (
          <ul className="genre-list">
            {item.genres.map((genre) => (
              <li key={genre}>{genre}</li>
            ))}
          </ul>
        ) : null}
        {item.overview ? <p className="item-overview">{item.overview}</p> : null}

        <div className="item-actions">
          <button
            type="button"
            className={item.watched ? "btn-ghost" : "btn-primary compact"}
            disabled={busy}
            onClick={() => onToggleWatched(item.id, !item.watched)}
          >
            {item.watched ? "Voltar para a fila" : "Marcar assistido"}
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={busy}
            onClick={() => onRemove(item.id)}
          >
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}
