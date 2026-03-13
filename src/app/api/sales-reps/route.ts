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
      .from("salespeople")
      .select("id, full_name, display_name")
      .order("full_name", { ascending: true });

    if (error) {
      return jsonError(500, "Database error", error.message);
    }

    const mapped: SalesRep[] = (data ?? []).map((sp) => ({
      id: sp.id,
      name: sp.full_name,
      display_name: sp.display_name,
    }));

    return jsonOk({ data: mapped });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
