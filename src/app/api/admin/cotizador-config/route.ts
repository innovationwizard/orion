import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { z } from "zod";

const createConfigSchema = z.object({
  project_id: z.string().uuid(),
  tower_id: z.string().uuid().nullable().default(null),
  unit_type: z.string().max(100).nullable().default(null),
  label: z.string().min(1).max(200),
  currency: z.enum(["GTQ", "USD"]).default("GTQ"),
  enganche_pct: z.number().min(0).max(1),
  reserva_default: z.number().min(0),
  installment_months: z.number().int().min(1).max(60),
  round_enganche_q100: z.boolean().default(false),
  round_cuota_q100: z.boolean().default(false),
  round_cuota_q1: z.boolean().default(false),
  round_saldo_q100: z.boolean().default(false),
  bank_rates: z.array(z.number().min(0).max(1)).min(1),
  bank_rate_labels: z.array(z.string()).nullable().default(null),
  plazos_years: z.array(z.number().int().min(1).max(50)).min(1),
  include_seguro_in_cuota: z.boolean().default(false),
  include_iusi_in_cuota: z.boolean().default(true),
  seguro_enabled: z.boolean().default(false),
  seguro_base: z.enum(["price", "monto_financiar"]).default("price"),
  iusi_frequency: z.enum(["monthly", "quarterly"]).default("monthly"),
  income_multiplier: z.number().min(0).max(10),
  income_base: z.enum(["cuota_banco", "cuota_mensual"]).default("cuota_banco"),
  inmueble_pct: z.number().min(0).max(1),
  timbres_rate: z.number().min(0).max(0.1),
  use_pretax_extraction: z.boolean().default(true),
  mantenimiento_per_m2: z.number().min(0).nullable().default(null),
  mantenimiento_label: z.string().max(100).nullable().default(null),
  disclaimers: z.array(z.string()).default([]),
  validity_days: z.number().int().min(0).default(7),
  display_order: z.number().int().min(0).default(0),
});

/**
 * GET /api/admin/cotizador-config
 * Returns ALL cotizador configs (active + inactive) for management.
 * Auth: admin (master + torredecontrol).
 */
export async function GET() {
  const auth = await requireRole(rolesFor("cotizador_config", "view"));
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cotizador_configs")
    .select("*, projects(name, slug), towers(name)")
    .order("display_order");

  if (error) {
    console.error("[GET /api/admin/cotizador-config]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data ?? []);
}

/**
 * POST /api/admin/cotizador-config
 * Create a new cotizador config.
 * Auth: admin (master + torredecontrol).
 */
export async function POST(request: Request) {
  const auth = await requireRole(rolesFor("cotizador_config", "create"));
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, createConfigSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cotizador_configs")
    .insert({
      ...input,
      label: input.label.trim(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError(409, "Ya existe una configuración para esa combinación de proyecto/torre/tipo");
    }
    console.error("[POST /api/admin/cotizador-config]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "settings.updated",
    resourceType: "cotizador_config",
    resourceId: data.id,
    resourceLabel: input.label,
    details: { action: "created", config: input },
    request,
  });

  return jsonOk(data, { status: 201 });
}
