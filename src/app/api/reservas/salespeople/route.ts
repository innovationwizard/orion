import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("salespeople")
    .select("id, full_name, display_name")
    .eq("is_active", true)
    .order("display_name");

  if (error) {
    console.error("[GET /api/reservas/salespeople]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}
