import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery, parseJson } from "@/lib/api";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { valorizacionQuerySchema, createPriceHistorySchema } from "@/lib/reservas/validations";

export async function GET(request: NextRequest) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, valorizacionQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();
  let query = supabase
    .from("rv_price_history")
    .select(`
      id,
      effective_date,
      units_remaining,
      increment_amount,
      increment_pct,
      new_price_avg,
      appreciation_total,
      notes,
      created_at,
      project:projects!inner(name, slug),
      tower:towers(name)
    `)
    .order("effective_date", { ascending: true });

  if (filters.project) {
    query = query.eq("project.slug", filters.project);
  }

  const { data, error } = await query;
  if (error) return jsonError(500, error.message);

  // Flatten joined shape
  const rows = (data ?? []).map((r: Record<string, unknown>) => {
    const project = r.project as { name: string; slug: string } | null;
    const tower = r.tower as { name: string } | null;
    return {
      id: r.id,
      project_name: project?.name ?? "",
      project_slug: project?.slug ?? "",
      tower_name: tower?.name ?? null,
      effective_date: r.effective_date,
      units_remaining: r.units_remaining,
      increment_amount: r.increment_amount,
      increment_pct: r.increment_pct,
      new_price_avg: r.new_price_avg,
      appreciation_total: r.appreciation_total,
      notes: r.notes,
      created_at: r.created_at,
    };
  });

  return jsonOk(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { data: body, error: bErr } = await parseJson(request, createPriceHistorySchema);
  if (bErr) return jsonError(400, bErr.error, bErr.details);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rv_price_history")
    .insert(body)
    .select()
    .single();

  if (error) return jsonError(500, error.message);
  return jsonOk(data, { status: 201 });
}
