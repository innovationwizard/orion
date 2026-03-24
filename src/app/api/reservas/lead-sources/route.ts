import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/reservas/lead-sources
 * Returns active lead sources ordered by display_order.
 * Used by reservation forms (all authenticated users).
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lead_sources")
    .select("id, name, display_order")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    console.error("[GET /api/reservas/lead-sources]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data ?? []);
}
