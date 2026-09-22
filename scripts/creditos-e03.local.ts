/** E03 acceptance checks. Local Supabase only; never reads .env.local. */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { CreditoService } from "../src/lib/creditos/service";
import { SupabaseCreditoRepo } from "../src/lib/creditos/supabase-repo";

const API = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";
if (!["127.0.0.1", "localhost"].includes(new URL(API).hostname) || !ANON || !KEY) {
  throw new Error("Solo Supabase local, con LOCAL_SUPABASE_ANON_KEY y LOCAL_SUPABASE_SERVICE_KEY.");
}

async function main() {
  const admin = createClient(API, KEY, { auth: { persistSession: false } });
  const tag = Date.now().toString(36);
  let checks = 0;
  function check(label: string, condition: boolean) {
    assert.ok(condition, label);
    console.log(`${++checks} OK ${label}`);
  }
  async function insert(table: string, values: Record<string, unknown>) {
    const { data, error } = await admin.from(table).insert(values).select().single();
    if (error) throw error;
    return data!;
  }
  async function session(role: string) {
    const email = `e03.${role}.${tag}@lab.local`;
    const password = `local-${tag}-password`;
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, app_metadata: { role },
    });
    if (error) throw error;
    const db = createClient(API, ANON, { auth: { persistSession: false } });
    const login = await db.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    return { service: new CreditoService(new SupabaseCreditoRepo(db)), actor: data.user.id };
  }
  const { service, actor } = await session("creditos");
  {
    const client = await insert("rv_clients", { full_name: `Cliente E03 ${tag}` });
    const projects: { id: string; floorId: string }[] = [];
    for (const name of ["A", "B"]) {
      const project = await insert("projects", { name: `E03 ${name} ${tag}`, slug: `e03-${name.toLowerCase()}-${tag}` });
      const tower = await insert("towers", { project_id: project.id, name: "Torre E03" });
      const floor = await insert("floors", { tower_id: tower.id, number: 1 });
      projects.push({ id: project.id, floorId: floor.id });
    }
    async function purchase(index: number, unitNumber: string) {
      const unit = await insert("rv_units", { floor_id: projects[index].floorId, unit_number: unitNumber, status: "SOLD" });
      const reservation = await insert("reservations", { unit_id: unit.id, status: "CONFIRMED" });
      await insert("reservation_clients", { reservation_id: reservation.id, client_id: client.id, is_primary: true });
      return reservation.id as string;
    }
    const a = await service.crear(await purchase(0, "101"), "contado", "contado_individual", actor);
    const b = await service.crear(await purchase(0, "102"), "fha", "fha_relacion_dependencia", actor);
    const c = await service.crear(await purchase(1, "201"), "directo", "directo_relacion_dependencia", actor);
    const detail = await service.detail(b);
    for (const item of detail.checklist.filter((item) => item.isRequired)) {
      await service.marcar(b, item.id, "recibido", actor);
    }
    await service.avanzar(b, "expediente_completo", actor);
    const byProject = await service.list({ companyId: projects[0].id });
    check("project filter returns both cases", byProject.length === 2 && byProject.every((row) => row.companyId === projects[0].id));
    check("list resolves client, tower and unit", byProject.every((row) => row.cliente === client.full_name && row.towerName === "Torre E03" && row.unitNumber));
    const grouped = Object.groupBy(byProject, (row) => row.state);
    check("state counts: one armado, one complete", grouped.en_armado?.length === 1 && grouped.expediente_completo?.length === 1);
    const combined = await service.list({ companyId: projects[0].id, creditType: "fha", state: "expediente_completo" });
    check("combined filters match exactly", combined.length === 1 && combined[0].id === b);
    check("type filter", (await service.list({ creditType: "directo" })).some((row) => row.id === c));
    check("state filter", (await service.list({ state: "expediente_completo" })).every((row) => row.state === "expediente_completo"));
    check("empty combination", (await service.list({ companyId: projects[1].id, creditType: "fha" })).length === 0);
    const all = await service.list();
    check("unfiltered list contains all projects", [a, b, c].every((id) => all.some((row) => row.id === id)));
    for (const value of ["normal", "pep", "cpe", null] as const) {
      await service.editarCumplimiento(b, value, actor);
      const reloaded = await service.detail(b);
      check(`category persists: ${value}`, reloaded.expediente.cumplimientoCategoria === value);
      const event = reloaded.history.at(-1)!;
      check("category audit includes actor and old/new values", event.action === "edicion" && event.actorId === actor &&
        (event.detail?.cumplimiento_categoria as { to: unknown }).to === value);
    }
    const reopened = await service.detail(b);
    check("reopen preserves checklist and state", reopened.expediente.state === "expediente_completo" &&
      reopened.checklist.filter((item) => item.isRequired).every((item) => item.state === "recibido"));
    await service.eliminar(a, actor);
    check("deleted excluded by default", !(await service.list({ companyId: projects[0].id })).some((row) => row.id === a));
    check("deleted included on request", (await service.list({ companyId: projects[0].id, includeDeleted: true })).some((row) => row.id === a && !row.active));
    check("deleted history retained", (await service.detail(a)).history.some((event) => event.action === "eliminacion"));
    await assert.rejects(() => service.editarCumplimiento(a, "normal", actor), /eliminado/);
    check("deleted category cannot be edited", true);
    const ventas = await session("ventas");
    check("ventas cannot list expedientes", (await ventas.service.list()).length === 0);
    await assert.rejects(() => ventas.service.editarCumplimiento(b, "pep", ventas.actor));
    check("ventas cannot edit category", (await service.detail(b)).expediente.cumplimientoCategoria === null);
    const master = await session("master");
    check("master can list cases", (await master.service.list({ companyId: projects[1].id })).some((row) => row.id === c));
    console.log(`${checks} checks passed. Fixtures retained only in the local lab.`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
