import { NextResponse } from "next/server";
import type { TmdbSearchResult } from "@/lib/types";

type TmdbMultiResult = {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
};

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY não configurada no .env.local" },
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

  const response = await fetch(url.toString(), { next: { revalidate: 3600 } });

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
      return {
        tmdbId: item.id,
        mediaType: item.media_type as "movie" | "tv",
        title: item.title || item.name || "Sem título",
        posterPath: item.poster_path,
        overview: item.overview || "",
        year: date.slice(0, 4),
      };
    });

  return NextResponse.json({ results });
}
