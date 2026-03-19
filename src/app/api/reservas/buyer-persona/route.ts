import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseQuery } from "@/lib/api";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { valorizacionQuerySchema } from "@/lib/reservas/validations";
import type { DistributionItem, BuyerPersonaAggregate } from "@/lib/reservas/types";

// Reuse the simple project filter schema
const querySchema = valorizacionQuerySchema;

export async function GET(request: NextRequest) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const { data: filters, error: qErr } = parseQuery(request, querySchema);
  if (qErr) return jsonError(400, qErr.error, qErr.details);

  const supabase = createAdminClient();

  // Build query — join with reservation_clients → reservations → rv_units to filter by project
  let query = supabase.from("rv_client_profiles").select("*");

  // If project filter is provided, we need a subquery approach
  let clientIds: string[] | null = null;
  if (filters.project) {
    // Get client IDs belonging to this project
    const { data: reservationClients, error: rcErr } = await supabase
      .from("reservation_clients")
      .select(`
        client_id,
        reservations!inner(
          rv_units!inner(
            floors!inner(
              towers!inner(
                projects!inner(slug)
              )
            )
          )
        )
      `)
      .eq("reservations.rv_units.floors.towers.projects.slug", filters.project);

    if (rcErr) return jsonError(500, rcErr.message);
    clientIds = (reservationClients ?? []).map((rc: Record<string, unknown>) => rc.client_id as string);
    if (clientIds.length === 0) {
      return jsonOk({
        total_profiles: 0,
        by_gender: [],
        by_purchase_type: [],
        by_education: [],
        by_department: [],
        by_occupation: [],
        by_marital_status: [],
        by_channel: [],
      } satisfies BuyerPersonaAggregate);
    }
    query = query.in("client_id", clientIds);
  }

  const { data: profiles, error } = await query;
  if (error) return jsonError(500, error.message);

  const total = profiles?.length ?? 0;

  function distribution(field: string): DistributionItem[] {
    const counts: Record<string, number> = {};
    for (const p of profiles ?? []) {
      const val = (p as Record<string, unknown>)[field];
      const label = val != null ? String(val) : "Sin dato";
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, count]) => ({
        label,
        count,
        pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  const result: BuyerPersonaAggregate = {
    total_profiles: total,
    by_gender: distribution("gender"),
    by_purchase_type: distribution("purchase_type"),
    by_education: distribution("education_level"),
    by_department: distribution("department"),
    by_occupation: distribution("occupation_type"),
    by_marital_status: distribution("marital_status"),
    by_channel: distribution("acquisition_channel"),
  };

  return jsonOk(result);
}
