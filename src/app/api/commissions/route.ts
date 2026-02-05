import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import type { Commission } from "@/lib/types";

const commissionsQuerySchema = z.object({
  sale_id: z.string().uuid().optional(),
  recipient_id: z.string().optional(),
  paid: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

type CommissionWithContext = Commission & {
  payment_amount: number | null;
  payment_date: string | null;
  sale_date: string | null;
  unit_id: string | null;
  client_id: string | null;
};

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, commissionsQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    let builder = supabase
      .from("commissions")
      .select(
        "*, payments ( amount, payment_date ), sales ( sale_date, unit_id, client_id )",
        { count: "exact" }
      );

    if (query?.sale_id) {
      builder = builder.eq("sale_id", query.sale_id);
    }
    if (query?.recipient_id) {
      builder = builder.eq("recipient_id", query.recipient_id);
    }
    if (query?.paid) {
      builder = builder.eq("paid", query.paid === "true");
    }
    if (query?.start_date) {
      builder = builder.gte("created_at", query.start_date);
    }
    if (query?.end_date) {
      builder = builder.lte("created_at", query.end_date);
    }

    const { data, error: dbError, count } = await builder.order("created_at", {
      ascending: false
    });

    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }

    const mapped = (data ?? []).map((commission) => {
      const payment = commission.payments;
      const sale = commission.sales;

      const typed = commission as Commission;
      return {
        ...typed,
        payment_amount: payment?.amount ?? null,
        payment_date: payment?.payment_date ?? null,
        sale_date: sale?.sale_date ?? null,
        unit_id: sale?.unit_id ?? null,
        client_id: sale?.client_id ?? null
      } satisfies CommissionWithContext;
    });

    const totalAmount = mapped.reduce(
      (sum, item) => sum + (item.commission_amount ?? 0),
      0
    );

    return jsonOk({ data: mapped, total_amount: totalAmount, count: count ?? 0 });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}
