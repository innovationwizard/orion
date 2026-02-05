import { supabase } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import type { CommissionPhase } from "@/lib/types";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("commission_phases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(500, "Database error", error.message);
    }

    return jsonOk({ data: (data ?? []) as CommissionPhase[] });
  } catch (err) {
    return jsonError(500, "Database error", err);
  }
}
