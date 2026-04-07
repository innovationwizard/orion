"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useReservations } from "@/hooks/use-reservations";
import { formatCurrency, formatDate } from "@/lib/reservas/constants";
import type { ReservationPending } from "@/lib/reservas/types";
import NavBar from "@/components/nav-bar";

// ─── Types ────────────────────────────────────────────────────
interface AuditEvent {
  id: string;
  actor_email: string | null;
  event_type: string;
  resource_label: string | null;
  resource_type: string;
  created_at: string;
}

type Tab = "pendientes" | "tasas" | "docs";

// ─── Event labels for activity feed ──────────────────────────
const EVENT_LABELS: Record<string, string> = {
  "reservation.confirmed": "confirmó reserva",
  "reservation.rejected": "rechazó reserva",
  "reservation.desisted": "desistió reserva",
  "freeze.released": "liberó congelamiento",
  "rate.confirmed": "confirmó tasa EV",
  "settings.updated": "actualizó configuración",
  "salesperson.invited": "invitó a",
  "assignment.created": "asignó proyecto a",
  "assignment.ended": "desasignó proyecto de",
  "mgmt_role.created": "creó rol gerencial",
  "mgmt_role.ended": "finalizó rol gerencial",
};

// ─── Main Component ──────────────────────────────────────────
export default function OperacionesClient() {
  const { data, loading, refetch } = useReservations();
  const [activeTab, setActiveTab] = useState<Tab>("pendientes");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch audit events for activity feed
  const fetchAudit = useCallback(() => {
    setAuditLoading(true);
    fetch("/api/admin/audit-log?limit=20")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.events) setAuditEvents(d.events);
      })
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  // ─── Computed data ────────────────────────────────────────
  const pending = useMemo(
    () =>
      data
        .filter((r) => r.reservation_status === "PENDING_REVIEW")
        .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()),
    [data],
  );

  const unconfirmedRates = useMemo(
    () =>
      data.filter(
        (r) =>
          r.ejecutivo_rate != null &&
          !r.ejecutivo_rate_confirmed &&
          r.reservation_status === "CONFIRMED",
      ),
    [data],
  );

  const missingDocs = useMemo(
    () =>
      data.filter(
        (r) =>
          r.reservation_status === "CONFIRMED" &&
          !r.dpi_image_url,
      ),
    [data],
  );

  const processedToday = useMemo(() => {
    const today = new Date().toDateString();
    return data.filter(
      (r) =>
        r.reservation_status !== "PENDING_REVIEW" &&
        r.submitted_at &&
        new Date(r.submitted_at).toDateString() === today,
    ).length;
  }, [data]);

  // ─── Stats ────────────────────────────────────────────────
  const stats = [
    {
      label: "Pendientes",
      value: pending.length,
      color: pending.length > 5 ? "text-danger" : pending.length > 0 ? "text-warning" : "text-success",
    },
    {
      label: "Tasas sin confirmar",
      value: unconfirmedRates.length,
      color: unconfirmedRates.length > 0 ? "text-warning" : "text-muted",
    },
    {
      label: "Docs faltantes",
      value: missingDocs.length,
      color: missingDocs.length > 0 ? "text-warning" : "text-muted",
    },
    { label: "Procesadas hoy", value: processedToday, color: "text-text-primary" },
    { label: "Total reservas", value: data.length, color: "text-text-primary" },
  ];

  // ─── Queue data per tab ───────────────────────────────────
  const queueData: ReservationPending[] =
    activeTab === "pendientes" ? pending
    : activeTab === "tasas" ? unconfirmedRates
    : missingDocs;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pendientes", label: "Pendientes", count: pending.length },
    { id: "tasas", label: "Tasas EV", count: unconfirmedRates.length },
    { id: "docs", label: "Documentos", count: missingDocs.length },
  ];

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1600px] mx-auto">
      <NavBar />

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Centro de Operaciones</h1>
        <p className="text-sm text-muted mt-1">
          Cola de trabajo y actividad reciente
        </p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl border border-border p-4 grid gap-1"
          >
            <span className="text-xs text-muted">{s.label}</span>
            <span className={`text-2xl font-bold tabular-nums ${s.color}`}>
              {loading ? "—" : s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main content: Work Queue + Activity Feed */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Work Queue */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedId(null); }}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-text-primary border-b-2 border-text-primary -mb-px"
                    : "text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? "bg-text-primary/10" : "bg-border"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Queue List */}
          {loading ? (
            <div className="p-6 animate-pulse">
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded bg-border" />
                ))}
              </div>
            </div>
          ) : queueData.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">
              {activeTab === "pendientes" && "Sin reservas pendientes"}
              {activeTab === "tasas" && "Todas las tasas confirmadas"}
              {activeTab === "docs" && "Todos los documentos completos"}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {queueData.map((r) => (
                <QueueRow
                  key={r.reservation_id}
                  reservation={r}
                  tab={activeTab}
                  isSelected={selectedId === r.reservation_id}
                  onSelect={() =>
                    setSelectedId(
                      selectedId === r.reservation_id ? null : r.reservation_id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-text-primary">Actividad reciente</h2>
          </div>

          {auditLoading ? (
            <div className="p-4 animate-pulse">
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-border" />
                ))}
              </div>
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="p-6 text-center text-muted text-sm">
              Sin actividad reciente
            </div>
          ) : (
            <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
              {auditEvents.map((ev) => (
                <div key={ev.id} className="px-4 py-3">
                  <div className="text-sm text-text-primary">
                    <span className="font-medium">
                      {ev.actor_email?.split("@")[0] ?? "Sistema"}
                    </span>{" "}
                    <span className="text-muted">
                      {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                    </span>{" "}
                    {ev.resource_label && (
                      <span className="font-medium">{ev.resource_label}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {timeAgo(ev.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-border">
            <a
              href="/admin/audit"
              className="text-xs text-muted hover:text-text-primary transition-colors"
            >
              Ver registro completo →
            </a>
          </div>
        </div>
      </div>

      {/* Link to existing admin reservas for full detail */}
      {selectedId && (
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
          <span className="text-sm text-muted">
            Reserva seleccionada: <span className="font-medium text-text-primary">{selectedId.slice(0, 8)}…</span>
          </span>
          <a
            href={`/admin/reservas?selected=${selectedId}`}
            className="text-sm text-text-primary font-medium hover:underline"
          >
            Abrir en Reservas →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Queue Row ──────────────────────────────────────────────
function QueueRow({
  reservation: r,
  tab,
  isSelected,
  onSelect,
}: {
  reservation: ReservationPending;
  tab: Tab;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hoursAgo = Math.floor(
    (Date.now() - new Date(r.submitted_at).getTime()) / (1000 * 60 * 60),
  );

  const urgencyColor =
    tab === "pendientes"
      ? hoursAgo > 48
        ? "bg-danger"
        : hoursAgo > 24
          ? "bg-warning"
          : "bg-success"
      : "bg-muted";

  const unitLabel = r.tower_is_default
    ? `${r.project_name} ${r.unit_number}`
    : `${r.tower_name} ${r.unit_number}`;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-card-hover transition-colors ${
        isSelected ? "bg-card-hover" : ""
      }`}
    >
      {/* Urgency dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyColor}`} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-text-primary truncate">
            {unitLabel}
          </span>
          <span className="text-xs text-muted shrink-0">
            {r.salesperson_name}
          </span>
        </div>
        <div className="text-xs text-muted mt-0.5">
          {tab === "pendientes" && `hace ${hoursAgo}h`}
          {tab === "tasas" && r.ejecutivo_rate != null && `Tasa: ${r.ejecutivo_rate}%`}
          {tab === "docs" && !r.dpi_image_url && "DPI faltante"}
        </div>
      </div>

      {/* Amount or rate */}
      <div className="text-right shrink-0">
        {tab === "pendientes" && r.deposit_amount != null && (
          <span className="text-sm font-medium text-text-primary tabular-nums">
            {formatCurrency(r.deposit_amount, r.currency)}
          </span>
        )}
        {tab === "tasas" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">
            Sin confirmar
          </span>
        )}
        {tab === "docs" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">
            Incompleto
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Helpers ────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}
