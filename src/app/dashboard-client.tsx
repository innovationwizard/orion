"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorBanner from "@/components/error-banner";
import Filters from "@/components/filters";
import KpiCard from "@/components/kpi-card";
import Tabs from "@/components/tabs";
import BulletChart from "@/components/bullet-chart";
import CashFlowChart, { type MonthlyData } from "@/components/cash-flow-chart";
import CommissionBars, { type CommissionBarItem } from "@/components/commission-bars";
import PaymentDetailModal from "@/components/payment-detail-modal";
import type { PaymentAnalyticsUnit } from "@/components/payment-treemap";
import { DATE_PRESETS } from "@/lib/date-presets";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProjectOption = { id: string; name: string };

type ComplianceUnit = {
  unitId: string;
  unitNumber: string;
  clientName: string;
  expectedToDate: number;
  actualTotal: number;
  compliancePct: number | null;
  variance: number;
  complianceStatus: string;
  daysDelinquent: number | null;
  firstDueDate: string;
  lastDueDate: string;
  paymentHistory: Array<{ id: string; paymentDate: string; paymentType: string; amount: number }>;
};

type PaymentComplianceResponse = {
  byProject: Array<{ projectId: string; projectName: string; units: ComplianceUnit[] }>;
  summary: {
    totalUnits: number;
    compliantUnits: number;
    delinquentUnits: number;
    expectedToDate: number;
    actualTotal: number;
    compliancePct: number;
    variance: number;
    byAgingBucket: {
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      days90Plus: number;
    };
  };
};

type CommissionAnalyticsResponse = {
  byRecipient: CommissionBarItem[];
  summary: { total: number; paid: number; unpaid: number };
};

type CashFlowResponse = {
  monthly: MonthlyData[];
  summary: { totalExpected: number; totalForecasted: number; totalActual: number };
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "overview", label: "Resumen" },
  { id: "payments", label: "Pagos" },
  { id: "cash-flow", label: "Flujo de Caja" },
  { id: "commissions", label: "Comisiones" }
];

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

const AGING_BUCKETS = [
  { key: "current", label: "Al día", className: "current" },
  { key: "days1_30", label: "1–30", className: "days1-30" },
  { key: "days31_60", label: "31–60", className: "days31-60" },
  { key: "days61_90", label: "61–90", className: "days61-90" },
  { key: "days90Plus", label: "90+", className: "days90-plus" }
] as const;

function severityClass(days: number | null): string {
  if (!days || days <= 0) return "";
  if (days <= 30) return "severity-1";
  if (days <= 60) return "severity-2";
  if (days <= 90) return "severity-3";
  return "severity-4";
}

function heatmapBg(bucket: string, count: number, total: number): string {
  if (count === 0) return "transparent";
  const ratio = Math.min(1, count / Math.max(1, total));
  if (bucket === "current") return `rgba(22, 163, 74, ${(0.1 + ratio * 0.35).toFixed(2)})`;
  return `rgba(239, 68, 68, ${(0.08 + ratio * 0.4).toFixed(2)})`;
}

function toAnalyticsUnit(u: ComplianceUnit): PaymentAnalyticsUnit {
  return {
    unitId: u.unitId,
    unitNumber: u.unitNumber,
    clientName: u.clientName,
    totalExpected: u.expectedToDate,
    totalPaid: u.actualTotal,
    percentPaid: u.compliancePct ?? 0,
    expectedToDate: u.expectedToDate,
    variance: u.variance,
    complianceStatus: u.complianceStatus,
    daysDelinquent: u.daysDelinquent,
    firstDueDate: u.firstDueDate,
    lastDueDate: u.lastDueDate,
    paymentHistory: u.paymentHistory
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentComplianceResponse | null>(null);
  const [commissionData, setCommissionData] = useState<CommissionAnalyticsResponse | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PaymentAnalyticsUnit | null>(null);
  const [aptoFilter, setAptoFilter] = useState("");
  const [showAllUnits, setShowAllUnits] = useState(false);

  const projectId = searchParams.get("project_id") ?? "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";
  const excludeFF = searchParams.get("exclude_ff") === "1";
  const activeTab = TABS.find((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")!
    : "overview";

  const defaultRange = DATE_PRESETS.this_month.getRange();

  /* Default date on first load */
  useEffect(() => {
    if (searchParams.get("start_date") != null || searchParams.get("end_date") != null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("start_date", defaultRange.start);
    next.set("end_date", defaultRange.end);
    router.replace(`?${next.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Fetch projects */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sales?distinct=project", { cache: "no-store" });
        const payload = await res.json();
        if (res.ok) setProjects(payload.data ?? []);
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  /* Fetch analytics */
  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);

      const commissionsQ = new URLSearchParams();
      if (projectId) commissionsQ.set("project_id", projectId);
      if (startDate) commissionsQ.set("start_date", startDate);
      if (endDate) commissionsQ.set("end_date", endDate);
      if (excludeFF) commissionsQ.set("exclude_ff", "1");

      const complianceQ = new URLSearchParams();
      if (projectId) complianceQ.set("project_id", projectId);
      if (excludeFF) complianceQ.set("exclude_ff", "1");

      const cashFlowQ = new URLSearchParams();
      if (projectId) cashFlowQ.set("project_id", projectId);
      if (excludeFF) cashFlowQ.set("exclude_ff", "1");

      try {
        const [compRes, commRes, cfRes] = await Promise.all([
          fetch(`/api/analytics/payment-compliance?${complianceQ}`, { cache: "no-store" }),
          fetch(`/api/analytics/commissions?${commissionsQ}`, { cache: "no-store" }),
          fetch(`/api/analytics/cash-flow-forecast?${cashFlowQ}`, { cache: "no-store" })
        ]);

        const [compPayload, commPayload, cfPayload] = await Promise.all([
          compRes.json(),
          commRes.json(),
          cfRes.json()
        ]);

        if (!compRes.ok || !commRes.ok) {
          throw new Error(
            compPayload?.error || commPayload?.error || "Error al cargar datos."
          );
        }

        setPaymentData(compPayload ?? null);
        setCommissionData(commPayload ?? null);
        setCashFlowData(cfRes.ok ? cfPayload : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [projectId, startDate, endDate, excludeFF]);

  /* URL helpers */
  function updateFilters(next: { project_id?: string; start_date?: string; end_date?: string }) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`?${p.toString()}`);
  }

  function toggleFF() {
    const p = new URLSearchParams(searchParams.toString());
    if (excludeFF) p.delete("exclude_ff");
    else p.set("exclude_ff", "1");
    router.replace(`?${p.toString()}`);
  }

  function setActiveTabId(tab: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    router.replace(`?${p.toString()}`);
  }

  /* ---- Derived data ---- */

  const complianceSummary = paymentData?.summary ?? {
    totalUnits: 0,
    compliantUnits: 0,
    delinquentUnits: 0,
    expectedToDate: 0,
    actualTotal: 0,
    compliancePct: 0,
    variance: 0,
    byAgingBucket: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0 }
  };

  const paymentProjectsMapped = (paymentData?.byProject ?? []).map((p) => ({
    ...p,
    units: p.units.map(toAnalyticsUnit)
  }));

  const aptoOptions = [
    ...new Set(
      paymentProjectsMapped.flatMap((p) => p.units.map((u) => u.unitNumber ?? "")).filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const paymentProjects = aptoFilter.trim()
    ? paymentProjectsMapped
        .map((p) => ({
          ...p,
          units: p.units.filter((u) => (u.unitNumber ?? "").trim() === aptoFilter.trim())
        }))
        .filter((p) => p.units.length > 0)
    : paymentProjectsMapped;

  const paymentSummary = aptoFilter.trim()
    ? (() => {
        const units = paymentProjects.flatMap((p) => p.units);
        const expectedToDate = units.reduce((s, u) => s + (u.totalExpected ?? 0), 0);
        const actualTotal = units.reduce((s, u) => s + (u.totalPaid ?? 0), 0);
        const compliancePct =
          expectedToDate > 0 ? Math.round((actualTotal / expectedToDate) * 100) : 0;
        const delinquentCount = units.filter((u) => (u.daysDelinquent ?? 0) > 0).length;
        return {
          ...complianceSummary,
          expectedToDate,
          actualTotal,
          compliancePct,
          variance: actualTotal - expectedToDate,
          delinquentUnits: delinquentCount,
          compliantUnits: units.length - delinquentCount
        };
      })()
    : complianceSummary;

  const allUnits = paymentProjects
    .flatMap((p) => p.units.map((u) => ({ ...u, projectName: p.projectName })))
    .sort((a, b) => (b.daysDelinquent ?? 0) - (a.daysDelinquent ?? 0));

  const delinquentUnits = allUnits.filter((u) => (u.daysDelinquent ?? 0) > 0);
  const displayedUnits = showAllUnits ? allUnits : delinquentUnits;

  const projectBullets = paymentProjects.map((p) => {
    const expected = p.units.reduce((s, u) => s + u.totalExpected, 0);
    const actual = p.units.reduce((s, u) => s + u.totalPaid, 0);
    return {
      label: p.projectName,
      value: expected > 0 ? (actual / expected) * 100 : 0,
      target: 100,
      subtitle: `${p.units.length} unidades`
    };
  });

  const agingByProject = paymentProjects.map((p) => {
    const b = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0 };
    for (const u of p.units) {
      const d = u.daysDelinquent ?? 0;
      if (d <= 0) b.current++;
      else if (d <= 30) b.days1_30++;
      else if (d <= 60) b.days31_60++;
      else if (d <= 90) b.days61_90++;
      else b.days90Plus++;
    }
    return { projectName: p.projectName, total: p.units.length, ...b };
  });

  const monthly = cashFlowData?.monthly ?? [];
  const trendExpected = monthly.map((m) => m.expected);
  const trendActual = monthly.map((m) => m.actual);
  const trendCompliance = monthly.map((m) =>
    m.expected > 0 ? (m.actual / m.expected) * 100 : 0
  );
  const trendVariance = monthly.map((m) => m.actual - m.expected);

  const commissionRecipients = commissionData?.byRecipient ?? [];
  const commissionSummary = commissionData?.summary ?? { total: 0, paid: 0, unpaid: 0 };

  const cfSummary = cashFlowData?.summary ?? {
    totalExpected: 0,
    totalForecasted: 0,
    totalActual: 0
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <section className="page dashboard">
      {/* Navigation */}
      <nav className="mini-nav">
        <a className="mini-nav__link" href="/">Dashboard</a>
        <a className="mini-nav__link" href="/projects">Projects</a>
        <a className="mini-nav__link" href="/desistimientos">Desistimientos</a>
      </nav>

      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header__title">
          <p className="eyebrow">ORION — Business Intelligence</p>
          <h1>Seguimiento de Reservas, Pagos y Comisiones</h1>
        </div>
        <div className="dashboard-header__filters">
          <Filters
            projects={projects}
            projectId={projectId}
            startDate={startDate}
            endDate={endDate}
            excludeFF={excludeFF}
            onChange={updateFilters}
            onToggleFF={toggleFF}
          />
          <p className="dashboard-header__scope muted" aria-live="polite">
            <strong>Seguimiento de Pagos</strong> usa cronograma (expected_payments). Fechas aplican
            a <strong>Comisiones</strong>.
          </p>
        </div>
      </header>

      <ErrorBanner error={error} />

      {/* Tabs */}
      <Tabs tabs={TABS} value={activeTab} onChange={setActiveTabId} />

      {/* ============================================================ */}
      {/*  TAB: RESUMEN                                                 */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <>
          <section className="kpi-grid">
            <KpiCard
              label="Esperado a la fecha"
              value={currency.format(paymentSummary.expectedToDate)}
              hint="Cronograma"
              trend={trendExpected}
            />
            <KpiCard
              label="Cobrado"
              value={currency.format(paymentSummary.actualTotal)}
              trend={trendActual}
              trendColor="#22c55e"
            />
            <KpiCard
              label="% Cumplimiento"
              value={`${paymentSummary.compliancePct}%`}
              trend={trendCompliance}
              {...(paymentSummary.compliancePct >= 95
                ? { positive: true }
                : paymentSummary.expectedToDate > 0
                  ? { negative: true }
                  : {})}
            />
            <KpiCard
              label="Varianza"
              value={currency.format(paymentSummary.variance)}
              hint={paymentSummary.variance >= 0 ? "Adelantado" : "En mora"}
              trend={trendVariance}
              {...(paymentSummary.variance >= 0 ? { positive: true } : { negative: true })}
            />
            <KpiCard
              label="Unidades en mora"
              value={String(paymentSummary.delinquentUnits)}
              hint={`de ${paymentSummary.totalUnits}`}
            />
          </section>

          {projectBullets.length > 0 && (
            <section className="card">
              <div className="section-header">
                <h3>Cumplimiento por Proyecto</h3>
                <span className="muted">{projectBullets.length} proyectos</span>
              </div>
              {isLoading ? (
                <div className="skeleton">
                  <div className="skeleton-line" style={{ width: "70%" }} />
                  <div className="skeleton-line" style={{ width: "85%" }} />
                  <div className="skeleton-line" style={{ width: "60%" }} />
                </div>
              ) : (
                <BulletChart items={projectBullets} />
              )}
            </section>
          )}

          {paymentSummary.expectedToDate > 0 && (
            <section className="card">
              <h3>Antigüedad de mora</h3>
              <div className="aging-bar">
                {AGING_BUCKETS.map(({ key, className, label }) => {
                  const count =
                    paymentSummary.byAgingBucket[
                      key as keyof typeof paymentSummary.byAgingBucket
                    ];
                  return (
                    <div
                      key={key}
                      className={`aging-segment ${className}`}
                      style={{ flex: Math.max(1, count) }}
                      title={`${label}: ${count} unidades`}
                    >
                      {count > 0 ? count : null}
                    </div>
                  );
                })}
              </div>
              <div className="aging-legend">
                {AGING_BUCKETS.map(({ key, label }) => (
                  <span key={key}>{label}</span>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  TAB: PAGOS                                                   */}
      {/* ============================================================ */}
      {activeTab === "payments" && (
        <>
          {/* Aging Heatmap */}
          {agingByProject.length > 0 && (
            <section className="card">
              <h3>Mora por Proyecto</h3>
              <div className="heatmap">
                <div className="heatmap-row heatmap-row--header">
                  <span className="heatmap-label" />
                  {AGING_BUCKETS.map(({ key, label }) => (
                    <span key={key} className="heatmap-cell heatmap-cell--header">
                      {label}
                    </span>
                  ))}
                  <span className="heatmap-cell heatmap-cell--header">Total</span>
                </div>
                {agingByProject.map((p) => (
                  <div key={p.projectName} className="heatmap-row">
                    <span className="heatmap-label">{p.projectName}</span>
                    {(
                      ["current", "days1_30", "days31_60", "days61_90", "days90Plus"] as const
                    ).map((bucket) => (
                      <span
                        key={bucket}
                        className="heatmap-cell"
                        style={{ background: heatmapBg(bucket, p[bucket], p.total) }}
                      >
                        {p[bucket] || "–"}
                      </span>
                    ))}
                    <span className="heatmap-cell heatmap-cell--total">{p.total}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Units table */}
          <section className="card table-card">
            <div className="section-header">
              <div>
                <h2>{showAllUnits ? "Todas las unidades" : "Cuentas en mora"}</h2>
                <p className="muted">
                  {displayedUnits.length} unidades
                  {!showAllUnits && delinquentUnits.length > 0
                    ? " · ordenado por días de mora"
                    : ""}
                </p>
              </div>
              <div className="section-header-actions">
                <label className="apto-filter" htmlFor="apto-filter-input">
                  <span className="apto-filter__label">Filtrar apto</span>
                  <div className="apto-filter__input-wrap">
                    <input
                      id="apto-filter-input"
                      type="text"
                      className="apto-filter__input"
                      list="apto-filter-list"
                      value={aptoFilter}
                      onChange={(e) => setAptoFilter(e.target.value)}
                      placeholder="Ej. 101, 2-A…"
                      autoComplete="off"
                      aria-label="Filtrar por numero de apto"
                    />
                    {aptoFilter.trim() ? (
                      <button
                        type="button"
                        className="apto-filter__clear"
                        onClick={() => setAptoFilter("")}
                        aria-label="Quitar filtro"
                      >
                        ×
                      </button>
                    ) : null}
                    <datalist id="apto-filter-list">
                      {aptoOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>
                </label>
                <button
                  type="button"
                  className={`button small ${showAllUnits ? "secondary" : ""}`}
                  onClick={() => setShowAllUnits(!showAllUnits)}
                >
                  {showAllUnits ? "Solo en mora" : "Todas"}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="skeleton" style={{ padding: 24 }}>
                <div className="skeleton-line" style={{ width: "90%" }} />
                <div className="skeleton-line" style={{ width: "75%" }} />
                <div className="skeleton-line" style={{ width: "80%" }} />
              </div>
            ) : displayedUnits.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Unidad</th>
                      <th>Cliente</th>
                      <th>Esperado</th>
                      <th>Cobrado</th>
                      <th>Cumplimiento</th>
                      <th>Varianza</th>
                      <th>Días mora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUnits.map((u) => {
                      const pct =
                        u.totalExpected > 0
                          ? Math.round((u.totalPaid / u.totalExpected) * 100)
                          : 0;
                      return (
                        <tr
                          key={`${u.projectName}-${u.unitNumber}`}
                          className={`clickable-row ${severityClass(u.daysDelinquent ?? null)}`}
                          onClick={() => setSelectedUnit(u)}
                        >
                          <td>{u.projectName}</td>
                          <td>
                            <strong>{u.unitNumber}</strong>
                          </td>
                          <td>{u.clientName}</td>
                          <td>{currency.format(u.totalExpected)}</td>
                          <td>{currency.format(u.totalPaid)}</td>
                          <td>
                            <div className="compliance-bar-cell">
                              <div className="compliance-bar">
                                <div
                                  className="compliance-bar__fill"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="compliance-bar__label">{pct}%</span>
                            </div>
                          </td>
                          <td className={(u.variance ?? 0) >= 0 ? "positive" : "negative"}>
                            {currency.format(u.variance ?? 0)}
                          </td>
                          <td className={(u.daysDelinquent ?? 0) > 0 ? "negative" : ""}>
                            {u.daysDelinquent ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                {aptoFilter.trim()
                  ? `No hay unidades que coincidan con "${aptoFilter.trim()}".`
                  : showAllUnits
                    ? "No hay datos de pagos."
                    : "No hay cuentas en mora."}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================================ */}
      {/*  TAB: FLUJO DE CAJA                                           */}
      {/* ============================================================ */}
      {activeTab === "cash-flow" && (
        <>
          <section className="kpi-grid kpi-grid--3">
            <KpiCard
              label="Programado total"
              value={currency.format(cfSummary.totalExpected)}
              hint="Cronograma completo"
            />
            <KpiCard
              label="Proyectado (ajustado)"
              value={currency.format(cfSummary.totalForecasted)}
              hint="Basado en cumplimiento histórico"
            />
            <KpiCard
              label="Cobrado total"
              value={currency.format(cfSummary.totalActual)}
              {...(cfSummary.totalActual >= cfSummary.totalForecasted
                ? { positive: true }
                : { negative: true })}
            />
          </section>

          <section className="card">
            <div className="section-header">
              <h3>Flujo de Caja Mensual</h3>
              <span className="muted">
                {monthly.length > 0
                  ? `${monthly[0].month} — ${monthly[monthly.length - 1].month}`
                  : ""}
              </span>
            </div>
            {isLoading ? (
              <div className="skeleton" style={{ padding: 24 }}>
                <div className="skeleton-line" style={{ width: "100%" }} />
                <div className="skeleton-line" style={{ width: "85%" }} />
                <div className="skeleton-line" style={{ width: "60%" }} />
              </div>
            ) : (
              <CashFlowChart data={monthly} />
            )}
          </section>
        </>
      )}

      {/* ============================================================ */}
      {/*  TAB: COMISIONES                                              */}
      {/* ============================================================ */}
      {activeTab === "commissions" && (
        <>
          <section className="kpi-grid kpi-grid--3">
            <KpiCard label="Total comisiones" value={currency.format(commissionSummary.total)} />
            <KpiCard label="Pagado" value={currency.format(commissionSummary.paid)} positive />
            <KpiCard
              label="Pendiente"
              value={currency.format(commissionSummary.unpaid)}
              negative
            />
          </section>

          <section className="card">
            <div className="section-header">
              <h3>Comisiones por Beneficiario</h3>
              <span className="muted">{commissionRecipients.length} beneficiarios</span>
            </div>
            {isLoading ? (
              <div className="skeleton" style={{ padding: 24 }}>
                <div className="skeleton-line" style={{ width: "75%" }} />
                <div className="skeleton-line" style={{ width: "90%" }} />
                <div className="skeleton-line" style={{ width: "60%" }} />
              </div>
            ) : (
              <CommissionBars data={commissionRecipients} />
            )}
          </section>
        </>
      )}

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        open={Boolean(selectedUnit)}
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
      />
    </section>
  );
}
