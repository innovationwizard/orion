"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RESERVATION_STATUS_LABELS, BUYER_ROLE_LABELS_SHORT } from "@/lib/reservas/constants";
import type { RvBuyerRole, ReservationStatus } from "@/lib/reservas/types";
import ClientProfileForm from "@/app/admin/reservas/client-profile-form";

interface ClientRow {
  link_id: string;
  client_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  dpi: string | null;
  role: RvBuyerRole;
  is_primary: boolean;
  reservation_id: string | null;
  reservation_status: string | null;
  unit_number: string;
  project_name: string;
  has_profile: boolean;
  profile_completeness: number;
}

const statusColor: Record<string, string> = {
  PENDING_REVIEW: "bg-warning/15 text-warning",
  CONFIRMED: "bg-success/15 text-success",
  REJECTED: "bg-danger/15 text-danger",
  DESISTED: "bg-muted/15 text-muted",
};

export default function ClientesClient() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchClients = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/reservas/ventas/clients")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setClients)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Deduplicate by client_id (same client may appear in multiple reservations)
  const uniqueClients = useMemo(() => {
    const map = new Map<string, ClientRow & { units: string[] }>();
    for (const c of clients) {
      const existing = map.get(c.client_id);
      if (existing) {
        if (!existing.units.includes(c.unit_number)) {
          existing.units.push(c.unit_number);
        }
      } else {
        map.set(c.client_id, { ...c, units: [c.unit_number] });
      }
    }
    return [...map.values()];
  }, [clients]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return uniqueClients;
    const q = search.trim().toLowerCase();
    return uniqueClients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.dpi?.includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.units.some((u) => u.toLowerCase().includes(q)),
    );
  }, [uniqueClients, search]);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          {uniqueClients.length} clientes en tus reservas
        </div>
        <input
          type="search"
          placeholder="Buscar cliente..."
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  DPI
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Unidad(es)
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Perfil
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isExpanded = expandedClientId === c.client_id;
                return (
                  <ClientTableRow
                    key={c.client_id}
                    client={c}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedClientId(isExpanded ? null : c.client_id)
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClientTableRow({
  client,
  isExpanded,
  onToggle,
}: {
  client: ClientRow & { units: string[] };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
          isExpanded ? "bg-primary/5" : "hover:bg-bg/50"
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-medium text-text-primary">
          <div className="flex items-center gap-2">
            {client.full_name}
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
              {BUYER_ROLE_LABELS_SHORT[client.role] ??
                (client.is_primary ? "Principal" : "Adicional")}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-text-primary tabular-nums">
          {client.dpi ?? "—"}
        </td>
        <td className="px-4 py-3 text-text-primary">
          {client.phone ?? "—"}
        </td>
        <td className="px-4 py-3 text-text-primary">
          {client.units.join(", ")}
        </td>
        <td className="px-4 py-3 text-text-primary">{client.project_name}</td>
        <td className="px-4 py-3">
          {client.reservation_status && (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[client.reservation_status] ?? ""}`}
            >
              {RESERVATION_STATUS_LABELS[client.reservation_status as ReservationStatus] ??
                client.reservation_status}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${client.profile_completeness}%`,
                  backgroundColor:
                    client.profile_completeness >= 75
                      ? "var(--color-success, #22c55e)"
                      : client.profile_completeness >= 50
                        ? "var(--color-warning, #f59e0b)"
                        : "var(--color-muted)",
                }}
              />
            </div>
            <span className="text-xs text-muted tabular-nums">
              {client.profile_completeness}%
            </span>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-bg/30">
            <ClientProfileForm clientId={client.client_id} />
          </td>
        </tr>
      )}
    </>
  );
}
