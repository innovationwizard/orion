# 063 — Carta de Pago PDF Generation

**Date:** 2026-03-16
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production

---

## Context

Per Discovery §10, the **Carta de Pago** is a welcome/payment-schedule letter handed to buyers upon reservation confirmation. It informs the client of their monthly enganche payment amount, the bank accounts to deposit into, and the payment window (15th–20th of each month). Previously Pati manually filled the Word template (`CARTA DE PAGO B5 1.docx`) with each client's name, unit number, and calculated cuota amount.

## What Changed

### New Files
- `src/app/api/reservas/admin/carta-pago/[id]/route.ts` — GET endpoint returning reservation, clients (names), and unit (number + price_list)
- `src/app/admin/reservas/carta-pago/[id]/page.tsx` — Server page component
- `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` — Client component: HTML template + PDF download

### Modified Files
- `src/app/admin/reservas/reservation-detail.tsx` — Added "Carta de Pago" button in the Documentos section (Boulevard 5 only, CONFIRMED/PENDING_REVIEW)

## Implementation Details

- **Template source:** `CARTA DE PAGO B5 1.docx` at project root (reference only — not used at runtime)
- **Dynamic fields (5):** Date (current, Spanish "DD de MMMM del YYYY"), unit number, cuota de enganche (computed via `computeEnganche` from cotizador), client names (joined with " y "), signature lines (one per client)
- **Cuota computation:** Uses `COTIZADOR_DEFAULTS` (10% enganche, Q1,500 reserva, 7-month installments) applied to `price_list`
- **Multi-buyer support:** All reservation clients appear in the "Firma de Enterado" line and get individual signature lines
- **PDF generation:** html2canvas + jsPDF — direct download (no Storage upload), same pattern as Carta de Autorización
- **Font:** Calibri 11pt (matching the Word template)
- **Page size:** Letter (8.5 × 11 in) with 1in/1.18in margins

## Scope

- Boulevard 5 only (template references B5-specific bank accounts and address)
- Auth: `master` or `torredecontrol` roles required

## Remaining Legal Documents (Discovery §10)

- **Carta de Reserva** — reservation confirmation letter (#10 in remaining-features.md)
