import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { createManagementRoleSchema } from "@/lib/reservas/validations";

/**
 * GET /api/admin/management-roles
 * List all commission_gerencia_assignments with project info.
 * Auth: master only.
 */
export async function GET() {
  const auth = await requireRole(["master"]);
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const [assignmentsRes, projectsRes] = await Promise.all([
    supabase
      .from("commission_gerencia_assignments")
      .select("*")
      .order("project_id")
      .order("role")
      .order("start_date", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, slug, display_name")
      .order("name"),
  ]);

  if (assignmentsRes.error) {
    console.error("[GET /api/admin/management-roles]", assignmentsRes.error);
    return jsonError(500, assignmentsRes.error.message);
  }
  if (projectsRes.error) {
    console.error("[GET /api/admin/management-roles]", projectsRes.error);
    return jsonError(500, projectsRes.error.message);
  }

  return jsonOk({
    assignments: assignmentsRes.data ?? [],
    projects: projectsRes.data ?? [],
  });
}

/**
 * POST /api/admin/management-roles
 * Create a new management role assignment.
 * Auth: master only.
 */
export async function POST(request: Request) {
  const auth = await requireRole(["master"]);
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, createManagementRoleSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // Check for overlapping active assignment on same project + role
  const { data: existing } = await supabase
    .from("commission_gerencia_assignments")
    .select("id, recipient_name, start_date, end_date")
    .eq("project_id", input.project_id)
    .eq("role", input.role)
    .is("end_date", null);

  if (existing && existing.length > 0) {
    const current = existing[0];
    return jsonError(409, `Ya existe una asignación activa para este rol: ${current.recipient_name} (desde ${current.start_date}). Finalícela primero.`);
  }

  const { data, error } = await supabase
    .from("commission_gerencia_assignments")
    .insert({
      project_id: input.project_id,
      role: input.role,
      recipient_id: input.recipient_id,
      recipient_name: input.recipient_name,
      rate: input.rate,
      start_date: input.start_date,
      end_date: input.end_date,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/management-roles]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "mgmt_role.created",
    resourceType: "management_role",
    resourceId: data.id,
    resourceLabel: `${input.role} — ${input.recipient_name}`,
    details: {
      role: input.role,
      recipient_name: input.recipient_name,
      rate: input.rate,
      start_date: input.start_date,
    },
    request,
  });

  return jsonOk(data, { status: 201 });
}
