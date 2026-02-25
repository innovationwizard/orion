import Sparkline from "@/components/sparkline";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
  trend?: number[];
  trendColor?: string;
};

export default function KpiCard({
  label,
  value,
  hint,
  positive,
  negative,
  trend,
  trendColor
}: KpiCardProps) {
  const hintClass = positive ? "positive" : negative ? "negative" : "";
  return (
    <div className="card kpi-card">
      <div className="kpi-card__header">
        <h3>{label}</h3>
        {trend && trend.length >= 2 ? (
          <Sparkline data={trend} color={trendColor} />
        ) : null}
      </div>
      <strong>{value}</strong>
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </div>
  );
}
