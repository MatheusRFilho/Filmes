import { getSupabase } from "./supabase";
import type { MediaType, WatchItem } from "./types";

type NewItemInput = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  overview: string;
  year: string;
  genres: string[];
  suggestedBy: string;
  createdBy?: string | null;
};

type ItemRow = {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  overview: string | null;
  year: string | null;
  genres?: string[] | null;
  suggested_by: string;
  watched: boolean;
  created_at: string;
};

function throwDbError(error: unknown): never {
  if (error instanceof Error) throw error;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: string }).message || "");
    const details = String((error as { details?: string }).details || "");
    const hint = String((error as { hint?: string }).hint || "");
    const code = String((error as { code?: string }).code || "");
    throw new Error(
      [message, details, hint, code ? `(${code})` : ""]
        .filter(Boolean)
        .join(" — "),
    );
  }
  throw new Error("Falha ao acessar o banco");
}

function mapRow(row: ItemRow): WatchItem {
  return {
    id: row.id,
    tmdbId: Number(row.tmdb_id),
    mediaType: row.media_type === "tv" ? "tv" : "movie",
    title: row.title ?? "",
    posterPath: row.poster_path ?? null,
    overview: row.overview ?? "",
    year: row.year ?? "",
    genres: Array.isArray(row.genres) ? row.genres : [],
    suggestedBy: row.suggested_by ?? "",
    watched: Boolean(row.watched),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

async function fetchItems(): Promise<WatchItem[]> {
  const { data, error } = await getSupabase()
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throwDbError(error);
  return ((data as ItemRow[]) ?? []).map(mapRow);
}

export function subscribeItems(
  onChange: (items: WatchItem[]) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;

  fetchItems()
    .then((items) => {
      if (active) onChange(items);
    })
    .catch((error: unknown) => {
      if (!active) return;
      try {
        throwDbError(error);
      } catch (err) {
        onError?.(err as Error);
      }
    });

  const channel = getSupabase()
    .channel("items-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items" },
      () => {
        fetchItems()
          .then((items) => {
            if (active) onChange(items);
          })
          .catch((error: unknown) => {
            if (!active) return;
            try {
              throwDbError(error);
            } catch (err) {
              onError?.(err as Error);
            }
          });
      },
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(err ?? new Error("Falha na conexão realtime do Supabase"));
      }
    });

  return () => {
    active = false;
    void getSupabase().removeChannel(channel);
  };
}

export async function addItem(input: NewItemInput): Promise<void> {
  // Não enviamos created_by no insert do browser:
  // a FK antiga apontando para auth.users gerava 409 Conflict.
  // "suggested_by" já guarda quem sugeriu.
  const { error } = await getSupabase().from("items").insert({
    tmdb_id: input.tmdbId,
    media_type: input.mediaType,
    title: input.title,
    poster_path: input.posterPath,
    overview: input.overview,
    year: input.year,
    genres: input.genres,
    suggested_by: input.suggestedBy,
    watched: false,
  });

  if (error) {
    const code = "code" in error ? String(error.code) : "";
    if (code === "23505" || code === "23503") {
      throw new Error(
        code === "23505"
          ? "Esse título já está na lista."
          : "Conflito ao salvar (FK). Rode a migration de correção do items.",
      );
    }
    throwDbError(error);
  }
}

export async function setWatched(id: string, watched: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("items")
    .update({ watched })
    .eq("id", id);

  if (error) throwDbError(error);
}

export async function removeItem(id: string): Promise<void> {
  const { error } = await getSupabase().from("items").delete().eq("id", id);
  if (error) throwDbError(error);
}
