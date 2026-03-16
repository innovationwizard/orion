import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/reservas/admin/carta-autorizacion/[id]
 *
 * Returns all clients for a reservation (name + DPI) so the Carta de
 * Autorización document can be rendered — one letter per client.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch reservation (just to validate it exists + get project info)
  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("id, unit_id, status")
    .eq("id", id)
    .maybeSingle();

  if (rErr) {
    console.error("[GET /api/reservas/admin/carta-autorizacion/[id]]", rErr);
    return jsonError(500, rErr.message);
  }
  if (!reservation) {
    return jsonError(404, "Reserva no encontrada");
  }

  // Parallel: clients + unit (for project slug validation)
  const [clientsResult, unitResult] = await Promise.all([
    supabase
      .from("reservation_clients")
      .select("id, client_id, is_primary, document_order, rv_clients(id, full_name, dpi)")
      .eq("reservation_id", id)
      .order("document_order", { ascending: true }),
    supabase
      .from("v_rv_units_full")
      .select("project_slug, project_name, unit_number")
      .eq("id", reservation.unit_id)
      .maybeSingle(),
  ]);

  return jsonOk({
    reservation,
    clients: clientsResult.data ?? [],
    unit: unitResult.data ?? null,
  });
}
