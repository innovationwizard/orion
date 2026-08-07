import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import leadsSnapshot from "@/lib/mercadeo/leads-snapshot.json";

export type MercadeoFunnelPayload = {
  period: { from: string; to: string };
  /** Meta Ads leads (net of the campaign the artifact's audit excludes as mis-mapped) */
  leads: number;
  /** CONFIRMED + DESISTED reservations by deposit_date within the period */
  reservas: number;
  /** Sales with promise_signed_date within the period */
  pcvFirmadas: number;
  tasaLeadReserva: number;
  tasaReservaPcv: number;
};

export async function GET() {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();

  const from = leadsSnapshot.epoch;
  const to = leadsSnapshot.refreshed;

  const { count: reservas, error: reservasError } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .in("status", ["CONFIRMED", "DESISTED"])
    .gte("deposit_date", from)
    .lte("deposit_date", to);
  if (reservasError) {
    return jsonError(500, "Error consultando reservas del período", reservasError.message);
  }

  const { count: pcvFirmadas, error: pcvError } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .not("promise_signed_date", "is", null)
    .gte("promise_signed_date", from)
    .lte("promise_signed_date", to);
  if (pcvError) {
    return jsonError(500, "Error consultando PCV firmadas del período", pcvError.message);
  }

  const leads = leadsSnapshot.leadsNet;
  const r = reservas ?? 0;
  const p = pcvFirmadas ?? 0;

  const payload: MercadeoFunnelPayload = {
    period: { from, to },
    leads,
    reservas: r,
    pcvFirmadas: p,
    tasaLeadReserva: leads > 0 ? (r / leads) * 100 : 0,
    tasaReservaPcv: r > 0 ? (p / r) * 100 : 0,
  };
  return jsonOk(payload);
}
