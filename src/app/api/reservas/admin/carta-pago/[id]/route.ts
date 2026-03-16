import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { requireSalesperson, isSalespersonFailure } from "@/lib/reservas/require-salesperson";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/reservas/admin/carta-pago/[id]
 *
 * Returns data needed to render the Carta de Pago document for a reservation:
 * - reservation (id, created_at, status)
 * - clients (full_name, document_order)
 * - unit (unit_number, price_list, project_slug, project_name)
 *
 * Auth: admin (master/torredecontrol) OR salesperson with ownership of the reservation.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Dual auth: admin OR salesperson (with ownership check below)
  let salespersonId: string | null = null;
  const adminAuth = await requireRole(["master", "torredecontrol"]);
  if (adminAuth.response) {
    const spAuth = await requireSalesperson();
    if (isSalespersonFailure(spAuth)) return adminAuth.response;
    salespersonId = spAuth.salesperson.id;
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("id, unit_id, status, created_at, salesperson_id")
    .eq("id", id)
    .maybeSingle();

  if (rErr) {
    console.error("[GET /api/reservas/admin/carta-pago/[id]]", rErr);
    return jsonError(500, rErr.message);
  }
  if (!reservation) {
    return jsonError(404, "Reserva no encontrada");
  }

  // Ownership check for salesperson
  if (salespersonId && reservation.salesperson_id !== salespersonId) {
    return jsonError(403, "No autorizado para esta reserva");
  }

  const [clientsResult, unitResult] = await Promise.all([
    supabase
      .from("reservation_clients")
      .select("id, client_id, is_primary, document_order, rv_clients(id, full_name)")
      .eq("reservation_id", id)
      .order("document_order", { ascending: true }),
    supabase
      .from("v_rv_units_full")
      .select("project_slug, project_name, unit_number, price_list")
      .eq("id", reservation.unit_id)
      .maybeSingle(),
  ]);

  return jsonOk({
    reservation,
    clients: clientsResult.data ?? [],
    unit: unitResult.data ?? null,
  });
}
