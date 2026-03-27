# OneDrive → Orion Hourly Sync

## Context

Patty's live SSOT for reservations and availability lives in Excel workbooks on OneDrive for Business. The local files in `Reservas/` and `artifacts_sales/` are static snapshots from which we ran the original ETL. This feature connects Orion directly to the live OneDrive workbooks, syncing changes hourly so the DB stays current without manual intervention.

**Direction:** One-way, Excel → Orion. Excel wins on conflicts (overwrite).

---

## Prerequisites (manual, before code)

1. **Azure AD App Registration** in the `tcg22` M365 tenant:
   - Application permission: `Files.Read.All`
   - Admin consent granted
   - Yields: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
2. Set those 3 env vars in Vercel dashboard (+ `CRON_SECRET` auto-provisioned by Vercel crons)

---

## Phase 1: Foundation (types, constants, Graph client, migration, cron skeleton)

### 1A. `src/lib/sync/types.ts`
Interfaces: `ParsedUnitStatus`, `ParsedSaleRecord`, `ParsedCesionRecord`, `ExcelParseResult`, `SyncRunResult`, `SyncFileResult`.

### 1B. `src/lib/sync/constants.ts`
- `ONEDRIVE_USER` = `"alek_hernandez@puertaabierta.com.gt"`
- `ONEDRIVE_BASE` = `"Documents/Documentos/0. Estatus Proyectos"`
- `ONEDRIVE_FILES` map — 11 files with actual OneDrive paths:
  ```
  blt_ventas     → Reservas_y_Ventas/Bosque_Las_Tapias/BOSQUE_LAS_TAPIAS_1_Reporte_de_Ventas.xlsx
  blt_disp       → Reservas_y_Ventas/Bosque_Las_Tapias/BOSQUE_LAS_TAPIAS_2_Precios_y_Disponibilidad.xlsx
  b5_ventas      → Reservas_y_Ventas/Boulevard_5/BOULEVARD_5_1_Reporte_de_Ventas.xlsx
  b5_disp        → Reservas_y_Ventas/Boulevard_5/BOULEVARD_5_2_Precios_y_Disponibilidad.xlsx
  ce_ventas      → Reservas_y_Ventas/Casa_Elisa/CASA_ELISA_1_Reporte_de_Ventas.xlsx
  ce_disp        → Reservas_y_Ventas/Casa_Elisa/CASA_ELISA_2_Precios_y_Disponibilidad.xlsx
  ben_ventas     → Reservas_y_Ventas/Benestare/BENESTARE_1_Reporte_de_Ventas.xlsx
  ben_disp       → Reservas_y_Ventas/Benestare/BENESTARE_2_Precios_y_Disponibilidad.xlsx
  se_ventas      → Reservas_y_Ventas/Santa_Elena/SANTA_ELENA_1_Reporte_de_Ventas.xlsx
  se_disp        → Reservas_y_Ventas/Santa_Elena/SANTA_ELENA_2_Precios_y_Disponibilidad.xlsx
  b5_cesion      → Cesion_de_Derechos/APTOS_CESION_DE_DERECHOS_ACTUALIZADO.xlsx
  ```
- `STATUS_MAP`: Spanish status strings → `rv_unit_status` enum values
- `PROJECT_FILE_MAP`: file key → project slug

### 1C. `src/lib/sync/salesperson-map.ts`
Port of `SALESPERSON_CANONICAL` dict (28+ entries) and `SALESPERSON_EXCLUDE` set from `scripts/backfill_reservations.py`.

### 1D. `src/lib/sync/graph-client.ts`
- `getAccessToken()` — client credentials flow against `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`. Module-level token cache with 60s pre-expiry refresh.
- `listFolder(folderPath)` — `GET /users/{upn}/drive/root:/{path}:/children`
- `getFileMetadata(filePath)` — `GET /users/{upn}/drive/root:/{path}` → returns `lastModifiedDateTime`
- `downloadFile(filePath)` — `GET /users/{upn}/drive/root:/{path}:/content` → returns `ArrayBuffer`
- All calls use native `fetch` (no extra dependencies). Single retry on 429/5xx with exponential backoff.

### 1E. `scripts/migrations/052_sync_runs.sql`
```sql
CREATE TABLE sync_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  status          text NOT NULL DEFAULT 'RUNNING',  -- RUNNING, SUCCESS, PARTIAL, FAILED
  trigger_source  text NOT NULL DEFAULT 'cron',     -- cron, manual
  files_checked   int NOT NULL DEFAULT 0,
  files_processed int NOT NULL DEFAULT 0,
  file_results    jsonb NOT NULL DEFAULT '[]'::jsonb,
  units_updated   int NOT NULL DEFAULT 0,
  reservations_created int NOT NULL DEFAULT 0,
  clients_created int NOT NULL DEFAULT 0,
  errors          jsonb NOT NULL DEFAULT '[]'::jsonb,
  file_checksums  jsonb,  -- { "filepath": "lastModifiedDateTime" }
  created_at      timestamptz NOT NULL DEFAULT now()
);
-- Indexes + RLS (admin read, service_role write)
```

### 1F. `vercel.json` (new file, project root)
```json
{ "crons": [{ "path": "/api/cron/onedrive-sync", "schedule": "0 * * * *" }] }
```

### 1G. `src/app/api/cron/onedrive-sync/route.ts`
- Validate `CRON_SECRET` header OR `requireRole(ADMIN_ROLES)` for manual trigger
- Create `sync_runs` record → call sync engine → update record with results
- `export const maxDuration = 60;`

---

## Phase 2: Excel Parsers (port from Python ETL)

### `src/lib/sync/excel-parser.ts`

Port the mature patterns from `scripts/backfill_reservations.py` to TypeScript using the existing `xlsx` library (v0.18.5).

**Helpers** (ported from Python):
- `stripAccents()`, `normalizeSalesperson()`, `normalizeClientName()`, `splitClientNames()`
- `safeInt()`, `safeFloat()`, `safeDate()` (multi-format: Date object, DD/MM/YYYY, YYYY-MM-DD)
- `normalizeUnitNumber()`, `normalizeTower()`, `normalizeStatus()`

**Disponibilidad parsers** (project-specific, hardcoded column positions):
- `parseDispBlt(buffer)` — sheets "Precios Torre C" (status=AA, client=AB, asesor=AC), "Precios Torre B" (status=X, client=Y, asesor=Z)
- `parseDispB5(buffer)` — sheet "Matriz Precios A" (status=BF/col58, asesor=BH/col60)
- `parseDispCe(buffer)` — sheet "Disponibilidad" (status=AW/col49, asesor=AY/col51)
- `parseDispBen(buffer)` — sheet "Precios" (status=AO/col41, asesor=AR/col44)
- `parseDispSe(buffer)` — sheet "Disponibilidad"

Each validates expected header text at the status column position to detect column drift.

**Ventas parser** (generic, dynamic header detection):
- `parseVentasSheets(buffer, projectSlug)` — iterates sheets named `"Ventas*"`. Uses normalized header search (port of `detect_ventas_headers()`) to find: Cliente, No. Apartamento, Torre, Asesor, Enganche, Medio, Fecha, Promesa Firmada.

**Cesion parser:**
- `parseCesion(buffer)` — sheet "Cesión de derechos" (fixed columns A-AE)

---

## Phase 3: Sync Engine

### `src/lib/sync/sync-engine.ts`

Orchestrator with 3 sync paths, executed in priority order:

**3A. Unit Status Sync (Disponibilidad files) — highest priority**
1. Parse `ParsedUnitStatus[]` from Disponibilidad workbook
2. Load current DB state: `SELECT id, unit_number, status, price_list FROM v_rv_units_full WHERE project_slug = ?`
3. Match by `(project_slug, tower_name, unit_number)` natural key
4. For each unit:
   - **Skip if DB status = `SOFT_HOLD`** (never overwrite in-flight reservations)
   - If Excel status differs → update `rv_units.status` + log to `unit_status_log` with `changed_by = 'system:onedrive-sync'`
   - If Excel price differs → update `rv_units.price_list`

**3B. Reservation Sync (Ventas files) — medium priority**
1. Parse `ParsedSaleRecord[]` from Ventas sheets
2. For each sale, check if active reservation exists for that unit
3. If no existing reservation:
   - Resolve salesperson via canonical map → `salespeople.full_name`
   - Find or create `rv_clients` (exact name match first, then trigram similarity > 0.8)
   - Insert `reservations` with `status = 'CONFIRMED'`, `reviewed_at = now()`
   - Insert `reservation_clients` junction
   - Update unit status if needed
   - Log to `unit_status_log`

**3C. Cesion Sync — lower priority**
- Update existing B5 `rv_units` with cesion-related data from the cesion workbook

**Change detection:**
- Load `file_checksums` from most recent SUCCESS/PARTIAL sync run
- For each file, compare `lastModifiedDateTime` from Graph API vs stored value
- Skip unchanged files entirely

**Timeout guard:** If wall-clock time exceeds 50s, stop processing remaining files and record status as `PARTIAL`.

**Concurrency guard:** Check for `RUNNING` sync_run within last 5 minutes; skip if found.

---

## Phase 4: System Audit Helper

### `src/lib/audit.ts` — add `logAuditSystem()`
New function for system-actor events (no `User` object needed). Uses a fixed system actor ID and `actor_role: "system"`.

```typescript
export async function logAuditSystem(event: AuditEvent): Promise<void> {
  // Same as logAudit but with actor_id = SYSTEM_ACTOR_ID, actor_role = "system"
}
```

---

## Phase 5: Admin UI

### `src/app/api/admin/sync-status/route.ts`
- `GET` — returns last 20 sync runs
- `POST` — trigger manual sync (admin-only via `requireRole(ADMIN_ROLES)`)

### `src/app/admin/sync/page.tsx` + `sync-client.tsx`
- Last sync status badge (SUCCESS/PARTIAL/FAILED)
- Files processed table with last-modified dates
- Recent sync history (last 10 runs, expandable error details)
- "Sincronizar ahora" button

### Modified files:
- `src/lib/permissions.ts` — add `sync` resource (view/create for admin roles)
- `src/components/nav-bar.tsx` — add "Sync" link for admin roles
- `.env.example` — add 3 Azure env vars

---

## File Summary

### New files (13)
| File | Purpose |
|------|---------|
| `vercel.json` | Cron schedule |
| `scripts/migrations/052_sync_runs.sql` | Sync audit table |
| `src/lib/sync/types.ts` | TypeScript interfaces |
| `src/lib/sync/constants.ts` | OneDrive paths, status maps |
| `src/lib/sync/salesperson-map.ts` | Canonical name resolution |
| `src/lib/sync/graph-client.ts` | Microsoft Graph API client |
| `src/lib/sync/excel-parser.ts` | Excel workbook parsers |
| `src/lib/sync/sync-engine.ts` | Diff detection + upsert orchestration |
| `src/app/api/cron/onedrive-sync/route.ts` | Cron entry point |
| `src/app/api/admin/sync-status/route.ts` | Admin sync API |
| `src/app/admin/sync/page.tsx` | Admin page shell |
| `src/app/admin/sync/sync-client.tsx` | Admin sync dashboard |

### Modified files (4)
| File | Change |
|------|--------|
| `src/lib/audit.ts` | Add `logAuditSystem()` |
| `src/lib/permissions.ts` | Add `sync` resource |
| `src/components/nav-bar.tsx` | Add "Sync" link |
| `.env.example` | Add Azure env vars |

---

## Env Vars (4 new)
| Variable | Purpose |
|----------|---------|
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_CLIENT_SECRET` | App registration secret |
| `CRON_SECRET` | Vercel cron auth (auto-provisioned) |

---

## Key Design Decisions

1. **Download + parse locally** (not Graph Excel API endpoints) — the `xlsx` library is already a dep, column detection logic is complex, and downloading is more reliable than Graph's cell-range API
2. **Skip SOFT_HOLD units** — never overwrite in-flight reservations from the salesperson form
3. **Per-file error isolation** — one file failing doesn't abort the rest
4. **`lastModifiedDateTime` change detection** — avoid re-parsing unchanged files
5. **Priority ordering** — Disponibilidad first (unit status), then Ventas (reservations), then Cesion

---

## Verification

1. **Parser test script** — `npx tsx scripts/test-sync-parser.ts` reads local `Reservas/` files and validates parser output matches known DB state
2. **Graph API smoke test** — standalone script authenticates and lists OneDrive folder
3. **Dry-run mode** — `DRY_RUN=true` flag skips DB writes, returns changeset report
4. **Manual trigger** — admin UI "Sincronizar ahora" before enabling cron
5. **Post go-live** — monitor first 3 hourly runs via admin sync dashboard + `unit_status_log` entries with `changed_by = 'system:onedrive-sync'`
