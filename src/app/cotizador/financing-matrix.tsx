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

  if (scenarios.length === 0) return null;

  const { bank_rates, plazos_years, bank_rate_labels } = config;

  // Build lookup: rate -> plazo -> scenario
  const lookup = new Map<string, FinancingScenario>();
  for (const s of scenarios) {
    lookup.set(`${s.rate}-${s.plazo_years}`, s);
  }

  const monto = scenarios[0]?.monto_financiar ?? 0;
  const firstScenario = scenarios[0];

  // Compute custom-column scenarios per rate
  const customByRate = useMemo(() => {
    if (customYears == null || customYears <= 0 || monto <= 0) return null;
    const map = new Map<number, { cuota_banco: number; total_monthly: number }>();
    for (const rate of bank_rates) {
      const ref = lookup.get(`${rate}-${plazos_years[0]}`);
      if (!ref) continue;
      const cuota_banco = Math.round(pmt(rate, customYears, monto));
      let total_monthly = cuota_banco;
      if (config.include_iusi_in_cuota) total_monthly += ref.iusi_monthly;
      if (config.include_seguro_in_cuota) total_monthly += ref.seguro_monthly;
      map.set(rate, { cuota_banco, total_monthly });
    }
    return map;
  }, [customYears, monto, bank_rates, plazos_years, lookup, config.include_iusi_in_cuota, config.include_seguro_in_cuota]);

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Financiamiento bancario</h2>
        <p className="text-xs text-muted mt-1">Monto a financiar: {formatCurrency(monto, config.currency)}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Tasa</th>
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
            {bank_rates.map((rate, ri) => {
              const custom = customByRate?.get(rate);
              return (
                <tr key={rate} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">
                    <div>{(rate * 100).toFixed(2)}%</div>
                    {bank_rate_labels[ri] && (
                      <div className="text-[10px] text-muted font-normal">{bank_rate_labels[ri]}</div>
                    )}
                  </td>
                  {plazos_years.map((plazo) => {
                    const s = lookup.get(`${rate}-${plazo}`);
                    return (
                      <td key={plazo} className="py-2 px-2 text-center">
                        {s ? (
                          <div className="grid gap-0.5">
                            <span className="font-semibold text-text-primary">{formatCurrency(s.total_monthly, config.currency)}</span>
                            <span className="text-[10px] text-muted">
                              Cuota {formatCurrency(s.cuota_banco, config.currency)}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2 text-center">
                    {custom ? (
                      <div className="grid gap-0.5">
                        <span className="font-semibold text-text-primary">{formatCurrency(custom.total_monthly, config.currency)}</span>
                        <span className="text-[10px] text-muted">
                          Cuota {formatCurrency(custom.cuota_banco, config.currency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
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
          <Detail label="Relación Cuota Ingreso" value={`${Math.round((1 / config.income_multiplier) * 100)}% ${config.income_base === "cuota_banco" ? "cuota banco" : "mensualidad"}`} />
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
