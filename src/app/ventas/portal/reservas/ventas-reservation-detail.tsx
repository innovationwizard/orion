"use client";

import { useEffect, useState } from "react";
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
  ReceiptExtraction,
  UnitStatusLog,
  RvBuyerRole,
} from "@/lib/reservas/types";
import ReceiptViewer from "@/app/admin/reservas/receipt-viewer";
import AuditLog from "@/app/admin/reservas/audit-log";

type ClientLink = {
  id: string;
  client_id: string;
  is_primary: boolean;
  role: RvBuyerRole;
  ownership_pct: number | null;
  document_order: number;
  signs_pcv: boolean;
  rv_clients: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    dpi: string | null;
  } | null;
};

type DetailData = {
  reservation: Reservation;
  clients: ClientLink[];
  extractions: ReceiptExtraction[];
  unit: UnitFull | null;
  audit_log: UnitStatusLog[];
};

type Props = {
  reservationId: string;
  onClose: () => void;
};

export default function VentasReservationDetail({
  reservationId,
  onClose,
}: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedClients =
    data?.clients.slice().sort((a, b) => a.document_order - b.document_order) ??
    [];

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
          <h3 className="text-lg font-bold text-text-primary">
            Detalle de reserva
          </h3>
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
                <div
                  key={i}
                  className="h-4 rounded bg-border animate-pulse"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                  {RESERVATION_STATUS_LABELS[data.reservation.status] ??
                    data.reservation.status}
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
                  {data.unit.project_slug !== "santa-elena" && <Row
                    label="Piso"
                    value={String(data.unit.floor_number)}
                  />}
                  <Row
                    label="Tipo"
                    value={`${data.unit.unit_type}${data.unit.bedrooms > 0 ? ` · ${data.unit.bedrooms} dorm.` : ""}`}
                  />
                  {data.unit.area_lot ? <Row label="Terreno" value={`${data.unit.area_lot} m²`} /> : null}
                  <Row
                    label="Precio"
                    value={formatCurrency(data.unit.price_list, data.unit.currency)}
                  />
                  <Row
                    label="Estado"
                    value={UNIT_STATUS_LABELS[data.unit.status]}
                  />
                </Section>
              )}

              {/* Clients (read-only) */}
              <div className="grid gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Cliente(s)
                </h4>
                {sortedClients.map((c) => (
                  <div
                    key={c.id}
                    className="border border-border rounded-lg px-3 py-2 grid gap-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {c.rv_clients?.full_name ?? "—"}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        {BUYER_ROLE_LABELS_SHORT[c.role] ??
                          (c.is_primary ? "Principal" : "Adicional")}
                      </span>
                      {c.ownership_pct != null && c.ownership_pct < 100 && (
                        <span className="text-[10px] text-muted">
                          {c.ownership_pct}%
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {c.rv_clients?.dpi && (
                        <Row label="DPI" value={c.rv_clients.dpi} />
                      )}
                      {c.rv_clients?.phone && (
                        <Row label="Tel." value={c.rv_clients.phone} />
                      )}
                      {c.rv_clients?.email && (
                        <Row label="Email" value={c.rv_clients.email} />
                      )}
                    </div>
                  </div>
                ))}
                {data.reservation.lead_source && (
                  <div className="grid grid-cols-2 gap-1.5 text-sm">
                    <Row label="Fuente" value={data.reservation.lead_source} />
                  </div>
                )}
              </div>

              {/* Deposit */}
              <Section title="Depósito">
                <Row
                  label="Monto"
                  value={formatCurrency(data.reservation.deposit_amount, data.unit?.currency)}
                />
                <Row
                  label="Fecha"
                  value={formatDate(data.reservation.deposit_date)}
                />
                <Row
                  label="Banco"
                  value={data.reservation.deposit_bank ?? "—"}
                />
                <Row
                  label="Depositante"
                  value={data.reservation.depositor_name ?? "—"}
                />
              </Section>

              {/* Receipt + OCR */}
              <ReceiptViewer
                imageUrl={data.reservation.receipt_image_url}
                extractions={data.extractions}
                currency={data.unit?.currency}
              />

              {/* Documents — B5 only */}
              {data.unit?.project_slug === "boulevard-5" &&
                (data.reservation.status === "CONFIRMED" ||
                  data.reservation.status === "PENDING_REVIEW") && (
                  <Section title="Documentos">
                    <div className="col-span-2 grid gap-2">
                      <button
                        type="button"
                        className="w-full py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
                        onClick={() =>
                          window.open(
                            `/ventas/dashboard/pcv/${reservationId}`,
                            "_blank",
                          )
                        }
                      >
                        Ver PCV
                      </button>
                      <button
                        type="button"
                        className="w-full py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
                        onClick={() =>
                          window.open(
                            `/ventas/dashboard/carta-autorizacion/${reservationId}`,
                            "_blank",
                          )
                        }
                      >
                        Carta de Autorización
                      </button>
                      <button
                        type="button"
                        className="w-full py-2 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
                        onClick={() =>
                          window.open(
                            `/ventas/dashboard/carta-pago/${reservationId}`,
                            "_blank",
                          )
                        }
                      >
                        Carta de Pago
                      </button>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h4>
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
