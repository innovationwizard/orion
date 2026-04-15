/**
 * Cotizador — pure computation functions for unit quotation.
 *
 * All functions are side-effect-free. They take unit pricing + per-project
 * configuration and return computed quotation data (enganche schedule, bank
 * financing scenarios, escrituracion splits).
 *
 * Guatemala-specific: GTQ/USD currency, IVA 12%, timbres fiscales 3%,
 * IUSI property tax, FHA/bank rates.
 *
 * Configuration is per-project/tower/unit-type via `CotizadorConfig`.
 * The hardcoded `COTIZADOR_DEFAULTS` exist only as a backward-compatible
 * fallback when no DB config is available.
 */

// ---------------------------------------------------------------------------
// Defaults — backward-compatible fallback only
// ---------------------------------------------------------------------------

export const COTIZADOR_DEFAULTS = {
  RESERVA_AMOUNT: 1500,
  ENGANCHE_PCT: 0.10,
  INSTALLMENT_MONTHS: 7,
  INMUEBLE_PCT: 0.70,
  IVA_RATE: 0.12,
  IUSI_ANNUAL_RATE: 0.009,
  INSURANCE_ANNUAL_RATE: 0.0035,
  TIMBRES_RATE: 0.03,
  BANK_RATES: [0.075, 0.085, 0.095, 0.105] as readonly number[],
  PLAZOS_YEARS: [15, 20, 25, 30] as readonly number[],
  INCOME_MULTIPLIER: 3,
} as const;

// ---------------------------------------------------------------------------
// CotizadorConfig — per-project configuration from DB
// ---------------------------------------------------------------------------

export interface CotizadorConfig {
  currency: "GTQ" | "USD";
  enganche_pct: number;
  reserva_default: number;
  installment_months: number;
  // Rounding
  round_enganche_q100: boolean;
  round_cuota_q100: boolean;
  round_cuota_q1: boolean;
  round_saldo_q100: boolean;
  // Bank
  bank_rates: number[];
  bank_rate_labels: string[];
  plazos_years: number[];
  // Cuota composition
  include_seguro_in_cuota: boolean;
  include_iusi_in_cuota: boolean;
  seguro_enabled: boolean;
  seguro_base: "price" | "monto_financiar";
  iusi_frequency: "monthly" | "quarterly";
  // Income
  income_multiplier: number;
  income_base: "cuota_banco" | "cuota_mensual";
  // Escrituracion
  inmueble_pct: number;
  timbres_rate: number;
  use_pretax_extraction: boolean;
  // Mantenimiento
  mantenimiento_per_m2: number | null;
  mantenimiento_label: string | null;
  // Enganche constraints
  min_enganche_pct: number | null;
  // Presentation
  disclaimers: string[];
  validity_days: number;
}

/** Build a CotizadorConfig from the legacy hardcoded defaults (fallback). */
export function configFromDefaults(): CotizadorConfig {
  return {
    currency: "GTQ",
    enganche_pct: COTIZADOR_DEFAULTS.ENGANCHE_PCT,
    reserva_default: COTIZADOR_DEFAULTS.RESERVA_AMOUNT,
    installment_months: COTIZADOR_DEFAULTS.INSTALLMENT_MONTHS,
    round_enganche_q100: false,
    round_cuota_q100: false,
    round_cuota_q1: false,
    round_saldo_q100: false,
    bank_rates: [...COTIZADOR_DEFAULTS.BANK_RATES],
    bank_rate_labels: COTIZADOR_DEFAULTS.BANK_RATES.map((r) => `${(r * 100).toFixed(1)}%`),
    plazos_years: [...COTIZADOR_DEFAULTS.PLAZOS_YEARS],
    include_seguro_in_cuota: true,
    include_iusi_in_cuota: true,
    seguro_enabled: true,
    seguro_base: "monto_financiar",
    iusi_frequency: "monthly",
    income_multiplier: COTIZADOR_DEFAULTS.INCOME_MULTIPLIER,
    income_base: "cuota_mensual",
    inmueble_pct: COTIZADOR_DEFAULTS.INMUEBLE_PCT,
    timbres_rate: COTIZADOR_DEFAULTS.TIMBRES_RATE,
    use_pretax_extraction: true,
    mantenimiento_per_m2: null,
    mantenimiento_label: null,
    min_enganche_pct: null,
    disclaimers: [],
    validity_days: 7,
  };
}

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
  rate_label: string;
  plazo_years: number;
  monto_financiar: number;
  cuota_banco: number;
  iusi_monthly: number;
  iusi_quarterly: number;
  seguro_monthly: number;
  seguro_informational: boolean;
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
  timbres_acciones: number;
  valor_acciones_con_timbres: number;
  total_sin_impuesto: number;
  total_con_impuesto: number;
}

// ---------------------------------------------------------------------------
// Rounding utilities
// ---------------------------------------------------------------------------

/** Round UP to nearest Q100 (Excel ROUNDUP(x, -2)). */
export function roundUpQ100(amount: number): number {
  return Math.ceil(amount / 100) * 100;
}

/** Round UP to nearest Q1 (Excel ROUNDUP(x, 0)). */
export function roundUpQ1(amount: number): number {
  return Math.ceil(amount);
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
  config: Pick<CotizadorConfig, "round_enganche_q100" | "round_cuota_q100" | "round_cuota_q1">,
  enganche_pct: number,
  reserva: number,
  installment_months: number,
  overrides?: Record<number, number>,
): EngancheResult {
  // 1. Enganche total — conditionally round to Q100
  let enganche_total = price * enganche_pct;
  if (config.round_enganche_q100) {
    enganche_total = roundUpQ100(enganche_total);
  } else {
    enganche_total = Math.round(enganche_total);
  }

  // 2. Enganche neto
  const enganche_neto = Math.max(0, enganche_total - reserva);

  // 3. Cuota — conditionally round to Q100 or Q1
  let cuota_enganche: number;
  if (installment_months <= 0) {
    cuota_enganche = enganche_neto;
  } else if (config.round_cuota_q100) {
    cuota_enganche = roundUpQ100(enganche_neto / installment_months);
  } else if (config.round_cuota_q1) {
    cuota_enganche = roundUpQ1(enganche_neto / installment_months);
  } else {
    cuota_enganche = Math.round(enganche_neto / installment_months);
  }

  // 4. Build installment schedule
  const installments: { number: number; amount: number }[] = [
    { number: 0, amount: reserva },
  ];

  // Filter valid overrides: keys must be 1..installment_months, amounts >= 1
  const validOverrides: Record<number, number> = {};
  if (overrides && installment_months > 0) {
    for (const [key, amount] of Object.entries(overrides)) {
      const k = Number(key);
      if (k >= 1 && k <= installment_months && amount >= 1) {
        validOverrides[k] = Math.round(amount);
      }
    }

    // Clamp: total overrides cannot exceed enganche_neto minus floor for remaining cuotas
    const overriddenKeys = Object.keys(validOverrides).map(Number);
    const nonOverriddenCount = installment_months - overriddenKeys.length;
    const overrideSum = Object.values(validOverrides).reduce((a, b) => a + b, 0);
    const maxOverrideSum = enganche_neto - nonOverriddenCount; // each remaining cuota >= 1

    if (overrideSum > maxOverrideSum && nonOverriddenCount > 0) {
      // Scale down proportionally to fit within budget
      const scale = maxOverrideSum / overrideSum;
      for (const k of overriddenKeys) {
        validOverrides[k] = Math.max(1, Math.round(validOverrides[k] * scale));
      }
    }
  }

  const hasOverrides = Object.keys(validOverrides).length > 0;

  if (!hasOverrides) {
    // Uniform distribution (original behavior)
    for (let i = 1; i <= installment_months; i++) {
      if (i === installment_months && installment_months > 1) {
        const previous_sum = cuota_enganche * (installment_months - 1);
        installments.push({ number: i, amount: enganche_neto - previous_sum });
      } else {
        installments.push({ number: i, amount: cuota_enganche });
      }
    }
  } else {
    // Custom distribution: overrides where specified, uniform remainder elsewhere
    const overriddenKeys = new Set(Object.keys(validOverrides).map(Number));
    const overrideTotal = Object.values(validOverrides).reduce((a, b) => a + b, 0);
    const remainingBudget = enganche_neto - overrideTotal;
    const nonOverriddenCount = installment_months - overriddenKeys.size;

    // Compute uniform cuota for non-overridden installments
    let uniformRemaining: number;
    if (nonOverriddenCount <= 0) {
      uniformRemaining = 0;
    } else if (config.round_cuota_q100) {
      uniformRemaining = roundUpQ100(remainingBudget / nonOverriddenCount);
    } else if (config.round_cuota_q1) {
      uniformRemaining = roundUpQ1(remainingBudget / nonOverriddenCount);
    } else {
      uniformRemaining = Math.round(remainingBudget / nonOverriddenCount);
    }

    // Update cuota_enganche to reflect the uniform portion (informational)
    cuota_enganche = nonOverriddenCount > 0 ? uniformRemaining : 0;

    // Find the last non-overridden cuota to absorb rounding remainder
    let lastNonOverridden = -1;
    for (let i = installment_months; i >= 1; i--) {
      if (!overriddenKeys.has(i)) {
        lastNonOverridden = i;
        break;
      }
    }

    // Build installments
    let runningSum = 0;
    for (let i = 1; i <= installment_months; i++) {
      if (overriddenKeys.has(i)) {
        installments.push({ number: i, amount: validOverrides[i] });
        runningSum += validOverrides[i];
      } else if (i === lastNonOverridden) {
        // Last non-overridden absorbs rounding remainder
        const uniformAlreadyPlaced = installments.filter(
          (inst) => inst.number >= 1 && !overriddenKeys.has(inst.number),
        ).length;
        const uniformAfterThis = nonOverriddenCount - uniformAlreadyPlaced - 1;
        const absorberAmount = enganche_neto - runningSum - (uniformAfterThis * uniformRemaining);
        installments.push({ number: i, amount: absorberAmount });
        runningSum += absorberAmount;
      } else {
        installments.push({ number: i, amount: uniformRemaining });
        runningSum += uniformRemaining;
      }
    }
  }

  return { enganche_total, reserva, enganche_neto, cuota_enganche, installments };
}

/**
 * Convert a persisted enganche_schedule JSONB array to the overrides Record
 * used by computeEnganche. Used by PCV, carta de pago, and admin UI.
 */
export function scheduleToOverrides(
  schedule: { cuota: number; amount: number }[],
): Record<number, number> {
  const overrides: Record<number, number> = {};
  for (const entry of schedule) {
    overrides[entry.cuota] = entry.amount;
  }
  return overrides;
}

// ---------------------------------------------------------------------------
// Bank financing matrix
// ---------------------------------------------------------------------------

export function computeFinancingMatrix(
  price: number,
  enganche_total: number,
  config: Pick<
    CotizadorConfig,
    | "bank_rates"
    | "bank_rate_labels"
    | "plazos_years"
    | "round_saldo_q100"
    | "seguro_enabled"
    | "seguro_base"
    | "include_seguro_in_cuota"
    | "include_iusi_in_cuota"
    | "iusi_frequency"
    | "income_multiplier"
    | "income_base"
    | "inmueble_pct"
    | "timbres_rate"
    | "use_pretax_extraction"
  >,
  valor_inmueble: number | null,
): FinancingScenario[] {
  // Saldo a financiar — conditionally round to Q100
  let monto_financiar = Math.max(0, price - enganche_total);
  if (config.round_saldo_q100) monto_financiar = roundUpQ100(monto_financiar);

  // IUSI base = valor_inmueble (70% of price-without-taxes).
  // When not stored in DB, derive inline using the escrituracion pre-tax method.
  let iusi_base: number;
  if (valor_inmueble != null) {
    iusi_base = valor_inmueble;
  } else {
    const pct_inmueble = config.inmueble_pct;
    const pct_acciones = +(1 - pct_inmueble).toFixed(4);
    const tax_factor = config.use_pretax_extraction
      ? pct_inmueble * (1 + COTIZADOR_DEFAULTS.IVA_RATE) + pct_acciones * (1 + config.timbres_rate)
      : 1 + COTIZADOR_DEFAULTS.IVA_RATE;
    iusi_base = Math.round((price / tax_factor) * pct_inmueble);
  }
  const iusi_monthly = Math.round((iusi_base * COTIZADOR_DEFAULTS.IUSI_ANNUAL_RATE) / 12);
  const iusi_quarterly = Math.round((iusi_base * COTIZADOR_DEFAULTS.IUSI_ANNUAL_RATE) / 4);

  // Insurance
  const seguro_calc_base = config.seguro_base === "price" ? price : monto_financiar;
  const seguro_monthly = config.seguro_enabled
    ? Math.round((seguro_calc_base * COTIZADOR_DEFAULTS.INSURANCE_ANNUAL_RATE) / 12)
    : 0;

  const scenarios: FinancingScenario[] = [];
  for (let ri = 0; ri < config.bank_rates.length; ri++) {
    const rate = config.bank_rates[ri];
    const rate_label = config.bank_rate_labels[ri] ?? `${(rate * 100).toFixed(2)}%`;

    for (const plazo of config.plazos_years) {
      const cuota_banco = Math.round(pmt(rate, plazo, monto_financiar));

      // Cuota mensual composition
      let total_monthly = cuota_banco;
      if (config.include_iusi_in_cuota) total_monthly += iusi_monthly;
      if (config.include_seguro_in_cuota) total_monthly += seguro_monthly;

      // Income requirement
      const income_base_amount =
        config.income_base === "cuota_banco" ? cuota_banco : total_monthly;
      const ingreso_requerido = Math.round(income_base_amount * config.income_multiplier);

      scenarios.push({
        rate,
        rate_label,
        plazo_years: plazo,
        monto_financiar,
        cuota_banco,
        iusi_monthly: config.include_iusi_in_cuota ? iusi_monthly : 0,
        iusi_quarterly: config.iusi_frequency === "quarterly" ? iusi_quarterly : 0,
        seguro_monthly: config.seguro_enabled ? seguro_monthly : 0,
        seguro_informational: config.seguro_enabled && !config.include_seguro_in_cuota,
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
  config: Pick<CotizadorConfig, "inmueble_pct" | "timbres_rate" | "use_pretax_extraction">,
): EscrituracionResult {
  const pct_inmueble = config.inmueble_pct;
  const pct_acciones = +(1 - pct_inmueble).toFixed(4); // avoid float noise
  const r2 = (n: number) => Math.round(n * 100) / 100;

  let valor_inmueble_sin_iva: number;
  let valor_acciones: number;

  if (config.use_pretax_extraction) {
    // Excel method: extract pre-tax base by dividing total by blended tax factor.
    // factor = pct_inmueble × 1.12 + pct_acciones × (1 + timbres_rate)
    // When 70/30 with 3% timbres: 0.70×1.12 + 0.30×1.03 = 1.093
    // When 100/0 (locales): 1.00×1.12 = 1.12
    const tax_factor =
      pct_inmueble * (1 + COTIZADOR_DEFAULTS.IVA_RATE) +
      pct_acciones * (1 + config.timbres_rate);
    const base = price / tax_factor;
    valor_inmueble_sin_iva = r2(base * pct_inmueble);
    valor_acciones = r2(base * pct_acciones);
  } else {
    valor_inmueble_sin_iva = r2(price * pct_inmueble);
    valor_acciones = r2(price * pct_acciones);
  }

  const iva_inmueble = r2(valor_inmueble_sin_iva * COTIZADOR_DEFAULTS.IVA_RATE);
  const timbres_acciones = r2(valor_acciones * config.timbres_rate);
  const valor_inmueble_con_iva = r2(valor_inmueble_sin_iva + iva_inmueble);
  const valor_acciones_con_timbres = r2(valor_acciones + timbres_acciones);

  return {
    pct_inmueble,
    pct_acciones,
    valor_inmueble_sin_iva,
    iva_inmueble,
    valor_inmueble_con_iva,
    valor_acciones,
    timbres_acciones,
    valor_acciones_con_timbres,
    total_sin_impuesto: r2(valor_inmueble_sin_iva + valor_acciones),
    total_con_impuesto: r2(valor_inmueble_con_iva + valor_acciones_con_timbres),
  };
}

// ---------------------------------------------------------------------------
// Mantenimiento (HOA fee)
// ---------------------------------------------------------------------------

export function computeMantenimiento(
  area_total: number,
  per_m2: number | null,
): number | null {
  if (per_m2 == null || area_total <= 0) return null;
  return Math.ceil(per_m2 * area_total);
}
