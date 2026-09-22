/** E05 acceptance checks — Avance de Directo y FHA. Local Supabase only; never reads .env.local. */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { CreditoService } from "../src/lib/creditos/service";
import { SupabaseCreditoRepo } from "../src/lib/creditos/supabase-repo";
import { nextStates } from "../src/lib/creditos/state-machine";
import type { CreditType, CreditSubtype, ExpedienteState } from "../src/lib/creditos/model.generated";

const API = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";
if (!["127.0.0.1", "localhost"].includes(new URL(API).hostname) || !ANON || !KEY) {
  throw new Error("Solo Supabase local, con LOCAL_SUPABASE_ANON_KEY y LOCAL_SUPABASE_SERVICE_KEY.");
}

/** How many times the analysis loop is run. E05-03 says «sin límite de veces». */
const VUELTAS = 3;

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
    const email = `e05.${role}.${tag}@lab.local`;
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
    const client = await insert("rv_clients", { full_name: `Cliente E05 ${tag}` });
    const project = await insert("projects", { name: `E05 ${tag}`, slug: `e05-${tag}` });
    const tower = await insert("towers", { project_id: project.id, name: "Torre E05" });
    const floor = await insert("floors", { tower_id: tower.id, number: 1 });
    let unitCounter = 100;
    async function purchase() {
      const unit = await insert("rv_units", { floor_id: floor.id, unit_number: `${++unitCounter}`, status: "SOLD" });
      const reservation = await insert("reservations", { unit_id: unit.id, status: "CONFIRMED" });
      await insert("reservation_clients", { reservation_id: reservation.id, client_id: client.id, is_primary: true });
      return reservation.id as string;
    }
    /** A new expediente, already carried to «expediente completo». */
    async function completo(type: CreditType, subtype: CreditSubtype) {
      const id = await service.crear(await purchase(), type, subtype, actor);
      for (const item of (await service.detail(id)).checklist.filter((item) => item.isRequired)) {
        await service.marcar(id, item.id, "recibido", actor);
      }
      await service.avanzar(id, "expediente_completo", actor);
      return id;
    }
    const estado = async (id: string) => (await service.detail(id)).expediente.state;
    const offered = (type: CreditType, state: ExpedienteState) =>
      nextStates(type, state).filter((to) => to !== "desistido");

    /** The whole of E05, walked once for a credit type. */
    async function recorrido(type: CreditType, subtype: CreditSubtype, viaReanalisis: boolean) {
      const id = await completo(type, subtype);

      // E05-01 — el envío a análisis, con Banco y FHA como un solo estado.
      check(`${type}: only en_analisis offered from expediente_completo`,
        offered(type, "expediente_completo").join() === "en_analisis");
      await assert.rejects(() => service.avanzar(id, "autorizacion_contado", actor),
        new RegExp(`No permitido en ${type}`));
      check(`${type}: the contado authorization is refused`, await estado(id) === "expediente_completo");
      await service.avanzar(id, "en_analisis", actor);
      check(`${type}: E05-01 en_analisis registered`, await estado(id) === "en_analisis");
      check(`${type}: en_analisis offers the fork suspendido/aprobado`,
        offered(type, "en_analisis").slice().sort().join() === "aprobado,suspendido");

      if (viaReanalisis) {
        // E05-02 and E05-03 — suspensión, reanálisis, and round again, uncapped.
        for (let vuelta = 1; vuelta <= VUELTAS; vuelta += 1) {
          await service.avanzar(id, "suspendido", actor);
          check(`${type}: E05-02 suspendido registered, turn ${vuelta}`, await estado(id) === "suspendido");
          await service.avanzar(id, "en_reanalisis", actor);
          check(`${type}: E05-03 en_reanalisis registered, turn ${vuelta}`, await estado(id) === "en_reanalisis");
        }
        const history = (await service.detail(id)).history;
        const vueltas = history.filter((entry) => entry.toState === "en_reanalisis").length;
        check(`${type}: every one of the ${VUELTAS} turns kept its history`, vueltas === VUELTAS);
        check(`${type}: no turn was lost to suspendido either`,
          history.filter((entry) => entry.toState === "suspendido").length === VUELTAS);
        check(`${type}: en_reanalisis offers the same fork as en_analisis`,
          offered(type, "en_reanalisis").slice().sort().join() === "aprobado,suspendido");
      }

      // E05-04 — la aprobación, desde donde el expediente esté.
      const desde = await estado(id);
      await service.avanzar(id, "aprobado", actor);
      check(`${type}: E05-04 aprobado reached from ${desde}`, await estado(id) === "aprobado");

      // E05-05 and E05-06 — expediente técnico, then aprobación final.
      await assert.rejects(() => service.avanzar(id, "en_escrituracion", actor),
        new RegExp(`No permitido en ${type}`));
      check(`${type}: escrituración cannot skip the technical review`, await estado(id) === "aprobado");
      await service.avanzar(id, "tecnico_validado", actor);
      check(`${type}: E05-05 tecnico_validado registered`, await estado(id) === "tecnico_validado");
      await service.avanzar(id, "aprobacion_final", actor);
      check(`${type}: E05-06 aprobacion_final registered`, await estado(id) === "aprobacion_final");
      check(`${type}: the next allowed move is escrituración`,
        offered(type, "aprobacion_final").join() === "en_escrituracion");

      // E05 stops here: the tail from escrituración on is E06.
      check(`${type}: every advance kept its actor`, (await service.detail(id)).history
        .filter((entry) => entry.action === "transicion")
        .every((entry) => entry.actorId === actor));
      return id;
    }

    // Directo and FHA, each walked in full — once through the loop, once straight.
    await recorrido("directo", "directo_relacion_dependencia", true);
    await recorrido("fha", "fha_relacion_dependencia", true);
    const directo = await recorrido("directo", "directo_negocio_propio", false);
    check("aprobado was reached straight from en_analisis too",
      (await service.detail(directo)).history.some(
        (entry) => entry.fromState === "en_analisis" && entry.toState === "aprobado"));
    check("that expediente never entered the analysis loop",
      !(await service.detail(directo)).history.some((entry) => entry.toState === "suspendido"));

    // The mirror of E04's guard: contado cannot borrow the banking states.
    const contado = await completo("contado", "contado_individual");
    for (const to of ["en_analisis", "suspendido", "en_reanalisis", "tecnico_validado", "aprobacion_final"] as const) {
      await assert.rejects(() => service.avanzar(contado, to, actor), /No permitido en contado/);
    }
    check("contado still refuses every banking state", await estado(contado) === "expediente_completo");

    // Out of E05 on purpose: notes are E08, desistimiento is E07.
    await assert.rejects(() => service.avanzar(contado, "desistido", actor), /motivo/);
    check("desistido still refuses without a motive (E07)",
      await estado(contado) === "expediente_completo");

    console.log(`${checks} checks passed. Fixtures retained only in the local lab.`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
