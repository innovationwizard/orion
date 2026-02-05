import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;

export function getSupabaseServerClient() {
  return supabaseAdmin ?? supabase;
}

export function getSupabaseConfigError() {
  if (!supabaseUrl) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL";
  }
  if (!supabaseAnonKey && !supabaseServiceKey) {
    return "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY";
  }
  return null;
}
