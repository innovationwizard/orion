import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { upsertClientProfileSchema } from "@/lib/reservas/validations";

type Ctx = { params: Promise<{ client_id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { client_id } = await ctx.params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rv_client_profiles")
    .select("*")
    .eq("client_id", client_id)
    .maybeSingle();

  if (error) return jsonError(500, error.message);
  return jsonOk(data);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { client_id } = await ctx.params;
  const { data: body, error: bErr } = await parseJson(request, upsertClientProfileSchema);
  if (bErr) return jsonError(400, bErr.error, bErr.details);

  const supabase = createAdminClient();

  // Upsert: insert if not exists, update if exists
  const { data, error } = await supabase
    .from("rv_client_profiles")
    .upsert(
      { client_id, ...body },
      { onConflict: "client_id" },
    )
    .select()
    .single();

  if (error) return jsonError(500, error.message);
  return jsonOk(data);
}
