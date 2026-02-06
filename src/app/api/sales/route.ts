import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { assertExists, jsonError, jsonOk, parseJson, parseQuery, saleStatusValues } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import type { Sale } from "@/lib/types";

const salesQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  status: z.enum(saleStatusValues).optional(),
  sales_rep_id: z.string().optional(),
  distinct: z.string().optional()
});

const createSaleSchema = z.object({
  project_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  client_id: z.string().uuid(),
  sales_rep_id: z.string().min(1),
  sale_date: z.string(),
  price_with_tax: z.number().positive(),
  price_without_tax: z.number().positive(),
  down_payment_amount: z.number().nonnegative(),
  financed_amount: z.number().nonnegative(),
  referral_name: z.string().optional(),
  referral_applies: z.boolean(),
  promise_signed_date: z.string().optional(),
  deed_signed_date: z.string().optional()
});

type SaleWithContext = Sale & {
  project_name: string | null;
  unit_number: string | null;
  client_name: string | null;
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
  const { data: query, error } = parseQuery(request, salesQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    if (query?.distinct === "project") {
      const { data, error: dbError, count } = await supabase
        .from("projects")
        .select("id, name", { count: "exact" })
        .order("name", { ascending: true });

      if (dbError) {
        return jsonError(500, "Database error", dbError.message);
      }

      return jsonOk({ data: data ?? [], count: count ?? 0 });
    }

    let builder = supabase
      .from("sales")
      .select(
        "*, projects ( name ), units ( unit_number ), clients ( full_name )",
        { count: "exact" }
      );

    if (query?.project_id) {
      builder = builder.eq("project_id", query.project_id);
    }
    if (query?.client_id) {
      builder = builder.eq("client_id", query.client_id);
    }
    if (query?.status) {
      builder = builder.eq("status", query.status);
    }
    if (query?.sales_rep_id) {
      builder = builder.eq("sales_rep_id", query.sales_rep_id);
    }

    const { data, error: dbError, count } = await builder.order("sale_date", {
      ascending: false
    });

    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }

    const mapped = (data ?? []).map((sale) => {
      const projectName = sale.projects?.name ?? null;
      const unitRel = sale.units;
      const clientRel = sale.clients;
      const unitNumber = Array.isArray(unitRel)
        ? unitRel[0]?.unit_number ?? null
        : unitRel?.unit_number ?? null;
      const clientName = Array.isArray(clientRel)
        ? clientRel[0]?.full_name ?? null
        : clientRel?.full_name ?? null;

      const typedSale = sale as Sale;
      return {
        ...typedSale,
        project_name: projectName,
        unit_number: unitNumber,
        client_name: clientName
      } satisfies SaleWithContext;
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
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: payload, error } = await parseJson(request, createSaleSchema);
  if (error || !payload) {
    return jsonError(400, error?.error ?? "Invalid input", error?.details);
  }

  const { error: projectError } = await assertExists(
    "projects",
    payload.project_id,
    "Project not found"
  );
  if (projectError) {
    return jsonError(projectError.error === "Project not found" ? 404 : 500, projectError.error, projectError.details);
  }

  const { error: clientError } = await assertExists(
    "clients",
    payload.client_id,
    "Client not found"
  );
  if (clientError) {
    return jsonError(clientError.error === "Client not found" ? 404 : 500, clientError.error, clientError.details);
  }

  const { error: unitError } = await assertExists(
    "units",
    payload.unit_id,
    "Unit not found"
  );
  if (unitError) {
    return jsonError(unitError.error === "Unit not found" ? 404 : 500, unitError.error, unitError.details);
  }

  try {
    const { data: updatedUnit, error: unitUpdateError } = await supabase
      .from("units")
      .update({ status: "sold" })
      .eq("id", payload.unit_id)
      .eq("status", "available")
      .select("id")
      .maybeSingle();

    if (unitUpdateError) {
      return jsonError(500, "Database error", unitUpdateError.message);
    }

    if (!updatedUnit) {
      return jsonError(400, "Unit is not available for sale");
    }

    const { data: inserted, error: insertError } = await supabase
      .from("sales")
      .insert({
        project_id: payload.project_id,
        unit_id: payload.unit_id,
        client_id: payload.client_id,
        sales_rep_id: payload.sales_rep_id ?? null,
        sale_date: payload.sale_date,
        price_with_tax: payload.price_with_tax,
        price_without_tax: payload.price_without_tax,
        down_payment_amount: payload.down_payment_amount,
        financed_amount: payload.financed_amount,
        referral_name: payload.referral_name ?? null,
        referral_applies: payload.referral_applies,
        promise_signed_date: payload.promise_signed_date ?? null,
        deed_signed_date: payload.deed_signed_date ?? null
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      return jsonError(500, "Database error", insertError?.message);
    }

    return jsonOk({ data: inserted as Sale }, { status: 201 });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
