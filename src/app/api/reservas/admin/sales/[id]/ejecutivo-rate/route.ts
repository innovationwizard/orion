import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, parseJson } from "@/lib/api";
import { ejecutivoRateSchema } from "@/lib/reservas/validations";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * PATCH /api/reservas/admin/sales/[id]/ejecutivo-rate
 *
 * Master or financiero: confirms the ejecutivo rate on a sale.
 * Sets ejecutivo_rate, marks confirmed, then recalculates commissions
 * for all payments of this sale.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(["master", "financiero"]);
  if (auth.response) return auth.response;

  const { id: saleId } = await params;

  const { data: input, error: pErr } = await parseJson(request, ejecutivoRateSchema);
  if (pErr) return jsonError(400, pErr.error, pErr.details);

  const supabase = createAdminClient();

  // 1) Update the sale with the confirmed rate
  const { data: sale, error: updateErr } = await supabase
    .from("sales")
    .update({
      ejecutivo_rate: input.ejecutivo_rate,
      ejecutivo_rate_confirmed: true,
      ejecutivo_rate_confirmed_at: new Date().toISOString(),
      ejecutivo_rate_confirmed_by: auth.user!.id,
    })
    .eq("id", saleId)
    .select("id, ejecutivo_rate, ejecutivo_rate_confirmed")
    .single();

  if (updateErr) {
    console.error("[PATCH ejecutivo-rate] update failed:", updateErr);
    return jsonError(500, updateErr.message);
  }

  if (!sale) {
    return jsonError(404, "Venta no encontrada");
  }

  // 2) Recalculate commissions for all payments of this sale
  const { data: payments, error: payErr } = await supabase
    .from("payments")
    .select("id")
    .eq("sale_id", saleId);

  if (payErr) {
    console.error("[PATCH ejecutivo-rate] payments query failed:", payErr);
    return jsonError(500, payErr.message);
  }

  const recalcErrors: string[] = [];
  for (const payment of payments ?? []) {
    const { error: rpcErr } = await supabase.rpc("calculate_commissions", {
      p_payment_id: payment.id,
    });
    if (rpcErr) {
      console.error(`[PATCH ejecutivo-rate] recalc failed for payment ${payment.id}:`, rpcErr);
      recalcErrors.push(payment.id);
    }
  }

  await logAudit(auth.user!, {
    eventType: "rate.confirmed",
    resourceType: "sale",
    resourceId: saleId,
    details: {
      ejecutivo_rate: input.ejecutivo_rate,
      payments_recalculated: (payments?.length ?? 0) - recalcErrors.length,
    },
    request,
  });

  return jsonOk({
    sale_id: sale.id,
    ejecutivo_rate: sale.ejecutivo_rate,
    ejecutivo_rate_confirmed: sale.ejecutivo_rate_confirmed,
    payments_recalculated: (payments?.length ?? 0) - recalcErrors.length,
    recalc_errors: recalcErrors.length > 0 ? recalcErrors : undefined,
  });
}
