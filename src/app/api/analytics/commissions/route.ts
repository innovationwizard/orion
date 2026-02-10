import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

const analyticsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

type CommissionRow = {
  recipient_id: string | null;
  recipient_name: string | null;
  commission_amount: number;
  paid: boolean;
  created_at: string;
  paid_date: string | null;
  sales?: { project_id: string | null }[] | { project_id: string | null } | null;
};

type CommissionRateRow = {
  recipient_id: string;
  recipient_type: string | null;
};

type RecipientType = "management" | "sales_rep" | "special";

function normalizeRecipientType(value?: string | null): RecipientType {
  if (value === "management" || value === "sales_rep" || value === "special") {
    return value;
  }
  return "special";
}

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
  const { data: query, error } = parseQuery(request, analyticsQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    const { data: rateRows, error: rateError } = await supabase
      .from("commission_rates")
      .select("recipient_id, recipient_type");

    if (rateError) {
      return jsonError(500, "Database error", rateError.message);
    }

    const rateTypeMap = new Map<string, RecipientType>();
    (rateRows ?? []).forEach((row) => {
      const typed = row as CommissionRateRow;
      if (typed.recipient_id) {
        rateTypeMap.set(typed.recipient_id, normalizeRecipientType(typed.recipient_type));
      }
    });

    // All commission rows included unless date/project filters applied. No status or paid-only filter.
    // Fetch in pages to avoid PostgREST default limit (~1000 rows); we may have 30k+ commission rows.
    const pageSize = 1000;
    let offset = 0;
    const allRows: CommissionRow[] = [];

    while (true) {
      // Use sales!inner(project_id) when filtering by project so PostgREST allows eq("sales.project_id", ...)
      const selectWithSales =
        query?.project_id
          ? "recipient_id, recipient_name, commission_amount, paid, created_at, paid_date, sales!inner( project_id )"
          : "recipient_id, recipient_name, commission_amount, paid, created_at, paid_date, sales ( project_id )";

      let builder = supabase
        .from("commissions")
        .select(selectWithSales)
        .range(offset, offset + pageSize - 1);

      if (query?.start_date) {
        builder = builder.gte("created_at", query.start_date);
      }
      if (query?.end_date) {
        builder = builder.lte("created_at", query.end_date);
      }
      if (query?.project_id) {
        builder = builder.eq("sales.project_id", query.project_id);
      }

      const { data: page, error: dbError } = await builder;
      if (dbError) {
        return jsonError(500, "Database error", dbError.message);
      }
      const list = (page ?? []) as CommissionRow[];
      allRows.push(...list);
      if (list.length < pageSize) break;
      offset += pageSize;
    }
    const data = allRows;

    const grouped = new Map<
      string,
      {
        recipientId: string;
        recipientName: string;
        recipientType: RecipientType;
        totalAmount: number;
        paidAmount: number;
      }
    >();

    (data ?? []).forEach((row) => {
      const commission = row as CommissionRow;
      const rawRecipientId = commission.recipient_id?.trim();
      const recipientId = rawRecipientId && rawRecipientId.length ? rawRecipientId : "unassigned";
      const recipientName = commission.recipient_name?.trim() || "Beneficiario";
      const recipientType = rateTypeMap.get(recipientId) ?? "special";

      const current = grouped.get(recipientId) ?? {
        recipientId,
        recipientName,
        recipientType,
        totalAmount: 0,
        paidAmount: 0
      };
      current.totalAmount += commission.commission_amount ?? 0;
      if (commission.paid) {
        current.paidAmount += commission.commission_amount ?? 0;
      }
      grouped.set(recipientId, current);
    });

    const byRecipient = Array.from(grouped.values()).map((item) => {
      const unpaidAmount = Math.max(0, item.totalAmount - item.paidAmount);
      const percentPaid = item.totalAmount > 0 ? Math.round((item.paidAmount / item.totalAmount) * 100) : 0;
      return {
        recipientId: item.recipientId,
        recipientName: item.recipientName,
        recipientType: item.recipientType,
        totalAmount: item.totalAmount,
        paidAmount: item.paidAmount,
        unpaidAmount,
        percentPaid
      };
    });

    const summary = byRecipient.reduce(
      (acc, item) => {
        acc.total += item.totalAmount;
        acc.paid += item.paidAmount;
        acc.unpaid += item.unpaidAmount;
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0 }
    );

    return jsonOk({ byRecipient, summary });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}
