"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatLegalAmount, diaEnLetras, numeroEnLetras, formatCuiLegal } from "@/lib/reservas/numero-a-letras";
import { computeEscrituracion, computeEnganche, COTIZADOR_DEFAULTS } from "@/lib/reservas/cotizador";
import { formatCurrency } from "@/lib/reservas/constants";
import { createReservasClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types — mirrors the API response shape
// ---------------------------------------------------------------------------

interface PcvClient {
  id: string;
  client_id: string;
  is_primary: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rv_clients: { id: string; full_name: string; phone: string | null; email: string | null; dpi: string | null } | any;
}

interface PcvData {
  reservation: {
    id: string;
    unit_id: string;
    status: string;
    deposit_amount: number | null;
    deposit_date: string | null;
    deposit_bank: string | null;
    notes: string | null;
    created_at: string;
  };
  clients: PcvClient[];
  unit: {
    unit_number: string;
    unit_code: string | null;
    unit_type: string;
    bedrooms: number;
    area_interior: number | null;
    area_balcony: number | null;
    area_terrace: number | null;
    area_total: number | null;
    parking_car: number;
    parking_tandem: number;
    parking_number: string | null;
    parking_level: string | null;
    parking_car_area: number | null;
    parking_tandem_area: number | null;
    bodega_number: string | null;
    bodega_area: number | null;
    price_list: number | null;
    floor_number: number;
    tower_name: string;
    project_name: string;
    project_slug: string;
  } | null;
  client_profile: {
    birth_date: string | null;
    edad: number | null;
    occupation_type: string | null;
    marital_status: string | null;
    gender: string | null;
    profession: string | null;
    domicilio: string | null;
  } | null;
  salesperson: { full_name: string; display_name: string } | null;
}

// ---------------------------------------------------------------------------
// Spanish date/number helpers
// ---------------------------------------------------------------------------

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const ANIOS_LETRAS: Record<number, string> = {
  2025: "dos mil veinticinco",
  2026: "dos mil veintiséis",
  2027: "dos mil veintisiete",
  2028: "dos mil veintiocho",
  2029: "dos mil veintinueve",
  2030: "dos mil treinta",
};

function computeAge(birthDate: string): number | null {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatArea(area: number | null): string {
  if (area == null || area === 0) return "________";
  return `${area.toFixed(2)} metros cuadrados`;
}

function mapOccupation(type: string | null): string {
  if (!type) return "________";
  const map: Record<string, string> = {
    formal: "empleado(a)",
    informal: "empleado(a)",
    independiente: "profesional independiente",
    empresario: "empresario(a)",
  };
  return map[type] ?? "________";
}

/** Blank placeholder for missing legal fields */
const BLANK = "________________________________________";
const BLANK_SHORT = "________________";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PcvClientComponent({ reservationId }: { reservationId: string }) {
  const [data, setData] = useState<PcvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/reservas/admin/pcv/${reservationId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reservationId]);

  const handleSave = useCallback(async () => {
    if (!documentRef.current || saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Dynamic imports — avoid bundling html2canvas/jspdf for users who only print
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // 2. Capture document as high-res canvas
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // 3. Create multi-page PDF (letter size: 215.9 x 279.4 mm)
      const pageWidth = 215.9;
      const pageHeight = 279.4;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "letter");

      let position = 0;
      let page = 0;

      while (position < imgHeight) {
        if (page > 0) pdf.addPage();

        // Create a temporary canvas for this page slice
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        const sliceHeight = Math.min(
          canvas.height - (position / imgHeight) * canvas.height,
          (pageHeight / imgHeight) * canvas.height,
        );
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            (position / imgHeight) * canvas.height,
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

      // 4. Upload PDF blob to Supabase Storage
      const pdfBlob = pdf.output("blob");
      const timestamp = Date.now();
      const path = `${reservationId}/${timestamp}.pdf`;

      const supabase = createReservasClient();
      const { error: uploadError } = await supabase.storage
        .from("pcv")
        .upload(path, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Error al subir PDF: ${uploadError.message}`);
      }

      // 5. Get public URL
      const { data: urlData } = supabase.storage.from("pcv").getPublicUrl(path);
      const pcvUrl = urlData.publicUrl;

      // 6. Save metadata on reservation
      const saveRes = await fetch(`/api/reservas/admin/pcv/${reservationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pcv_url: pcvUrl }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({ error: "Error" }));
        throw new Error(err.error ?? `HTTP ${saveRes.status}`);
      }

      setSaved(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setSaveError(msg);
      console.error("[PCV save]", e);
    } finally {
      setSaving(false);
    }
  }, [reservationId, saving]);

  const handleProfileSave = useCallback(async (profileData: {
    edad?: number;
    profession?: string;
    marital_status?: string;
  }) => {
    setProfileSaving(true);
    try {
      const res = await fetch(`/api/reservas/admin/pcv/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      // Refetch PCV data to reflect saved profile
      const refreshRes = await fetch(`/api/reservas/admin/pcv/${reservationId}`);
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setData(refreshed);
      }
    } catch (e) {
      console.error("[PCV profile save]", e);
    } finally {
      setProfileSaving(false);
    }
  }, [reservationId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <p>Cargando documento...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <p style={{ color: "#c00" }}>Error: {error ?? "Sin datos"}</p>
      </div>
    );
  }

  const { reservation, clients, unit, client_profile, salesperson } = data;

  if (!unit) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <p style={{ color: "#c00" }}>Error: Unidad no encontrada para esta reserva</p>
      </div>
    );
  }

  // Primary client
  const primaryClientRow = clients.find((c) => c.is_primary) ?? clients[0];
  const client = primaryClientRow?.rv_clients as { full_name: string; phone: string | null; email: string | null; dpi: string | null } | null;
  const clientName = client?.full_name ?? BLANK;
  const clientDpiRaw = client?.dpi ?? null;
  const clientDpi = clientDpiRaw ? formatCuiLegal(clientDpiRaw) : BLANK;
  const clientEmail = client?.email ?? BLANK_SHORT;

  // Age — prefer birth_date (exact), fall back to edad (SSOT snapshot)
  const age = client_profile?.birth_date
    ? computeAge(client_profile.birth_date)
    : client_profile?.edad ?? null;
  const ageText = age != null ? `${numeroEnLetras(age)} (${age})` : BLANK_SHORT;

  // Marital status
  const maritalStatus = client_profile?.marital_status ?? BLANK_SHORT;

  // Occupation — prefer profession text, fall back to occupation_type mapping
  const profession = client_profile?.profession
    ?? mapOccupation(client_profile?.occupation_type ?? null);

  // Date — use today's date for the contract
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const dayWords = diaEnLetras(day);
  const monthName = MESES[month];
  const yearWords = ANIOS_LETRAS[year] ?? `${year}`;

  // Pricing
  const price = unit.price_list ?? 0;
  const escrituracion = computeEscrituracion(price);
  const reservaAmount = reservation.deposit_amount ?? COTIZADOR_DEFAULTS.RESERVA_AMOUNT;
  const enganche = computeEnganche(
    price,
    COTIZADOR_DEFAULTS.ENGANCHE_PCT,
    reservaAmount,
    COTIZADOR_DEFAULTS.INSTALLMENT_MONTHS,
  );
  const ultimoPago = Math.max(0, price - enganche.enganche_total);

  // Unit description
  const unitDesc = `${unit.unit_type} ${unit.unit_number}`;
  const floorText = `${numeroEnLetras(unit.floor_number)} (${unit.floor_number})`;

  // Parking
  const totalParkingArea = (unit.parking_car_area ?? 0) + (unit.parking_tandem_area ?? 0);

  // Buyer domicilio (notification address)
  const domicilio = client_profile?.domicilio ?? "";

  // Detect missing PCV-critical fields
  const missingAge = age == null;
  const missingMarital = !client_profile?.marital_status;
  const missingProfession = profession === "________";
  const missingDomicilio = !domicilio;
  const hasMissing = missingAge || missingMarital || missingProfession || missingDomicilio;

  return (
    <>
      <style>{printStyles}</style>

      {/* Toolbar — hidden when printing */}
      <div className="pcv-toolbar">
        <div style={{ maxWidth: 816, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/admin/reservas" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>
              &larr; Volver a reservas
            </a>
            <span style={{ fontSize: 14, color: "#999" }}>|</span>
            <span style={{ fontSize: 14, color: "#333" }}>
              PCV &middot; {unitDesc} &middot; {clientName}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: "8px 20px",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved || hasMissing}
              title={hasMissing ? "Complete los datos faltantes antes de generar la PCV" : undefined}
              style={{
                padding: "8px 20px",
                backgroundColor: saved ? "#16a34a" : hasMissing ? "#9ca3af" : "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || saved || hasMissing ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : saved ? "Guardado" : "Guardar PCV"}
            </button>
          </div>
          {saveError && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4, textAlign: "right" }}>
              {saveError}
            </div>
          )}
        </div>
      </div>

      {/* Missing profile fields — inline form for admin to complete before printing */}
      {hasMissing && (
        <ProfileForm
          reservationId={reservationId}
          currentAge={age}
          currentMarital={client_profile?.marital_status ?? null}
          currentProfession={client_profile?.profession ?? null}
          currentDomicilio={domicilio}
          missingAge={missingAge}
          missingMarital={missingMarital}
          missingProfession={missingProfession}
          missingDomicilio={missingDomicilio}
          saving={profileSaving}
          onSave={handleProfileSave}
        />
      )}

      {/* Legal document */}
      <div className="pcv-document" ref={documentRef}>
        <h2 style={{ textAlign: "center", fontSize: "14pt", fontWeight: "bold", marginBottom: 24 }}>
          CONTRATO DE PROMESA DE COMPRAVENTA
        </h2>

        <p>
          En la Ciudad de Guatemala, el <V>{dayWords} ({day})</V> de <V>{monthName}</V> del año <V>{yearWords} ({year})</V>
        </p>

        <p>Nosotros, LAS PARTES:</p>

        <p style={{ textAlign: "center", fontWeight: "bold", marginTop: 16 }}>
          LA PARTE PROMITENTE<br />VENDEDORA
        </p>

        <p>
          LUIS ARIMANY MONZÓN, de cincuenta y dos (52) años de edad, casado, guatemalteco,
          Ingeniero Agrónomo, de este domicilio, me identifico con el Documento Personal de
          Identificación -DPI- con Código Único de Identificación -CUI- dos mil quinientos treinta
          y nueve, cero nueve mil quinientos once, cero ciento uno (2539 09511 0101), extendido por
          el Registro Nacional de las Personas -RENAP- de la República de Guatemala; actúo en mi
          calidad de Administrador Único y Representante Legal de la entidad INMOBILIARIA EL GRAN
          JAGUAR, SOCIEDAD ANÓNIMA, calidad que acredito con el acta notarial que contiene mi
          nombramiento autorizado en esta ciudad, el veintiocho de mayo de dos mil veinticuatro,
          por la Notaria Emilia Aracely Larrazabal Melgar, el cual se encuentra inscrito en el
          Registro Mercantil General de la República bajo el Registro número setecientos cuarenta
          y cuatro mil treinta y seis (744036), folio seiscientos treinta y siete (637), libro
          ochocientos treinta y dos (832) de Auxiliares de Comercio. En el transcurso del presente
          contrato se le podrá denominar a dicha entidad también como la Parte PROMITENTE VENDEDORA.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold", marginTop: 16 }}>
          LA PARTE PROMITENTE<br />COMPRADORA
        </p>

        <p>
          <V>{clientName}</V>, de <V>{ageText}</V> años de edad, <V>{maritalStatus}</V>,
          guatemalteco, <V>{profession}</V>, de este domicilio, me identifico con el Documento
          Personal de Identificación, con Código Único de Identificación
          -CUI-<V>{clientDpi}</V> extendido por el Registro Nacional de las Personas de la
          República de Guatemala, y quien actúa en nombre propio.
        </p>

        <p>
          En el transcurso del presente contrato se me podrá denominar indistintamente también
          como la Parte PROMITENTE COMPRADORA.
        </p>

        <p>
          Acordamos los comparecientes, en la calidad con la que cada uno actúa que en adelante
          podremos ser denominados indistintamente como LAS PARTES. Manifestamos LAS PARTES, en
          las calidades en las que cada uno de nosotros actuamos, ser de las generales indicadas,
          hallarnos en el libre ejercicio de nuestros derechos civiles, estar debidamente
          facultados para la celebración del presente contrato y que por este acto celebramos
          PROMESA DE COMPRAVENTA DE BIENES INMUEBLES Y DERECHOS DE PARTICIPACIÓN o ACCIÓN,
          contenido en las cláusulas siguientes:
        </p>

        {/* PRIMERA */}
        <p>
          <b>PRIMERA: ANTECEDENTES.</b> El señor Luis Arimany Monzón, en la calidad con que actúa,
          declara que su representada, la entidad INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA,
          es única y legítima propietaria del bien inmueble inscrito en el Registro General de la
          Propiedad bajo el número de finca dos mil doscientos quince (2215), folio doscientos
          siete (207), del libro seiscientos setenta (670) de Guatemala, ubicado en la décima
          avenida treinta y uno guión treinta y nueve (10 ave. 31-39) zona cinco (5), municipio
          de Guatemala, departamento de Guatemala, la cual tiene el área y las colindancias que
          aparecen en sus respectivas inscripciones registrales.
        </p>

        {/* SEGUNDA */}
        <p>
          <b>SEGUNDA: DEL PROYECTO A DESARROLLAR.</b> Continúa manifestando el señor, LUIS ARIMANY
          MONZON, en la calidad con que actúa, que su representada INMOBILIARIA EL GRAN JAGUAR,
          SOCIEDAD ANÓNIMA, desarrolla y vende, sobre el inmueble descrito en la cláusula anterior,
          un proyecto habitacional denominado BOULEVARD 5. El Edificio se conformará de diecinueve
          niveles, cinco sótanos, treinta y cuatro parqueos de visitas, cinco modelos de
          apartamentos, cuatro elevadores, locales comerciales, pocket park para coworking,
          rooftop, sky lounge, terraza con fire pit, piscina, juegos infantiles, gimnasio, pista
          de jogging alrededor del edificio.
        </p>

        {/* TERCERA */}
        <p>
          <b>TERCERA: DE LA PROMESA DE COMPRAVENTA.</b> LAS PARTES, en las calidades con que actúan,
          manifiestan que por el presente acto otorgan PROMESA DE COMPRAVENTA de los bienes que se
          identifican a continuación:
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>BIENES INMUEBLES</p>

        <p>
          Apartamento <V>{unitDesc}</V> el cual tendrá un área
          de <V>{formatArea(unit.area_total)}</V>, y estará ubicado en el
          nivel <V>{floorText}</V>. De conformidad con el plano que se adjunta a la presente
          Promesa de Compraventa, como Anexo I.
        </p>

        {totalParkingArea > 0 && (
          <p>
            Parqueo que tendrá un área de <V>{formatArea(totalParkingArea)}</V>.
          </p>
        )}

        {(unit.bodega_area != null && unit.bodega_area > 0) && (
          <p>
            Bodega que tendrá un área de <V>{formatArea(unit.bodega_area)}</V>.
          </p>
        )}

        <p>
          Las áreas arriba descritas podrán tener una variación del cinco por ciento (5%) sin cargo
          para ninguna de las partes. En el caso que la variación sea de incremento y el área de
          los bienes objeto de promesa supere el cinco por ciento (5%), la parte PROMITENTE
          COMPRADORA deberá cubrir el valor del excedente que sobrepase ese cinco por ciento (5%);
          en caso contrario, la variación sea de decremento y el área de los bienes objeto de
          promesa sea menor al noventa y cinco (95%) del área aquí estipulada, la parte PROMITENTE
          VENDEDORA deberá descontar del precio de venta el valor del faltante que sea inferior a
          ese noventa y cinco por ciento (95%).
        </p>

        <p>En adelante &quot;LOS INMUEBLES&quot;.</p>

        <p>
          Dentro de las áreas están comprendidos los tabiques, ductos y muros que las delimitan en
          los planos, y en caso de ser medianeros a la parte correspondiente.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>DERECHOS DE PARTICIPACIÓN o ACCIÓN</p>

        <p>
          Los Títulos de acciones y/o derechos de participación que correspondan al valor que más
          adelante se detalla de la entidad que se encargará de la administración de las áreas
          comunes del Edificio, de acuerdo a lo que establece el artículo doce (12) del Decreto
          diecinueve guion dos mil trece (19-2013) del Congreso de la República de Guatemala; dicha
          entidad se constituirá y regirá bajo las leyes guatemaltecas y de la cual serán
          accionistas y/o asociados únicamente los propietarios de las fincas filiales del Edificio,
          entendiéndose que la enajenación de estos títulos y/o derechos conlleva la enajenación de
          los inmuebles a los cuales están relacionados, quedando expresamente prohibido venderlos
          por separado a personas distintas.
        </p>

        <p>
          LAS PARTES, acuerdan que la promesa de compraventa se hace sobre los bienes prometidos en
          venta, como una obligación conjunta y de ninguna manera se podrá efectuar una compra
          parcial, de tal manera que la Parte PROMITENTE VENDEDORA cumple únicamente si vende todos
          los bienes que ha prometido vender y la Parte PROMITENTE COMPRADORA cumple únicamente si
          compra todos los bienes que ha prometido comprar. Las Partes acuerdan que el presente
          Contrato de Promesa de Compraventa de Bienes es un negocio condicional, sujeto al
          cumplimiento de las obligaciones que contraen los otorgantes. Hasta que se entreguen los
          Bienes Prometidos, se pague la totalidad del precio convenido y se otorgue el contrato
          definitivo de compraventa y/o escritura traslativa de dominio, todo ello en las
          condiciones estipuladas en el presente Contrato, se entenderá que la compraventa se ha
          perfeccionado.
        </p>

        <p>
          Continuamos manifestando LAS PARTES, en las calidades con las que cada uno de nosotros
          actuamos, que el presente contrato estará sujeto a los siguientes términos y condiciones:
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>DE LA PROMESA DE COMPRAVENTA</p>

        <p>
          La Parte PROMITENTE VENDEDORA, a través de su representante legal, promete vender a la
          Parte PROMITENTE COMPRADORA, los bienes inmuebles y derechos de participación/acciones
          identificados en la presente cláusula.
        </p>

        <p>
          La Parte PROMITENTE COMPRADORA promete comprar a la Parte PROMITENTE VENDEDORA los bienes
          descritos con anterioridad.
        </p>

        <p>
          Queda expresamente convenido por las Partes que la venta de los bienes inmuebles y la
          venta de los títulos de acciones o derechos de participación objeto del presente Contrato
          constituyen un negocio integral e indisoluble, es decir que una venta no puede darse o
          subsistir independientemente de la otra, sino que necesaria y obligatoriamente deben
          concurrir ambas ventas. Por tanto, para que pueda suscribirse el contrato definitivo de
          compraventa del bien inmueble y de los derechos de participación o acción, deben
          encontrarse pagados, en su totalidad, los precios de ambos Bienes Prometidos.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>PLAZO</p>

        <p>
          El plazo de la presente promesa de compraventa, es decir, el plazo máximo para celebrar
          la respectiva escritura traslativa de dominio será de veinticuatro (24) meses contados a
          partir de la construcción de obra gris. Cumplido el plazo deberá otorgarse la escritura
          pública de compraventa respectiva y hacerse entrega de los bienes y áreas prometidas en
          venta, siempre y cuando la Parte PROMITENTE COMPRADORA se encuentre al día en los pagos
          convenidos en este contrato; de lo contrario la Parte PROMITENTE COMPRADORA deberá hacer
          efectivos los pagos pendientes a fin de que pueda celebrarse la escritura de compraventa
          correspondiente en la fecha fijada para la misma, esto sin perjuicio del derecho de la
          Parte PROMITENTE VENDEDORA de dar por vencido anticipadamente el plazo del presente
          contrato y en consecuencia dar por terminado el mismo como más adelante se detalla. El
          plazo de la presente promesa podrá prorrogarse.
        </p>

        <p>
          <b>Prórroga:</b> El plazo de la presente promesa podrá prorrogarse automáticamente por
          seis meses adicionales por: a) decisión unilateral de la PROMITENTE VENDEDORA en cuyo
          caso deberá notificar a la PROMITENTE COMPRADORA dentro de los diez (10) días hábiles
          siguientes a la fecha en la que decida hacer uso de dicho mecanismo; y/o b) en caso
          medien causas de fuerza mayor y/o caso fortuito que impidan la entrega de los Bienes
          Inmuebles dentro del plazo anteriormente estipulado. En cualquiera de estos casos, el
          plazo de la prorroga aquí establecido será el término máximo dentro del cual se hará la
          entrega de los bienes objeto de la promesa.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>DE LA ENTREGA ANTICIPADA</p>

        <p>
          En caso de que la construcción del Edificio se finalice antes del plazo estipulado, la
          escritura pública traslativa de dominio podrá ser otorgada antes de dicho plazo, siempre
          y cuando la Parte PROMITENTE COMPRADORA se encuentre al día en los pagos estipulados en
          este contrato. La Parte PROMITENTE VENDEDORA notificará con treinta (30) días de
          anticipación a la Parte PROMITENTE COMPRADORA, en la forma establecida en este contrato,
          que los bienes que por este acto se prometen en venta se encuentran listos para su entrega
          y escrituración; una vez realizada esta notificación a la Parte PROMITENTE COMPRADORA
          contará con un plazo máximo de quince (15) días para hacer efectivo el último pago del
          valor de los bienes objeto de la presente promesa de compraventa, de no realizarlo en el
          plazo establecido, la Parte PROMITENTE COMPRADORA deberá pagar una penalización a favor
          de la Parte PROMITENTE VENDEDORA, equivalente al ocho por ciento (8%) anual sobre el
          saldo adeudado y hasta el momento en que se haga efectivo el pago final.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>DOCUMENTO TRASLATIVO DE DOMINIO</p>

        <p>
          La escritura traslativa de dominio de los inmuebles y derechos de participación/acciones,
          objeto de la presente promesa, deberá otorgarse con el notario designado por la Parte
          PROMITENTE VENDEDORA, por el precio y demás condiciones y términos convenidos en los
          apartados anteriores.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>PRECIO</p>

        <p>El precio de los bienes prometidos en venta es el siguiente:</p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>
          DE LOS<br />BIENES INMUEBLES
        </p>

        <p>
          El precio total de los inmuebles prometidos en venta será
          de <V>{formatLegalAmount(escrituracion.valor_inmueble_con_iva)}</V>, incluyendo
          el monto correspondiente al Impuesto al Valor Agregado (IVA). En el valor de la venta
          todo cuanto de hecho y por derecho corresponda a los bienes inmuebles antes relacionados.
          El Impuesto al Valor Agregado es actualmente de un doce por ciento (12%) y es el que el
          comprador deberá pagar en la factura correspondiente. En caso este porcentaje se
          incrementara, la Parte PROMITENTE COMPRADORA deberá hacer efectivo el pago de la
          diferencia.
        </p>

        <p>
          En el valor de los bienes inmuebles, que por este acto se prometen en venta, se incluye
          todo cuanto de hecho y por derecho les corresponda, así como los gastos y honorarios
          legales en que se incurran por la presente promesa de compraventa y posteriormente por la
          escritura pública de compraventa respectiva.
        </p>

        <p>
          La Parte PROMITENTE COMPRADORA acepta que el precio aquí pactado podrá ser incrementado
          en caso de que durante el plazo de este contrato se produzcan aumentos que superen el
          cinco por ciento (5%) de los precios y costos del valor de bienes y servicios u otros que
          alteren el porcentaje señalado del precio estipulado en este contrato. Dicho incremento
          deberá ser comprobable; se ajustará el precio aquí pactado en forma proporcional al
          aumento, y de manera automática sin necesidad de declaración judicial ni formalidad
          alguna. En caso de que la variación del precio y/o costos sea superior al veinte por
          ciento (20%) del precio aquí pactado, La Parte PROMITENTE COMPRADORA puede desistir de
          celebrar el contrato definitivo sin responsabilidad alguna de su parte, siempre que avise
          por escrito tal decisión dentro de un plazo que no exceda de diez (10) días hábiles de
          haber recibido de La Parte PROMITENTE VENDEDORA la información correspondiente al
          incremento del precio; en tal caso, LA PARTE PROMITENTE VENDEDORA deberá devolver a La
          Parte PROMITENTE COMPRADORA las sumas que esta última le hubiese entregado en concepto de
          precio de los bienes, sin intereses de ningún tipo, en un plazo que no exceda de dos (2)
          meses, contados a partir del aviso que dé La Parte PROMITENTE COMPRADORA de su decisión
          de desistir del contrato, a la cuenta bancaria que designe por escrito la Parte
          PROMITENTE COMPRADORA, la cual deberá estar bajo su titularidad o mediante cheque a su
          nombre; debiendo La Parte PROMITENTE COMPRADORA, en ese momento, otorgar el más amplio y
          total finiquito a La Parte PROMITENTE VENDEDORA.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>
          TÍTULOS DE ACCIONES Y/O DERECHOS DE PARTICIPACIÓN
        </p>

        <p>
          El valor de los títulos de acciones y/o derechos de participación de la entidad
          administradora de las áreas comunes del Edificio es
          de <V>{formatLegalAmount(escrituracion.valor_acciones)}</V> incluyendo
          el monto correspondiente al Impuesto de Timbres Fiscales al que dicha enajenación está
          sujeta y los cuales se representarán por los derechos de participación descritos
          anteriormente a favor de la Parte PROMITENTE COMPRADORA de conformidad con lo que
          establece el Decreto diez guion dos mil doce (10-2012) y su respectivo Reglamento.
        </p>

        <p>
          El señor LUIS ARIMANY MONZÓN, en representación de la entidad INMOBILIARIA EL GRAN
          JAGUAR, SOCIEDAD ANÓNIMA, declara que sobre el inmueble indicado sobre el que se
          construirá el Edificio, pesará una o más inscripciones hipotecarias a favor de una
          institución bancaria, como parte del financiamiento del proyecto. Sin embargo, la Parte
          PROMITENTE VENDEDORA se compromete a que, en el momento de presentar el testimonio de la
          escritura traslativa de dominio respectiva al Registro General de la Propiedad para su
          correspondiente inscripción, se deberá presentar también el testimonio de la liberación
          de cualquier gravamen, anotación o limitación que pueda perjudicar los derechos de la
          Parte PROMITENTE COMPRADORA. Manifestamos los otorgantes, que la Parte PROMITENTE
          VENDEDORA no será en ningún caso responsable por los atrasos en la inscripción de los
          documentos en que incurra el Registro General de la Propiedad por procedimientos que el
          mismo determine, debido a que dichos plazos se encuentran fuera de su alcance.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>FORMA DE PAGO</p>

        <p>
          El precio establecido anteriormente de los bienes objeto del presente contrato lo pagará
          la Parte PROMITENTE COMPRADORA de la siguiente manera:
        </p>

        <div style={{ display: "flex", justifyContent: "space-around", fontWeight: "bold", textAlign: "center", margin: "16px 0" }}>
          <span>RESERVA</span>
          <span>ENGANCHE</span>
          <span>ÚLTIMO PAGO</span>
        </div>

        <p>
          Un primer pago de <V>{formatLegalAmount(reservaAmount)}</V> en calidad de reserva, el
          cual ha sido entregado, previamente a la firma de la presente Promesa de Compraventa.
        </p>

        <p>
          Un Enganche por la cantidad de <V>{formatLegalAmount(enganche.enganche_neto)}</V>, el
          cual será pagado de conformidad con los parámetros fijados en el ANEXO II, que se adjunta
          al presente Contrato de Promesa de Compraventa.
        </p>

        <p>
          Todas las cantidades que la Parte PROMITENTE COMPRADORA entregue a la Parte PROMITENTE
          VENDEDORA como anticipo al precio se aplicarán al precio de la compraventa prometida al
          celebrarse ésta.
        </p>

        <p>
          Un último pago de <V>{formatLegalAmount(ultimoPago)}</V>, los cuales deberá pagar la
          Parte PROMITENTE COMPRADORA al momento de celebrar la escritura de compraventa de los
          bienes prometidos en venta; dicho monto incluye el pago de los impuestos de ley que
          corresponden.
        </p>

        <p>
          Los pagos antes identificados, los deberá de realizar la Parte PROMITENTE COMPRADORA en
          Quetzales, moneda del curso legal, y sin necesidad de cobro o requerimiento alguno en las
          oficinas de la Parte PROMITENTE VENDEDORA, conocidas por ella.
        </p>

        <p>
          Cualquier anticipo, de los anteriormente individualizados, que se realice mediante cheque
          y este resulte rechazado, por cualquier motivo, dará origen a un cobro administrativo de
          doscientos quetzales (Q.200.00), más el Impuesto al Valor Agregado (IVA); lo cual
          cancelaremos al momento en que se sustituya, sin perjuicio del derecho que tendrá la
          Parte PROMITENTE VENDEDORA de solicitarle a la Parte PROMITENTE COMPRADORA, que efectúe
          el pago a más tardar dentro de los dos (2) días hábiles siguientes, cobrándole si
          corresponde los intereses moratorios generados por el atraso respectivo. Asimismo, la
          Parte PROMITENTE VENDEDORA podrá exigir a la Parte PROMITENTE COMPRADORA que el pago
          correspondiente y cualquiera subsiguiente, lo efectúe mediante otro medio distinto al
          cheque o mediante cheque de caja. En caso que la fecha de pago fuera un día no hábil, el
          pago podrá ser realizado en el día hábil inmediato siguiente a dicha fecha.
        </p>

        <p>
          Las cantidades entregadas por la Parte PROMITENTE COMPRADORA a la Parte PROMITENTE
          VENDEDORA en concepto de enganche y adelantos a cuenta del precio de la futura venta no
          devengarán intereses.
        </p>

        <p>
          Continúa declarando la PROMITENTE COMPRADORA, en nombre propio y bajo solemne juramento,
          que el dinero que por el presente contrato entregaré a la entidad INMOBILIARIA EL GRAN
          JAGUAR, SOCIEDAD ANÓNIMA, no proviene de actividades ilícitas, delictivas, o de
          cualesquiera otras actividades que den lugar a la aplicación de la Ley de Extinción de
          Dominio, Decreto Número cincuenta y cinco guion dos mil diez (55-2010) del Congreso de
          la República de Guatemala, por lo que desde ya libero y me obligo a mantener amplia y
          absolutamente exenta a la entidad INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA, de
          cualquier responsabilidad derivada de este contrato.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>MORA</p>

        <p>
          La falta de pago de cualquiera de los anticipos establecidos en la forma y fecha pactados
          facultan a la Parte PROMITENTE VENDEDORA al cobro de una mora equivalente al dos por
          ciento (2%) mensual sobre el saldo pendiente al día que se efectúe el pago. El recargo
          por mora correrá a partir del quinto día de atraso contados a partir de la fecha señalada
          para el pago, lo cual acepta la Parte PROMITENTE COMPRADORA y se compromete a pagar
          juntamente con el anticipo caído en mora.
        </p>

        <p style={{ textAlign: "center", fontWeight: "bold" }}>ENTREGA</p>

        <p>
          La Parte PROMITENTE COMPRADORA deberá recibir los inmuebles objeto del presente contrato
          en la fecha señalada por la Parte PROMITENTE VENDEDORA. En caso de que la Parte
          PROMITENTE COMPRADORA no recibiere los inmuebles en la fecha que se le indique por causas
          que se le atribuyan a él, los inmuebles se tendrán por recibidos a su entera satisfacción
          sin que posteriormente pueda efectuar reclamo alguno. La Parte PROMITENTE COMPRADORA
          acepta expresamente que a partir de ese momento correrán por su cuenta los pagos de
          mantenimiento de áreas comunes, todos los servicios con los que cuenten los inmuebles, el
          Impuesto Único Sobre Inmuebles (IUSI), así como cualquier impuesto o arbitrio en general
          no especificado aquí o cualquier otro que se cree en el futuro. La Parte PROMITENTE
          COMPRADORA no podrá negarse infundadamente a recibir los bienes inmuebles por reparos
          menores, ajustes, retoques, defectos o limpieza adicional que requiera. Los mismos se
          harán constar en el listado firmado por las partes y se subsanarán en el término que
          ambas partes acuerden. El hecho de tomar posesión de los bienes inmuebles o que se ocupe
          por la Parte PROMITENTE COMPRADORA o cualquier persona autorizada por esta, implica su
          recepción y la de sus servicios comunes, a satisfacción, por lo que, mantendrán indemne
          a la entidad INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA por cualquier reclamo que
          surja con relación a lo antes indicado.
        </p>

        <p>
          La Parte PROMITENTE COMPRADORA, desde ya acepta lo siguiente: A) Exonera a La Parte
          PROMITENTE VENDEDORA de cualquier reclamo por molestias y/o daños que pudieran causarle
          la presencia de trabajadores y el desarrollo de las construcciones pendientes o futuras
          de la misma torre del Edificio, otras torres y areas de uso común; y B) Se compromete a
          aceptar todas aquellas instalaciones que hubieren de colocarse en el Edificio, que de
          cualquier manera dificulten la circulación de vehículos y/o personas durante la
          construcción.
        </p>

        {/* CUARTA */}
        <p>
          <b>CUARTA: PLANOS Y CAMBIOS EN LA CONSTRUCCIÓN.</b> La Parte PROMITENTE COMPRADORA
          declara expresamente que conoce y acepta los planos de distribución y no podrá solicitar
          que se hagan modificaciones o adiciones a los planos. La Parte PROMITENTE VENDEDORA,
          podrá y se reserva el derecho de hacer cambios en los planos y especificaciones conocidas
          y aceptadas si por convenirle a la arquitectura, estructura, funcionamiento hidráulico o
          eléctrico del proyecto, fueren necesarios dichos cambios, o por solicitud técnica de la
          Municipalidad o cualquier otra autoridad administrativa; debiendo notificar por escrito
          sobre estos cambios a La Parte PROMITENTE COMPRADORA; o bien si fueren necesarios en
          virtud de escasez dentro del período de construcción de algún elemento o material en el
          mercado local.
        </p>

        {/* QUINTA */}
        <p>
          <b>QUINTA: IMPOSIBILIDAD TÉCNICA Y MODIFICACIONES.</b> La Parte PROMITENTE COMPRADORA
          reconoce y acepta que los bienes objeto de la presente promesa se encuentra en etapa de
          planificación y/o construcción, por lo que pueden presentarse modificaciones técnicas,
          estructurales, normativas, municipales, o de diseño, que hagan necesario ajustar el
          proyecto o que imposibiliten total o parcialmente la entrega del mismo en la forma
          originalmente prevista.
        </p>

        <p>
          En caso de que, por causas técnicas o por requerimientos de autoridades administrativas,
          municipales o por condiciones propias del desarrollo del proyecto, resulte imposible para
          la PROMITENTE VENDEDORA cumplir con lo ofrecido en la presente promesa, ésta notificará
          a la parte PROMITENTE COMPRADORA dentro de un plazo razonable.
        </p>

        <p>
          La parte PROMITENTE VENDEDORA podrá optar, a su sola discreción, por: (i) realizar los
          ajustes, variaciones o modificaciones que considere necesarios en el diseño, distribución,
          metrajes, ubicación, áreas comunes, especificaciones o materiales del apartamento o del
          proyecto, de conformidad con lo establecido en el presente contrato; o bien (ii) resolver
          la presente Promesa de Compraventa sin responsabilidad alguna.
        </p>

        <p>
          De optar la parte PROMITENTE VENDEDORA por la resolución, la parte PROMITENTE VENDEDORA
          deberá devolver a la parte PROMITENTE COMPRADORA las cantidades efectivamente pagadas, sin
          intereses, daños, perjuicios, gastos, costos, penalidades, ni cualquier otra reclamación
          presente o futura, quedando ambas partes libres de toda obligación.
        </p>

        <p>
          La parte PROMITENTE COMPRADORA renuncia expresamente a ejercer acciones de cualquier
          naturaleza en contra de la parte PROMITENTE VENDEDORA por las variaciones, ajustes o la
          eventual resolución prevista en la presente cláusula.
        </p>

        {/* SEXTA */}
        <p>
          <b>SEXTA: FALTA DE CUMPLIMIENTO DE LAS OBLIGACIONES DE LAS PARTES E INDEMNIZACIÓN POR
          DAÑOS Y PERJUICIOS.</b>
        </p>

        <p>
          (A) En caso la Parte PROMITENTE COMPRADORA:
        </p>

        <ol type="a" style={{ marginLeft: 24 }}>
          <li>Decidiere terminar anticipadamente el presente Contrato;</li>
          <li>Se negare sin causa justificada a suscribir el contrato de compraventa definitivo dentro del plazo estipulado;</li>
          <li>No cumpla con pagar dos cuotas del precio, conforme lo convenido en el presente Contrato;</li>
          <li>No actualice su papelería cuando se le requiera, en un plazo máximo de quince días calendario como tiempo máximo;</li>
          <li>No entregue la papelería que le solicite la PROMITENTE VENDEDORA, cualquier Institución financiera o el Instituto de Fomento de Hipotecas Aseguradas (FHA), para el financiamiento correspondiente;</li>
          <li>No cumpla con la elegibilidad como cliente; o</li>
          <li>No cumpla con cualquiera de las otras obligaciones que contrae en este documento,</li>
        </ol>

        <p>
          La Parte PROMITENTE VENDEDORA podrá sin necesidad de trámite o declaración judicial, dar
          por terminado y dejar sin efecto el presente contrato sin responsabilidad de su parte, en
          cuyo caso, quedará facultada para hacer suyo el monto pagado a la fecha en concepto de
          daños y perjuicios y en caso no hubiere pagado la totalidad del enganche INMOBILIARIA EL
          GRAN JAGUAR, SOCIEDAD ANÓNIMA, podrá acudir a la vía judicial para exigir el cumplimiento
          de la suma adeudada y el cumplimiento de las obligaciones contenidas en el presente
          contrato. Cuando los pagos realizados a cuenta del precio superen el siete por ciento (7%)
          del valor total del contrato, INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA deberá
          devolver a la Parte PROMITENTE COMPRADORA únicamente la cantidad que exceda dicho
          porcentaje, deduciendo la suma de diez mil quetzales (Q.10,000.00) en concepto de gastos
          administrativos. Esta devolución deberá efectuarse dentro del plazo de sesenta (60) días
          contados a partir del envío del correo electrónico de notificación de la terminación
          anticipada, dirigida a la cuenta señalada por la Parte PROMITENTE COMPRADORA en este
          contrato. Este plazo estará condicionado a que, dentro del mismo, se haya formalizado la
          venta de los bienes objeto de este contrato a un tercero, sin que ello genere para la
          Parte PROMITENTE VENDEDORA obligación alguna de pagar intereses, penalidades o
          indemnización de cualquier naturaleza. Las cantidades a devolver no devengarán intereses
          de ninguna clase.
        </p>

        <p>
          (B) En caso la Parte PROMITENTE VENDEDORA, sin motivo alguno y habiendo recibido de la
          Parte PROMITENTE COMPRADORA tanto los pagos a cuenta del precio en las fechas y formas
          estipuladas en este instrumento como el monto correspondiente al Impuesto al Valor
          Agregado -IVA-, decidiere terminar anticipadamente el presente Contrato, se negare a
          suscribir el contrato de compraventa definitivo dentro del plazo estipulado, incumpla con
          entregar o se negare a entregar los Bienes Prometidos dentro del plazo convenido; o bien,
          incumpla cualquiera de las otras obligaciones que contrae en el presente contrato, la
          Parte PROMITENTE COMPRADORA podrá: Sin necesidad de trámite o declaración judicial, dar
          por terminado y dejar sin efecto el presente Contrato sin responsabilidad de su parte, en
          cuyo caso quedará facultada para exigir a la Parte PROMITENTE VENDEDORA la devolución de
          la totalidad de las cantidades entregadas como anticipo de pago del precio, más la entrega
          de una cantidad igual al dos por ciento (2%) de las cantidades recibidas, quedando
          expresamente convenido por las Partes que dicho pago compensa los daños y perjuicios
          causados a la Parte PROMITENTE COMPRADORA liberando a la Parte PROMITENTE VENDEDORA de
          cualesquiera responsabilidades en relación a este Contrato y desligando de toda obligación
          con respecto al mismo, sin necesidad todo ello de declaratoria judicial alguna. La
          devolución de la cantidad antes indicada será efectuada por la Parte PROMITENTE VENDEDORA
          a la Parte PROMITENTE COMPRADORA dentro de un plazo no mayor a sesenta (60) días
          calendario, contados a partir del envío del correo electrónico de comunicación a la
          dirección señalada por LA PROMITENTE COMPRADORA en este contrato, en donde se oficializa
          la terminación anticipada. Sin que por ello se genere a cargo de La Parte PROMITENTE
          VENDEDORA obligación alguna de pago de intereses, penalidades ni indemnización de ninguna
          naturaleza. La Parte PROMITENTE COMPRADORA sólo podrá ejercer este derecho en el caso
          que haya cumplido con todas las obligaciones que le corresponden.
        </p>

        {/* SÉPTIMA */}
        <p>
          <b>SÉPTIMA: CESIÓN DE DERECHOS.</b> La Parte PROMITENTE VENDEDORA podrá ceder los
          derechos derivados del presente contrato en forma parcial o total sin previo aviso o
          notificación a la Parte PROMITENTE COMPRADORA. Asimismo, la Parte PROMITENTE COMPRADORA
          no podrá ceder los derechos de la presente promesa.
        </p>

        {/* OCTAVA */}
        <p>
          <b>OCTAVA: FINANCIAMIENTO BANCARIO.</b> En el caso que la Parte PROMITENTE COMPRADORA
          requiera financiamiento bancario, para llevar a cabo la compraventa objeto del presente
          contrato, ésta declara entender y aceptar que deberá cubrir, por su cuenta, todos los
          gastos, honorarios notariales, y costos relacionados con la Escritura de Crédito, así
          como aquellos gastos derivados de la inscripción del gravamen hipotecario ante el Registro
          General de la Propiedad.
        </p>

        <p>
          La Parte PROMITENTE VENDEDORA se compromete a colaborar con la Parte PROMITENTE
          COMPRADORA en la medida de lo razonable, proporcionando la documentación e información
          que le sea requerida, a fin de facilitar la obtención del crédito ante la institución
          bancaria que elija la Parte PROMITENTE COMPRADORA. No obstante, la Parte PROMITENTE
          VENDEDORA no se obliga ni asume responsabilidad alguna en caso el crédito no sea aprobado
          o desembolsado, ya que dicha aprobación depende exclusivamente de las políticas y análisis
          de riesgo de las instituciones financieras.
        </p>

        <p>
          La parte PROMITENTE COMPRADORA se compromete a gestionar, tramitar y cumplir con todos
          los requisitos exigidos por la entidad financiera elegida o el Instituto de Fomento de
          Hipotecas Aseguradas (FHA), para la obtención del crédito destinado a la compra de los
          inmuebles objeto de la presente promesa, dentro del plazo máximo de quince (15) días
          calendario, contados a partir de la notificación escrita que realice la parte PROMITENTE
          VENDEDORA, la entidad financiera o el Instituto de Fomento de Hipotecas Aseguradas (FHA).
        </p>

        <p>
          Si la parte promitente compradora no cumple con los requisitos bancarios o del FHA, no
          entrega la documentación completa, o no obtiene la aprobación del crédito por causas
          atribuibles a ella dentro del plazo establecido, se entenderá, de pleno derecho, que
          desiste de la presente promesa de compraventa, sin necesidad de requerimiento judicial ni
          declaración adicional. En tal caso, la parte PROMITENTE COMPRADORA perderá en favor de la
          parte PROMITENTE VENDEDORA todas las cantidades entregadas hasta esa fecha en concepto de
          reserva, enganche, anticipo o cualquier otro pago, en resarcimiento de los daños y
          perjuicios ocasionados.
        </p>

        {/* NOVENA */}
        <p>
          <b>NOVENA: DEL REGLAMENTO DE COPROPIEDAD.</b> Manifiesta la Parte PROMITENTE COMPRADORA
          que, desde ya, acepta y se somete al correspondiente Reglamento de Copropiedad y
          Administración del Edificio; así como que bajo su responsabilidad se someterán a las
          disposiciones mencionadas, sus dependientes, visitantes, usufructuarios, inquilinos u
          ocupantes por cualquier título o causa, así como a las normas de convivencia que en el
          futuro adopten los propietarios del Edificio.
        </p>

        {/* DÉCIMA */}
        <p>
          <b>DÉCIMA: DE LA OBLIGACIÓN DEL PAGO DEL IMPUESTO ÚNICO SOBRE INMUEBLE (IUSI) Y DE LA
          CUOTA DE MANTENIMIENTO.</b> Manifiesta la Parte PROMITENTE COMPRADORA que a partir del
          momento que INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA, le entregue los inmuebles,
          correrán por su cuenta todos los gastos relativos a la cuota de mantenimiento de
          administración del Edificio a la entidad encargada de la administración de dicho
          proyecto, todos los servicios con los que cuenta, el Impuesto Único Sobre Inmuebles
          (IUSI) y cualquier otro impuesto y/o arbitrio en general no especificado aquí o cualquier
          otro que se cree en el futuro.
        </p>

        {/* DÉCIMA PRIMERA */}
        <p>
          <b>DÉCIMA PRIMERA: EVENTO EXIMENTE DE RESPONSABILIDAD.</b> Se consideran como hechos
          eximentes de responsabilidad el caso fortuito y/o actos de fuerza mayor. Caso Fortuito o
          Fuerza Mayor significa sucesos imprevisibles o bien inevitables y que estén fuera del
          control razonable de, y sin culpa o negligencia de, la Parte que alegue Fuerza Mayor o
          Caso Fortuito. Incluirá, sin limitarse a, sabotaje, actos de guerra (declarada o no
          declarada); acción militar o guerrillera; actividad terrorista o amenazas de actividades
          terroristas que, bajo las circunstancias, podrían ser consideradas como precursoras de
          actividad terrorista real; vandalismo; bloqueos, paros o similares situaciones que limiten
          la libre locomoción de bienes, personas o servicios en cualquier territorio de la
          república o internacional que afecte directa o indirectamente al desarrollo del proyecto,
          desmoronamiento de pozos, daño inesperado; condiciones meteorológicas anormales;
          terremotos o movimientos sísmicos; explosiones; incendios; inundaciones; rayos; viento
          anormal; deslizamientos de tierra; pandemias e incumplimiento en la entrega de
          electricidad. En ningún caso se considerará que las Partes en situación de incumplimiento
          de sus obligaciones derivadas del presente Contrato, se encuentran amparadas por un
          evento eximente de responsabilidad, cuando hubiere mediado culpa o dolo de quien ha
          incurrido en dicha situación, o, la Parte afectada, se encuentre en situación de mora en
          lo que se refiere a la obligación cuyo cumplimiento se ha visto afectado por el caso
          fortuito o la fuerza mayor.
        </p>

        {/* DÉCIMA SEGUNDA */}
        <p>
          <b>DÉCIMA SEGUNDA: TERMINACIÓN POR VOLUNTAD DE LA PROMITENTE COMPRADORA.</b> Las partes
          convienen que, en caso LA PROMITENTE COMPRADORA notifique por escrito a LA PROMITENTE
          VENDEDORA su decisión de no continuar con la presente promesa de compraventa, tal
          notificación será suficiente para que el presente contrato quede automáticamente sin
          efecto, sin necesidad de suscribir documento de rescisión, adenda, finiquito ni cualquier
          otra formalidad adicional. Desde ese momento, ambas partes quedarán liberadas de sus
          obligaciones recíprocas. Sin perjuicio de la penalización a la que esté sujeta LA
          PROMITENTE COMPRADORA.
        </p>

        <p>
          LA PROMITENTE COMPRADORA reconoce que dicha terminación no generará responsabilidad ni
          penalidad alguna para LA PROMITENTE VENDEDORA.
        </p>

        {/* DÉCIMA TERCERA */}
        <p>
          <b>DÉCIMA TERCERA: DE LA PROTOCOLIZACIÓN.</b> Acordamos los comparecientes que el
          presente documento podrá ser protocolizado a solicitud de cualquiera de LAS PARTES.
        </p>

        {/* DÉCIMA CUARTA */}
        <p>
          <b>DÉCIMA CUARTA: LEGISLACIÓN Y FORO APLICABLES.</b> Para efecto del presente Contrato,
          las Partes:
        </p>

        <p>(A) Elegimos legislación aplicable las leyes de la República de Guatemala.</p>

        <p>
          (B) Renunciamos al fuero de nuestro domicilio y a cualquier otra competencia que pudiere
          correspondernos y nos sometemos a la jurisdicción de los tribunales que LA PROMITENTE
          VENDEDORA designe.
        </p>

        <p>
          (C) Aceptamos como buenas y exactas las cuentas que la otra parte le presente y como
          líquida y exigible la cantidad que le reclame.
        </p>

        <p>
          (D) Las partes señalamos como lugares para recibir toda clase de notificaciones,
          requerimientos o comunicaciones derivadas de la presente promesa, las direcciones que a
          continuación se indican, las cuales se tendrán como válidamente realizadas en dichos
          domicilios o en los correos electrónicos señalados, salvo aviso por escrito dado a la
          otra parte con no menos de quince (15) días calendario de anticipación a la fecha en que
          el cambio deba surtir efecto:
        </p>

        <p>
          &bull; La Parte PROMINENTE VENDEDORA: 15 calle 7-77, zona 10, Edificio Óptima Centro de
          Negocios, quinto nivel, Oficina 501, municipio de Guatemala, departamento de Guatemala;
          correo electrónico: <V>ventas@puertaabierta.com.gt</V>.
        </p>

        <p>
          La Parte PROMITENTE
          COMPRADORA: <V>{domicilio || BLANK}</V>; correo
          electrónico <V>{clientEmail}</V>.
        </p>

        <p>
          Toda notificación enviada al domicilio o correo electrónico aquí indicado se tendrá por
          legalmente válida y eficaz desde el momento de su entrega o envío, según corresponda. Las
          partes se obligan a notificar por escrito cualquier cambio de dirección física o
          electrónica dentro del plazo antes indicado, entendiéndose que, de no hacerlo, toda
          comunicación remitida a las direcciones originalmente señaladas producirá plenos efectos
          legales.
        </p>

        {/* DÉCIMA QUINTA */}
        <p>
          <b>DÉCIMA QUINTA: CONDICIÓN RESOLUTORIA EXPRESA.</b> Manifestamos expresamente las Partes
          que la falta de cumplimiento de cualquiera de las obligaciones a cargo de la PROMINTENTE
          COMPRADORA pactadas en el presente documento constituye Condición Resolutoria Expresa de
          pleno derecho, por lo que la Parte PROMITENTE VENDEDORA tendrá derecho a dejar sin efecto
          el presente Contrato sin necesidad de requerimiento previo o declaración judicial. En tal
          caso, se procederá conforme a lo establecido en las cláusulas que preceden.
        </p>

        <p>
          El presente Contrato de Promesa de Compraventa, por su naturaleza y la voluntad de las
          Partes, no surte ningún efecto traslativo y, por ende, tampoco limita en forma alguna las
          facultades de disposición que pueden corresponderle a la Parte PROMITENTE VENDEDORA sobre
          los Bienes Prometidos, y, en esa virtud, la Parte PROMITENTE VENDEDORA podrá realizar e
          inscribir en los Registros respectivos cualesquiera operaciones incluidas las relativas a
          hipotecar el bien inmueble sobre el que se construye el Edificio y construcciones sobre el
          mismo para garantizar el financiamiento destinado a la construcción del Proyecto.
        </p>

        {/* DÉCIMA SEXTA */}
        <p>
          <b>DÉCIMA SEXTA: PREEMINENCIA DEL PRESENTE CONTRATO.</b> LAS PARTES manifiestan que el
          texto del contrato contenido en el presente documento privado prevalecerá sobre cualquier
          otro documento público, privado, acuerdo u ofrecimiento, cotización, oral o escrito,
          respecto del objeto del presente contrato. Por consiguiente, los documentos que hubieran
          sido firmados con anterioridad por las partes carecerán de validez en todo lo que fueren
          contradictorios, incongruentes, estipulen condiciones distintas a lo pactado en este
          documento privado o que aparecieren contrarias a la intención de las partes contratantes.
          Continúan manifestando ambas partes en las calidades con que actúan que cualquier
          modificación, adhesión o anexo al presente contrato para que se considere parte integrante
          del mismo, debe de constar por escrito y firmado por ambas partes.
        </p>

        {/* DÉCIMA SÉPTIMA */}
        <p>
          <b>DÉCIMA SÉPTIMA: ACEPTACIÓN.</b> En los términos expuestos y en las calidades con que
          actuamos, los comparecientes declaramos nuestra plena conformidad con el contenido del
          presente documento, y luego de haberlo leído y bien enterados de su contenido, objeto,
          validez y efectos legales, lo ratificamos, aceptamos y firmamos.
        </p>

        {/* Signature blocks */}
        <div style={{ marginTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64 }}>
            <div style={{ textAlign: "center", width: "45%" }}>
              <div style={{ borderBottom: "1px solid #000", marginBottom: 4 }}>&nbsp;</div>
              <p style={{ margin: 0, fontWeight: "bold" }}>LUIS ARIMANY MONZÓN</p>
              <p style={{ margin: 0, fontSize: "10pt" }}>ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL</p>
              <p style={{ margin: 0, fontSize: "10pt" }}>INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA</p>
            </div>
            <div style={{ textAlign: "center", width: "45%" }}>
              <div style={{ borderBottom: "1px solid #000", marginBottom: 4 }}>&nbsp;</div>
              <p style={{ margin: 0, fontWeight: "bold" }}><V>{clientName.toUpperCase()}</V></p>
            </div>
          </div>
        </div>

        {/* Notary authentication */}
        <div style={{ marginTop: 48 }}>
          <p>
            En la Ciudad de Guatemala, el <V>{dayWords} ({day})</V> de <V>{monthName}</V> del
            año <V>{yearWords} ({year})</V>, yo la Infrascrita Notaria, DOY FE que las firmas que
            anteceden son AUTENTICAS por haber sido puestas hoy en mi presencia, en el documento
            privado que contiene PROMESA DE COMPRAVENTA DE BIENES INMUEBLES Y DERECHOS DE
            PARTICIPACIÓN por: A) El señor LUIS ARIMANY MONZON, quien se identifica con el
            Documento Personal de Identificación, con Código Único de Identificación -CUI- dos mil
            quinientos treinta y nueve, cero nueve mil quinientos once, cero ciento uno (2539 09511
            0101) extendido por el Registro Nacional de las Personas de la República de Guatemala;
            y B) <V>{clientName}</V> quien se identifica con el Documento Personal de
            Identificación con Código Único de
            Identificación <V>{clientDpi}</V>, extendido por el Registro Nacional de las Personas
            de la República de Guatemala. Documentos que tuve a la vista. Leído lo escrito a los
            comparecientes, en las calidades con que actúan, lo ratifican, aceptan y firman, junto
            a la Infrascrita Notaria que de todo lo expuesto, DOY FE. -
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 64 }}>
            <div style={{ textAlign: "center", width: "45%" }}>
              <div style={{ borderBottom: "1px solid #000", marginBottom: 4 }}>&nbsp;</div>
              <p style={{ margin: 0, fontWeight: "bold" }}>LUIS ARIMANY MONZÓN</p>
              <p style={{ margin: 0, fontSize: "10pt" }}>ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL</p>
              <p style={{ margin: 0, fontSize: "10pt" }}>INMOBILIARIA EL GRAN JAGUAR, SOCIEDAD ANÓNIMA</p>
            </div>
            <div style={{ textAlign: "center", width: "45%" }}>
              <div style={{ borderBottom: "1px solid #000", marginBottom: 4 }}>&nbsp;</div>
              <p style={{ margin: 0, fontWeight: "bold" }}><V>{clientName.toUpperCase()}</V></p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{ fontWeight: "bold" }}>ANTE MÍ:</p>
            <div style={{ borderBottom: "1px solid #000", width: "50%", margin: "32px auto 0" }}>&nbsp;</div>
          </div>
        </div>

        {/* Summary footer — screen only */}
        <div className="pcv-summary">
          <hr style={{ margin: "32px 0", borderColor: "#ddd" }} />
          <h4 style={{ fontSize: "10pt", color: "#666", marginBottom: 8 }}>Resumen de datos (no se imprime)</h4>
          <table style={{ fontSize: "10pt", color: "#666", borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Reserva ID:</td><td>{reservation.id}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Unidad:</td><td>{unitDesc}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Precio lista:</td><td>{formatCurrency(price)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Inmueble (con IVA):</td><td>{formatCurrency(escrituracion.valor_inmueble_con_iva)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Acciones:</td><td>{formatCurrency(escrituracion.valor_acciones)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Total escrituración:</td><td>{formatCurrency(escrituracion.total_con_impuesto)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Reserva:</td><td>{formatCurrency(reservaAmount)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Enganche neto:</td><td>{formatCurrency(enganche.enganche_neto)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Último pago:</td><td>{formatCurrency(ultimoPago)}</td></tr>
              <tr><td style={{ padding: "2px 8px", fontWeight: 600 }}>Asesor:</td><td>{salesperson?.display_name ?? "—"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** Highlighted value component — marks filled-in data with underline */
function V({ children }: { children: React.ReactNode }) {
  return <span className="pcv-value">{children}</span>;
}

// ---------------------------------------------------------------------------
// Inline profile form — shown when PCV-critical fields are missing
// ---------------------------------------------------------------------------

const MARITAL_OPTIONS = ["Soltero(a)", "Casado(a)", "Unido(a)", "Viudo(a)", "Divorciado(a)"];

function ProfileForm({
  reservationId,
  currentAge,
  currentMarital,
  currentProfession,
  currentDomicilio,
  missingAge,
  missingMarital,
  missingProfession,
  missingDomicilio,
  saving,
  onSave,
}: {
  reservationId: string;
  currentAge: number | null;
  currentMarital: string | null;
  currentProfession: string | null;
  currentDomicilio: string;
  missingAge: boolean;
  missingMarital: boolean;
  missingProfession: boolean;
  missingDomicilio: boolean;
  saving: boolean;
  onSave: (data: { edad?: number; profession?: string; marital_status?: string; domicilio?: string }) => void;
}) {
  const [edad, setEdad] = useState(currentAge?.toString() ?? "");
  const [marital, setMarital] = useState(currentMarital ?? "");
  const [profession, setProfession] = useState(currentProfession ?? "");
  const [domicilio, setDomicilio] = useState(currentDomicilio ?? "");

  // Avoid unused variable warning — reservationId is used by parent's onSave
  void reservationId;

  const handleSubmit = () => {
    const payload: { edad?: number; profession?: string; marital_status?: string; domicilio?: string } = {};
    if (missingAge && edad.trim()) payload.edad = parseInt(edad, 10);
    if (missingMarital && marital.trim()) payload.marital_status = marital.trim();
    if (missingProfession && profession.trim()) payload.profession = profession.trim();
    if (missingDomicilio && domicilio.trim()) payload.domicilio = domicilio.trim();
    if (Object.keys(payload).length > 0) onSave(payload);
  };

  const inputStyle = {
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 13,
    width: "100%",
  };

  return (
    <div className="pcv-profile-form" style={{
      maxWidth: 816,
      margin: "0 auto 16px",
      padding: "16px 24px",
      background: "#fef3c7",
      border: "1px solid #f59e0b",
      borderRadius: 8,
      fontFamily: "sans-serif",
    }}>
      <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#92400e" }}>
        Datos faltantes para la PCV &mdash; complete antes de imprimir
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        {missingAge && (
          <div style={{ flex: "0 0 100px" }}>
            <label style={{ fontSize: 12, color: "#78350f", display: "block", marginBottom: 2 }}>Edad</label>
            <input
              type="number"
              min={18}
              max={100}
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              style={inputStyle}
              placeholder="ej: 35"
            />
          </div>
        )}
        {missingMarital && (
          <div style={{ flex: "0 0 160px" }}>
            <label style={{ fontSize: 12, color: "#78350f", display: "block", marginBottom: 2 }}>Estado civil</label>
            <select
              value={marital}
              onChange={(e) => setMarital(e.target.value)}
              style={{ ...inputStyle, background: "#fff" }}
            >
              <option value="">Seleccionar...</option>
              {MARITAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}
        {missingProfession && (
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: 12, color: "#78350f", display: "block", marginBottom: 2 }}>Profesión u oficio</label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              style={inputStyle}
              placeholder="ej: Ingeniero, Comerciante, Ama de casa"
            />
          </div>
        )}
        {missingDomicilio && (
          <div style={{ flex: "1 1 100%", marginTop: 4 }}>
            <label style={{ fontSize: 12, color: "#78350f", display: "block", marginBottom: 2 }}>
              Domicilio del comprador (dirección para notificaciones legales)
            </label>
            <input
              type="text"
              value={domicilio}
              onChange={(e) => setDomicilio(e.target.value)}
              style={inputStyle}
              placeholder="ej: 5ta avenida 12-45, zona 14, municipio de Guatemala, departamento de Guatemala"
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: "6px 16px",
            backgroundColor: "#d97706",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Print + screen CSS
// ---------------------------------------------------------------------------

const printStyles = `
  @media print {
    .pcv-toolbar { display: none !important; }
    .pcv-summary { display: none !important; }
    .pcv-profile-form { display: none !important; }

    @page {
      size: letter;
      margin: 2.54cm;
    }

    body {
      margin: 0;
      padding: 0;
    }

    .pcv-document {
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      background: white !important;
      font-family: "Times New Roman", "Times", serif !important;
      font-size: 12pt !important;
      line-height: 1.6 !important;
      color: #000 !important;
    }

    .pcv-document p {
      orphans: 3;
      widows: 3;
      text-align: justify;
    }

    .pcv-document h2,
    .pcv-document h3,
    .pcv-document h4 {
      page-break-after: avoid;
    }

    .pcv-value {
      font-weight: bold;
      text-decoration: underline;
    }
  }

  @media screen {
    body {
      background: #f0f0f0;
      margin: 0;
    }

    .pcv-toolbar {
      position: sticky;
      top: 0;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .pcv-document {
      max-width: 816px;
      margin: 24px auto;
      padding: 96px;
      background: #fff;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      font-family: "Times New Roman", "Times", serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
    }

    .pcv-document p {
      text-align: justify;
      margin: 12px 0;
    }

    .pcv-value {
      font-weight: bold;
      text-decoration: underline;
      text-decoration-color: #2563eb;
      color: #1e40af;
    }
  }
`;
