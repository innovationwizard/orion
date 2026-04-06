/**
 * Public API — unit inventory with latest prices.
 *
 * GET /api/public/units
 *   ?project=bosque-las-tapias   (optional filter by project slug)
 *   &status=AVAILABLE            (optional filter by status)
 *
 * Returns: { units: [...], synced_at: "ISO timestamp" }
 */

import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300; // ISR: cache for 5 minutes

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectSlug = url.searchParams.get("project");
  const status = url.searchParams.get("status");

  const supabase = createAdminClient();

  // Build query
  let query = supabase
    .from("v_rv_units_full")
    .select("unit_number, unit_type, bedrooms, price_list, status, area_total, project_slug, project_name, tower_name")
    .order("project_slug")
    .order("unit_number");

  if (projectSlug) {
    query = query.eq("project_slug", projectSlug);
  }

  if (status) {
    query = query.eq("status", status.toUpperCase());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/public/units]", error);
    return jsonError(500, error.message);
  }

  // Last successful sync timestamp
  const { data: lastSync } = await supabase
    .from("sync_runs")
    .select("finished_at")
    .eq("status", "SUCCESS")
    .gt("files_processed", 0)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return jsonOk({
    units: data,
    synced_at: lastSync?.finished_at ?? null,
    count: data?.length ?? 0,
  });
}
