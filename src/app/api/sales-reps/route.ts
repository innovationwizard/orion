import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import type { SalesRep } from "@/lib/types";

export async function GET() {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("sales_reps")
      .select("id, name, contract_start_date, contract_end_date")
      .order("name", { ascending: true });

    if (error) {
      return jsonError(500, "Database error", error.message);
    }

    return jsonOk({ data: (data ?? []) as SalesRep[] });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
