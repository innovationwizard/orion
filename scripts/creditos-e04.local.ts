/** E04 acceptance checks — Avance de Contado. Local Supabase only; never reads .env.local. */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { CreditoService } from "../src/lib/creditos/service";
import { SupabaseCreditoRepo } from "../src/lib/creditos/supabase-repo";
import { nextStates } from "../src/lib/creditos/state-machine";
import type { ExpedienteState } from "../src/lib/creditos/model.generated";

const API = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";
if (!["127.0.0.1", "localhost"].includes(new URL(API).hostname) || !ANON || !KEY) {
  throw new Error("Solo Supabase local, con LOCAL_SUPABASE_ANON_KEY y LOCAL_SUPABASE_SERVICE_KEY.");
}

/** The states Contado must never reach. Asked for at every step, not just once. */
const BANCARIOS: ExpedienteState[] = [
  "en_analisis", "suspendido", "en_reanalisis", "tecnico_validado", "aprobacion_final",
];

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
    const email = `e04.${role}.${tag}@lab.local`;
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
    const client = await insert("rv_clients", { full_name: `Cliente E04 ${tag}` });
    const project = await insert("projects", { name: `E04 ${tag}`, slug: `e04-${tag}` });
    const tower = await insert("towers", { project_id: project.id, name: "Torre E04" });
    const floor = await insert("floors", { tower_id: tower.id, number: 1 });
    async function purchase(unitNumber: string) {
      const unit = await insert("rv_units", { floor_id: floor.id, unit_number: unitNumber, status: "SOLD" });
      const reservation = await insert("reservations", { unit_id: unit.id, status: "CONFIRMED" });
      await insert("reservation_clients", { reservation_id: reservation.id, client_id: client.id, is_primary: true });
      return reservation.id as string;
    }

    const contado = await service.crear(await purchase("101"), "contado", "contado_individual", actor);
    const fha = await service.crear(await purchase("102"), "fha", "fha_relacion_dependencia", actor);

    /** Every banking state is refused from wherever the expediente stands. */
    async function refusesBanking(where: ExpedienteState) {
      for (const to of BANCARIOS) {
        await assert.rejects(() => service.avanzar(contado, to, actor), /No permitido en contado/);
      }
      check(`banking states refused at ${where}, state still ${where}`,
        (await service.detail(contado)).expediente.state === where);
    }

    // Intake, so the Contado path has somewhere to start from.
    for (const item of (await service.detail(contado)).checklist.filter((item) => item.isRequired)) {
      await service.marcar(contado, item.id, "recibido", actor);
    }
    await service.avanzar(contado, "expediente_completo", actor);
    check("contado reaches expediente_completo",
      (await service.detail(contado)).expediente.state === "expediente_completo");
    await refusesBanking("expediente_completo");

    // The screen's contract: exactly one forward move is offered, and it is not desistido.
    const offered = (state: ExpedienteState) => nextStates("contado", state).filter((to) => to !== "desistido");
    check("screen offers only autorizacion_contado from expediente_completo",
      offered("expediente_completo").join() === "autorizacion_contado");

    // E04-01 — la autorización de venta al contado.
    await assert.rejects(() => service.avanzar(contado, "aprobado", actor), /No permitido en contado/);
    check("aprobado cannot be reached by skipping the authorization",
      (await service.detail(contado)).expediente.state === "expediente_completo");
    await service.avanzar(contado, "autorizacion_contado", actor);
    check("E04-01 autorizacion_contado registered",
      (await service.detail(contado)).expediente.state === "autorizacion_contado");
    await refusesBanking("autorizacion_contado");
    check("screen offers only aprobado from autorizacion_contado",
      offered("autorizacion_contado").join() === "aprobado");

    // E04-02 — la aprobación interna, sin banco.
    await service.avanzar(contado, "aprobado", actor);
    check("E04-02 aprobado registered without any bank approval",
      (await service.detail(contado)).expediente.state === "aprobado");
    await refusesBanking("aprobado");
    check("screen offers only en_escrituracion from aprobado",
      offered("aprobado").join() === "en_escrituracion");

    // E04-03 — de Aprobado a Escrituración, sin expediente técnico ni aprobación final.
    await service.avanzar(contado, "en_escrituracion", actor);
    check("E04-03 en_escrituracion reached directly from aprobado",
      (await service.detail(contado)).expediente.state === "en_escrituracion");

    const history = (await service.detail(contado)).history;
    const path = history
      .filter((entry) => entry.action === "transicion")
      .map((entry) => `${entry.fromState}>${entry.toState}`);
    check("history records the four advances in order", path.join(" ") ===
      "en_armado>expediente_completo expediente_completo>autorizacion_contado " +
      "autorizacion_contado>aprobado aprobado>en_escrituracion");
    check("history never passed through tecnico_validado or aprobacion_final",
      !history.some((entry) => entry.toState === "tecnico_validado" || entry.toState === "aprobacion_final"));
    check("every advance kept its actor", history
      .filter((entry) => entry.action === "transicion")
      .every((entry) => entry.actorId === actor));

    // The gate is per credit type, not per screen: FHA cannot borrow Contado's step.
    for (const item of (await service.detail(fha)).checklist.filter((item) => item.isRequired)) {
      await service.marcar(fha, item.id, "recibido", actor);
    }
    await service.avanzar(fha, "expediente_completo", actor);
    await assert.rejects(() => service.avanzar(fha, "autorizacion_contado", actor), /No permitido en fha/);
    check("fha cannot take the contado authorization",
      (await service.detail(fha)).expediente.state === "expediente_completo");
    check("screen offers no contado step to fha",
      !nextStates("fha", "expediente_completo").includes("autorizacion_contado"));

    // Out of E04 on purpose: desistimiento is E07, notes are E08.
    await assert.rejects(() => service.avanzar(contado, "desistido", actor), /motivo/);
    check("desistido still refuses without a motive (E07)",
      (await service.detail(contado)).expediente.state === "en_escrituracion");

    console.log(`${checks} checks passed. Fixtures retained only in the local lab.`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
