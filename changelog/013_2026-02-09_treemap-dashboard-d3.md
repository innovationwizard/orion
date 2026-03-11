# 013 — Shiny new better treemap dashboard with D3.js

- **Hash:** `54a8eaf`
- **Date:** 2026-02-09
- **Author:** Jorge Luis Contreras Herrera

## Description

Major dashboard overhaul. Added D3.js treemap visualizations for payments and commissions. Created analytics API routes and modal detail views.

## Files changed

| File | Changes |
|------|---------|
| package-lock.json | +473 |
| package.json | +2 |
| src/app/api/analytics/commissions/route.ts | +154 |
| src/app/api/analytics/payments/route.ts | +217 |
| src/app/dashboard-client.tsx | +704 −649 |
| src/app/globals.css | +221 |
| src/app/page.tsx | +49 −1 |
| src/components/commission-treemap.tsx | +213 |
| src/components/payment-detail-modal.tsx | +124 |
| src/components/payment-treemap.tsx | +240 |
