import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_rv_projects_with_towers")
    .select("*");

  if (error) {
    console.error("[GET /api/reservas/projects]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}
