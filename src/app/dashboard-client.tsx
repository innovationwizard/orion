"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorBanner from "@/components/error-banner";
import Filters from "@/components/filters";
import KpiCard from "@/components/kpi-card";
import PaymentTreemap, {
  type PaymentAnalyticsProject,
  type PaymentAnalyticsUnit
} from "@/components/payment-treemap";
import CommissionTreemap, { type CommissionRecipient } from "@/components/commission-treemap";
import PaymentDetailModal from "@/components/payment-detail-modal";
import { DATE_PRESETS } from "@/lib/date-presets";

type ProjectOption = {
  id: string;
  name: string;
};

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
  byRecipient: CommissionRecipient[];
  summary: {
    total: number;
    paid: number;
    unpaid: number;
  };
};

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentComplianceResponse | null>(null);
  const [commissionData, setCommissionData] = useState<CommissionAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PaymentAnalyticsUnit | null>(null);
  const [aptoFilter, setAptoFilter] = useState<string>("");

  const projectId = searchParams.get("project_id") ?? "";
  const rawStart = searchParams.get("start_date") ?? "";
  const rawEnd = searchParams.get("end_date") ?? "";
  const defaultRange = DATE_PRESETS.this_month.getRange();
  const startDate = rawStart;
  const endDate = rawEnd;

  // Sensible default: on first load with no date params, set "this month" (exec UX best practice)
  useEffect(() => {
    if (searchParams.get("start_date") != null || searchParams.get("end_date") != null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("start_date", defaultRange.start);
    next.set("end_date", defaultRange.end);
    router.replace(`?${next.toString()}`);
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/sales?distinct=project", {
          cache: "no-store"
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudieron cargar los proyectos.");
        }
        setProjects(payload.data ?? []);
      } catch {
        setProjects([]);
      }
    }

    fetchProjects();
  }, []);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (projectId) query.set("project_id", projectId);
      if (startDate) query.set("start_date", startDate);
      if (endDate) query.set("end_date", endDate);

      try {
        const complianceQuery = new URLSearchParams();
        if (projectId) complianceQuery.set("project_id", projectId);
        const [complianceRes, commissionsRes] = await Promise.all([
          fetch(`/api/analytics/payment-compliance?${complianceQuery.toString()}`, {
            cache: "no-store"
          }),
          fetch(`/api/analytics/commissions?${query.toString()}`, { cache: "no-store" })
        ]);

        const [compliancePayload, commissionsPayload] = await Promise.all([
          complianceRes.json(),
          commissionsRes.json()
        ]);

        if (!complianceRes.ok || !commissionsRes.ok) {
          const message =
            compliancePayload?.error ||
            commissionsPayload?.error ||
            "No se pudieron cargar los datos del panel.";
          throw new Error(message);
        }

        setPaymentData(compliancePayload ?? null);
        setCommissionData(commissionsPayload ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [projectId, startDate, endDate]);

  function updateFilters(next: { project_id?: string; start_date?: string; end_date?: string }) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (next.project_id !== undefined) {
      if (next.project_id) {
        nextParams.set("project_id", next.project_id);
      } else {
        nextParams.delete("project_id");
      }
    }

    if (next.start_date !== undefined) {
      if (next.start_date) {
        nextParams.set("start_date", next.start_date);
      } else {
        nextParams.delete("start_date");
      }
    }

    if (next.end_date !== undefined) {
      if (next.end_date) {
        nextParams.set("end_date", next.end_date);
      } else {
        nextParams.delete("end_date");
      }
    }

    router.replace(`?${nextParams.toString()}`);
  }

  const complianceSummary = paymentData?.summary ?? {
    totalUnits: 0,
    compliantUnits: 0,
    delinquentUnits: 0,
    expectedToDate: 0,
    actualTotal: 0,
    compliancePct: 0,
    variance: 0,
    byAgingBucket: {
      current: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0
    }
  };
  const paymentProjectsRaw = paymentData?.byProject ?? [];

  // Map compliance units to treemap format and unique aptos for filter
  const toTreemapUnit = (u: ComplianceUnit): PaymentAnalyticsUnit => ({
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
  });

  const paymentProjectsRawMapped = paymentProjectsRaw.map((p) => ({
    ...p,
    units: p.units.map((u) => toTreemapUnit(u))
  }));

  const aptoOptions = [...new Set(paymentProjectsRawMapped.flatMap((p) => p.units.map((u) => u.unitNumber ?? "")))].filter(
    Boolean
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const paymentProjectsFiltered = aptoFilter.trim()
    ? paymentProjectsRawMapped
        .map((project) => ({
          ...project,
          units: project.units.filter((u) => (u.unitNumber ?? "").trim() === aptoFilter.trim())
        }))
        .filter((project) => project.units.length > 0)
    : paymentProjectsRawMapped;

  const paymentSummary = aptoFilter.trim()
    ? (() => {
        const units = paymentProjectsFiltered.flatMap((p) => p.units);
        const expectedToDate = units.reduce((s, u) => s + (u.totalExpected ?? 0), 0);
        const actualTotal = units.reduce((s, u) => s + (u.totalPaid ?? 0), 0);
        const compliancePct = expectedToDate > 0 ? Math.round((actualTotal / expectedToDate) * 100) : 0;
        const delinquentUnits = units.filter((u) => (u.daysDelinquent ?? 0) > 0).length;
        return {
          ...complianceSummary,
          expectedToDate,
          actualTotal,
          compliancePct,
          variance: actualTotal - expectedToDate,
          delinquentUnits,
          compliantUnits: units.length - delinquentUnits
        };
      })()
    : complianceSummary;

  const paymentProjects = paymentProjectsFiltered.map((project) => ({
    ...project,
    units: [...project.units].sort((a, b) =>
      (a.unitNumber ?? "").localeCompare(b.unitNumber ?? "", undefined, { numeric: true })
    )
  }));

  const delinquentUnits = paymentProjects.flatMap((p) =>
    p.units.filter((u) => (u.daysDelinquent ?? 0) > 0).map((u) => ({ ...u, projectName: p.projectName }))
  ).sort((a, b) => (b.daysDelinquent ?? 0) - (a.daysDelinquent ?? 0));

  const commissionRecipients = commissionData?.byRecipient ?? [];
  const commissionSummary = commissionData?.summary ?? { total: 0, paid: 0, unpaid: 0 };
  const hasPaymentData = paymentProjects.length > 0;
  const hasCommissionData = commissionRecipients.length > 0;

  return (
    <section className="page dashboard">
      <nav className="mini-nav">
        <a className="mini-nav__link" href="/">
          Dashboard
        </a>
        <a className="mini-nav__link" href="/projects">
          Projects
        </a>
        <a className="mini-nav__link" href="/desistimientos">
          Desistimientos
        </a>
      </nav>
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
            onChange={updateFilters}
          />
          <p className="dashboard-header__scope muted" aria-live="polite">
            <strong>Seguimiento de Pagos</strong> usa cronograma (expected_payments). Fechas aplican a{" "}
            <strong>Comisiones</strong>.
          </p>
        </div>
      </header>

      <ErrorBanner error={error} />

      <section className="kpi-grid">
        <KpiCard
          label="Esperado a la fecha"
          value={currency.format(paymentSummary.expectedToDate)}
          hint="Cronograma"
        />
        <KpiCard label="Cobrado" value={currency.format(paymentSummary.actualTotal)} />
        <KpiCard
          label="% cumplimiento"
          value={`${paymentSummary.compliancePct}%`}
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
          {...(paymentSummary.variance >= 0 ? { positive: true } : { negative: true })}
        />
        <KpiCard
          label="Unidades en mora"
          value={String(paymentSummary.delinquentUnits)}
          hint={`de ${paymentSummary.totalUnits}`}
        />
      </section>

      {paymentSummary.expectedToDate > 0 && (
        <section className="card">
          <h3>Antigüedad de mora (AR aging)</h3>
          <div className="aging-bar">
            {[
              { key: "current", className: "current", count: paymentSummary.byAgingBucket.current, label: "Al día" },
              { key: "days1_30", className: "days1-30", count: paymentSummary.byAgingBucket.days1_30, label: "1-30" },
              { key: "days31_60", className: "days31-60", count: paymentSummary.byAgingBucket.days31_60, label: "31-60" },
              { key: "days61_90", className: "days61-90", count: paymentSummary.byAgingBucket.days61_90, label: "61-90" },
              { key: "days90Plus", className: "days90-plus", count: paymentSummary.byAgingBucket.days90Plus, label: "90+" }
            ].map(({ key, className, count, label }) => (
              <div
                key={key}
                className={`aging-segment ${className}`}
                style={{ flex: Math.max(1, count) }}
                title={`${label} días: ${count}`}
              >
                {count > 0 ? count : null}
              </div>
            ))}
          </div>
          <div className="aging-legend">
            <span>Al día</span>
            <span>1-30</span>
            <span>31-60</span>
            <span>61-90</span>
            <span>90+</span>
          </div>
        </section>
      )}

      <section className="card treemap-card">
        <div className="section-header">
          <div>
            <h2>Seguimiento de Pagos</h2>
            <p className="muted">Proyectos → Unidades · Color por % cumplimiento. Borde rojo = en mora.</p>
          </div>
          <div className="section-header-actions">
            <label className="apto-filter" htmlFor="apto-filter-input">
              <span className="apto-filter__label">Filtrar por apto</span>
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
                  aria-label="Filtrar por número de apto"
                  aria-describedby={aptoFilter.trim() ? "apto-filter-clear-hint" : undefined}
                />
                {aptoFilter.trim() ? (
                  <button
                    type="button"
                    className="apto-filter__clear"
                    onClick={() => setAptoFilter("")}
                    aria-label="Quitar filtro de apto"
                    id="apto-filter-clear-hint"
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
            <div className="section-meta">
              {aptoFilter.trim() ? (
                <span className="apto-filter-chip" title="Filtro activo">
                  Aptos: {aptoFilter.trim()}
                </span>
              ) : null}
              <span>{currency.format(paymentSummary.actualTotal)}</span>
              <span className="muted">de {currency.format(paymentSummary.expectedToDate)}</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="skeleton treemap-skeleton">
            <div className="skeleton-line" style={{ width: "50%" }} />
            <div className="skeleton-line" style={{ width: "80%" }} />
            <div className="skeleton-line" style={{ width: "72%" }} />
          </div>
        ) : hasPaymentData ? (
          <PaymentTreemap data={paymentProjects} onUnitSelect={setSelectedUnit} />
        ) : aptoFilter.trim() ? (
          <div className="empty-state">No hay unidades que coincidan con el apto &quot;{aptoFilter.trim()}&quot;.</div>
        ) : (
          <div className="empty-state">Aún no hay datos de pagos.</div>
        )}
      </section>

      {delinquentUnits.length > 0 && (
        <section className="card table-card">
          <div className="section-header">
            <h2>Cuentas en mora</h2>
            <span className="muted">{delinquentUnits.length} unidades</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Unidad</th>
                  <th>Cliente</th>
                  <th>Esperado</th>
                  <th>Cobrado</th>
                  <th>Varianza</th>
                  <th>Días mora</th>
                </tr>
              </thead>
              <tbody>
                {delinquentUnits.map((u) => (
                  <tr key={`${u.projectName}-${u.unitNumber}`}>
                    <td>{u.projectName}</td>
                    <td>{u.unitNumber}</td>
                    <td>{u.clientName}</td>
                    <td>{currency.format(u.totalExpected)}</td>
                    <td>{currency.format(u.totalPaid)}</td>
                    <td className="negative">{currency.format(u.variance ?? 0)}</td>
                    <td className="negative">{u.daysDelinquent ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card treemap-card">
        <div className="section-header">
          <div>
            <h2>Distribución de Comisiones</h2>
            <p className="muted">Management · Sales · Special · Color por pagado.</p>
          </div>
          <div className="section-meta">
            <span>{currency.format(commissionSummary.paid)}</span>
            <span className="muted">pagado · {currency.format(commissionSummary.unpaid)} pendiente</span>
          </div>
        </div>
        {isLoading ? (
          <div className="skeleton treemap-skeleton">
            <div className="skeleton-line" style={{ width: "40%" }} />
            <div className="skeleton-line" style={{ width: "85%" }} />
            <div className="skeleton-line" style={{ width: "65%" }} />
          </div>
        ) : hasCommissionData ? (
          <CommissionTreemap data={commissionRecipients} />
        ) : (
          <div className="empty-state">Aún no hay datos de comisiones.</div>
        )}
      </section>

      <PaymentDetailModal
        open={Boolean(selectedUnit)}
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
      />
    </section>
  );
}
