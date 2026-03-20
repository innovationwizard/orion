import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/admin/creditos
 *
 * Returns all units from v_creditos_unit_full for the credit dashboard.
 * Optional query params:
 *   - project: project slug filter (e.g. "benestare")
 *
 * Auth: DATA_VIEWER_ROLES (master, torredecontrol, gerencia, financiero, contabilidad)
 */
export async function GET(request: Request) {
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const projectSlug = url.searchParams.get("project") ?? undefined;

  const supabase = createAdminClient();
  let query = supabase
    .from("v_creditos_unit_full")
    .select("*");

  if (projectSlug) {
    query = query.eq("project_slug", projectSlug);
  }

  const { data, error } = await query
    .order("project_name")
    .order("tower_name")
    .order("floor_number")
    .order("unit_number");

  if (error) {
    console.error("[GET /api/admin/creditos]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data ?? []);
}
