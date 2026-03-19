import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { rejectReservationSchema } from "@/lib/reservas/validations";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { id: reservationId } = await params;

  const { data: input, error: pErr } = await parseJson(request, rejectReservationSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("reject_reservation", {
    p_reservation_id: reservationId,
    p_admin_user_id: input.admin_user_id,
    p_reason: input.reason,
  });

  if (error) {
    console.error("[PATCH /api/reservas/admin/reservations/reject]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ status: "REJECTED" });
}
