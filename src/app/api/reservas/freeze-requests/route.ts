import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { submitFreezeSchema } from "@/lib/reservas/validations";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { data: input, error: pErr } = await parseJson(request, submitFreezeSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("submit_freeze", {
    p_unit_id: input.unit_id,
    p_salesperson_id: input.salesperson_id,
    p_reason: input.reason,
    p_vip_name: input.vip_name,
  });

  if (error) {
    console.error("[POST /api/reservas/freeze-requests]", error);

    if (error.message.includes("Only available")) {
      return jsonError(409, "Solo se pueden congelar unidades disponibles.");
    }

    return jsonError(500, error.message);
  }

  return jsonOk({ freeze_id: data, status: "ACTIVE" }, { status: 201 });
}
