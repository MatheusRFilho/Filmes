export type MediaType = "movie" | "tv";

export type WatchItem = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  overview: string;
  year: string;
  genres: string[];
  suggestedBy: string;
  watched: boolean;
  createdAt: number;
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
};

export type TmdbSearchResult = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  overview: string;
  year: string;
  genres: string[];
};

export type MediaFilter = "all" | MediaType;
export type SuggestedFilter = "all" | string;
