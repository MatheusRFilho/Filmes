import { NextResponse } from "next/server";
import type { MediaType, TmdbSearchResult } from "@/lib/types";

type TmdbMultiResult = {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
};

type GenreRow = { id: number; name: string };

async function fetchGenreMap(
  apiKey: string,
  mediaType: MediaType,
): Promise<Map<number, string>> {
  const path = mediaType === "tv" ? "tv" : "movie";
  const url = new URL(`https://api.themoviedb.org/3/genre/${path}/list`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "pt-BR");

  const response = await fetch(url.toString(), {
    next: { revalidate: 86400 },
  });

  if (!response.ok) return new Map();

  const data = (await response.json()) as { genres?: GenreRow[] };
  return new Map((data.genres ?? []).map((g) => [g.id, g.name]));
}

function mapGenres(
  ids: number[] | undefined,
  genreMap: Map<number, string>,
): string[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => genreMap.get(id))
    .filter((name): name is string => Boolean(name));
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY não configurada no .env" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] as TmdbSearchResult[] });
  }

  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", q);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");

  const [response, movieGenres, tvGenres] = await Promise.all([
    fetch(url.toString(), { next: { revalidate: 3600 } }),
    fetchGenreMap(apiKey, "movie"),
    fetchGenreMap(apiKey, "tv"),
  ]);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Falha ao buscar no TMDB" },
      { status: 502 },
    );
  }

  const data = (await response.json()) as { results?: TmdbMultiResult[] };

  const results: TmdbSearchResult[] = (data.results ?? [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 10)
    .map((item) => {
      const date = item.release_date || item.first_air_date || "";
      const mediaType = item.media_type as MediaType;
      const genreMap = mediaType === "tv" ? tvGenres : movieGenres;

      return {
        tmdbId: item.id,
        mediaType,
        title: item.title || item.name || "Sem título",
        posterPath: item.poster_path,
        overview: item.overview || "",
        year: date.slice(0, 4),
        genres: mapGenres(item.genre_ids, genreMap),
      };
    });

  return NextResponse.json({ results });
}
