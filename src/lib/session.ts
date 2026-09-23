import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export type SessionPayload = {
  sub: string;
  username: string;
  displayName: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET deve ter pelo menos 16 caracteres no .env");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(profile: Profile): Promise<string> {
  return new SignJWT({
    username: profile.username,
    displayName: profile.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profile.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function readSessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.username !== "string") return null;
    return {
      sub: payload.sub,
      username: payload.username,
      displayName:
        typeof payload.displayName === "string"
          ? payload.displayName
          : payload.username,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
