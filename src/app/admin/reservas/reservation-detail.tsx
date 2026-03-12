"use client";

import { useEffect, useState } from "react";
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
              <Section title="Cliente(s)">
                {data.clients.map((c) => (
                  <Row
                    key={c.id}
                    label={c.is_primary ? "Principal" : "Adicional"}
                    value={c.rv_clients?.full_name ?? "—"}
                  />
                ))}
                {data.reservation.lead_source && (
                  <Row label="Fuente" value={data.reservation.lead_source} />
                )}
              </Section>

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

              {/* Buyer Persona profile */}
              {data.clients.length > 0 && data.clients[0].client_id && (
                <ClientProfileForm clientId={data.clients[0].client_id} />
              )}

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
