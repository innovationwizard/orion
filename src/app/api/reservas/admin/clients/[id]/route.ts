import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { updateClientSchema } from "@/lib/reservas/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const { data: body, error: bErr } = await parseJson(request, updateClientSchema);
  if (bErr) return jsonError(400, bErr.error, bErr.details);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rv_clients")
    .update(body)
    .eq("id", id)
    .select("id, full_name, phone, email, dpi")
    .single();

  if (error) {
    console.error("[PATCH /api/reservas/admin/clients/[id]]", error);
    return jsonError(500, error.message);
  }

  if (!data) {
    return jsonError(404, "Cliente no encontrado");
  }

  return jsonOk(data);
}
