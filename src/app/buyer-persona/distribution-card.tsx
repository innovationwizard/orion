"use client";

import type { DistributionItem } from "@/lib/reservas/types";

type Props = {
  title: string;
  items: DistributionItem[];
  color: string;
};

export default function DistributionCard({ title, items, color }: Props) {
  if (items.length === 0) return null;

  const maxCount = Math.max(...items.map((i) => i.count));

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="grid gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-primary">{item.label}</span>
              <span className="text-muted tabular-nums">
                {item.count} ({item.pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                  backgroundColor: color,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
