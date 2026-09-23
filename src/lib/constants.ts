export function posterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" = "w342",
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(username));
}

export const SESSION_COOKIE = "cineadois_session";
