# Desistimiento (Cancellations) - Complete Guide

## What Are Desistimientos?

**Desistimiento** = Customer cancellation/withdrawal from a purchase agreement.

These are sales that:
- ✅ Started with a reservation
- ✅ Customer made partial payments (usually 10-60% of down payment)
- ❌ Never completed
- ❌ Customer withdrew from the agreement
- 🔄 Unit returned to inventory as "Disponible" (Available)

## Location in Excel

| Project | Start Row | End Row |
|---------|-----------|---------|
| SANTA ELISA | 85 | 100 |
| BOULEVARD 5 | 320 | 330 |
| BENESTARE | 186 | 200 |
| BL-TAPIAS | 135 | 140 |

**Indicator:** After all active sales, usually labeled "Desistimiento" or "Desestimientos"

---

## The Math

### Example: Unit 302 - SANTA ELISA

```
Cliente: Elizabeth Ramírez Rodríguez
Fecha reserva: 2022-10-12
Precio de venta: Q698,000
Enganche pactado: Q166,000 (23.8% down payment)

Payment history:
  2022-10: Q40,000
  2022-11: Q6,000
  2022-12: Q6,000
  2023-01: Q6,000
  2023-02: Q6,000
  2023-03: Q6,000
  2023-04: Q6,000
  2023-06: Q6,000
  2023-07: Q6,000
  2023-12: Q6,000
  2024-04: Q3,000

TOTAL PAID: Q97,000 (58.4% of enganche commitment)
UNFULFILLED: Q69,000 (41.6% still owed)

Customer cancelled → Unit 302 back to inventory
```

---

## Summary by Project

| Project | Desist. | Total Price | Enganche | Actually Paid | Avg % Paid |
|---------|---------|-------------|----------|---------------|------------|
| **SANTA ELISA** | 16 | Q11.6M | Q987K | Q461K | 36.7% |
| **BOULEVARD 5** | 11 | Q10.8M | Q1.08M | Q676K | 63.2% |
| **BENESTARE** | 15 | Q7.3M | Q501K | Q88K | 17.1% |
| **BL-TAPIAS** | 4 | Q2.7M | Q188K | Q16K | 8.3% |
| **TOTAL** | **46** | **Q32.4M** | **Q2.75M** | **Q1.24M** | **36.0%** |

**Key insight:** Customers paid Q1.24M before cancelling = **revenue loss** to company.

---

## Financial Impact

### Revenue Recognition

**Traditional accounting view:**
1. Customer makes payments → Revenue recognized
2. Customer cancels → Revenue must be reversed (or kept as cancellation penalty)
3. Commissions already paid on those payments → Potentially need clawback

**Real estate industry practice:**
- Most contracts have **non-refundable deposits/penalties**
- Typical: 10-30% of paid amount is kept by developer
- Rest refunded to customer over time

### Commission Impact

**Critical question:** Should commissions be paid on desistimiento payments?

**Option A - Pay commissions normally:**
```
Payment: Q40,000
Commission Phase 1 (30%): Q40,000 × 5% × 30% = Q600
Commission Phase 2 (30%): Q6,000 × 5% × 30% = Q90
...
Total commissions paid: Q4,850

Later: Customer cancels
Result: Company paid Q4,850 in commissions but sale didn't complete
```

**Option B - Reverse commissions on cancellation:**
```
Payment: Q40,000 → Commission Q600 paid
...
Customer cancels → Claw back Q4,850 from sales reps
```

**Option C - Don't pay commissions until deed signed:**
```
All payments accumulate
Commissions calculated but marked "pending"
Only pay when deed is signed
If customer cancels → no commissions paid
```

---

## ETL Decision: Import or Exclude?

### Option 1: Exclude Desistimientos (RECOMMENDED)

**Rationale:**
- These are not active sales
- Units are back in inventory
- Creates confusion in reporting (inflates sales numbers)
- Commission calculation becomes complex (need reversal logic)

**Implementation:**
```typescript
// In ETL, skip rows after the desistimiento marker
const DESIST_START_ROWS = {
  'SANTA ELISA': 85,
  'BOULEVARD 5': 320,
  'BENESTARE ': 186,
  'BL-TAPIAS': 135,
};

// In extractSales function:
if (rowIdx >= DESIST_START_ROWS[sheetName]) {
  break; // Stop processing, we've hit desistimientos
}
```

**Database state:**
- Active sales only
- Clean commission calculation
- Accurate inventory count

### Option 2: Import with "cancelled" Status

**Rationale:**
- Preserve historical record
- Track revenue loss
- Analyze cancellation patterns
- Report on customer behavior

**Implementation:**
```typescript
// Add a flag to identify desistimientos
const isDesistimiento = rowIdx >= DESIST_START_ROWS[sheetName];

sales.push({
  // ... other fields
  status: isDesistimiento ? 'cancelled' : status,
  cancelled_date: isDesistimiento ? lastPaymentDate : null,
  total_paid_before_cancellation: totalPaid,
});
```

**Database changes needed:**
```sql
-- Add to sales table
ALTER TABLE sales ADD COLUMN cancelled_date DATE;
ALTER TABLE sales ADD COLUMN total_paid_before_cancellation NUMERIC;

-- Update sale_status enum
ALTER TYPE sale_status ADD VALUE 'cancelled';

-- Commission logic update
-- Don't calculate commissions for cancelled sales
-- OR calculate but mark as "reversed"
```

---

## Recommended Approach

### Phase 1: Exclude Desistimientos (Current Implementation)

**Why:**
- Simplest to implement
- Clean data model
- No complex reversal logic needed
- Accurate active sales reporting

**ETL Change:**
```typescript
function extractSales(data: any[][], sheetName: string, projectName: string): ExtractedSale[] {
  // ... existing code ...
  
  // Define where desistimientos start
  const DESIST_BOUNDARIES: Record<string, number> = {
    'SANTA ELISA': 85,
    'BOULEVARD 5': 320,
    'BENESTARE ': 186,
    'BL-TAPIAS': 135,
  };
  
  const maxRow = DESIST_BOUNDARIES[sheetName] || 999999;
  
  for (let rowIdx = headerRowIndex + 1; rowIdx < Math.min(data.length, maxRow); rowIdx++) {
    // ... process sales ...
  }
  
  console.log(`   ⏭️  Stopped at row ${maxRow} (desistimientos excluded)`);
}
```

### Phase 2: Add Desistimiento Tracking (Future Enhancement)

**If you need to track cancellations:**

1. Create separate `cancelled_sales` table
2. Import desistimientos there
3. Link to original unit (to show it's available again)
4. Track refunds/penalties separately
5. Generate cancellation reports

**Schema:**
```sql
CREATE TABLE cancelled_sales (
  id UUID PRIMARY KEY DEFAULT uuid_v7(),
  project_id UUID NOT NULL REFERENCES projects(id),
  unit_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  sales_rep_id TEXT,
  
  -- Original sale info
  reservation_date DATE,
  cancellation_date DATE NOT NULL,
  
  -- Financial info
  agreed_price NUMERIC NOT NULL,
  agreed_down_payment NUMERIC NOT NULL,
  total_paid_before_cancellation NUMERIC NOT NULL,
  refund_amount NUMERIC,
  penalty_kept NUMERIC,
  
  -- Metadata
  cancellation_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  row_version INTEGER DEFAULT 1
);

-- Commissions for cancelled sales (if any)
-- Could be stored with status='reversed' in main commissions table
```

---

## Current ETL Behavior (As-Is)

**Current implementation:** ETL processes **entire sheets**, including desistimientos.

**Problems this causes:**

1. **Duplicate units:**
   ```
   Unit 302: Active sale (Elizabeth) + Desistimiento (Elizabeth)
   → Duplicate key error OR wrong sale shown as active
   ```

2. **Inflated numbers:**
   ```
   Report: "558 sales"
   Reality: 512 active + 46 cancelled = 558 total
   → Misleading metrics
   ```

3. **Commission confusion:**
   ```
   Commissions calculated on payments that customer later refunded
   → Overstated commission liability
   ```

---

## Action Items

### Immediate (Required)

✅ **Modify ETL to stop before desistimientos**
```bash
# Add row boundaries to extractSales()
# Test with: npx tsx etl-reservas.ts
```

**Expected result:**
```
Before: 558 sales extracted
After: 512 sales extracted (46 desistimientos excluded)
```

### Short-term (Optional)

⚠️ **Manual review of desistimientos**
- Verify units are marked "Disponible" in inventory
- Check if any desistimiento units were re-sold
- Reconcile refund amounts with accounting

### Long-term (Future)

💡 **Add cancellation tracking**
- Separate ETL for cancelled_sales table
- Dashboard showing cancellation rates
- Analysis: Why do customers cancel?
- Refund policy enforcement

---

## Verification Queries

### Check for desistimiento contamination

```sql
-- If a unit appears multiple times, might be mixing active + desistimiento
SELECT 
  p.name,
  u.unit_number,
  COUNT(*) as sale_count,
  STRING_AGG(c.full_name, ', ') as clients
FROM units u
JOIN sales s ON u.id = s.unit_id
JOIN projects p ON u.project_id = p.id
JOIN clients c ON s.client_id = c.id
GROUP BY p.name, u.unit_number
HAVING COUNT(*) > 1;
```

### Check for suspicious payment patterns

```sql
-- Sales with very low payment amounts (might be desistimientos)
SELECT 
  p.name,
  u.unit_number,
  c.full_name,
  s.price_with_tax,
  s.down_payment_amount,
  SUM(pm.amount) as total_paid,
  COUNT(pm.id) as payment_count,
  ROUND(SUM(pm.amount) / s.down_payment_amount * 100, 1) as pct_down_payment
FROM sales s
JOIN projects p ON s.project_id = p.id
JOIN units u ON s.unit_id = u.id
JOIN clients c ON s.client_id = c.id
LEFT JOIN payments pm ON s.id = pm.sale_id
GROUP BY p.name, u.unit_number, c.full_name, s.price_with_tax, s.down_payment_amount
HAVING SUM(pm.amount) < s.down_payment_amount * 0.8  -- Less than 80% of down payment
ORDER BY pct_down_payment;
```

---

## Summary

**Desistimientos = Cancelled sales with partial payments made**

**Key numbers:**
- 46 cancellations across 4 projects
- Q1.24M paid before cancellation (36% of enganche commitment)
- Q32.4M in sales value returned to inventory

**ETL recommendation:**
- **Exclude** desistimientos from main import
- Stop processing at row boundaries
- Consider separate tracking table for analytics

**Next steps:**
1. Update ETL with row boundaries ✅
2. Re-run import (should drop from 558 → 512 sales) ✅
3. Verify no duplicates ✅
4. Decide on commission policy for any partial payments ⏳
