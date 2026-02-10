# Desistimiento Handling - Implementation Summary

## Change Made

**ETL now excludes desistimientos (cancelled sales) from import.**

## Row Boundaries Added

```typescript
const DESISTIMIENTO_BOUNDARIES: Record<string, number> = {
  'SANTA ELISA': 81,      // Stop at row 81 (0-indexed: 80)
  'BOULEVARD 5': 306,     // Stop at row 306 (0-indexed: 305)
  'BENESTARE ': 176,      // Stop at row 176 (0-indexed: 175)
  'BL-TAPIAS': 126,       // Stop at row 126 (0-indexed: 125)
};
```

## Expected Impact

### Before (with desistimientos):
```
SANTA ELISA: 90 sales (74 active + 16 cancelled)
BOULEVARD 5: 293 sales (282 active + 11 cancelled)
BENESTARE: 162 sales (147 active + 15 cancelled)
BL-TAPIAS: 57 sales (53 active + 4 cancelled)
TOTAL: 602 sales
```

### After (active only):
```
SANTA ELISA: 74 sales
BOULEVARD 5: 282 sales
BENESTARE: 147 sales
BL-TAPIAS: 53 sales
TOTAL: 556 sales (-46 cancelled sales excluded)
```

## Verification

Run ETL and check output:

```bash
npx tsx etl-reservas.ts
```

**Expected log output:**
```
📊 Processing: SANTA ELISA → santa_elisa
   Found 73 columns, header at row 5
   ⏭️  Stopped at row 81 (desistimientos boundary - excluded)
   ✅ Extracted 74 sales with 450 payments

📊 Processing: BOULEVARD 5 → boulevard_5
   Found 85 columns, header at row 7
   ⏭️  Stopped at row 306 (desistimientos boundary - excluded)
   ✅ Extracted 282 sales with 3200 payments

...etc
```

## Why Exclude Desistimientos?

1. **Not active sales** - Customer cancelled, unit back to inventory
2. **Duplicate prevention** - Same unit may have both active and cancelled sale
3. **Clean commission calc** - No reversal logic needed
4. **Accurate reporting** - Sales numbers reflect actual active contracts

## Revenue Impact

**Cancelled sales had:**
- Q1.24M paid before cancellation (partial payments)
- These payments were already recorded as revenue
- Units returned to inventory for resale

**Accounting note:**
- If desistimiento tracking needed, create separate `cancelled_sales` table
- See DESISTIMIENTO_GUIDE.md for schema design

## Testing

After running ETL:

```sql
-- Should now return 556 total sales (not 602)
SELECT COUNT(*) FROM sales;

-- Should show no duplicate units (each unit appears once)
SELECT unit_number, COUNT(*) 
FROM units 
GROUP BY unit_number 
HAVING COUNT(*) > 1;

-- Verify sales by project match expectations
SELECT 
  p.name,
  COUNT(s.id) as sales
FROM sales s
JOIN projects p ON s.project_id = p.id
GROUP BY p.name;

-- Expected:
-- santa_elisa: 74
-- boulevard_5: 282
-- benestare: 147
-- bl_tapias: 53
```

## Files Updated

- ✅ etl-reservas.ts - Added DESISTIMIENTO_BOUNDARIES and row check
- ✅ DESISTIMIENTO_GUIDE.md - Complete documentation
- ✅ DESISTIMIENTO_SUMMARY.md - This file
