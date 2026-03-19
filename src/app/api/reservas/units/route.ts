import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { unitsQuerySchema } from "@/lib/reservas/validations";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, unitsQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();
  let query = supabase.from("v_rv_units_full").select("*");

  if (filters.project) query = query.eq("project_slug", filters.project);
  if (filters.tower) query = query.eq("tower_id", filters.tower);
  if (filters.status) query = query.eq("status", filters.status);

  query = query.order("floor_number", { ascending: false }).order("unit_number");

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/reservas/units]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}
