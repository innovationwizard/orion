# Sale Lifecycle — Technical Explanation

## Data Model

The core entity is `Sale` defined in `src/lib/types.ts`, with three possible statuses:

```
"active" | "cancelled" | "completed"
```

Each sale links a **unit** (property), a **client** (buyer), a **sales rep**, and a **project**, and carries financial fields: `price_with_tax`, `price_without_tax`, `down_payment_amount`, `financed_amount`. A database constraint enforces `down_payment + financed = price_with_tax`.

---

## Lifecycle Stages

The sale progresses through stages driven by **date fields**, not explicit status transitions:

| Stage | Field | Effect |
|---|---|---|
| **Created** | `sale_date` | Unit flips `available → sold` |
| **Promise Signed** | `promise_signed_date` | Enables Phase 1 commissions |
| **Deed Signed** | `deed_signed_date` | Enables Phase 3 commissions |
| **Bank Disbursement** | `bank_disbursement_date` | Confirms Phase 3 eligibility |
| **Cancelled** | `status = "cancelled"` | Unit reverts to `available` |

---

## Sale Creation — `POST /api/sales`

Handled in `src/app/api/sales/route.ts`:

1. Zod validates all required fields
2. Verifies project, client, and unit exist
3. **Atomically** updates unit status from `available → sold` (conditional update prevents double-booking)
4. Inserts sale record with `status = "active"`

---

## Sale Cancellation (Desistimiento) — `PATCH /api/sales`

In the same `src/app/api/sales/route.ts`:

1. Only **active** sales can be cancelled
2. Sets `status = "cancelled"`
3. Reverts unit to `available`
4. UI lives at `src/app/desistimientos/page.tsx`

---

## Payment Tracking

Payments (`src/app/api/payments/route.ts`) are typed as `"reservation" | "down_payment" | "financed_payment"` and map to **commission phases**:

- **Phase 1 (30%)** — Reservation payments (requires promise signed)
- **Phase 2 (30%)** — Down payment installments
- **Phase 3 (40%)** — Payments on/after deed signing or bank disbursement

---

## Commission Calculation

A PL/pgSQL function `calculate_commissions()` (`scripts/migrations/008_commission_referral_types.sql`) fires automatically when a payment is inserted:

1. Determines the phase based on `payment_type` and sale dates
2. Looks up **policy periods** (project-specific rates by date range)
3. Applies **escalation thresholds** (rates increase after N units sold)
4. Handles **referral types** (`portfolio_standard`, `inter_project`, `external`, `broker`) with custom rate splits
5. Inserts commission records for each eligible recipient:
   ```
   commission_amount = payment_amount × recipient_rate × phase_percentage
   ```

Commission rates are capped at **5% max** via DB constraint. Commissions track status: `"pending" | "paid" | "void"`.

---

## Integrity & Audit

Defined in `supabase/migrations/20260209_schema_hardening.sql`:

- **Row versioning** — every table has `row_version` incremented on update (optimistic concurrency)
- **History logging** — triggers on UPDATE/DELETE record old/new data to `history.row_history`
- **RLS** — row-level security for authenticated users
- **Commission sync trigger** — keeps `status` in sync with `paid` boolean

---

## Architecture

No client-side state store (Redux/Zustand). It's **server-first**:

- Next.js API routes → Supabase server client → PostgreSQL
- React `useState` for UI state in `src/app/dashboard-client.tsx`
- Analytics computed server-side (payment compliance, cash flow, commission breakdowns)

---

## Multi-Sale Cycle: How Payments Stay Isolated

A unit can be sold, collect payments, get cancelled, and be sold again — repeatedly. The system never mixes payments across sales because of how foreign keys and queries are structured.

### Walkthrough: Unit #101

```
Unit #101 (available)
│
├─ Sale A created → unit flips to "sold"
│  ├─ Payment P1 [sale_id: sale-A]
│  ├─ Payment P2 [sale_id: sale-A]
│  │   └─ Commission C1 [sale_id: sale-A, payment_id: P1]
│  │   └─ Commission C2 [sale_id: sale-A, payment_id: P2]
│  └─ ❌ Sale A cancelled → unit reverts to "available"
│     (Payments P1, P2 and Commissions C1, C2 remain — still linked to Sale A)
│
├─ Sale B created → unit flips to "sold"
│  ├─ Payment P3 [sale_id: sale-B]
│  ├─ Payment P4 [sale_id: sale-B]
│  │   └─ Commission C3 [sale_id: sale-B, payment_id: P3]
│  │   └─ Commission C4 [sale_id: sale-B, payment_id: P4]
│  └─ ❌ Sale B cancelled → unit reverts to "available"
│     (Payments P3, P4 and Commissions C3, C4 remain — still linked to Sale B)
│
└─ Unit #101 cancelled (status: "cancelled")
   All historical data (Sales A & B, all payments, all commissions) persists.
```

### Why Payments Never Mix

**1. Immutable `sale_id` foreign key**

Every payment is stamped with a `sale_id` at creation. This is a required, non-nullable column. Each sale gets a unique UUID (v7), so Sale A and Sale B have completely different IDs — even for the same unit.

```typescript
// Payment insert — sale_id is always required
.insert({
  id: generateId(),
  sale_id: payload.sale_id,   // permanently ties this payment to one sale
  amount: payload.amount,
  ...
})
```

**2. Queries always filter through `sale_id`**

Every API route that reads payments filters by `sale_id`, not by `unit_id`:

```typescript
// GET /api/payments
if (query?.sale_id) {
  builder = builder.eq("sale_id", query.sale_id);
}
```

There is no code path that queries payments by unit directly — the chain is always `unit → sale → payments`.

**3. No cascading deletes — cancelled data stays in place**

When a sale is cancelled, the PATCH handler does only two things:

1. `sales.status = "cancelled"`
2. `units.status = "available"`

Payments and commissions are **not deleted, not voided, not modified**. They remain in the database forever, still linked to the cancelled sale via `sale_id`.

**4. Denormalized `sale_id` on commissions**

Commissions carry both `sale_id` and `payment_id` directly — no need for a multi-hop join through payments to find the sale:

```typescript
export type Commission = {
  sale_id: string;     // direct link to sale
  payment_id: string;  // direct link to payment
  ...
};
```

**5. Analytics group by `sale_id`**

Payment compliance analytics fetch payments keyed by `sale_id`:

```typescript
const paymentsBySale = new Map<string, PaymentRow[]>();
// payments grouped into map by sale_id
for (const p of payments) {
  const list = paymentsBySale.get(p.sale_id) ?? [];
  list.push(p);
  paymentsBySale.set(p.sale_id, list);
}
```

Active and cancelled sales have different `sale_id` values, so their payments land in separate buckets.

### What Cannot Happen

| Scenario | Prevented By |
|---|---|
| Payment from Sale A appearing under Sale B | Different `sale_id` UUIDs |
| Commission from Sale A charged to Sale B | `commissions.sale_id` is immutable |
| Payments leaking across units | Queries always join through `sale_id`, never directly by `unit_id` |
| Cancelled sale data disappearing | No CASCADE DELETE rules; payments persist |
| Mixing payments in compliance reports | Analytics group by `sale_id`, not `unit_id` |

---

## Summary

Sales are **date-driven** (not status-machine-driven), commissions are **trigger-calculated** at the DB level, and unit availability is kept in sync atomically with sale creation/cancellation. Payment isolation across sell-cancel cycles is guaranteed by the `sale_id` foreign key: each sale gets a unique UUID, every payment and commission is permanently tagged with that UUID, and all queries filter through it — never by unit alone.
