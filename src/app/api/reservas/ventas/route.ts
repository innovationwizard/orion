import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { ventasQuerySchema } from "@/lib/reservas/validations";
import type { VentasMonthlySeries, VentasSummary } from "@/lib/reservas/types";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, ventasQuerySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();

  // 1. Fetch all units for total/available counts
  let unitsQuery = supabase.from("v_rv_units_full").select("id, status, project_slug");
  if (filters.project) unitsQuery = unitsQuery.eq("project_slug", filters.project);
  const { data: units, error: unitsErr } = await unitsQuery;
  if (unitsErr) return jsonError(500, unitsErr.message);

  // 2. Fetch all reservations
  let resQuery = supabase.from("reservations").select("id, unit_id, status, created_at, reviewed_at, desistimiento_date");
  const { data: reservations, error: resErr } = await resQuery;
  if (resErr) return jsonError(500, resErr.message);

  // Filter reservations to only units in the selected project
  const unitIds = new Set((units ?? []).map((u) => u.id));
  const filtered = (reservations ?? []).filter((r) => unitIds.has(r.unit_id));

  // 3. Group by month
  const monthMap = new Map<string, { reservations: number; confirmed: number; desisted: number }>();

  for (const r of filtered) {
    const month = r.created_at.slice(0, 7); // "YYYY-MM"
    if (!monthMap.has(month)) {
      monthMap.set(month, { reservations: 0, confirmed: 0, desisted: 0 });
    }
    const entry = monthMap.get(month)!;

    // Count as a reservation if not rejected
    if (r.status !== "REJECTED") {
      entry.reservations++;
    }
    if (r.status === "CONFIRMED") {
      entry.confirmed++;
    }
    if (r.status === "DESISTED") {
      entry.desisted++;
    }
  }

  // Sort months chronologically and compute cumulative
  const sortedMonths = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  let cumulative = 0;
  const monthly: VentasMonthlySeries[] = sortedMonths.map(([month, counts]) => {
    const net = counts.reservations - counts.desisted;
    cumulative += net;
    return {
      month,
      reservations: counts.reservations,
      confirmed: counts.confirmed,
      desisted: counts.desisted,
      net,
      cumulative,
    };
  });

  // 4. Summary
  const totalUnits = units?.length ?? 0;
  const soldUnits = (units ?? []).filter((u) => u.status === "SOLD" || u.status === "RESERVED").length;
  const availableUnits = (units ?? []).filter((u) => u.status === "AVAILABLE").length;
  const absorptionRate = totalUnits > 0 ? soldUnits / totalUnits : 0;
  const totalMonths = monthly.length || 1;
  const avgMonthlyVelocity = cumulative / totalMonths;
  const monthsToSellout = avgMonthlyVelocity > 0 ? availableUnits / avgMonthlyVelocity : 0;

  const summary: VentasSummary = {
    total_units: totalUnits,
    sold_units: soldUnits,
    available_units: availableUnits,
    absorption_rate: Math.round(absorptionRate * 100) / 100,
    avg_monthly_velocity: Math.round(avgMonthlyVelocity * 10) / 10,
    months_to_sellout: Math.round(monthsToSellout),
  };

  return jsonOk({ monthly, summary });
}
