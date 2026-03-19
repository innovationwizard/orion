import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery } from "@/lib/api";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { integracionQuerySchema } from "@/lib/reservas/validations";
import type { IntegrationRow } from "@/lib/reservas/types";

export async function GET(request: NextRequest) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, integracionQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();

  // 1. Fetch all units with project/tower context
  let unitsQuery = supabase.from("v_rv_units_full").select("id, status, tower_id, tower_name, project_name, project_slug");
  if (filters.project) unitsQuery = unitsQuery.eq("project_slug", filters.project);
  const { data: units, error: unitsErr } = await unitsQuery;
  if (unitsErr) return jsonError(500, unitsErr.message);

  // 2. Fetch reservations for timeline context
  let resQuery = supabase.from("reservations").select("id, unit_id, status, created_at, reviewed_at, desistimiento_date");
  const { data: reservations, error: resErr } = await resQuery;
  if (resErr) return jsonError(500, resErr.message);

  // Build reservation lookup by unit_id
  const resByUnit = new Map<string, typeof reservations>();
  for (const r of reservations ?? []) {
    const arr = resByUnit.get(r.unit_id) ?? [];
    arr.push(r);
    resByUnit.set(r.unit_id, arr);
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 3. Aggregate by tower
  const towerMap = new Map<string, IntegrationRow>();

  for (const u of units ?? []) {
    const key = u.tower_id;
    if (!towerMap.has(key)) {
      towerMap.set(key, {
        project_name: u.project_name,
        project_slug: u.project_slug,
        tower_name: u.tower_name,
        tower_id: u.tower_id,
        available: 0,
        soft_hold: 0,
        reserved: 0,
        frozen: 0,
        sold: 0,
        total: 0,
        desisted_total: 0,
        confirmed_current_month: 0,
        confirmed_previous: 0,
      });
    }
    const row = towerMap.get(key)!;
    row.total++;

    switch (u.status) {
      case "AVAILABLE": row.available++; break;
      case "SOFT_HOLD": row.soft_hold++; break;
      case "RESERVED": row.reserved++; break;
      case "FROZEN": row.frozen++; break;
      case "SOLD": row.sold++; break;
    }

    // Count desistimientos and confirmed timing from reservations
    const unitRes = resByUnit.get(u.id) ?? [];
    for (const r of unitRes) {
      if (r.status === "DESISTED") {
        row.desisted_total++;
      }
      if (r.status === "CONFIRMED" && r.reviewed_at) {
        if (r.reviewed_at >= currentMonthStart) {
          row.confirmed_current_month++;
        } else {
          row.confirmed_previous++;
        }
      }
    }
  }

  const rows = Array.from(towerMap.values()).sort((a, b) =>
    a.project_name.localeCompare(b.project_name) || a.tower_name.localeCompare(b.tower_name),
  );

  return jsonOk(rows);
}
