import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
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
