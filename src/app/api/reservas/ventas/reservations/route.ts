import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery } from "@/lib/api";
import { reservationsQuerySchema } from "@/lib/reservas/validations";
import { requireSalesperson, isSalespersonFailure } from "@/lib/reservas/require-salesperson";

/**
 * GET /api/reservas/ventas/reservations
 *
 * Returns the authenticated salesperson's own reservations.
 * Same shape as v_reservations_pending but filtered by salesperson_id.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSalesperson();
  if (isSalespersonFailure(auth)) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, reservationsQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();

  // Scope to salesperson's currently assigned projects
  const { data: assignments, error: aErr } = await supabase
    .from("salesperson_project_assignments")
    .select("projects:project_id (slug)")
    .eq("salesperson_id", auth.salesperson.id)
    .is("end_date", null);

  if (aErr) {
    console.error("[GET /api/reservas/ventas/reservations] assignments", aErr);
    return jsonError(500, aErr.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedSlugs = (assignments ?? []).map((a: any) => a.projects?.slug).filter(Boolean) as string[];
  if (assignedSlugs.length === 0) return jsonOk([]);

  let query = supabase
    .from("v_reservations_pending")
    .select("*")
    .eq("salesperson_id", auth.salesperson.id)
    .in("project_slug", assignedSlugs);

  if (filters.status) query = query.eq("reservation_status", filters.status);
  if (filters.project) query = query.eq("project_slug", filters.project);
  if (filters.from) query = query.gte("submitted_at", filters.from);
  if (filters.to) query = query.lte("submitted_at", `${filters.to}T23:59:59`);

  query = query.order("submitted_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/reservas/ventas/reservations]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}
