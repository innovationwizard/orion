import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseJson, parseQuery, paymentTypeValues, assertExists } from "@/lib/api";
import type { Commission, Payment, PaymentType } from "@/lib/types";

const paymentQuerySchema = z.object({
  sale_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  payment_type: z.enum(paymentTypeValues).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

const createPaymentSchema = z.object({
  sale_id: z.string().uuid(),
  payment_date: z.string(),
  amount: z.number().positive(),
  payment_type: z.enum(paymentTypeValues),
  payment_method: z.string().optional(),
  notes: z.string().optional()
});

type PaymentWithContext = Payment & {
  unit_number: string | null;
  client_name: string | null;
};

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, paymentQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    let builder = supabase
      .from("payments")
      .select(
        "*, sales ( id, unit_id, client_id, project_id, units ( unit_number ), clients ( full_name ) )",
        { count: "exact" }
      );

    if (query?.sale_id) {
      builder = builder.eq("sale_id", query.sale_id);
    }
    if (query?.project_id) {
      builder = builder.eq("sales.project_id", query.project_id);
    }
    if (query?.payment_type) {
      builder = builder.eq("payment_type", query.payment_type);
    }
    if (query?.start_date) {
      builder = builder.gte("payment_date", query.start_date);
    }
    if (query?.end_date) {
      builder = builder.lte("payment_date", query.end_date);
    }

    const { data, error: dbError, count } = await builder.order("payment_date", {
      ascending: false
    });

    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }

    const mapped = (data ?? []).map((payment) => {
      const sale = payment.sales;
      const unit = sale?.units;
      const client = sale?.clients;
      const unitNumber = unit?.unit_number ?? null;
      const clientName = client?.full_name ?? null;

      const typedPayment = payment as Payment;
      return {
        ...typedPayment,
        unit_number: unitNumber,
        client_name: clientName
      } satisfies PaymentWithContext;
    });

    return jsonOk({ data: mapped, count: count ?? 0 });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}

export async function POST(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const supabase = getSupabaseServerClient();
  const { data: payload, error } = await parseJson(request, createPaymentSchema);
  if (error || !payload) {
    return jsonError(400, error?.error ?? "Invalid input", error?.details);
  }

  const { error: saleError } = await assertExists(
    "sales",
    payload.sale_id,
    "Sale not found"
  );
  if (saleError) {
    return jsonError(saleError.error === "Sale not found" ? 404 : 500, saleError.error, saleError.details);
  }

  try {
    const { data: inserted, error: insertError } = await supabase
      .from("payments")
      .insert({
        sale_id: payload.sale_id,
        payment_date: payload.payment_date,
        amount: payload.amount,
        payment_type: payload.payment_type as PaymentType,
        payment_method: payload.payment_method ?? null,
        notes: payload.notes ?? null
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      return jsonError(500, "Database error", insertError?.message);
    }

    const { data: commissions, error: commissionError } = await supabase
      .from("commissions")
      .select("*")
      .eq("payment_id", inserted.id);

    if (commissionError) {
      return jsonError(500, "Database error", commissionError.message);
    }

    return jsonOk({ data: inserted as Payment, commissions: (commissions ?? []) as Commission[] }, { status: 201 });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
