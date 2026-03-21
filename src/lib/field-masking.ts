/**
 * Role-Aware Field Masking — Phase 4 (GAP-03)
 *
 * Post-query response shaping: full data stays server-side,
 * only role-appropriate fields reach the client.
 *
 * Rules confirmed 2026-03-20:
 * - master / torredecontrol / financiero: full access
 * - contabilidad: amounts + ISR visible, recipient names anonymized
 * - gerencia: aggregates only, no per-person breakdown, no payment history
 *
 * Defense-in-depth: unknown roles default to most restrictive (gerencia-level).
 */

// Roles that receive full data — no masking applied
const FULL_ACCESS_ROLES = new Set(["master", "torredecontrol", "financiero"]);

// ────────────────────────────────────────────────────────────────
// /api/analytics/commissions
// ────────────────────────────────────────────────────────────────

type CommissionRecipient = {
  recipientId: string;
  recipientName: string;
  recipientType: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  percentPaid: number;
  isrExempt: boolean;
  disbursable: boolean;
  facturar: number;
  isrRetenido: number;
  pagar: number;
};

type CommissionSummary = {
  total: number;
  paid: number;
  unpaid: number;
  facturar: number;
  isrRetenido: number;
  pagar: number;
  disbursableTotal: number;
  disbursablePaid: number;
  disbursableUnpaid: number;
};

type CommissionsAnalyticsResponse = {
  byRecipient: CommissionRecipient[];
  summary: CommissionSummary;
};

export function maskCommissionsAnalytics(
  role: string,
  data: CommissionsAnalyticsResponse
): CommissionsAnalyticsResponse {
  if (FULL_ACCESS_ROLES.has(role)) return data;

  if (role === "contabilidad") {
    return {
      byRecipient: data.byRecipient.map((r, i) => ({
        ...r,
        recipientName: `Beneficiario ${i + 1}`,
      })),
      summary: data.summary,
    };
  }

  // gerencia and any unknown role → most restrictive
  return {
    byRecipient: [],
    summary: {
      total: data.summary.total,
      paid: data.summary.paid,
      unpaid: data.summary.unpaid,
      facturar: 0,
      isrRetenido: 0,
      pagar: 0,
      disbursableTotal: 0,
      disbursablePaid: 0,
      disbursableUnpaid: 0,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// /api/analytics/payment-compliance
// ────────────────────────────────────────────────────────────────

type ComplianceUnit = {
  unitId: string;
  unitNumber: string;
  clientName: string;
  expectedToDate: number;
  actualTotal: number;
  compliancePct: number | null;
  variance: number;
  complianceStatus: string;
  daysDelinquent: number | null;
  firstDueDate: string;
  lastDueDate: string;
  paymentHistory: Array<{ id: string; paymentDate: string; paymentType: string; amount: number }>;
};

type ComplianceProject = {
  projectId: string;
  projectName: string;
  units: ComplianceUnit[];
};

type ComplianceSummary = {
  totalUnits: number;
  compliantUnits: number;
  delinquentUnits: number;
  expectedToDate: number;
  actualTotal: number;
  compliancePct: number;
  variance: number;
  byAgingBucket: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90Plus: number;
  };
};

type PaymentComplianceResponse = {
  byProject: ComplianceProject[];
  summary: ComplianceSummary;
};

export function maskPaymentCompliance(
  role: string,
  data: PaymentComplianceResponse
): PaymentComplianceResponse {
  if (FULL_ACCESS_ROLES.has(role)) return data;

  if (role === "gerencia") {
    return {
      byProject: data.byProject.map((p) => ({
        ...p,
        units: p.units.map((u) => ({
          ...u,
          paymentHistory: [],
        })),
      })),
      summary: data.summary,
    };
  }

  // Unknown role → most restrictive (strip payment history)
  return {
    byProject: data.byProject.map((p) => ({
      ...p,
      units: p.units.map((u) => ({
        ...u,
        paymentHistory: [],
      })),
    })),
    summary: data.summary,
  };
}

// ────────────────────────────────────────────────────────────────
// /api/analytics/payments
// ────────────────────────────────────────────────────────────────

type AmountPair = { expected: number; paid: number };

type PaymentUnit = {
  unitId: string;
  unitNumber: string;
  clientName: string;
  totalExpected: number;
  totalPaid: number;
  percentPaid: number;
  engancheTotal: AmountPair;
  reserve: AmountPair;
  downPayment: AmountPair;
  installments: AmountPair;
  paymentHistory: Array<{ id: string; paymentDate: string; paymentType: string; amount: number }>;
};

type PaymentProject = {
  projectId: string;
  projectName: string;
  units: PaymentUnit[];
};

type PaymentsAnalyticsResponse = {
  byProject: PaymentProject[];
  summary: { totalExpected: number; totalPaid: number; percentPaid: number };
};

const ZERO_PAIR: AmountPair = { expected: 0, paid: 0 };

export function maskPaymentsAnalytics(
  role: string,
  data: PaymentsAnalyticsResponse
): PaymentsAnalyticsResponse {
  if (FULL_ACCESS_ROLES.has(role)) return data;

  if (role === "gerencia") {
    return {
      byProject: data.byProject.map((p) => ({
        ...p,
        units: p.units.map((u) => ({
          ...u,
          totalExpected: 0,
          totalPaid: 0,
          percentPaid: 0,
          engancheTotal: ZERO_PAIR,
          reserve: ZERO_PAIR,
          downPayment: ZERO_PAIR,
          installments: ZERO_PAIR,
          paymentHistory: [],
        })),
      })),
      summary: data.summary, // project-level aggregates visible to all
    };
  }

  // Unknown role → most restrictive (same as gerencia)
  return {
    byProject: data.byProject.map((p) => ({
      ...p,
      units: p.units.map((u) => ({
        ...u,
        totalExpected: 0,
        totalPaid: 0,
        percentPaid: 0,
        engancheTotal: ZERO_PAIR,
        reserve: ZERO_PAIR,
        downPayment: ZERO_PAIR,
        installments: ZERO_PAIR,
        paymentHistory: [],
      })),
    })),
    summary: data.summary,
  };
}

// ────────────────────────────────────────────────────────────────
// /api/commissions (legacy)
// ────────────────────────────────────────────────────────────────

type LegacyCommissionRow = {
  recipient_name: string;
  recipient_id: string;
  commission_amount: number;
};

type LegacyCommissionsResponse<T extends LegacyCommissionRow> = {
  data: T[];
  total_amount: number;
  count: number;
};

export function maskCommissionsLegacy<T extends LegacyCommissionRow>(
  role: string,
  data: LegacyCommissionsResponse<T>
): LegacyCommissionsResponse<T> {
  if (FULL_ACCESS_ROLES.has(role)) return data;

  if (role === "contabilidad") {
    return {
      data: data.data.map((item, i) => ({
        ...item,
        recipient_name: `Beneficiario ${i + 1}`,
      })),
      total_amount: data.total_amount,
      count: data.count,
    };
  }

  // gerencia and any unknown role → most restrictive
  return {
    data: [],
    total_amount: data.total_amount,
    count: data.count,
  };
}
