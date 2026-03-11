# 041 — Tooltip and click handlers no longer depend only on unitId

- **Hash:** `468d220`
- **Date:** 2026-02-20
- **Author:** Jorge Luis Contreras Herrera

## Description

Fixed tooltip and click handler logic in payment treemap to handle cases where unitId alone is not unique.

## Files changed

| File | Changes |
|------|---------|
| src/components/payment-treemap.tsx | +3 −3 |
