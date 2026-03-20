import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { supabaseAdmin, getSupabaseConfigError } from "@/lib/supabase";
import { jsonOk, jsonError } from "@/lib/api";

const assignSchema = z.object({
  salesperson_id: z.string().uuid(),
  project_ids: z.array(z.string().uuid()),
});

export async function POST(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) return jsonError(500, configError);

  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  if (!supabaseAdmin) {
    return jsonError(500, "SUPABASE_SERVICE_ROLE_KEY requerido");
  }

  const payload = await request.json().catch(() => null);
  const parsed = assignSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(400, "Entrada inválida", parsed.error.flatten());
  }

  const { salesperson_id, project_ids } = parsed.data;

  // Verify salesperson exists
  const { data: sp, error: spErr } = await supabaseAdmin
    .from("salespeople")
    .select("id")
    .eq("id", salesperson_id)
    .single();

  if (spErr || !sp) {
    return jsonError(404, "Asesor no encontrado");
  }

  // Get current active assignments (end_date IS NULL)
  const { data: current, error: curErr } = await supabaseAdmin
    .from("salesperson_project_assignments")
    .select("project_id")
    .eq("salesperson_id", salesperson_id)
    .is("end_date", null);

  if (curErr) {
    console.error("[POST /api/admin/salespeople/projects] current", curErr);
    return jsonError(500, "Error al leer asignaciones", curErr.message);
  }

  const currentIds = (current ?? []).map((r: { project_id: string }) => r.project_id);
  const toAdd = project_ids.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !project_ids.includes(id));
  const today = new Date().toISOString().slice(0, 10);

  // Deactivate removed assignments (soft-delete: set end_date)
  if (toRemove.length > 0) {
    const { error: deactErr } = await supabaseAdmin
      .from("salesperson_project_assignments")
      .update({ end_date: today, updated_at: new Date().toISOString() })
      .eq("salesperson_id", salesperson_id)
      .is("end_date", null)
      .in("project_id", toRemove);

    if (deactErr) {
      console.error("[POST /api/admin/salespeople/projects] deactivate", deactErr);
      return jsonError(500, "Error al desasignar proyectos", deactErr.message);
    }
  }

  // Insert new assignments
  if (toAdd.length > 0) {
    const rows = toAdd.map((pid) => ({
      salesperson_id,
      project_id: pid,
      start_date: today,
      end_date: null,
      is_primary: true,
    }));

    const { error: insErr } = await supabaseAdmin
      .from("salesperson_project_assignments")
      .insert(rows);

    if (insErr) {
      console.error("[POST /api/admin/salespeople/projects] insert", insErr);
      return jsonError(500, "Error al asignar proyectos", insErr.message);
    }
  }

  if (toRemove.length > 0 || toAdd.length > 0) {
    await logAudit(auth.user!, {
      eventType: toAdd.length > 0 ? "assignment.created" : "assignment.ended",
      resourceType: "project_assignment",
      resourceId: salesperson_id,
      details: { added: toAdd, removed: toRemove, resulting: project_ids },
      request,
    });
  }

  return jsonOk({ salesperson_id, project_ids });
}
