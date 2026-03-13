"use client";

import MultiSelect from "./multi-select";

interface FiltersProps {
  filterEstatus: string[];
  setFilterEstatus: (v: string[]) => void;
  filterBloque: string[];
  setFilterBloque: (v: string[]) => void;
  filterPrecal: string[];
  setFilterPrecal: (v: string[]) => void;
  filterCliente: string;
  setFilterCliente: (v: string) => void;
  filterRazon: string[];
  setFilterRazon: (v: string[]) => void;
  filterTipo: string[];
  setFilterTipo: (v: string[]) => void;
  uniqueBloques: string[];
  uniquePrecal: string[];
  uniqueRazon: string[];
  uniqueTipo: string[];
  filteredCount: number;
  totalCount: number;
}

export default function Filters({
  filterEstatus,
  setFilterEstatus,
  filterBloque,
  setFilterBloque,
  filterPrecal,
  setFilterPrecal,
  filterCliente,
  setFilterCliente,
  filterRazon,
  setFilterRazon,
  filterTipo,
  setFilterTipo,
  uniqueBloques,
  uniquePrecal,
  uniqueRazon,
  uniqueTipo,
  filteredCount,
  totalCount,
}: FiltersProps) {
  const hasFilters =
    filterEstatus.length > 0 ||
    filterBloque.length > 0 ||
    filterPrecal.length > 0 ||
    filterCliente.length > 0 ||
    filterRazon.length > 0 ||
    filterTipo.length > 0;

  const clearAll = () => {
    setFilterEstatus([]);
    setFilterBloque([]);
    setFilterPrecal([]);
    setFilterCliente("");
    setFilterRazon([]);
    setFilterTipo([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-7 py-3 border-b border-border bg-gray-50/60">
      <span className="text-[11px] font-semibold text-muted tracking-wider uppercase">
        Filtros:
      </span>
      <MultiSelect
        label="Estatus"
        options={["ATRASADO", "AL D\u00CDA"]}
        selected={filterEstatus}
        onChange={setFilterEstatus}
        formatOption={(v) =>
          v === "AL D\u00CDA"
            ? "Al D\u00EDa"
            : v.charAt(0) + v.slice(1).toLowerCase()
        }
      />
      <MultiSelect
        label="Bloque"
        options={uniqueBloques}
        selected={filterBloque}
        onChange={setFilterBloque}
        formatOption={(v) => `Bloque ${v}`}
      />
      <MultiSelect
        label="Precalif."
        options={uniquePrecal}
        selected={filterPrecal}
        onChange={setFilterPrecal}
      />
      <MultiSelect
        label="Raz\u00F3n"
        options={uniqueRazon}
        selected={filterRazon}
        onChange={setFilterRazon}
      />
      <MultiSelect
        label="Tipo cliente"
        options={uniqueTipo}
        selected={filterTipo}
        onChange={setFilterTipo}
      />
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={filterCliente}
        onChange={(e) => setFilterCliente(e.target.value)}
        className="rounded-md border border-border px-3 py-1.5 text-[13px] w-[180px] bg-white text-text-primary placeholder:text-muted outline-none focus:border-primary"
      />
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-md border border-danger px-3 py-1.5 text-xs text-danger bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
        >
          ✕ Limpiar
        </button>
      )}
      <span className="text-xs text-muted ml-auto">
        {filteredCount} de {totalCount} registros
      </span>
    </div>
  );
}
