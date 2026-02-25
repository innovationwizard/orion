import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

const querySchema = z.object({
  project_id: z.string().uuid().optional()
});

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) return jsonError(500, configError);

  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, querySchema);
  if (error) return jsonError(400, error.error, error.details);

  try {
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

    // 1. Forecast data from the cash_flow_forecast view
    let forecastBuilder = supabase
      .from("cash_flow_forecast")
      .select("month, expected_amount, forecasted_amount, project_name")
      .order("month", { ascending: true });

    if (projectName) {
      forecastBuilder = forecastBuilder.eq("project_name", projectName);
    }

    const { data: forecastRows, error: forecastErr } = await forecastBuilder;
    if (forecastErr) return jsonError(500, "Database error", forecastErr.message);

    // 2. Actual payments by month
    let paymentRows: Array<{ payment_date: string; amount: number }> | null = null;

    if (query?.project_id) {
      const { data, error: payErr } = await supabase
        .from("payments")
        .select("payment_date, amount, sales!inner(project_id)")
        .eq("sales.project_id", query.project_id)
        .order("payment_date", { ascending: true });
      if (payErr) return jsonError(500, "Database error", payErr.message);
      paymentRows = (data ?? []) as unknown as Array<{ payment_date: string; amount: number }>;
    } else {
      const { data, error: payErr } = await supabase
        .from("payments")
        .select("payment_date, amount")
        .order("payment_date", { ascending: true });
      if (payErr) return jsonError(500, "Database error", payErr.message);
      paymentRows = (data ?? []) as Array<{ payment_date: string; amount: number }>;
    }

    // Aggregate forecast by month
    const forecastByMonth = new Map<string, { expected: number; forecasted: number }>();
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
