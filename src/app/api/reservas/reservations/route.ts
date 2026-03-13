import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson, parseQuery } from "@/lib/api";
import { submitReservationSchema, reservationsQuerySchema } from "@/lib/reservas/validations";
import { requireSalesperson, isSalespersonFailure } from "@/lib/reservas/require-salesperson";
import { requireAuth, isSuperuser, hasRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { data: filters, error: qErr } = parseQuery(request, reservationsQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();
  let query = supabase.from("v_reservations_pending").select("*");

  if (filters.status) query = query.eq("reservation_status", filters.status);
  if (filters.project) query = query.eq("project_slug", filters.project);
  if (filters.salesperson) query = query.eq("salesperson_id", filters.salesperson);
  if (filters.from) query = query.gte("submitted_at", filters.from);
  if (filters.to) query = query.lte("submitted_at", `${filters.to}T23:59:59`);

  query = query.order("submitted_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/reservas/reservations]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  // Authenticate: must be a logged-in salesperson OR admin (master/torredecontrol)
  const auth = await requireSalesperson();
  if (isSalespersonFailure(auth)) {
    // Fall back to admin role check
    const userAuth = await requireAuth();
    if (userAuth.response) return userAuth.response;
    const user = userAuth.user!;
    const isAdmin = isSuperuser(user.email ?? null) || hasRole(user, ["master", "torredecontrol"]);
    if (!isAdmin) return auth.response;
  }

  const { data: input, error: pErr } = await parseJson(request, submitReservationSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("submit_reservation", {
    p_unit_id: input.unit_id,
    p_salesperson_id: input.salesperson_id,
    p_client_names: input.client_names,
    p_client_phone: input.client_phone,
    p_deposit_amount: input.deposit_amount,
    p_deposit_date: input.deposit_date,
    p_deposit_bank: input.deposit_bank,
    p_receipt_type: input.receipt_type,
    p_depositor_name: input.depositor_name,
    p_receipt_image_url: input.receipt_image_url,
    p_lead_source: input.lead_source,
    p_notes: input.notes,
    p_dpi_image_url: input.dpi_image_url,
  });

  if (error) {
    console.error("[POST /api/reservas/reservations]", error);

    if (error.message.includes("no disponible") || error.message.includes("not available")) {
      return jsonError(409, "Esta unidad ya no está disponible. Otro asesor puede haberla reservado.");
    }

    return jsonError(500, error.message);
  }

  // Store CUI on the primary client record
  if (input.client_dpi && data) {
    const { data: primaryLink } = await supabase
      .from("reservation_clients")
      .select("client_id")
      .eq("reservation_id", data)
      .eq("is_primary", true)
      .maybeSingle();

    if (primaryLink?.client_id) {
      const { error: dpiErr } = await supabase
        .from("rv_clients")
        .update({ dpi: input.client_dpi })
        .eq("id", primaryLink.client_id);

      if (dpiErr) {
        console.error("[POST /api/reservas/reservations] Failed to set client DPI:", dpiErr);
      }
    }
  }

  return jsonOk({ reservation_id: data, status: "PENDING_REVIEW" }, { status: 201 });
}
