# 062 — Carta de Autorización PDF Generation

**Date:** 2026-03-16
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production

---

## Context

Per Discovery §10, Pati generates several legal documents per sale — all currently done by filling Word templates manually. The **Carta de Autorización de Información** is a credit bureau authorization letter required by Inmobiliaria El Gran Jaguar, S.A. for financing applications. It authorizes the company to obtain financial studies on behalf of the buyer per Article 64 of the Ley de Acceso a la Información Pública (Guatemala).

Previously: Pati manually typed client name and DPI into a Word template for each buyer. For multi-buyer reservations, she created one letter per person.

## What Changed

### New Files
- `src/app/api/reservas/admin/carta-autorizacion/[id]/route.ts` — GET endpoint returning all clients (name + DPI) for a reservation
- `src/app/admin/reservas/carta-autorizacion/[id]/page.tsx` — Server page component
- `src/app/admin/reservas/carta-autorizacion/[id]/carta-client.tsx` — Client component: HTML template + PDF download

### Modified Files
- `src/app/admin/reservas/reservation-detail.tsx` — Added "Carta de Autorización" button in the Documentos section (Boulevard 5 only, same visibility conditions as PCV)

## Implementation Details

- **Template source:** `Carta Autorización Información Boulevard 5 1.docx` at project root (reference only — not used at runtime)
- **Dynamic fields (3):** Date (current, Spanish format), client full name, DPI (4-5-4 grouping)
- **Multi-buyer support:** One letter per client on separate pages in a single PDF
- **PDF generation:** html2canvas + jsPDF (same pattern as PCV) — downloads directly to user's device
- **Font:** Calibri 11pt (matching the Word template default)
- **Page size:** Letter (8.5 × 11 in) with 1in/1.18in margins
- **Missing DPI warning:** Yellow banner shown if any client lacks DPI data, with instructions to edit from the reservation detail

## Scope

- Boulevard 5 only (template is project-specific — addressed to Inmobiliaria El Gran Jaguar, S.A.)
- Auth: `master` or `torredecontrol` roles required

## Remaining Legal Documents (Discovery §10)

- **Carta de Pago** — payment schedule letter (#8 in remaining-features.md)
- **Carta de Reserva** — reservation confirmation letter (#10 in remaining-features.md)
