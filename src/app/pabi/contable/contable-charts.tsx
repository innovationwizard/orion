"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import HorizontalBarChart, { type BarDatum } from "@/components/charts/horizontal-bar-chart";
import BulletChart from "@/components/bullet-chart";
import KpiCard from "@/components/kpi-card";
import economiaData from "./data/comisiones-economia.json";

/**
 * Row-level renderers for the Contable section — directive-facing summaries,
 * never operational/commercial detail. Every figure here traces to a specific
 * file, sheet and cell verified against the source .xlsx; anything not yet
 * confirmed is rendered as "Data no existe" rather than guessed or derived.
 */

const money0 = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0,
});
const money2 = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 2,
});
const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted m-0 mt-1">{children}</p>;
}

function MissingFlag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 rounded-full px-2.5 py-1">
      <span aria-hidden="true">&#9888;</span>
      {label} — Data no existe
    </span>
  );
}

// ---------------------------------------------------------------------------
// Comisiones · fila 3 / Odoo · fila 2 — economía del 5% por proyecto
// ---------------------------------------------------------------------------

/**
 * Datos generados por src/app/pabi/contable/scripts/extract-comisiones.py a
 * partir del libro de comisiones del período. Se importan aquí en vez de
 * duplicarse en los JSON de cada sección porque las dos filas que los usan
 * (Comisiones fila 3 y Odoo fila 2) miran exactamente la misma extracción.
 */
type EconomiaProyecto = {
  name: string;
  unidades: number;
  valorVendido: number;
  baseSinImpuestos: number;
  comisionTotal: number;
  puertaAbierta: number;
  estructuraComercial: number;
  periodo: {
    fase1: number;
    fase2: number;
    fase3: number;
    total: number;
    puertaAbierta: number;
    estructuraComercial: number;
    aFacturar: number | null;
    aPagar: number | null;
    cuadrado: boolean | null;
  };
};

type Economia = {
  periodo: string;
  factorImpuestos: number;
  cap: number;
  proyectos: EconomiaProyecto[];
  sinDatoDeVida: { name: string; aPagarPeriodo: number; motivo: string }[];
};

const ECONOMIA = economiaData as unknown as Economia;

const sum = (nums: number[]) => nums.reduce((s, n) => s + n, 0);

function WarningBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 flex gap-2 items-start">
      <span aria-hidden="true" className="text-warning text-sm leading-5">&#9888;</span>
      <p className="text-xs text-text-primary m-0 leading-5">{children}</p>
    </div>
  );
}

export type CommissionEconomics = {
  kind: "commission-economics";
};

/** Barra apilada de las tres fases, a escala del proyecto más grande del período. */
function PhaseBar({ p, max }: { p: EconomiaProyecto; max: number }) {
  const seg = [
    { label: "Fase 1", value: p.periodo.fase1, className: "bg-primary" },
    { label: "Fase 2", value: p.periodo.fase2, className: "bg-[#0d9488]" },
    { label: "Fase 3", value: p.periodo.fase3, className: "bg-[#7c3aed]" },
  ];
  const total = p.periodo.total;
  return (
    <div
      className="flex h-2.5 rounded overflow-hidden bg-border/50"
      style={{ width: max > 0 ? `${(total / max) * 100}%` : "0%" }}
      title={seg.map((s) => `${s.label}: ${money2.format(s.value)}`).join(" · ")}
    >
      {total > 0
        ? seg.map((s) =>
            s.value > 0 ? (
              <div key={s.label} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />
            ) : null,
          )
        : null}
    </div>
  );
}

export function CommissionEconomicsCard() {
  const { proyectos, periodo, factorImpuestos, cap } = ECONOMIA;
  const totalValor = sum(proyectos.map((p) => p.valorVendido));
  const totalComision = sum(proyectos.map((p) => p.comisionTotal));
  const totalPeriodo = sum(proyectos.map((p) => p.periodo.total));
  const maxPeriodo = Math.max(...proyectos.map((p) => p.periodo.total));

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Valor vendido colocado"
          value={money0.format(totalValor)}
          hint={`${sum(proyectos.map((p) => p.unidades))} unidades con comisión`}
        />
        <KpiCard
          label={`Comisión que generan (${pct1(cap)})`}
          value={money0.format(totalComision)}
          hint="a lo largo de la vida de esas ventas"
        />
        <KpiCard
          label={`Liberado en ${periodo}`}
          value={money0.format(totalPeriodo)}
          hint="lo que devengó el período, no el acumulado"
        />
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted m-0 mb-2">
          La cadena del {pct1(cap)} — por proyecto
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 pr-3">Proyecto</th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Valor vendido</th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">
                  Base sin impuestos
                </th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">
                  Comisión {pct1(cap)}
                </th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">
                  Estructura comercial
                </th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 pl-3">
                  Puerta Abierta
                </th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 font-medium text-text-primary">
                    {p.name}
                    <span className="block text-[11px] text-muted font-normal">{p.unidades} unidades</span>
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.valorVendido)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted">{money0.format(p.baseSinImpuestos)}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold">{money0.format(p.comisionTotal)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.estructuraComercial)}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">{money0.format(p.puertaAbierta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNote>
          Precio de venta ÷ {factorImpuestos} (IVA + timbre) = base; base × {pct1(cap)} = comisión, que se parte
          mitad estructura comercial y mitad Puerta Abierta. Las tres relaciones se verifican al centavo en los
          tres proyectos al regenerar el snapshot.
        </SourceNote>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted m-0 mb-2">
          Liberado en {periodo}, por fase
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 pr-3">Proyecto</th>
                <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3 w-[24%]">
                  Reparto por fase
                </th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Fase 1</th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Fase 2</th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Fase 3</th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Total</th>
                <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 pl-3">
                  A pagar neto
                </th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr key={p.name} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 font-medium text-text-primary">{p.name}</td>
                  <td className="py-2 px-3">
                    <PhaseBar p={p} max={maxPeriodo} />
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.periodo.fase1)}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.periodo.fase2)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-muted">
                    {p.periodo.fase3 > 0 ? money0.format(p.periodo.fase3) : "—"}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold">{money0.format(p.periodo.total)}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">
                    {p.periodo.aPagar !== null ? money2.format(p.periodo.aPagar) : "—"}
                    {p.periodo.aFacturar !== null ? (
                      <span className="block text-[11px] text-muted font-normal">
                        {money2.format(p.periodo.aFacturar)} a facturar
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNote>
          Fase 1 se dispara con la reserva cobrada, Fase 2 es proporcional al cobro del mes y Fase 3 con la firma
          de escrituras. «A pagar neto» es lo que sale a los beneficiarios después de ISR; «a facturar» es el
          bruto con IVA. La diferencia entre la mitad comercial del período y la planilla queda en el bucket de
          ahorro y en líneas no liquidadas — ese puente todavía no está trazado celda por celda.
        </SourceNote>
      </div>

      <div className="grid gap-2">
        <MissingFlag label="Comisión devengada acumulada a la fecha" />
        <WarningBanner>
          La hoja «Resumen Ahorros» del libro trae el acumulado por proyecto, pero sus etiquetas de mes terminan
          en agosto 2025 aunque su última fila ya carga las cifras de este período: le faltan los meses
          intermedios. Por eso no se publica un «pagado contra pendiente» acumulado — sería un porcentaje sobre
          una base incompleta.
        </WarningBanner>
        {ECONOMIA.sinDatoDeVida.map((s) => (
          <WarningBanner key={s.name}>
            <strong>{s.name}:</strong> {s.motivo}
          </WarningBanner>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Odoo · fila 3 — status repartido por proyecto, incluyendo Puerta Abierta
// ---------------------------------------------------------------------------

export type StatusRepartido = {
  kind: "status-repartido";
};

/**
 * El 5% del período repartido por proyecto, separando la parte que sale a la
 * estructura comercial de la que retiene Puerta Abierta como área corporativa.
 * Puerta Abierta es la empresa y también recibe presupuesto — sin esa línea el
 * desglose por proyecto no suma el total generado.
 */
export function StatusRepartidoCard() {
  const { proyectos, periodo } = ECONOMIA;
  const totalCorporativo = sum(proyectos.map((p) => p.periodo.puertaAbierta));
  const totalComercial = sum(proyectos.map((p) => p.periodo.estructuraComercial));
  const total = totalComercial + totalCorporativo;
  const max = Math.max(...proyectos.map((p) => p.periodo.total));

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={`Comisión del período — ${periodo}`} value={money2.format(total)} />
        <KpiCard
          label="Estructura comercial"
          value={money2.format(totalComercial)}
          hint={`${pct1(totalComercial / total)} del total`}
        />
        <KpiCard
          label="Puerta Abierta — Corporativo"
          value={money2.format(totalCorporativo)}
          hint={`${pct1(totalCorporativo / total)} del total`}
        />
      </div>

      <div className="grid gap-2.5">
        {proyectos.map((p) => (
          <div key={p.name} className="grid grid-cols-[150px_1fr] items-center gap-3">
            <span className="text-[13px] font-medium text-text-primary">{p.name}</span>
            <div className="flex items-center gap-2">
              <div
                className="flex h-5 rounded overflow-hidden bg-border/50 min-w-0"
                style={{ width: max > 0 ? `${(p.periodo.total / max) * 100}%` : "0%" }}
              >
                <div
                  className="bg-primary"
                  style={{ width: `${(p.periodo.estructuraComercial / p.periodo.total) * 100}%` }}
                  title={`Estructura comercial: ${money2.format(p.periodo.estructuraComercial)}`}
                />
                <div
                  className="bg-[#0d9488]"
                  style={{ width: `${(p.periodo.puertaAbierta / p.periodo.total) * 100}%` }}
                  title={`Puerta Abierta (Corporativo): ${money2.format(p.periodo.puertaAbierta)}`}
                />
              </div>
              <span className="text-xs tabular-nums text-muted whitespace-nowrap">
                {money0.format(p.periodo.total)}
              </span>
            </div>
          </div>
        ))}
        {/* Los proyectos sin comisión del período se listan igual, en cero: que un
            proyecto no aparezca se lee como omisión, no como "no generó nada". */}
        {ECONOMIA.sinDatoDeVida
          .filter((s) => s.aPagarPeriodo === 0)
          .map((s) => (
            <div key={s.name} className="grid grid-cols-[150px_1fr] items-center gap-3">
              <span className="text-[13px] font-medium text-muted">{s.name}</span>
              <span className="text-xs text-muted">Sin comisión en el período</span>
            </div>
          ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary" /> Estructura comercial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#0d9488]" /> Puerta Abierta — Corporativo
        </span>
      </div>

      <SourceNote>
        Puerta Abierta aparece como área corporativa porque la empresa retiene la mitad del {pct1(ECONOMIA.cap)}{" "}
        de cada venta; es la misma figura que en el fondeo se registra como Corporativo / Administrativo. Cifras
        del período, no acumuladas — cuadran contra la columna PUERTA del libro de comisiones.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comisiones · filas 4 y 5 — revisión de Dirección General y de Ejecutivos
// ---------------------------------------------------------------------------

/**
 * El Calendario Contable lista "Revisión Dirección General" y "Revisión
 * Ejecutivos" como dos entregables distintos, pero ambos miran exactamente la
 * misma cifra sobre la misma planilla: no son dos cálculos ni dos cortes. Se
 * muestran como una sola fila con las dos audiencias rotuladas, en vez de
 * repetir el mismo componente dos veces.
 */
export type ApprovalStatus = {
  kind: "approval-status";
  period: string;
  audiencias: { name: string; que: string }[];
  projects: { name: string; status: "ok" | "sin-actividad"; total: number }[];
};

export function ApprovalStatusList({ data }: { data: ApprovalStatus }) {
  const total = sum(data.projects.map((p) => p.total));
  return (
    <div className="grid gap-3">
      <KpiCard
        label={`Comisión neta a pagar — ${data.period}`}
        value={money2.format(total)}
        hint="después de ISR, con IVA incluido en la factura"
      />

      <div className="grid gap-2">
        {data.projects.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
          >
            <span className="text-sm text-text-primary font-medium">{p.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-text-primary">{money2.format(p.total)}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                  p.status === "ok" ? "bg-success/10 text-success" : "bg-slate-400/10 text-muted"
                }`}
                title={
                  p.status === "ok"
                    ? "Cuadrado: las líneas por beneficiario suman exactamente el total del proyecto en la hoja de pagos."
                    : "Sin actividad: el proyecto no generó comisión en el período."
                }
              >
                {p.status === "ok" ? "Cuadrado" : "Sin actividad"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {data.audiencias.map((a) => (
          <div key={a.name} className="rounded-lg border border-border px-3 py-2">
            <span className="block text-xs font-semibold text-text-primary">{a.name}</span>
            <span className="block text-[11px] text-muted leading-4 mt-0.5">{a.que}</span>
          </div>
        ))}
      </div>

      <SourceNote>
        La cifra es la comisión neta a pagar del período, después de ISR e IVA. «Cuadrado» significa que las
        líneas por beneficiario suman exactamente el total del proyecto en la hoja de pagos — es un cuadre
        aritmético del archivo, no un registro de que alguien firmó la revisión.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comisiones · fila 6 — planilla de pago
// ---------------------------------------------------------------------------

export type PaymentRun = {
  kind: "payment-run";
  period: string;
  total: number;
  projects: { name: string; total: number }[];
};

export function PaymentRunCard({ data }: { data: PaymentRun }) {
  // Q0 en un proyecto es un hecho confirmado (no hay unidades en fase de
  // cobro), no un dato faltante — no se marca con `noData`, que es para lo que
  // no se pudo capturar. Se explica en la nota debajo del gráfico.
  const bars: BarDatum[] = data.projects.map((p) => ({
    label: p.name,
    value: p.total,
  }));

  return (
    <div className="grid gap-4">
      <KpiCard label={`Total a pagar — ${data.period}`} value={money2.format(data.total)} />
      <HorizontalBarChart data={bars} format={(v) => money0.format(v)} />
      <SourceNote>Casa Elisa sin comisiones en este período (no hay unidades en fase de cobro).</SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presupuestos de Mercadeo · fila 1 — gasto oficial de mercadeo
// ---------------------------------------------------------------------------

export type MercadeoOficial = {
  kind: "mercadeo-oficial";
  acumulado: { value: number; periodo: string; fuente: string };
  semestre: { periodo: string; real: number; presupuesto: number; presupuestoAnual: number };
  porProyecto: {
    name: string;
    presupuestoAnual: number;
    presupuestoSemestre: number;
    realSemestre: number;
  }[];
};

export function MercadeoOficialCard({ data }: { data: MercadeoOficial }) {
  const ejecucion = data.semestre.real / data.semestre.presupuesto;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Acumulado desde inicio" value={money0.format(data.acumulado.value)} hint={data.acumulado.periodo} />
        <KpiCard
          label={`Real — ${data.semestre.periodo}`}
          value={money0.format(data.semestre.real)}
          hint={`vs. presupuesto del semestre ${money0.format(data.semestre.presupuesto)}`}
          negative={ejecucion > 1}
        />
        <KpiCard
          label={`% ejecución del semestre`}
          value={pct1(ejecucion)}
          hint={ejecucion > 1 ? "sobre presupuesto" : "dentro de presupuesto"}
          negative={ejecucion > 1}
          positive={ejecucion <= 1}
        />
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted m-0 mb-2">
          Por proyecto — real de {data.semestre.periodo} contra el presupuesto del mismo semestre
        </h4>
        <BulletChart
          formatValue={(v) => money0.format(v)}
          lowerIsBetter
          items={data.porProyecto.map((p) => ({
            label: p.name,
            value: p.realSemestre,
            target: p.presupuestoSemestre,
            subtitle: `anual ${money0.format(p.presupuestoAnual)}`,
          }))}
        />
      </div>
      <SourceNote>
        {data.acumulado.fuente}. La barra es el gasto real de {data.semestre.periodo} y la línea negra el
        presupuesto de <strong>ese mismo semestre</strong>, para que las dos midan el mismo período; el
        presupuesto anual de cada proyecto va rotulado debajo del nombre. Verde es quedar dentro del
        presupuesto y rojo pasarse — al revés que en una meta de ventas.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presupuestos de Mercadeo · fila 2 — status de fondeo
// ---------------------------------------------------------------------------

export type FondeoStatus = {
  kind: "fondeo-status";
  total: number;
  porProyecto: {
    name: string;
    mercadeo: number;
    corporativo: number;
    comisiones: number;
    total: number;
    comisionesConcilia: boolean | null;
  }[];
  conciliaNota: string;
};

/**
 * "Conciliar" aquí significa una cosa concreta: que el monto de comisiones que
 * este archivo registra como fondeado para el proyecto coincida con lo que el
 * libro «Puerta Abierta Resultados y Dividendos» tiene anotado para el mismo
 * proyecto. Que no concilie no implica que el número esté mal — implica que los
 * dos libros no se han cruzado.
 *
 * Va sobre el total de Comisiones al hacer hover y no como columna propia: en
 * una vista directiva una columna de "NO CONCILIA" pesa más de lo que el hecho
 * amerita, y sin la explicación al lado no se entiende contra qué no concilia.
 */
function conciliaTexto(v: boolean | null, name: string): string {
  if (v === true)
    return `Concilia: el monto de comisiones de ${name} coincide con lo registrado en el libro Puerta Abierta Resultados y Dividendos.`;
  if (v === false)
    return `No concilia: el monto de comisiones de ${name} no coincide con lo registrado en el libro Puerta Abierta Resultados y Dividendos. Falta cruzar los dos libros; no significa que la cifra de fondeo esté mal.`;
  return `Sin contraparte: ${name} no tiene registro de comisiones en el libro Puerta Abierta Resultados y Dividendos, así que no hay contra qué cruzarlo.`;
}

function ConciliaDot({ v }: { v: boolean | null }) {
  const className = v === true ? "bg-success" : v === false ? "bg-danger" : "bg-warning";
  return <span aria-hidden="true" className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 align-middle ${className}`} />;
}

export function FondeoStatusTable({ data }: { data: FondeoStatus }) {
  return (
    <div className="grid gap-3">
      <KpiCard label="Fondos recibidos — total" value={money0.format(data.total)} hint="Mercadeo + Corporativo + Comisiones" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 pr-3">Proyecto</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Mercadeo</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Corporativo</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Comisiones</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 pl-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.porProyecto.map((p) => (
              <tr key={p.name} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-text-primary">{p.name}</td>
                <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.mercadeo)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.corporativo)}</td>
                <td
                  className="py-2 px-3 text-right tabular-nums cursor-help"
                  title={conciliaTexto(p.comisionesConcilia, p.name)}
                >
                  {money0.format(p.comisiones)}
                  <ConciliaDot v={p.comisionesConcilia} />
                </td>
                <td className="py-2 pl-3 text-right tabular-nums font-semibold">{money0.format(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceNote>
        {data.conciliaNota} El punto de color junto a cada monto de Comisiones indica si esa cifra ya se cruzó
        contra ese libro — pasá el cursor sobre el monto para ver qué significa en cada proyecto.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presupuestos de Mercadeo · fila 3 — centros de costo
// ---------------------------------------------------------------------------

export type CentrosCosto = {
  kind: "centros-costo";
  periodo: string;
  centros: { name: string; gasto: number | null }[];
  administrativoOperativo: number;
  totalTodosLosCentros: number;
  presupuestoDisponible: boolean;
};

export function CentrosCostoChart({ data }: { data: CentrosCosto }) {
  const bars: BarDatum[] = data.centros.map((c) => ({
    label: c.name,
    value: c.gasto ?? 0,
    noData: c.gasto === null,
  }));
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label={`Administrativo / Operativo — ${data.periodo}`} value={money0.format(data.administrativoOperativo)} hint="Luz, papelería, internet, renta" />
        <KpiCard label="Total de los 6 centros" value={money0.format(data.totalTodosLosCentros)} hint="Incluye planilla por área, no sólo administrativo" />
      </div>
      <HorizontalBarChart data={bars} format={(v) => money0.format(v)} />
      {!data.presupuestoDisponible ? (
        <MissingFlag label="Presupuesto por centro de costo 2026" />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presupuestos Odoo · fila 1 — presupuesto vs ejecutado
// ---------------------------------------------------------------------------

export type PresupuestoVsEjecutado = {
  kind: "presupuesto-vs-ejecutado";
  fuenteReal: string;
  totalPresupuesto: number;
  totalEjecutado: number;
  porProyecto: { name: string; presupuesto: number; ejecutado: number }[];
};

export function PresupuestoVsEjecutadoCard({ data }: { data: PresupuestoVsEjecutado }) {
  const excedido = data.totalEjecutado > data.totalPresupuesto;
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Presupuesto de proyecto" value={money0.format(data.totalPresupuesto)} />
        <KpiCard
          label="Ejecutado"
          value={money0.format(data.totalEjecutado)}
          negative={excedido}
          positive={!excedido}
          hint={excedido ? "sobre presupuesto" : "dentro de presupuesto"}
        />
      </div>
      <BulletChart
        formatValue={(v) => money0.format(v)}
        lowerIsBetter
        items={data.porProyecto.map((p) => ({ label: p.name, value: p.ejecutado, target: p.presupuesto }))}
      />
      <SourceNote>
        Fuente real: {data.fuenteReal}. La barra es el ejecutado y la línea negra el presupuesto del proyecto:
        verde es quedar dentro del presupuesto, rojo es pasarse.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contabilidad General · fila 2 — valor de proyectos
// ---------------------------------------------------------------------------

export type ValorProyectos = {
  kind: "valor-proyectos";
  proyectos: { name: string; valor: number | null; revalorizacion: number | null }[];
};

export function ValorProyectosChart({ data }: { data: ValorProyectos }) {
  const bars: BarDatum[] = data.proyectos.map((p) => ({
    label: p.name,
    value: p.valor ?? 0,
    detail: p.revalorizacion !== null ? `Revalorización: ${pct1(p.revalorizacion)}` : undefined,
    noData: p.valor === null,
  }));
  const missing = data.proyectos.filter((p) => p.valor === null);
  return (
    <div className="grid gap-3">
      <HorizontalBarChart data={bars} format={(v) => money0.format(v)} labelWidth={140} />
      {missing.map((p) => (
        <MissingFlag key={p.name} label={`Valor de proyecto — ${p.name}`} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cobros · fila 1 — resumen de cobros por proyecto
// ---------------------------------------------------------------------------

export type CobrosResumen = {
  kind: "cobros-resumen";
  corte: string;
  porProyecto: {
    name: string;
    mesEsperado: number;
    mesEfectuado: number;
    acumEsperado: number;
    acumEfectuado: number;
    totalAdeudado: number;
    totalApartamentos: number;
    clienteAlDia: number;
    clienteAtrasado: number;
    engancheCompletado: number;
    superavitEnganche: number;
    disponible: number;
    conciliacionConfiable: boolean;
  }[];
  fueraDeAlcance: string[];
};

export function CobrosResumenTable({ data }: { data: CobrosResumen }) {
  const totalMesEsperado = data.porProyecto.reduce((s, p) => s + p.mesEsperado, 0);
  const totalMesEfectuado = data.porProyecto.reduce((s, p) => s + p.mesEfectuado, 0);
  const totalAdeudado = data.porProyecto.reduce((s, p) => s + p.totalAdeudado, 0);
  const totalAtrasado = data.porProyecto.reduce((s, p) => s + p.clienteAtrasado, 0);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={`Cobrado del mes — corte ${data.corte}`} value={money0.format(totalMesEfectuado)} hint={`vs. ${money0.format(totalMesEsperado)} esperado`} />
        <KpiCard label="Total adeudado" value={money0.format(totalAdeudado)} negative />
        <KpiCard label="Clientes atrasados" value={String(totalAtrasado)} negative />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 pr-3">Proyecto</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Esperado del mes</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Efectuado del mes</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Adeudado</th>
              <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 pl-3">Atrasados</th>
            </tr>
          </thead>
          <tbody>
            {data.porProyecto.map((p) => (
              <tr key={p.name} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-3 font-medium text-text-primary">{p.name}</td>
                <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.mesEsperado)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.mesEfectuado)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{money0.format(p.totalAdeudado)}</td>
                <td className="py-2 pl-3 text-right tabular-nums font-semibold">{p.clienteAtrasado} / {p.totalApartamentos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.porProyecto.some((p) => !p.conciliacionConfiable) ? (
        <SourceNote>
          El bloque de conciliación (Efectivo acumulado, Cobros realizados, Saldo Conciliado) de{" "}
          {data.porProyecto.filter((p) => !p.conciliacionConfiable).map((p) => p.name).join(" y ")} apunta por
          fórmula a la hoja de Benestare en el archivo fuente — se omite hasta que Contabilidad lo corrija.
          Las columnas de esperado/efectuado sí son propias de cada proyecto.
        </SourceNote>
      ) : null}
      {data.fueraDeAlcance.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.fueraDeAlcance.map((name) => (
            <MissingFlag key={name} label={`Cobros — ${name}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cobros · fila 2 — alerta de desistimiento (Expedientes)
// ---------------------------------------------------------------------------

export type CobrosAlertasDesistimiento = {
  kind: "cobros-alertas-desistimiento";
  totalDesistidos: number;
  totalTratosPerdidos: number;
  porProyecto: { name: string; desistidos: number }[];
};

export function CobrosAlertasCard({ data }: { data: CobrosAlertasDesistimiento }) {
  const bars: BarDatum[] = data.porProyecto.map((p) => ({ label: p.name, value: p.desistidos }));
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Desistimientos (Expedientes)" value={String(data.totalDesistidos)} negative />
        <KpiCard label="Tratos perdidos, todas las causas" value={String(data.totalTratosPerdidos)} hint="incluye motivos no relacionados a desistimiento" />
      </div>
      <HorizontalBarChart data={bars} format={(v) => String(v)} labelWidth={150} />
      <SourceNote>
        Cuenta sólo los tratos marcados con un motivo explícito de desistimiento en el pipeline de créditos —
        no incluye clientes simplemente atrasados en su pago, ni tratos perdidos por otras razones.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comisiones · fila 1 — cierre de ventas (unidades colocadas)
// ---------------------------------------------------------------------------

export type ComisionesVentas = {
  kind: "comisiones-ventas";
  porProyecto: { name: string; vendidoReservado: number; totalApartamentos: number }[];
  fueraDeAlcance: string[];
};

export function ComisionesVentasChart({ data }: { data: ComisionesVentas }) {
  const bars: BarDatum[] = data.porProyecto.map((p) => ({
    label: p.name,
    value: p.vendidoReservado,
    detail: `de ${p.totalApartamentos} unidades totales`,
  }));
  return (
    <div className="grid gap-3">
      <HorizontalBarChart data={bars} format={(v) => String(v)} labelWidth={150} />
      {data.fueraDeAlcance.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.fueraDeAlcance.map((name) => (
            <MissingFlag key={name} label={`Ventas — ${name}`} />
          ))}
        </div>
      ) : null}
      <SourceNote>Unidades vendidas o reservadas (total − disponible), foto acumulada al corte — no es alta de ventas del mes.</SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cesión de Derechos · fila 1 — resumen de clientes
// ---------------------------------------------------------------------------

export type CesionClientes = {
  kind: "cesion-clientes";
  casos: {
    apartamento: string;
    cliente: string | null;
    fechaFirmaPromesa: string | null;
    fechaNuevaVenta: string | null;
    engancheADevolver: number;
    gapCliente: number;
    gapFiston: number;
  }[];
};

export function CesionClientesTable({ data }: { data: CesionClientes }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[680px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 pr-3">Apto.</th>
            <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Cliente</th>
            <th className="text-left font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Nueva venta</th>
            <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">Enganche a devolver</th>
            <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 px-3">GAP Cliente</th>
            <th className="text-right font-semibold text-muted text-xs uppercase tracking-wide py-2 pl-3">GAP Fiston</th>
          </tr>
        </thead>
        <tbody>
          {data.casos.map((c) => (
            <tr key={c.apartamento} className="border-b border-border last:border-b-0">
              <td className="py-2 pr-3 font-medium text-text-primary tabular-nums">{c.apartamento}</td>
              <td className="py-2 px-3 text-text-primary">
                {c.cliente ?? <span className="text-warning text-xs">Sin nombre — Data no existe</span>}
              </td>
              <td className="py-2 px-3 text-muted">{c.fechaNuevaVenta ?? "—"}</td>
              <td className="py-2 px-3 text-right tabular-nums">{money0.format(c.engancheADevolver)}</td>
              <td className="py-2 px-3 text-right tabular-nums">{money0.format(c.gapCliente)}</td>
              <td className="py-2 pl-3 text-right tabular-nums font-semibold">{money0.format(c.gapFiston)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cesión de Derechos · fila 2 — reporte directivo
// ---------------------------------------------------------------------------

export type CesionDirectivo = {
  kind: "cesion-directivo";
  monetario: { engancheADevolver: number; gapCliente: number; gapFiston: number };
  desistimientoPorBloque: { name: string; desistidos: number }[];
};

export function CesionDirectivoCard({ data }: { data: CesionDirectivo }) {
  const bars: BarDatum[] = data.desistimientoPorBloque.map((p) => ({ label: p.name, value: p.desistidos }));
  return (
    <div className="grid gap-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted m-0 mb-2">Monetario — cesión de derechos</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Enganche a devolver" value={money0.format(data.monetario.engancheADevolver)} />
          <KpiCard label="GAP Cliente" value={money0.format(data.monetario.gapCliente)} />
          <KpiCard label="GAP Fiston" value={money0.format(data.monetario.gapFiston)} hint="parte del negocio" />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted m-0 mb-2">Desistimientos por bloque (proyecto)</h4>
        <HorizontalBarChart data={bars} format={(v) => String(v)} labelWidth={150} />
        <SourceNote>
          Es el mismo conteo que la alerta de desistimiento en Cobros —{" "}
          {data.desistimientoPorBloque.reduce((s, p) => s + p.desistidos, 0)} tratos con motivo explícito de
          desistimiento en el pipeline de créditos — repetido aquí junto al monetario de cesión. No son dos
          mediciones distintas que coinciden: es el mismo dato visto desde el ángulo de cesión de derechos.
        </SourceNote>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contabilidad General · fila 1 — inventarios (disponibilidad)
// ---------------------------------------------------------------------------

export type InventarioDisponibilidad = {
  kind: "inventario-disponibilidad";
  porProyecto: { name: string; disponible: number; totalApartamentos: number }[];
  fueraDeAlcance: string[];
};

export function InventarioDisponibilidadChart({ data }: { data: InventarioDisponibilidad }) {
  const bars: BarDatum[] = data.porProyecto.map((p) => ({
    label: p.name,
    value: p.disponible,
    detail: `de ${p.totalApartamentos} unidades totales`,
  }));
  return (
    <div className="grid gap-3">
      <HorizontalBarChart data={bars} format={(v) => String(v)} labelWidth={150} />
      {data.fueraDeAlcance.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.fueraDeAlcance.map((name) => (
            <MissingFlag key={name} label={`Inventario — ${name}`} />
          ))}
        </div>
      ) : null}
      <SourceNote>
        Unidades disponibles (no vendidas ni reservadas), tratado como el equivalente de inventario en bienes
        raíces — hipótesis de trabajo, sin confirmar con Contabilidad todavía.
      </SourceNote>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desistimientos — vive en /valorizacion, aquí sólo un resumen en vivo
// ---------------------------------------------------------------------------

export type LiveDesistimientos = {
  kind: "live-desistimientos";
};

type HudDesistidoRow = {
  unit: string;
  project: string;
  currency: string;
  fecha: string | null;
  motivo: string | null;
  estadoActual: string;
  precioLista: number | null;
};

type HudVentasSlice = {
  reembolsos: {
    desistedReservations: number;
    cancelledSales: number;
    porMoneda: { currency: string; totalPagado: number; totalReembolsado: number; retencion: number }[];
  };
  desistidos: HudDesistidoRow[];
};

/**
 * Cuatro filas de Desistimientos montan LiveDesistimientosCard por separado, y
 * cada una llamaba useHudVentas() de forma independiente — cuatro fetches al
 * mismo endpoint por cada carga de página. Se cachea la promesa a nivel de
 * módulo para que las cuatro compartan una sola petición.
 */
let hudVentasPromise: Promise<HudVentasSlice> | null = null;

function fetchHudVentas(): Promise<HudVentasSlice> {
  if (!hudVentasPromise) {
    hudVentasPromise = fetch("/api/hud/ventas")
      .then(async (r) => {
        if (r.ok) return (await r.json()) as HudVentasSlice;
        if (r.status === 401) markSessionExpired();
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      })
      .catch((e: Error) => {
        hudVentasPromise = null; // permite reintentar en el próximo montaje
        throw e;
      });
  }
  return hudVentasPromise;
}

function useHudVentas() {
  const [data, setData] = useState<HudVentasSlice | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchHudVentas()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);
  return { data, error };
}

// ---------------------------------------------------------------------------
// Señal de sesión vencida
// ---------------------------------------------------------------------------

/**
 * Las secciones estáticas se arman desde el JSON del bundle, así que si la
 * sesión vence con la página abierta el tablero sigue viéndose completo y sólo
 * las dos filas en vivo quedan muertas. Cuando un endpoint responde 401 se
 * levanta esta señal, y la página muestra un aviso único arriba en vez de
 * dejar el error escondido en dos líneas pequeñas.
 */
let sessionExpired = false;
const sessionListeners = new Set<() => void>();

function markSessionExpired() {
  if (sessionExpired) return;
  sessionExpired = true;
  for (const listener of sessionListeners) listener();
}

export function useSessionExpired(): boolean {
  return useSyncExternalStore(
    (listener) => {
      sessionListeners.add(listener);
      return () => sessionListeners.delete(listener);
    },
    () => sessionExpired,
    () => false, // en el servidor nunca hay sesión vencida
  );
}

function LiveLoading() {
  return <div className="h-20 rounded-lg bg-border/40 animate-pulse" />;
}

function LiveError({ message }: { message: string }) {
  return <p className="text-sm text-danger m-0">No se pudo cargar el dato en vivo: {message}</p>;
}

/** Resumen para directiva, tomado en vivo de /api/hud/ventas — la misma fuente que /valorizacion, resumida, sin la tabla operativa completa. */
export function LiveDesistimientosCard({ num }: { num: string }) {
  const { data, error } = useHudVentas();
  if (error) return <LiveError message={error} />;
  if (!data) return <LiveLoading />;

  if (num === "2" || num === "3") {
    const totalPagado = data.reembolsos.porMoneda.reduce((s, m) => s + m.totalPagado, 0);
    const totalReembolsado = data.reembolsos.porMoneda.reduce((s, m) => s + m.totalReembolsado, 0);
    const totalRetencion = data.reembolsos.porMoneda.reduce((s, m) => s + m.retencion, 0);
    return (
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Pagado por clientes desistidos" value={money0.format(totalPagado)} />
          <KpiCard label="Reembolsado" value={money0.format(totalReembolsado)} negative />
          <KpiCard label="Retenido" value={money0.format(totalRetencion)} hint="gastos administrativos retenidos" />
        </div>
        {data.reembolsos.porMoneda.length > 1 ? (
          <SourceNote>Montos por moneda: {data.reembolsos.porMoneda.map((m) => `${m.currency} ${money0.format(m.totalPagado)}`).join(" · ")}</SourceNote>
        ) : null}
      </div>
    );
  }

  if (num === "4") {
    const bars: BarDatum[] = Object.entries(
      data.desistidos.reduce<Record<string, number>>((acc, d) => {
        acc[d.project] = (acc[d.project] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ label: name, value }));
    return (
      <div className="grid gap-3">
        <KpiCard label="Clientes desistidos" value={String(data.desistidos.length)} negative />
        <HorizontalBarChart data={bars} format={(v) => String(v)} labelWidth={150} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <KpiCard label="Reservaciones desistidas" value={String(data.reembolsos.desistedReservations)} negative />
      <KpiCard label="Ventas canceladas" value={String(data.reembolsos.cancelledSales)} negative />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PCV & Expedientes — vive en /creditos/pipeline, aquí sólo un resumen en vivo
// ---------------------------------------------------------------------------

export type LiveExpedientes = {
  kind: "live-expedientes";
};

type PipelineSlice = {
  totalTratos: number;
  estados: Record<string, number>;
  etapasGlobal: { etapa: string; orden: number; open: number; lost: number; won: number }[];
};

export function LiveExpedientesCard() {
  const [data, setData] = useState<PipelineSlice | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/creditos/pipeline")
      .then(async (r) => {
        if (r.ok) return (await r.json()) as PipelineSlice;
        if (r.status === 401) markSessionExpired();
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <LiveError message={error} />;
  if (!data) return <LiveLoading />;

  const bars: BarDatum[] = [...data.etapasGlobal]
    .sort((a, b) => a.orden - b.orden)
    .map((e) => ({ label: e.etapa, value: e.open, detail: `${e.lost} perdidos · ${e.won} ganados` }));

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Expedientes abiertos" value={String(data.estados.open ?? 0)} />
        <KpiCard label="Ganados" value={String(data.estados.won ?? 0)} positive />
        <KpiCard label="Perdidos" value={String(data.estados.lost ?? 0)} negative />
      </div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted m-0">Expedientes abiertos por etapa</h4>
      <HorizontalBarChart data={bars} format={(v) => String(v)} labelWidth={170} />
      <SourceNote>{data.totalTratos} tratos en total, todas las etapas del proceso de crédito y armado de expediente.</SourceNote>
    </div>
  );
}
