"use client";

import { useState, useEffect, useCallback } from "react";
import NavBar from "@/components/nav-bar";

interface AuditEvent {
  id: string;
  actor_id: string;
  actor_role: string;
  actor_email: string | null;
  event_type: string;
  resource_type: string;
  resource_id: string | null;
  resource_label: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  http_method: string | null;
  http_path: string | null;
  created_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  "reservation.confirmed": "Reserva confirmada",
  "reservation.rejected": "Reserva rechazada",
  "reservation.desisted": "Reserva desistida",
  "freeze.released": "Congelamiento liberado",
  "rate.confirmed": "Tasa EV confirmada",
  "settings.updated": "Configuración actualizada",
  "salesperson.invited": "Asesor invitado",
  "assignment.created": "Proyecto asignado",
  "assignment.ended": "Proyecto desasignado",
  "mgmt_role.created": "Rol gerencial creado",
  "mgmt_role.ended": "Rol gerencial finalizado",
};

const RESOURCE_LABELS: Record<string, string> = {
  reservation: "Reserva",
  freeze_request: "Congelamiento",
  sale: "Venta",
  system_settings: "Configuración",
  salesperson: "Asesor",
  project_assignment: "Asignación",
  management_role: "Rol gerencial",
};

const PAGE_SIZE = 50;

export default function AuditClient() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (eventTypeFilter) params.set("event_type", eventTypeFilter);
    if (resourceTypeFilter) params.set("resource_type", resourceTypeFilter);

    fetch(`/api/admin/audit-log?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setEvents(d.events);
          setTotal(d.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, eventTypeFilter, resourceTypeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleFilterChange() {
    setPage(0);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <NavBar />

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Auditoría</h1>
        <p className="text-sm text-muted mt-1">Registro de acciones administrativas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={eventTypeFilter}
          onChange={(e) => { setEventTypeFilter(e.target.value); handleFilterChange(); }}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-text-primary"
        >
          <option value="">Todos los eventos</option>
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={resourceTypeFilter}
          onChange={(e) => { setResourceTypeFilter(e.target.value); handleFilterChange(); }}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-text-primary"
        >
          <option value="">Todos los recursos</option>
          {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <span className="text-xs text-muted ml-auto">
          {total} evento{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 animate-pulse">
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-border" />
              ))}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            Sin eventos de auditoría
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Recurso</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <>
                  <tr
                    key={ev.id}
                    className="border-b border-border/50 hover:bg-card-hover cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                  >
                    <td className="px-4 py-3 text-muted whitespace-nowrap tabular-nums">
                      {formatTimestamp(ev.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary">{ev.actor_email?.split("@")[0] ?? "—"}</div>
                      <div className="text-xs text-muted">{ev.actor_role}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary">
                        {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary">
                        {ev.resource_label ?? ev.resource_id ?? "—"}
                      </div>
                      <div className="text-xs text-muted">
                        {RESOURCE_LABELS[ev.resource_type] ?? ev.resource_type}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className={`inline-block transition-transform ${expandedId === ev.id ? "rotate-90" : ""}`}>
                        ▶
                      </span>
                    </td>
                  </tr>
                  {expandedId === ev.id && (
                    <tr key={`${ev.id}-detail`} className="border-b border-border/50 bg-card-hover/50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-2 text-xs">
                          {ev.details && (
                            <div>
                              <span className="text-muted font-medium">Detalles: </span>
                              <pre className="mt-1 p-2 bg-card rounded border border-border overflow-x-auto text-text-primary">
                                {JSON.stringify(ev.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-muted">
                            {ev.http_method && ev.http_path && (
                              <span>{ev.http_method} {ev.http_path}</span>
                            )}
                            {ev.ip_address && <span>IP: {ev.ip_address}</span>}
                            <span>ID: {ev.id}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-border bg-card disabled:opacity-40 hover:bg-card-hover transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-border bg-card disabled:opacity-40 hover:bg-card-hover transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();

  if (sameDay) {
    return d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
  }

  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
