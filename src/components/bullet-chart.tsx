export type BulletItem = {
  label: string;
  value: number;
  target: number;
  subtitle?: string;
};

type BulletChartProps = {
  items: BulletItem[];
  formatValue?: (v: number) => string;
};

export default function BulletChart({
  items,
  formatValue = (v) => `${Math.round(v)}%`
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
        const met = item.value >= item.target;

        return (
          <div key={item.label} className="grid grid-cols-[140px_1fr_56px] items-center gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
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
                className={`absolute top-1.5 left-0 h-3 rounded-[3px] z-[4] transition-[width] duration-500 ease-in-out ${met ? "bg-success" : "bg-primary"}`}
                style={{ width: `${valueWidth}%` }}
              />
              <div className="absolute top-0.5 w-0.5 h-5 bg-text-primary rounded-[1px] z-[5]" style={{ left: `${targetPos}%` }} />
            </div>
            <span className={`text-[13px] font-bold text-right tabular-nums ${met ? "text-success" : "text-danger"}`}>
              {formatValue(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
