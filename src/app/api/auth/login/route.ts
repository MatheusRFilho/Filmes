import { NextResponse } from "next/server";
import {
  isValidUsername,
  normalizeUsername,
} from "@/lib/constants";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

type UserJson = {
  id: string;
  username: string;
  display_name: string;
};

export async function POST(request: Request) {
  let body: { username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  if (!isValidUsername(username) || !password) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabaseServer().rpc("login_app_user", {
    p_username: username,
    p_password: password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }

  const row = data as UserJson;
  const profile = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };

  const token = await createSessionToken(profile);
  const response = NextResponse.json({ ok: true, profile });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
