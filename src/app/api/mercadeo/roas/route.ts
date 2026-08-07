import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import { fetchAll } from "@/lib/fetch-all";
import leadsSnapshot from "@/lib/mercadeo/leads-snapshot.json";
import spendSnapshot from "@/lib/mercadeo/spend-snapshot.json";

/** Fixed FX rate approved by Jorge (2026-08-07). The quetzal has hovered at ~7.7–7.8/USD for years. */
const GTQ_PER_USD = 7.75;

/** Artifact ad-account name per project slug. "Puerta Abierta" is institutional (spend, no project revenue). */
const ACCOUNT_BY_SLUG: Record<string, string> = {
  benestare: "Benestare",
  "bosque-las-tapias": "Bosque Las Tapias",
  "boulevard-5": "Boulevard5",
  "casa-elisa": "Casa Elisa",
  "santa-elena": "Santa Elena",
};

/** Digital lead sources (normalized: lowercase, accents stripped). Free-text variants included. */
const DIGITAL_SOURCES = new Set([
  "facebook",
  "meta",
  "pagina web",
  "web",
  "formulario web",
  "wati",
  "inbox",
  "marketplace",
]);

function normalizeSource(s: string | null): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function isDigital(source: string | null): boolean {
  const n = normalizeSource(source);
  // "led" prefix also covers the "leds" typo present in the data
  return DIGITAL_SOURCES.has(n) || n.startsWith("led");
}

export type MercadeoRoasPayload = {
  period: { from: string; to: string };
  gtqPerUsd: number;
  digitalSources: string[];
  proyectos: Array<{
    project: string;
    spendNative: number;
    spendCurrency: string;
    spendGtq: number;
    revenueGtq: number | null;
    revenueAtribuidoGtq: number | null;
    ventas: number;
    ventasAtribuidas: number;
    roasAmplio: number | null;
    roasAtribuido: number | null;
    flag?: string;
  }>;
  global: {
    spendGtq: number;
    revenueGtq: number;
    revenueAtribuidoGtq: number;
    roasAmplio: number;
    roasAtribuido: number;
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

  const from = leadsSnapshot.epoch;
  const to = leadsSnapshot.refreshed;

  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, slug, currency");
  if (projectsError) {
    return jsonError(500, "Error consultando proyectos", projectsError.message);
  }
  const projects = projectRows ?? [];
  const projectById = new Map(projects.map((p) => [p.id as string, p]));

  // Digital-attributed unit keys from reservations (project_id|unit_number)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested embeds are loosely typed
  const resResult = await fetchAll<any>((f, t) =>
    supabase
      .from("reservations")
      .select("lead_source, rv_units(unit_number, floors(towers(project_id)))")
      .in("status", ["CONFIRMED", "DESISTED"])
      .range(f, t),
  );
  if (resResult.error) {
    return jsonError(500, "Error consultando fuentes de reservas", resResult.error);
  }
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  const digitalKeys = new Set<string>();
  for (const r of resResult.rows) {
    if (!isDigital(r.lead_source)) continue;
    const unit = one(r.rv_units);
    const floor = unit ? one(unit.floors) : null;
    const tower = floor ? one(floor.towers) : null;
    if (tower?.project_id && unit?.unit_number) {
      digitalKeys.add(`${tower.project_id}|${String(unit.unit_number).trim()}`);
    }
  }

  // Non-cancelled sales in the snapshot window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested embeds are loosely typed
  const salesResult = await fetchAll<any>((f, t) =>
    supabase
      .from("sales")
      .select("project_id, price_with_tax, units(unit_number)")
      .neq("status", "cancelled")
      .gte("sale_date", from)
      .lte("sale_date", to)
      .range(f, t),
  );
  if (salesResult.error) {
    return jsonError(500, "Error consultando ventas del período", salesResult.error);
  }

  const revenueByProject = new Map<string, { revenue: number; attributed: number; ventas: number; ventasAtribuidas: number }>();
  for (const s of salesResult.rows) {
    const projectId = s.project_id as string;
    const price = Number(s.price_with_tax ?? 0);
    const unitNumber = one(s.units)?.unit_number as string | undefined;
    const entry = revenueByProject.get(projectId) ?? { revenue: 0, attributed: 0, ventas: 0, ventasAtribuidas: 0 };
    entry.revenue += price;
    entry.ventas += 1;
    if (unitNumber && digitalKeys.has(`${projectId}|${String(unitNumber).trim()}`)) {
      entry.attributed += price;
      entry.ventasAtribuidas += 1;
    }
    revenueByProject.set(projectId, entry);
  }

  const toGtq = (amount: number, currency: string) => (currency === "USD" ? amount * GTQ_PER_USD : amount);
  const accounts = spendSnapshot.accounts as Record<string, { currency: string; spend: number }>;

  const proyectos: MercadeoRoasPayload["proyectos"] = [];
  let totalSpendGtq = 0;
  let totalRevenueGtq = 0;
  let totalAttributedGtq = 0;

  for (const p of projects) {
    const account = ACCOUNT_BY_SLUG[p.slug as string];
    if (!account || !accounts[account]) continue;
    const spend = accounts[account];
    const spendGtq = toGtq(spend.spend, spend.currency);
    totalSpendGtq += spendGtq;

    const rev = revenueByProject.get(p.id as string);
    const projectCurrency = (p.currency as string) ?? "GTQ";
    const hasSales = rev != null && rev.ventas > 0;
    const revenueGtq = hasSales ? toGtq(rev.revenue, projectCurrency) : null;
    const attributedGtq = hasSales ? toGtq(rev.attributed, projectCurrency) : null;
    if (revenueGtq != null) totalRevenueGtq += revenueGtq;
    if (attributedGtq != null) totalAttributedGtq += attributedGtq;

    proyectos.push({
      project: p.name as string,
      spendNative: spend.spend,
      spendCurrency: spend.currency,
      spendGtq,
      revenueGtq,
      revenueAtribuidoGtq: attributedGtq,
      ventas: rev?.ventas ?? 0,
      ventasAtribuidas: rev?.ventasAtribuidas ?? 0,
      roasAmplio: revenueGtq != null && spendGtq > 0 ? revenueGtq / spendGtq : null,
      roasAtribuido: attributedGtq != null && spendGtq > 0 ? attributedGtq / spendGtq : null,
      flag: hasSales ? undefined : "Sin registros de venta en la tabla sales para el período — ROAS no calculable.",
    });
  }
  proyectos.sort((a, b) => a.project.localeCompare(b.project));

  // Institutional account: real spend, no project revenue — counted in global spend
  const institutional = accounts["Puerta Abierta"];
  if (institutional) {
    const spendGtq = toGtq(institutional.spend, institutional.currency);
    totalSpendGtq += spendGtq;
    proyectos.push({
      project: "Puerta Abierta (institucional)",
      spendNative: institutional.spend,
      spendCurrency: institutional.currency,
      spendGtq,
      revenueGtq: null,
      revenueAtribuidoGtq: null,
      ventas: 0,
      ventasAtribuidas: 0,
      roasAmplio: null,
      roasAtribuido: null,
      flag: "Cuenta institucional de marca — gasto real sin revenue de proyecto; incluida en el total global.",
    });
  }

  const payload: MercadeoRoasPayload = {
    period: { from, to },
    gtqPerUsd: GTQ_PER_USD,
    digitalSources: [...DIGITAL_SOURCES, "lead*"],
    proyectos,
    global: {
      spendGtq: totalSpendGtq,
      revenueGtq: totalRevenueGtq,
      revenueAtribuidoGtq: totalAttributedGtq,
      roasAmplio: totalSpendGtq > 0 ? totalRevenueGtq / totalSpendGtq : 0,
      roasAtribuido: totalSpendGtq > 0 ? totalAttributedGtq / totalSpendGtq : 0,
    },
  };
  return jsonOk(payload);
}
