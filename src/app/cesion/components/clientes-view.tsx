"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import type { CesionUnit } from "@/lib/reservas/types";
import { formatCurrency, fmtQCompact } from "@/lib/reservas/constants";
import { BarTooltip } from "./chart-tooltips";

interface ClienteAgg {
  name: string;
  unidades: number;
  venta: number;
  pagado: number;
  diferencia: number;
  plusvalia: number;
}

interface ClientesViewProps {
  clienteAgg: ClienteAgg[];
  filtered: CesionUnit[];
  openDrillDown: (title: string, records: CesionUnit[]) => void;
}

export default function ClientesView({
  clienteAgg,
  filtered,
  openDrillDown,
}: ClientesViewProps) {
  // Recharts Bar onClick provides a BarRectangleItem; original data is in .payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    const name = (data?.payload?.name ?? data?.name) as string;
    if (!name) return;
    openDrillDown(
      `Cliente: ${name}`,
      filtered.filter((r) => r.client_name === name),
    );
  };

  return (
    <>
      {/* Top-15 bar chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-primary">
            Concentración por Cliente
          </h3>
          <div className="text-xs text-muted">
            Top 15 clientes por valor de cartera
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={clienteAgg.slice(0, 15)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v: number) => fmtQCompact(v)}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={180}
            />
            <Tooltip content={<BarTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="venta"
              name="Valor Venta"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer"
              onClick={handleBarClick}
            />
            <Bar
              dataKey="pagado"
              name="Pagado"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer"
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-text-primary">
            Resumen por Cliente
          </h3>
          <div className="text-xs text-muted mt-1">
            {clienteAgg.length} clientes únicos
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                {[
                  "Cliente",
                  "Unidades",
                  "Valor Total",
                  "Pagado",
                  "Diferencia",
                  "Plusvalía",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[11px] font-bold text-muted uppercase tracking-wider border-b border-border"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clienteAgg.map((c) => (
                <tr
                  key={c.name}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2.5 text-sm border-b border-border font-medium">
                    {c.name}
                  </td>
                  <td className="px-3 py-2.5 text-sm border-b border-border text-center text-primary font-semibold">
                    {c.unidades}
                  </td>
                  <td className="px-3 py-2.5 text-sm border-b border-border text-right tabular-nums">
                    {formatCurrency(c.venta)}
                  </td>
                  <td className="px-3 py-2.5 text-sm border-b border-border text-right tabular-nums">
                    {formatCurrency(c.pagado)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-sm border-b border-border text-right tabular-nums font-semibold ${
                      c.diferencia >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatCurrency(c.diferencia)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-sm border-b border-border text-right tabular-nums ${
                      c.plusvalia >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatCurrency(c.plusvalia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
