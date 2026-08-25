/**
 * Alta masiva de usuarios con rol `entregas_viewer`.
 *
 * Uso:
 *   npx tsx scripts/bulk-invite-entregas-viewers.ts <ruta-csv>                    # simulacro
 *   npx tsx scripts/bulk-invite-entregas-viewers.ts <ruta-csv> --apply            # crea usuarios, imprime enlaces
 *   npx tsx scripts/bulk-invite-entregas-viewers.ts <ruta-csv> --apply --send     # además envía el correo de invitación
 *   npx tsx scripts/bulk-invite-entregas-viewers.ts <ruta-csv> --apply --password  # crea con contraseña, sin correo
 *
 * CSV esperado (con encabezado, en cualquier orden de columnas):
 *   nombre,email[,password]
 * La columna `password` es opcional y solo se usa con --password; si falta, se
 * genera una contraseña aleatoria fuerte por persona.
 *
 * Comportamiento por fila:
 *   - Usuario nuevo      → `generateLink({type:"invite"})` lo crea, luego se fija
 *                          `app_metadata.role = entregas_viewer`. Token ~24h.
 *   - Usuario existente  → se corrige el rol si hace falta y se genera enlace
 *                          `recovery` (si aún no tiene contraseña) o `magiclink`.
 *   - Rol ya correcto    → se reporta y se regenera el enlace igualmente.
 *
 * Modo --password (sin correo, alta inmediata):
 *   Usa `admin.createUser` / `admin.updateUserById`, la vía soportada por
 *   Supabase. Crea el usuario, fija la contraseña, confirma el correo, escribe
 *   app_metadata.role y genera la fila de auth.identities — todo en una llamada.
 *   No escribe directo en el esquema auth, así que no depende de la versión de
 *   GoTrue ni de columnas generadas. Imprime las credenciales para distribuir.
 *
 * Idempotente: reejecutarlo no duplica usuarios ni pisa roles ajenos.
 *
 * Envío de correo:
 *   Sin `--send` no se envía nada — se imprimen los enlaces para distribución
 *   manual, igual que `scripts/generate-invite-link.ts`.
 *   Con `--send` los usuarios NUEVOS reciben el correo de invitación de Supabase
 *   vía el SMTP configurado del proyecto (Resend). Los usuarios EXISTENTES nunca
 *   reciben correo automático: se les imprime el enlace, porque un correo de
 *   "recuperar contraseña" es un mensaje distinto al de una invitación y confunde
 *   a quien ya tenía cuenta.
 *
 * Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * y NEXT_PUBLIC_SITE_URL.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { randomInt } from "crypto";
import { createClient, type User } from "@supabase/supabase-js";

// Cargar .env.local a mano (el repo no usa dotenv)
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const ROLE = "entregas_viewer" as const;

const csvPath = process.argv[2];
const apply = process.argv.includes("--apply");
const send = process.argv.includes("--send");
const withPassword = process.argv.includes("--password");

const delayArg = process.argv.find((a) => a.startsWith("--delay-ms="));
const delayMs = delayArg ? Number.parseInt(delayArg.split("=")[1] ?? "", 10) : 2000;
if (Number.isNaN(delayMs) || delayMs < 0) {
  console.error("--delay-ms debe ser un entero >= 0");
  process.exit(1);
}

if (send && !apply) {
  console.error("--send requiere --apply. Sin --apply el script es un simulacro y no envía nada.");
  process.exit(1);
}

if (send && withPassword) {
  console.error("--send y --password son excluyentes: o se invita por correo, o se da de alta con contraseña.");
  process.exit(1);
}

/**
 * Contraseña aleatoria fuerte. Alfabeto sin caracteres ambiguos (0/O, 1/l/I)
 * porque estas credenciales se dictan y se transcriben a mano.
 * 16 caracteres sobre 55 símbolos ≈ 92 bits de entropía.
 */
const PW_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function generatePassword(length = 16): string {
  let out = "";
  for (let i = 0; i < length; i++) out += PW_ALPHABET[randomInt(PW_ALPHABET.length)];
  return out;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

if (!csvPath || csvPath.startsWith("--")) {
  console.error("Uso: npx tsx scripts/bulk-invite-entregas-viewers.ts <ruta-csv> [--apply]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawSite = process.env.NEXT_PUBLIC_SITE_URL;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
if (!rawSite) {
  console.error("Falta NEXT_PUBLIC_SITE_URL en .env.local");
  process.exit(1);
}
const siteUrl = rawSite.replace(/\/+$/, "");

const supabase = createClient(url, key);

type Row = { nombre: string; email: string; password?: string };
type Outcome = {
  nombre: string;
  email: string;
  accion: "creado" | "rol-actualizado" | "rol-ya-correcto" | "omitido" | "error";
  detalle: string;
  link: string | null;
  password?: string;
};

/** Parser CSV mínimo: sin comillas escapadas, suficiente para nombre,email. */
function parseCsv(text: string): Row[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("El CSV necesita un encabezado y al menos una fila.");
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const iNombre = header.indexOf("nombre");
  const iEmail = header.indexOf("email");
  const iPass = header.indexOf("password");

  if (iNombre === -1 || iEmail === -1) {
    throw new Error(`El encabezado debe incluir "nombre" y "email". Recibido: ${header.join(",")}`);
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const nombre = cols[iNombre] ?? "";
    const email = (cols[iEmail] ?? "").toLowerCase();
    if (!email) {
      console.warn(`  ⚠ Fila ${i + 1} sin email, se omite: "${lines[i]}"`);
      continue;
    }
    const password = iPass === -1 ? undefined : (cols[iPass] || undefined);
    rows.push({ nombre, email, password });
  }
  return rows;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildLink(hashedToken: string, type: "invite" | "recovery" | "magiclink"): string {
  const u = new URL(`${siteUrl}/auth/confirm`);
  u.searchParams.set("token_hash", hashedToken);
  u.searchParams.set("type", type);
  return u.toString();
}

/** Trae todos los usuarios paginando; listUsers tope 1000 por página. */
async function fetchAllUsers(): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers falló: ${error.message}`);
    const batch = data?.users ?? [];
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return all;
}

async function processRow(row: Row, existing: User | undefined): Promise<Outcome> {
  const base = { nombre: row.nombre, email: row.email };

  if (!isValidEmail(row.email)) {
    return { ...base, accion: "error", detalle: "Email con formato inválido", link: null };
  }

  // ── Usuario existente ────────────────────────────────────────────────
  if (existing) {
    const currentRole = (existing.app_metadata?.role as string | undefined) ?? null;

    // No pisar un rol distinto en silencio: es un cambio de privilegios.
    if (currentRole && currentRole !== ROLE) {
      return {
        ...base,
        accion: "omitido",
        detalle: `Ya existe con rol "${currentRole}". No se toca — cámbialo a mano si es intencional.`,
        link: null,
      };
    }

    const hasPassword =
      existing.app_metadata?.password_set === true || existing.user_metadata?.password_set === true;
    const linkType = hasPassword ? "magiclink" : "recovery";

    // --password: se le fija contraseña a la cuenta existente, sin borrarla ni recrearla.
    if (withPassword) {
      const pw = row.password ?? generatePassword();
      if (!apply) {
        return {
          ...base,
          accion: currentRole === ROLE ? "rol-ya-correcto" : "rol-actualizado",
          detalle: "[simulacro] existente; se le fijaría contraseña",
          link: null,
        };
      }
      const { error: upErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password: pw,
        email_confirm: true,
        app_metadata: { role: ROLE, password_set: true },
        user_metadata: { nombre: row.nombre },
      });
      if (upErr) {
        return { ...base, accion: "error", detalle: `updateUserById: ${upErr.message}`, link: null };
      }
      return {
        ...base,
        accion: currentRole === ROLE ? "rol-ya-correcto" : "rol-actualizado",
        detalle: "existente; contraseña fijada y correo confirmado",
        link: null,
        password: pw,
      };
    }

    if (!apply) {
      return {
        ...base,
        accion: currentRole === ROLE ? "rol-ya-correcto" : "rol-actualizado",
        detalle: `[simulacro] existente; enlace ${linkType}${send ? " (sin correo: ya tenía cuenta)" : ""}`,
        link: null,
      };
    }

    if (currentRole !== ROLE) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        app_metadata: { role: ROLE },
      });
      if (error) {
        return { ...base, accion: "error", detalle: `updateUserById: ${error.message}`, link: null };
      }
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: linkType,
      email: row.email,
    });
    if (error) {
      return { ...base, accion: "error", detalle: `generateLink(${linkType}): ${error.message}`, link: null };
    }
    const ht = data?.properties?.hashed_token;
    if (!ht) {
      return { ...base, accion: "error", detalle: "generateLink no devolvió hashed_token", link: null };
    }

    return {
      ...base,
      accion: currentRole === ROLE ? "rol-ya-correcto" : "rol-actualizado",
      detalle: `existente; enlace ${linkType}${send ? " — SIN correo, distribuir a mano" : ""}`,
      link: buildLink(ht, linkType),
    };
  }

  // ── Usuario nuevo ────────────────────────────────────────────────────
  if (!apply) {
    const modo = withPassword
      ? "[simulacro] se crearía CON CONTRASEÑA (sin correo)"
      : send
        ? "[simulacro] se crearía y se ENVIARÍA invitación"
        : "[simulacro] se crearía con invite";
    return { ...base, accion: "creado", detalle: modo, link: null };
  }

  // --password: createUser hace todo en una llamada soportada — usuario,
  // contraseña, correo confirmado, app_metadata y la fila de auth.identities.
  if (withPassword) {
    const pw = row.password ?? generatePassword();
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email: row.email,
      password: pw,
      email_confirm: true,
      app_metadata: { role: ROLE, password_set: true },
      user_metadata: { nombre: row.nombre },
    });
    if (cErr) {
      return { ...base, accion: "error", detalle: `createUser: ${cErr.message}`, link: null };
    }
    if (!created?.user?.id) {
      return { ...base, accion: "error", detalle: "createUser no devolvió user.id", link: null };
    }
    return { ...base, accion: "creado", detalle: "creado con contraseña; correo confirmado", link: null, password: pw };
  }

  // --send: inviteUserByEmail crea el usuario Y despacha el correo vía el SMTP
  // del proyecto. Sin --send: generateLink crea el usuario sin enviar nada.
  if (send) {
    const { data: inv, error: invErr } = await supabase.auth.admin.inviteUserByEmail(row.email, {
      data: { nombre: row.nombre },
    });
    if (invErr) {
      return { ...base, accion: "error", detalle: `inviteUserByEmail: ${invErr.message}`, link: null };
    }
    const invitedId = inv?.user?.id;
    if (!invitedId) {
      return { ...base, accion: "error", detalle: "inviteUserByEmail no devolvió user.id", link: null };
    }
    const { error: roleErr } = await supabase.auth.admin.updateUserById(invitedId, {
      app_metadata: { role: ROLE },
    });
    if (roleErr) {
      return {
        ...base,
        accion: "error",
        detalle: `Correo enviado y usuario creado (${invitedId}) pero falló asignar el rol: ${roleErr.message}. Corregir a mano ANTES de que entre.`,
        link: null,
      };
    }
    return { ...base, accion: "creado", detalle: "creado; correo de invitación ENVIADO", link: null };
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email: row.email,
    options: { data: { nombre: row.nombre } },
  });
  if (error) {
    return { ...base, accion: "error", detalle: `generateLink(invite): ${error.message}`, link: null };
  }

  const newId = data?.user?.id;
  if (!newId) {
    return { ...base, accion: "error", detalle: "invite no devolvió user.id", link: null };
  }

  // generateLink({options.data}) solo escribe user_metadata; el rol va en app_metadata.
  const { error: roleErr } = await supabase.auth.admin.updateUserById(newId, {
    app_metadata: { role: ROLE },
  });
  if (roleErr) {
    return {
      ...base,
      accion: "error",
      detalle: `Usuario creado (${newId}) pero falló asignar el rol: ${roleErr.message}. Corregir a mano.`,
      link: null,
    };
  }

  const ht = data?.properties?.hashed_token;
  if (!ht) {
    return { ...base, accion: "error", detalle: "invite no devolvió hashed_token", link: null };
  }

  return { ...base, accion: "creado", detalle: "creado; enlace invite (~24h)", link: buildLink(ht, "invite") };
}

async function main() {
  const text = readFileSync(resolve(process.cwd(), csvPath), "utf-8");
  const parsed = parseCsv(text);

  // Deduplicar por email conservando la primera aparición
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const r of parsed) {
    if (seen.has(r.email)) {
      console.warn(`  ⚠ Email duplicado en el CSV, se omite la repetición: ${r.email}`);
      continue;
    }
    seen.add(r.email);
    rows.push(r);
  }

  console.log(`\nModo: ${apply ? "APLICAR (escribe en producción)" : "SIMULACRO (no escribe nada)"}`);
  const modoTxt = withPassword
    ? "ALTA CON CONTRASEÑA (sin correo)"
    : send
      ? `ENVÍO ACTIVO (usuarios nuevos, pausa ${delayMs}ms)`
      : "sin envío — solo enlaces";
  console.log(`Método: ${modoTxt}`);
  console.log(`Filas a procesar: ${rows.length}\n`);

  const users = await fetchAllUsers();
  const byEmail = new Map(users.map((u) => [(u.email ?? "").toLowerCase(), u]));

  const results: Outcome[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const outcome = await processRow(row, byEmail.get(row.email));
    results.push(outcome);
    const icon = outcome.accion === "error" ? "✗" : outcome.accion === "omitido" ? "–" : "✓";
    console.log(`  ${icon} ${outcome.email.padEnd(38)} ${outcome.accion.padEnd(16)} ${outcome.detalle}`);

    // Espaciar los envíos para no chocar con el límite por hora del proyecto.
    if (apply && send && i < rows.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  // Resumen
  const tally = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.accion] = (acc[r.accion] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\n── Resumen ──");
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k}: ${v}`);

  const withPasswords = results.filter((r) => r.password);
  if (withPasswords.length > 0) {
    console.log("\n── Credenciales para distribuir ──");
    console.log("Entregar por canal privado. Cada persona debe cambiarla al entrar.\n");
    console.log("  " + "nombre".padEnd(22) + "email".padEnd(44) + "contraseña");
    console.log("  " + "-".repeat(84));
    for (const r of withPasswords) {
      console.log("  " + (r.nombre || "(sin nombre)").padEnd(22) + r.email.padEnd(44) + r.password);
    }
  }

  const withLinks = results.filter((r) => r.link);
  if (withLinks.length > 0) {
    console.log("\n── Enlaces para distribuir ──");
    console.log("(un solo uso; invite ~24h, recovery/magiclink según config del proyecto)\n");
    for (const r of withLinks) {
      console.log(`${r.nombre || "(sin nombre)"} <${r.email}>`);
      console.log(`${r.link}\n`);
    }
  }

  const errors = results.filter((r) => r.accion === "error");
  if (errors.length > 0) {
    console.error(`\n${errors.length} fila(s) con error — revisar arriba.`);
    process.exit(1);
  }

  if (!apply) {
    const flags = withPassword ? "--apply --password" : send ? "--apply --send" : "--apply";
    console.log(`\nSimulacro terminado. Reejecutar con ${flags} para escribir en producción.`);
  }
}

main().catch((err: unknown) => {
  console.error(`\nFallo: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
