#!/usr/bin/env npx ts-node
/**
 * Commission debug: validate inputs, recompute expected for sample, reconcile totals.
 *
 * Run in TERMINAL (not in Supabase SQL Editor):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/commission-debug/validate-and-reconcile.ts
 *
 * For Supabase SQL Editor use: 01-validate-inputs.sql, 02-inspect..., 03-sample-recompute.sql, 04-reconciliation-report.sql
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_* vars)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type RateRow = {
  recipient_id: string;
  recipient_name: string;
  recipient_type: string;
  rate: number;
  always_paid: boolean;
};

type PhaseRow = { phase: number; percentage: number };

type SaleInfo = {
  sales_rep_id: string | null;
  referral_applies: boolean;
  referral_name: string | null;
  deed_signed_date: string | null;
};

type PaymentRow = {
  id: string;
  sale_id: string;
  amount: number;
  payment_type: string;
  payment_date: string;
  sales: SaleInfo | SaleInfo[] | null;
};

type CommissionRow = {
  payment_id: string;
  recipient_id: string;
  commission_amount: number;
};

function getPhase(
  paymentType: string,
  paymentDate: string,
  deedSignedDate: string | null
): number {
  if (paymentType === "reservation") return 1;
  if (deedSignedDate && paymentDate >= deedSignedDate) return 3;
  return 2;
}

function getSale(payment: PaymentRow): SaleInfo | null {
  const s = payment.sales;
  if (!s) return null;
  return Array.isArray(s) ? s[0] ?? null : s;
}

function computeExpectedForPayment(
  payment: PaymentRow,
  rates: RateRow[],
  phasePct: Map<number, number>
): { totalExpected: number; byRecipient: Array<{ recipient_id: string; amount: number }> } {
  const sale = getSale(payment);
  const deedSigned = sale?.deed_signed_date ?? null;
  const phase = getPhase(payment.payment_type, payment.payment_date, deedSigned);
  const pct = phasePct.get(phase) ?? 0;
  const base = Number(payment.amount) || 0;

  const salesRepId =
    sale?.sales_rep_id != null && sale.sales_rep_id !== ""
      ? String(sale.sales_rep_id).trim()
      : null;
  const isWalkIn =
    salesRepId == null || salesRepId === "unknown" || salesRepId === "walk_in";
  // DB function uses only referral_applies (no referral_name check)
  const referralApplies = Boolean(sale?.referral_applies);

  const byRecipient: Array<{ recipient_id: string; amount: number }> = [];
  let totalExpected = 0;

  for (const r of rates) {
    let include = false;
    if (r.recipient_type === "management" && r.always_paid) {
      include = true;
    } else if (r.recipient_type === "sales_rep") {
      include = !isWalkIn && salesRepId === r.recipient_id;
    } else if (r.recipient_type === "special") {
      if (r.recipient_id === "walk_in") include = isWalkIn;
      else if (r.recipient_id === "referral") include = referralApplies;
      else if (r.always_paid) include = true; // e.g. ahorro
    }
    if (include) {
      const amount = base * Number(r.rate) * pct;
      byRecipient.push({ recipient_id: r.recipient_id, amount });
      totalExpected += amount;
    }
  }

  return { totalExpected, byRecipient };
}

async function main() {
  console.log("=== Commission debug: validate inputs + sample + reconciliation ===\n");

  // --- Step 1: Validate base inputs ---
  console.log("--- Step 1: Validate base inputs ---");

  const { data: rateRows, error: rateErr } = await supabase
    .from("commission_rates")
    .select("recipient_id, recipient_name, recipient_type, rate, always_paid")
    .eq("active", true);

  if (rateErr) {
    console.error("commission_rates error:", rateErr.message);
    process.exit(1);
  }

  const rates = (rateRows ?? []) as RateRow[];
  const byType = new Map<string, number>();
  for (const r of rates) {
    byType.set(r.recipient_type, (byType.get(r.recipient_type) ?? 0) + 1);
  }
  console.log("commission_rates by type:", Object.fromEntries(byType));
  const hasManagement = (byType.get("management") ?? 0) >= 1;
  const hasSalesRep = (byType.get("sales_rep") ?? 0) >= 1;
  const hasSpecial = (byType.get("special") ?? 0) >= 1;
  if (!hasManagement || !hasSalesRep || !hasSpecial) {
    console.warn("WARN: Missing expected recipient_type(s). Rules expect management, sales_rep, special.");
  }

  const { data: phaseRows, error: phaseErr } = await supabase
    .from("commission_phases")
    .select("phase, percentage")
    .in("phase", [1, 2, 3]);

  if (phaseErr) {
    console.error("commission_phases error:", phaseErr.message);
    process.exit(1);
  }

  const phases = (phaseRows ?? []) as PhaseRow[];
  const phasePct = new Map<number, number>();
  let sumPct = 0;
  for (const p of phases) {
    phasePct.set(p.phase, Number(p.percentage));
    sumPct += Number(p.percentage);
  }
  console.log("commission_phases 1–3:", Object.fromEntries(phasePct), "sum:", sumPct.toFixed(6));
  if (Math.abs(sumPct - 1) > 0.0001) {
    console.warn("WARN: Phase percentages should sum to 1.0");
  }

  console.log("");

  // --- Step 3: Sample of 10 payments ---
  console.log("--- Step 3: Recompute expected for sample of 10 payments ---");

  const { data: allPayments, error: payErr } = await supabase
    .from("payments")
    .select(
      "id, sale_id, amount, payment_type, payment_date, sales ( sales_rep_id, referral_applies, referral_name, deed_signed_date )"
    )
    .order("payment_date", { ascending: true });

  if (payErr) {
    console.error("payments error:", payErr.message);
    process.exit(1);
  }

  const payments = (allPayments ?? []) as PaymentRow[];
  // Prefer mix: reservation vs down_payment, with and without deed_signed_date
  const reservation = payments.filter((p) => p.payment_type === "reservation");
  const downPayment = payments.filter((p) => p.payment_type === "down_payment");
  const withDeed = payments.filter(
    (p) => p.sales?.deed_signed_date && p.payment_date >= (p.sales.deed_signed_date ?? "")
  );
  const withoutDeed = payments.filter(
    (p) => !p.sales?.deed_signed_date || p.payment_date < (p.sales.deed_signed_date ?? "")
  );

  const sampleIds = new Set<string>();
  const picks = [
    reservation[0],
    reservation[Math.floor(reservation.length / 2)],
    downPayment[0],
    downPayment[Math.floor(downPayment.length / 2)],
    ...withDeed.slice(0, 2),
    ...withoutDeed.slice(0, 4)
  ].filter(Boolean) as PaymentRow[];
  picks.forEach((p) => sampleIds.add(p.id));
  // Fill to 10 with any payments if needed
  for (const p of payments) {
    if (sampleIds.size >= 10) break;
    sampleIds.add(p.id);
  }
  const samplePayments = payments.filter((p) => sampleIds.has(p.id)).slice(0, 10);

  const { data: actualCommissions, error: commErr } = await supabase
    .from("commissions")
    .select("payment_id, recipient_id, commission_amount")
    .in("payment_id", samplePayments.map((p) => p.id));

  if (commErr) {
    console.error("commissions error:", commErr.message);
    process.exit(1);
  }

  const actualByPayment = new Map<string, CommissionRow[]>();
  for (const c of (actualCommissions ?? []) as CommissionRow[]) {
    const list = actualByPayment.get(c.payment_id) ?? [];
    list.push(c);
    actualByPayment.set(c.payment_id, list);
  }

  console.log("Sample size:", samplePayments.length);
  let sampleMatch = 0;
  let sampleMismatch = 0;
  for (const p of samplePayments) {
    const { totalExpected } = computeExpectedForPayment(p, rates, phasePct);
    const actualList = actualByPayment.get(p.id) ?? [];
    const actualTotal = actualList.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
    const diff = Math.abs(totalExpected - actualTotal);
    const match = diff < 0.02; // allow tiny rounding
    if (match) sampleMatch++;
    else sampleMismatch++;
    console.log(
      `  payment ${p.id.slice(0, 8)}... type=${p.payment_type} expected=${totalExpected.toFixed(2)} actual=${actualTotal.toFixed(2)} ${match ? "OK" : "MISMATCH"}`
    );
  }
  console.log(`Sample result: ${sampleMatch} match, ${sampleMismatch} mismatch\n`);

  // --- Step 4: Aggregate expected vs actual totals ---
  console.log("--- Step 4: Aggregate expected vs actual totals ---");

  let totalExpectedAll = 0;
  const expectedByRecipient = new Map<string, number>();
  const expectedByType = new Map<string, number>();
  const expectedByMonth = new Map<string, number>();

  for (const p of payments) {
    const { totalExpected, byRecipient } = computeExpectedForPayment(p, rates, phasePct);
    totalExpectedAll += totalExpected;
    const monthKey = p.payment_date.slice(0, 7);
    expectedByMonth.set(monthKey, (expectedByMonth.get(monthKey) ?? 0) + totalExpected);
    for (const { recipient_id, amount } of byRecipient) {
      expectedByRecipient.set(recipient_id, (expectedByRecipient.get(recipient_id) ?? 0) + amount);
      const r = rates.find((x) => x.recipient_id === recipient_id);
      const t = r?.recipient_type ?? "unknown";
      expectedByType.set(t, (expectedByType.get(t) ?? 0) + amount);
    }
  }

  const { data: allCommissions, error: allCommErr } = await supabase
    .from("commissions")
    .select("payment_id, recipient_id, commission_amount, created_at");

  if (allCommErr) {
    console.error("commissions (all) error:", allCommErr.message);
    process.exit(1);
  }

  const commList = (allCommissions ?? []) as Array<CommissionRow & { created_at?: string }>;
  let totalActualAll = 0;
  const actualByRecipient = new Map<string, number>();
  const actualByMonth = new Map<string, number>();

  for (const c of commList) {
    const amt = Number(c.commission_amount) || 0;
    totalActualAll += amt;
    actualByRecipient.set(
      c.recipient_id,
      (actualByRecipient.get(c.recipient_id) ?? 0) + amt
    );
    const monthKey = c.created_at ? c.created_at.slice(0, 7) : "";
    if (monthKey) actualByMonth.set(monthKey, (actualByMonth.get(monthKey) ?? 0) + amt);
  }

  const actualByType = new Map<string, number>();
  for (const [recipientId, amount] of actualByRecipient) {
    const r = rates.find((x) => x.recipient_id === recipientId);
    const t = r?.recipient_type ?? "unknown";
    actualByType.set(t, (actualByType.get(t) ?? 0) + amount);
  }

  console.log("Overall: expected =", totalExpectedAll.toFixed(2), " actual =", totalActualAll.toFixed(2), " diff =", (totalExpectedAll - totalActualAll).toFixed(2));
  console.log("\nBy recipient_type:");
  const allTypes = new Set([...expectedByType.keys(), ...actualByType.keys()]);
  for (const t of [...allTypes].sort()) {
    const exp = expectedByType.get(t) ?? 0;
    const act = actualByType.get(t) ?? 0;
    console.log(`  ${t}: expected=${exp.toFixed(2)} actual=${act.toFixed(2)} diff=${(exp - act).toFixed(2)}`);
  }
  console.log("\nBy month (first 12):");
  const months = [...new Set([...expectedByMonth.keys(), ...actualByMonth.keys()])].sort().slice(0, 12);
  for (const m of months) {
    const exp = expectedByMonth.get(m) ?? 0;
    const act = actualByMonth.get(m) ?? 0;
    console.log(`  ${m}: expected=${exp.toFixed(2)} actual=${act.toFixed(2)} diff=${(exp - act).toFixed(2)}`);
  }

  console.log("\n--- Reconciliation summary ---");
  console.log("Total expected:", totalExpectedAll.toFixed(2));
  console.log("Total actual:  ", totalActualAll.toFixed(2));
  console.log("Difference:   ", (totalExpectedAll - totalActualAll).toFixed(2));
  if (sampleMismatch > 0 || Math.abs(totalExpectedAll - totalActualAll) > 0.02) {
    console.log("\nDiscrepancy detected: check phase logic, recipient eligibility, or missing commission rows.");
  } else {
    console.log("\nNo significant discrepancy.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
