import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { updateReservationClientSchema } from "@/lib/reservas/validations";

/**
 * PATCH /api/reservas/admin/reservation-clients/[id]
 *
 * Updates junction-level metadata on a specific reservation_clients row:
 * role, ownership_pct, document_order, legal_capacity, signs_pcv.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const { data: input, error: pErr } = await parseJson(request, updateReservationClientSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // Build update payload — only include provided fields
  const update: Record<string, unknown> = {};
  if (input.role !== undefined) update.role = input.role;
  if (input.ownership_pct !== undefined) update.ownership_pct = input.ownership_pct;
  if (input.legal_capacity !== undefined) update.legal_capacity = input.legal_capacity;
  if (input.document_order !== undefined) update.document_order = input.document_order;
  if (input.signs_pcv !== undefined) update.signs_pcv = input.signs_pcv;

  const { data, error } = await supabase
    .from("reservation_clients")
    .update(update)
    .eq("id", id)
    .select("id, client_id, is_primary, role, ownership_pct, legal_capacity, document_order, signs_pcv")
    .single();

  if (error) {
    console.error("[PATCH /api/reservas/admin/reservation-clients/[id]]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}
