# Plan — Hacer que RLS realmente se aplique (cliente Supabase con contexto de usuario)

**Status:** OPEN — especificado, no agendado.
**Flagged:** 2026-08-24, al aplicar la migración 072 (`entregas_editor`).
**Registry:** TD-002 en `docs/tech-debt.md`.
**Severity:** Media. No hay vulnerabilidad activa. Es una capa de defensa faltante,
no un hueco abierto.

---

## 1. Problema

Las políticas RLS del proyecto no las ejerce ningún camino de la aplicación.

Hechos verificados contra el código y contra producción el 2026-08-24:

| Hecho | Verificación |
|---|---|
| **49 de 76** archivos `route.ts` usan `createAdminClient()` (service_role) | `grep -rl createAdminClient src/app/api` |
| No existe cliente Supabase de servidor con contexto de usuario | `src/lib/supabase/` solo tiene `admin.ts` y `client.ts` |
| El cliente de navegador **nunca** consulta tablas | `grep -rn "supabaseBrowser\.from("` → **0 resultados** |
| **7 de 11** vistas no tienen `security_invoker` | `pg_class.reloptions` en producción (PG 17.6) |
| Solo **1** ruta con service_role no tiene guard de auth | `src/app/api/public/units/route.ts` — pública por diseño (ISR 300s) |

Consecuencia: el service_role omite RLS en el servidor, y el navegador nunca
consulta tablas. **Ninguna consulta de la aplicación pasa hoy por una política RLS.**

### 1.1 El problema de las vistas es independiente y más grave

En PostgreSQL, una vista sin `security_invoker = true` se ejecuta con los permisos
de **su dueño**, no del que consulta. El dueño de estas vistas es dueño de las tablas
y por lo tanto omite RLS.

Estas 7 vistas no lo tienen:

```
v_creditos_unit_full      v_rv_referrals_full
v_entregas_full           v_rv_unit_sale_counts
v_reservations_pending    v_rv_units_full
v_rv_projects_with_towers
```

Esto importa directamente: el tablero de entregas lee `v_entregas_full`
(`src/app/api/entregas/route.ts:28`), y el selector de unidades lee `v_rv_units_full`
(`:83`). **Aunque mañana se cambiara el cliente por uno con contexto de usuario, esas
lecturas seguirían omitiendo las políticas SELECT de la migración 072.** Cambiar el
cliente sin arreglar las vistas produce una falsa sensación de cobertura.

Las 4 vistas que sí lo tienen (`cash_flow_forecast`, `delinquent_accounts`,
`payment_compliance`, `v_cesion_derechos`) confirman que la intención existía; el
ajuste simplemente no se aplicó de forma consistente.

### 1.2 La deriva respecto al contrato que el propio código declara

`src/lib/supabase/admin.ts` documenta su alcance previsto:

> Use ONLY in server-side API routes for operations that require it:
> Calling SECURITY DEFINER functions, writing to `receipt_extractions`,
> managing storage objects.

El uso real —49 rutas, incluidas lecturas simples de tablero— excede ese contrato
por mucho. El comentario de seguridad del archivo ya no describe cómo se usa.

Igualmente, la migración 040 justifica sus políticas así:

> Defense-in-depth: API routes already filter by salesperson_id, but these policies
> prevent data leakage if a new route omits the filter **or if the browser client
> queries Supabase directly.**

El segundo supuesto nunca se materializó (0 consultas directas del navegador), y el
primero está anulado por el service_role.

---

## 2. Qué NO está mal (delimitación honesta)

No inflar esto. Verificado:

- **La autorización sí funciona.** 48 de las 49 rutas con service_role llaman
  `requireRole` / `requireAuth` / `requireSuperuser` / `requireSalesperson`. La única
  excepción es `/api/public/units`, que es pública deliberadamente.
- **Las 4 rutas de entregas están correctamente protegidas** con
  `requireRole(rolesFor("entregas", …))`.
- **No hay filtración conocida hoy.** El riesgo es la ausencia de una segunda capa,
  no una primera capa rota.
- **`jwt_role()` ya es compatible.** Lee
  `request.jwt.claims -> app_metadata ->> 'role'`, que es exactamente lo que un
  cliente con el JWT del usuario provee. Las políticas existentes funcionarían sin
  reescribirse.

---

## 3. Riesgo que justifica el trabajo

La autorización de 49 rutas depende por completo de que cada autor recuerde llamar
`requireRole`. No hay red de seguridad en la base de datos:

1. Una ruta nueva que omita el guard queda totalmente abierta a cualquier usuario autenticado.
2. Un error en la matriz de permisos o en `getUserRole` no tiene contención.
3. Si la anon key se filtrara, cualquiera con un login válido consultaría las tablas
   por REST — ese camino **sí** pasa por RLS, y es el único que hoy la ejercita.

El punto 3 es la razón por la que RLS no es decorativa y la migración 072 sí tenía
sentido: cubre la superficie REST directa. Pero no cubre el tráfico de la app.

---

## 4. Diseño propuesto

### 4.1 Nuevo cliente con contexto de usuario

Crear `src/lib/supabase/server.ts` con `createServerClient` de `@supabase/ssr`,
usando la **anon key** y las cookies de sesión. Las consultas corren como el usuario
autenticado y `request.jwt.claims` queda poblado, por lo que `jwt_role()` resuelve y
las políticas aplican.

El patrón de lectura de cookies ya existe en `src/lib/auth.ts` (`getSupabaseAuthClient`),
hoy usado solo para `getUser()`. Extraerlo en lugar de duplicarlo.

### 4.2 Dónde el service_role debe quedarse

No es un reemplazo total. Se conserva `createAdminClient()` para:

- Funciones `SECURITY DEFINER` (`submit_reservation`, confirm, reject, desist).
- Escrituras a `receipt_extractions` y objetos de Storage.
- `/api/public/units` — no existe usuario; es un endpoint público con ISR.
- Operaciones administrativas legítimas que crucen fronteras de RLS, si aparecen.

Es decir: devolver `admin.ts` al alcance que su propio comentario ya declara.

### 4.3 Arreglar las vistas

Migración aparte, previa o simultánea:

```sql
ALTER VIEW v_entregas_full SET (security_invoker = true);
```

…para las 7 vistas listadas. **Requiere revisar cada vista primero**: si alguna se
apoya en omitir RLS para resolver un JOIN (p. ej. `v_rv_units_full` uniendo
`reservations` que `ventas` solo ve parcialmente), activar `security_invoker` puede
devolver menos filas y romper pantallas. Este es el riesgo real del plan y debe
probarse vista por vista, con cada rol.

---

## 5. Despliegue por fases

**Fase 0 — Vistas.** Auditar las 7 vistas, activar `security_invoker` donde sea seguro,
documentar las que no lo sean y por qué. Probar cada vista con cada rol.

**Fase 1 — Entregas (piloto, 4 rutas).** Migrar
`/api/entregas`, `/api/entregas/candidatos`, `/api/entregas/citas/[id]` al cliente con
contexto de usuario. Superficie pequeña, políticas recién escritas y verificadas
(migración 072), y los 4 roles de prueba ya existen en producción. Si el patrón falla,
falla acotado.

**Fase 2 — Evaluar.** Con el piloto en producción, decidir si el patrón se generaliza.
Puede que no valga la pena para las 45 rutas restantes; esa decisión se toma con datos,
no ahora.

**Fase 3 — Generalizar** (solo si la Fase 2 lo justifica). Ruta por ruta, no en masa.

---

## 6. Verificación exigida

Por cada ruta migrada:

- Un usuario real de cada rol (`master`, `entregas_editor`, `torredecontrol`,
  `gerencia`, `ventas`) contra la ruta: comprobar que quien debe leer lee, quien debe
  escribir escribe, y el resto recibe 403 o conjunto vacío.
- Confirmar que el rechazo llega **de RLS** y no solo de `requireRole` — quitando
  temporalmente el guard en un entorno de prueba, nunca en producción.
- `npx tsc --noEmit` limpio y `npx next build` exitoso.
- Migraciones de vistas probadas primero en transacción con `ROLLBACK`
  (ver `docs/SOP-run-migration.md`).

No se declara terminado hasta que un rechazo por RLS quede demostrado.

---

## 7. Preguntas abiertas

1. ¿Se generaliza a las 45 rutas restantes o el patrón se queda en los recursos
   sensibles (entregas, reservas, pagos, comisiones)? Decisión de negocio, no técnica.
2. ¿Alguna de las 7 vistas depende de omitir RLS para funcionar? Hay que medirlo antes
   de tocarlas.
3. ¿`/api/public/units` debería usar la anon key con una política SELECT permisiva en
   vez de service_role? Reduciría la superficie del service_role, pero es de bajo valor
   y no bloquea nada.

---

## 8. Estimación

- Fase 0 (vistas): media jornada, dominada por las pruebas por rol.
- Fase 1 (piloto entregas): media jornada.
- Fases 2–3: sin estimar hasta tener el resultado del piloto.

## 9. Contexto

Detectado el 2026-08-24 durante el cambio de RBAC del changelog 098
(rol `entregas_editor`, `torredecontrol` a solo lectura en entregas). La migración 072
se aplicó y es correcta; este documento existe porque describir esas políticas como
"el control de acceso" habría sido inexacto.
