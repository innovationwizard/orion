"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RESERVATION_STATUS_LABELS,
  UNIT_STATUS_LABELS,
  BUYER_ROLE_LABELS_SHORT,
  formatCurrency,
  formatDate,
} from "@/lib/reservas/constants";
import type {
  Reservation,
  UnitFull,
  Salesperson,
  ReceiptExtraction,
  UnitStatusLog,
  RvBuyerRole,
  CotizadorConfigRow,
} from "@/lib/reservas/types";
import { computeEnganche, configFromDefaults, scheduleToOverrides } from "@/lib/reservas/cotizador";
import { resolveConfig } from "@/hooks/use-cotizador-config";
import InstallmentTable from "@/app/cotizador/installment-table";
import ReceiptViewer from "./receipt-viewer";
import AuditLog from "./audit-log";
import ActionConfirmDialog from "./action-confirm-dialog";

type ClientLink = {
  id: string;
  client_id: string;
  is_primary: boolean;
  role: RvBuyerRole;
  ownership_pct: number | null;
  document_order: number;
  signs_pcv: boolean;
  rv_clients: { id: string; full_name: string; phone: string | null; email: string | null; dpi: string | null } | null;
};

type SaleRateData = {
  sale_id: string;
  ejecutivo_rate: number | null;
  ejecutivo_rate_confirmed: boolean;
  ejecutivo_rate_confirmed_at: string | null;
  ejecutivo_rate_confirmed_by: string | null;
};

type MonthlySaleContext = {
  reservation_id: string;
  submitted_at: string;
  project_name: string;
  project_slug: string;
  tower_name: string;
  unit_number: string;
  unit_type: string;
  deposit_amount: number | null;
  ejecutivo_rate: number | null;
  ejecutivo_rate_confirmed: boolean;
  is_current: boolean;
};

type DetailData = {
  reservation: Reservation;
  clients: ClientLink[];
  extractions: ReceiptExtraction[];
  unit: UnitFull | null;
  salesperson: Pick<Salesperson, "id" | "full_name" | "display_name" | "phone" | "email"> | null;
  audit_log: UnitStatusLog[];
  sale_rate: SaleRateData | null;
  monthly_context: MonthlySaleContext[] | null;
  cotizador_configs: CotizadorConfigRow[];
};

type Props = {
  reservationId: string;
  adminUserId: string;
  userRole: string | null;
  onClose: () => void;
  onActionComplete: () => void;
};

type ActionType = "confirm" | "reject" | "desist" | null;

export default function ReservationDetail({
  reservationId,
  adminUserId,
  userRole,
  onClose,
  onActionComplete,
}: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({ full_name: "", phone: "", email: "", dpi: "" });
  const [clientSaving, setClientSaving] = useState(false);
  const [clientMsg, setClientMsg] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateMsg, setRateMsg] = useState<string | null>(null);

  // Enganche schedule editing
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<number, number>>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const sortedClients = data?.clients.slice().sort((a, b) => a.document_order - b.document_order) ?? [];
  const editingClientLink = sortedClients.find((c) => c.client_id === editingClientId);

  const startEditClient = useCallback((cl: ClientLink) => {
    if (!cl.rv_clients) return;
    const c = cl.rv_clients;
    setClientForm({
      full_name: c.full_name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      dpi: c.dpi ?? "",
    });
    setClientMsg(null);
    setEditingClientId(cl.client_id);
  }, []);

  const saveClient = useCallback(async () => {
    if (!editingClientLink?.rv_clients) return;
    setClientSaving(true);
    setClientMsg(null);
    try {
      const payload: Record<string, string | null> = {};
      const orig = editingClientLink.rv_clients;
      if (clientForm.full_name && clientForm.full_name !== orig.full_name) payload.full_name = clientForm.full_name;
      if (clientForm.phone !== (orig.phone ?? "")) payload.phone = clientForm.phone || null;
      if (clientForm.email !== (orig.email ?? "")) payload.email = clientForm.email || null;
      if (clientForm.dpi !== (orig.dpi ?? "")) payload.dpi = clientForm.dpi || null;

      if (Object.keys(payload).length === 0) {
        setEditingClientId(null);
        return;
      }

      const res = await fetch(`/api/reservas/admin/clients/${editingClientLink.rv_clients.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? `HTTP ${res.status}`);

      // Update local state
      if (data && editingClientLink.rv_clients) {
        editingClientLink.rv_clients.full_name = result.full_name;
        editingClientLink.rv_clients.phone = result.phone;
        editingClientLink.rv_clients.email = result.email;
        editingClientLink.rv_clients.dpi = result.dpi;
        setData({ ...data });
      }
      setClientMsg("Guardado");
      setEditingClientId(null);
    } catch (e) {
      setClientMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setClientSaving(false);
    }
  }, [editingClientLink, clientForm, data]);

  const confirmRate = useCallback(async () => {
    const saleRate = data?.sale_rate;
    if (!saleRate) return;
    const pct = parseFloat(rateInput);
    if (isNaN(pct) || pct < 0 || pct > 5) {
      setRateMsg("Tasa inválida (0–5%)");
      return;
    }
    setRateSaving(true);
    setRateMsg(null);
    try {
      const res = await fetch(`/api/reservas/admin/sales/${saleRate.sale_id}/ejecutivo-rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ejecutivo_rate: pct / 100 }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? `HTTP ${res.status}`);
      // Update local state
      if (data) {
        setData({
          ...data,
          sale_rate: {
            ...saleRate,
            ejecutivo_rate: result.ejecutivo_rate,
            ejecutivo_rate_confirmed: result.ejecutivo_rate_confirmed,
            ejecutivo_rate_confirmed_at: new Date().toISOString(),
            ejecutivo_rate_confirmed_by: adminUserId,
          },
        });
      }
      setRateMsg("Confirmada");
      onActionComplete();
    } catch (e) {
      setRateMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setRateSaving(false);
    }
  }, [data, rateInput, adminUserId, onActionComplete]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/reservas/admin/reservations/${reservationId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reservationId]);

  // Initialize rate input when data loads
  useEffect(() => {
    if (data?.sale_rate?.ejecutivo_rate != null) {
      setRateInput(String(+(data.sale_rate.ejecutivo_rate * 100).toFixed(4)));
    }
    setRateMsg(null);
  }, [data?.sale_rate?.ejecutivo_rate]);

  async function handleAction(endpoint: string, body: Record<string, unknown>) {
    const res = await fetch(
      `/api/reservas/admin/reservations/${reservationId}/${endpoint}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Error" }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    setAction(null);
    onActionComplete();
  }

  const isPending = data?.reservation.status === "PENDING_REVIEW";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Side panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-card z-50 overflow-y-auto transition-transform duration-300 translate-x-0">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-text-primary">Detalle de reserva</h3>
          <button
            type="button"
            className="text-muted hover:text-text-primary text-xl leading-none"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="p-5 grid gap-5">
          {loading && (
            <div className="grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-border animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>
          )}

          {data && (
            <>
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                  {RESERVATION_STATUS_LABELS[data.reservation.status] ?? data.reservation.status}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(data.reservation.created_at)}
                </span>
              </div>

              {/* Unit info */}
              {data.unit && (
                <Section title="Unidad">
                  <Row label="Unidad" value={data.unit.unit_number} />
                  <Row label="Proyecto" value={data.unit.project_name} />
                  {data.unit.project_slug !== "santa-elena" && <Row label="Torre" value={data.unit.tower_name} />}
                  {data.unit.project_slug !== "santa-elena" && <Row label="Piso" value={String(data.unit.floor_number)} />}
                  <Row label="Tipo" value={`${data.unit.unit_type}${data.unit.bedrooms > 0 ? ` · ${data.unit.bedrooms} dorm.` : ""}`} />
                  {data.unit.area_lot ? <Row label="Terreno" value={`${data.unit.area_lot} m²`} /> : null}
                  <Row label="Precio" value={formatCurrency(data.unit.price_list, data.unit.currency)} />
                  <Row label="Estado" value={UNIT_STATUS_LABELS[data.unit.status]} />
                </Section>
              )}

              {/* Clients */}
              <div className="grid gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Cliente(s)</h4>
                {clientMsg && (
                  <span className={`text-xs ${clientMsg === "Guardado" ? "text-success" : "text-danger"}`}>
                    {clientMsg}
                  </span>
                )}
                {sortedClients.map((c) => (
                  <div key={c.id} className="border border-border rounded-lg px-3 py-2 grid gap-1.5 text-sm">
                    {editingClientId === c.client_id && c.rv_clients ? (
                      <>
                        <label className="grid gap-0.5">
                          <span className="text-xs text-muted">Nombre</span>
                          <input
                            className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full"
                            value={clientForm.full_name}
                            onChange={(e) => setClientForm((f) => ({ ...f, full_name: e.target.value }))}
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <label className="grid gap-0.5">
                            <span className="text-xs text-muted">DPI</span>
                            <input
                              className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full"
                              value={clientForm.dpi}
                              onChange={(e) => setClientForm((f) => ({ ...f, dpi: e.target.value }))}
                              placeholder="Número de DPI"
                            />
                          </label>
                          <label className="grid gap-0.5">
                            <span className="text-xs text-muted">Teléfono</span>
                            <input
                              className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full"
                              value={clientForm.phone}
                              onChange={(e) => setClientForm((f) => ({ ...f, phone: e.target.value }))}
                            />
                          </label>
                        </div>
                        <label className="grid gap-0.5">
                          <span className="text-xs text-muted">Email</span>
                          <input
                            type="email"
                            className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full"
                            value={clientForm.email}
                            onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))}
                          />
                        </label>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                            onClick={saveClient}
                            disabled={clientSaving}
                          >
                            {clientSaving ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            type="button"
                            className="flex-1 py-1.5 rounded-lg border border-border text-muted text-xs font-medium hover:bg-bg transition-colors"
                            onClick={() => setEditingClientId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">{c.rv_clients?.full_name ?? "—"}</span>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                              {BUYER_ROLE_LABELS_SHORT[c.role] ?? (c.is_primary ? "Principal" : "Adicional")}
                            </span>
                            {c.ownership_pct != null && c.ownership_pct < 100 && (
                              <span className="text-[10px] text-muted">{c.ownership_pct}%</span>
                            )}
                          </div>
                          {c.rv_clients && (
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline font-medium"
                              onClick={() => startEditClient(c)}
                            >
                              Editar
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {c.rv_clients?.dpi && <Row label="DPI" value={c.rv_clients.dpi} />}
                          {c.rv_clients?.phone && <Row label="Tel." value={c.rv_clients.phone} />}
                          {c.rv_clients?.email && <Row label="Email" value={c.rv_clients.email} />}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {data.reservation.lead_source && (
                  <div className="grid grid-cols-2 gap-1.5 text-sm">
                    <Row label="Fuente" value={data.reservation.lead_source} />
                  </div>
                )}
              </div>

              {/* Salesperson */}
              {data.salesperson && (
                <Section title="Asesor">
                  <Row label="Nombre" value={data.salesperson.display_name} />
                  {data.salesperson.phone && <Row label="Tel." value={data.salesperson.phone} />}
                </Section>
              )}

              {/* Tasa EV (033) — show for any sale_rate, including NULL rates */}
              {data.sale_rate && (
                <div className="grid gap-2 bg-success/5 border border-success/15 rounded-lg p-3 -mx-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-success">Tasa EV</h4>
                  <div className="grid grid-cols-2 gap-1.5 text-sm">
                    {data.sale_rate.ejecutivo_rate != null ? (
                      <Row
                        label="Tasa"
                        value={`${+(data.sale_rate.ejecutivo_rate * 100).toFixed(4)}%`}
                      />
                    ) : (
                      <Row label="Tasa" value="—" />
                    )}
                    <span className="text-muted">Estado</span>
                    <span className={`font-medium ${
                      data.sale_rate.ejecutivo_rate_confirmed
                        ? "text-success"
                        : data.sale_rate.ejecutivo_rate == null
                          ? "text-danger"
                          : "text-warning"
                    }`}>
                      {data.sale_rate.ejecutivo_rate_confirmed
                        ? "Confirmada"
                        : data.sale_rate.ejecutivo_rate == null
                          ? "No asignada"
                          : "Pendiente"}
                    </span>
                    {data.sale_rate.ejecutivo_rate_confirmed && data.sale_rate.ejecutivo_rate_confirmed_at && (
                      <Row label="Confirmada" value={formatDate(data.sale_rate.ejecutivo_rate_confirmed_at)} />
                    )}
                  </div>
                  {/* Monthly sales context for CFO audit */}
                  {data.monthly_context && data.monthly_context.length > 0 && (
                    <MonthlyContext entries={data.monthly_context} />
                  )}
                  {userRole === "master" && (
                    <div className="grid gap-1.5 mt-1">
                      <label className="grid gap-0.5">
                        <span className="text-xs text-muted">Tasa ejecutivo (%)</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full tabular-nums"
                          value={rateInput}
                          onChange={(e) => { setRateInput(e.target.value); setRateMsg(null); }}
                          placeholder="Ej: 1.25"
                        />
                      </label>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                        onClick={confirmRate}
                        disabled={rateSaving || !rateInput}
                      >
                        {rateSaving ? "Confirmando..." : data.sale_rate.ejecutivo_rate == null ? "Asignar y confirmar" : "Confirmar tasa"}
                      </button>
                      {rateMsg && (
                        <span className={`text-xs ${rateMsg === "Confirmada" ? "text-success" : "text-danger"}`}>
                          {rateMsg}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Deposit */}
              <Section title="Depósito">
                <Row label="Monto" value={formatCurrency(data.reservation.deposit_amount, data.unit?.currency)} />
                <Row label="Fecha" value={formatDate(data.reservation.deposit_date)} />
                <Row label="Banco" value={data.reservation.deposit_bank ?? "—"} />
                <Row label="Depositante" value={data.reservation.depositor_name ?? "—"} />
              </Section>

              {/* Plan de Enganche */}
              {data.reservation.status === "CONFIRMED" && data.unit && (() => {
                const configs = data.cotizador_configs ?? [];
                const cfg = configs.length
                  ? resolveConfig(configs, data.unit!.tower_id ?? null, data.unit!.unit_type ?? null, data.unit!.bedrooms ?? null)
                  : configFromDefaults();
                const price = data.reservation.sale_price ?? data.unit!.price_list ?? 0;
                const enganchePct = data.reservation.enganche_pct != null ? Number(data.reservation.enganche_pct) : cfg.enganche_pct;
                const cuotasCount = data.reservation.cuotas_enganche ?? cfg.installment_months;
                const reservaAmt = data.reservation.deposit_amount ?? cfg.reserva_default;

                // Use schedule overrides for editing, or saved schedule, or uniform
                const activeOverrides = editingSchedule
                  ? scheduleOverrides
                  : data.reservation.enganche_schedule
                    ? scheduleToOverrides(data.reservation.enganche_schedule)
                    : undefined;

                const enganche = computeEnganche(price, cfg, enganchePct, reservaAmt, cuotasCount, activeOverrides);
                const hasCustomSchedule = data.reservation.enganche_schedule != null;

                const saveSchedule = async () => {
                  setScheduleSaving(true);
                  setScheduleMsg(null);
                  try {
                    // Convert current installments (excluding reserva) to schedule array
                    const schedule = enganche.installments
                      .filter((i) => i.number > 0)
                      .map((i) => ({ cuota: i.number, amount: i.amount }));

                    const res = await fetch(`/api/reservas/admin/reservations/${reservationId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enganche_schedule: schedule }),
                    });

                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: "Error" }));
                      throw new Error(err.error ?? `HTTP ${res.status}`);
                    }

                    setScheduleMsg("Guardado");
                    setEditingSchedule(false);
                    // Refresh data
                    fetch(`/api/reservas/admin/reservations/${reservationId}`)
                      .then((r) => r.json())
                      .then(setData);
                  } catch (e) {
                    setScheduleMsg(e instanceof Error ? e.message : "Error");
                  } finally {
                    setScheduleSaving(false);
                  }
                };

                const clearSchedule = async () => {
                  setScheduleSaving(true);
                  setScheduleMsg(null);
                  try {
                    const res = await fetch(`/api/reservas/admin/reservations/${reservationId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enganche_schedule: null }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: "Error" }));
                      throw new Error(err.error ?? `HTTP ${res.status}`);
                    }
                    setScheduleMsg("Restaurado a uniforme");
                    setEditingSchedule(false);
                    setScheduleOverrides({});
                    fetch(`/api/reservas/admin/reservations/${reservationId}`)
                      .then((r) => r.json())
                      .then(setData);
                  } catch (e) {
                    setScheduleMsg(e instanceof Error ? e.message : "Error");
                  } finally {
                    setScheduleSaving(false);
                  }
                };

                return (
                  <Section title="Plan de Enganche">
                    <div className="col-span-2 grid gap-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div><span className="text-muted">Enganche</span><br /><span className="font-medium">{Math.round(enganchePct * 100)}%</span></div>
                        <div><span className="text-muted">Cuotas</span><br /><span className="font-medium">{cuotasCount}</span></div>
                        <div><span className="text-muted">Total</span><br /><span className="font-medium">{formatCurrency(enganche.enganche_total, cfg.currency)}</span></div>
                        <div><span className="text-muted">Tipo</span><br /><span className="font-medium">{hasCustomSchedule ? "Personalizado" : "Uniforme"}</span></div>
                      </div>

                      <InstallmentTable
                        installments={enganche.installments}
                        currency={cfg.currency}
                        editing={editingSchedule}
                        overrides={scheduleOverrides}
                        onOverride={(cuotaNumber, amount) => {
                          setScheduleOverrides((prev) => ({ ...prev, [cuotaNumber]: amount }));
                        }}
                        onClearOverride={(cuotaNumber) => {
                          setScheduleOverrides((prev) => {
                            const next = { ...prev };
                            delete next[cuotaNumber];
                            return next;
                          });
                        }}
                        maxOverride={(cuotaNumber) => {
                          const otherSum = Object.entries(scheduleOverrides)
                            .filter(([k]) => Number(k) !== cuotaNumber)
                            .reduce((s, [, v]) => s + v, 0);
                          const otherNon = cuotasCount
                            - Object.keys(scheduleOverrides).filter((k) => Number(k) !== cuotaNumber).length
                            - 1;
                          return Math.max(1, enganche.enganche_neto - otherSum - otherNon);
                        }}
                      />

                      <div className="flex gap-2 flex-wrap">
                        {!editingSchedule ? (
                          <button
                            type="button"
                            className="text-xs text-primary underline cursor-pointer"
                            onClick={() => {
                              // Initialize overrides from saved schedule if any
                              if (data.reservation.enganche_schedule) {
                                setScheduleOverrides(scheduleToOverrides(data.reservation.enganche_schedule));
                              } else {
                                setScheduleOverrides({});
                              }
                              setScheduleMsg(null);
                              setEditingSchedule(true);
                            }}
                          >
                            Personalizar cuotas
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="px-3 py-1 rounded bg-primary text-white text-xs font-medium disabled:opacity-50"
                              disabled={scheduleSaving || Object.keys(scheduleOverrides).length === 0}
                              onClick={saveSchedule}
                            >
                              {scheduleSaving ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 rounded border border-border text-xs font-medium"
                              onClick={() => {
                                setEditingSchedule(false);
                                setScheduleOverrides({});
                                setScheduleMsg(null);
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {hasCustomSchedule && !editingSchedule && (
                          <button
                            type="button"
                            className="text-xs text-muted underline cursor-pointer"
                            onClick={clearSchedule}
                            disabled={scheduleSaving}
                          >
                            Restaurar uniforme
                          </button>
                        )}
                        {scheduleMsg && (
                          <span className={`text-xs ${scheduleMsg === "Guardado" || scheduleMsg.startsWith("Restaurado") ? "text-success" : "text-danger"}`}>
                            {scheduleMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  </Section>
                );
              })()}

              {/* Receipt + OCR */}
              <ReceiptViewer
                imageUrl={data.reservation.receipt_image_url}
                extractions={data.extractions}
                currency={data.unit?.currency}
              />

              {/* PCV Generation — B5 only */}
              {data.unit?.project_slug === "boulevard-5" &&
               (data.reservation.status === "CONFIRMED" || data.reservation.status === "PENDING_REVIEW") && (
                <Section title="Documentos">
                  <div className="col-span-2 grid gap-2">
                    <button
                      type="button"
                      className="w-full py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
                      onClick={() => window.open(`/admin/reservas/pcv/${reservationId}`, "_blank")}
                    >
                      {data.reservation.pcv_url ? "Regenerar PCV" : "Generar PCV"}
                    </button>
                    <button
                      type="button"
                      className="w-full py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
                      onClick={() => window.open(`/admin/reservas/carta-autorizacion/${reservationId}`, "_blank")}
                    >
                      Carta de Autorización
                    </button>
                    <button
                      type="button"
                      className="w-full py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
                      onClick={() => window.open(`/admin/reservas/carta-pago/${reservationId}`, "_blank")}
                    >
                      Carta de Pago
                    </button>
                    {data.reservation.pcv_url && (
                      <a
                        href={data.reservation.pcv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-lg bg-primary/10 text-primary font-medium text-sm text-center hover:bg-primary/15 transition-colors block"
                      >
                        Ver PCV guardado
                      </a>
                    )}
                    {data.reservation.pcv_generated_at && (
                      <span className="text-xs text-muted">
                        Generado: {formatDate(data.reservation.pcv_generated_at)}
                      </span>
                    )}
                  </div>
                </Section>
              )}

              {/* Notes */}
              {data.reservation.notes && (
                <Section title="Notas">
                  <p className="col-span-2 text-sm text-text-primary whitespace-pre-wrap">
                    {data.reservation.notes}
                  </p>
                </Section>
              )}

              {/* Audit log */}
              <AuditLog entries={data.audit_log} />

              {/* Actions */}
              {isPending && (
                <div className="sticky bottom-0 bg-card border-t border-border -mx-5 px-5 py-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2.5 rounded-lg bg-success text-white font-medium text-sm hover:bg-success/90 transition-colors"
                    onClick={() => setAction("confirm")}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2.5 rounded-lg bg-danger text-white font-medium text-sm hover:bg-danger/90 transition-colors"
                    onClick={() => setAction("reject")}
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2.5 rounded-lg border border-border text-muted font-medium text-sm hover:bg-bg transition-colors"
                    onClick={() => setAction("desist")}
                  >
                    Desistir
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action dialogs */}
      {action === "confirm" && (
        <ActionConfirmDialog
          title="Confirmar reserva"
          description="Esta acción marcará la reserva como confirmada y la unidad como vendida."
          confirmLabel="Confirmar"
          onConfirm={async () => {
            await handleAction("confirm", { admin_user_id: adminUserId });
          }}
          onCancel={() => setAction(null)}
        />
      )}

      {action === "reject" && (
        <ActionConfirmDialog
          title="Rechazar reserva"
          description="Esta acción rechazará la reserva y liberará la unidad."
          confirmLabel="Rechazar"
          confirmVariant="danger"
          requireReason
          onConfirm={async (reason) => {
            await handleAction("reject", { admin_user_id: adminUserId, reason });
          }}
          onCancel={() => setAction(null)}
        />
      )}

      {action === "desist" && (
        <ActionConfirmDialog
          title="Registrar desistimiento"
          description="Esta acción registrará un desistimiento y liberará la unidad."
          confirmLabel="Registrar desistimiento"
          confirmVariant="danger"
          requireReason
          requireDate
          onConfirm={async (reason, date) => {
            await handleAction("desist", {
              admin_user_id: adminUserId,
              reason,
              desistimiento_date: date,
            });
          }}
          onCancel={() => setAction(null)}
        />
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h4>
      <div className="grid grid-cols-2 gap-1.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </>
  );
}

const PROJECT_INITIALS: Record<string, string> = {
  "boulevard-5": "B5",
  "benestare": "BEN",
  "bosque-las-tapias": "BLT",
  "casa-elisa": "CE",
};

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "short" });
}

function MonthlyContext({ entries }: { entries: MonthlySaleContext[] }) {
  const monthLabel = new Date(entries[0].submitted_at).toLocaleDateString("es-GT", { month: "long", year: "numeric" });
  return (
    <div className="bg-success/10 rounded-md p-2.5 mt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-success">
          Ventas del asesor — {monthLabel}
        </span>
        <span className="text-[10px] text-success font-medium">{entries.length}</span>
      </div>
      <div className="grid gap-px">
        {entries.map((e) => (
          <div
            key={e.reservation_id}
            className={`grid grid-cols-[3.2rem_2rem_3.5rem_2.8rem_3rem_auto_2.5rem] gap-1 items-center text-[10px] py-0.5 px-1 rounded ${
              e.is_current ? "bg-success/15 font-semibold" : ""
            }`}
          >
            <span className="text-muted tabular-nums">{shortDate(e.submitted_at)}</span>
            <span className="font-medium">{PROJECT_INITIALS[e.project_slug] ?? e.project_slug}</span>
            <span className="text-muted truncate" title={e.tower_name}>{e.tower_name}</span>
            <span className="tabular-nums">{e.unit_number}</span>
            <span className="text-muted truncate">{e.unit_type}</span>
            <span className="tabular-nums text-right">
              {e.deposit_amount != null ? formatCurrency(e.deposit_amount, e.project_slug === "santa-elena" ? "USD" : "GTQ") : "—"}
            </span>
            <span className={`tabular-nums text-right font-medium ${
              e.ejecutivo_rate_confirmed ? "text-success" : e.ejecutivo_rate != null ? "text-warning" : "text-muted"
            }`}>
              {e.ejecutivo_rate != null ? `${+(e.ejecutivo_rate * 100).toFixed(2)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
