"use client";

import type { FinancingScenario, CotizadorConfig } from "@/lib/reservas/cotizador";
import { formatCurrency } from "@/lib/reservas/constants";

type Props = {
  scenarios: FinancingScenario[];
  config: CotizadorConfig;
};

export default function FinancingMatrix({ scenarios, config }: Props) {
  if (scenarios.length === 0) return null;

  const { bank_rates, plazos_years, bank_rate_labels } = config;

  // Build lookup: rate -> plazo -> scenario
  const lookup = new Map<string, FinancingScenario>();
  for (const s of scenarios) {
    lookup.set(`${s.rate}-${s.plazo_years}`, s);
  }

  const monto = scenarios[0]?.monto_financiar ?? 0;
  const firstScenario = scenarios[0];

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
            </tr>
          </thead>
          <tbody>
            {bank_rates.map((rate, ri) => (
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
              </tr>
            ))}
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
            label="Ingreso requerido (min)"
            value={formatCurrency(firstScenario.ingreso_requerido, config.currency)}
          />
          <Detail label="Multiplicador" value={`${config.income_multiplier}x ${config.income_base === "cuota_banco" ? "cuota banco" : "mensualidad"}`} />
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
