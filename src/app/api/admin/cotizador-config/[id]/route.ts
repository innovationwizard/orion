import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { z } from "zod";

const updateConfigSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    currency: z.enum(["GTQ", "USD"]).optional(),
    enganche_pct: z.number().min(0).max(1).optional(),
    min_enganche_pct: z.number().min(0).max(1).nullable().optional(),
    reserva_default: z.number().min(0).optional(),
    installment_months: z.number().int().min(1).max(60).optional(),
    round_enganche_q100: z.boolean().optional(),
    round_cuota_q100: z.boolean().optional(),
    round_cuota_q1: z.boolean().optional(),
    round_saldo_q100: z.boolean().optional(),
    bank_rates: z.array(z.number().min(0).max(1)).min(1).optional(),
    bank_rate_labels: z.array(z.string()).nullable().optional(),
    plazos_years: z.array(z.number().int().min(1).max(50)).min(1).optional(),
    include_seguro_in_cuota: z.boolean().optional(),
    include_iusi_in_cuota: z.boolean().optional(),
    seguro_enabled: z.boolean().optional(),
    seguro_base: z.enum(["price", "monto_financiar"]).optional(),
    iusi_frequency: z.enum(["monthly", "quarterly"]).optional(),
    income_multiplier: z.number().min(0).max(10).optional(),
    income_base: z.enum(["cuota_banco", "cuota_mensual"]).optional(),
    inmueble_pct: z.number().min(0).max(1).optional(),
    timbres_rate: z.number().min(0).max(0.1).optional(),
    use_pretax_extraction: z.boolean().optional(),
    mantenimiento_per_m2: z.number().min(0).nullable().optional(),
    mantenimiento_label: z.string().max(100).nullable().optional(),
    disclaimers: z.array(z.string()).optional(),
    validity_days: z.number().int().min(0).optional(),
    display_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Al menos un campo requerido",
  });

/**
 * PATCH /api/admin/cotizador-config/[id]
 * Update a cotizador config.
 * Auth: admin (master + torredecontrol).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("cotizador_config", "update"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const { data: input, error: pErr } = await parseJson(request, updateConfigSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // Verify exists
  const { data: existing, error: fetchErr } = await supabase
    .from("cotizador_configs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[PATCH /api/admin/cotizador-config]", fetchErr);
    return jsonError(500, fetchErr.message);
  }
  if (!existing) {
    return jsonError(404, "Configuración no encontrada");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      updates[key] = key === "label" && typeof value === "string" ? value.trim() : value;
    }
  }

  const { data, error } = await supabase
    .from("cotizador_configs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError(409, "Ya existe una configuración para esa combinación");
    }
    console.error("[PATCH /api/admin/cotizador-config]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "settings.updated",
    resourceType: "cotizador_config",
    resourceId: id,
    resourceLabel: data.label,
    details: { action: "updated", changes: input },
    request,
  });

  return jsonOk(data);
}

/**
 * DELETE /api/admin/cotizador-config/[id]
 * Soft-delete a cotizador config (set is_active = false).
 * Auth: admin (master + torredecontrol).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(rolesFor("cotizador_config", "delete"));
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("cotizador_configs")
    .select("id, label")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[DELETE /api/admin/cotizador-config]", fetchErr);
    return jsonError(500, fetchErr.message);
  }
  if (!existing) {
    return jsonError(404, "Configuración no encontrada");
  }

  // Soft delete
  const { error } = await supabase
    .from("cotizador_configs")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[DELETE /api/admin/cotizador-config]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "settings.updated",
    resourceType: "cotizador_config",
    resourceId: id,
    resourceLabel: existing.label,
    details: { action: "deactivated" },
    request,
  });

  return jsonOk({ deactivated: true });
}
