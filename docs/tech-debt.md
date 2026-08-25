# Tech Debt Registry

Items flagged for future resolution. Ordered by discovery date.

---

## TD-001 — Supabase migration tracking out of sync with production schema

**Flagged:** 2026-05-22
**Severity:** Low (no production impact — all SQL has been applied)
**Impact:** `npx supabase migration list --linked` does not reflect actual production state. Cannot use `supabase db push` or `supabase db reset` reliably.

**Current state:**

- `supabase/migrations/` has 8 CLI-tracked files. Only 3 are registered on the remote migration history table (`supabase_migrations.schema_migrations`). The other 5 exist locally but show blank in the Remote column.
- `scripts/migrations/` has 67 manually-run SQL files (001–067). All have been executed against production via `npx supabase db query --linked`, but none are registered in Supabase's migration tracking system.

**Root cause:** Migrations were executed with `db query` (raw SQL execution) instead of `db push` (migration-aware execution). The two approaches use different mechanisms — `db query` runs SQL directly; `db push` runs SQL and records it in `schema_migrations`.

**Resolution options:**

1. **Backfill the migration history:** Insert records into `supabase_migrations.schema_migrations` for all 67 manual migrations + fix the 5 unregistered local ones. This makes `migration list` accurate without re-running anything.
2. **Consolidate into a baseline:** Dump the current production schema as a single baseline migration in `supabase/migrations/`, clear the history, and start fresh. Simpler but loses granular history.
3. **Accept divergence:** Continue using `scripts/migrations/` + `db query` for all future migrations. Document that `supabase/migrations/` is not the canonical migration path. Lowest effort but limits future use of Supabase CLI migration features.

---

## TD-002 — RLS no se ejerce en ningún camino de la aplicación

**Flagged:** 2026-08-24
**Severity:** Media (sin impacto en producción hoy — la autorización sí funciona vía `requireRole`)
**Impact:** Las políticas RLS existen y son correctas, pero ninguna consulta de la app pasa por ellas. La autorización de 49 rutas depende únicamente de que cada autor recuerde llamar `requireRole`, sin red de seguridad en la base de datos.

**Current state:**

- 49 de 76 archivos `route.ts` usan `createAdminClient()` (service_role), que omite RLS. Esto excede el alcance que el propio `src/lib/supabase/admin.ts` declara en su comentario de seguridad (funciones `SECURITY DEFINER`, `receipt_extractions`, Storage).
- No existe cliente Supabase de servidor con contexto de usuario — `src/lib/supabase/` solo tiene `admin.ts` y `client.ts`.
- El cliente de navegador nunca consulta tablas (0 usos de `supabaseBrowser.from(`), así que el segundo supuesto de la migración 040 ("or if the browser client queries Supabase directly") nunca se materializó.
- **Independiente y más grave:** 7 de 11 vistas no tienen `security_invoker = true`, por lo que se ejecutan con permisos de su dueño y omiten RLS incluso con un cliente de usuario. Incluye `v_entregas_full` y `v_rv_units_full`, que alimentan el tablero de entregas.
- 48 de las 49 rutas sí tienen guard de auth. La única sin guard es `/api/public/units`, pública por diseño.

**Root cause:** El service_role se adoptó como cliente por defecto en las rutas de API en lugar de reservarse para operaciones que genuinamente cruzan fronteras de RLS. Las vistas se crearon sin `security_invoker` (4 de 11 sí lo tienen, lo que indica que la intención existía pero no se aplicó de forma consistente).

**Resolution:** Especificado en `docs/plan-rls-enforcement-user-scoped-client.md` — nuevo `src/lib/supabase/server.ts` con contexto de usuario, arreglo previo de las vistas, y despliegue por fases con las 4 rutas de entregas como piloto. `jwt_role()` ya es compatible; las políticas existentes no requieren reescritura.
