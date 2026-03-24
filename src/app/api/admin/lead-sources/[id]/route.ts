import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { z } from "zod";

const updateLeadSourceSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    display_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Al menos un campo requerido",
  });

/**
 * PATCH /api/admin/lead-sources/[id]
 * Update a lead source (name, display_order, is_active).
 * Auth: marketing + admin.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("lead_sources", "update"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const { data: input, error: pErr } = await parseJson(request, updateLeadSourceSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // Verify exists
  const { data: existing, error: fetchErr } = await supabase
    .from("lead_sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[PATCH /api/admin/lead-sources]", fetchErr);
    return jsonError(500, fetchErr.message);
  }
  if (!existing) {
    return jsonError(404, "Fuente no encontrada");
  }

  const updates: Record<string, unknown> = { updated_by: auth.user!.id };
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.display_order !== undefined) updates.display_order = input.display_order;
  if (input.is_active !== undefined) updates.is_active = input.is_active;

  const { data, error } = await supabase
    .from("lead_sources")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError(409, `Ya existe una fuente con ese nombre`);
    }
    console.error("[PATCH /api/admin/lead-sources]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "lead_source.updated",
    resourceType: "lead_source",
    resourceId: id,
    resourceLabel: data.name,
    details: {
      changes: input,
      previous: { name: existing.name, display_order: existing.display_order, is_active: existing.is_active },
    },
    request,
  });

  return jsonOk(data);
}

/**
 * DELETE /api/admin/lead-sources/[id]
 * Hard delete a lead source (only if unused in reservations).
 * Auth: marketing + admin.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("lead_sources", "delete"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  // Verify exists
  const { data: existing, error: fetchErr } = await supabase
    .from("lead_sources")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[DELETE /api/admin/lead-sources]", fetchErr);
    return jsonError(500, fetchErr.message);
  }
  if (!existing) {
    return jsonError(404, "Fuente no encontrada");
  }

  // Check if source is in use by any reservation
  const { count, error: countErr } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("lead_source", existing.name);

  if (countErr) {
    console.error("[DELETE /api/admin/lead-sources]", countErr);
    return jsonError(500, countErr.message);
  }

  if (count && count > 0) {
    return jsonError(
      409,
      `No se puede eliminar "${existing.name}" porque está asociada a ${count} reserva(s). Desactívela en su lugar.`,
    );
  }

  const { error } = await supabase
    .from("lead_sources")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[DELETE /api/admin/lead-sources]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "lead_source.deleted",
    resourceType: "lead_source",
    resourceId: id,
    resourceLabel: existing.name,
    request,
  });

  return jsonOk({ deleted: true });
}
