"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { CesionUnit } from "@/lib/reservas/types";
import { BarTooltip, PieTooltip } from "./chart-tooltips";
import type { CesionStats } from "./kpi-row";

const PIE_COLORS = [
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#3b82f6",
];
const PRECAL_COLORS = ["#10b981", "#ef4444", "#64748b", "#f59e0b"];

function getEstatus(r: CesionUnit): string {
  return r.compliance_status === "behind" ? "ATRASADO" : "AL DÍA";
}

interface PieItem {
  name: string;
  value: number;
}

interface BloqueRow {
  name: string;
  unidades: number;
}

// Recharts PieLabelRenderProps has many optional fields — we accept the full
// props bag and only destructure what we need, falling back to safe defaults.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePieLabel(colors: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PieLabel(props: any) {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      outerRadius = 0,
      index = 0,
      name = "",
      value = 0,
      percent = 0,
    } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={colors[index % colors.length]}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {name}: {value} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };
}

interface ResumenViewProps {
  filtered: CesionUnit[];
  stats: CesionStats;
  openDrillDown: (title: string, records: CesionUnit[]) => void;
}

export default function ResumenView({
  filtered,
  stats,
  openDrillDown,
}: ResumenViewProps) {
  // Estatus pie data
  const estatusData: PieItem[] = [
    { name: "Atrasado", value: stats.atrasados },
    { name: "Al Día", value: stats.alDia },
  ].filter((d) => d.value > 0);

  // Precalificación pie data
  const precalData: PieItem[] = [
    { name: "Aprobada", value: stats.aprobados },
    { name: "Denegada", value: stats.denegados },
    { name: "N/A", value: stats.na },
    { name: "Disponible", value: stats.disponible },
  ].filter((d) => d.value > 0);

  // Razón de compra pie data
  const razonMap: Record<string, number> = {};
  filtered.forEach((r) => {
    if (r.razon_compra)
      razonMap[r.razon_compra] = (razonMap[r.razon_compra] || 0) + 1;
  });
  const razonData = Object.entries(razonMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Tipo de cliente pie data
  const tipoMap: Record<string, number> = {};
  filtered.forEach((r) => {
    if (r.tipo_cliente)
      tipoMap[r.tipo_cliente] = (tipoMap[r.tipo_cliente] || 0) + 1;
  });
  const tipoData = Object.entries(tipoMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Bloque bar data
  const bloqueMap: Record<string, BloqueRow> = {};
  filtered.forEach((r) => {
    const k = `Bloque ${r.pcv_block ?? "\u2014"}`;
    if (!bloqueMap[k]) bloqueMap[k] = { name: k, unidades: 0 };
    bloqueMap[k].unidades++;
  });
  const bloqueData = Object.values(bloqueMap).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const totalCount = stats.count;

  const Card = ({
    title,
    sub,
    children,
  }: {
    title: string;
    sub: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      {children}
    </div>
  );

  // Recharts onClick handlers — Recharts event types (PieSectorDataItem,
  // BarRectangleItem) carry the original data merged in, but their TS types
  // don't reflect the user-supplied fields. Using `any` is unavoidable here.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEstatusClick = (data: any) => {
    const m: Record<string, string> = {
      Atrasado: "ATRASADO",
      "Al Día": "AL DÍA",
    };
    const name = (data?.name ?? data?.payload?.name) as string;
    if (m[name])
      openDrillDown(
        `Estatus: ${name}`,
        filtered.filter((r) => getEstatus(r) === m[name]),
      );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePrecalClick = (data: any) => {
    const m: Record<string, string> = {
      Aprobada: "APROBADA",
      Denegada: "DENEGADA",
      "N/A": "N/A",
      Disponible: "DISPONIBLE",
    };
    const name = (data?.name ?? data?.payload?.name) as string;
    if (m[name])
      openDrillDown(
        `Precalificación: ${name}`,
        filtered.filter((r) => r.precalificacion_status === m[name]),
      );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBloqueClick = (data: any) => {
    const name = (data?.name ?? data?.payload?.name) as string;
    const b = parseInt(name?.replace("Bloque ", "") ?? "");
    if (!isNaN(b))
      openDrillDown(
        `Bloque ${b}`,
        filtered.filter((r) => r.pcv_block === b),
      );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
      {/* Estatus de Cobros */}
      <Card title="Estatus de Cobros" sub="Distribución actual">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={estatusData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              label={makePieLabel(PIE_COLORS)}
              labelLine={false}
              onClick={handleEstatusClick}
            >
              {estatusData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i]}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip totalCount={totalCount} />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Precalificación Bancaria */}
      <Card
        title="Precalificación Bancaria"
        sub="Estado hipotecario"
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={precalData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              label={makePieLabel(PRECAL_COLORS)}
              labelLine={false}
              onClick={handlePrecalClick}
            >
              {precalData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PRECAL_COLORS[i]}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip totalCount={totalCount} />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Razón de Compra */}
      <Card title="Razón de Compra" sub="Motivo de adquisición">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={razonData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              label={makePieLabel(PIE_COLORS)}
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(data: any) => {
                const name = (data?.name ?? data?.payload?.name) as string;
                if (name) openDrillDown(`Razón: ${name}`, filtered.filter((r) => r.razon_compra === name));
              }}
            >
              {razonData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip totalCount={totalCount} />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Tipo de Cliente */}
      <Card
        title="Tipo de Cliente"
        sub="Clasificación de compradores"
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={tipoData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              label={makePieLabel(PIE_COLORS.slice(2))}
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(data: any) => {
                const name = (data?.name ?? data?.payload?.name) as string;
                if (name) openDrillDown(`Tipo: ${name}`, filtered.filter((r) => r.tipo_cliente === name));
              }}
            >
              {tipoData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip totalCount={totalCount} />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Análisis por Bloque */}
      <Card
        title="Análisis por Bloque"
        sub="Unidades por bloque PCV"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bloqueData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              allowDecimals={false}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar
              dataKey="unidades"
              name="Unidades"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={handleBloqueClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
