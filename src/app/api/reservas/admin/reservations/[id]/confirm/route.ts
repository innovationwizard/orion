import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { confirmReservationSchema } from "@/lib/reservas/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reservationId } = await params;

  const { data: input, error: pErr } = await parseJson(request, confirmReservationSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("confirm_reservation", {
    p_reservation_id: reservationId,
    p_admin_user_id: input.admin_user_id,
  });

  if (error) {
    console.error("[PATCH /api/reservas/admin/reservations/confirm]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ status: "CONFIRMED" });
}
