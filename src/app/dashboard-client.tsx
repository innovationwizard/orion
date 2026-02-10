"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Filters from "@/components/filters";
import KpiCard from "@/components/kpi-card";
import PaymentTreemap, {
  type PaymentAnalyticsProject,
  type PaymentAnalyticsUnit
} from "@/components/payment-treemap";
import CommissionTreemap, { type CommissionRecipient } from "@/components/commission-treemap";
import PaymentDetailModal from "@/components/payment-detail-modal";

type ProjectOption = {
  id: string;
  name: string;
};

type PaymentAnalyticsResponse = {
  byProject: PaymentAnalyticsProject[];
  summary: {
    totalExpected: number;
    totalPaid: number;
    percentPaid: number;
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
  const [paymentData, setPaymentData] = useState<PaymentAnalyticsResponse | null>(null);
  const [commissionData, setCommissionData] = useState<CommissionAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PaymentAnalyticsUnit | null>(null);

  const projectId = searchParams.get("project_id") ?? "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";

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
      if (projectId) {
        query.set("project_id", projectId);
      }
      if (startDate) {
        query.set("start_date", startDate);
      }
      if (endDate) {
        query.set("end_date", endDate);
      }

      try {
        const [paymentsRes, commissionsRes] = await Promise.all([
          fetch(`/api/analytics/payments?${query.toString()}`, { cache: "no-store" }),
          fetch(`/api/analytics/commissions?${query.toString()}`, { cache: "no-store" })
        ]);

        const [paymentsPayload, commissionsPayload] = await Promise.all([
          paymentsRes.json(),
          commissionsRes.json()
        ]);

        if (!paymentsRes.ok || !commissionsRes.ok) {
          const message =
            paymentsPayload?.error ||
            commissionsPayload?.error ||
            "No se pudieron cargar los datos del panel.";
          throw new Error(message);
        }

        setPaymentData(paymentsPayload ?? null);
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

  const paymentSummary = paymentData?.summary ?? {
    totalExpected: 0,
    totalPaid: 0,
    percentPaid: 0
  };
  const paymentProjects = paymentData?.byProject ?? [];
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
      </nav>
      <header className="header">
        <div>
          <p className="eyebrow">ORION - Business Intelligence Dashboard</p>
          <h1>Seguimiento de Reservas, Pagos y Comisiones</h1>
        </div>
        <div className="header-actions">
          <Filters
            projects={projects}
            projectId={projectId}
            startDate={startDate}
            endDate={endDate}
            onChange={updateFilters}
          />
        </div>
      </header>

      {error ? <div className="banner danger">{error}</div> : null}

      <section className="kpi-grid">
        <KpiCard
          label="Total esperado"
          value={currency.format(paymentSummary.totalExpected)}
          hint="Ventas activas"
        />
        <KpiCard label="Total pagado" value={currency.format(paymentSummary.totalPaid)} />
        <KpiCard label="% pagado" value={`${paymentSummary.percentPaid}%`} positive />
      </section>

      <section className="card treemap-card">
        <div className="section-header">
          <div>
            <h2>Seguimiento de Pagos</h2>
            <p className="muted">Proyectos → Unidades · Color por porcentaje pagado.</p>
          </div>
          <div className="section-meta">
            <span>{currency.format(paymentSummary.totalPaid)}</span>
            <span className="muted">de {currency.format(paymentSummary.totalExpected)}</span>
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
        ) : (
          <div className="empty-state">Aún no hay datos de pagos.</div>
        )}
      </section>

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
