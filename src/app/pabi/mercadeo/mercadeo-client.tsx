"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import SiteNav from "@/components/site-nav";
import KpiCard from "@/components/kpi-card";
import { useElementSize } from "@/hooks/use-element-size";
import SectionNav from "@/app/pabi/section-nav";
import { MERCADEO_SECTIONS } from "@/app/pabi/nav-links";
import TimeSeriesChart, { type TimeSeriesPoint } from "@/components/charts/time-series-chart";
import DonutChart from "@/components/creditos/donut-chart";
import panels from "@/lib/mercadeo/panels-snapshot.json";
import type { MercadeoRoasPayload } from "@/app/api/mercadeo/roas/route";
import type { LeadsMetasPayload } from "@/app/api/mercadeo/leads-metas/route";
import type { MercadeoFunnelPayload } from "@/app/api/mercadeo/funnel/route";

/* ------------------------------------------------------------------ */
/*  Snapshot shapes (panels-snapshot.json)                             */
/* ------------------------------------------------------------------ */

type AccountRow = {
  account: string;
  currency: string | null;
  alcance: number;
  impresiones: number;
  leads: number;
  clics: number;
  spendNative: number;
};
type DailyRow = { date: string; alcance: number; impresiones: number; leads: number; clics: number };
type MonthAccountRow = { month: string; account: string; currency: string | null; leads: number; spendNative: number };
type CampaignRow = {
  account: string;
  campaign: string;
  currency: string | null;
  impresiones: number;
  leads: number;
  clics: number;
  spendNative: number;
};
type BudgetRow = {
  fecha: string | null;
  mes: string | null;
  proyecto: string | null;
  concepto: string | null;
  proveedor: string | null;
  inversion: number | null;
};

const SNAP = panels as unknown as {
  epoch: string;
  refreshed: string;
  excludedCampaign: string | null;
  accounts: AccountRow[];
  daily: DailyRow[];
  monthAccount: MonthAccountRow[];
  campaigns: CampaignRow[];
  budget: BudgetRow[];
};

const nf = new Intl.NumberFormat("es-GT");
const q = (n: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(n);
const q2 = (n: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 2 }).format(n);
const pct1 = (n: number) => `${n.toFixed(1)}%`;

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

/**
 * Categorical hues for the pauta accounts, in fixed order — a project keeps its
 * colour wherever it appears, so the donut and the ranked bars agree. Validated
 * for lightness, chroma, colour-vision separation and contrast against the
 * light surface; the gold slot sits just under 3:1, which is why every mark
 * that uses it also carries a direct value label.
 */
const PROJECT_COLORS = ["#3B6FBF", "#C79030", "#00875A", "#8A63C4", "#D05A42", "#0E8FA8"];

/** Stable colour assignment: alphabetical account order, never re-ranked. */
const PROJECT_ORDER = SNAP.accounts.map((a) => a.account).sort((a, b) => a.localeCompare(b));
function projectColor(project: string): string {
  const i = PROJECT_ORDER.indexOf(project);
  return PROJECT_COLORS[(i < 0 ? 0 : i) % PROJECT_COLORS.length];
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/* ------------------------------------------------------------------ */
/*  Presentation primitives                                            */
/* ------------------------------------------------------------------ */

function SourceTag({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        live ? "bg-success/12 text-success" : "bg-primary/10 text-primary"
      }`}
    >
      {live ? "En vivo" : `Snapshot ${SNAP.refreshed}`}
    </span>
  );
}

/** One page of the master report. */
function ReportPage({ id, title, caption, children }: {
  id: string; title: string; caption?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="grid gap-4 scroll-mt-16">
      <div className="flex items-baseline gap-3 flex-wrap border-b border-border pb-2">
        <h2 className="text-lg font-bold text-text-primary m-0 uppercase tracking-wide">{title}</h2>
        {caption ? <span className="text-xs text-muted">{caption}</span> : null}
      </div>
      {children}
    </section>
  );
}

/** A card inside a report page: title on the left, scope note on the right. */
function Panel({ title, caption, children }: {
  title: string; caption?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-4 grid gap-3 content-start">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary m-0">{title}</h3>
        {caption ? (
          <span className="text-[10px] uppercase tracking-wider text-muted">{caption}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * The commercial funnel as connected steps: each stage carries its count, and
 * the gap before it carries the rate at which the previous stage converted into
 * it. Separate cards state the same numbers but hide the one thing the reader
 * is after — where the drop-off happens.
 */
function FunnelSteps({ stages }: {
  stages: Array<{ label: string; value: string; hint?: string; rate?: string }>;
}) {
  return (
    <ol className="flex flex-wrap items-stretch gap-2 list-none p-0 m-0">
      {stages.map((s, i) => (
        <Fragment key={s.label}>
          {i > 0 && (
            <li className="grid place-items-center px-1 shrink-0 text-muted">
              <span className="text-[11px] font-semibold whitespace-nowrap">{s.rate}</span>
              <span aria-hidden="true" className="text-lg leading-none">
                →
              </span>
            </li>
          )}
          <li className="flex-1 min-w-[170px] bg-card rounded-2xl border border-border shadow-card p-4 grid gap-1.5 content-start">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
              {s.label}
            </span>
            <strong className="text-[clamp(24px,3.4vw,34px)] leading-none text-text-primary">
              {s.value}
            </strong>
            {s.hint ? <span className="text-xs text-muted">{s.hint}</span> : null}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

/**
 * Horizontal magnitude bars, ranked. Every bar carries its value directly, so
 * the number never depends on reading the bar against an axis — and the palette
 * slot whose contrast sits under 3:1 stays legible.
 */
function RankedBars({ items, format }: {
  items: Array<{ label: string; value: number; color: string }>;
  format: (v: number) => string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 0);
  if (items.length === 0) return <p className="text-sm text-muted m-0">Sin datos.</p>;
  return (
    <ul className="grid gap-2 list-none p-0 m-0">
      {items.map((it) => (
        <li key={it.label} className="grid grid-cols-[minmax(80px,132px)_1fr_auto] items-center gap-3">
          <span className="text-xs text-muted truncate" title={it.label}>
            {it.label}
          </span>
          <div className="h-3 rounded bg-border/50 overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: max > 0 ? `${(it.value / max) * 100}%` : "0%", background: it.color }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-text-primary whitespace-nowrap">
            {format(it.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Vertical columns on a value axis — the weekday distribution. The days sit in
 * calendar order rather than ranked, and the spread between them is narrow, so
 * the reader needs gridlines and a scale to judge the differences; bare bars
 * with no axis make seven near-equal days look identical.
 */
function ColumnChart({ items, height = 260 }: {
  items: Array<{ label: string; value: number }>;
  height?: number;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);

  const margin = { top: 16, right: 8, bottom: 26, left: 48 };
  const chartW = Math.max(0, size.width - margin.left - margin.right);
  const chartH = Math.max(0, height - margin.top - margin.bottom);

  const x = useMemo(
    () =>
      scaleBand()
        .domain(items.map((i) => i.label))
        .range([0, chartW])
        .padding(0.26),
    [items, chartW],
  );
  const y = useMemo(
    () =>
      scaleLinear()
        .domain([0, items.reduce((m, i) => Math.max(m, i.value), 0) || 1])
        .range([chartH, 0])
        .nice(),
    [items, chartH],
  );

  if (!size.width) return <div ref={ref} style={{ width: "100%", height }} />;

  return (
    <div ref={ref} style={{ width: "100%", height }}>
      <svg width="100%" height={height} role="img" aria-label="Leads por día de semana">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {y.ticks(4).map((t) => (
            <g key={t}>
              <line
                x1={0}
                x2={chartW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-border, #e2e8f0)"
                strokeDasharray="3 3"
                strokeOpacity={0.7}
              />
              <text
                x={-8}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={10}
                fill="var(--color-muted, #64748b)"
              >
                {nf.format(t)}
              </text>
            </g>
          ))}
          {items.map((it) => {
            const bx = x(it.label) ?? 0;
            const by = y(it.value);
            const active = hover === it.label;
            return (
              <g key={it.label}>
                <rect
                  x={bx}
                  y={by}
                  width={x.bandwidth()}
                  height={Math.max(0, chartH - by)}
                  rx={4}
                  fill={PROJECT_COLORS[0]}
                  opacity={hover === null || active ? 1 : 0.5}
                  style={{ cursor: "pointer", transition: "opacity .15s" }}
                  onMouseEnter={() => setHover(it.label)}
                  onMouseLeave={() => setHover(null)}
                />
                {active && (
                  <text
                    x={bx + x.bandwidth() / 2}
                    y={by - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--color-text-primary, #0f172a)"
                  >
                    {nf.format(it.value)}
                  </text>
                )}
                <text
                  x={bx + x.bandwidth() / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={active ? 600 : 400}
                  fill={active ? "var(--color-text-primary, #0f172a)" : "var(--color-muted, #64748b)"}
                >
                  {it.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

const TH = "px-3 py-2 font-medium text-left";
const TH_R = "px-3 py-2 font-medium text-right";
const TD = "px-3 py-2 whitespace-nowrap";
const TD_R = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

/* ------------------------------------------------------------------ */

export default function MercadeoClient() {
  const [roas, setRoas] = useState<MercadeoRoasPayload | null>(null);
  const [metas, setMetas] = useState<LeadsMetasPayload | null>(null);
  const [funnel, setFunnel] = useState<MercadeoFunnelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const get = async <T,>(url: string): Promise<T | null> => {
      const r = await fetch(url);
      if (r.ok) return (await r.json()) as T;
      if (r.status === 401 || r.status === 403) return null;
      const body = (await r.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `HTTP ${r.status}`);
    };
    Promise.all([
      get<MercadeoRoasPayload>("/api/mercadeo/roas"),
      get<LeadsMetasPayload>("/api/mercadeo/leads-metas"),
      get<MercadeoFunnelPayload>("/api/mercadeo/funnel"),
    ])
      .then(([r, m, f]) => {
        if (cancelled) return;
        setRoas(r);
        setMetas(m);
        setFunnel(f);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSection(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* --------------------------------------------------------------
   * Currency. The snapshot keeps each account's spend in its own
   * currency because the Meta Ads column is mislabelled USD. The live
   * ROAS route already owns the conversion rate, so read it from there
   * rather than hardcoding a second copy of it.
   * ------------------------------------------------------------ */
  const gtqPerUsd = roas?.gtqPerUsd ?? null;
  const toGtq = useCallback(
    (amount: number, currency: string | null): number | null => {
      if (currency === "GTQ") return amount;
      if (currency === "USD") return gtqPerUsd == null ? null : amount * gtqPerUsd;
      return null;
    },
    [gtqPerUsd],
  );

  /** Leads excluding the known mis-mapped campaign, matching leads-snapshot's netting. */
  const netCampaigns = useMemo(
    () => SNAP.campaigns.filter((c) => c.campaign !== SNAP.excludedCampaign),
    [],
  );

  /** Net leads per account — the raw `accounts` rows carry gross leads. */
  const netLeadsByAccount = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of netCampaigns) m.set(c.account, (m.get(c.account) ?? 0) + c.leads);
    return m;
  }, [netCampaigns]);

  const totals = useMemo(() => {
    let spendGtq = 0;
    let spendKnown = true;
    for (const a of SNAP.accounts) {
      const g = toGtq(a.spendNative, a.currency);
      if (g == null) spendKnown = false;
      else spendGtq += g;
    }
    const alcance = SNAP.accounts.reduce((s, a) => s + a.alcance, 0);
    const impresiones = SNAP.accounts.reduce((s, a) => s + a.impresiones, 0);
    const leadsNet = netCampaigns.reduce((s, c) => s + c.leads, 0);
    return {
      spendGtq: spendKnown ? spendGtq : null,
      alcance,
      impresiones,
      leadsNet,
      cpl: spendKnown && leadsNet > 0 ? spendGtq / leadsNet : null,
    };
  }, [toGtq, netCampaigns]);

  /** Per-project pauta detail — the report's "Detalle de pauta" table. */
  const byProject = useMemo(
    () =>
      SNAP.accounts
        .map((a) => {
          const leads = netLeadsByAccount.get(a.account) ?? 0;
          const spendGtq = toGtq(a.spendNative, a.currency);
          return {
            project: a.account,
            alcance: a.alcance,
            impresiones: a.impresiones,
            leads,
            frecuencia: a.alcance > 0 ? a.impresiones / a.alcance : 0,
            spendGtq,
            cpl: spendGtq != null && leads > 0 ? spendGtq / leads : null,
            color: projectColor(a.account),
          };
        })
        .sort((x, y) => y.leads - x.leads),
    [netLeadsByAccount, toGtq],
  );

  const leadsDonut = useMemo(
    () =>
      byProject
        .filter((p) => p.leads > 0)
        .map((p) => ({ name: p.project, value: p.leads, color: p.color })),
    [byProject],
  );

  /** Leads by day of week. Dates are plain YYYY-MM-DD, so read them in UTC —
   *  a local-time parse shifts the whole series by a day west of Greenwich. */
  const leadsByWeekday = useMemo(() => {
    const buckets = new Array<number>(7).fill(0);
    for (const d of SNAP.daily) {
      const day = new Date(`${d.date}T00:00:00Z`).getUTCDay();
      buckets[day] += d.leads;
    }
    return WEEKDAYS.map((label, i) => ({ label, value: buckets[i] }));
  }, []);

  const peakWeekday = useMemo(
    () =>
      leadsByWeekday.reduce<{ label: string; value: number } | null>(
        (best, d) => (best == null || d.value > best.value ? d : best),
        null,
      ),
    [leadsByWeekday],
  );

  /** Monthly spend and leads, spend converted to GTQ per account's real currency. */
  const monthly = useMemo(() => {
    const m = new Map<string, { leads: number; spend: number; known: boolean }>();
    for (const r of SNAP.monthAccount) {
      const g = toGtq(r.spendNative, r.currency);
      const cur = m.get(r.month) ?? { leads: 0, spend: 0, known: true };
      cur.leads += r.leads;
      if (g == null) cur.known = false;
      else cur.spend += g;
      m.set(r.month, cur);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [toGtq]);

  const inversionMensual: TimeSeriesPoint[] = useMemo(
    () => monthly.filter(([, v]) => v.known).map(([month, v]) => ({ label: month, value: v.spend })),
    [monthly],
  );

  const cplMensual: TimeSeriesPoint[] = useMemo(
    () =>
      monthly
        .filter(([, v]) => v.known && v.leads > 0)
        .map(([month, v]) => ({ label: month, value: v.spend / v.leads })),
    [monthly],
  );

  /* --------------------------------------------------------------
   * Presupuesto. The budget file carries no currency column, so its
   * figures are shown in the unit the file itself uses and are never
   * mixed with the GTQ-converted actual spend.
   * ------------------------------------------------------------ */
  const presupuesto = useMemo(() => {
    const total = SNAP.budget.reduce((s, b) => s + (b.inversion ?? 0), 0);
    const monthKeys = new Set<string>();
    for (const b of SNAP.budget) {
      if (!b.fecha) continue;
      const [, mm, yyyy] = b.fecha.split("/");
      if (mm && yyyy) monthKeys.add(`${yyyy}-${mm}`);
    }
    const months = [...monthKeys].sort();
    const byProyecto = new Map<string, number>();
    const byConcepto = new Map<string, number>();
    for (const b of SNAP.budget) {
      if (b.inversion == null) continue;
      if (b.proyecto) byProyecto.set(b.proyecto, (byProyecto.get(b.proyecto) ?? 0) + b.inversion);
      if (b.concepto) byConcepto.set(b.concepto, (byConcepto.get(b.concepto) ?? 0) + b.inversion);
    }
    let realGtq = 0;
    let realKnown = true;
    for (const r of SNAP.monthAccount) {
      if (!monthKeys.has(r.month)) continue;
      const g = toGtq(r.spendNative, r.currency);
      if (g == null) realKnown = false;
      else realGtq += g;
    }
    return {
      total,
      lines: SNAP.budget.length,
      months,
      byProyecto: [...byProyecto.entries()].sort((a, b) => b[1] - a[1]),
      byConcepto: [...byConcepto.entries()].sort((a, b) => b[1] - a[1]),
      realGtq: realKnown ? realGtq : null,
    };
  }, [toGtq]);

  /** The budget file names projects loosely ("Boulevard 5"); the pauta accounts
   *  use the conformed name ("Boulevard5"). Match on letters and digits only. */
  const conformProject = useCallback((name: string | null): string | null => {
    if (!name) return null;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return PROJECT_ORDER.find((p) => p.toLowerCase().replace(/[^a-z0-9]/g, "") === key) ?? null;
  }, []);

  /** Dates the budget file states that do not exist on a calendar (e.g. 31/11). */
  const isImpossibleDate = useCallback((fecha: string | null): boolean => {
    if (!fecha) return false;
    const [dd, mm, yyyy] = fecha.split("/").map(Number);
    if (!dd || !mm || !yyyy) return false;
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    return d.getUTCMonth() !== mm - 1 || d.getUTCDate() !== dd;
  }, []);

  const monthRangeLabel =
    presupuesto.months.length > 0
      ? `${presupuesto.months[0]} – ${presupuesto.months[presupuesto.months.length - 1]}`
      : "—";

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-8 max-w-[1400px] mx-auto">
      <SiteNav />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mercadeo — Reporte maestro</h1>
          <p className="text-sm text-muted mt-1">
            Metas de lead, uso de presupuesto, retorno, campañas y canales — pauta Meta Ads
          </p>
        </div>
        {/* The two tags carry no meaning on their own — say what each source is. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <SourceTag live /> base de datos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SourceTag live={false} /> pauta Meta Ads
          </span>
        </div>
      </header>

      <SectionNav items={MERCADEO_SECTIONS} onSelect={jumpTo} activeId={activeSection} />

      {error && (
        <div className="bg-card rounded-2xl border border-border p-4 text-danger text-sm">
          No se pudieron cargar los datos en vivo: {error}
        </div>
      )}

      {/* ============================================================ */}
      {/*  01 · RESUMEN                                                 */}
      {/* ============================================================ */}
      <ReportPage
        id="resumen"
        title="Resumen"
        caption="Embudo, metas de lead y retorno"
      >
        {funnel ? (
          <FunnelSteps
            stages={[
              {
                label: "Leads (pauta Meta)",
                value: nf.format(funnel.leads),
                hint: "excluye campaña mal mapeada",
              },
              {
                label: "Reservas",
                // The route already returns these rates as percentages.
                rate: `${funnel.tasaLeadReserva.toFixed(2)}% de leads`,
                value: nf.format(funnel.reservas),
              },
              {
                label: "PCV firmadas",
                rate: `${funnel.tasaReservaPcv.toFixed(1)}% de reservas`,
                value: nf.format(funnel.pcvFirmadas),
              },
            ]}
          />
        ) : (
          <p className="text-sm text-muted m-0">Cargando embudo…</p>
        )}
        <p className="text-xs text-muted m-0">
          Tasa de conversión del embudo completo. Reservas y PCV = todas las fuentes, desde la base de
          datos{funnel ? ` · período ${funnel.period.from} → ${funnel.period.to}` : ""}.
        </p>

        <Panel title="Metas de leads" caption={metas?.month ?? ""}>
          {metas ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border">
                    <th className={TH}>Proyecto</th>
                    <th className={TH_R}>Leads (mes)</th>
                    <th className={TH_R}>Rango mensual</th>
                    <th className={TH_R}>≈/día</th>
                    <th className={TH_R}>Meta ≈/día</th>
                    <th className={TH}>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {metas.proyectos.map((p) => {
                    const estado = p.status ?? "";
                    const tone = estado.toLowerCase().includes("encima")
                      ? "text-success"
                      : estado.toLowerCase().includes("debajo")
                        ? "text-danger"
                        : "text-muted";
                    return (
                      <tr key={p.project} className="text-text-primary">
                        <td className={`${TD} font-medium`}>{p.project}</td>
                        <td className={TD_R}>{nf.format(p.leads)}</td>
                        <td className={TD_R}>
                          {p.min == null && p.max == null ? "—" : `${p.min ?? "—"}–${p.max ?? "—"}`}
                        </td>
                        <td className={TD_R}>{nf.format(Math.round(p.leadsPorDia))}</td>
                        <td className={TD_R}>
                          {p.minPorDia == null && p.maxPorDia == null
                            ? "—"
                            : `${Math.round(p.minPorDia ?? 0)}–${Math.round(p.maxPorDia ?? 0)}`}
                        </td>
                        <td className={`${TD} font-semibold ${tone}`}>{estado || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted m-0">Cargando metas…</p>
          )}
          <p className="text-xs text-muted m-0">
            Rangos mensuales del equipo de mercadeo. Leads del último mes completo del snapshot, netos
            de la campaña excluida.
          </p>
        </Panel>

        {roas && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
            <KpiCard
              label="Inversión en pauta"
              value={q(roas.global.spendGtq)}
              hint="todas las cuentas, en GTQ"
            />
            <KpiCard
              label="Ventas (revenue)"
              value={q(roas.global.revenueGtq)}
              hint="ventas no canceladas"
            />
            <KpiCard
              label="ROAS amplio"
              value={`${roas.global.roasAmplio.toFixed(1)}×`}
              hint="todas las ventas"
            />
            <KpiCard
              label="ROAS atribuido"
              value={`${roas.global.roasAtribuido.toFixed(1)}×`}
              hint="solo fuentes digitales"
              positive
            />
          </div>
        )}

        <Panel title="ROAS / ROI por proyecto" caption="Gasto en divisa real">
          {roas ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted border-b border-border">
                    <th className={TH}>Proyecto</th>
                    <th className={TH_R}>Inversión</th>
                    <th className={TH_R}>Ventas (#)</th>
                    <th className={TH_R}>Revenue</th>
                    <th className={TH_R}>ROAS amplio</th>
                    <th className={TH_R}>ROAS atribuido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {roas.proyectos.map((p) => (
                    <tr key={p.project} className="text-text-primary">
                      <td className={`${TD} font-medium`}>
                        <span
                          aria-hidden="true"
                          className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                          style={{ background: projectColor(p.project) }}
                        />
                        {p.project}
                        {p.flag ? (
                          <span className="ml-2 text-warning" title={p.flag}>
                            ⚠
                          </span>
                        ) : null}
                      </td>
                      <td className={TD_R}>{q(p.spendGtq)}</td>
                      <td className={TD_R}>
                        {nf.format(p.ventas)}
                        {p.ventasAtribuidas > 0 ? (
                          <span className="text-muted"> ({nf.format(p.ventasAtribuidas)} dig.)</span>
                        ) : null}
                      </td>
                      <td className={TD_R}>{p.revenueGtq == null ? "—" : q(p.revenueGtq)}</td>
                      <td className={`${TD_R} font-semibold`}>
                        {p.roasAmplio == null ? "—" : `${p.roasAmplio.toFixed(1)}×`}
                      </td>
                      <td className={TD_R}>
                        {p.roasAtribuido == null ? "—" : `${p.roasAtribuido.toFixed(1)}×`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted m-0">Cargando ROAS…</p>
          )}
          <p className="text-xs text-muted m-0">
            Gasto por cuenta en su divisa real y convertido a GTQ
            {gtqPerUsd ? ` (Q${gtqPerUsd}/USD)` : ""}. Revenue = ventas no canceladas. Atribuido =
            unidades cuya reserva tiene fuente digital.
          </p>
        </Panel>
      </ReportPage>

      {/* ============================================================ */}
      {/*  02 · PERFORMANCE ADS                                         */}
      {/* ============================================================ */}
      <ReportPage
        id="performance-ads"
        title="Performance Ads"
        caption={`Pauta Meta Ads · ${SNAP.epoch} al ${SNAP.refreshed}`}
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          <KpiCard
            label="Alcance"
            value={compact(totals.alcance)}
            hint={`${nf.format(totals.alcance)} personas`}
          />
          <KpiCard
            label="Inversión en pauta"
            value={totals.spendGtq == null ? "—" : q(totals.spendGtq)}
            hint={gtqPerUsd ? `divisa real · Q${gtqPerUsd}/USD` : "esperando tipo de cambio"}
          />
          <KpiCard
            label="Clientes potenciales"
            value={nf.format(totals.leadsNet)}
            hint="leads netos registrados"
          />
          <KpiCard
            label="Costo por lead"
            value={totals.cpl == null ? "—" : q2(totals.cpl)}
            hint="inversión ÷ leads netos"
            positive
          />
        </div>

        <Panel title="Detalle de pauta" caption="Por proyecto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className={TH}>Proyecto</th>
                  <th className={TH_R}>Alcance</th>
                  <th className={TH_R}>Impres.</th>
                  <th className={TH_R}>Leads</th>
                  <th className={TH_R}>Frec.</th>
                  <th className={TH_R}>Inversión</th>
                  <th className={TH_R}>CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {byProject.map((p) => (
                  <tr key={p.project} className="text-text-primary">
                    <td className={`${TD} font-medium`}>
                      <span
                        aria-hidden="true"
                        className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                        style={{ background: p.color }}
                      />
                      {p.project}
                    </td>
                    <td className={TD_R}>{compact(p.alcance)}</td>
                    <td className={TD_R}>{compact(p.impresiones)}</td>
                    <td className={TD_R}>{nf.format(p.leads)}</td>
                    <td className={TD_R}>{p.frecuencia.toFixed(2)}</td>
                    <td className={TD_R}>{p.spendGtq == null ? "—" : q(p.spendGtq)}</td>
                    <td className={TD_R}>{p.cpl == null ? "—" : q2(p.cpl)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold text-text-primary">
                  <td className={TD}>Total</td>
                  <td className={TD_R}>{compact(totals.alcance)}</td>
                  <td className={TD_R}>{compact(totals.impresiones)}</td>
                  <td className={TD_R}>{nf.format(totals.leadsNet)}</td>
                  <td className={TD_R}>
                    {totals.alcance > 0 ? (totals.impresiones / totals.alcance).toFixed(2) : "—"}
                  </td>
                  <td className={TD_R}>{totals.spendGtq == null ? "—" : q(totals.spendGtq)}</td>
                  <td className={TD_R}>{totals.cpl == null ? "—" : q2(totals.cpl)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Leads por proyecto" caption={`${nf.format(totals.leadsNet)} leads netos`}>
            {/* DonutChart draws its own name/colour legend just under the ring,
                and it overflows the fixed height it is given. The padding keeps
                that legend clear of the share list below it. */}
            <div className="pb-8">
              <DonutChart data={leadsDonut} height={260} />
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 list-none p-0 m-0 pt-3 border-t border-border">
              {leadsDonut.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-text-primary truncate">{d.name}</span>
                  <span className="text-muted tabular-nums ml-auto">
                    {totals.leadsNet > 0 ? pct1((d.value / totals.leadsNet) * 100) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Leads por día de semana" caption="Snapshot completo">
            <ColumnChart items={leadsByWeekday} height={300} />
            <p className="text-xs text-muted m-0 pt-1">
              {peakWeekday
                ? `Día más fuerte: ${peakWeekday.label} · ${nf.format(peakWeekday.value)} leads acumulados.`
                : "Sin datos diarios."}
            </p>
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Inversión en pauta" caption="Acumulada por proyecto">
            <RankedBars
              items={byProject
                .filter((p) => p.spendGtq != null)
                .map((p) => ({ label: p.project, value: p.spendGtq as number, color: p.color }))
                .sort((a, b) => b.value - a.value)}
              format={q}
            />
          </Panel>

          <Panel title="Costo por lead" caption="Promedio por proyecto">
            <RankedBars
              items={byProject
                .filter((p) => p.cpl != null)
                .map((p) => ({ label: p.project, value: p.cpl as number, color: p.color }))
                .sort((a, b) => b.value - a.value)}
              format={q2}
            />
          </Panel>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Tendencia de inversión" caption="Mensual">
            <TimeSeriesChart
              data={inversionMensual}
              height={200}
              area
              seriesLabel="Inversión"
              format={(v) => q(v)}
            />
          </Panel>

          <Panel title="Tendencia de costo por lead" caption="Mensual">
            <TimeSeriesChart
              data={cplMensual}
              height={200}
              seriesLabel="CPL"
              format={(v) => q2(v)}
            />
          </Panel>
        </div>

        <Panel title="Efectividad de campañas" caption="12 campañas con más leads">
          <RankedBars
            items={netCampaigns
              .slice()
              .sort((a, b) => b.leads - a.leads)
              .slice(0, 12)
              .map((c) => ({
                label: c.campaign.replace(/^cons_guat__kpa_/, ""),
                value: c.leads,
                color: projectColor(c.account),
              }))}
            format={(v) => nf.format(v)}
          />
          <p className="text-xs text-muted m-0">
            Color por proyecto. Excluye la campaña mal mapeada del origen.
          </p>
        </Panel>

        <Panel title="Canales digitales" caption="Cuentas de pauta reconocidas">
          <RankedBars
            items={byProject.map((p) => ({
              label: p.project,
              value: p.leads,
              color: p.color,
            }))}
            format={(v) => nf.format(v)}
          />
          <p className="text-xs text-muted m-0">
            La operación multiplataforma en vivo se lleva en la herramienta de mercadeo; esta página
            refleja las cuentas que la aplicación reconoce.
          </p>
        </Panel>
      </ReportPage>

      {/* ============================================================ */}
      {/*  06 · PRESUPUESTO                                             */}
      {/* ============================================================ */}
      <ReportPage
        id="presupuesto"
        title="Presupuesto de mercadeo"
        caption="Plan cargado vs. gasto real"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          <KpiCard
            label="Presupuesto cargado"
            value={nf.format(Math.round(presupuesto.total))}
            hint={`${presupuesto.lines} líneas · unidad del archivo`}
          />
          <KpiCard
            label="Meses presupuestados"
            value={String(presupuesto.months.length)}
            hint={monthRangeLabel}
          />
          <KpiCard
            label="Gasto real (mismos meses)"
            value={presupuesto.realGtq == null ? "—" : q(presupuesto.realGtq)}
            hint="de la base de performance, en GTQ"
          />
        </div>
        <p className="text-xs text-muted m-0">
          El archivo de presupuesto no trae columna de divisa, así que sus montos se muestran en su
          propia unidad y no se restan contra el gasto real convertido a GTQ. Confirmando la divisa
          del archivo se puede mostrar la diferencia contra el plan.
        </p>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Presupuesto por proyecto" caption="Unidad del archivo">
            <RankedBars
              items={presupuesto.byProyecto.map(([name, value]) => ({
                label: name,
                value,
                color: projectColor(conformProject(name) ?? name),
              }))}
              format={(v) => nf.format(Math.round(v))}
            />
          </Panel>

          <Panel title="Presupuesto por concepto" caption="Unidad del archivo">
            <RankedBars
              items={presupuesto.byConcepto.map(([name, value], i) => ({
                label: name,
                value,
                color: PROJECT_COLORS[i % PROJECT_COLORS.length],
              }))}
              format={(v) => nf.format(Math.round(v))}
            />
          </Panel>
        </div>

        <Panel title="Líneas de presupuesto" caption={`${presupuesto.lines} líneas`}>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="text-muted border-b border-border">
                  <th className={TH}>Fecha (origen)</th>
                  <th className={TH}>Mes</th>
                  <th className={TH}>Proyecto (origen)</th>
                  <th className={TH}>Conformado</th>
                  <th className={TH}>Concepto</th>
                  <th className={TH}>Proveedor</th>
                  <th className={TH_R}>Inversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {SNAP.budget.map((b, i) => {
                  const bad = isImpossibleDate(b.fecha);
                  return (
                    <tr key={i} className="text-text-primary">
                      <td className={`${TD} ${bad ? "text-danger font-medium" : ""}`}>
                        {b.fecha ?? "—"}
                        {bad ? (
                          <span className="ml-1" title="Fecha inexistente en el calendario">
                            ⚠
                          </span>
                        ) : null}
                      </td>
                      <td className={TD}>{b.mes ?? "—"}</td>
                      <td className={TD}>{b.proyecto ?? "—"}</td>
                      <td className={TD}>{conformProject(b.proyecto) ?? "—"}</td>
                      <td className={TD}>{b.concepto ?? "—"}</td>
                      <td className={TD}>{b.proveedor ?? "—"}</td>
                      <td className={TD_R}>
                        {b.inversion == null ? "—" : nf.format(Math.round(b.inversion))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted m-0">
            Las fechas marcadas en rojo no existen en el calendario (por ejemplo 31/11) y vienen así
            desde el archivo de origen.
          </p>
        </Panel>
      </ReportPage>

      {/* Pages of the report this page cannot feed from the app's own data. */}
      <aside className="bg-card rounded-2xl border border-border shadow-card p-4 grid gap-2">
        <h2 className="text-sm font-semibold text-text-primary m-0">Resto del reporte</h2>
        <p className="text-sm text-muted m-0">
          Inversión / Reservas, Reporte de Reservas e Inventarios usan datos de reservas, asesores e
          inventario que esta página no carga. Se consultan en el reporte completo.
        </p>
        <a
          href="/mercadeo/performance.html"
          target="_blank"
          rel="noreferrer"
          className="justify-self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-text-primary no-underline hover:border-primary/50 hover:text-primary transition-colors"
        >
          Abrir reporte completo
          <span aria-hidden="true" className="text-muted">
            ↗
          </span>
        </a>
      </aside>
    </div>
  );
}
