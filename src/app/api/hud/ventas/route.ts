import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";

export type HudVentasPayload = {
  /** CONFIRMED reservations grouped by lead_source */
  canales: Array<{ canal: string; count: number }>;
  /** RESERVED + SOLD units grouped by project + unit_type */
  modelos: Array<{ project: string; modelo: string; count: number }>;
  /** Refund/retention aggregates over cancelled sales, grouped by project currency (GTQ/USD never mixed) */
  reembolsos: {
    desistedReservations: number;
    cancelledSales: number;
    porMoneda: Array<{
      currency: string;
      totalPagado: number;
      totalReembolsado: number;
      retencion: number;
    }>;
  };
  /** DESISTED reservations traced to the unit's current state and list price */
  desistidos: Array<{
    unit: string;
    project: string;
    currency: string;
    fecha: string | null;
    motivo: string | null;
    estadoActual: string;
    precioLista: number | null;
  }>;
};

const PAGE_SIZE = 1000;

/**
 * Fetches every page of a query. Supabase caps responses at 1000 rows; without
 * this, result sets past the cap would be silently truncated.
 */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return { rows, error: null };
}

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

  // 1. Ventas por canales — CONFIRMED reservations by lead_source
  const canalResult = await fetchAll<{ lead_source: string | null }>((from, to) =>
    supabase.from("reservations").select("lead_source").eq("status", "CONFIRMED").range(from, to),
  );
  if (canalResult.error) {
    return jsonError(500, "Error consultando reservas por canal", canalResult.error);
  }
  const canalCounts = new Map<string, number>();
  for (const row of canalResult.rows) {
    const canal = row.lead_source?.trim() || "Sin canal registrado";
    canalCounts.set(canal, (canalCounts.get(canal) ?? 0) + 1);
  }
  const canales = [...canalCounts.entries()]
    .map(([canal, count]) => ({ canal, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Split de ventas por modelo — RESERVED + SOLD units by project + unit_type
  const modeloResult = await fetchAll<{ unit_type: string | null; project_name: string | null }>((from, to) =>
    supabase
      .from("v_rv_units_full")
      .select("unit_type, project_name, status")
      .in("status", ["RESERVED", "SOLD"])
      .range(from, to),
  );
  if (modeloResult.error) {
    return jsonError(500, "Error consultando split por modelo", modeloResult.error);
  }
  const modeloCounts = new Map<string, { project: string; modelo: string; count: number }>();
  for (const row of modeloResult.rows) {
    const project = row.project_name ?? "Sin proyecto";
    const modelo = row.unit_type ?? "Sin modelo";
    const key = `${project}|${modelo}`;
    const existing = modeloCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      modeloCounts.set(key, { project, modelo, count: 1 });
    }
  }
  const modelos = [...modeloCounts.values()].sort(
    (a, b) => a.project.localeCompare(b.project) || b.count - a.count,
  );

  // 3. Reembolsos y retención — payments on cancelled sales (inner join; no id-list URL limits)
  const { count: cancelledCount, error: cancelledCountError } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("status", "cancelled");
  if (cancelledCountError) {
    return jsonError(500, "Error consultando ventas canceladas", cancelledCountError.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested embeds are loosely typed
  const paymentsResult = await fetchAll<any>((from, to) =>
    supabase
      .from("payments")
      .select("amount, payment_type, sales!inner(status, projects(currency))")
      .eq("sales.status", "cancelled")
      .range(from, to),
  );
  if (paymentsResult.error) {
    return jsonError(500, "Error consultando pagos de ventas canceladas", paymentsResult.error);
  }
  const porMonedaMap = new Map<string, { totalPagado: number; totalReembolsado: number }>();
  for (const p of paymentsResult.rows) {
    const sale = Array.isArray(p.sales) ? p.sales[0] : p.sales;
    const project = sale ? (Array.isArray(sale.projects) ? sale.projects[0] : sale.projects) : null;
    const currency = (project?.currency as string | undefined) ?? "GTQ";
    const bucket = porMonedaMap.get(currency) ?? { totalPagado: 0, totalReembolsado: 0 };
    if (p.payment_type === "reimbursement") {
      bucket.totalReembolsado += Math.abs(p.amount ?? 0);
    } else {
      bucket.totalPagado += p.amount ?? 0;
    }
    porMonedaMap.set(currency, bucket);
  }
  const porMoneda = [...porMonedaMap.entries()]
    .map(([currency, t]) => ({
      currency,
      totalPagado: t.totalPagado,
      totalReembolsado: t.totalReembolsado,
      retencion: t.totalPagado - t.totalReembolsado,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));

  // 4. Trazabilidad de desistidos — DESISTED reservations → unit's current state + list price
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested embeds are loosely typed
  const desistResult = await fetchAll<any>((from, to) =>
    supabase
      .from("reservations")
      .select(
        "desistimiento_date, desistimiento_reason, rv_units(unit_number, status, price_list, floors(towers(projects(name, currency))))",
      )
      .eq("status", "DESISTED")
      .order("desistimiento_date", { ascending: false })
      .range(from, to),
  );
  if (desistResult.error) {
    return jsonError(500, "Error consultando desistimientos", desistResult.error);
  }
  const desistidos = desistResult.rows.map((row) => {
    const unit = Array.isArray(row.rv_units) ? row.rv_units[0] : row.rv_units;
    const floor = unit ? (Array.isArray(unit.floors) ? unit.floors[0] : unit.floors) : null;
    const tower = floor ? (Array.isArray(floor.towers) ? floor.towers[0] : floor.towers) : null;
    const project = tower ? (Array.isArray(tower.projects) ? tower.projects[0] : tower.projects) : null;
    return {
      unit: unit?.unit_number ?? "—",
      project: project?.name ?? "—",
      currency: project?.currency ?? "GTQ",
      fecha: row.desistimiento_date ?? null,
      motivo: row.desistimiento_reason ?? null,
      estadoActual: unit?.status ?? "—",
      precioLista: unit?.price_list ?? null,
    };
  });

  const payload: HudVentasPayload = {
    canales,
    modelos,
    reembolsos: {
      desistedReservations: desistidos.length,
      cancelledSales: cancelledCount ?? 0,
      porMoneda,
    },
    desistidos,
  };
  return jsonOk(payload);
}
