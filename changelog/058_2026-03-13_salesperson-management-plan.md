# Salesperson Management Page — `/admin/asesores`

## Context

The `/reservar` PWA code refactor is complete but the page is inaccessible: no salespeople have Supabase Auth accounts (`user_id` is NULL for all 32), and `salesperson_projects` is empty. Instead of a one-time seed script, we build a management page so `torredecontrol` (Pati) can onboard salespeople, assign projects, and resend invites — ongoing, not just at launch.

---

## Auth Gate

Create a new helper in `src/lib/auth.ts`:

```ts
export async function requireRole(roles: Role[]) {
  const auth = await requireAuth();
  if (auth.response) return auth;
  const allowed = isSuperuser(auth.user?.email ?? null) || hasRole(auth.user ?? null, roles);
  if (!allowed) return { response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  return auth;
}
```

All API routes for this feature use `requireRole(["master", "torredecontrol"])`. Superusers always pass.

---

## API Routes — `src/app/api/admin/salespeople/route.ts`

### `GET /api/admin/salespeople`

Returns all salespeople (active + inactive) with their auth status and project assignments:

```ts
// 1. Query salespeople table (all columns + user_id)
// 2. Query salesperson_projects joined with projects (id, name, slug)
// 3. Merge: each salesperson gets { ...fields, has_auth: !!user_id, projects: [...] }
```

### `POST /api/admin/salespeople/invite`

**File:** `src/app/api/admin/salespeople/invite/route.ts`

Invites a salesperson by email:
1. Validate: `{ salesperson_id, email }`
2. Call `supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { role: "ventas" } })`
3. Update `salespeople SET user_id = auth_user.id, email = email WHERE id = salesperson_id`
4. Return `{ user_id, email }`

### `POST /api/admin/salespeople/projects`

**File:** `src/app/api/admin/salespeople/projects/route.ts`

Sets project assignments for a salesperson (replace-all pattern):
1. Validate: `{ salesperson_id, project_ids: string[] }`
2. Delete existing: `DELETE FROM salesperson_projects WHERE salesperson_id = $1`
3. Insert new: `INSERT INTO salesperson_projects (salesperson_id, project_id) VALUES ...`
4. Return updated assignments

---

## UI — `src/app/admin/asesores/`

### Page structure (follows admin/reservas pattern)

```
src/app/admin/asesores/
  page.tsx              — Metadata + Suspense wrapper
  asesores-client.tsx   — Main client component
```

### Layout

```
NavBar
├── Header: "Gestión de Asesores" + subtitle
├── Stats row: Total | Con acceso | Sin acceso | Proyectos asignados
├── Table: sortable by name
│   Columns: Nombre | Email | Estado | Proyectos | Acciones
│   Estado: "Activo" (green) / "Pendiente" (amber) / "Sin cuenta" (gray)
│   Acciones: "Invitar" / "Reenviar" / "Asignar proyectos"
└── Side panel (opens on row click):
    ├── Salesperson details (name, email, phone, created_at)
    ├── Auth status badge
    ├── "Invitar por email" form (email input + send button)
    ├── Project assignment: checkboxes for all 4 projects
    └── Save button
```

### States

- **Sin cuenta** (gray): `user_id` is NULL, no email. Show "Invitar" button.
- **Pendiente** (amber): `user_id` exists but user hasn't logged in yet. Show "Reenviar invitación".
- **Activo** (green): `user_id` exists and user has confirmed. Show "Acceso activo".

To determine if a user has confirmed: check `auth.users.email_confirmed_at` — we can include this in the GET response by querying `auth.admin.listUsers()` and cross-referencing.

### Project assignment

Side panel shows 4 project checkboxes (BLT, CE, B5, BEN). Toggling and saving calls `POST /api/admin/salespeople/projects`. Changes are immediate.

---

## Files

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/lib/auth.ts` | Add `requireRole()` helper |
| NEW | `src/app/api/admin/salespeople/route.ts` | GET list |
| NEW | `src/app/api/admin/salespeople/invite/route.ts` | POST invite |
| NEW | `src/app/api/admin/salespeople/projects/route.ts` | POST project assignments |
| NEW | `src/app/admin/asesores/page.tsx` | Page entry point |
| NEW | `src/app/admin/asesores/asesores-client.tsx` | Client component (table + side panel) |
| MODIFY | `src/components/nav-bar.tsx` | Add "Asesores" link |

---

## Verification

1. Login as `torredecontrol` user → navigate to `/admin/asesores`
2. See table of 32 salespeople, all showing "Sin cuenta"
3. Click a salesperson → side panel opens
4. Enter email → click "Invitar" → status changes to "Pendiente"
5. Check project checkboxes → save → `salesperson_projects` updated
6. Salesperson receives invite email → clicks link → sets password → can access `/reservar`
7. Non-torredecontrol users get 403 on the page


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **As of 2026-03-20, only 3 confirmed sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The confirmed count on that date is **3** (point-in-time figure, not a fixed ceiling).
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 confirmed sales (as of 2026-03-20) will be uploaded** as the sole BLT Torre B transactions. This is a point-in-time count — new sales will flow through the normal Orion reservation process.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction (2026-03-20).