"use client";

import { useState, useMemo } from "react";
import type { FinancingScenario, CotizadorConfig } from "@/lib/reservas/cotizador";
import { pmt } from "@/lib/reservas/cotizador";
import { formatCurrency } from "@/lib/reservas/constants";

type Props = {
  scenarios: FinancingScenario[];
  config: CotizadorConfig;
};

export default function FinancingMatrix({ scenarios, config }: Props) {
  const [customYears, setCustomYears] = useState<number | null>(null);
  const [selectedRateIdx, setSelectedRateIdx] = useState(0);

  if (scenarios.length === 0) return null;

  const { bank_rates, plazos_years, bank_rate_labels } = config;

  // Build lookup: rate -> plazo -> scenario
  const lookup = new Map<string, FinancingScenario>();
  for (const s of scenarios) {
    lookup.set(`${s.rate}-${s.plazo_years}`, s);
  }

  const monto = scenarios[0]?.monto_financiar ?? 0;
  const rate = bank_rates[selectedRateIdx];
  const firstScenario = lookup.get(`${rate}-${plazos_years[0]}`);

  // Compute custom-column scenario for selected rate
  const custom = useMemo(() => {
    if (customYears == null || customYears <= 0 || monto <= 0 || rate == null) return null;
    const cuota_banco = Math.round(pmt(rate, customYears, monto));
    return { cuota_banco };
  }, [customYears, monto, rate]);

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Financiamiento bancario</h2>
          <p className="text-xs text-muted mt-1">Monto a financiar: {formatCurrency(monto, config.currency)}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rate-select" className="text-xs text-muted whitespace-nowrap">Tasa</label>
          <select
            id="rate-select"
            value={selectedRateIdx}
            onChange={(e) => setSelectedRateIdx(Number(e.target.value))}
            className="text-sm bg-surface border border-border rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {bank_rates.map((r, i) => (
              <option key={r} value={i}>
                {(r * 100).toFixed(2)}%{bank_rate_labels[i] ? ` — ${bank_rate_labels[i]}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {plazos_years.map((p) => (
                <th key={p} className="text-center py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  {p} años
                </th>
              ))}
              <th className="text-center py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <div className="inline-flex items-baseline gap-1">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="—"
                    value={customYears ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCustomYears(v === "" ? null : Math.max(1, Math.min(50, parseInt(v, 10) || 0)));
                    }}
                    className="w-8 text-center bg-transparent border-b border-muted text-xs font-semibold uppercase tracking-wider text-muted focus:outline-none focus:border-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span>años</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              {plazos_years.map((plazo) => {
                const s = lookup.get(`${rate}-${plazo}`);
                return (
                  <td key={plazo} className="py-2 px-2 text-center">
                    {s ? (
                      <span className="font-semibold text-text-primary">{formatCurrency(s.cuota_banco, config.currency)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
              <td className="py-2 px-2 text-center">
                {custom ? (
                  <span className="font-semibold text-text-primary">{formatCurrency(custom.cuota_banco, config.currency)}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {firstScenario && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2 border-t border-border">
          {config.include_iusi_in_cuota && firstScenario.iusi_monthly > 0 && (
            <Detail label="IUSI mensual" value={formatCurrency(firstScenario.iusi_monthly, config.currency)} />
          )}
          {config.iusi_frequency === "quarterly" && firstScenario.iusi_quarterly > 0 && (
            <Detail label="IUSI trimestral" value={formatCurrency(firstScenario.iusi_quarterly, config.currency)} />
          )}
          {config.seguro_enabled && firstScenario.seguro_monthly > 0 && (
            <Detail
              label={firstScenario.seguro_informational ? "Seguro (informativo)" : "Seguro mensual"}
              value={formatCurrency(firstScenario.seguro_monthly, config.currency)}
            />
          )}
          <Detail
            label="Ingreso requerido mínimo"
            value={formatCurrency(firstScenario.ingreso_requerido, config.currency)}
          />
          <Detail label="Relación Cuota Ingreso" value={`${Math.round((1 / config.income_multiplier) * 100)}%`} />
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-muted text-xs">{label}</div>
      <div className="text-text-primary font-medium truncate">{value}</div>
    </div>
  );
}
