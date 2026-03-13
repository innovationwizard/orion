"use client";

import { useState } from "react";
import type { CesionUnit } from "@/lib/reservas/types";
import { formatCurrency } from "@/lib/reservas/constants";

function getEstatus(r: CesionUnit): string {
  return r.compliance_status === "behind" ? "ATRASADO" : "AL D\u00CDA";
}

interface CarteraViewProps {
  sorted: CesionUnit[];
  sortCol: string;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
  allData: CesionUnit[];
}

const COLUMNS: [string, string][] = [
  ["client_name", "Cliente"],
  ["unit_number", "Apto"],
  ["unit_type", "Modelo"],
  ["price_list", "Precio Venta"],
  ["price_suggested", "P. Sugerido"],
  ["plusvalia", "Plusval\u00EDa"],
  ["enganche_total", "Enganche Plan"],
  ["enganche_pagado", "Pagado"],
  ["diferencia", "Diferencia"],
  ["compliance_status", "Estatus"],
  ["pcv_block", "Bloque"],
  ["precalificacion_status", "Precalif."],
  ["razon_compra", "Raz\u00F3n Compra"],
  ["tipo_cliente", "Tipo Cliente"],
];

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "success" | "danger" | "neutral";
}) {
  const cls = {
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    neutral: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls[variant]}`}
    >
      {children}
    </span>
  );
}

function precalVariant(
  status: string | null,
): "success" | "danger" | "neutral" {
  if (status === "APROBADA") return "success";
  if (status === "DENEGADA") return "danger";
  return "neutral";
}

export default function CarteraView({
  sorted,
  sortCol,
  sortDir,
  onSort,
  allData,
}: CarteraViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const thCls = (col: string) =>
    `px-3 py-2.5 text-left text-[11px] font-bold text-muted uppercase tracking-wider cursor-pointer select-none whitespace-nowrap border-b border-border ${
      sortCol === col ? "bg-blue-50/60" : ""
    }`;

  const tdCls =
    "px-3 py-2.5 text-sm border-b border-border whitespace-nowrap";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-text-primary">
          Detalle de Cartera
        </h3>
        <div className="text-xs text-muted mt-1">
          {sorted.length} registros &middot; Click en columna para ordenar
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              {COLUMNS.map(([col, label]) => (
                <th
                  key={col}
                  className={thCls(col)}
                  onClick={() => onSort(col)}
                >
                  {label}{" "}
                  {sortCol === col ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const estatus = getEstatus(r);
              return (
                <tr
                  key={r.unit_id}
                  className={`cursor-pointer hover:bg-blue-50/40 transition-colors ${
                    selectedId === r.unit_id ? "bg-blue-50/60" : ""
                  }`}
                  onClick={() =>
                    setSelectedId(
                      selectedId === r.unit_id ? null : r.unit_id,
                    )
                  }
                >
                  <td
                    className={`${tdCls} font-medium max-w-[200px] overflow-hidden text-ellipsis`}
                  >
                    {r.client_name ?? "\u2014"}
                  </td>
                  <td className={`${tdCls} text-muted`}>{r.unit_number}</td>
                  <td className={`${tdCls} text-primary font-semibold`}>
                    {r.unit_type}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {formatCurrency(r.price_list)}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums text-muted`}>
                    {formatCurrency(r.price_suggested)}
                  </td>
                  <td
                    className={`${tdCls} text-right tabular-nums ${(r.plusvalia ?? 0) >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {formatCurrency(r.plusvalia)}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums text-muted`}>
                    {formatCurrency(r.enganche_total)}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {formatCurrency(r.enganche_pagado)}
                  </td>
                  <td
                    className={`${tdCls} text-right tabular-nums font-semibold ${(r.diferencia ?? 0) >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {formatCurrency(r.diferencia)}
                  </td>
                  <td className={tdCls}>
                    <Badge
                      variant={estatus === "ATRASADO" ? "danger" : "success"}
                    >
                      {estatus}
                    </Badge>
                  </td>
                  <td className={`${tdCls} text-center text-muted`}>
                    {r.pcv_block ?? "\u2014"}
                  </td>
                  <td className={tdCls}>
                    <Badge variant={precalVariant(r.precalificacion_status)}>
                      {r.precalificacion_status ?? "\u2014"}
                    </Badge>
                  </td>
                  <td className={`${tdCls} text-muted`}>
                    {r.razon_compra ?? "\u2014"}
                  </td>
                  <td className={`${tdCls} text-muted`}>
                    {r.tipo_cliente ?? "\u2014"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expandable detail panel */}
      {selectedId &&
        (() => {
          const r = allData.find((d) => d.unit_id === selectedId);
          if (!r) return null;
          const details: [string, string][] = [
            ["Precio Venta", formatCurrency(r.price_list)],
            ["Precio Sugerido", formatCurrency(r.price_suggested)],
            ["Plusval\u00EDa", formatCurrency(r.plusvalia)],
            ["Enganche Total", formatCurrency(r.enganche_total)],
            ["Enganche Pactado", formatCurrency(r.enganche_pactado)],
            ["Enganche Pagado", formatCurrency(r.enganche_pagado)],
            ["Diferencia", formatCurrency(r.diferencia)],
            ["Precio/m\u00B2", formatCurrency(r.precio_m2)],
            [
              "m\u00B2 Interno",
              r.area_interior ? `${r.area_interior} m\u00B2` : "\u2014",
            ],
            [
              "m\u00B2 Terraza",
              r.area_terrace ? `${r.area_terrace} m\u00B2` : "\u2014",
            ],
            [
              "m\u00B2 Total",
              r.area_total ? `${r.area_total} m\u00B2` : "\u2014",
            ],
            ["Raz\u00F3n de Compra", r.razon_compra ?? "\u2014"],
            ["Tipo de Cliente", r.tipo_cliente ?? "\u2014"],
          ];
          return (
            <div className="p-5 border-t border-border bg-blue-50/30">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h4 className="text-base font-bold">
                    {r.client_name ?? "\u2014"}
                  </h4>
                  <div className="text-muted text-sm mt-1">
                    Apto {r.unit_number} &middot; {r.unit_type} &middot; Bloque{" "}
                    {r.pcv_block ?? "\u2014"} &middot;{" "}
                    {r.area_total?.toFixed(2) ?? "\u2014"} m&sup2; totales
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(null);
                  }}
                  className="text-muted text-lg cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4">
                {details.map(([label, val]) => (
                  <div
                    key={label}
                    className="px-3.5 py-2.5 bg-card rounded-md border border-border"
                  >
                    <div className="text-[10px] text-muted uppercase tracking-wider mb-1">
                      {label}
                    </div>
                    <div className="text-sm font-semibold">{val}</div>
                  </div>
                ))}
              </div>
              {r.precalificacion_notes &&
                r.precalificacion_notes !== "0" && (
                  <div className="mt-3.5 px-4 py-3 bg-amber-50 rounded-md border border-amber-200">
                    <div className="text-[11px] text-warning font-semibold mb-1">
                      COMENTARIOS DE PRECALIFICACI&Oacute;N
                    </div>
                    <div className="text-sm">{r.precalificacion_notes}</div>
                  </div>
                )}
            </div>
          );
        })()}
    </div>
  );
}
