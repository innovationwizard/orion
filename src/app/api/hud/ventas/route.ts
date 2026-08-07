import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import { fetchAll } from "@/lib/fetch-all";
import valesSnapshot from "@/lib/ventas/vales-snapshot.json";

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
  /** Promotional vouchers (vales) from the Pipedrive deals export — snapshot, served behind auth (client PII) */
  vales: {
    exportedAt: string;
    scope: string;
    dealCount: number;
    totalVales: number;
    rows: Array<{
      cliente: string;
      apartamento: string;
      valorTrato: number;
      vale: number;
      promoLabel: string;
      embudo: string;
      propietario: string;
      estado: string;
      creado: string;
      cierrePrevista: string;
      flag?: string;
    }>;
  };
  /** Monthly targets vs production. Counting rule (Jorge 2026-08-07): CONFIRMED + DESISTED by deposit_date month. */
  objetivos: {
    month: string;
    proyectos: Array<{
      project: string;
      metaPorAsesor: number;
      asesoresActivos: number;
      metaTotal: number;
      ventas: number;
      delta: number;
      entrega: string | null;
    }>;
    asesores: Array<{
      asesor: string;
      project: string;
      meta: number;
      ventas: number;
      delta: number;
      sinAsignacion: boolean;
    }>;
  };
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

  // 5. Objetivos — monthly targets (projects.meta_mensual_por_asesor × active assignments) vs production.
  // Month boundaries in Guatemala time (UTC-6, no DST). Counting rule: CONFIRMED + DESISTED by deposit_date.
  const nowGt = new Date(Date.now() - 6 * 3600 * 1000);
  const gtYear = nowGt.getUTCFullYear();
  const gtMonth = nowGt.getUTCMonth();
  const monthStart = `${gtYear}-${String(gtMonth + 1).padStart(2, "0")}-01`;
  const nextStart = `${gtMonth === 11 ? gtYear + 1 : gtYear}-${String((gtMonth === 11 ? 0 : gtMonth + 1) + 1).padStart(2, "0")}-01`;

  const { data: projectMetaRows, error: projectMetaError } = await supabase
    .from("projects")
    .select("id, name, meta_mensual_por_asesor");
  if (projectMetaError) {
    return jsonError(500, "Error consultando metas de proyectos", projectMetaError.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested embeds are loosely typed
  const assignmentResult = await fetchAll<any>((from, to) =>
    supabase
      .from("salesperson_project_assignments")
      .select("salesperson_id, project_id, salespeople(name)")
      .is("end_date", null)
      .range(from, to),
  );
  if (assignmentResult.error) {
    return jsonError(500, "Error consultando asignaciones de asesores", assignmentResult.error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested embeds are loosely typed
  const monthResResult = await fetchAll<any>((from, to) =>
    supabase
      .from("reservations")
      .select("salesperson_id, salespeople(name), rv_units(floors(towers(project_id)))")
      .in("status", ["CONFIRMED", "DESISTED"])
      .gte("deposit_date", monthStart)
      .lt("deposit_date", nextStart)
      .range(from, to),
  );
  if (monthResResult.error) {
    return jsonError(500, "Error consultando ventas del mes", monthResResult.error);
  }

  const { data: towerRows, error: towersError } = await supabase
    .from("towers")
    .select("project_id, delivery_date");
  if (towersError) {
    return jsonError(500, "Error consultando fechas de entrega", towersError.message);
  }
  const entregaByProject = new Map<string, string>();
  for (const t of towerRows ?? []) {
    if (!t.delivery_date) continue;
    const current = entregaByProject.get(t.project_id);
    if (!current || t.delivery_date < current) entregaByProject.set(t.project_id, t.delivery_date);
  }

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

  const ventasByProject = new Map<string, number>();
  const ventasByAsesorProject = new Map<string, { asesor: string; salespersonId: string; projectId: string; ventas: number }>();
  for (const r of monthResResult.rows) {
    const unit = one(r.rv_units);
    const floor = unit ? one(unit.floors) : null;
    const tower = floor ? one(floor.towers) : null;
    const projectId = tower?.project_id as string | undefined;
    if (!projectId) continue;
    ventasByProject.set(projectId, (ventasByProject.get(projectId) ?? 0) + 1);
    const asesor = (one(r.salespeople)?.name as string | undefined) ?? "Sin asesor";
    const key = `${r.salesperson_id}|${projectId}`;
    const entry = ventasByAsesorProject.get(key) ?? {
      asesor,
      salespersonId: r.salesperson_id as string,
      projectId,
      ventas: 0,
    };
    entry.ventas += 1;
    ventasByAsesorProject.set(key, entry);
  }

  const projectName = new Map((projectMetaRows ?? []).map((p) => [p.id as string, p.name as string]));
  const metaByProject = new Map((projectMetaRows ?? []).map((p) => [p.id as string, (p.meta_mensual_por_asesor as number) ?? 0]));

  const assignmentsByProject = new Map<string, number>();
  const assignedKeys = new Set<string>();
  const asesores: HudVentasPayload["objetivos"]["asesores"] = [];
  for (const a of assignmentResult.rows) {
    const projectId = a.project_id as string;
    assignmentsByProject.set(projectId, (assignmentsByProject.get(projectId) ?? 0) + 1);
    const key = `${a.salesperson_id}|${projectId}`;
    assignedKeys.add(key);
    const meta = metaByProject.get(projectId) ?? 0;
    const ventas = ventasByAsesorProject.get(key)?.ventas ?? 0;
    asesores.push({
      asesor: (one(a.salespeople)?.name as string | undefined) ?? "—",
      project: projectName.get(projectId) ?? "—",
      meta,
      ventas,
      delta: ventas - meta,
      sinAsignacion: false,
    });
  }
  // Production by asesores without an active assignment — shown, never dropped
  for (const [key, entry] of ventasByAsesorProject) {
    if (assignedKeys.has(key)) continue;
    const meta = metaByProject.get(entry.projectId) ?? 0;
    asesores.push({
      asesor: entry.asesor,
      project: projectName.get(entry.projectId) ?? "—",
      meta,
      ventas: entry.ventas,
      delta: entry.ventas - meta,
      sinAsignacion: true,
    });
  }
  asesores.sort((a, b) => a.project.localeCompare(b.project) || b.ventas - a.ventas);

  const proyectos = (projectMetaRows ?? [])
    .map((p) => {
      const metaPorAsesor = (p.meta_mensual_por_asesor as number) ?? 0;
      const asesoresActivos = assignmentsByProject.get(p.id) ?? 0;
      const metaTotal = metaPorAsesor * asesoresActivos;
      const ventas = ventasByProject.get(p.id) ?? 0;
      return {
        project: p.name as string,
        metaPorAsesor,
        asesoresActivos,
        metaTotal,
        ventas,
        delta: ventas - metaTotal,
        entrega: entregaByProject.get(p.id) ?? null,
      };
    })
    .sort((a, b) => a.project.localeCompare(b.project));

  const payload: HudVentasPayload = {
    canales,
    modelos,
    reembolsos: {
      desistedReservations: desistidos.length,
      cancelledSales: cancelledCount ?? 0,
      porMoneda,
    },
    desistidos,
    vales: {
      exportedAt: valesSnapshot.exportedAt,
      scope: valesSnapshot.scope,
      dealCount: valesSnapshot.dealCount,
      totalVales: valesSnapshot.totalVales,
      rows: valesSnapshot.rows,
    },
    objetivos: {
      month: monthStart.slice(0, 7),
      proyectos,
      asesores,
    },
  };
  return jsonOk(payload);
}
