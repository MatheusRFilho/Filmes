import { getSupabase } from "./supabase";
import type { Profile } from "./types";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name")
    .order("display_name", { ascending: true });

  if (error) throw error;
  return ((data as ProfileRow[]) ?? []).map(mapProfile);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapProfile(data as ProfileRow);
}
