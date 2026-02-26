import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetch F&F (caso_especial) exclusion data.
 * Returns sale IDs and (project_id:unit_number) keys for filtering.
 */
export async function getFFExclusions(
  supabase: SupabaseClient,
  projectId?: string
): Promise<{ saleIds: Set<string>; unitKeys: Set<string> }> {
  let builder = supabase
    .from("sales")
    .select("id, unit_id, units(project_id, unit_number)")
    .eq("caso_especial", true)
    .eq("status", "active");

  if (projectId) {
    builder = builder.eq("project_id", projectId);
  }

  const { data } = await builder;

  const saleIds = new Set<string>();
  const unitKeys = new Set<string>();

  for (const row of (data ?? []) as unknown as Array<{
    id: string;
    unit_id: string;
    units: { project_id: string; unit_number: string } | null;
  }>) {
    saleIds.add(row.id);
    if (row.units) {
      unitKeys.add(`${row.units.project_id}:${row.units.unit_number}`);
    }
  }

  return { saleIds, unitKeys };
}
