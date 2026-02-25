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
    <div className="bullet-chart">
      {items.map((item) => {
        const valueWidth = Math.min(100, (item.value / maxScale) * 100);
        const targetPos = (item.target / maxScale) * 100;
        const band1 = (60 / maxScale) * 100;
        const band2 = (80 / maxScale) * 100;
        const band3 = (100 / maxScale) * 100;
        const met = item.value >= item.target;

        return (
          <div key={item.label} className="bullet-row">
            <div className="bullet-label">
              <span className="bullet-label__name">{item.label}</span>
              {item.subtitle ? (
                <span className="bullet-label__sub">{item.subtitle}</span>
              ) : null}
            </div>
            <div
              className="bullet-bar"
              title={`${formatValue(item.value)} de ${formatValue(item.target)}`}
            >
              <div className="bullet-range bullet-range--poor" style={{ width: `${band1}%` }} />
              <div className="bullet-range bullet-range--ok" style={{ width: `${band2}%` }} />
              <div className="bullet-range bullet-range--good" style={{ width: `${band3}%` }} />
              <div
                className={`bullet-measure ${met ? "bullet-measure--met" : "bullet-measure--unmet"}`}
                style={{ width: `${valueWidth}%` }}
              />
              <div className="bullet-target" style={{ left: `${targetPos}%` }} />
            </div>
            <span className={`bullet-value ${met ? "positive" : "negative"}`}>
              {formatValue(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
