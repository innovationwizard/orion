"use client";

import { useCallback, useState } from "react";
import SiteNav from "@/components/site-nav";
import SectionNav from "@/app/pabi/section-nav";
import { CONTABLE_SECTIONS, type Entregable } from "./entregables";
import {
  CommissionEconomicsCard,
  StatusRepartidoCard,
  ApprovalStatusList,
  PaymentRunCard,
  MercadeoOficialCard,
  FondeoStatusTable,
  CentrosCostoChart,
  PresupuestoVsEjecutadoCard,
  ValorProyectosChart,
  CobrosResumenTable,
  CobrosAlertasCard,
  ComisionesVentasChart,
  CesionClientesTable,
  CesionDirectivoCard,
  InventarioDisponibilidadChart,
  LiveDesistimientosCard,
  LiveExpedientesCard,
  useSessionExpired,
  type CommissionEconomics,
  type StatusRepartido,
  type ApprovalStatus,
  type PaymentRun,
  type MercadeoOficial,
  type FondeoStatus,
  type CentrosCosto,
  type PresupuestoVsEjecutado,
  type ValorProyectos,
  type CobrosResumen,
  type CobrosAlertasDesistimiento,
  type ComisionesVentas,
  type CesionClientes,
  type CesionDirectivo,
  type InventarioDisponibilidad,
  type LiveDesistimientos,
  type LiveExpedientes,
} from "./contable-charts";

import cobrosData from "./data/cobros.json";
import comisionesData from "./data/comisiones.json";
import presupuestosMercadeoData from "./data/presupuestos-mercadeo.json";
import presupuestosOdooData from "./data/presupuestos-odoo.json";
import desistimientosData from "./data/desistimientos.json";
import cesionDerechosData from "./data/cesion-derechos.json";
import pcvExpedientesData from "./data/pcv-expedientes.json";
import contabilidadGeneralData from "./data/contabilidad-general.json";
import legalData from "./data/legal.json";

/** Discriminated union of every row payload shape this page knows how to render. */
type RowValue =
  | CommissionEconomics
  | StatusRepartido
  | ApprovalStatus
  | PaymentRun
  | MercadeoOficial
  | FondeoStatus
  | CentrosCosto
  | PresupuestoVsEjecutado
  | ValorProyectos
  | CobrosResumen
  | CobrosAlertasDesistimiento
  | ComisionesVentas
  | CesionClientes
  | CesionDirectivo
  | InventarioDisponibilidad
  | LiveDesistimientos
  | LiveExpedientes;

/**
 * Shape every data/<section>.json file follows. `rows` stays loosely typed
 * at the JSON boundary — each value's `kind` field is what `RowRenderer`
 * switches on once cast to `RowValue`.
 */
type SectionData = {
  status: "pending" | "ready";
  updatedAt: string | null;
  rows: Record<string, unknown>;
};

const SECTION_DATA: Record<string, SectionData> = {
  cobros: cobrosData as SectionData,
  comisiones: comisionesData as SectionData,
  "presupuestos-mercadeo": presupuestosMercadeoData as SectionData,
  "presupuestos-odoo": presupuestosOdooData as SectionData,
  desistimientos: desistimientosData as SectionData,
  "cesion-derechos": cesionDerechosData as SectionData,
  "pcv-expedientes": pcvExpedientesData as SectionData,
  "contabilidad-general": contabilidadGeneralData as SectionData,
  legal: legalData as SectionData,
};

const NAV_ITEMS = CONTABLE_SECTIONS.map((s) => ({ id: s.id, label: s.label }));

function PendingRow({ row }: { row: Entregable }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <span className="text-sm text-text-primary font-medium">{row.item}</span>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-warning bg-warning/10 rounded-full px-2.5 py-1">
        Pendiente de datos
      </span>
    </li>
  );
}

/** Renders a row once its section's JSON has real data for it — dispatches on `kind`. */
function RowRenderer({ row, value }: { row: Entregable; value: unknown }) {
  const v = value as RowValue;
  return (
    <li className="grid gap-2.5 py-4 border-b border-border last:border-b-0">
      <span className="text-sm text-text-primary font-medium">{row.item}</span>
      {v.kind === "commission-economics" ? <CommissionEconomicsCard /> : null}
      {v.kind === "status-repartido" ? <StatusRepartidoCard /> : null}
      {v.kind === "approval-status" ? <ApprovalStatusList data={v} /> : null}
      {v.kind === "payment-run" ? <PaymentRunCard data={v} /> : null}
      {v.kind === "mercadeo-oficial" ? <MercadeoOficialCard data={v} /> : null}
      {v.kind === "fondeo-status" ? <FondeoStatusTable data={v} /> : null}
      {v.kind === "centros-costo" ? <CentrosCostoChart data={v} /> : null}
      {v.kind === "presupuesto-vs-ejecutado" ? <PresupuestoVsEjecutadoCard data={v} /> : null}
      {v.kind === "valor-proyectos" ? <ValorProyectosChart data={v} /> : null}
      {v.kind === "cobros-resumen" ? <CobrosResumenTable data={v} /> : null}
      {v.kind === "cobros-alertas-desistimiento" ? <CobrosAlertasCard data={v} /> : null}
      {v.kind === "comisiones-ventas" ? <ComisionesVentasChart data={v} /> : null}
      {v.kind === "cesion-clientes" ? <CesionClientesTable data={v} /> : null}
      {v.kind === "cesion-directivo" ? <CesionDirectivoCard data={v} /> : null}
      {v.kind === "inventario-disponibilidad" ? <InventarioDisponibilidadChart data={v} /> : null}
      {v.kind === "live-desistimientos" ? <LiveDesistimientosCard num={row.num} /> : null}
      {v.kind === "live-expedientes" ? <LiveExpedientesCard /> : null}
    </li>
  );
}

/**
 * La página entra con sesión verificada (ver src/app/contable/page.tsx), pero
 * la sesión puede vencer con el tablero abierto. Cuando eso pasa, las secciones
 * estáticas siguen dibujándose desde el JSON del bundle y sólo las filas en
 * vivo fallan, así que sin este aviso se vería un tablero completo con dos
 * filas calladamente muertas.
 */
function SessionExpiredBanner() {
  const expired = useSessionExpired();
  if (!expired) return null;
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span aria-hidden="true" className="text-danger text-sm leading-5">&#9888;</span>
      <p className="text-sm text-text-primary m-0">
        <strong>Tu sesión expiró.</strong> Las cifras en vivo (Desistimientos y PCV &amp; Expedientes) dejaron de
        actualizarse; el resto de la página es el último corte cargado.
      </p>
      <a href="/login" className="text-sm font-semibold text-danger underline underline-offset-2">
        Iniciá sesión de nuevo
      </a>
    </div>
  );
}

export default function ContableClient() {
  const [activeSection, setActiveSection] = useState<string | null>(CONTABLE_SECTIONS[0]?.id ?? null);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSection(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="grid gap-4 p-[clamp(16px,3vw,32px)] max-w-[1180px] mx-auto">
      <SiteNav />

      <header className="grid gap-1.5 pb-3 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary m-0">Contable</h1>
        <p className="text-sm text-muted m-0 max-w-[68ch]">
          Reportes de contabilidad para directiva — vista de resultados, no de operación comercial ni de
          mercadeo. Cobros, Comisiones, Presupuestos de Mercadeo, Presupuestos Contables, Cesión de Derechos y
          Contabilidad General ya traen datos reales; Desistimientos y PCV &amp; Expedientes se resumen en
          vivo desde otras páginas de ORION. Lo que falta en cada sección queda marcado explícitamente en vez
          de mostrarse en blanco sin explicación. Legal sigue fuera de alcance.
        </p>
      </header>

      <SessionExpiredBanner />

      <SectionNav items={NAV_ITEMS} onSelect={jumpTo} activeId={activeSection} />

      {CONTABLE_SECTIONS.map((section) => {
        const data = SECTION_DATA[section.id];
        const isReady = data?.status === "ready";
        return (
          <section
            key={section.id}
            id={section.id}
            className="grid gap-3 scroll-mt-20 bg-card rounded-2xl border border-border shadow-card p-4"
          >
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-text-primary m-0">{section.label}</h2>
            </div>

            <ul className="list-none p-0 m-0">
              {section.rows.map((row) =>
                isReady && row.num in data.rows ? (
                  <RowRenderer key={row.num} row={row} value={data.rows[row.num]} />
                ) : (
                  <PendingRow key={row.num} row={row} />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
