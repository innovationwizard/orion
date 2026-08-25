# 098 — Rol `entregas_editor` y `torredecontrol` a solo lectura en entregas

**Date:** 2026-08-24
**Migration:** `scripts/migrations/072_entregas_editor_role.sql` (RLS únicamente, sin DDL)
**Route:** `/entregas`
**API:** `GET|POST /api/entregas`, `GET /api/entregas/candidatos`, `PATCH|DELETE /api/entregas/citas/[id]`

## Problem

El tablero de entregas tenía un único grupo de escritura: `ADMIN_ROLES`
(`master` + `torredecontrol`). Eso ataba la capacidad de agendar entregas al rol
administrativo general, sin forma de dar permiso de agendar a alguien que no deba
tocar reservas, pagos ni configuración — ni de dejar a `torredecontrol` mirando el
cronograma sin poder modificarlo.

## Decision

1. **Nuevo rol `entregas_editor`.** Monopropósito, igual que `entregas_viewer`:
   el middleware lo limita a `/entregas`, `/auth`, `/login`. La única diferencia
   entre ambos roles es el permiso de escritura sobre el cronograma, no las
   páginas que pueden abrir.
2. **`torredecontrol` pasa a solo lectura en entregas.** El cambio está **acotado al
   recurso `entregas`**: `ADMIN_ROLES` no se tocó, así que `torredecontrol` conserva
   intactos todos sus demás permisos (reservas, PCV, cartas, cotizador, auditoría,
   fuentes). Escribe el cronograma `master` + `entregas_editor`.

Se descartó demover `torredecontrol` globalmente: le quitaría escritura sobre el
sistema de reservas a `patricia.castillo@` (Pati) y `antonio.rada@`, muy por fuera
del alcance pedido.

`ROLE_LEVEL.entregas_editor = 16` existe solo para satisfacer el contrato
`Record<Role, number>`. Como `entregas_viewer`, no tiene significado jerárquico —
no se debe otorgar acceso comparando contra él.

## Changes

| File | Change |
|---|---|
| `src/lib/auth.ts` | `entregas_editor` agregado a `Role` y `ROLE_LEVEL`; nota de monopropósito extendida a ambos roles |
| `src/lib/permissions.ts` | `DE` incluye `entregas_editor`; nuevo grupo `EW = ["master", "entregas_editor"]` para `entregas.create/update/delete` |
| `middleware.ts` | El branch monopropósito y el redirect desde `/login` cubren ambos roles de entregas |
| `src/app/page.tsx` | `entregas_editor` que entra a `/` va a `/entregas` |
| `src/components/nav-bar.tsx` | `ENTREGAS_VIEWER_LINKS` → `ENTREGAS_ONLY_LINKS`, usado por ambos roles; label `Entregas (edición)` y color |
| `src/app/api/entregas/**` | Comentarios `Auth:` actualizados (decían «admins only», ya no es cierto) |
| `scripts/generate-access-matrix.ts` | `entregas_editor` agregado a `ALL_ROLES` |
| `docs/access-control-matrix.md` | Regenerado: 10 roles, 64 triples, 165 grants |
| `scripts/migrations/072_entregas_editor_role.sql` | Políticas RLS de `entregas` y `entrega_citas` alineadas con la matriz |

La página ya derivaba todo de `can(role, "entregas", …)` y las rutas de
`rolesFor("entregas", …)`, así que no hubo cambios de lógica de autorización:
solo cambió la matriz.

## RLS vs. enforcement

Las rutas de `/api/entregas` usan `createAdminClient()` (service_role), que
**omite RLS**. La autorización real la hace `requireRole(rolesFor(...))` en cada
ruta. La migración 072 es defensa en profundidad y mantiene la base coherente con
la matriz para cualquier acceso directo con la anon key.

Alcance real de esa defensa, medido el 2026-08-24: **ningún** camino de la
aplicación ejerce RLS hoy (49 de 76 rutas usan service_role; el navegador nunca
consulta tablas), y `v_entregas_full` no tiene `security_invoker`, por lo que las
políticas SELECT tampoco aplican al leer el tablero. Cubre únicamente el acceso
REST directo con la anon key. Registrado como **TD-002** en `docs/tech-debt.md` y
especificado en `docs/plan-rls-enforcement-user-scoped-client.md`.

## Verification

- `npx tsc --noEmit` limpio; `npx next build` exitoso.
- Migración probada primero en transacción con `ROLLBACK`, luego aplicada a producción.
  Verificado en `pg_policies`: 8 políticas, escritura = `master` + `entregas_editor`,
  lectura = data viewers + ambos roles de entregas, en las dos tablas.
- `ajradaa@gmail.com` movido de `torredecontrol` a `entregas_editor` en Supabase Auth
  (`app_metadata.role`); roster releído y confirmado.

## Follow-up not done

- **`isSuperuser` no aplica en la página.** `requireRole` permite además a
  `SUPERUSER_EMAILS` (`src/lib/auth.ts`), pero `src/app/entregas/page.tsx` usa `can()`
  directo, sin ese bypass. Un superuser cuyo rol no esté en `DE` sería redirigido de
  la página aunque la API lo autorizara. Preexistente, no introducido aquí.
- **`marketing` puede ver entregas** vía `DATA_VIEWER_ROLES`, y el middleware no le
  bloquea `/entregas` — probablemente no intencional, dado que marketing está
  restringido al dashboard y a fuentes de leads.
- Sigue sin haber UI de administración para asignar roles distintos de `ventas`;
  `entregas_editor` se asigna a mano en Supabase Auth.
- `antonio.rada@puertaabierta.com.gt` sigue en `torredecontrol` — es la segunda cuenta
  de la misma persona y ahora tiene solo lectura sobre entregas. Confirmar si esa
  cuenta debe conservarse.
