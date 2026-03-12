import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { createPriceHistorySchema } from "@/lib/reservas/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { data: body, error: bErr } = await parseJson(
    request,
    createPriceHistorySchema.partial(),
  );
  if (bErr) return jsonError(400, bErr.error, bErr.details);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rv_price_history")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError(500, error.message);
  return jsonOk(data);
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("rv_price_history").delete().eq("id", id);
  if (error) return jsonError(500, error.message);
  return jsonOk({ deleted: true });
}
