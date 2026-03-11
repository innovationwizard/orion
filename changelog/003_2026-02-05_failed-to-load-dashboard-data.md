# 003 — Failed to load dashboard data

- **Hash:** `8a5c535`
- **Date:** 2026-02-05
- **Author:** Jorge Luis Contreras Herrera

## Description

Debugging and fixing dashboard data loading. Added error handling to API routes, improved Supabase client setup.

## Files changed

| File | Changes |
|------|---------|
| src/app/api/commission-phases/route.ts | +7 −1 |
| src/app/api/commission-rates/route.ts | +7 −1 |
| src/app/api/commissions/route.ts | +7 −1 |
| src/app/api/payments/route.ts | +12 −1 |
| src/app/api/sales/route.ts | +12 −1 |
| src/app/dashboard-client.tsx | +16 −4 |
| src/app/layout.tsx | +2 −1 |
| src/lib/api.ts | +3 −1 |
| src/lib/supabase.ts | +22 |
