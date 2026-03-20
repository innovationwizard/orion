import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { updateSettingsSchema } from "@/lib/reservas/validations";

export async function GET() {
  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "auto_approval_enabled")
    .maybeSingle();

  if (error) {
    console.error("[GET /api/reservas/admin/settings]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({ auto_approval_enabled: data?.value === true });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, updateSettingsSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("system_settings")
    .update({
      value: input.auto_approval_enabled,
      updated_at: new Date().toISOString(),
      updated_by: auth.user!.id,
    })
    .eq("key", "auto_approval_enabled");

  if (error) {
    console.error("[PATCH /api/reservas/admin/settings]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "settings.updated",
    resourceType: "system_settings",
    resourceId: "auto_approval_enabled",
    details: { value: input.auto_approval_enabled },
    request,
  });

  return jsonOk({ auto_approval_enabled: input.auto_approval_enabled });
}
