import { supabaseBrowser } from "@/lib/supabase-browser";

/** @deprecated Use supabaseBrowser from "@/lib/supabase-browser" directly */
export function createReservasClient() {
  return supabaseBrowser;
}
