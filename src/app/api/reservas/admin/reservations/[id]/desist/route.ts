import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { desistReservationSchema } from "@/lib/reservas/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reservationId } = await params;

  const { data: input, error: pErr } = await parseJson(request, desistReservationSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("desist_reservation", {
    p_reservation_id: reservationId,
    p_admin_user_id: input.admin_user_id,
    p_reason: input.reason,
    p_desistimiento_date: input.desistimiento_date,
  });

  if (error) {
    console.error("[PATCH /api/reservas/admin/reservations/desist]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ status: "DESISTED" });
}
