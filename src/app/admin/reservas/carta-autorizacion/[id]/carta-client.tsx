"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartaClient {
  id: string;
  client_id: string;
  is_primary: boolean;
  document_order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rv_clients: { id: string; full_name: string; dpi: string | null } | any;
}

interface CartaData {
  reservation: { id: string; unit_id: string; status: string };
  clients: CartaClient[];
  unit: { project_slug: string; project_name: string; unit_number: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Format DPI as 4-5-4 groups: "1939 39304 0101" */
function formatDpi(dpi: string): string {
  const digits = dpi.replace(/\D/g, "");
  if (digits.length !== 13) return dpi;
  return `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9, 13)}`;
}

function formatDateLine(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = MESES[now.getMonth()];
  const year = now.getFullYear();
  return `Guatemala, ${day} de ${month} de ${year}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CartaClient({ reservationId }: { reservationId: string }) {
  const [data, setData] = useState<CartaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/reservas/admin/carta-autorizacion/${reservationId}`)
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

      // Download directly
      const unitNum = data?.unit?.unit_number ?? "unidad";
      pdf.save(`Carta_Autorizacion_${unitNum}.pdf`);
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

  if (!data || !data.clients.length) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        No se encontraron clientes para esta reserva.
      </div>
    );
  }

  const dateLine = formatDateLine();
  const clients = data.clients.filter((c) => c.rv_clients);

  // Check if any client is missing DPI
  const missingDpi = clients.filter((c) => !c.rv_clients?.dpi);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Toolbar — hidden in print */}
      <div className="carta-toolbar">
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

      {/* Warning for missing DPI */}
      {missingDpi.length > 0 && (
        <div style={{
          maxWidth: 816,
          margin: "16px auto 0",
          padding: "12px 24px",
          background: "#fef3c7",
          borderRadius: 8,
          border: "1px solid #f59e0b",
          fontSize: 14,
          color: "#92400e",
        }}>
          <strong>Atención:</strong> {missingDpi.length === 1 ? "El cliente" : "Los clientes"}{" "}
          {missingDpi.map((c) => c.rv_clients.full_name).join(", ")}{" "}
          no {missingDpi.length === 1 ? "tiene" : "tienen"} DPI registrado.
          Edite los datos del cliente desde el detalle de la reserva antes de generar la carta.
        </div>
      )}

      {/* Document — one letter per client */}
      <div ref={documentRef}>
        {clients.map((client, idx) => (
          <div
            key={client.id}
            className="carta-document"
            style={idx > 0 ? { pageBreakBefore: "always" } : undefined}
          >
            {/* Date — right aligned */}
            <p style={{ textAlign: "right", marginBottom: 60 }}>
              {dateLine}
            </p>

            {/* Addressee */}
            <p style={{ marginBottom: 0 }}>Señores:</p>
            <p style={{ marginBottom: 0, marginTop: 0 }}><strong>Inmobiliaria El Gran Jaguar, S.A.</strong></p>
            <p style={{ marginTop: 0, marginBottom: 40 }}>Presente.</p>

            {/* Greeting */}
            <p style={{ marginBottom: 24 }}>Estimados señores:</p>

            {/* Body */}
            <p style={{ textAlign: "justify", lineHeight: 1.8 }}>
              De conformidad con los términos del Artículo 64 de la ley de Acceso a la
              Información Pública, autorizo expresamente para que puedan adquirir de cualquier
              entidad los estudios con mi información a fin de tramitar, analizar y resolver mi
              solicitud para obtener financiamiento relacionado con la compra de vivienda,
              liberación de gravámenes hipotecarios o renegociación de créditos hipotecarios,
              liberándolos de las responsabilidades descritas en dicho artículo.
            </p>

            {/* Client info */}
            <div style={{ marginTop: 48 }}>
              <p style={{ marginBottom: 8 }}>
                Nombre:&ensp;{client.rv_clients.full_name}.
              </p>
              <p style={{ marginTop: 16, marginBottom: 0 }}>
                DPI: {client.rv_clients.dpi ? formatDpi(client.rv_clients.dpi) : "________________"}.
              </p>
            </div>

            {/* Signature line */}
            <p style={{ textAlign: "center", marginTop: 80 }}>
              Firma_____________________________________
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Print + screen CSS
// ---------------------------------------------------------------------------

const printStyles = `
  @media print {
    .carta-toolbar { display: none !important; }

    @page {
      size: letter;
      margin: 2.54cm 3cm;
    }

    body {
      margin: 0;
      padding: 0;
    }

    .carta-document {
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

    .carta-document p {
      orphans: 3;
      widows: 3;
    }
  }

  @media screen {
    body {
      background: #f0f0f0;
      margin: 0;
    }

    .carta-toolbar {
      position: sticky;
      top: 0;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .carta-document {
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

    .carta-document p {
      margin: 12px 0;
    }
  }
`;
