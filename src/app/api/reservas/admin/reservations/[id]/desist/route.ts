import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { desistReservationSchema } from "@/lib/reservas/validations";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

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

  await logAudit(auth.user!, {
    eventType: "reservation.desisted",
    resourceType: "reservation",
    resourceId: reservationId,
    details: {
      admin_user_id: input.admin_user_id,
      reason: input.reason,
      desistimiento_date: input.desistimiento_date,
    },
    request,
  });

  return jsonOk({ status: "DESISTED" });
}
