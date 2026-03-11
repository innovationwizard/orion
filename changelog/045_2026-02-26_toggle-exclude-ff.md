# 045 — Toggle button to exclude F&F

- **Hash:** `e708a64`
- **Date:** 2026-02-26
- **Author:** Jorge Luis Contreras Herrera

## Description

Added toggle button to exclude Friends & Family (F&F) sales from analytics. Created dedicated filter utility. Updated cash flow forecast, commissions, and payment compliance API routes.

## Files changed

| File | Changes |
|------|---------|
| src/app/api/analytics/cash-flow-forecast/route.ts | +115 −22 |
| src/app/api/analytics/commissions/route.ts | +25 −1 |
| src/app/api/analytics/payment-compliance/route.ts | +16 −1 |
| src/app/dashboard-client.tsx | +15 −1 |
| src/components/filters.tsx | +16 −1 |
| src/lib/ff-filter.ts | +38 |
