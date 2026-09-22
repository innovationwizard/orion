/**
 * Recorrido completo del módulo Créditos contra el Supabase LOCAL.
 *
 *   npx tsx scripts/creditos-smoke.local.ts
 *
 * Ejercita el servicio de dominio y el repositorio exactamente como lo hará la
 * pantalla: con la sesión de un usuario con rol `creditos`, de modo que las políticas
 * RLS aplican en cada consulta. Es lo que distingue «compila» de «funciona».
 *
 * SOLO LOCAL. Se niega a correr contra cualquier cosa que no sea 127.0.0.1, y los
 * datos que crea son de laboratorio, claramente marcados.
 */
import { createClient } from "@supabase/supabase-js";
import { CreditoService, DomainError } from "../src/lib/creditos/service";
import { SupabaseCreditoRepo } from "../src/lib/creditos/supabase-repo";

const API = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";

if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(API)) {
  throw new Error(`Este guion solo corre contra el Supabase local. Recibió: ${API}`);
}
if (!ANON || !SERVICE) {
  throw new Error("Faltan LOCAL_SUPABASE_ANON_KEY y LOCAL_SUPABASE_SERVICE_KEY");
}

async function main() {
  const admin = createClient(API, SERVICE, { auth: { persistSession: false } });

  const results: { paso: string; ok: boolean; detalle: string }[] = [];
  function check(paso: string, ok: boolean, detalle = "") {
    results.push({ paso, ok, detalle });
  }
  async function debeFallar(paso: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      check(paso, false, "lo aceptó");
    } catch (e) {
      check(paso, e instanceof DomainError, (e as Error).message.slice(0, 60));
    }
  }

  // --- datos de laboratorio ---------------------------------------------------
  const tag = Date.now().toString(36);
  const { data: project } = await admin
    .from("projects")
    .insert({ name: `Lab ${tag}`, slug: `lab-${tag}` })
    .select()
    .single();
  const { data: tower } = await admin
    .from("towers")
    .insert({ project_id: project!.id, name: "Única" })
    .select()
    .single();
  const { data: floor } = await admin
    .from("floors")
    .insert({ tower_id: tower!.id, number: 12 })
    .select()
    .single();
  const { data: unit } = await admin
    .from("rv_units")
    .insert({ floor_id: floor!.id, unit_number: `12-${tag.slice(-2)}`, status: "SOLD" })
    .select()
    .single();
  const { data: client } = await admin
    .from("rv_clients")
    .insert({ full_name: "Cliente de laboratorio" })
    .select()
    .single();
  const { data: confirmada } = await admin
    .from("reservations")
    .insert({ unit_id: unit!.id, status: "CONFIRMED" })
    .select()
    .single();
  await admin
    .from("reservation_clients")
    .insert({ reservation_id: confirmada!.id, client_id: client!.id, is_primary: true });

  // Una segunda unidad con reserva sin confirmar, para probar que se rechaza.
  const { data: unit2 } = await admin
    .from("rv_units")
    .insert({ floor_id: floor!.id, unit_number: `12-${tag.slice(-2)}b`, status: "RESERVED" })
    .select()
    .single();
  const { data: pendiente } = await admin
    .from("reservations")
    .insert({ unit_id: unit2!.id, status: "PENDING_REVIEW" })
    .select()
    .single();

  // --- el usuario de Créditos, con su rol en el token -------------------------
  const email = `creditos.${tag}@lab.local`;
  const password = `lab-${tag}-${tag}`;
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "creditos" },
  });
  if (userError) throw userError;
  const actorId = created.user!.id;

  const userClient = createClient(API, ANON, { auth: { persistSession: false } });
  const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const service = new CreditoService(new SupabaseCreditoRepo(userClient));

  // --- el recorrido -----------------------------------------------------------
  const disponibles = await service.reservationsAvailable();
  check(
    "la reserva confirmada aparece para abrir expediente",
    disponibles.some((r) => r.id === confirmada!.id),
    `${disponibles.length} disponibles`,
  );
  check(
    "la reserva sin confirmar no aparece",
    !disponibles.some((r) => r.id === pendiente!.id),
  );

  await debeFallar("no se abre expediente sobre una reserva sin confirmar", () =>
    service.crear(pendiente!.id, "fha", "fha_relacion_dependencia", actorId),
  );
  await debeFallar("no se acepta un subtipo de otro tipo de crédito", () =>
    service.crear(confirmada!.id, "contado", "fha_extranjero", actorId),
  );

  const expedienteId = await service.crear(
    confirmada!.id,
    "fha",
    "fha_relacion_dependencia",
    actorId,
  );
  check("expediente creado", Boolean(expedienteId), String(expedienteId).slice(0, 8));

  let detalle = await service.detail(expedienteId);
  check("nace en armado", detalle.expediente.state === "en_armado", detalle.expediente.state);
  check("con su checklist copiado", detalle.checklist.length === 10, `${detalle.checklist.length} documentos`);
  check("y su primer evento", detalle.history.length === 1, detalle.history[0]?.action ?? "");
  check(
    "la reserva ya no se ofrece",
    !(await service.reservationsAvailable()).some((r) => r.id === confirmada!.id),
  );

  await debeFallar("no se declara completo con documentos pendientes", () =>
    service.avanzar(expedienteId, "expediente_completo", actorId),
  );

  // Un documento que el banco pidió y el catálogo no lista — mientras el expediente
  // sigue en armado. Después de completo el candado del checklist lo impide (probado
  // en creditos-e02.local.ts, que también cubre los ocho subtipos).
  const extraId = await service.agregarDocumento(
    expedienteId,
    { documentKey: "carta_banco_extra", name: "Carta adicional que pidió el banco", condition: null, isRequired: true },
    actorId,
  );
  detalle = await service.detail(expedienteId);
  check(
    "el documento agregado detiene el avance cuando es obligatorio",
    detalle.checklist.find((i) => i.id === extraId)?.isRequired === true &&
      detalle.checklist.find((i) => i.id === extraId)?.state === "pendiente",
    "agregado, obligatorio, pendiente",
  );

  for (const item of detalle.checklist.filter((i) => i.isRequired)) {
    await service.marcar(expedienteId, item.id, "recibido", actorId);
  }
  detalle = await service.detail(expedienteId);
  check(
    "quedan solo los condicionales pendientes",
    CreditoService.pendientes(detalle.checklist).length === 0,
    `${detalle.checklist.filter((i) => i.state === "pendiente").length} sin marcar, ninguno obligatorio (incluye el agregado)`,
  );

  await service.avanzar(expedienteId, "expediente_completo", actorId);
  await debeFallar("no se salta al final del proceso", () =>
    service.avanzar(expedienteId, "archivado", actorId),
  );
  await debeFallar("«entregado» no se marca a mano", () =>
    service.avanzar(expedienteId, "entregado", actorId),
  );
  await debeFallar("desistir exige motivo", () => service.avanzar(expedienteId, "desistido", actorId));

  await service.avanzar(expedienteId, "en_analisis", actorId);
  await service.avanzar(expedienteId, "suspendido", actorId, { note: "El banco pidió más papelería" });
  await service.avanzar(expedienteId, "en_reanalisis", actorId);
  await service.avanzar(expedienteId, "suspendido", actorId);
  await service.avanzar(expedienteId, "en_reanalisis", actorId);
  await service.avanzar(expedienteId, "aprobado", actorId);
  detalle = await service.detail(expedienteId);
  check("el ciclo de suspensión no tiene tope", detalle.expediente.state === "aprobado", detalle.expediente.state);

  await service.anotar(expedienteId, "El cliente quiere pasarse a contado", actorId);
  await service.editarCumplimiento(expedienteId, "pep", actorId);

  // El candado del checklist también alcanza a un expediente mucho más adelante que
  // «expediente completo» — aquí, en aprobado, camino a escrituración. Ni una marca
  // ni un documento nuevo se aceptan.
  await debeFallar("no se marca un documento tan lejos como aprobado", () =>
    service.marcar(expedienteId, extraId, "pendiente", actorId),
  );
  await debeFallar("ni se agrega uno nuevo tan lejos como aprobado", () =>
    service.agregarDocumento(
      expedienteId,
      { documentKey: "tardio", name: "Documento tardío", condition: null, isRequired: false },
      actorId,
    ),
  );

  await debeFallar("el tipo de crédito no se puede cambiar", async () => {
    const { error } = await userClient
      .from("pai_credito_expediente")
      .update({ credit_subtype: "fha_extranjero" })
      .eq("id", expedienteId);
    if (error) throw new DomainError(error.message);
    throw new Error("lo aceptó");
  });

  detalle = await service.detail(expedienteId);
  check(
    "el historial guarda cada paso",
    detalle.history.length >= 18,
    `${detalle.history.length} eventos`,
  );
  check(
    "cada evento dice quién lo hizo",
    detalle.history.every((h) => h.actorId === actorId),
  );

  await service.eliminar(expedienteId, actorId);
  check(
    "eliminado, la reserva vuelve a ofrecerse",
    (await service.reservationsAvailable()).some((r) => r.id === confirmada!.id),
  );
  const listado = await service.list({});
  check("y sale del listado", !listado.some((e) => e.id === expedienteId), `${listado.length} en el listado`);
  check(
    "pero su historial sigue ahí",
    (await service.detail(expedienteId)).history.length >= 19,
  );

  // --- informe ----------------------------------------------------------------
  const ancho = Math.max(...results.map((r) => r.paso.length));
  for (const [i, r] of results.entries()) {
    console.log(`${String(i + 1).padStart(2)} ${r.ok ? "OK   " : "FALLA"}  ${r.paso.padEnd(ancho)}  ${r.detalle}`);
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok} de ${results.length} pasos correctos`);
  process.exit(ok === results.length ? 0 : 1);

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
