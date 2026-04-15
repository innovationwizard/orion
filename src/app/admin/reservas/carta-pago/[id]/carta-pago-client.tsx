"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { computeEnganche, configFromDefaults, scheduleToOverrides } from "@/lib/reservas/cotizador";
import { resolveConfig } from "@/hooks/use-cotizador-config";
import type { CotizadorConfigRow } from "@/lib/reservas/types";
import { formatCurrency } from "@/lib/reservas/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartaPagoClient {
  id: string;
  client_id: string;
  is_primary: boolean;
  document_order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rv_clients: { id: string; full_name: string } | any;
}

interface CartaPagoData {
  reservation: {
    id: string;
    unit_id: string;
    status: string;
    created_at: string;
    sale_price: number | null;
    enganche_pct: number | null;
    cuotas_enganche: number | null;
    deposit_amount: number | null;
    enganche_schedule: { cuota: number; amount: number }[] | null;
  };
  clients: CartaPagoClient[];
  unit: {
    project_id: string;
    project_slug: string;
    project_name: string;
    unit_number: string;
    price_list: number | null;
    tower_id: string;
    unit_type: string;
    bedrooms: number;
  } | null;
  cotizador_configs: CotizadorConfigRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateLine(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = MESES[now.getMonth()];
  const year = now.getFullYear();
  return `Guatemala ${day} de ${month} del ${year}`;
}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CartaPagoClient({ reservationId }: { reservationId: string }) {
  const [data, setData] = useState<CartaPagoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/reservas/admin/carta-pago/${reservationId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reservationId]);

  const handleDownload = useCallback(async () => {
    if (!documentRef.current || saving) return;
    setSaving(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const pageWidth = 215.9;
      const pageHeight = 279.4;
      const imgWidth = pageWidth;
      const totalImgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "letter");

      let position = 0;
      let page = 0;

      while (position < totalImgHeight) {
        if (page > 0) pdf.addPage();

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        const sliceHeight = Math.min(
          canvas.height - (position / totalImgHeight) * canvas.height,
          (pageHeight / totalImgHeight) * canvas.height,
        );
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            (position / totalImgHeight) * canvas.height,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight,
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
        pdf.addImage(sliceData, "JPEG", 0, 0, imgWidth, sliceImgHeight);

        position += pageHeight;
        page++;
      }

      const unitNum = data?.unit?.unit_number ?? "unidad";
      pdf.save(`Carta_de_Pago_${unitNum}.pdf`);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert(e instanceof Error ? e.message : "Error al generar PDF");
    } finally {
      setSaving(false);
    }
  }, [saving, data]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#dc2626" }}>
        Error: {error}
      </div>
    );
  }

  if (!data || !data.clients.length || !data.unit) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        No se encontraron datos para esta reserva.
      </div>
    );
  }

  const dateLine = formatDateLine();
  const clients = data.clients.filter((c) => c.rv_clients);
  const unit = data.unit;

  // Compute cuota de enganche — use resolved project config + reservation overrides
  const reservation = data.reservation;
  const cfg = data.cotizador_configs?.length
    ? resolveConfig(data.cotizador_configs, unit.tower_id ?? null, unit.unit_type ?? null, unit.bedrooms ?? null)
    : configFromDefaults();
  const cartaCurrency: "GTQ" | "USD" = cfg.currency === "USD" ? "USD" : unit.project_slug === "santa-elena" ? "USD" : "GTQ";
  const price = reservation.sale_price ?? unit.price_list ?? 0;
  const enganchePct = reservation.enganche_pct != null ? Number(reservation.enganche_pct) : cfg.enganche_pct;
  const cuotasCount = reservation.cuotas_enganche ?? cfg.installment_months;
  const reservaAmount = reservation.deposit_amount ?? cfg.reserva_default;
  const overrides = reservation.enganche_schedule ? scheduleToOverrides(reservation.enganche_schedule) : undefined;
  const enganche = computeEnganche(
    price,
    cfg,
    enganchePct,
    reservaAmount,
    cuotasCount,
    overrides,
  );

  // Client names joined with " y "
  const clientNamesJoined = clients
    .map((c) => c.rv_clients.full_name)
    .join(" y ");

  // Signature lines — one per client
  const signatureLines = clients.map((c) => c.rv_clients.full_name);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Toolbar — hidden in print */}
      <div className="carta-pago-toolbar">
        <div style={{
          maxWidth: 816,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <a
            href="/admin/reservas"
            style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}
          >
            &larr; Reservas
          </a>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={saving}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 4,
                background: saving ? "#93c5fd" : "#2563eb",
                color: "#fff",
                cursor: saving ? "default" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Generando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div ref={documentRef}>
        <div className="carta-pago-document">
          {/* Date */}
          <p style={{ textAlign: "left", marginBottom: 48 }}>
            {dateLine}
          </p>

          {/* Title */}
          <p style={{ textAlign: "center", marginBottom: 36 }}>
            <strong>Carta de Pago</strong>
          </p>

          {/* Greeting */}
          <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: 24 }}>
            Estimado cliente en nombre de la empresa{" "}
            <strong>Puerta Abierta Inmobiliaria S.A</strong>, le damos una
            calurosa bienvenida, y con el gusto de estrechar los mejores lazos
            comerciales.
          </p>

          {/* Main body */}
          <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: 24 }}>
            Es grato comunicarle que a partir de hoy, usted forma parte del
            proyecto <strong>Boulevard 5</strong>,{" "}
            ubicado en la 10ª avenida 31-39 zona 5 Guatemala, adquiriendo el
            inmueble <strong>{unit.unit_number}</strong> por el cual deberá
            realizar el pago mensual en la cuenta: BAM MONETARIA EN QUETZALES
            Q 30 - 4027741 – 0 / o BAM MONETARIA EN DÓLARES $ 31 - 4006546 - 7,
            a nombre de Inmobiliaria El Gran Jaguar S.A,{" "}
            <strong>(el tipo de cambio en dólares será proporcionado por
            Puerta Abierta)</strong>,{" "}
            en las fechas acordadas del 15 al 20 de cada mes, por concepto de
            pago de enganche de apartamento antes mencionado y cuyo valor es de{" "}
            <strong>{formatCurrency(enganche.cuota_enganche, cartaCurrency)}</strong>.
          </p>

          {/* WhatsApp / email */}
          <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: 24 }}>
            Usted deberá enviar cada vez que realice el pago, el comprobante al
            WhatsApp 3043 3779 o al correo Patricia.Castillo@puertaabierta.com.gt
            con Patricia Castillo Asistente Comercial.
          </p>

          {/* Late payment warning */}
          <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: 24 }}>
            Recuerde que el valor del enganche del inmueble debe ser cancelado en
            las fechas establecidas, de lo contrario empezaran a generar cargos
            moratorios.
          </p>

          {/* Closing */}
          <p style={{ textAlign: "justify", lineHeight: 1.8, marginBottom: 24 }}>
            Esperamos se sienta a gusto con nuestros servicios y podamos servirle
            en las próximas inversiones o asesorías inmobiliarias.
          </p>

          {/* Sign-off */}
          <p style={{ marginBottom: 4 }}>Atentamente,</p>
          <p style={{ marginBottom: 0 }}><strong>Puerta Abierta Inmobiliaria S.A</strong></p>
          <p style={{ marginTop: 0, marginBottom: 48 }}><strong>Boulevard 5</strong></p>

          {/* Client names */}
          <p style={{ marginBottom: 48 }}>
            <strong>Firma de Enterado:</strong>{" "}
            <strong>{clientNamesJoined}</strong>
          </p>

          {/* Signature lines */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
            flexWrap: "wrap",
          }}>
            {signatureLines.map((name, idx) => (
              <div key={idx} style={{ textAlign: "center" }}>
                <strong>F: ________________________</strong>
                {signatureLines.length > 2 && (
                  <p style={{ fontSize: "9pt", color: "#555", marginTop: 4 }}>
                    {name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Print + screen CSS
// ---------------------------------------------------------------------------

const printStyles = `
  @media print {
    .carta-pago-toolbar { display: none !important; }

    @page {
      size: letter;
      margin: 2.54cm 3cm;
    }

    body {
      margin: 0;
      padding: 0;
    }

    .carta-pago-document {
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      background: white !important;
      font-family: "Calibri", "Segoe UI", "Helvetica Neue", sans-serif !important;
      font-size: 11pt !important;
      line-height: 1.6 !important;
      color: #000 !important;
    }

    .carta-pago-document p {
      orphans: 3;
      widows: 3;
    }
  }

  @media screen {
    body {
      background: #f0f0f0;
      margin: 0;
    }

    .carta-pago-toolbar {
      position: sticky;
      top: 0;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .carta-pago-document {
      max-width: 816px;
      margin: 24px auto;
      padding: 96px;
      background: #fff;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      font-family: "Calibri", "Segoe UI", "Helvetica Neue", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
    }

    .carta-pago-document p {
      margin: 12px 0;
    }
  }
`;
