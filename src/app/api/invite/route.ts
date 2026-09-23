import { NextResponse } from "next/server";

/** Valida o código de convite para criar conta (ACCESS_PIN no .env). */
export async function POST(request: Request) {
  const invite = process.env.ACCESS_PIN;

  if (!invite) {
    return NextResponse.json(
      { error: "ACCESS_PIN não configurado no .env" },
      { status: 500 },
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.code || body.code !== invite) {
    return NextResponse.json(
      { ok: false, error: "Código de convite inválido" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
