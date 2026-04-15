import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { requireSalesperson, isSalespersonFailure } from "@/lib/reservas/require-salesperson";
import { jsonOk, jsonError } from "@/lib/api";

type ClientProfile = {
  client_id: string;
  birth_date: string | null;
  edad: number | null;
  occupation_type: string | null;
  marital_status: string | null;
  gender: string | null;
  profession: string | null;
  domicilio: string | null;
};

/**
 * GET /api/reservas/admin/pcv/[id]
 *
 * Returns all data needed to render a PCV (Promesa de Compraventa) document
 * for a given reservation. Includes unit details, client info, client profiles
 * for all signing clients, and salesperson.
 *
 * Auth: admin (master/torredecontrol) OR salesperson with ownership of the reservation.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Dual auth: admin OR salesperson (with ownership check below)
  let salespersonId: string | null = null;
  const adminAuth = await requireRole(rolesFor("documents", "view"));
  if (adminAuth.response) {
    // Not admin — try salesperson auth
    const spAuth = await requireSalesperson();
    if (isSalespersonFailure(spAuth)) return adminAuth.response;
    salespersonId = spAuth.salesperson.id;
  }

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

  // Ownership check for salesperson
  if (salespersonId && reservation.salesperson_id !== salespersonId) {
    return jsonError(403, "No autorizado para esta reserva");
  }

  // Parallel queries for related data
  const [clientsResult, unitViewResult, salespersonResult] = await Promise.all([
    supabase
      .from("reservation_clients")
      .select("id, client_id, is_primary, role, ownership_pct, legal_capacity, document_order, signs_pcv, rv_clients(id, full_name, phone, email, dpi)")
      .eq("reservation_id", id)
      .order("document_order", { ascending: true }),
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
  const clients = clientsResult.data ?? [];

  // Fetch profiles for ALL signing clients (not just primary)
  const signingClientIds = clients
    .filter((c) => c.signs_pcv)
    .map((c) => c.client_id);

  let clientProfiles: Record<string, ClientProfile> = {};
  let primaryProfile: ClientProfile | null = null;

  if (signingClientIds.length > 0) {
    const { data: profiles } = await supabase
      .from("rv_client_profiles")
      .select("client_id, birth_date, edad, occupation_type, marital_status, gender, profession, domicilio")
      .in("client_id", signingClientIds);

    clientProfiles = Object.fromEntries(
      (profiles ?? []).map((p) => [p.client_id, p]),
    );
  }

  // Backward compat: client_profile for primary client
  const primaryClient = clients.find((c) => c.is_primary);
  if (primaryClient) {
    primaryProfile = clientProfiles[primaryClient.client_id] ?? null;
  }

  // Fetch cotizador configs for the project so the client can resolve the correct config
  let cotizadorConfigs: unknown[] = [];
  if (unit) {
    const { data: configs } = await supabase
      .from("cotizador_configs")
      .select("*")
      .eq("project_id", unit.project_id)
      .eq("active", true);
    cotizadorConfigs = configs ?? [];
  }

  return jsonOk({
    reservation,
    clients,
    unit: unit ?? null,
    client_profiles: clientProfiles,
    client_profile: primaryProfile,
    salesperson: salespersonResult.data,
    cotizador_configs: cotizadorConfigs,
  });
}

/**
 * POST /api/reservas/admin/pcv/[id]
 *
 * Records the PCV document URL and generation metadata on the reservation.
 * Called after the client uploads the PDF to Storage.
 * Admin-only (master/torredecontrol).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("documents", "update"));
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

/**
 * PATCH /api/reservas/admin/pcv/[id]
 *
 * Save missing profile data for a client of a reservation.
 * Admin-only (master/torredecontrol).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("documents", "update"));
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json() as {
    client_id?: string;
    edad?: number | null;
    birth_date?: string | null;
    profession?: string | null;
    marital_status?: string | null;
    domicilio?: string | null;
  };

  const supabase = createAdminClient();

  // Resolve target client — explicit client_id or fall back to primary
  let targetClientId = body.client_id;

  if (!targetClientId) {
    const { data: primaryLink } = await supabase
      .from("reservation_clients")
      .select("client_id")
      .eq("reservation_id", id)
      .eq("is_primary", true)
      .maybeSingle();

    targetClientId = primaryLink?.client_id;
  }

  if (!targetClientId) {
    return jsonError(404, "Cliente no encontrado");
  }

  // Build upsert payload — only include fields that were provided
  const profileUpdate: Record<string, unknown> = {
    client_id: targetClientId,
  };
  if (body.edad !== undefined) profileUpdate.edad = body.edad;
  if (body.birth_date !== undefined) profileUpdate.birth_date = body.birth_date;
  if (body.profession !== undefined) profileUpdate.profession = body.profession;
  if (body.marital_status !== undefined) profileUpdate.marital_status = body.marital_status;
  if (body.domicilio !== undefined) profileUpdate.domicilio = body.domicilio;

  const { error } = await supabase
    .from("rv_client_profiles")
    .upsert(profileUpdate, { onConflict: "client_id" });

  if (error) {
    console.error("[PATCH /api/reservas/admin/pcv/[id]]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ saved: true });
}
