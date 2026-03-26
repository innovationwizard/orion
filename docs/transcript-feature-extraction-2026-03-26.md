# Feature Extraction: Transcripts 2026-03-23 (Antonio) & 2026-03-24 (Ventas)

**Date:** 2026-03-26
**Sources:** `20260323antonio.txt` (Jorge × Antonio, 1:1), `20260324ventas.txt` (sales team meeting)
**Method:** Exhaustive extraction of every feature, improvement, or enhancement explicitly mentioned, hinted at, or implied — regardless of feasibility or data availability.

---

## Legend

- **[E]** = Explicitly requested
- **[H]** = Hinted at / implied from context
- **[EXISTS]** = Already built in Orion (cross-referenced from `remaining-features.md` / MEMORY)
- Transcript references: `A:line` = antonio.txt, `V:line` = ventas.txt

---

## 1. Pipedrive / CRM Integration

### 1.1 Direct Pipedrive Data Pull [E]
Eliminate the export-to-Excel workflow. Antonio exports from the "General" board in Pipedrive, then manually works the data in Excel. Jorge identified that the board IDs and column IDs can be used to pull data directly into Orion via the Pipedrive API.
> A:193–210 — "yo saco los ids primero del tablero que se llama general... y después de las columnas... así ya lo puedo jalar directo de pipedrive a la app"

### 1.2 Automated Commission Calculation from Pipedrive Data [E]
Currently Antonio downloads reservation data, manually marks green (signed) / red (desisted), and hand-calculates: price without taxes, total commission, 30% first commission, per-salesperson percentage. The escalation rule (first 4 sales at 1%, 5th at 1.25%) is applied manually by filtering by salesperson and counting chronologically.
> A:114–155 — "yo descargo la base de datos de las reservas desde Pairweb... yo aquí marco en color verde lo que sí se firmó y en color rojo lo que desistieron"

**[EXISTS]** — Commission system is built (migrations 033–038), but intake is not connected to Pipedrive. The Pipedrive → Orion pipeline is the missing link.

### 1.3 Data Quality Validation Layer [H]
Salespeople manually enter price, down payment, and reservation amounts in Pipedrive. Antonio rates reliability at ~0%. The system should validate or override salesperson-entered data with authoritative sources.
> A:211–238 — "confiable tampoco al 100... el asesor es el que teclea el precio de venta... está como el 0% confiable"

### 1.4 Sales Pipeline Stage Visualization [H]
Pipedrive stages referenced throughout the ventas meeting: lead → cita agendada → cita confirmada → visitó → decisión → reserva. The sales team needs to see pipeline progression within Orion.
> V:971–978 — "sigue en la etapa de cita agendada... sigue en la misma etapa, no tiene info"

---

## 2. Document Management

### 2.1 Five-Document Checklist per Reservation [E]
Five documents required before Patty can process promesa: DPI, RTU, Recibo de Servicios, Cotización Firmada, Carta de Reserva. Plus DSI data.
> A:340–368 — "DPI, RTU, recibo de servicios, la cotización firmada, carta de reserva, y el DSI"

**[EXISTS partially]** — DPI capture exists. Cotización comes from system. RTU, Recibo de Servicios, and Carta de Reserva have no upload/tracking mechanism.

### 2.2 Document Upload Tracking Dashboard [H]
Antonio found a deal 12+ days old with zero documents uploaded. Need visibility into document completeness per reservation with age-based urgency.
> A:262–268 — "la reserva fue desde 12 de marzo y todavía no hay nada subido"

### 2.3 Document Upload Deadline Enforcement [H]
Implied by the discovery that salespeople neglect uploads indefinitely. Automated alerts or escalation when documents are overdue.
> A:262–278

### 2.4 Document Quality Validation [H]
Antonio showed a scan that was unreadable — "el escáner más feo, ni digamos el DPI... ninguna inteligencia artificial del mundo que pueda leer." Implies need for upload quality checks.
> A:291–298

### 2.5 Automated RTU Lookup [H]
RTU is a public registry. Antonio noted that salespeople always deliver it in clean digital format (downloaded from SAT). Could potentially be auto-fetched by NIT.
> A:392–405 — "el RTU supongo que como es una fuente de consulta pública también puede salir por default"

### 2.6 DSI Replacement: Structured Buyer Profile Form [E]
The DSI (Declaración Socioeconómica del Inmueble) is currently a manually filled Excel. Contains: marital status, children count, children ages, intended property use. Replace with a structured form inside the app using dropdowns/closed options to eliminate free-text inconsistency.
> A:409–458 — "podría ser como lleno de datos dentro del mismo sistema... con opciones cerradas para que no haya tanto error"

**[EXISTS partially]** — `rv_client_profiles` table has `occupation_type`, `household_members`, `intended_use`. Marital status, children details, and specific DSI fields may still be missing.

### 2.7 Standardize Free-Text Fields [E]
Salespeople write the same concept differently: "invertir" / "inversión" / "Inversión" / "para vivir" / "viviendas". Dropdowns instead of free text.
> A:447–458 — "unos ponen para invertir, unos ponen inversión... o sea lo mismo pero todos le ponen diferente palabra"

**[EXISTS partially]** — `intended_use` on `rv_client_profiles` exists but may not be enforced as dropdown.

---

## 3. Lead Source Management

### 3.1 Lead Source Cleanup & Standardization [E]
Duplicates and dead sources identified. Approved list: Facebook, Meta (Instagram), Referidos, Visita, PDX, Página Web, Inbox, Expo Casa, Mail, Prospección, Cartera Antigua, Activación, TikTok, LinkedIn. Remove: Perfilan, Lit, standalone "Leads", Marketplace, "señalé que vayas".
> A:460–631

**[EXISTS]** — Migration 046 (lead_sources table), `/admin/lead-sources` management page, marketing role. 16 sources seeded.

### 3.2 Event-Based Dynamic Lead Sources [H]
Antonio mentioned that specific events (e.g., CHN activation, feria de vivienda del Banco Industrial) might require temporary lead sources. The system should allow creating event-specific sources on the fly.
> A:588–603 — "activación puede ser por ejemplo lo de CHN... evento puede ser una feria la vivienda del banco industrial... tal vez abrimos una fuente específica en ese momento"

**[EXISTS]** — Admin can create new lead sources via `/admin/lead-sources`.

---

## 4. Pricing & Financial

### 4.1 Dual Price Tracking: List Price vs Effective (Sale) Price [E]
Units are sometimes sold above list price. The app currently shows only list price. Erwin's example: unit 203 listed at Q1,260,000, sold at Q1,300,000. Both prices must be tracked. Affects commissions.
> V:188–266 — "aparece acá el precio 1.260.000, se vendió con 1.300.000... voy a encargarme de que refleje tanto el precio de lista como el precio efectivo"

### 4.2 Financing Term Configuration Per Bank [E]
Currently shows up to 30 years. Need 40-year terms. Antonio has an Excel with bank-specific acceptable terms. Need a configuration page per bank.
> V:392–409 — "una página donde configuras lo que te permita hacer el banco y si eso cambia, tenemos dónde cambiarlo"

### 4.3 Enforce Financing in Multiples of Q100 [H]
Mentioned as a known business rule that the cotizador must respect. Enganche adjustments involved.
> V:330–336 — "sólo se puede financiar en múltiplos de 100 que hay que cuadrar lo llevamos con el enganche"

### 4.4 Valorización Management [E]
Price appreciation events per project/unit. Currently done "al dedo" (by hand). Each apartment can get a different increase. Complex enough to need a dedicated session to document the process.
> A:741–766 — "esto sí sirve bastante... esto es al dedo, un día vamos a valorizar y pam valorizan"

**[EXISTS]** — `/valorizacion` page with `rv_price_history` table.

### 4.5 Per-Project Pricing Rules Engine [H]
Implied by the complexity of valorization and Antonio's manual adjustments. Boulevard 5 has 9+ ad-hoc adjustment columns.

**[EXISTS in backlog]** — Listed as #25 in remaining-features.md.

### 4.6 Variable Reserva Amount Per Deal [E]
The default reserva of Q1,500 is not universal. A specific deal in Pipedrive shows a reserva of Q3,000. This means the reserva amount is negotiated per deal and must be stored per reservation, not hardcoded.
> A:299–306 — "esta vez 668 que es el precio que puso aquí... y una reserva de 3000 que está aquí"

### 4.7 Variable Enganche Percentage Per Deal [E]
The default enganche of 10% is not universal. The same deal shows enganche Q46,800 on price Q668,000 = ~7.0%. Enganche percentage is negotiated per deal.
> A:302–304 — "luego nos sirve el enganche que es este 46800"
> Calculation: Q46,800 / Q668,000 = 7.0%, not 10%

---

## 5. Salesperson Management & CRM Discipline

### 5.1 Client Profile Completeness Indicator [H]
Antonio repeatedly found empty profiles for "possible close" deals. The app should show a visual completeness score and block certain actions (like marking "possible close") until minimum data is entered.
> V:916–968 — "cómo le vas a entrar a este cliente si no sabes nada... no sabes cuánto gana, no sabes dónde trabaja"

### 5.2 Mandatory Fields Before Stage Advancement [H]
Pipeline stage changes should require minimum data completeness. E.g., cannot move to "visitó" without client phone, income, property interest. Cannot mark "possible close" without employer, income, visit outcome.
> V:1070–1078 — "miro esto y de verdad que no te compro que sea posible cierre vos. Ni siquiera tenés una acción futura para hacer con él"

### 5.3 Salesperson Performance Dashboard [E]
Weekly metrics per salesperson: visits scheduled vs effective, conversion rates, pipeline value, close rate. Antonio showed he tracks these manually and calls out individual performance.
> V:715–737 — "Daniel, tenías catorce y solo te llegaron tres... Rory, tenías trece y llegaron cinco y fue una reserva"

### 5.4 Visit Management: Scheduled vs Effective [E]
Distinction between scheduled visits and visits that actually happened. Auto-counting of effective visits based on logged activity. Currently salespeople forget to log "visitó" actions.
> V:1082 — "ni siquiera tenés la cita efectiva, entonces no te lo va a contabilizar dentro de tus citas efectivas"

### 5.5 No-Show Tracking & Analysis [H]
Clients frequently don't show up to visits. Antonio tracks this manually. The system should report no-show rates per source, per salesperson, per time period.
> V:620–658 — "de la semana pasada, Daniel, tenías catorce y solo te llegaron tres"

### 5.6 Cartera (Portfolio) Management Dashboard [E]
Each salesperson should manage 70–100 active deals. Some have 400–800. Need portfolio size monitoring with alerts and cleanup workflows.
> V:600–610 — "es importante por lo menos tener una cartera manejable entre 70 y 100 tratos, porque arriba de eso ya va a ser imposible"

### 5.7 Lead Qualification / Depuration Workflow [H]
Antonio personally calls inactive leads from salespeople's portfolios to depurate. The system should provide a structured lead qualification/retirement workflow.
> V:597–618 — "ahí he estado llamando yo a parte de la cartera de Fren, ya salgo de la cartera de Fren y me paso con la cartera de Iván"

### 5.8 Weekly Close Forecast [E]
Track "possible closes" per salesperson per week. Antonio asks each salesperson for their forecast every meeting and is dissatisfied with lack of preparation.
> V:741–753 — "de los posibles cierres de la semana pasada... ¿Qué pasó con toda esa mara?"

### 5.9 Deal Context Requirements for "Possible Close" [H]
When a salesperson flags a deal as "possible close," the system should require: full client name, visit date, client needs, budget, bank pre-qualification status, next action date.
> V:1306–1317 — "cuando uno tiene un posible cierre, hay que saber específicamente quién es, qué busca, cuándo hay que llamarlo"

### 5.10 Activity Logging Enforcement [H]
Salespeople fail to log calls, visits, WhatsApp messages. Multiple instances where the only record is in the salesperson's personal WhatsApp chat, invisible to management.
> V:982–989 — "sí tengo el contexto en el chat con el cliente... En tu teléfono, te lo prometo que no me sirve porque yo no puedo agarrar tu teléfono"

### 5.11 Overdue Activity Alerts [H]
Ronnie had an expired activity from March 18 still floating. The system should surface overdue items prominently and prevent them from silently aging.
> V:878–888 — "le dejaste una actividad y vencí al 18 de marzo... Te va a sumar todo la vida si no la das"

### 5.12 All Deals Must Be Registered (Even Lost Ones) [E]
Antonio is explicit: every contact must be logged, whether it results in a sale or not. Currently salespeople only log deals they think will close.
> V:820–826 — "Si se vende, se ingresa. Si no se vende, también se ingresa. Si sirve, se ingresa y si no sirve, también"

### 5.13 Manager Visibility Without Salesperson Dependency [E]
Antonio/management should be able to see full deal context at any time without calling the salesperson. Current state: empty profiles force Antonio to call salespeople for basic information.
> V:935–948 — "yo quiero saber qué tal está el perfil. Yo te tengo que llamar a vos para preguntarte, porque no tengo información"

---

## 6. Shift & Availability Management

### 6.1 Salesperson Shift/Rotation Scheduling [E]
Schedule who's on turn, who's on break. Currently managed in a separate document shared via WhatsApp.
> A:730–740 — "sería interesante que dentro de la misma aplicación podamos hacer los turnos de los asesores"

### 6.2 Vacation Request & Approval System [E]
Salesperson submits vacation request in-app. Once approved, they automatically disappear from availability. Could integrate with lead routing.
> A:736–740 — "si el asesor puede hacer su solicitud en la misma aplicación... deja de aparecer como disponible para atención"

### 6.3 Holiday Schedule Management [H]
Semana Santa scheduling discussed at length. Currently done manually and shared via WhatsApp screenshot.
> V:417–517 — "aquí están los turnos de Semana Santa"

---

## 7. Unit & Inventory Management

### 7.1 Real-Time Unit Availability Sync [E]
Multiple instances of verifying unit status during the ventas meeting. The app should be the single source of truth for availability, auto-synced.
> V:1–22, V:95–153

**[EXISTS partially]** — `/disponibilidad` page exists. Supabase Realtime not yet connected (remaining-features #7).

### 7.2 Admin Unit Status Change [E]
Torre A 204 needed to be marked as unavailable. Must be doable directly in the app.
> V:26–44 — "ese ya está, entonces ya al jalarlo de acá, la aplicación ya le muestra como vendido"

**[EXISTS]** — Admin can change unit status.

### 7.3 Bulk Availability Audit Tool [H]
One salesperson mentioned auditing "línea por línea" to match the app against the Excel. Implies need for a bulk comparison/reconciliation view.
> V:153 — "estoy revisando línea por línea así lo estoy auditando uno por uno"

---

## 8. Reservation & Sales Process

### 8.1 Multiple Buyers per Reservation (UI) [E]
The database supports M:N buyers but the UI only allows one. Multiple salespeople asked about this limitation.
> V:306–325 — "la base de datos ya está lista para manejar independientemente la cantidad de compradores pero la interfase de entrada solo permite uno"

**[EXISTS partially]** — M:N design docs complete (migration 030, junction table enriched). UI for multi-buyer entry during reservation creation not yet built.

### 8.2 Same-Day Reservation Entry [H]
Salespeople asked if reservations made today can be loaded today. Antonio said wait until end of day.
> V:177–187 — "las reservas que se van efectuando en estos días se tienen que ir cargando ya o esperamos"

**[EXISTS]** — `/reservar` form is available once salesperson auth is live.

### 8.3 Data Source Priority Hierarchy [H]
The system pulls from multiple sources (Antonio, Isaac, Jorge, financiera, contabilidad). When data conflicts, it picks first-found and doesn't re-fetch. Need a defined priority hierarchy.
> V:294–305 — "está jalando datos de la base de datos de antonio, de isaac, de jorge, de financiera, de contabilidad... cuando hay datos distintos si ya llenó un dato ya no lo vuelve a buscar"

### 8.4 Desistimiento Cross-Source Sync [H]
A desistimiento marked in one system but not another causes stale data to surface. Need cross-system status sync.
> V:298–302 — "agarra un dato que tal vez era de un desistimiento que después alguien en otro departamento no marcó como desistido"

### 8.5 VisaLink Credit Card Payment for Reservations [H]
Mentioned as an option offered to clients — pay reservation deposit via credit card through VisaLink.
> V:1022–1026 — "se les dio opción de que puedan cancelar la reserva con tarjeta de crédito a través de Visalink"

---

## 9. Bank & Pre-Qualification

### 9.1 Bank Pre-Qualification Status Tracking [H]
Multiple mentions of pre-calificación results affecting deal progression. "Milton estaba 1% arriba en preca." Need structured tracking per client per bank.
> V:853–854 — "Milton estaba 1% arriba en preca"
> V:1012–1013 — "hicimos una precalificación con la chava"

**[EXISTS in backlog]** — remaining-features #15.

### 9.2 Bank Configuration Management [E]
Page to configure per-bank rules: accepted terms, max years, interest rate ranges, requirements. Based on an Excel Antonio already maintains.
> V:400–409 — "Antonio me pasó un Excel donde tiene separados los términos que cada banco acepta"

### 9.3 CHN-Specific Workflow [H]
CHN (Crédito Hipotecario Nacional) is referenced as having slow response times affecting deal closure. Different banks have different SLAs.
> V:1001–1010 — "el problema fue con CHN que no era una respuesta ese día"

---

## 10. Competitive Analysis

### 10.1 Competitive Analysis Module [E]
Analyze competing projects by sector/zone. Antonio and Otto discussed having it inside the app. Currently maintained as spreadsheets.
> A:32–52 — "los proyectos del sector que compiten con nosotros... sería bueno tenerlo dentro de la misma app"

**[EXISTS in backlog]** — remaining-features #26.

---

## 11. Reporting & Analytics

### 11.1 Cesión de Derechos Report Direct Link [E]
Report exists in the app but Antonio can't find it. Need a clear direct link or integration point.
> A:90–110 — "esto sí sirve... eso ya está en la app solo que no me acuerdo dónde lo puse"

**[EXISTS]** — `/cesion` page.

### 11.2 Conversion Funnel Metrics [H]
Leads → visits → effective visits → reservations. Antonio tracks this manually per salesperson per week.
> V:715–737 — weekly visit-to-close ratios cited for each salesperson

### 11.3 Monthly Closing Report Automation [H]
Antonio's monthly close process (green = signed, red = desisted) could be automated as a report with status filters and automatic commission pre-calculation.
> A:114–155

### 11.4 Salesperson Ranking / Leaderboard [H]
Implied by the competitive pressure Antonio applies during meetings. Metrics: units sold, effective visits, close rate, portfolio health.
> V:1324–1331 — "los tiempos donde se vendían 20, 25 apartamentos mensuales ya se acabaron"

### 11.5 Client Status Report for Management [H]
Antonio wants to look up any client and see full context without calling the salesperson. A management-focused client lookup.
> V:935–948

---

## 12. Notifications & Communication

### 12.1 In-App Notifications [H]
Multiple instances of "I'll tell you via WhatsApp" or "I'll send it to the group." The app should centralize notifications for: new reservations, document reminders, activity overdue, price changes.
> A:604 — "acabo de mandar en foto con colorcito verde"; V:448 — "les voy a dejar enviado en el grupo"

### 12.2 WhatsApp Communication Logging [H]
Salespeople conduct all client interaction via WhatsApp but nothing is captured in any system. If the salesperson leaves, all context is lost.
> V:982–989 — "sí tengo el contexto en el chat con el cliente"

### 12.3 Development Progress Board [H]
Jorge mentioned creating a shareable list of what he's working on, for the team to track in real-time what features are being delivered.
> V:362–366 — "hacer una lista de lo que estoy trabajando para irles compartiendo en tiempo real cuál es lo que va saliendo"

---

## 13. New Projects Onboarding

### 13.1 Easy Project Onboarding [H]
Cobán launching next month, Zona Once mid-year. The system should make it easy to add new projects with their units, towers, pricing, and salespeople assignments.
> A:45–50 — "ya vamos a salir con un test de mercado en Cobán el otro mes... a mediados de año salimos con un proyecto de zona once"

**[PARTIALLY ADDRESSED]** — Santa Elena was successfully onboarded as the 5th project (migration 049, 2026-03-26). The onboarding was done via a single migration script that creates the full project structure: project, tower, floor, 11 units (with all inventory data including new `area_lot` column), salesperson + assignment, clients, reservations, reservation_clients, unit_status_log, freeze_request, cotizador_config, and lead_source. This migration can serve as a template for future project onboarding (Cobán, Zona Once). An admin UI for self-service project onboarding is not yet built.

---

## 14. Patty-Specific Workflows (Control Tower)

### 14.1 Pagos Control [H]
Patty's payment tracking folder. Deferred — need her input on what's there.
> A:704–721

**[EXISTS in backlog]** — remaining-features #14 (enganche payment plan management).

### 14.2 Promesas de Compraventa Processing [H]
Folder contains documents for filling promesas. System should generate/track PCV workflow.
> A:725–728

**[EXISTS]** — PCV generation exists in admin.

---

## 15. Cotizador Fixes

### 15.1 Fix Cotizador Data Source Conflicts [E]
The cotizador is pulling conflicting data from multiple DBs and showing wrong prices because of stale/desisted data not being cleared. Jorge committed to fixing the data priority order.
> V:289–305 — "los cotizadores todavía están malos... no sabe cuál es la verdadera información así que voy a darle el orden específico"

### 15.2 System-Generated Authoritative Pricing [H]
Once cotizador generates quotes from the system, the price becomes authoritative — eliminating salesperson data-entry errors.
> A:379–386 — "la cotización ahora va a salir del mismo sistema... ahí vamos a poder estar seguros del precio"

### 15.3 Per-Project Cotizador Reports [E]
"Cotizadores" (plural) refers to per-project cotización report documents. These are the reports salespeople use with clients — one per project. Antonio confirmed these are urgently needed in the app. This is distinct from the interactive `/cotizador` page.
> A:728–729 — "los reportes cotizadores reporte de cada proyecto... este es el único que debería realmente subir a la reserva si este si ha sido urgente"

### 15.4 Root Cause: Wrong Data Binding [E]
The cotizador is connected ("amarrado") to data, but bound to the wrong sources. It pulls from multiple databases and when a data conflict exists (e.g., a desistimiento not marked in all sources), the stale data persists because the system uses first-found. Jorge committed to defining a data source priority hierarchy.
> V:289–293 — "ya está amarrado sólo que está mal amarrado por eso es que no salen las cotis"
> V:294–305 — "está jalando datos de la base de datos de antonio, de isaac, de jorge, de financiera, de contabilidad... voy a darle el orden específico en que tiene que buscar"

---

## Summary Count

| Category | Count |
|----------|-------|
| Pipedrive / CRM Integration | 4 |
| Document Management | 7 |
| Lead Source Management | 2 |
| Pricing & Financial | 7 |
| Salesperson Management & CRM Discipline | 13 |
| Shift & Availability Management | 3 |
| Unit & Inventory Management | 3 |
| Reservation & Sales Process | 5 |
| Bank & Pre-Qualification | 3 |
| Competitive Analysis | 1 |
| Reporting & Analytics | 5 |
| Notifications & Communication | 3 |
| New Projects Onboarding | 1 |
| Patty-Specific Workflows | 2 |
| Cotizador Fixes | 4 |
| **Total** | **63** |

### Already Exists in Orion (fully or partially)
- Lead source management (3.1, 3.2)
- Commission calculation (1.2 — backend only, no Pipedrive intake)
- Valorización (4.4)
- DPI capture + OCR (2.1 partial)
- DSI/Buyer profile form (2.6 partial)
- Multi-buyer M:N (8.1 — DB + backend, no UI)
- Unit availability (7.1, 7.2)
- Cesión de derechos (11.1)
- PCV generation (14.2)
- Audit trail (exists)
- Competitive analysis (backlog)
- Bank pre-qualification (backlog)
- Payment tracking (backlog)

### Net New (not built, not in backlog)
- Pipedrive API integration (1.1)
- Data quality validation layer (1.3)
- Sales pipeline stage visualization (1.4)
- Document upload tracking dashboard (2.2)
- Document upload deadline enforcement (2.3)
- Document quality validation (2.4)
- Automated RTU lookup (2.5)
- Dual price tracking: list vs effective (4.1)
- Financing term config per bank (4.2)
- Q100 multiples enforcement (4.3)
- Client profile completeness indicator (5.1)
- Mandatory fields before stage advancement (5.2)
- Salesperson performance dashboard (5.3)
- Visit management: scheduled vs effective (5.4)
- No-show tracking (5.5)
- Cartera management dashboard (5.6)
- Lead qualification/depuration workflow (5.7)
- Weekly close forecast (5.8)
- Deal context requirements (5.9)
- Activity logging enforcement (5.10)
- Overdue activity alerts (5.11)
- All deals must be registered (5.12)
- Manager visibility without salesperson dependency (5.13)
- Salesperson shift scheduling (6.1)
- Vacation request/approval (6.2)
- Holiday schedule management (6.3)
- Bulk availability audit tool (7.3)
- Data source priority hierarchy (8.3)
- Desistimiento cross-source sync (8.4)
- VisaLink payment integration (8.5)
- Bank configuration management (9.2)
- CHN-specific workflow (9.3)
- Conversion funnel metrics (11.2)
- Monthly closing report automation (11.3)
- Salesperson ranking/leaderboard (11.4)
- Client status report for management (11.5)
- In-app notifications (12.1)
- WhatsApp communication logging (12.2)
- Development progress board (12.3)
- Easy project onboarding (13.1)
- Variable reserva amount per deal (4.6)
- Variable enganche percentage per deal (4.7)
- Cotizador data source fix (15.1)
- System-generated authoritative pricing (15.2)
- Per-project cotizador reports (15.3)
- Root cause: wrong data binding fix (15.4)
