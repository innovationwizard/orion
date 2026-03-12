/**
 * Cotizador — pure computation functions for unit quotation.
 *
 * All functions are side-effect-free. They take unit pricing + user parameters
 * and return computed quotation data (enganche schedule, bank financing
 * scenarios, escrituracion splits).
 *
 * Guatemala-specific: GTQ currency, IVA 12%, IUSI property tax, FHA/bank rates.
 */

// ---------------------------------------------------------------------------
// Defaults — Guatemala market, Puerta Abierta standard terms
// ---------------------------------------------------------------------------

export const COTIZADOR_DEFAULTS = {
  RESERVA_AMOUNT: 1500,
  ENGANCHE_PCT: 0.10,
  INSTALLMENT_MONTHS: 7,
  INMUEBLE_PCT: 0.70,
  IVA_RATE: 0.12,
  IUSI_ANNUAL_RATE: 0.009,
  INSURANCE_ANNUAL_RATE: 0.0035,
  BANK_RATES: [0.075, 0.085, 0.095, 0.105] as readonly number[],
  PLAZOS_YEARS: [15, 20, 25, 30] as readonly number[],
  INCOME_MULTIPLIER: 3,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EngancheResult {
  enganche_total: number;
  reserva: number;
  enganche_neto: number;
  cuota_enganche: number;
  installments: { number: number; amount: number }[];
}

export interface FinancingScenario {
  rate: number;
  plazo_years: number;
  monto_financiar: number;
  cuota_banco: number;
  iusi_monthly: number;
  seguro_monthly: number;
  total_monthly: number;
  ingreso_requerido: number;
}

export interface EscrituracionResult {
  pct_inmueble: number;
  pct_acciones: number;
  valor_inmueble_sin_iva: number;
  iva_inmueble: number;
  valor_inmueble_con_iva: number;
  valor_acciones: number;
  total_sin_impuesto: number;
  total_con_impuesto: number;
}

// ---------------------------------------------------------------------------
// PMT — standard annuity payment formula
// ---------------------------------------------------------------------------

/** Monthly payment for a loan (PMT formula). Returns 0 if rate is 0. */
export function pmt(rate_annual: number, years: number, principal: number): number {
  if (principal <= 0) return 0;
  const r = rate_annual / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ---------------------------------------------------------------------------
// Enganche (down payment) computation
// ---------------------------------------------------------------------------

export function computeEnganche(
  price: number,
  enganche_pct: number,
  reserva: number,
  installment_months: number,
): EngancheResult {
  const enganche_total = Math.round(price * enganche_pct);
  const enganche_neto = Math.max(0, enganche_total - reserva);
  const cuota_enganche = installment_months > 0 ? Math.round(enganche_neto / installment_months) : enganche_neto;

  const installments: { number: number; amount: number }[] = [
    { number: 0, amount: reserva },
  ];
  for (let i = 1; i <= installment_months; i++) {
    installments.push({ number: i, amount: cuota_enganche });
  }

  return { enganche_total, reserva, enganche_neto, cuota_enganche, installments };
}

// ---------------------------------------------------------------------------
// Bank financing matrix
// ---------------------------------------------------------------------------

export function computeFinancingMatrix(
  price: number,
  enganche_total: number,
  rates: readonly number[] = COTIZADOR_DEFAULTS.BANK_RATES,
  plazos: readonly number[] = COTIZADOR_DEFAULTS.PLAZOS_YEARS,
): FinancingScenario[] {
  const monto_financiar = Math.max(0, price - enganche_total);
  const iusi_monthly = Math.round((price * COTIZADOR_DEFAULTS.IUSI_ANNUAL_RATE) / 12);
  const seguro_monthly = Math.round((monto_financiar * COTIZADOR_DEFAULTS.INSURANCE_ANNUAL_RATE) / 12);

  const scenarios: FinancingScenario[] = [];
  for (const rate of rates) {
    for (const plazo of plazos) {
      const cuota_banco = Math.round(pmt(rate, plazo, monto_financiar));
      const total_monthly = cuota_banco + iusi_monthly + seguro_monthly;
      const ingreso_requerido = total_monthly * COTIZADOR_DEFAULTS.INCOME_MULTIPLIER;
      scenarios.push({
        rate,
        plazo_years: plazo,
        monto_financiar,
        cuota_banco,
        iusi_monthly,
        seguro_monthly,
        total_monthly,
        ingreso_requerido,
      });
    }
  }
  return scenarios;
}

// ---------------------------------------------------------------------------
// Escrituracion (deed) split
// ---------------------------------------------------------------------------

export function computeEscrituracion(
  price: number,
  pct_inmueble: number = COTIZADOR_DEFAULTS.INMUEBLE_PCT,
): EscrituracionResult {
  const pct_acciones = 1 - pct_inmueble;
  const valor_inmueble_sin_iva = Math.round(price * pct_inmueble);
  const iva_inmueble = Math.round(valor_inmueble_sin_iva * COTIZADOR_DEFAULTS.IVA_RATE);
  const valor_inmueble_con_iva = valor_inmueble_sin_iva + iva_inmueble;
  const valor_acciones = Math.round(price * pct_acciones);
  const total_sin_impuesto = valor_inmueble_sin_iva + valor_acciones;
  const total_con_impuesto = valor_inmueble_con_iva + valor_acciones;

  return {
    pct_inmueble,
    pct_acciones,
    valor_inmueble_sin_iva,
    iva_inmueble,
    valor_inmueble_con_iva,
    valor_acciones,
    total_sin_impuesto,
    total_con_impuesto,
  };
}
