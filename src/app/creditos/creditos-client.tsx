"use client";

import { useState, useMemo } from "react";
import NavBar from "@/components/nav-bar";
import KpiCard from "@/components/kpi-card";
import CreditProgressBar from "@/components/creditos/progress-bar";
import DonutChart from "@/components/creditos/donut-chart";
import StackedBarChart from "@/components/creditos/stacked-bar-chart";
import GroupedBarChart from "@/components/creditos/grouped-bar-chart";
import RadarChart from "@/components/creditos/radar-chart";
import { useCreditUnits } from "@/hooks/use-credit-units";
import {
  computeStats,
  getVendorStats,
  getStatusByLevel,
  getModelStats,
  getIncomeSourceMix,
  fmtPct,
  fmtNum,
  STATUS_COLORS,
  groupByProject,
  type CreditStats,
  type VendorStat,
} from "@/lib/creditos/helpers";
import {
  formatCurrency,
  fmtQCompact,
  CREDIT_STATUS_COLORS,
} from "@/lib/reservas/constants";
import type { CreditUnit, CreditUnitStatus } from "@/lib/reservas/types";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

interface TabDef {
  id: string;
  label: string;
}

const TABS: TabDef[] = [
  { id: "portafolio", label: "Portafolio" },
  { id: "benestare", label: "Benestare" },
  { id: "bosque-las-tapias", label: "Bosques Las Tapias" },
  { id: "boulevard-5", label: "Boulevard 5" },
  { id: "casa-elisa", label: "Casa Elisa" },
  { id: "comparativa", label: "Comparativa" },
  { id: "equipo", label: "Equipo de Ventas" },
];

const PROJECT_TABS = ["benestare", "bosque-las-tapias", "boulevard-5", "casa-elisa"];

const PROJECT_COLORS: Record<string, string> = {
  Benestare: "#C9A84C",
  "Bosques Las Tapias": "#4A9FD4",
  "Boulevard 5": "#3AB893",
  "Casa Elisa": "#9B6FD4",
};

const INCOME_COLORS = [
  "#3AB893", "#D4A84A", "#4A9FD4", "#E05C5C", "#9B6FD4",
  "#D47A4A", "#4AD4C1", "#94a3b8",
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CreditosClient() {
  const [tab, setTab] = useState("portafolio");
  const { data: allUnits, loading, error } = useCreditUnits();

  const projectGroups = useMemo(() => {
    const map = groupByProject(allUnits);
    const result: { slug: string; name: string; units: CreditUnit[] }[] = [];
    for (const [slug, units] of map) {
      result.push({ slug, name: units[0]?.project_name ?? slug, units });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUnits]);

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />

      {/* Header */}
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-xl font-semibold">Créditos</h1>
        <p className="text-muted text-sm">
          Departamento de Créditos — Panel de Análisis
        </p>
      </div>

      {/* Tab navigation */}
      <nav className="px-6 flex gap-0 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="text-sm px-4 py-2.5 whitespace-nowrap transition-colors"
            style={{
              borderBottom: tab === t.id ? "2px solid var(--color-primary, #3b82f6)" : "2px solid transparent",
              color: tab === t.id ? "var(--color-text-primary)" : "var(--color-muted)",
              fontWeight: tab === t.id ? 600 : 400,
              background: "none",
              border: "none",
              borderBottomStyle: "solid",
              borderBottomWidth: 2,
              borderBottomColor: tab === t.id ? "var(--color-primary, #3b82f6)" : "transparent",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="px-6 py-5 max-w-[1400px] mx-auto">
        {loading && (
          <div className="text-center py-20 text-muted">Cargando datos…</div>
        )}
        {error && (
          <div className="bg-danger/10 text-danger rounded-xl p-4 mb-4">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <>
            {tab === "portafolio" && (
              <PortfolioTab units={allUnits} projects={projectGroups} />
            )}
            {PROJECT_TABS.includes(tab) && (
              <ProjectTab
                units={projectGroups.find((p) => p.slug === tab)?.units ?? []}
                projectName={projectGroups.find((p) => p.slug === tab)?.name ?? tab}
              />
            )}
            {tab === "comparativa" && (
              <CompareTab projects={projectGroups} />
            )}
            {tab === "equipo" && <TeamTab units={allUnits} projects={projectGroups} />}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portfolio tab
// ---------------------------------------------------------------------------

function PortfolioTab({
  units,
  projects,
}: {
  units: CreditUnit[];
  projects: { slug: string; name: string; units: CreditUnit[] }[];
}) {
  const stats = useMemo(() => computeStats(units), [units]);
  const projectStats = useMemo(
    () => projects.map((p) => ({ ...p, stats: computeStats(p.units) })),
    [projects],
  );

  const statusPieData = useMemo(
    () => [
      { name: "Vendido", value: stats.vendido, color: STATUS_COLORS.VENDIDO },
      { name: "Reservado", value: stats.reservado, color: STATUS_COLORS.RESERVADO },
      { name: "Disponible", value: stats.disponible, color: STATUS_COLORS.DISPONIBLE },
    ],
    [stats],
  );

  const stackedData = useMemo(
    () => projectStats.map((p) => ({
      name: p.name,
      Vendido: p.stats.vendido,
      Reservado: p.stats.reservado,
      Disponible: p.stats.disponible,
    })),
    [projectStats],
  );

  const inventoryData = useMemo(
    () => projectStats.map((p) => ({ name: p.name, Valor: p.stats.valorTotal })),
    [projectStats],
  );

  const incomeData = useMemo(() => getIncomeSourceMix(units), [units]);
  const incomePieData = useMemo(
    () => incomeData.map((d, i) => ({
      name: d.name,
      value: d.count,
      color: INCOME_COLORS[i % INCOME_COLORS.length],
    })),
    [incomeData],
  );

  return (
    <div className="grid gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Unidades" value={fmtNum(stats.total)} hint="Todos los proyectos" />
        <KpiCard label="Tasa de Absorción" value={fmtPct(stats.absorption)} hint={`${stats.vendido + stats.reservado} vendido + reservado`} positive />
        <KpiCard label="Valor Vendido" value={fmtQCompact(stats.valorVendido)} hint="Unidades vendidas" />
        <KpiCard label="Unidades Disponibles" value={fmtNum(stats.disponible)} hint={fmtPct(stats.disponible / stats.total) + " del inventario"} />
      </div>

      {/* Project summary cards */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
          Resumen por Proyecto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {projectStats.map((p) => (
            <div key={p.slug} className="bg-card rounded-2xl p-4 shadow-card">
              <h4 className="font-semibold text-sm mb-1">{p.name}</h4>
              <p className="text-muted text-xs mb-3">{p.stats.total} unidades</p>
              <CreditProgressBar
                vendido={p.stats.vendido}
                reservado={p.stats.reservado}
                disponible={p.stats.disponible}
                total={p.stats.total}
                height={8}
              />
              <div className="flex gap-3 mt-2 text-xs font-mono">
                <span>V: <span style={{ color: STATUS_COLORS.VENDIDO, fontWeight: 600 }}>{p.stats.vendido}</span></span>
                <span>R: <span style={{ color: STATUS_COLORS.RESERVADO, fontWeight: 600 }}>{p.stats.reservado}</span></span>
                <span>D: <span style={{ color: STATUS_COLORS.DISPONIBLE, fontWeight: 600 }}>{p.stats.disponible}</span></span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted">
                <span>Absorción: <strong className="text-text-primary">{fmtPct(p.stats.absorption)}</strong></span>
                <span>Valor: <strong style={{ color: "#C9A84C" }}>{fmtQCompact(p.stats.valorTotal)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
            Distribución por Estado
          </h3>
          <DonutChart data={statusPieData} />
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
            Estado por Proyecto
          </h3>
          <StackedBarChart
            data={stackedData}
            keys={["Vendido", "Reservado", "Disponible"]}
            xKey="name"
            colors={{ Vendido: STATUS_COLORS.VENDIDO, Reservado: STATUS_COLORS.RESERVADO, Disponible: STATUS_COLORS.DISPONIBLE }}
          />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
            Valor de Inventario por Proyecto
          </h3>
          <GroupedBarChart
            data={inventoryData}
            keys={["Valor"]}
            xKey="name"
            colors={{ Valor: "#C9A84C" }}
            layout="horizontal"
            isCurrency
          />
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
            Distribución de Fuentes de Ingreso
          </h3>
          <DonutChart data={incomePieData} innerRadiusRatio={0} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project tab (reusable)
// ---------------------------------------------------------------------------

function ProjectTab({
  units,
  projectName,
}: {
  units: CreditUnit[];
  projectName: string;
}) {
  const [filterTower, setFilterTower] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<CreditUnitStatus | "ALL">("ALL");
  const [sortCol, setSortCol] = useState("unit_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const stats = useMemo(() => computeStats(units), [units]);

  const towerNames = useMemo(() => {
    const set = new Set(units.map((u) => u.tower_name));
    return [...set].sort();
  }, [units]);

  const towerStats = useMemo(
    () =>
      towerNames.map((name) => {
        const tUnits = units.filter((u) => u.tower_name === name);
        return { name, ...computeStats(tUnits) };
      }),
    [units, towerNames],
  );

  const levelData = useMemo(() => getStatusByLevel(units), [units]);
  const modelData = useMemo(() => getModelStats(units), [units]);
  const vendorData = useMemo(
    () =>
      getVendorStats(units)
        .slice(0, 10)
        .map((v) => ({
          name: v.name.length > 20 ? v.name.slice(0, 18) + "…" : v.name,
          Vendido: v.vendido,
          Reservado: v.reservado,
        })),
    [units],
  );

  const filteredUnits = useMemo(() => {
    let list = units;
    if (filterTower !== "ALL") list = list.filter((u) => u.tower_name === filterTower);
    if (filterStatus !== "ALL") list = list.filter((u) => u.credit_status === filterStatus);

    return [...list].sort((a, b) => {
      const aVal = a[sortCol as keyof CreditUnit];
      const bVal = b[sortCol as keyof CreditUnit];
      const numCols = ["floor_number", "area_total", "bedrooms", "precio_total", "enganche", "financiamiento"];
      if (numCols.includes(sortCol)) {
        const an = Number(aVal) || 0;
        const bn = Number(bVal) || 0;
        return sortDir === "asc" ? an - bn : bn - an;
      }
      const as = String(aVal ?? "").toLowerCase();
      const bs = String(bVal ?? "").toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [units, filterTower, filterStatus, sortCol, sortDir]);

  function handleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  const sortIndicator = (col: string) => (sortCol !== col ? "" : sortDir === "asc" ? " ▲" : " ▼");

  return (
    <div className="grid gap-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">{projectName}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {towerStats.map((t) => (
            <span key={t.name} className="bg-card rounded-lg px-3 py-1 text-xs border border-border">
              {t.name} — {t.total} uds
            </span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Unidades" value={fmtNum(stats.total)} />
        <KpiCard label="Vendido" value={fmtNum(stats.vendido)} positive />
        <KpiCard label="Reservado" value={fmtNum(stats.reservado)} />
        <KpiCard label="Disponible" value={fmtNum(stats.disponible)} />
        <KpiCard label="Tasa de Absorción" value={fmtPct(stats.absorption)} />
        <KpiCard label="Valor Vendido" value={fmtQCompact(stats.valorVendido)} />
      </div>

      {/* Tower breakdown */}
      {towerStats.length > 1 && (
        <div className={`grid gap-3 ${towerStats.length <= 2 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
          {towerStats.map((t) => (
            <div key={t.name} className="bg-card rounded-2xl p-4 shadow-card">
              <span className="font-semibold text-sm">{t.name}</span>
              <CreditProgressBar vendido={t.vendido} reservado={t.reservado} disponible={t.disponible} total={t.total} />
              <div className="flex gap-3 mt-2 text-xs font-mono">
                <span style={{ color: STATUS_COLORS.VENDIDO }}>V: {t.vendido}</span>
                <span style={{ color: STATUS_COLORS.RESERVADO }}>R: {t.reservado}</span>
                <span style={{ color: STATUS_COLORS.DISPONIBLE }}>D: {t.disponible}</span>
              </div>
              <div className="mt-1 text-xs text-muted">Valor: {fmtQCompact(t.valorTotal)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold text-sm mb-3">Absorción por Nivel</h3>
          <StackedBarChart
            data={levelData}
            keys={["Vendido", "Reservado", "Disponible"]}
            xKey="level"
            colors={{ Vendido: STATUS_COLORS.VENDIDO, Reservado: STATUS_COLORS.RESERVADO, Disponible: STATUS_COLORS.DISPONIBLE }}
          />
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold text-sm mb-3">Distribución por Modelo</h3>
          <GroupedBarChart
            data={modelData.map((m) => ({ name: m.model, Vendido: m.vendido, Reservado: m.reservado, Disponible: m.disponible }))}
            keys={["Vendido", "Reservado", "Disponible"]}
            xKey="name"
            colors={{ Vendido: STATUS_COLORS.VENDIDO, Reservado: STATUS_COLORS.RESERVADO, Disponible: STATUS_COLORS.DISPONIBLE }}
          />
        </div>
      </div>

      {/* Unit inventory table */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold text-sm mb-3">Inventario de Unidades</h3>

        {/* Filters */}
        <div className="flex gap-3 items-center mb-3 flex-wrap">
          <select
            value={filterTower}
            onChange={(e) => setFilterTower(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="ALL">Todas las Torres</option>
            {towerNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CreditUnitStatus | "ALL")}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="VENDIDO">Vendido</option>
            <option value="RESERVADO">Reservado</option>
            <option value="DISPONIBLE">Disponible</option>
          </select>
          <span className="text-xs text-muted ml-auto">
            Mostrando {filteredUnits.length} de {units.length} unidades
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: "unit_number", label: "Apto" },
                  { key: "tower_name", label: "Torre" },
                  { key: "unit_type", label: "Modelo" },
                  { key: "floor_number", label: "Nivel" },
                  { key: "area_total", label: "Área (m²)" },
                  { key: "bedrooms", label: "Hab." },
                  { key: "credit_status", label: "Estado" },
                  { key: "salesperson_name", label: "Vendedor" },
                  { key: "client_name", label: "Cliente" },
                  { key: "precio_total", label: "Precio Total", align: "right" as const },
                  { key: "enganche", label: "Enganche", align: "right" as const },
                  { key: "financiamiento", label: "Financiamiento", align: "right" as const },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-2 py-2 text-left text-muted uppercase tracking-wider font-medium whitespace-nowrap cursor-pointer select-none"
                    style={{ textAlign: col.align ?? "left" }}
                  >
                    {col.label}{sortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => (
                <tr key={u.unit_id} className="border-b border-border/30 hover:bg-card/80">
                  <td className="px-2 py-2">{u.unit_number}</td>
                  <td className="px-2 py-2">{u.tower_name}</td>
                  <td className="px-2 py-2">{u.unit_type}</td>
                  <td className="px-2 py-2">{u.floor_number}</td>
                  <td className="px-2 py-2">{u.area_total ?? "—"}</td>
                  <td className="px-2 py-2">{u.bedrooms ?? "—"}</td>
                  <td className="px-2 py-2">
                    <StatusBadge status={u.credit_status} />
                  </td>
                  <td className="px-2 py-2">{u.salesperson_name ?? "—"}</td>
                  <td className="px-2 py-2" title={u.client_name ?? ""}>
                    {u.client_name ? (u.client_name.length > 25 ? u.client_name.slice(0, 25) + "…" : u.client_name) : "—"}
                  </td>
                  <td className="px-2 py-2 text-right font-mono">{formatCurrency(u.precio_total)}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatCurrency(u.enganche)}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatCurrency(u.financiamiento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor performance */}
      {vendorData.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold text-sm mb-3">Rendimiento de Vendedores (Top 10)</h3>
          <GroupedBarChart
            data={vendorData}
            keys={["Vendido", "Reservado"]}
            xKey="name"
            colors={{ Vendido: STATUS_COLORS.VENDIDO, Reservado: STATUS_COLORS.RESERVADO }}
            layout="horizontal"
            height={300}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare tab
// ---------------------------------------------------------------------------

function CompareTab({
  projects,
}: {
  projects: { slug: string; name: string; units: CreditUnit[] }[];
}) {
  const projectStats = useMemo(
    () => projects.map((p) => ({ name: p.name, stats: computeStats(p.units) })),
    [projects],
  );

  const metrics = useMemo(() => {
    const rows = [
      { label: "Total Unidades", values: projectStats.map((d) => d.stats.total), format: fmtNum, best: "max" as const },
      { label: "Vendido", values: projectStats.map((d) => d.stats.vendido), format: (v: number, i: number) => `${v} (${fmtPct(projectStats[i].stats.vendido / projectStats[i].stats.total)})`, best: "max" as const },
      { label: "Reservado", values: projectStats.map((d) => d.stats.reservado), format: (v: number, i: number) => `${v} (${fmtPct(projectStats[i].stats.reservado / projectStats[i].stats.total)})`, best: "max" as const },
      { label: "Disponible", values: projectStats.map((d) => d.stats.disponible), format: (v: number, i: number) => `${v} (${fmtPct(projectStats[i].stats.disponible / projectStats[i].stats.total)})`, best: "min" as const },
      { label: "Tasa Absorción", values: projectStats.map((d) => d.stats.absorption), format: fmtPct, best: "max" as const },
      { label: "Valor Vendido", values: projectStats.map((d) => d.stats.valorVendido), format: (v: number) => formatCurrency(v), best: "max" as const },
      { label: "Valor Total Inventario", values: projectStats.map((d) => d.stats.valorTotal), format: (v: number) => formatCurrency(v), best: "max" as const },
    ];
    return rows.map((row) => {
      const bestIdx = row.best === "max"
        ? row.values.indexOf(Math.max(...row.values))
        : row.values.indexOf(Math.min(...row.values));
      return { ...row, bestIdx };
    });
  }, [projectStats]);

  const absorptionData = useMemo(
    () => projectStats.map((d) => ({ name: d.name, Vendido: d.stats.vendido, Reservado: d.stats.reservado, Disponible: d.stats.disponible })),
    [projectStats],
  );

  const financialData = useMemo(
    () => projectStats.map((d) => ({ name: d.name, "Valor Vendido": d.stats.valorVendido, "Valor Reservado": d.stats.valorReservado, "Valor Disponible": d.stats.valorDisponible })),
    [projectStats],
  );

  const radarData = useMemo(() => {
    const maxValorVendido = Math.max(...projectStats.map((d) => d.stats.valorVendido), 1);
    const maxTotal = Math.max(...projectStats.map((d) => d.stats.total), 1);
    const dimensions = ["Absorción", "Vendido %", "Valor Vendido", "Total Unidades", "Disponibilidad Inversa"];
    return dimensions.map((dim) => {
      const entry: Record<string, unknown> = { dimension: dim };
      for (const d of projectStats) {
        let val = 0;
        switch (dim) {
          case "Absorción": val = d.stats.absorption * 100; break;
          case "Vendido %": val = d.stats.total > 0 ? (d.stats.vendido / d.stats.total) * 100 : 0; break;
          case "Valor Vendido": val = (d.stats.valorVendido / maxValorVendido) * 100; break;
          case "Total Unidades": val = (d.stats.total / maxTotal) * 100; break;
          case "Disponibilidad Inversa": val = d.stats.total > 0 ? 100 - (d.stats.disponible / d.stats.total) * 100 : 0; break;
        }
        entry[d.name] = Math.round(val * 10) / 10;
      }
      return entry;
    });
  }, [projectStats]);

  const radarColors: Record<string, string> = {};
  for (const p of projectStats) {
    radarColors[p.name] = PROJECT_COLORS[p.name] ?? "#94a3b8";
  }

  return (
    <div className="grid gap-5">
      {/* Comparison table */}
      <div className="bg-card rounded-2xl p-4 shadow-card overflow-x-auto">
        <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
          Comparativa de Proyectos
        </h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-2 text-left">Métrica</th>
              {projectStats.map((d) => (
                <th key={d.name} className="px-2 py-2 text-right">{d.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((row) => (
              <tr key={row.label} className="border-b border-border/30">
                <td className="px-2 py-2 font-medium">{row.label}</td>
                {row.values.map((v, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-2 text-right font-mono"
                    style={{
                      color: ci === row.bestIdx ? "#C9A84C" : undefined,
                      fontWeight: ci === row.bestIdx ? 600 : 400,
                    }}
                  >
                    {row.format(v, ci)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Absorption chart */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
          Comparativa de Absorción
        </h3>
        <GroupedBarChart
          data={absorptionData}
          keys={["Vendido", "Reservado", "Disponible"]}
          xKey="name"
          colors={{ Vendido: STATUS_COLORS.VENDIDO, Reservado: STATUS_COLORS.RESERVADO, Disponible: STATUS_COLORS.DISPONIBLE }}
          height={300}
        />
      </div>

      {/* Financial chart */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
          Comparativa Financiera
        </h3>
        <GroupedBarChart
          data={financialData}
          keys={["Valor Vendido", "Valor Reservado", "Valor Disponible"]}
          xKey="name"
          colors={{ "Valor Vendido": STATUS_COLORS.VENDIDO, "Valor Reservado": STATUS_COLORS.RESERVADO, "Valor Disponible": STATUS_COLORS.DISPONIBLE }}
          height={300}
          isCurrency
        />
      </div>

      {/* Radar chart */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
          Perfil Comparativo (Radar)
        </h3>
        <RadarChart
          data={radarData}
          dimensionKey="dimension"
          keys={projectStats.map((d) => d.name)}
          colors={radarColors}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team tab
// ---------------------------------------------------------------------------

function TeamTab({
  units,
  projects,
}: {
  units: CreditUnit[];
  projects: { slug: string; name: string; units: CreditUnit[] }[];
}) {
  const [projectFilter, setProjectFilter] = useState("ALL");

  const filteredUnits = useMemo(
    () => projectFilter === "ALL" ? units : units.filter((u) => u.project_slug === projectFilter),
    [units, projectFilter],
  );

  const vendorStats = useMemo(() => getVendorStats(filteredUnits), [filteredUnits]);

  const kpis = useMemo(() => {
    const totalVendedores = vendorStats.length;
    const totalUnidades = vendorStats.reduce((s, v) => s + v.total, 0);
    const promedio = totalVendedores > 0 ? (totalUnidades / totalVendedores).toFixed(1) : "0";
    const top = vendorStats[0] ?? null;
    return { totalVendedores, totalUnidades, promedio, top };
  }, [vendorStats]);

  const top15Data = useMemo(
    () => vendorStats.slice(0, 15).map((v) => ({
      name: v.name.length > 20 ? v.name.slice(0, 18) + "…" : v.name,
      Vendido: v.vendido,
      Reservado: v.reservado,
      Disponible: v.disponible,
    })),
    [vendorStats],
  );

  const pieData = useMemo(() => {
    const PIE_COLORS = ["#C9A84C", "#3AB893", "#4A9FD4", "#E05C5C", "#9B6FD4", "#D47A4A", "#4AD4C1", "#94a3b8"];
    const top8 = vendorStats.slice(0, 8).map((v, i) => ({
      name: v.name.length > 18 ? v.name.slice(0, 16) + "…" : v.name,
      value: v.total,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    const rest = vendorStats.slice(8);
    if (rest.length > 0) {
      top8.push({ name: "Otros", value: rest.reduce((s, v) => s + v.total, 0), color: "#94a3b8" });
    }
    return top8;
  }, [vendorStats]);

  return (
    <div className="grid gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Vendedores" value={String(kpis.totalVendedores)} hint={projectFilter === "ALL" ? "Todos los proyectos" : projectFilter} />
        <KpiCard label="Promedio Unidades/Vendedor" value={kpis.promedio} hint="Unidades gestionadas" />
        <KpiCard label="Top Vendedor" value={kpis.top?.name ?? "N/A"} hint={kpis.top ? `${kpis.top.total} unidades` : ""} />
        <KpiCard label="Total Unidades Gestionadas" value={fmtNum(kpis.totalUnidades)} hint="Por vendedores activos" positive />
      </div>

      {/* Vendor leaderboard */}
      <div className="bg-card rounded-2xl p-4 shadow-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs uppercase tracking-wider text-muted font-medium">
            Ranking de Vendedores
          </h3>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="ALL">Todos los Proyectos</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-center w-10">#</th>
                <th className="px-2 py-2 text-left">Vendedor</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-2 py-2 text-right">Vendido</th>
                <th className="px-2 py-2 text-right">Reservado</th>
                <th className="px-2 py-2 text-right">Disponible</th>
                <th className="px-2 py-2 text-right">Valor Vendido</th>
                <th className="px-2 py-2 text-left">Proyectos</th>
              </tr>
            </thead>
            <tbody>
              {vendorStats.map((v, i) => (
                <tr
                  key={v.name}
                  className="border-b border-border/30"
                  style={{ borderLeft: i < 3 ? "3px solid #C9A84C" : "3px solid transparent" }}
                >
                  <td className="px-2 py-2 text-center font-semibold" style={{ color: i < 3 ? "#C9A84C" : undefined }}>
                    {i + 1}
                  </td>
                  <td className="px-2 py-2 font-medium">{v.name}</td>
                  <td className="px-2 py-2 text-right font-mono font-semibold">{v.total}</td>
                  <td className="px-2 py-2 text-right font-mono" style={{ color: STATUS_COLORS.VENDIDO }}>{v.vendido}</td>
                  <td className="px-2 py-2 text-right font-mono" style={{ color: STATUS_COLORS.RESERVADO }}>{v.reservado}</td>
                  <td className="px-2 py-2 text-right font-mono" style={{ color: STATUS_COLORS.DISPONIBLE }}>{v.disponible}</td>
                  <td className="px-2 py-2 text-right font-mono">{formatCurrency(v.valorVendido)}</td>
                  <td className="px-2 py-2 text-muted">{v.projects.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
            Top 15 Vendedores por Unidades
          </h3>
          <GroupedBarChart
            data={top15Data}
            keys={["Vendido", "Reservado", "Disponible"]}
            xKey="name"
            colors={{ Vendido: STATUS_COLORS.VENDIDO, Reservado: STATUS_COLORS.RESERVADO, Disponible: STATUS_COLORS.DISPONIBLE }}
            layout="horizontal"
            height={450}
          />
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-medium">
            Distribución de Unidades por Vendedor
          </h3>
          <DonutChart data={pieData} innerRadiusRatio={0} height={450} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: CreditUnitStatus }) {
  const bgColor = status === "VENDIDO"
    ? "rgba(58,184,147,0.12)"
    : status === "RESERVADO"
      ? "rgba(212,168,74,0.12)"
      : "rgba(74,159,212,0.12)";
  const textColor = CREDIT_STATUS_COLORS[status];
  const label = status === "VENDIDO" ? "Vendido" : status === "RESERVADO" ? "Reservado" : "Disponible";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: bgColor,
        color: textColor,
      }}
    >
      {label}
    </span>
  );
}
