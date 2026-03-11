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
  const hintClass = positive ? "text-success" : negative ? "text-danger" : "";
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card grid gap-2">
      <div className="flex justify-between items-start gap-2">
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
