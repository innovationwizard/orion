import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
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
