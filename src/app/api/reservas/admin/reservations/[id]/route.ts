import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (rErr) {
    console.error("[GET /api/reservas/admin/reservations/[id]]", rErr);
    return jsonError(500, rErr.message);
  }

  if (!reservation) {
    return jsonError(404, "Reserva no encontrada");
  }

  const [clientsResult, extractionsResult, unitResult, salespersonResult, auditResult] =
    await Promise.all([
      supabase
        .from("reservation_clients")
        .select("id, client_id, is_primary, rv_clients(id, full_name, phone, email, dpi)")
        .eq("reservation_id", id),
      supabase
        .from("receipt_extractions")
        .select("*")
        .eq("reservation_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("v_rv_units_full")
        .select("*")
        .eq("id", reservation.unit_id)
        .maybeSingle(),
      supabase
        .from("salespeople")
        .select("id, full_name, display_name, phone, email")
        .eq("id", reservation.salesperson_id)
        .maybeSingle(),
      supabase
        .from("unit_status_log")
        .select("*")
        .eq("unit_id", reservation.unit_id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return jsonOk({
    reservation,
    clients: clientsResult.data ?? [],
    extractions: extractionsResult.data ?? [],
    unit: unitResult.data,
    salesperson: salespersonResult.data,
    audit_log: auditResult.data ?? [],
  });
}
