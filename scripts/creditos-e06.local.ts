/**
 * E06 acceptance checks — the closing path, with the Entregas keys appointment SIMULATED.
 * Local Supabase only; never reads .env.local. The simulation is temporary (see
 * src/lib/creditos/lab.ts) and is replaced by the real Entregas gate.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { CreditoService } from "../src/lib/creditos/service";
import { SupabaseCreditoRepo } from "../src/lib/creditos/supabase-repo";
import { nextStates } from "../src/lib/creditos/state-machine";
import { isLocalLab, ORIGEN_SIMULADO } from "../src/lib/creditos/lab";
import type { CreditType, CreditSubtype, ExpedienteState } from "../src/lib/creditos/model.generated";

const API = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";
if (!["127.0.0.1", "localhost"].includes(new URL(API).hostname) || !ANON || !KEY) {
  throw new Error("Solo Supabase local, con LOCAL_SUPABASE_ANON_KEY y LOCAL_SUPABASE_SERVICE_KEY.");
}

/** Each credit type's own road to «escrituración completada», after «expediente completo». */
const HASTA_ESCRITURA: Record<CreditType, ExpedienteState[]> = {
  contado: ["autorizacion_contado", "aprobado", "en_escrituracion", "escrituracion_completada"],
  directo: ["en_analisis", "aprobado", "tecnico_validado", "aprobacion_final", "en_escrituracion", "escrituracion_completada"],
  fha: ["en_analisis", "aprobado", "tecnico_validado", "aprobacion_final", "en_escrituracion", "escrituracion_completada"],
};
/** And from the delivery on. Contado files straight from the registry. */
const TRAS_ENTREGA: Record<CreditType, ExpedienteState[]> = {
  contado: ["firma_completada", "impuestos_pagados", "registrado_rgp", "archivado"],
  directo: ["firma_completada", "impuestos_pagados", "registrado_rgp", "desembolso_parcial", "liquidado", "archivado"],
  fha: ["firma_completada", "impuestos_pagados", "registrado_rgp", "desembolso_parcial", "liquidado", "archivado"],
};

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
    const email = `e06.${role}.${tag}@lab.local`;
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

  // The guard that keeps the simulation out of production. Pure; no network.
  check("guard accepts the local lab", isLocalLab("http://127.0.0.1:54321") && isLocalLab("http://localhost:54321"));
  check("guard refuses the production host", !isLocalLab("https://nqaexbpteletuwdbpixq.supabase.co"));
  check("guard refuses a missing or unparsable URL", !isLocalLab(undefined) && !isLocalLab("") && !isLocalLab("127.0.0.1"));

  const { service, actor } = await session("creditos");
  {
    const client = await insert("rv_clients", { full_name: `Cliente E06 ${tag}` });
    const project = await insert("projects", { name: `E06 ${tag}`, slug: `e06-${tag}` });
    const tower = await insert("towers", { project_id: project.id, name: "Torre E06" });
    const floor = await insert("floors", { tower_id: tower.id, number: 1 });
    let unitCounter = 100;
    async function purchase() {
      const unit = await insert("rv_units", { floor_id: floor.id, unit_number: `${++unitCounter}`, status: "SOLD" });
      const reservation = await insert("reservations", { unit_id: unit.id, status: "CONFIRMED" });
      await insert("reservation_clients", { reservation_id: reservation.id, client_id: client.id, is_primary: true });
      return reservation.id as string;
    }
    const estado = async (id: string) => (await service.detail(id)).expediente.state;
    /** A new expediente carried to «escrituración completada» along its own road. */
    async function enEscritura(type: CreditType, subtype: CreditSubtype) {
      const id = await service.crear(await purchase(), type, subtype, actor);
      for (const item of (await service.detail(id)).checklist.filter((item) => item.isRequired)) {
        await service.marcar(id, item.id, "recibido", actor);
      }
      await service.avanzar(id, "expediente_completo", actor);
      for (const to of HASTA_ESCRITURA[type]) await service.avanzar(id, to, actor);
      return id;
    }

    async function cierre(type: CreditType, subtype: CreditSubtype) {
      const id = await service.crear(await purchase(), type, subtype, actor);
      for (const item of (await service.detail(id)).checklist.filter((item) => item.isRequired)) {
        await service.marcar(id, item.id, "recibido", actor);
      }
      await service.avanzar(id, "expediente_completo", actor);
      for (const to of HASTA_ESCRITURA[type].slice(0, -1)) await service.avanzar(id, to, actor);

      // Too early: the simulation refuses anywhere but «escrituración completada».
      check(`${type}: delivery cannot be simulated at en_escrituracion`,
        !(await service.marcarEntregado(id, actor, ORIGEN_SIMULADO)) && await estado(id) === "en_escrituracion");
      await service.avanzar(id, "escrituracion_completada", actor);

      // Locked where Rosio is: nothing is offered, and entregado cannot be typed by hand.
      check(`${type}: nothing is offered at escrituracion_completada`,
        nextStates(type, "escrituracion_completada").filter((to) => to !== "desistido").length === 0);
      await assert.rejects(() => service.avanzar(id, "entregado", actor), /no se marca a mano/);
      check(`${type}: entregado still refused by hand`, await estado(id) === "escrituracion_completada");

      // The simulated keys appointment.
      check(`${type}: simulated delivery moves it to entregado`,
        await service.marcarEntregado(id, actor, ORIGEN_SIMULADO) && await estado(id) === "entregado");
      const evento = (await service.detail(id)).history.find((entry) => entry.toState === "entregado");
      check(`${type}: the history marks the delivery as simulated`,
        evento?.detail?.origen === ORIGEN_SIMULADO && evento.actorId === actor);
      check(`${type}: a second simulation does nothing`,
        !(await service.marcarEntregado(id, actor, ORIGEN_SIMULADO)) &&
        (await service.detail(id)).history.filter((entry) => entry.toState === "entregado").length === 1);

      // The tail, each step as the screen would offer it.
      for (const to of TRAS_ENTREGA[type]) {
        const from = await estado(id);
        if (type === "contado" && from === "registrado_rgp") {
          // E06-05 and E06-06: Contado neither disburses nor liquidates.
          await assert.rejects(() => service.avanzar(id, "desembolso_parcial", actor), /No permitido en contado/);
          await assert.rejects(() => service.avanzar(id, "liquidado", actor), /No permitido en contado/);
          check("contado: desembolso and liquidación refused at registrado_rgp", await estado(id) === "registrado_rgp");
        }
        if (type !== "contado" && from === "registrado_rgp") {
          await assert.rejects(() => service.avanzar(id, "archivado", actor), new RegExp(`No permitido en ${type}`));
          check(`${type}: cannot file before desembolso and liquidación`, await estado(id) === "registrado_rgp");
        }
        check(`${type}: ${from} offers ${to}`,
          nextStates(type, from).filter((next) => next !== "desistido").join() === to);
        await service.avanzar(id, to, actor);
      }
      check(`${type}: E06-08 archivado reached`, await estado(id) === "archivado");

      // Archived keeps everything and takes nothing more.
      await assert.rejects(() => service.avanzar(id, "desistido", actor, { reason: "equipo_desiste" }), /terminal/);
      const detail = await service.detail(id);
      check(`${type}: archivado is terminal, and keeps its data and history`,
        detail.expediente.active && detail.expediente.state === "archivado" &&
        detail.history.filter((entry) => entry.action === "transicion").length ===
          1 + HASTA_ESCRITURA[type].length + 1 + TRAS_ENTREGA[type].length);
    }

    await cierre("contado", "contado_individual");
    await cierre("directo", "directo_relacion_dependencia");
    await cierre("fha", "fha_relacion_dependencia");

    // The real caller's path is unchanged: with no origin given, it records the appointment.
    const real = await enEscritura("directo", "directo_negocio_propio");
    await service.marcarEntregado(real, actor);
    check("without an origin, the delivery still records «cita de llaves completada»",
      (await service.detail(real)).history.find((entry) => entry.toState === "entregado")?.detail?.origen ===
        "cita de llaves completada");

    console.log(`${checks} checks passed. Fixtures retained only in the local lab.`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
