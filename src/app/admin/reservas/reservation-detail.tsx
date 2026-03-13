"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RESERVATION_STATUS_LABELS,
  UNIT_STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/reservas/constants";
import type {
  Reservation,
  UnitFull,
  Salesperson,
  ReceiptExtraction,
  UnitStatusLog,
} from "@/lib/reservas/types";
import ReceiptViewer from "./receipt-viewer";
import AuditLog from "./audit-log";
import ActionConfirmDialog from "./action-confirm-dialog";
import ClientProfileForm from "./client-profile-form";

type DetailData = {
  reservation: Reservation;
  clients: Array<{
    id: string;
    client_id: string;
    is_primary: boolean;
    rv_clients: { id: string; full_name: string; phone: string | null; email: string | null; dpi: string | null } | null;
  }>;
  extractions: ReceiptExtraction[];
  unit: UnitFull | null;
  salesperson: Pick<Salesperson, "id" | "full_name" | "display_name" | "phone" | "email"> | null;
  audit_log: UnitStatusLog[];
};

type Props = {
  reservationId: string;
  adminUserId: string;
  onClose: () => void;
  onActionComplete: () => void;
};

type ActionType = "confirm" | "reject" | "desist" | null;

export default function ReservationDetail({
  reservationId,
  adminUserId,
  onClose,
  onActionComplete,
}: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({ full_name: "", phone: "", email: "", dpi: "" });
  const [clientSaving, setClientSaving] = useState(false);
  const [clientMsg, setClientMsg] = useState<string | null>(null);

  const primaryClient = data?.clients.find((c) => c.is_primary);

  const startEditClient = useCallback(() => {
    if (!primaryClient?.rv_clients) return;
    const c = primaryClient.rv_clients;
    setClientForm({
      full_name: c.full_name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      dpi: c.dpi ?? "",
    });
    setClientMsg(null);
    setEditingClient(true);
  }, [primaryClient]);

  const saveClient = useCallback(async () => {
    if (!primaryClient?.rv_clients) return;
    setClientSaving(true);
    setClientMsg(null);
    try {
      const payload: Record<string, string | null> = {};
      const orig = primaryClient.rv_clients;
      if (clientForm.full_name && clientForm.full_name !== orig.full_name) payload.full_name = clientForm.full_name;
      if (clientForm.phone !== (orig.phone ?? "")) payload.phone = clientForm.phone || null;
      if (clientForm.email !== (orig.email ?? "")) payload.email = clientForm.email || null;
      if (clientForm.dpi !== (orig.dpi ?? "")) payload.dpi = clientForm.dpi || null;

      if (Object.keys(payload).length === 0) {
        setEditingClient(false);
        return;
      }

      const res = await fetch(`/api/reservas/admin/clients/${primaryClient.rv_clients.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? `HTTP ${res.status}`);

      // Update local state
      if (data && primaryClient.rv_clients) {
        primaryClient.rv_clients.full_name = result.full_name;
        primaryClient.rv_clients.phone = result.phone;
        primaryClient.rv_clients.email = result.email;
        primaryClient.rv_clients.dpi = result.dpi;
        setData({ ...data });
      }
      setClientMsg("Guardado");
      setEditingClient(false);
    } catch (e) {
      setClientMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setClientSaving(false);
    }
  }, [primaryClient, clientForm, data]);

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
                  <Row label="Torre" value={data.unit.tower_name} />
                  <Row label="Piso" value={String(data.unit.floor_number)} />
                  <Row label="Tipo" value={`${data.unit.unit_type} · ${data.unit.bedrooms} dorm.`} />
                  <Row label="Precio" value={formatCurrency(data.unit.price_list)} />
                  <Row label="Estado" value={UNIT_STATUS_LABELS[data.unit.status]} />
                </Section>
              )}

              {/* Clients */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Cliente(s)</h4>
                  {primaryClient?.rv_clients && !editingClient && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-medium"
                      onClick={startEditClient}
                    >
                      Editar
                    </button>
                  )}
                </div>
                {clientMsg && (
                  <span className={`text-xs ${clientMsg === "Guardado" ? "text-success" : "text-danger"}`}>
                    {clientMsg}
                  </span>
                )}
                <div className="grid grid-cols-2 gap-1.5 text-sm">
                  {editingClient && primaryClient?.rv_clients ? (
                    <>
                      <label className="grid gap-0.5 col-span-2">
                        <span className="text-xs text-muted">Nombre</span>
                        <input
                          className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full"
                          value={clientForm.full_name}
                          onChange={(e) => setClientForm((f) => ({ ...f, full_name: e.target.value }))}
                        />
                      </label>
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
                      <label className="grid gap-0.5 col-span-2">
                        <span className="text-xs text-muted">Email</span>
                        <input
                          type="email"
                          className="px-2 py-1.5 rounded-lg border border-border bg-card text-text-primary text-xs w-full"
                          value={clientForm.email}
                          onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))}
                        />
                      </label>
                      <div className="col-span-2 flex gap-2 mt-1">
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
                          onClick={() => setEditingClient(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {data.clients.map((c) => (
                        <Row
                          key={c.id}
                          label={c.is_primary ? "Principal" : "Adicional"}
                          value={c.rv_clients?.full_name ?? "—"}
                        />
                      ))}
                      {primaryClient?.rv_clients?.dpi && (
                        <Row label="DPI" value={primaryClient.rv_clients.dpi} />
                      )}
                      {primaryClient?.rv_clients?.phone && (
                        <Row label="Tel." value={primaryClient.rv_clients.phone} />
                      )}
                      {primaryClient?.rv_clients?.email && (
                        <Row label="Email" value={primaryClient.rv_clients.email} />
                      )}
                      {data.reservation.lead_source && (
                        <Row label="Fuente" value={data.reservation.lead_source} />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Buyer Persona / Client Profile — B5 only */}
              {data.unit?.project_slug === "boulevard-5" &&
               primaryClient?.client_id &&
               (data.reservation.status === "CONFIRMED" || data.reservation.status === "PENDING_REVIEW") && (
                <ClientProfileForm clientId={primaryClient.client_id} />
              )}

              {/* Salesperson */}
              {data.salesperson && (
                <Section title="Asesor">
                  <Row label="Nombre" value={data.salesperson.display_name} />
                  {data.salesperson.phone && <Row label="Tel." value={data.salesperson.phone} />}
                </Section>
              )}

              {/* Deposit */}
              <Section title="Depósito">
                <Row label="Monto" value={formatCurrency(data.reservation.deposit_amount)} />
                <Row label="Fecha" value={formatDate(data.reservation.deposit_date)} />
                <Row label="Banco" value={data.reservation.deposit_bank ?? "—"} />
                <Row label="Depositante" value={data.reservation.depositor_name ?? "—"} />
              </Section>

              {/* Receipt + OCR */}
              <ReceiptViewer
                imageUrl={data.reservation.receipt_image_url}
                extractions={data.extractions}
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
