import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/reservas/cotizador-config?project=<slug>
 * Returns active cotizador configs for a project, ordered by display_order.
 * Used by the cotizador page, PCV, and Carta de Pago.
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get("project");

  const supabase = createAdminClient();

  let query = supabase
    .from("cotizador_configs")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (projectSlug) {
    // Look up project_id by slug, then filter configs
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .maybeSingle();

    if (!project) {
      return jsonOk([]);
    }

    query = query.eq("project_id", project.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/reservas/cotizador-config]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data ?? []);
}
