import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import type { CommissionRate } from "@/lib/types";

const commissionRatesQuerySchema = z.object({
  recipient_type: z.string().optional(),
  active: z.string().optional()
});

export async function GET(request: Request) {
  const { data: query, error } = parseQuery(request, commissionRatesQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    let builder = supabase.from("commission_rates").select("*");

    if (query?.recipient_type) {
      builder = builder.eq("recipient_type", query.recipient_type);
    }
    if (query?.active) {
      builder = builder.eq("active", query.active === "true");
    }

    const { data, error: dbError } = await builder.order("created_at", { ascending: false });

    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }

    return jsonOk({ data: (data ?? []) as CommissionRate[] });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}
