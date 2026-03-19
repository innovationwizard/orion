import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_cesion_derechos")
    .select("*")
    .order("unit_number", { ascending: true });

  if (error) return jsonError(500, error.message);
  return jsonOk(data ?? []);
}
