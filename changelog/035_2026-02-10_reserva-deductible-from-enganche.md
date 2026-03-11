# 035 — Reserva is deductible from Enganche

- **Hash:** `0eaafda`
- **Date:** 2026-02-10
- **Author:** Jorge Luis Contreras Herrera

## Description

Business rule: reservation amount is now deducted from down payment (enganche) calculations in the payment analytics and treemap.

## Files changed

| File | Changes |
|------|---------|
| src/app/api/analytics/payments/route.ts | +12 −2 |
| src/app/globals.css | +10 |
| src/components/payment-detail-modal.tsx | +10 −1 |
| src/components/payment-treemap.tsx | +7 −1 |
