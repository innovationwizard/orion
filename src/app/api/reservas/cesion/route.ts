import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_cesion_derechos")
    .select("*")
    .order("unit_number", { ascending: true });

  if (error) return jsonError(500, error.message);
  return jsonOk(data ?? []);
}
