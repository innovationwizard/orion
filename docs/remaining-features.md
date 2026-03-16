# Remaining Features & Functionalities

**Source:** Cross-reference of `origin/SSOT/_discovery-meeting-commercial-ops.md` and `origin/SSOT/_SDD-reserve-observer-mvp.md` against current codebase as of 2026-03-13.

---

## A. Go-Live Blockers for `/reservar` (Salesperson Mobile Form)

1. **Create Supabase Auth accounts** for 32 salespeople (via `/admin/asesores` invite flow)
2. **Set active project assignments** (inserts into `salesperson_project_assignments` with `end_date = NULL`)
3. **Distribute login credentials** to sales team
4. **Formally deprecate Excel** — management announcement that new sales go through system only

## B. SDD MVP Features — Not Yet Built

5. **CSV export for accounting reconciliation** — SDD §2.3: `GET /api/admin/reservations/export` (Pati needs this for bank deposit matching)
6. **Reservation history search/filter page** — SDD §2.5.3-E: searchable/filterable table with status, salesperson, project, date range filters (the admin view shows pending queue but no comprehensive history search)
7. **Supabase Realtime subscriptions** on `/disponibilidad` — SDD §2.5.2: availability board should auto-update within ~1 second without refresh (currently requires manual refresh)

## C. Legal Documents Pati Generates Per Sale (Discovery §10)

8. **Carta de Pago** — payment schedule letter (currently Excel template filled manually)
9. ~~**Carta de Buró / Carta de Autorización**~~ — ✅ DONE (changelog 062). PDF generation from `/admin/reservas/carta-autorizacion/[id]`, multi-buyer support, Boulevard 5 only.
10. **Carta de Reserva** — reservation confirmation letter

## D. Estado de Cuenta (Discovery §11)

11. **Account statement generation** — Pati currently cross-references Odoo payment history + cotización in a separate Excel template, validates apartment details, converts to PDF. High-effort manual process per request.

## E. Sales Pipeline Integration (SDD Phase 4)

12. **Auto-create `sales` record** on reservation confirmation — triggers existing commission calculation pipeline in analytics DB. Currently Pati enters sales manually in both systems.
13. **DSI ingestion from Pipedrive** — parse client demographic uploads, extract into DB (replaces manual Buyer Persona tab entry)
14. **Enganche payment plan management** — track monthly installments, flag overdue. Pati manages 350+ clients' payment schedules in a separate Excel ("control de pagos"). This is the single largest remaining manual workload.
15. **Bank credit application status tracking** — per-client FHA/bank pre-qualification status
16. **Desistimiento workflow with formal documentation** — require letter/email evidence before processing; approval chain

## F. Collections & Accounting (SDD Phase 5)

17. **Odoo integration** — webhook/API for payment receipt events
18. **Auto-match incoming payments** to clients — currently Pati receives unidentified bank deposits from accounting ("pendientes de identificar") and manually matches them
19. **Overdue payment alerting** — "3 cuotas vencidas, al ojo humano" (Pati's words). Analytics app has `delinquent_accounts` view but it's not surfaced in admin dashboard
20. **NeoLink payment identification** — NeoLink vouchers show zero client data; AVE has the backend data. Requires integration or report sharing.

## G. Project-Specific Features (SDD §1.5 + Phase 6)

21. **Benestare tower transfer workflow** — formalize "traslado" process (cancel original sale + create new one, preserving payment history). Currently tracked with "/ Traslado" suffix in seller names.
22. **Benestare Tower E bulk unfreezing** — single admin action to release 42 units from FROZEN → AVAILABLE when Tower E goes on sale
23. **Parking spot assignment management** — prevent double-assignment of same parking number across units (Benestare assigns by number)
24. **Santa Elena onboarding** — 12 houses, simple structure. Low priority.
25. **Per-project pricing rules engine** — replace Boulevard 5's manual typed adjustments (Antonio's "dolor de cabeza": 9+ ad-hoc adjustment columns)

## H. Analytics & Reporting

26. **Competitive analysis module** — Antonio maintains zone-by-zone competitor spreadsheets manually. Structured data would enable trend analysis.
27. **Commission automation** — currently manual Pipedrive export + hand-calculated columns. Analytics app has the trigger infrastructure but intake-to-commission pipeline isn't connected.
28. **Pati's PCV status tracking** — she maintains a personal Excel tracking each promesa's status: in-progress → sent for legal signature → legalized → sent for client signature → archived. This workflow has no system equivalent.

## I. Operational Gaps

29. **Audit log page in admin** — SDD §2.3: `GET /api/admin/audit-log?unit=` exists as concept but no dedicated UI (history is only visible per-unit in detail view)
30. **Role-based access per project** — currently all admin users see all projects
31. **DPI OCR for auto-filling client demographics** — the DPI photo capture exists but only extracts CUI/name/birth date. Profession, marital status, and domicilio require manual entry (which is correct — DPI doesn't contain these fields)

---

## Priority Ranking by Impact on Pati's Daily Workload

| Priority | Item | Why |
|----------|------|-----|
| **P0** | #1–4 (salesperson auth go-live + Excel deprecation) | Blocks all field usage |
| **P1** | #14 (enganche payment tracking) | Largest remaining manual workload (350+ clients monthly) |
| **P1** | #12 (auto-create sales record) | Eliminates dual-entry between systems |
| **P1** | #5 (CSV export) | Pati needs this for bank reconciliation |
| **P2** | #8, #10 (remaining legal documents: Carta de Pago, Carta de Reserva) | High-frequency manual work per sale (#9 Carta de Autorización ✅ done) |
| **P2** | #11 (estado de cuenta) | Ad-hoc but time-consuming per request |
| **P2** | #28 (PCV status tracking) | Daily workflow with no system support |
| **P3** | #18 (payment matching) | Depends on Odoo integration |
| **P3** | #25 (pricing rules) | Reduces Antonio's manual work |

---

## What IS Built (for reference)

### SSOT Domains (all 10 complete)
- Disponibilidad/Precios → `/disponibilidad`
- Reservas → `/reservar`, `/admin/reservas`
- Desistimientos → `/desistimientos`
- Control de Pagos → Dashboard (analytics)
- Cotizador → `/cotizador` (public, client-side PMT calculator)
- Integración → `/integracion` (pipeline summary by tower)
- Ritmo de Ventas → `/ventas` (monthly charts + velocity KPIs)
- Referidos → `/referidos` (CRUD, `rv_referrals` table)
- Valorización → `/valorizacion` (CRUD + chart, `rv_price_history` table)
- Buyer Persona → `/buyer-persona` (aggregate dashboard, `rv_client_profiles` table)

### Key Delivered Features
- Salesperson mobile form with OCR receipt extraction
- Admin reservation review queue (confirm/reject/desist)
- Availability grid (4 projects, tower support)
- PCV document generation with multi-buyer M:N support (migration 030)
- Freeze request workflow
- Inline profile editor for PCV-critical fields
- Cesión de derechos dashboard → `/cesion`
- Salesperson management → `/admin/asesores`
- DPI photo capture and OCR
- Carta de Autorización PDF generation (Boulevard 5, multi-buyer)
