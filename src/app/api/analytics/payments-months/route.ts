import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";

/**
 * GET /api/analytics/payments-months
 * Returns the distinct year-months in 2026 that have at least one payment record.
 * Used by the dashboard filter UI to enable/disable month shortcut buttons.
 * Response: { months: string[] } — array of "YYYY-MM" strings, sorted ascending.
 */
export async function GET() {
  const configError = getSupabaseConfigError();
  if (configError) return jsonError(500, configError);

  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) return auth.response;

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("payments")
    .select("payment_date")
    .gte("payment_date", "2026-01-01")
    .lt("payment_date", "2027-01-01")
    .not("payment_date", "is", null);

  if (error) return jsonError(500, "Database error", error.message);

  const monthSet = new Set<string>();
  for (const row of data ?? []) {
    const d = row.payment_date as string | null;
    if (d) monthSet.add(d.substring(0, 7));
  }

  return jsonOk({ months: Array.from(monthSet).sort() });
}
