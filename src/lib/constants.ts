export function posterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" = "w342",
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/** Supabase Auth exige e-mail; username vira e-mail interno. */
export const AUTH_EMAIL_DOMAIN = "cineadois.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(username));
}
