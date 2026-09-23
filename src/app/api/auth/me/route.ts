import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ profile: null, profiles: [] });
  }

  const { data, error } = await getSupabaseServer().rpc("list_app_profiles");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = ((data as { id: string; username: string; display_name: string }[]) ?? []).map(
    (row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
    }),
  );

  const profile =
    profiles.find((p) => p.id === session.sub) ?? {
      id: session.sub,
      username: session.username,
      displayName: session.displayName,
    };

  return NextResponse.json({ profile, profiles });
}
