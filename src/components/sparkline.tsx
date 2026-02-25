type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export default function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "var(--primary)"
}: SparklineProps) {
  if (data.length < 2) return null;

  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2)
  }));

  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${pts[0].x},${height - pad} ${line} ${last.x},${height - pad}`;

  return (
    <svg width={width} height={height} className="sparkline" aria-hidden="true">
      <polyline points={area} fill={color} fillOpacity={0.1} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2} fill={color} />
    </svg>
  );
}
