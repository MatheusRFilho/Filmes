import { getSupabase } from "./supabase";
import type { MediaType, WatchItem } from "./types";

type NewItemInput = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  overview: string;
  year: string;
  suggestedBy: string;
};

type ItemRow = {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  overview: string | null;
  year: string | null;
  suggested_by: string;
  watched: boolean;
  created_at: string;
};

function mapRow(row: ItemRow): WatchItem {
  return {
    id: row.id,
    tmdbId: Number(row.tmdb_id),
    mediaType: row.media_type === "tv" ? "tv" : "movie",
    title: row.title ?? "",
    posterPath: row.poster_path ?? null,
    overview: row.overview ?? "",
    year: row.year ?? "",
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

  if (error) throw error;
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
    .catch((error: Error) => {
      if (active) onError?.(error);
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
          .catch((error: Error) => {
            if (active) onError?.(error);
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
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("items").insert({
    tmdb_id: input.tmdbId,
    media_type: input.mediaType,
    title: input.title,
    poster_path: input.posterPath,
    overview: input.overview,
    year: input.year,
    suggested_by: input.suggestedBy,
    watched: false,
    created_by: user?.id ?? null,
  });

  if (error) throw error;
}

export async function setWatched(id: string, watched: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("items")
    .update({ watched })
    .eq("id", id);

  if (error) throw error;
}

export async function removeItem(id: string): Promise<void> {
  const { error } = await getSupabase().from("items").delete().eq("id", id);
  if (error) throw error;
}
