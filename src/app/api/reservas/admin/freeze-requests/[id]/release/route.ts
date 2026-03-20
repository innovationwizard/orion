import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { releaseFreezeSchema } from "@/lib/reservas/validations";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { id: freezeId } = await params;

  const { data: input, error: pErr } = await parseJson(request, releaseFreezeSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("release_freeze", {
    p_freeze_id: freezeId,
    p_admin_user_id: input.admin_user_id,
  });

  if (error) {
    console.error("[PATCH /api/reservas/admin/freeze-requests/release]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "freeze.released",
    resourceType: "freeze_request",
    resourceId: freezeId,
    details: { admin_user_id: input.admin_user_id },
    request,
  });

  return jsonOk({ status: "RELEASED" });
}
