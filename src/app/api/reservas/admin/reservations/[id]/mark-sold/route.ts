import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { markUnitSoldSchema } from "@/lib/reservas/validations";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { id: reservationId } = await params;

  const { data: input, error: pErr } = await parseJson(request, markUnitSoldSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("mark_unit_sold", {
    p_reservation_id: reservationId,
    p_admin_user_id: input.admin_user_id,
    p_sale_date: input.sale_date,
    p_notes: input.notes,
  });

  if (error) {
    console.error("[PATCH /api/reservas/admin/reservations/mark-sold]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "reservation.sold",
    resourceType: "reservation",
    resourceId: reservationId,
    details: {
      admin_user_id: input.admin_user_id,
      sale_date: input.sale_date,
      notes: input.notes,
    },
    request,
  });

  return jsonOk({ status: "SOLD" });
}
