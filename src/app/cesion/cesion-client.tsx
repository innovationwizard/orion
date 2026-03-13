"use client";

import { useState, useMemo, useCallback } from "react";
import type { CesionUnit } from "@/lib/reservas/types";
import { useCesion } from "@/hooks/use-cesion";
import { useDrillDown } from "@/hooks/use-drill-down";
import ViewTabs, { type CesionView } from "./components/view-tabs";
import Filters from "./components/filters";
import KpiRow, { type CesionStats } from "./components/kpi-row";
import ResumenView from "./components/resumen-view";
import CarteraView from "./components/cartera-view";
import ClientesView from "./components/clientes-view";
import DrillDownModal from "./components/drill-down-modal";

function getEstatus(r: CesionUnit): string {
  return r.compliance_status === "behind" ? "ATRASADO" : "AL D\u00CDA";
}

export default function CesionClient() {
  const { data, loading, error } = useCesion();
  const drill = useDrillDown();

  // View state
  const [selectedView, setSelectedView] = useState<CesionView>("resumen");

  // Filter state
  const [filterEstatus, setFilterEstatus] = useState<string[]>([]);
  const [filterBloque, setFilterBloque] = useState<string[]>([]);
  const [filterPrecal, setFilterPrecal] = useState<string[]>([]);
  const [filterCliente, setFilterCliente] = useState("");
  const [filterRazon, setFilterRazon] = useState<string[]>([]);
  const [filterTipo, setFilterTipo] = useState<string[]>([]);

  // Sort state (cartera view)
  const [sortCol, setSortCol] = useState("diferencia");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback(
    (col: string) => {
      if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setSortCol(col);
        setSortDir("asc");
      }
    },
    [sortCol],
  );

  // Unique filter options (from full dataset, not filtered)
  const uniqueBloques = useMemo(
    () =>
      [
        ...new Set(
          data
            .map((r) => (r.pcv_block != null ? String(r.pcv_block) : ""))
            .filter(Boolean),
        ),
      ].sort(),
    [data],
  );
  const uniquePrecal = useMemo(
    () =>
      [
        ...new Set(
          data
            .map((r) => r.precalificacion_status)
            .filter((v): v is string => !!v),
        ),
      ].sort(),
    [data],
  );
  const uniqueRazon = useMemo(
    () =>
      [
        ...new Set(
          data.map((r) => r.razon_compra).filter((v): v is string => !!v),
        ),
      ].sort(),
    [data],
  );
  const uniqueTipo = useMemo(
    () =>
      [
        ...new Set(
          data.map((r) => r.tipo_cliente).filter((v): v is string => !!v),
        ),
      ].sort(),
    [data],
  );

  // Filtered data
  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (filterEstatus.length && !filterEstatus.includes(getEstatus(r)))
        return false;
      if (
        filterBloque.length &&
        !filterBloque.includes(String(r.pcv_block ?? ""))
      )
        return false;
      if (
        filterPrecal.length &&
        !filterPrecal.includes(r.precalificacion_status ?? "")
      )
        return false;
      if (
        filterCliente &&
        !(r.client_name ?? "").toLowerCase().includes(filterCliente.toLowerCase())
      )
        return false;
      if (filterRazon.length && !filterRazon.includes(r.razon_compra ?? ""))
        return false;
      if (filterTipo.length && !filterTipo.includes(r.tipo_cliente ?? ""))
        return false;
      return true;
    });
  }, [
    data,
    filterEstatus,
    filterBloque,
    filterPrecal,
    filterCliente,
    filterRazon,
    filterTipo,
  ]);

  // Sorted data (cartera view)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortCol];
      const bv = (b as unknown as Record<string, unknown>)[sortCol];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av ?? "").localeCompare(String(bv ?? ""))
        : String(bv ?? "").localeCompare(String(av ?? ""));
    });
  }, [filtered, sortCol, sortDir]);

  // KPI stats
  const stats: CesionStats = useMemo(() => {
    const d = filtered;
    const totalVenta = d.reduce((s, r) => s + (r.price_list ?? 0), 0);
    const totalPlusvalia = d.reduce((s, r) => s + (r.plusvalia ?? 0), 0);
    const totalEnganche = d.reduce((s, r) => s + (r.enganche_total ?? 0), 0);
    const totalPagado = d.reduce((s, r) => s + (r.enganche_pagado ?? 0), 0);
    const totalDiferencia = d.reduce((s, r) => s + (r.diferencia ?? 0), 0);
    const totalPactado = d.reduce((s, r) => s + (r.enganche_pactado ?? 0), 0);
    const atrasados = d.filter(
      (r) => r.compliance_status === "behind",
    ).length;
    const alDia = d.filter((r) => r.compliance_status !== "behind").length;
    const aprobados = d.filter(
      (r) => r.precalificacion_status === "APROBADA",
    ).length;
    const denegados = d.filter(
      (r) => r.precalificacion_status === "DENEGADA",
    ).length;
    const na = d.filter((r) => r.precalificacion_status === "N/A").length;
    const disponible = d.filter(
      (r) => r.precalificacion_status === "DISPONIBLE",
    ).length;
    const pctCobro = totalPactado > 0 ? (totalPagado / totalPactado) * 100 : 0;

    return {
      totalVenta,
      totalPlusvalia,
      totalEnganche,
      totalPagado,
      totalDiferencia,
      atrasados,
      alDia,
      aprobados,
      denegados,
      na,
      disponible,
      pctCobro,
      count: d.length,
    };
  }, [filtered]);

  // Client aggregation (clientes view)
  const clienteAgg = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        unidades: number;
        venta: number;
        pagado: number;
        diferencia: number;
        plusvalia: number;
      }
    > = {};
    filtered.forEach((r) => {
      const k = r.client_name ?? "Sin nombre";
      if (!map[k])
        map[k] = {
          name: k,
          unidades: 0,
          venta: 0,
          pagado: 0,
          diferencia: 0,
          plusvalia: 0,
        };
      map[k].unidades++;
      map[k].venta += r.price_list ?? 0;
      map[k].pagado += r.enganche_pagado ?? 0;
      map[k].diferencia += r.diferencia ?? 0;
      map[k].plusvalia += r.plusvalia ?? 0;
    });
    return Object.values(map).sort((a, b) => b.venta - a.venta);
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-base font-semibold mb-2">Cargando datos...</div>
          <div className="text-sm text-muted">
            Panel de Control Financiero
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-base font-semibold text-danger mb-2">
            Error al cargar datos
          </div>
          <div className="text-sm text-muted">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <ViewTabs
        selected={selectedView}
        onChange={setSelectedView}
        totalCount={data.length}
      />

      <Filters
        filterEstatus={filterEstatus}
        setFilterEstatus={setFilterEstatus}
        filterBloque={filterBloque}
        setFilterBloque={setFilterBloque}
        filterPrecal={filterPrecal}
        setFilterPrecal={setFilterPrecal}
        filterCliente={filterCliente}
        setFilterCliente={setFilterCliente}
        filterRazon={filterRazon}
        setFilterRazon={setFilterRazon}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        uniqueBloques={uniqueBloques}
        uniquePrecal={uniquePrecal}
        uniqueRazon={uniqueRazon}
        uniqueTipo={uniqueTipo}
        filteredCount={filtered.length}
        totalCount={data.length}
      />

      <div className="p-5 px-7">
        <KpiRow stats={stats} />

        {selectedView === "resumen" && (
          <ResumenView
            filtered={filtered}
            stats={stats}
            openDrillDown={drill.openDrillDown}
          />
        )}

        {selectedView === "cartera" && (
          <CarteraView
            sorted={sorted}
            sortCol={sortCol}
            sortDir={sortDir}
            onSort={handleSort}
            allData={data}
          />
        )}

        {selectedView === "clientes" && (
          <ClientesView
            clienteAgg={clienteAgg}
            filtered={filtered}
            openDrillDown={drill.openDrillDown}
          />
        )}
      </div>

      <DrillDownModal
        drillDown={drill.drillDown}
        drillFiltered={drill.drillFiltered}
        drillSearch={drill.drillSearch}
        setDrillSearch={drill.setDrillSearch}
        drillSortCol={drill.drillSortCol}
        drillSortDir={drill.drillSortDir}
        handleDrillSort={drill.handleDrillSort}
        onClose={drill.closeDrillDown}
      />
    </div>
  );
}
