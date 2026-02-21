import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

const querySchema = z.object({
  project_id: z.string().uuid().optional(),
  delinquent_only: z.enum(["1", "0", "true", "false"]).optional()
});

type ComplianceRow = {
  project_id: string;
  project_name: string;
  unit_number: string;
  unit_id: string | null;
  sale_id: string | null;
  client_name: string | null;
  expected_installments: number;
  expected_total: number;
  expected_to_date: number;
  first_due_date: string;
  last_due_date: string;
  actual_installments: number;
  actual_total: number;
  first_payment_date: string | null;
  last_payment_date: string | null;
  compliance_pct: number | null;
  variance: number;
  compliance_status: string;
  days_delinquent: number | null;
};

type PaymentRow = {
  id: string;
  payment_date: string;
  payment_type: string;
  amount: number;
};

function getAgingBucket(days: number | null): keyof AgingBuckets {
  if (days == null || days <= 0) return "current";
  if (days <= 30) return "days1_30";
  if (days <= 60) return "days31_60";
  if (days <= 90) return "days61_90";
  return "days90Plus";
}

type AgingBuckets = {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90Plus: number;
};

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, querySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    let builder = supabase
      .from("payment_compliance")
      .select(
        "project_id, project_name, unit_number, unit_id, sale_id, client_name, expected_installments, expected_total, expected_to_date, first_due_date, last_due_date, actual_installments, actual_total, first_payment_date, last_payment_date, compliance_pct, variance, compliance_status, days_delinquent"
      );

    if (query?.project_id) {
      builder = builder.eq("project_id", query.project_id);
    }
    const delinquentOnly = query?.delinquent_only === "1" || query?.delinquent_only === "true";
    if (delinquentOnly) {
      builder = builder.gt("days_delinquent", 0);
    }

    const { data: rows, error: dbError } = await builder;
    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }

    const complianceRows = (rows ?? []) as ComplianceRow[];

    // Deduplicate by (project_id, unit_number) - take first (active sale)
    const seen = new Set<string>();
    const deduped = complianceRows.filter((r) => {
      const key = `${r.project_id}:${r.unit_number}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Fetch payments for all sale_ids
    const saleIds = [...new Set(deduped.map((r) => r.sale_id).filter(Boolean))] as string[];
    let paymentsBySale = new Map<string, PaymentRow[]>();
    if (saleIds.length > 0) {
      const { data: payments, error: payErr } = await supabase
        .from("payments")
        .select("id, payment_date, payment_type, amount, sale_id")
        .in("sale_id", saleIds)
        .order("payment_date", { ascending: true });
      if (!payErr && payments) {
        for (const p of payments as (PaymentRow & { sale_id: string })[]) {
          const list = paymentsBySale.get(p.sale_id) ?? [];
          list.push({
            id: p.id,
            payment_date: p.payment_date,
            payment_type: p.payment_type,
            amount: p.amount
          });
          paymentsBySale.set(p.sale_id, list);
        }
      }
    }

    // Build byProject and summary
    const projectsMap = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        units: Array<{
          unitId: string;
          unitNumber: string;
          clientName: string;
          expectedToDate: number;
          actualTotal: number;
          compliancePct: number | null;
          variance: number;
          complianceStatus: string;
          daysDelinquent: number | null;
          firstDueDate: string;
          lastDueDate: string;
          paymentHistory: Array<{ id: string; paymentDate: string; paymentType: string; amount: number }>;
        }>;
      }
    >();

    const aging: AgingBuckets = {
      current: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0
    };

    let totalExpectedToDate = 0;
    let totalActual = 0;
    let delinquentCount = 0;

    for (const r of deduped) {
      const bucket = getAgingBucket(r.days_delinquent);
      aging[bucket] += 1;
      if (r.days_delinquent != null && r.days_delinquent > 0) {
        delinquentCount += 1;
      }
      totalExpectedToDate += Number(r.expected_to_date);
      totalActual += Number(r.actual_total);

      const paymentHistory = (r.sale_id ? paymentsBySale.get(r.sale_id) ?? [] : []).map((p) => ({
        id: p.id,
        paymentDate: p.payment_date,
        paymentType: p.payment_type,
        amount: p.amount
      }));

      const unit = {
        unitId: r.unit_id ?? "",
        unitNumber: r.unit_number,
        clientName: r.client_name ?? "—",
        expectedToDate: Number(r.expected_to_date),
        actualTotal: Number(r.actual_total),
        compliancePct: r.compliance_pct != null ? Number(r.compliance_pct) : null,
        variance: Number(r.variance),
        complianceStatus: r.compliance_status,
        daysDelinquent: r.days_delinquent,
        firstDueDate: r.first_due_date,
        lastDueDate: r.last_due_date,
        paymentHistory
      };

      const entry = projectsMap.get(r.project_id) ?? {
        projectId: r.project_id,
        projectName: r.project_name,
        units: []
      };
      entry.units.push(unit);
      projectsMap.set(r.project_id, entry);
    }

    const byProject = Array.from(projectsMap.values()).map((p) => ({
      ...p,
      units: p.units.sort((a, b) =>
        (a.unitNumber ?? "").localeCompare(b.unitNumber ?? "", undefined, { numeric: true })
      )
    }));

    const compliancePct =
      totalExpectedToDate > 0 ? Math.round((totalActual / totalExpectedToDate) * 100) : 0;

    return jsonOk({
      byProject,
      summary: {
        totalUnits: deduped.length,
        compliantUnits: deduped.length - delinquentCount,
        delinquentUnits: delinquentCount,
        expectedToDate: totalExpectedToDate,
        actualTotal: totalActual,
        compliancePct,
        variance: totalActual - totalExpectedToDate,
        byAgingBucket: aging
      }
    });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
