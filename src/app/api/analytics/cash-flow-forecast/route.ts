import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import { getFFExclusions } from "@/lib/ff-filter";

const querySchema = z.object({
  project_id: z.string().uuid().optional(),
  exclude_ff: z.enum(["1"]).optional()
});

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) return jsonError(500, configError);

  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) return auth.response;

  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, querySchema);
  if (error) return jsonError(400, error.error, error.details);

  const excludingFF = query?.exclude_ff === "1";

  try {
    // Pre-fetch F&F exclusion data when needed
    let ffSaleIds = new Set<string>();
    let ffUnitKeys = new Set<string>();
    if (excludingFF) {
      ({ saleIds: ffSaleIds, unitKeys: ffUnitKeys } = await getFFExclusions(
        supabase,
        query?.project_id
      ));
    }

    // Resolve project_id → project name (the view uses project_name, not id)
    let projectName: string | null = null;
    if (query?.project_id) {
      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .eq("id", query.project_id)
        .single();
      projectName = proj?.name ?? null;
    }

    // 1. Forecast / expected data
    const forecastByMonth = new Map<string, { expected: number; forecasted: number }>();

    if (excludingFF) {
      // Bypass the VIEW — query expected_payments directly so we can exclude F&F units
      let epBuilder = supabase
        .from("expected_payments")
        .select("project_id, unit_number, due_date, amount")
        .gte("due_date", new Date().toISOString().slice(0, 10));

      if (query?.project_id) {
        epBuilder = epBuilder.eq("project_id", query.project_id);
      }

      const { data: epRows, error: epErr } = await epBuilder;
      if (epErr) return jsonError(500, "Database error", epErr.message);

      for (const row of (epRows ?? []) as Array<{
        project_id: string;
        unit_number: string;
        due_date: string;
        amount: number | null;
      }>) {
        const unitKey = `${row.project_id}:${row.unit_number}`;
        if (ffUnitKeys.has(unitKey)) continue;

        const key = row.due_date.slice(0, 7);
        const entry = forecastByMonth.get(key) ?? { expected: 0, forecasted: 0 };
        const amt = Number(row.amount ?? 0);
        entry.expected += amt;
        entry.forecasted += amt; // no historical compliance adjustment when filtering
        forecastByMonth.set(key, entry);
      }
    } else {
      // Normal path — use the cash_flow_forecast VIEW
      let forecastBuilder = supabase
        .from("cash_flow_forecast")
        .select("month, expected_amount, forecasted_amount, project_name")
        .order("month", { ascending: true });

      if (projectName) {
        forecastBuilder = forecastBuilder.eq("project_name", projectName);
      }

      const { data: forecastRows, error: forecastErr } = await forecastBuilder;
      if (forecastErr) return jsonError(500, "Database error", forecastErr.message);

      for (const row of (forecastRows ?? []) as Array<{
        month: string | null;
        expected_amount: number | null;
        forecasted_amount: number | null;
      }>) {
        if (!row.month) continue;
        const key = new Date(row.month).toISOString().slice(0, 7);
        const entry = forecastByMonth.get(key) ?? { expected: 0, forecasted: 0 };
        entry.expected += Number(row.expected_amount ?? 0);
        entry.forecasted += Number(row.forecasted_amount ?? 0);
        forecastByMonth.set(key, entry);
      }
    }

    // 2. Actual payments by month
    type PaymentRow = { payment_date: string; amount: number; sale_id?: string };
    let paymentRows: PaymentRow[] = [];

    if (query?.project_id) {
      const selectCols = excludingFF
        ? "payment_date, amount, sale_id, sales!inner(project_id)"
        : "payment_date, amount, sales!inner(project_id)";
      const { data, error: payErr } = await supabase
        .from("payments")
        .select(selectCols)
        .eq("sales.project_id", query.project_id)
        .order("payment_date", { ascending: true });
      if (payErr) return jsonError(500, "Database error", payErr.message);
      paymentRows = (data ?? []) as unknown as PaymentRow[];
    } else {
      const selectCols = excludingFF ? "payment_date, amount, sale_id" : "payment_date, amount";
      const { data, error: payErr } = await supabase
        .from("payments")
        .select(selectCols)
        .order("payment_date", { ascending: true });
      if (payErr) return jsonError(500, "Database error", payErr.message);
      paymentRows = (data ?? []) as unknown as PaymentRow[];
    }

    // Post-filter F&F payments
    if (excludingFF && ffSaleIds.size > 0) {
      paymentRows = paymentRows.filter((r) => !r.sale_id || !ffSaleIds.has(r.sale_id));
    }

    // Aggregate payments by month
    const actualByMonth = new Map<string, number>();
    for (const row of paymentRows) {
      const key = row.payment_date.slice(0, 7);
      actualByMonth.set(key, (actualByMonth.get(key) ?? 0) + Number(row.amount ?? 0));
    }

    // Merge into monthly timeline
    const allMonths = [
      ...new Set([...forecastByMonth.keys(), ...actualByMonth.keys()])
    ].sort();

    const monthly = allMonths.map((month) => ({
      month,
      expected: Math.round(forecastByMonth.get(month)?.expected ?? 0),
      forecasted: Math.round(forecastByMonth.get(month)?.forecasted ?? 0),
      actual: Math.round(actualByMonth.get(month) ?? 0)
    }));

    const summary = monthly.reduce(
      (acc, m) => {
        acc.totalExpected += m.expected;
        acc.totalForecasted += m.forecasted;
        acc.totalActual += m.actual;
        return acc;
      },
      { totalExpected: 0, totalForecasted: 0, totalActual: 0 }
    );

    return jsonOk({ monthly, summary });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
