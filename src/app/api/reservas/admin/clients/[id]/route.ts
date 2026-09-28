import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { updateClientSchema } from "@/lib/reservas/validations";

type Ctx = { params: Promise<{ id: string }> };

const CAMPOS = ["full_name", "phone", "email", "dpi"] as const;
type Campo = (typeof CAMPOS)[number];

/**
 * PATCH /api/reservas/admin/clients/[id]
 *
 * Updates a client of the reservation system. `rv_clients` is shared by
 * reservas, PCV, comisiones, créditos and the entregas board, so a correction
 * here lands everywhere the client is named — which is the point: a misspelled
 * titular is one bad row, not one bad screen.
 *
 * Auth: master + torredecontrol + entregas_editor.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(rolesFor("clients", "update"));
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const { data: body, error: bErr } = await parseJson(request, updateClientSchema);
  if (bErr) return jsonError(400, bErr.error, bErr.details);

  const supabase = createAdminClient();

  // Read before writing: the audit trail records the before/after pair, and a
  // name that ends up on an escritura is exactly what someone will need to
  // trace back later.
  const { data: antes, error: antesErr } = await supabase
    .from("rv_clients")
    .select("id, full_name, phone, email, dpi")
    .eq("id", id)
    .maybeSingle();

  if (antesErr) {
    console.error("[PATCH /api/reservas/admin/clients/[id]] lookup", antesErr);
    return jsonError(500, antesErr.message);
  }
  if (!antes) return jsonError(404, "Cliente no encontrado");

  const { data, error } = await supabase
    .from("rv_clients")
    .update(body)
    .eq("id", id)
    .select("id, full_name, phone, email, dpi")
    .single();

  if (error) {
    console.error("[PATCH /api/reservas/admin/clients/[id]]", error);
    return jsonError(500, error.message);
  }

  if (!data) {
    return jsonError(404, "Cliente no encontrado");
  }

  // Only the fields that actually moved, so the trail reads as a diff rather
  // than a full copy of the row on every edit.
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};
  for (const campo of CAMPOS) {
    const prev = antes[campo as Campo] ?? null;
    const next = data[campo as Campo] ?? null;
    if (prev !== next) cambios[campo] = { antes: prev, despues: next };
  }

  if (Object.keys(cambios).length > 0) {
    await logAudit(auth.user!, {
      eventType: "client.actualizado",
      resourceType: "rv_client",
      resourceId: data.id,
      resourceLabel: data.full_name,
      details: { cambios },
      request,
    });
  }

  return jsonOk(data);
}
