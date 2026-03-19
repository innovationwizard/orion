# Orion — Industry Best Practices for App Roles, Data Visualization & Access Control

**Date:** 2026-03-19
**Scope:** Research-backed recommendations from enterprise SaaS, PropTech, CRM, and data visualization leaders.

---

## Table of Contents

1. [RBAC Architecture Models](#1-rbac-architecture-models)
2. [Real Estate Industry Role Taxonomy](#2-real-estate-industry-role-taxonomy)
3. [Permission Granularity: The Four Layers](#3-permission-granularity-the-four-layers)
4. [Dashboard Design Per Role](#4-dashboard-design-per-role)
5. [Data Visualization Best Practices](#5-data-visualization-best-practices)
6. [Page & View Architecture Per Role](#6-page--view-architecture-per-role)
7. [Action Authorization Patterns](#7-action-authorization-patterns)
8. [Security & Compliance Standards](#8-security--compliance-standards)
9. [Tech Stack: What the Best Use](#9-tech-stack-what-the-best-use)
10. [Emerging Patterns (2024-2026)](#10-emerging-patterns-2024-2026)

---

## 1. RBAC Architecture Models

### 1.1 Three Dominant Models

| Model | How It Works | Used By | Best For |
|-------|-------------|---------|----------|
| **Flat RBAC** | Permissions assigned directly to roles, no inheritance | Small teams (<20 users) | Simple apps with clear role boundaries |
| **Hierarchical RBAC** | Senior roles inherit all permissions of subordinate roles | Salesforce, Yardi, HubSpot | Organizational structures with clear reporting chains |
| **Hybrid (RBAC + ABAC)** | Roles define broad access; attributes (project, time, ownership) refine it | Modern SaaS, most enterprise platforms | Organizations needing both role-based and context-based access |

### 1.2 How Enterprise Leaders Structure Roles

**Salesforce (5-layer model — the gold standard):**
1. **Licenses** — baseline feature entitlements (Sales Cloud, Service Cloud)
2. **Profiles** — one per user, sets page layouts and default object CRUD (being deprecated Spring '26 in favor of Permission Sets)
3. **Permission Sets** — additive permissions layered on profiles
4. **Role Hierarchy** — record visibility inheritance (Sales VP sees all Manager records, Managers see all Rep records)
5. **Sharing Rules** — exceptions to Organization-Wide Defaults for cross-team data sharing

**Key insight:** Organization-Wide Defaults (OWD) set the **most restrictive** baseline, then the Role Hierarchy **opens access upward**. A Sales VP automatically sees all records owned by Sales Managers beneath them. This is the inverse of "grant everything, then restrict" — and it is safer.

**HubSpot (3-layer model):**
1. **Seats** — functional scope (Core, Sales, Service, Content, View-Only)
2. **Permission Sets** — standardized access bundles (Content Marketer, Sales Manager)
3. **Teams** — nested hierarchy for record visibility and reporting roll-ups

**Monday.com (3-tier model):**
1. **Account-level** — Admin, Member, Viewer, Guest
2. **Workspace-level** — Owner, Member, Non-member
3. **Board-level** — Owner, Editor, Contributor, Assigned Contributor, Viewer

### 1.3 Avoiding Role Explosion

The #1 RBAC anti-pattern is creating a new role for every slight permission variation. Best practice:

- **Start from resources and access patterns**, not org charts
- If five job titles need identical access, they share one role
- A well-designed 1,000-person organization needs 20-40 roles, not 200+
- Provide 5-8 **system-defined role templates** covering 80% of use cases
- Allow **custom roles** that remix atomic permissions for the remaining 20%

### 1.4 Permission Definition Methodology

The industry-standard approach: build a cartesian product of **verbs** × **nouns** × **scopes**:

```
Verbs:   create | read | update | delete | approve | export
Nouns:   reservation | unit | client | commission | report | setting
Scopes:  own | team | project | all
```

Then group these (verb, noun, scope) triples into roles. This avoids the anti-pattern of defining roles first and backing into permissions.

---

## 2. Real Estate Industry Role Taxonomy

### 2.1 Standard Roles in PropTech Platforms

Based on research across Yardi Voyager, Spark, Lasso CRM, Zoho CRM (Real Estate Edition), Buildium, AppFolio, and Cecilian Partners:

| Role | Scope | Primary Concerns | Key Metrics |
|------|-------|------------------|-------------|
| **Sales Agent** (Ejecutivo) | Own leads, own reservations, assigned projects | My pipeline, my commission, my clients | Units reserved, quota %, commission earned |
| **Sales Manager** (Gerente Comercial) | Team of agents within a project or region | Team performance, pipeline health, coaching | Team quota %, pipeline value, cancellation rate |
| **Operations Control** (Torre de Control) | All projects, all transactions | Data quality, process compliance, cross-reference validation | Pending approvals, data quality alerts, daily volume |
| **Finance / CFO** | All financial data | Commission accuracy, cash flow, disbursements, tax retention | Revenue vs projected, disbursements, ISR, aging |
| **Legal / Compliance** | Contract-related records | PCVs, identity verification, regulatory compliance | Unsigned contracts, compliance rate, audit findings |
| **Executive / C-Suite** | Portfolio-wide aggregates | Revenue, velocity, strategic decisions | Portfolio revenue, sales velocity trend, project health |
| **Marketing** | Lead source data, campaign metrics | Lead attribution, conversion rates | Lead count, cost per lead, conversion funnel |
| **System Admin** (Master) | Full system access | User management, configuration, system settings | User activity, system health, error rates |

### 2.2 Multi-Property Access Scoping

**How the best platforms handle it:**

**Yardi Voyager:** "User Property Security" — administrators restrict each user to specific properties. A leasing agent at Property A cannot see data from Property B. Configuration is per-user, per-property.

**Zoho CRM Real Estate:** Development > Tower/Phase > Unit hierarchy. Roles are scoped to developments. Unit status updates cascade automatically.

**Spark:** Portfolio-level management with per-project role assignments. Users can be an agent on Project A and a manager on Project B.

**Best practice:** The assignment model should be **temporal** (with start/end dates) and **per-project** — exactly the pattern Orion already uses with `salesperson_project_assignments`.

### 2.3 Role Templates vs Custom Roles

The industry trend is **template-first with customization:**
- **Yardi Breeze:** Pre-built templates for Property Manager, Leasing Agent, Maintenance, Accounting — copy and modify
- **Zoho CRM:** Vertical-specific templates (Agent, Broker, Developer, Investor) tied to the real estate module
- **Rationale:** 80% of organizations have the same functional structure, so templates accelerate onboarding

---

## 3. Permission Granularity: The Four Layers

Enterprise SaaS operates across four permission layers, each progressively finer:

### 3.1 Layer 1: Page-Level Access

Controls access to entire sections/modules. The broadest and simplest access control.

| Example | Implementation |
|---------|---------------|
| Salesperson cannot see `/admin/roles` | Middleware route check |
| Finance cannot see `/admin/asesores` | NavBar filtering + middleware |

**Best practice:** Enforce at the request level (middleware), not just UI hiding. If a URL returns a valid page to an unauthorized user, it's a security gap even if no link points there.

### 3.2 Layer 2: Feature-Level Access

Controls what operations are available on a page. A user might see a page but not all its buttons.

| Example | Implementation |
|---------|---------------|
| Torre de Control can view reservation detail but cannot confirm ejecutivo rate | API guard returns 403 |
| Ventas can view PCV but cannot edit or upload | `readOnly` prop on shared component |

**Best practice:** Feature access should be derived from the role-permission matrix, not hardcoded per-component. A `permissions` object or `can(action, resource)` utility function is cleaner than scattered role checks.

### 3.3 Layer 3: Field-Level Access

Controls which data columns are visible or editable per role.

| Example | Implementation |
|---------|---------------|
| Ventas cannot see `ejecutivo_rate` in reservation detail | API response omits field |
| Ventas cannot see `audit_log` in reservation detail | API response omits field |

**Best practice:** **Server-side field masking is mandatory.** The API must omit fields the caller's role should not see. Client-side hiding is a UX convenience, not a security control. Salesforce's Field-Level Security operates this way — the API never returns data the user's profile does not grant access to.

### 3.4 Layer 4: Data-Row-Level Access

Controls which records are accessible based on ownership or assignment.

| Example | Implementation |
|---------|---------------|
| Ventas sees only own reservations | API filters by `salesperson_id` |
| Ventas sees only assigned projects' inventory | API filters by `salesperson_project_assignments` |

**Best practice:** Enforce at the **database level** via RLS policies, not just API-level query filters. If a new API route is added and forgets to filter by ownership, the database should be the safety net. Salesforce's OWD + Role Hierarchy model enforces this at the platform level.

---

## 4. Dashboard Design Per Role

### 4.1 The Inverse Density Principle

Research from UXPin, Toptal, DataCamp, and Nielsen Norman Group converges on an inverse relationship between seniority and information density:

| User Type | Design Priority | KPI Count | Primary Pattern |
|-----------|----------------|-----------|-----------------|
| **Executives (C-Suite)** | Monitoring-first | 5-7 per screen | Large numbers, trend arrows, status indicators. 5-second glance tells the story. |
| **Managers** | Analysis-first | 8-12 per screen | Drill-down charts, comparison views, filterable tables. |
| **Operators (Torre de Control)** | Action-first | 10-15 per screen | Work queues, exception lists, editable tables. Higher density acceptable — this is their full-time working interface. |
| **Field Agents (Ejecutivos)** | Task-first | 3-5 visible without scrolling | Mobile-optimized cards. One question per screen. |

### 4.2 Recommended KPIs Per Role

#### Sales Agent (Ejecutivo) — Mobile-First
- **Units reserved this month** (count + vs. quota gauge)
- **Personal quota attainment** (percentage with visual indicator)
- **Active pipeline** (pending reservations awaiting approval)
- **Commission earned** (current period, GTQ)
- **Next actions** (upcoming follow-ups, missing documents)
- **Recent activity feed** (own transactions only)

**Design:** Card-based layout, large touch targets (44x44px minimum), no hover states, offline-capable.

#### Sales Manager (Gerente Comercial) — Desktop + Tablet
- **Team quota attainment** (aggregate + per-agent bar chart)
- **Pipeline by stage** (funnel: PENDING → CONFIRMED → PCV → SIGNED)
- **Agent performance comparison** (horizontal bar chart, ranked)
- **Cancellation rate by agent** (flag outliers)
- **Average reservation-to-PCV time** (process efficiency)
- **Coaching indicators** (agents below threshold, highlighted)
- **Project-level sales velocity** (units/month by project)

**Design:** Comparison-heavy layout, drill-down from team to individual, date range filtering.

#### Operations Control (Torre de Control / Pati) — Desktop
- **Pending approvals queue** with age and urgency indicators
- **Data quality alerts** (missing DPI, unsigned PCVs, incomplete profiles)
- **Daily/weekly transaction volume** (throughput monitoring)
- **Inventory status across all projects** (treemap — already implemented)
- **Cross-project pipeline summary** (integración by tower)
- **Overdue items** (enganche payments, pending documents)
- **Process compliance rates** (% of reservations with complete data)

**Design:** Dense work queue with action buttons. Exception-based — highlight what needs attention, suppress what's normal. Sortable/filterable table as primary interface.

#### CFO / Finance — Desktop
- **Revenue recognized vs projected** (monthly bar chart with line overlay)
- **Commission disbursements** (disbursable vs accumulated, current month)
- **Cash flow by project/phase** (already implemented)
- **ISR retention totals** (monthly + YTD)
- **Payment collection rates by phase** (Phase 1/2/3 comparison)
- **Outstanding receivables aging** (0-30, 31-60, 61-90, 90+ days)
- **Rate confirmation status** (unconfirmed ejecutivo rates)

**Design:** Financial tables with summary rows, drill-down to individual transactions, export to CSV/Excel.

#### Executive (C-Suite) — Desktop + Mobile
- **Portfolio revenue** (single large number, vs. target)
- **Sales velocity trend** (12-month line chart)
- **Project health scorecards** (red/amber/green per project)
- **Year-over-year comparison** (revenue, units sold)
- **Market position indicators** (if competitive analysis module exists)

**Design:** Executive summary — no tables, no detailed data. Large numbers with trend arrows. One screen tells the full story.

### 4.3 Anti-Patterns to Avoid

| Anti-Pattern | Description | Fix |
|-------------|-------------|-----|
| **Information overload** | Cramming every metric onto one screen | 5-8 key metrics per view, progressive disclosure for detail |
| **Vanity metrics** | Numbers that look impressive but don't drive decisions (e.g., "total units in system") | Show actionable metrics (units sold this month, pending approvals) |
| **Missing context** | A number without comparison (vs. target, vs. prior period) | Every KPI needs at least one comparison point |
| **Wrong chart type** | Pie charts with 8+ slices, line charts for categorical data | Match chart type to data type and question being asked |
| **No progressive disclosure** | Forcing users to process all data at once | Summary → detail, on demand |
| **Misleading aggregation** | Summing percentages across different bases | Show denominators, use weighted averages |
| **Y-axis manipulation** | Truncated axes exaggerating small changes | Start Y-axis at zero for bar charts |

### 4.4 Progressive Disclosure Levels

| Level | What's Shown | Interaction |
|-------|-------------|-------------|
| **L0 — Status indicators** | Red/amber/green dots, trend arrows, single numbers | Glanceable, no click needed |
| **L1 — Summary charts** | Bar charts, sparklines, gauges | Hover for tooltip |
| **L2 — Detailed tables** | Sortable, filterable data grids | Click row for detail |
| **L3 — Record detail** | Individual transaction/entity pages | Full context + edit capability |
| **L4 — Raw data / export** | CSV downloads, API access | Explicit action (button click) |

Each level should be reachable from the previous one in **a single click**.

---

## 5. Data Visualization Best Practices

### 5.1 Chart Selection Guide

| Question Type | Best Chart | Avoid |
|--------------|-----------|-------|
| How much? (single number) | KPI card with sparkline | Pie chart |
| How does it compare? | Horizontal bar chart | Vertical bars with 20+ categories |
| What's the trend? | Line chart (time series) | Area chart with overlapping series |
| What's the composition? | Stacked bar (few categories) | Pie chart with >5 slices |
| What's the distribution? | Histogram, box plot | Bar chart |
| What's the relationship? | Scatter plot | Line chart connecting unrelated points |
| What's the hierarchy? | Treemap, sunburst | Nested pie charts |
| What's the flow? | Sankey diagram | Multiple bar charts |

### 5.2 Color Usage

| Purpose | Color Approach |
|---------|---------------|
| Status indicators | Semantic: green (good), amber (warning), red (critical), gray (neutral) |
| Category differentiation | Max 5-7 colors. Use colorblind-safe palettes (avoid red/green pairs without additional encoding) |
| Sequential data (heat maps) | Single-hue gradient (light → dark) |
| Emphasis | One accent color against muted background. Never >2 accent colors per view |

### 5.3 Mobile Data Visualization

For field sales teams (ejecutivos):
1. **One question per screen.** If the user can only see one number before putting the phone away, what is it?
2. **Replace tables with cards.** Horizontal bar charts instead of comparison tables. Expandable cards instead of data grids.
3. **Larger touch targets.** Minimum 44x44px for interactive elements (Apple HIG standard).
4. **No hover states.** Design for tap, not mouse. Tooltips on tap, not hover.
5. **Offline-first.** Queue actions when connectivity drops.
6. **Reduce precision.** Show "Q45.2K" not "Q45,234.56" on mobile.

### 5.4 Data Science Principles for KPI Selection

1. **Actionability:** Every displayed metric should have a clear "so what?" — what action does the user take if this number is too high/too low?
2. **Recency:** Default to showing the most recent period. Historical comparison is secondary.
3. **Benchmarking:** Show relative performance (vs. target, vs. team average, vs. prior period), not just absolute numbers.
4. **Leading vs lagging indicators:** Prioritize leading indicators (pipeline value, pending approvals) over lagging indicators (total revenue, historical sales).
5. **Statistical significance:** Don't highlight trends on small sample sizes. A "50% increase" from 2 to 3 reservations is noise, not signal.

---

## 6. Page & View Architecture Per Role

### 6.1 Recommended Page-Role Matrix

| Page / Section | Sales Agent | Sales Manager | Ops Control | CFO | Legal | Executive | Admin |
|---------------|-------------|---------------|-------------|-----|-------|-----------|-------|
| **My Dashboard** | R (own KPIs) | R (team KPIs) | R (all KPIs) | R (finance KPIs) | — | R (portfolio KPIs) | R (all) |
| **Inventory** | R (assigned) | R (team projects) | RW (all) | R (all) | — | R (all) | RW (all) |
| **Reservation Form** | RW (create) | RW (create) | RW (all) | R | — | — | RW (all) |
| **Reservation Queue** | — | R (team) | RW (approve/reject) | R (all) | R (all) | — | RW (all) |
| **Reservation Detail** | R (own) | R (team) | RW (all) | R (all) | RW (contract fields) | — | RW (all) |
| **Commission Dashboard** | R (own) | R (team) | R (all) | RW (confirm rates) | — | R (summary) | RW (all) |
| **Payment Tracking** | — | R (team) | R (all) | RW (reconcile) | — | R (summary) | RW (all) |
| **Cash Flow** | — | — | R (all) | RW (forecast) | — | R (summary) | RW (all) |
| **Legal Documents (PCV)** | R (own, download) | R (team) | RW (generate) | R (all) | RW (review/sign) | — | RW (all) |
| **Desistimientos** | — | R (team) | RW (process) | R (all) | RW (require docs) | — | RW (all) |
| **Sales Velocity** | — | R (team) | R (all) | R (all) | — | R (all) | RW (all) |
| **Referidos** | — | R (team) | RW (all) | R (all) | — | — | RW (all) |
| **Buyer Persona** | — | R (team) | R (all) | — | — | R (summary) | RW (all) |
| **Valorización** | — | R | R (all) | R (all) | — | R (all) | RW (all) |
| **User Management** | — | — | — | — | — | — | RW |
| **System Settings** | — | — | R | — | — | — | RW |
| **Audit Log** | — | — | R (all) | R (all) | R (all) | — | RW (all) |
| **Reports / Export** | R (own) | R (team) | R (all) | RW (all) | R (compliance) | R (executive summary) | RW (all) |

Legend: R = Read, RW = Read-Write, — = No Access

### 6.2 Three Patterns for Shared Pages with Role-Dependent Content

**Pattern 1 — Component-Level Visibility (recommended for minor differences):**
A single page component conditionally renders elements based on role. Best when the same data is shown with different action buttons.

**Pattern 2 — Role-Specific Routes (recommended for fundamentally different views):**
Separate routes serve completely different UI (e.g., `/ventas/portal/reservas` vs `/admin/reservas`). Best when the layout, data, and interactions are substantially different.

**Pattern 3 — Server-Side Field Masking (mandatory for security):**
The API omits fields the caller's role should not see. This is the security boundary — client-side hiding is supplementary.

**Best practice: combine all three.** API masking as security (Pattern 3), separate routes for different experiences (Pattern 2), conditional rendering for minor variations (Pattern 1).

### 6.3 Navigation Architecture

**Industry standard: Unified navigation with hiding.**
Used by Salesforce, HubSpot, Monday.com. One sidebar/navbar for all users. Items the user cannot access are **hidden** (not grayed out). Benefits:
- Less code to maintain
- Consistent mental model
- No confusion from switching interfaces

**Alternative: Role-specific sidebars.**
Used by Yardi Voyager, some healthcare systems. Completely different nav per role. More code, harder maintenance, but cleaner per-role UX. Only justified when roles have fundamentally different workflows.

### 6.4 Efficiency Metrics

| Metric | Target |
|--------|--------|
| **Time to any KPI** | 0-1 clicks (dashboard landing) |
| **Time to any record** | 2-3 clicks (dashboard → list → detail) |
| **Time to any action** | 2-4 clicks (nav → section → action) |
| **Mobile: primary task completion** | ≤3 screens |
| **Desktop: data to decision** | ≤2 minutes for routine decisions |

---

## 7. Action Authorization Patterns

### 7.1 Maker-Checker Pattern

For financial and compliance-critical operations, the person who initiates cannot be the person who approves:

| Phase | Maker | Checker | Auto-Path |
|-------|-------|---------|-----------|
| Reservation creation | Ejecutivo | Torre de Control | Auto-approval toggle |
| Commission rate setting | System (backfill) | CFO (confirm) | None — human-in-loop mandatory |
| PCV generation | Torre de Control | Legal (validate) | None |
| Payment recording | Torre de Control | CFO (reconcile) | None |
| Desistimiento | Client/Ejecutivo (request) | Torre de Control + Legal (evidence) | None |
| User provisioning | Admin (invite) | Should require 2nd approval | Not implemented |
| System settings | Admin (change) | Audit log at minimum | Not implemented |

### 7.2 Escalation Paths

When an action exceeds a user's authority:
1. **Notification-based:** User initiates → system notifies authorized role (most CRM platforms)
2. **Request-based:** User submits formal request → authorized role reviews (like Orion's `freeze_requests`)
3. **Threshold-based:** Below monetary threshold → auto-approve; above → escalate

### 7.3 Audit Trail Requirements

Every enterprise system should log per action:

| Field | Purpose |
|-------|---------|
| **Who** | User ID + role at time of action |
| **What** | Action type, resource affected, old value → new value |
| **When** | Timestamp with timezone |
| **Where** | IP address, device type (for compliance) |
| **Why** | Approval reason, rejection reason, or system trigger name |

### 7.4 Temporal Access Patterns

| Pattern | Application |
|---------|------------|
| Project assignment periods | Access scoped to active assignment dates |
| Contract periods | Salesperson active/inactive states |
| Commission assignment periods | GC/Supervisor temporal boundaries |
| Shift-based access | Not relevant for this domain |
| Time-limited elevated permissions | Break-glass superuser access |

---

## 8. Security & Compliance Standards

### 8.1 SOC 2 Requirements for RBAC

SOC 2 Trust Services Criteria relevant to access control:

| Criterion | Requirement |
|-----------|-------------|
| **CC6.1** | Logical access controls restrict access to authorized users |
| **CC6.2** | Registration and authorization processes before issuing credentials |
| **CC6.3** | Processes to manage and remove access when no longer needed |
| **CC6.6** | Restriction of access to system components based on role |

**Practical implications:**
- Formal access control matrix document (who has what permissions)
- Quarterly access reviews (is each user's access still appropriate?)
- Evidence of least privilege enforcement
- Logs of all access grants, changes, and revocations
- Separation of duties in financial operations

### 8.2 ISO 27001 Annex A 5.15 (Access Control)

- Access control policies reflecting business requirements
- Formal user access provisioning process
- Management of privileged access rights
- Regular review of user access rights
- Removal/adjustment of access upon role change or termination

### 8.3 GDPR / Data Privacy

- Access to personal data restricted to roles that need it
- Audit trail of who accessed what personal data and when
- Data minimization — don't show roles more personal data than necessary
- Right to erasure must work across all role views

**For Orion specifically:** Client DPI numbers, personal financial data (commission amounts), and client demographic profiles are sensitive data. Field-level access control ensuring ejecutivos see only their own clients' data is a compliance requirement, not just a feature.

### 8.4 Break-Glass Access

For emergency scenarios when normal access fails:
1. Pre-staged emergency account with admin rights
2. Credentials stored securely (sealed/monitored)
3. Every use triggers immediate alert
4. Full session recording
5. Mandatory post-incident review within 24 hours
6. Single-person allocation — never shared

### 8.5 Separation of Duties

No single person should control all phases of a critical transaction:

| Transaction | Phase 1 (Initiate) | Phase 2 (Approve) | Phase 3 (Execute) |
|-------------|-------------------|-------------------|-------------------|
| Sale | Ejecutivo | Torre de Control | System |
| Commission | System (calculate) | CFO (confirm rate) | Finance (disburse) |
| Cancellation | Client (request) | Legal (evidence) | Torre de Control (execute) |
| User access | Admin (create) | 2nd admin (approve) | System (provision) |

---

## 9. Tech Stack: What the Best Use

### 9.1 Visualization Libraries (React Ecosystem)

| Library | Weekly Downloads | Best For | Trade-offs |
|---------|-----------------|----------|------------|
| **Recharts** | 9.5M | Standard business charts (bar, line, area, pie) | Quick setup, good for 80% of dashboard needs. Limited customization for novel chart types. |
| **Chart.js** | 5.6M | Lightweight, canvas-based charts | Fast rendering, small bundle. Less customizable than SVG-based libs. |
| **D3.js** | 5.6M | Custom/novel visualizations (treemaps, Sankey, force graphs) | Full control, pixel-level SVG manipulation. Steep learning curve, more code per chart. |
| **Nivo** | ~800K | Feature-rich, D3-based React components | Best of both worlds (D3 power + React API). Good for teams wanting D3 aesthetics without D3 complexity. |
| **Victory** | ~400K | Cross-platform (React + React Native) | Good if mobile app is on roadmap. Smaller community. |
| **Plotly.js** | 344K | Scientific/3D visualization, Python/R interop | Overkill for business dashboards. Good for data science teams. |

**Recommendation for Orion:** Keep D3.js for treemaps (justified — non-standard visualization requiring custom layout). Add Recharts for standard bar/line charts in commission and velocity dashboards. This is the same pattern Stripe uses: custom D3 for novel visualizations, higher-level libraries for standard charts.

### 9.2 How Top Companies Build Their Dashboards

| Company | Approach | Key Technologies |
|---------|----------|-----------------|
| **Stripe** | Custom React components + Apache Pinot for real-time analytics | React, SVG, Pinot, Ruby backend |
| **Shopify** | Polaris design system with standardized chart components | React, Polaris, GraphQL |
| **Square** | Embedded analytics with custom D3 + React | D3, React, Go backend |
| **Tableau** | Proprietary VizQL engine + Hyper data engine | Self-service BI, embeddable |
| **Looker** | LookML semantic layer, queries source DB directly | Governed BI, embeddable |
| **Power BI** | DAX/M expressions, Power Query ETL, Azure | Enterprise BI, Microsoft ecosystem |

### 9.3 When to Use Each

| Scenario | Best Choice |
|----------|-------------|
| Internal operational dashboard | React + Recharts/Nivo + D3 for custom viz |
| Self-service analytics for business users | Embedded Tableau/Looker/Power BI |
| Custom inventory visualization (treemap) | D3.js (already correct choice) |
| Commission bar charts | Recharts (simpler than D3 for standard bars) |
| Cash flow line charts | Recharts or Nivo |
| Executive summary cards | Custom React + KPI card component |
| Mobile agent dashboard | React cards + sparklines (keep it light) |

---

## 10. Emerging Patterns (2024-2026)

### 10.1 ABAC / Hybrid Authorization

Pure RBAC is giving way to hybrid models:
- **RBAC base layer** — roles define broad categories
- **ABAC refinement** — attributes (project, time, ownership) narrow access within a role
- **ReBAC (Relationship-Based)** — access derived from entity relationships ("user can see reservation because user is the salesperson who created it")

Orion already implements a hybrid: RBAC (role in `app_metadata`) + ABAC (project assignments, temporal commission boundaries) + ReBAC (salesperson ownership of reservations).

### 10.2 Policy-as-Code

Three engines dominate:

| Engine | Creator | Strengths | Best For |
|--------|---------|-----------|----------|
| **OPA (Rego)** | Styra/CNCF | Maximum flexibility, rich ABAC | Organizations with platform teams |
| **Cedar** | AWS | 42-60x faster than Rego, audit-friendly | AWS ecosystem, formal verification |
| **Zanzibar/SpiceDB/OpenFGA** | Google | Relationship-based graph model | Systems where access depends on entity relationships |

**For Orion at current scale (32 users, 4 projects):** Policy-as-code engines are over-engineering. The Supabase RLS + middleware + `app_metadata` approach is the right level of complexity. Consider Cedar/SpiceDB if the system grows to 100+ users or multi-tenancy.

### 10.3 Admin Impersonation

The pattern of admin users "seeing what the user sees" for support/debugging:
1. Admin selects a user to impersonate from management panel
2. System creates a scoped, time-limited session with target user's permissions
3. Every action logged with both admin ID and impersonated user ID
4. Visual banner indicates impersonation is active
5. Auto-expires after 15-30 minutes

### 10.4 AI-Powered Anomaly Detection (UEBA)

User and Entity Behavior Analytics — ML models learn normal patterns and flag deviations:
- Salesperson suddenly accessing 10x more client records
- Admin making changes at unusual hours
- Unusual volume of data exports

**For Orion (current scale):** Full UEBA is premature. Simple anomaly checks are actionable now:
- Alert if salesperson accesses data outside assigned projects
- Alert if system settings change outside business hours
- Log all data access for future analysis

---

## Sources

### RBAC Architecture
- [EnterpriseReady — RBAC Guide](https://www.enterpriseready.io/features/role-based-access-control/)
- [Oso — 10 RBAC Best Practices](https://www.osohq.com/learn/rbac-best-practices)
- [Cerbos — RBAC Best Practices](https://www.cerbos.dev/blog/role-based-access-control-best-practices)
- [TechPrescient — RBAC Best Practices 2026](https://www.techprescient.com/blogs/role-based-access-control-best-practices/)
- [Permify — RBAC Enterprise Guide](https://permify.co/post/role-based-access-control-rbac/)
- [Agnite Studio — RBAC Design in SaaS](https://agnitestudio.com/blog/rbac-design-saas/)
- [WorkOS — Top RBAC Providers 2025](https://workos.com/blog/top-rbac-providers-for-multi-tenant-saas-2025)

### Platform-Specific
- [Salesforce Trailhead — Role Hierarchy](https://trailhead.salesforce.com/content/learn/modules/data_security/data_security_roles)
- [Salesforce Ben — Roles vs Profiles](https://www.salesforceben.com/salesforce-roles-profiles-permission-sets/)
- [HubSpot — User Permissions Guide](https://knowledge.hubspot.com/user-management/hubspot-user-permissions-guide)
- [Monday.com — User Types](https://support.monday.com/hc/en-us/articles/360002144900-User-types-explained)
- [Yardi Breeze — Custom User Roles](https://www.yardibreeze.com/blog/2024/11/user-roles/)

### Real Estate / PropTech
- [Zoho CRM — Real Estate Developers](https://www.realestatedevelopercrm.com/)
- [Spark — Real Estate Software](https://www.spark.re/)
- [Cecilian Partners — Real Estate Development Software](https://www.cecilianpartners.com)

### Data Visualization
- [UXPin — Dashboard Design Principles 2025](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [DataCamp — Dashboard Design Tutorial](https://www.datacamp.com/tutorial/dashboard-design-tutorial)
- [Toptal — Dashboard Design Best Practices](https://www.toptal.com/designers/data-visualization/dashboard-design-best-practices)
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [HubSpot — Sales Dashboard Templates](https://blog.hubspot.com/sales/sales-dashboard)
- [Boundev — Mobile Data Visualization Guide](https://www.boundev.com/blog/mobile-data-visualization-design-guide)

### Security & Compliance
- [Konfirmity — SOC 2 RBAC](https://www.konfirmity.com/blog/soc-2-role-based-access-control-for-soc-2)
- [Veza — Access Control Compliance Guide 2025](https://veza.com/blog/access-control-compliance-guide-2025/)
- [BeyondTrust — Break Glass Process](https://www.beyondtrust.com/blog/entry/provide-security-privileged-accounts-with-break-glass-process)
- [StrongDM — Break Glass Explained](https://www.strongdm.com/blog/break-glass)

### Emerging Patterns
- [Oso — OPA vs Cedar vs Zanzibar](https://www.osohq.com/learn/opa-vs-cedar-vs-zanzibar)
- [Permit.io — OPA vs Cedar](https://www.permit.io/blog/opa-vs-cedar)
- [Exabeam — UEBA Guide 2025](https://www.exabeam.com/explainers/ueba/what-ueba-stands-for-and-a-5-minute-ueba-primer/)
