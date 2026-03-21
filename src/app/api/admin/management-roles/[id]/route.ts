import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { endManagementRoleSchema } from "@/lib/reservas/validations";

/**
 * PATCH /api/admin/management-roles/[id]
 * End an assignment (set end_date) or update notes.
 * Auth: master only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("management_roles", "update"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const { data: input, error: pErr } = await parseJson(request, endManagementRoleSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // Verify the assignment exists
  const { data: existing, error: fetchErr } = await supabase
    .from("commission_gerencia_assignments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[PATCH /api/admin/management-roles]", fetchErr);
    return jsonError(500, fetchErr.message);
  }
  if (!existing) {
    return jsonError(404, "Asignación no encontrada");
  }

  // Update end_date
  const { data, error } = await supabase
    .from("commission_gerencia_assignments")
    .update({
      end_date: input.end_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/management-roles]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "mgmt_role.ended",
    resourceType: "management_role",
    resourceId: id,
    resourceLabel: `${existing.role} — ${existing.recipient_name}`,
    details: { end_date: input.end_date, previous_end_date: existing.end_date },
    request,
  });

  return jsonOk(data);
}
