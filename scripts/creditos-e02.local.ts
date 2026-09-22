/**
 * E02 — el checklist, contra el Supabase LOCAL.
 *
 *   npx tsx scripts/creditos-e02.local.ts
 *
 * Recorre los ocho subtipos: marcar, corregir, lo condicional que no bloquea, el rechazo
 * con obligatorios pendientes, la declaración de completo, un documento agregado a mano,
 * dos marcas a la vez sobre el mismo documento, y un rol sin permiso.
 *
 * SOLO LOCAL. Se niega a correr contra cualquier cosa que no sea 127.0.0.1.
 */
import { createClient } from "@supabase/supabase-js";
import { CreditoService, DomainError } from "../src/lib/creditos/service";
import { SupabaseCreditoRepo } from "../src/lib/creditos/supabase-repo";
import { SUBTYPES_BY_TYPE, CREDIT_TYPE_VALUES } from "../src/lib/creditos/model.generated";
import type { CreditSubtype, CreditType } from "../src/lib/creditos/model.generated";

const API = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.LOCAL_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.LOCAL_SUPABASE_SERVICE_KEY ?? "";

if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(API)) {
  throw new Error(`Este guion solo corre contra el Supabase local. Recibió: ${API}`);
}
if (!ANON || !SERVICE) throw new Error("Faltan LOCAL_SUPABASE_ANON_KEY y LOCAL_SUPABASE_SERVICE_KEY");

const results: { paso: string; ok: boolean; detalle: string }[] = [];
const check = (paso: string, ok: boolean, detalle = "") => { results.push({ paso, ok, detalle }); };

async function debeFallar(paso: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(paso, false, "lo aceptó");
  } catch (e) {
    check(paso, e instanceof DomainError, (e as Error).message.slice(0, 64));
  }
}

async function main() {
  const admin = createClient(API, SERVICE, { auth: { persistSession: false } });
  const tag = Date.now().toString(36);

  // --- escenario de laboratorio ---------------------------------------------
  const { data: project } = await admin.from("projects")
    .insert({ name: `Lab E02 ${tag}`, slug: `lab-e02-${tag}` }).select().single();
  const { data: tower } = await admin.from("towers")
    .insert({ project_id: project!.id, name: "Única" }).select().single();
  const { data: floor } = await admin.from("floors")
    .insert({ tower_id: tower!.id, number: 5 }).select().single();
  const { data: client } = await admin.from("rv_clients")
    .insert({ full_name: "Cliente de laboratorio" }).select().single();

  async function nuevaCompra(label: string) {
    const { data: unit } = await admin.from("rv_units")
      .insert({ floor_id: floor!.id, unit_number: `${label}-${tag.slice(-3)}`, status: "SOLD" })
      .select().single();
    const { data: reserva } = await admin.from("reservations")
      .insert({ unit_id: unit!.id, status: "CONFIRMED" }).select().single();
    await admin.from("reservation_clients")
      .insert({ reservation_id: reserva!.id, client_id: client!.id, is_primary: true });
    return reserva!.id as string;
  }

  const email = `creditos.e02.${tag}@lab.local`;
  const password = `lab-${tag}-${tag}`;
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, app_metadata: { role: "creditos" },
  });
  if (userError) throw userError;
  const actorId = created.user!.id;

  const userClient = createClient(API, ANON, { auth: { persistSession: false } });
  const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  const service = new CreditoService(new SupabaseCreditoRepo(userClient));

  // --- los ocho subtipos ------------------------------------------------------
  const subtipos = CREDIT_TYPE_VALUES.flatMap((type) =>
    SUBTYPES_BY_TYPE[type].map((subtype) => ({ type, subtype })),
  ) as { type: CreditType; subtype: CreditSubtype }[];

  check("los ocho subtipos están cubiertos", subtipos.length === 8, `${subtipos.length}`);

  const creados: Record<string, string> = {};

  for (const { type, subtype } of subtipos) {
    const reservaId = await nuevaCompra(subtype.slice(0, 8));
    const id = await service.crear(reservaId, type, subtype, actorId);
    creados[subtype] = id;

    const { checklist } = await service.detail(id);
    const obligatorios = checklist.filter((i) => i.isRequired);
    const condicionales = checklist.filter((i) => !i.isRequired);
    check(`${subtype}: checklist copiado`, checklist.length > 0,
      `${checklist.length} documentos · ${obligatorios.length} obligatorios · ${condicionales.length} condicionales`);

    // Con obligatorios pendientes, declarar completo se rechaza y dice cuántos faltan.
    if (obligatorios.length > 0) {
      await debeFallar(`${subtype}: rechaza completo con pendientes`,
        () => service.avanzar(id, "expediente_completo", actorId));
    }

    // Se marcan los obligatorios: el primero como «no aplica», el resto «recibido».
    for (const [index, item] of obligatorios.entries()) {
      await service.marcar(id, item.id, index === 0 ? "na" : "recibido", actorId);
    }

    // fha_extranjero y contado_individual se dejan en armado a propósito: las
    // pruebas de corrección, de agregar documento y de concurrencia necesitan un
    // expediente todavía editable. Ambos se completan más abajo, después de esas
    // pruebas — y sirven entonces para probar el candado sobre un expediente ya
    // completo, sin depender de un solo caso.
    if (subtype === "fha_extranjero" || subtype === "contado_individual") continue;

    // Los condicionales quedan pendientes a propósito: no deben bloquear.
    await service.avanzar(id, "expediente_completo", actorId);
    const despues = await service.detail(id);
    const condicionalesPendientes = despues.checklist.filter((i) => !i.isRequired && i.state === "pendiente");
    check(`${subtype}: completo con condicionales pendientes`,
      despues.expediente.state === "expediente_completo",
      `${condicionalesPendientes.length} condicionales sin marcar`);
  }

  // --- corregir una marca (expediente todavía en armado) ----------------------
  const corregir = creados["contado_individual"];
  const antes = await service.detail(corregir);
  const marcado = antes.checklist.find((i) => i.state === "recibido")!;
  const eventosAntes = antes.history.length;
  await service.marcar(corregir, marcado.id, "pendiente", actorId);
  const tras = await service.detail(corregir);
  const vuelto = tras.checklist.find((i) => i.id === marcado.id)!;
  check("una marca se puede corregir a Pendiente", vuelto.state === "pendiente", vuelto.state);
  check("la corrección queda en el historial", tras.history.length === eventosAntes + 1,
    `${tras.history.length} eventos`);
  // Deja contado_individual otra vez sin pendientes, para completarlo más abajo.
  await service.marcar(corregir, marcado.id, "recibido", actorId);
  await service.avanzar(corregir, "expediente_completo", actorId);

  // --- documento agregado a mano (fha_extranjero, todavía en armado) ---------
  const extraEn = creados["fha_extranjero"];
  const extraId = await service.agregarDocumento(extraEn,
    { documentKey: "carta_banco_extra", name: "Carta adicional del banco", condition: null, isRequired: true },
    actorId);
  const conExtra = await service.detail(extraEn);
  const extra = conExtra.checklist.find((i) => i.id === extraId)!;
  check("el documento agregado queda marcado como agregado a mano", extra.isExtra && extra.isRequired,
    `isExtra=${extra.isExtra} isRequired=${extra.isRequired}`);
  check("y aparece pendiente", extra.state === "pendiente", extra.state);

  await debeFallar("no se repite un documento que ya está en el checklist",
    () => service.agregarDocumento(extraEn,
      { documentKey: "carta_banco_extra", name: "Otra vez", condition: null, isRequired: false }, actorId));

  // --- dos marcas a la vez sobre el mismo documento (fha_extranjero, todavía en armado) ---
  const concurrente = extraEn;
  const detalleC = await service.detail(concurrente);
  const itemC = detalleC.checklist.find((i) => i.documentKey !== "carta_banco_extra")!;
  const eventosC = detalleC.history.length;
  await service.marcar(concurrente, itemC.id, "pendiente", actorId);
  const resultados = await Promise.allSettled([
    service.marcar(concurrente, itemC.id, "recibido", actorId),
    service.marcar(concurrente, itemC.id, "na", actorId),
  ]);
  const finalC = await service.detail(concurrente);
  const itemFinal = finalC.checklist.find((i) => i.id === itemC.id)!;
  const filas = finalC.checklist.filter((i) => i.id === itemC.id).length;
  check("dos marcas simultáneas no corrompen nada",
    resultados.every((r) => r.status === "fulfilled") && filas === 1 &&
      (itemFinal.state === "recibido" || itemFinal.state === "na"),
    `queda en «${itemFinal.state}», ${filas} fila`);
  check("y ninguna se pierde del historial", finalC.history.length >= eventosC + 3,
    `${finalC.history.length - eventosC} eventos nuevos`);

  // --- el candado: el checklist se congela al declarar completo (2026-09-21) --
  // fha_extranjero todavía tiene el documento agregado a mano pendiente; se marca
  // y se completa, y desde ahí el checklist deja de aceptar cambios.
  await service.marcar(concurrente, extraId, "recibido", actorId);
  await service.avanzar(concurrente, "expediente_completo", actorId);
  const bloqueado = await service.detail(concurrente);
  check("fha_extranjero queda completo", bloqueado.expediente.state === "expediente_completo",
    bloqueado.expediente.state);

  const filaBloqueada = bloqueado.checklist[0];
  const eventosBloqueado = bloqueado.history.length;

  await debeFallar("no se puede marcar un documento de un expediente ya completo",
    () => service.marcar(concurrente, filaBloqueada.id, "pendiente", actorId));
  await debeFallar("tampoco deshacer una marca de un expediente ya completo",
    () => service.marcar(concurrente, filaBloqueada.id,
      filaBloqueada.state === "recibido" ? "na" : "recibido", actorId));
  await debeFallar("ni agregar un documento a un expediente ya completo",
    () => service.agregarDocumento(concurrente,
      { documentKey: "tardio", name: "Documento tardío", condition: null, isRequired: false }, actorId));

  const tranquilo = await service.detail(concurrente);
  check("nada cambió tras los tres intentos rechazados",
    tranquilo.checklist.length === bloqueado.checklist.length &&
      tranquilo.checklist.every((i) => i.state === bloqueado.checklist.find((b) => b.id === i.id)?.state) &&
      tranquilo.history.length === eventosBloqueado,
    `${tranquilo.checklist.length} documentos, ${tranquilo.history.length} eventos, sin cambios`);

  // El mismo candado en otro expediente ya completo, por otro camino de creación
  // (contado_individual, completado más arriba tras la corrección).
  const otroCompleto = await service.detail(corregir);
  const otraFila = otroCompleto.checklist[0];
  await debeFallar("el candado alcanza a cualquier expediente completo, no solo a uno",
    () => service.marcar(corregir, otraFila.id, "na", actorId));

  // --- un rol sin permiso ------------------------------------------------------
  const ventasEmail = `ventas.e02.${tag}@lab.local`;
  const { error: ventasError } = await admin.auth.admin.createUser({
    email: ventasEmail, password, email_confirm: true, app_metadata: { role: "ventas" },
  });
  if (ventasError) throw ventasError;
  const ventasClient = createClient(API, ANON, { auth: { persistSession: false } });
  await ventasClient.auth.signInWithPassword({ email: ventasEmail, password });
  const ventasService = new CreditoService(new SupabaseCreditoRepo(ventasClient));
  await debeFallar("ventas no alcanza un expediente", () => ventasService.detail(corregir));

  // --- informe -----------------------------------------------------------------
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
