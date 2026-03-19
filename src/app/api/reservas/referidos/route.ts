import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery, parseJson } from "@/lib/api";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { referidosQuerySchema, createReferralSchema } from "@/lib/reservas/validations";

export async function GET(request: NextRequest) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, referidosQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();
  let query = supabase.from("v_rv_referrals_full").select("*");
  if (filters.project) query = query.eq("project_slug", filters.project);

  const { data, error } = await query;
  if (error) return jsonError(500, error.message);

  return jsonOk(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { data: body, error: bErr } = await parseJson(request, createReferralSchema);
  if (bErr) return jsonError(400, bErr.error, bErr.details);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rv_referrals")
    .insert(body)
    .select()
    .single();

  if (error) return jsonError(500, error.message);
  return jsonOk(data, { status: 201 });
}
