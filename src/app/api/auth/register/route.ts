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
  let body: {
    username?: string;
    password?: string;
    displayName?: string;
    inviteCode?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const invite = process.env.ACCESS_PIN;
  if (!invite) {
    return NextResponse.json(
      { error: "ACCESS_PIN não configurado no .env" },
      { status: 500 },
    );
  }

  if (!body.inviteCode || body.inviteCode !== invite) {
    return NextResponse.json(
      { error: "Código de convite inválido" },
      { status: 401 },
    );
  }

  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";
  const displayName = (body.displayName ?? "").trim() || username;

  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Usuário inválido (3–20 letras, números ou _)." },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabaseServer().rpc("register_app_user", {
    p_username: username,
    p_password: password,
    p_display_name: displayName,
  });

  if (error) {
    const message = error.message || "";
    if (message.includes("username_taken")) {
      return NextResponse.json(
        { error: "Esse usuário já existe." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: message || "Falha ao criar conta" },
      { status: 500 },
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
