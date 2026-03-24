import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { z } from "zod";

const createLeadSourceSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100, "Máximo 100 caracteres"),
  display_order: z.number().int().min(0).default(0),
});

/**
 * GET /api/admin/lead-sources
 * Returns ALL lead sources (active + inactive) for management.
 * Auth: marketing + admin.
 */
export async function GET() {
  const auth = await requireRole(rolesFor("lead_sources", "view"));
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lead_sources")
    .select("*")
    .order("display_order");

  if (error) {
    console.error("[GET /api/admin/lead-sources]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data ?? []);
}

/**
 * POST /api/admin/lead-sources
 * Create a new lead source.
 * Auth: marketing + admin.
 */
export async function POST(request: Request) {
  const auth = await requireRole(rolesFor("lead_sources", "create"));
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, createLeadSourceSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("lead_sources")
    .insert({
      name: input.name.trim(),
      display_order: input.display_order,
      updated_by: auth.user!.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError(409, `Ya existe una fuente con el nombre "${input.name}"`);
    }
    console.error("[POST /api/admin/lead-sources]", error);
    return jsonError(500, error.message);
  }

  await logAudit(auth.user!, {
    eventType: "lead_source.created",
    resourceType: "lead_source",
    resourceId: data.id,
    resourceLabel: data.name,
    details: { name: data.name, display_order: data.display_order },
    request,
  });

  return jsonOk(data, { status: 201 });
}
