import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Cliente no servidor com a Publishable/anon key (chama RPCs de login). */
export function getSupabaseServer(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e a Publishable key no .env",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
