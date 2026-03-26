"use client";

import type { CesionUnit } from "@/lib/reservas/types";
import { formatCurrency } from "@/lib/reservas/constants";

function getEstatus(r: CesionUnit): string {
  return r.compliance_status === "behind" ? "ATRASADO" : "AL DÍA";
}

const COLS: [string, string][] = [
  ["client_name", "Cliente"],
  ["unit_number", "Apto"],
  ["unit_type", "Modelo"],
  ["price_list", "Precio Venta"],
  ["enganche_pagado", "Pagado"],
  ["diferencia", "Diferencia"],
  ["compliance_status", "Estatus"],
  ["pcv_block", "Bloque"],
  ["precalificacion_status", "Precalif."],
  ["razon_compra", "Razón Compra"],
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

interface DrillDownModalProps {
  drillDown: { title: string; records: CesionUnit[] } | null;
  drillFiltered: CesionUnit[];
  drillSearch: string;
  setDrillSearch: (v: string) => void;
  drillSortCol: string;
  drillSortDir: "asc" | "desc";
  handleDrillSort: (col: string) => void;
  onClose: () => void;
}

function renderCell(r: CesionUnit, col: string) {
  const estatus = getEstatus(r);
  switch (col) {
    case "client_name":
      return (
        <span className="font-medium max-w-[200px] overflow-hidden text-ellipsis block">
          {r.client_name ?? "\u2014"}
        </span>
      );
    case "unit_number":
      return <span className="text-muted">{r.unit_number}</span>;
    case "unit_type":
      return <span className="text-primary font-semibold">{r.unit_type}</span>;
    case "price_list":
      return <span className="tabular-nums">{formatCurrency(r.price_list)}</span>;
    case "enganche_pagado":
      return (
        <span className="tabular-nums">{formatCurrency(r.enganche_pagado)}</span>
      );
    case "diferencia":
      return (
        <span
          className={`tabular-nums font-semibold ${(r.diferencia ?? 0) >= 0 ? "text-success" : "text-danger"}`}
        >
          {formatCurrency(r.diferencia)}
        </span>
      );
    case "compliance_status":
      return (
        <Badge variant={estatus === "ATRASADO" ? "danger" : "success"}>
          {estatus}
        </Badge>
      );
    case "pcv_block":
      return <span className="text-muted">{r.pcv_block ?? "\u2014"}</span>;
    case "precalificacion_status": {
      const v =
        r.precalificacion_status === "APROBADA"
          ? "success"
          : r.precalificacion_status === "DENEGADA"
            ? "danger"
            : "neutral";
      return (
        <Badge variant={v as "success" | "danger" | "neutral"}>
          {r.precalificacion_status ?? "\u2014"}
        </Badge>
      );
    }
    case "razon_compra":
      return <span className="text-muted">{r.razon_compra ?? "\u2014"}</span>;
    case "tipo_cliente":
      return <span className="text-muted">{r.tipo_cliente ?? "\u2014"}</span>;
    default:
      return null;
  }
}

export default function DrillDownModal({
  drillDown,
  drillFiltered,
  drillSearch,
  setDrillSearch,
  drillSortCol,
  drillSortDir,
  handleDrillSort,
  onClose,
}: DrillDownModalProps) {
  if (!drillDown) return null;

  const totals = drillFiltered.reduce(
    (s, r) => ({
      v: s.v + (r.price_list ?? 0),
      p: s.p + (r.enganche_pagado ?? 0),
      d: s.d + (r.diferencia ?? 0),
    }),
    { v: 0, p: 0, d: 0 },
  );

  const thCls = (col: string) =>
    `px-3 py-2.5 text-left text-[11px] font-bold text-muted uppercase tracking-wider cursor-pointer select-none whitespace-nowrap border-b border-border ${
      drillSortCol === col ? "bg-blue-50/60" : ""
    }`;

  const tdCls =
    "px-3 py-2.5 text-sm border-b border-border whitespace-nowrap";

  const RIGHT_COLS = new Set(["price_list", "enganche_pagado", "diferencia"]);
  const CENTER_COLS = new Set(["pcv_block"]);

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-[95%] max-w-[1100px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-bold">{drillDown.title}</h3>
            <div className="text-xs text-muted mt-1">
              {drillFiltered.length} de {drillDown.records.length} registros
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-border rounded-md text-muted cursor-pointer text-lg w-9 h-9 flex items-center justify-center bg-transparent hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <input
            type="text"
            placeholder="Buscar cliente, apto o modelo..."
            value={drillSearch}
            onChange={(e) => setDrillSearch(e.target.value)}
            className="rounded-md border border-border px-3.5 py-2 text-sm w-full max-w-[400px] bg-white outline-none focus:border-primary"
          />
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                {COLS.map(([col, label]) => (
                  <th
                    key={col}
                    className={thCls(col)}
                    onClick={() => handleDrillSort(col)}
                  >
                    {label}{" "}
                    {drillSortCol === col
                      ? drillSortDir === "asc"
                        ? "\u25B2"
                        : "\u25BC"
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drillFiltered.map((r) => (
                <tr
                  key={r.unit_id}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  {COLS.map(([col]) => (
                    <td
                      key={col}
                      className={`${tdCls} ${RIGHT_COLS.has(col) ? "text-right" : ""} ${CENTER_COLS.has(col) ? "text-center" : ""}`}
                    >
                      {renderCell(r, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div className="px-6 py-3 border-t border-border flex gap-6 text-xs text-muted shrink-0">
          <span>
            Total Venta:{" "}
            <strong className="text-text-primary">
              {formatCurrency(totals.v)}
            </strong>
          </span>
          <span>
            Total Pagado:{" "}
            <strong className="text-text-primary">
              {formatCurrency(totals.p)}
            </strong>
          </span>
          <span>
            Diferencia:{" "}
            <strong
              className={totals.d >= 0 ? "text-success" : "text-danger"}
            >
              {formatCurrency(totals.d)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
