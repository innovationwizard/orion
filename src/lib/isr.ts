/**
 * Guatemala ISR (Impuesto Sobre la Renta) retention utilities.
 *
 * SSOT formula: Total a pagar = Total a facturar × 107/112
 *
 * Breakdown from commission base (pre-IVA):
 *   facturar    = base × 1.12  (add 12% IVA)
 *   isrRetenido = base × 0.05  (5% ISR retention on pre-IVA amount)
 *   pagar       = base × 1.07  (facturar − isrRetenido = base × (1.12 − 0.05))
 */

export const IVA_RATE = 0.12;
export const ISR_RATE = 0.05;

/** 107/112 — net payment factor applied to invoice total */
export const PAGO_FACTOR = (1 + IVA_RATE - ISR_RATE) / (1 + IVA_RATE);

export type ISRBreakdown = {
  base: number;
  facturar: number;
  isrRetenido: number;
  pagar: number;
};

/**
 * Compute ISR breakdown from a base commission amount.
 * Exempt recipients (company-internal accounts) have no IVA or ISR:
 * facturar = pagar = base, isrRetenido = 0.
 */
export function computeISR(base: number, isExempt: boolean): ISRBreakdown {
  if (isExempt) {
    return { base, facturar: base, isrRetenido: 0, pagar: base };
  }
  return {
    base,
    facturar: base * (1 + IVA_RATE),
    isrRetenido: base * ISR_RATE,
    pagar: base * (1 + IVA_RATE - ISR_RATE),
  };
}
