import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/reservas/admin/pcv/[id]
 *
 * Returns all data needed to render a PCV (Promesa de Compraventa) document
 * for a given reservation. Includes unit details, client info, client profile,
 * and salesperson — no signed URLs, OCR, or audit logs.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch reservation
  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (rErr) {
    console.error("[GET /api/reservas/admin/pcv/[id]]", rErr);
    return jsonError(500, rErr.message);
  }
  if (!reservation) {
    return jsonError(404, "Reserva no encontrada");
  }

  // Parallel queries for related data
  const [clientsResult, unitViewResult, salespersonResult] = await Promise.all([
    supabase
      .from("reservation_clients")
      .select("id, client_id, is_primary, rv_clients(id, full_name, phone, email, dpi)")
      .eq("reservation_id", id),
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
  ]);

  const unit = unitViewResult.data;

  // Fetch bodega_area from rv_units directly (not in v_rv_units_full view)
  let bodega_area: number | null = null;
  if (unit) {
    const { data: rawUnit } = await supabase
      .from("rv_units")
      .select("bodega_area")
      .eq("id", reservation.unit_id)
      .maybeSingle();
    bodega_area = rawUnit?.bodega_area ?? null;
  }

  // Fetch client profile for primary client (birth_date, occupation_type)
  const primaryClient = (clientsResult.data ?? []).find((c) => c.is_primary);
  let clientProfile: {
    birth_date: string | null;
    occupation_type: string | null;
    marital_status: string | null;
    gender: string | null;
  } | null = null;

  if (primaryClient) {
    const { data: profile } = await supabase
      .from("rv_client_profiles")
      .select("birth_date, occupation_type, marital_status, gender")
      .eq("client_id", primaryClient.client_id)
      .maybeSingle();
    clientProfile = profile ?? null;
  }

  return jsonOk({
    reservation,
    clients: clientsResult.data ?? [],
    unit: unit ? { ...unit, bodega_area } : null,
    client_profile: clientProfile,
    salesperson: salespersonResult.data,
  });
}

/**
 * POST /api/reservas/admin/pcv/[id]
 *
 * Records the PCV document URL and generation metadata on the reservation.
 * Called after the client uploads the PDF to Storage.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json() as { pcv_url?: string };

  if (!body.pcv_url || typeof body.pcv_url !== "string") {
    return jsonError(400, "pcv_url es requerido");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reservations")
    .update({
      pcv_url: body.pcv_url,
      pcv_generated_at: new Date().toISOString(),
      pcv_generated_by: auth.user.id,
    })
    .eq("id", id);

  if (error) {
    console.error("[POST /api/reservas/admin/pcv/[id]]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ saved: true });
}
