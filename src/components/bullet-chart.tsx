export type BulletItem = {
  label: string;
  value: number;
  target: number;
  subtitle?: string;
};

type BulletChartProps = {
  items: BulletItem[];
  formatValue?: (v: number) => string;
  /**
   * Invierte la semántica de color. Por defecto superar el objetivo es bueno
   * (verde), que es lo correcto para una meta de ventas. Con `lowerIsBetter`
   * se pinta verde al quedar por debajo del objetivo — el caso de gasto contra
   * presupuesto, donde pasarse es malo.
   */
  lowerIsBetter?: boolean;
};

export default function BulletChart({
  items,
  formatValue = (v) => `${Math.round(v)}%`,
  lowerIsBetter = false
}: BulletChartProps) {
  const maxScale = Math.max(
    120,
    ...items.map((i) => Math.max(i.value, i.target) * 1.15)
  );

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const valueWidth = Math.min(100, (item.value / maxScale) * 100);
        const targetPos = (item.target / maxScale) * 100;
        const band1 = (60 / maxScale) * 100;
        const band2 = (80 / maxScale) * 100;
        const band3 = (100 / maxScale) * 100;
        const met = lowerIsBetter ? item.value <= item.target : item.value >= item.target;
        // Quedar corto contra una meta de ventas es "todavía no", y se pinta
        // neutro. Pasarse del presupuesto es un hecho malo, y se pinta rojo.
        const barColor = met ? "bg-success" : lowerIsBetter ? "bg-danger" : "bg-primary";

        return (
          <div key={item.label} className="grid grid-cols-[140px_1fr_minmax(56px,max-content)] items-center gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              {/* El ancho fijo de la etiqueta recorta los nombres largos, así que
                  el nombre completo queda disponible al pasar el cursor. */}
              <span
                className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis"
                title={item.label}
              >
                {item.label}
              </span>
              {item.subtitle ? (
                <span className="text-[11px] text-muted">{item.subtitle}</span>
              ) : null}
            </div>
            <div
              className="relative h-6 rounded bg-slate-100 overflow-hidden"
              title={`${formatValue(item.value)} de ${formatValue(item.target)}`}
            >
              <div className="absolute top-0 left-0 h-full rounded-l bg-slate-400/22 z-[1]" style={{ width: `${band1}%` }} />
              <div className="absolute top-0 left-0 h-full rounded-l bg-slate-400/14 z-[2]" style={{ width: `${band2}%` }} />
              <div className="absolute top-0 left-0 h-full rounded-l bg-slate-400/7 z-[3]" style={{ width: `${band3}%` }} />
              <div
                className={`absolute top-1.5 left-0 h-3 rounded-[3px] z-[4] transition-[width] duration-500 ease-in-out ${barColor}`}
                style={{ width: `${valueWidth}%` }}
              />
              <div className="absolute top-0.5 w-0.5 h-5 bg-text-primary rounded-[1px] z-[5]" style={{ left: `${targetPos}%` }} />
            </div>
            <span
              className={`text-[13px] font-bold text-right tabular-nums whitespace-nowrap ${met ? "text-success" : "text-danger"}`}
            >
              {formatValue(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
