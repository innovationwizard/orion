"use client";

export type CesionView = "resumen" | "cartera" | "clientes";

const TABS: { key: CesionView; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "cartera", label: "Cartera" },
  { key: "clientes", label: "Clientes" },
];

interface ViewTabsProps {
  selected: CesionView;
  onChange: (view: CesionView) => void;
  totalCount: number;
}

export default function ViewTabs({
  selected,
  onChange,
  totalCount,
}: ViewTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-border px-7 py-3">
      <div className="flex gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selected === key
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-gray-100 hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-xs text-muted ml-auto">
        Cesion de Derechos &middot; Boulevard 5 &middot; {totalCount} unidades
      </span>
    </div>
  );
}
