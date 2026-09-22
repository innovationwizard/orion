#!/usr/bin/env node
/**
 * Generates the Créditos y Entregas module's database and types from its JSON
 * definitions in `spec/`.
 *
 *   node scripts/generate-spec.mjs          # writes the files
 *   node scripts/generate-spec.mjs --check  # fails if they are out of date
 *
 * Writes:
 *   scripts/migrations/073_creditos.sql       — the module's tables, committed
 *   scripts/migrations/073_creditos_down.sql  — its reverse, written with it
 *   src/lib/creditos/model.generated.ts       — the same model, as types
 *
 * The definitions describe STRUCTURE only. Two things are deliberately NOT
 * generated here, because they are behaviour and are hand-written beside this
 * migration (resources/guide.md §14, answer 1):
 *   - the trigger that refuses a change of credit_type / credit_subtype;
 *   - the gate on entrega_citas, which stops a LLAVES appointment being completed
 *     before the expediente reaches escrituracion_completada.
 *
 * What IS generated, besides the tables, is what Odoo's ORM would give for free on
 * the other backend: the touch of write_date, and the stored copy of a related
 * field. Keeping them here is what makes the two databases behave alike.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = join(ROOT, "spec");
const SQL_OUT = join(ROOT, "scripts", "migrations", "073_creditos.sql");
const SQL_DOWN_OUT = join(ROOT, "scripts", "migrations", "073_creditos_down.sql");
const TS_OUT = join(ROOT, "src", "lib", "creditos", "model.generated.ts");

const CHECK_ONLY = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// Read the definitions
// ---------------------------------------------------------------------------

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

const selections = readJson(join(SPEC_DIR, "selections.json"));
const models = readdirSync(SPEC_DIR)
  .filter((f) => f.startsWith("pai.") && f.endsWith(".json"))
  .map((f) => ({ file: f, ...readJson(join(SPEC_DIR, f)) }));

const tableOf = (model) => model.replace(/\./g, "_");
const byTable = new Map(models.map((m) => [tableOf(m.model), m]));

/** Values of a selection field, wherever they are declared. */
function valuesOf(field, where) {
  if (field.values) return field.values;
  const shared = selections.selections[field.values_ref];
  if (!shared) fail(`${where}: no existe la lista «${field.values_ref}» en selections.json`);
  return shared.values;
}

function fail(message) {
  console.error(`generate-spec: ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate what the JSON Schema cannot: that references resolve
// ---------------------------------------------------------------------------

for (const m of models) {
  for (const [name, f] of Object.entries(m.fields)) {
    const where = `${m.file} · ${name}`;
    if (f.type === "selection") {
      const values = valuesOf(f, where).map((v) => v.value);
      if (f.default !== undefined && !values.includes(f.default))
        fail(`${where}: el valor por defecto «${f.default}» no está en la lista`);
    }
    if (f.type === "many2one" && !f.target?.pai_app) fail(`${where}: falta target.pai_app`);
    if (f.type === "one2many" && !byTable.has(tableOf(f.target_model)))
      fail(`${where}: ${f.target_model} no es un modelo de este módulo`);
    if (f.related) {
      const [fk] = f.related.split(".");
      if (!m.fields[fk]) fail(`${where}: related apunta a «${fk}», que no es un campo de este modelo`);
    }
  }
  for (const c of m.constraints ?? []) {
    if (c.kind === "selection_pair" && !selections.maps[c.map_ref])
      fail(`${m.file} · ${c.name}: no existe el mapa «${c.map_ref}» en selections.json`);
  }
}

/**
 * PostgreSQL truncates any identifier past 63 bytes — silently, with a NOTICE that is
 * easy to miss. A truncated constraint name is a real bug: the reverse script and the
 * Odoo side would name it differently. Caught here instead.
 */
function checkIdentifier(kind, name) {
  if (Buffer.byteLength(name) > 63) {
    fail(`${kind} «${name}» tiene ${Buffer.byteLength(name)} caracteres; PostgreSQL corta en 63. Acorta el nombre en la definición.`);
  }
  return name;
}

for (const m of models) {
  const table = checkIdentifier("La tabla", tableOf(m.model));
  for (const [name, f] of Object.entries(m.fields)) {
    if (f.type === "selection") checkIdentifier("La restricción", `${table}_${name}_valid`);
    if (f.index) checkIdentifier("El índice", `idx_${table}_${name}`);
    if (f.related) checkIdentifier("El disparador", `${table}_${name}_related`);
  }
  for (const c of m.constraints ?? []) checkIdentifier("La restricción", `${table}_${c.name}`);
  if (m.soft_delete) checkIdentifier("La restricción", `${table}_deleted_coherent`);
  if (m.log_access !== false) checkIdentifier("El disparador", `${table}_write_date`);
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const SQL_TYPE = {
  char: "text",
  text: "text",
  label: "text",
  boolean: "boolean",
  integer: "integer",
  date: "date",
  datetime: "timestamptz",
  json: "jsonb",
  selection: "text",
  many2one: "uuid",
};

const ON_DELETE = { restrict: "RESTRICT", cascade: "CASCADE", set_null: "SET NULL" };

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const list = (values) => values.map((v) => q(v)).join(", ");

/** Columns every table carries, in the order they are written. */
function implicitColumns(m) {
  const cols = [];
  if (m.soft_delete) {
    cols.push({ name: "active", sql: "boolean NOT NULL DEFAULT true", comment: "Eliminación lógica: false lo oculta de las lecturas por defecto." });
    cols.push({ name: "deleted_date", sql: "timestamptz", comment: "Cuándo se eliminó." });
    cols.push({ name: "deleted_by_id", sql: "uuid REFERENCES auth.users(id)", comment: "Quién lo eliminó. Bloquea borrar esa cuenta." });
  }
  if (m.log_access !== false) {
    cols.push({ name: "create_uid", sql: "uuid REFERENCES auth.users(id)", comment: "Quién creó la fila. Bloquea borrar esa cuenta." });
    cols.push({ name: "create_date", sql: "timestamptz NOT NULL DEFAULT now()", comment: "Cuándo se creó." });
    cols.push({ name: "write_uid", sql: "uuid REFERENCES auth.users(id)", comment: "Quién la cambió por última vez." });
    cols.push({ name: "write_date", sql: "timestamptz NOT NULL DEFAULT now()", comment: "Cuándo cambió por última vez. La toca un disparador." });
  }
  return cols;
}

function columnSql(name, f) {
  const parts = [SQL_TYPE[f.type]];
  // A related column is filled by its trigger, so it is never declared NOT NULL: the
  // value is not known until the row is written. A column with a default is, because a
  // default that still admits null invites null.
  if (!f.related && (f.required || f.default !== undefined)) parts.push("NOT NULL");
  if (f.default !== undefined) {
    const d = typeof f.default === "string" ? q(f.default) : String(f.default);
    parts.push(`DEFAULT ${d}`);
  }
  if (f.type === "many2one") {
    parts.push(`REFERENCES ${f.target.pai_app}(id) ON DELETE ${ON_DELETE[f.on_delete ?? "restrict"]}`);
  }
  return `  ${name.padEnd(24)} ${parts.join(" ")}`;
}

function tableConstraints(m, table) {
  const out = [];
  for (const [name, f] of Object.entries(m.fields)) {
    if (f.type !== "selection") continue;
    const values = valuesOf(f, `${m.file} · ${name}`).map((v) => v.value);
    out.push(`  CONSTRAINT ${table}_${name}_valid CHECK (${name} IN (${list(values)}))`);
  }
  if (m.soft_delete) {
    out.push(
      `  CONSTRAINT ${table}_deleted_coherent CHECK (\n` +
        `    (active IS TRUE AND deleted_date IS NULL AND deleted_by_id IS NULL) OR\n` +
        `    (active IS NOT TRUE AND deleted_date IS NOT NULL AND deleted_by_id IS NOT NULL))`,
    );
  }
  for (const c of m.constraints ?? []) {
    if (c.kind === "check") out.push(`  CONSTRAINT ${table}_${c.name} CHECK (${c.sql})`);
    if (c.kind === "unique") out.push(`  CONSTRAINT ${table}_${c.name} UNIQUE (${c.columns.join(", ")})`);
    if (c.kind === "selection_pair") {
      const map = selections.maps[c.map_ref].values;
      const branches = Object.entries(map)
        .map(([parent, children]) => `(${c.parent} = ${q(parent)} AND ${c.child} IN (${list(children)}))`)
        .join(" OR\n    ");
      out.push(`  CONSTRAINT ${table}_${c.name} CHECK (\n    ${branches})`);
    }
  }
  return out;
}

function createTable(m) {
  const table = tableOf(m.model);
  const cols = [`  id                       uuid PRIMARY KEY DEFAULT uuid_v7()`];
  for (const [name, f] of Object.entries(m.fields)) {
    if (f.type === "one2many") continue;
    cols.push(columnSql(name, f));
  }
  for (const c of implicitColumns(m)) cols.push(`  ${c.name.padEnd(24)} ${c.sql}`);
  const body = [...cols, ...tableConstraints(m, table)].join(",\n");

  const comments = [`COMMENT ON TABLE ${table} IS ${q(m.description ?? m.label_es)};`];
  for (const [name, f] of Object.entries(m.fields)) {
    if (f.type === "one2many") continue;
    const text = f.description ? `${f.label_es}. ${f.description}` : f.label_es;
    comments.push(`COMMENT ON COLUMN ${table}.${name} IS ${q(text)};`);
  }
  for (const c of implicitColumns(m)) comments.push(`COMMENT ON COLUMN ${table}.${c.name} IS ${q(c.comment)};`);

  const indexes = [];
  for (const [name, f] of Object.entries(m.fields)) {
    if (f.index) indexes.push(`CREATE INDEX IF NOT EXISTS idx_${table}_${name} ON ${table} (${name});`);
  }
  for (const c of m.constraints ?? []) {
    if (c.kind !== "unique_index") continue;
    const where = c.where ? ` WHERE ${c.where}` : "";
    indexes.push(
      `-- ${c.message_es}\n` +
        `CREATE UNIQUE INDEX IF NOT EXISTS ${table}_${c.name} ON ${table} (${c.columns.join(", ")})${where};`,
    );
  }

  return [
    section(`${table} — ${m.label_es}`),
    `CREATE TABLE IF NOT EXISTS ${table} (\n${body}\n);`,
    "",
    comments.join("\n"),
    indexes.length ? "\n" + indexes.join("\n") : "",
  ].join("\n");
}

/** write_date is touched on every update, and related columns are filled on insert. */
function triggers(m) {
  const table = tableOf(m.model);
  const out = [];
  if (m.log_access !== false) {
    out.push(
      `DROP TRIGGER IF EXISTS ${table}_write_date ON ${table};`,
      `CREATE TRIGGER ${table}_write_date BEFORE UPDATE ON ${table}`,
      `  FOR EACH ROW EXECUTE FUNCTION pai_touch_write_date();`,
    );
  }
  for (const [name, f] of Object.entries(m.fields)) {
    if (!f.related) continue;
    const [fk, srcCol] = f.related.split(".");
    const srcTable = m.fields[fk].target.pai_app;
    const fn = `${table}_${name}_related`;
    out.push(
      "",
      `-- ${name} se copia de ${f.related}, como un campo relacionado almacenado.`,
      `CREATE OR REPLACE FUNCTION ${fn}() RETURNS trigger`,
      `  LANGUAGE plpgsql SET search_path = public, pg_temp AS $$`,
      `BEGIN`,
      `  SELECT ${srcCol} INTO NEW.${name} FROM ${srcTable} WHERE id = NEW.${fk};`,
      `  RETURN NEW;`,
      `END;`,
      `$$;`,
      `DROP TRIGGER IF EXISTS ${fn} ON ${table};`,
      `CREATE TRIGGER ${fn} BEFORE INSERT OR UPDATE OF ${fk} ON ${table}`,
      `  FOR EACH ROW EXECUTE FUNCTION ${fn}();`,
    );
  }
  return out.length ? [section(`${table} — disparadores`), out.join("\n")].join("\n") : "";
}

/** One policy per table and action, resolved with jwt_role(), as migrations 071–072 do. */
function policies(m) {
  const table = tableOf(m.model);
  const roles = (action) =>
    Object.entries(m.access)
      .filter(([, perms]) => perms[action])
      .map(([role]) => role)
      .sort();

  const out = [`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`, ""];
  const clause = (rs) => `jwt_role() IN (${list(rs)})`;

  for (const [action, verb] of [["read", "SELECT"], ["create", "INSERT"], ["write", "UPDATE"], ["delete", "DELETE"]]) {
    const rs = roles(action);
    const policy = `${table}_${verb.toLowerCase()}`;
    out.push(`DROP POLICY IF EXISTS ${policy} ON ${table};`);
    if (rs.length === 0) {
      out.push(`-- Sin política de ${verb}: nadie puede hacerlo, por diseño.`, "");
      continue;
    }
    if (verb === "INSERT") {
      out.push(`CREATE POLICY ${policy} ON ${table}`, `  FOR INSERT TO authenticated`, `  WITH CHECK (${clause(rs)});`, "");
    } else if (verb === "UPDATE") {
      out.push(
        `CREATE POLICY ${policy} ON ${table}`,
        `  FOR UPDATE TO authenticated`,
        `  USING (${clause(rs)})`,
        `  WITH CHECK (${clause(rs)});`,
        "",
      );
    } else {
      out.push(`CREATE POLICY ${policy} ON ${table}`, `  FOR ${verb} TO authenticated`, `  USING (${clause(rs)});`, "");
    }
  }
  return [section(`${table} — permisos`), out.join("\n").trimEnd()].join("\n");
}

/** Reference data, loaded with the migration and updated in place when it changes. */
function seed(m) {
  if (!m.seed) return "";
  const table = tableOf(m.model);
  const path = join(SPEC_DIR, m.seed.file);
  if (!existsSync(path)) {
    return [
      section(`${table} — datos de referencia`),
      `-- PENDIENTE: falta ${m.seed.file}.`,
      `-- Son las 88 filas transcritas de los ocho checklists en PDF, que son la autoridad`,
      `-- literal. Se copian desde el laboratorio y se cotejan contra los PDF antes de`,
      `-- volverse datos de producción (guide.md §14, respuesta 23).`,
    ].join("\n");
  }
  const [header, ...rows] = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const cols = header.split(",").map((c) => c.trim());
  const values = rows.map((line) => `  (${splitCsv(line).map((v) => (v === "" ? "NULL" : q(v))).join(", ")})`);
  const updates = cols
    .filter((c) => !m.seed.key.includes(c))
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(", ");
  return [
    section(`${table} — datos de referencia (${rows.length} filas)`),
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES`,
    values.join(",\n"),
    `ON CONFLICT (${m.seed.key.join(", ")}) DO UPDATE SET ${updates};`,
  ].join("\n");
}

/** CSV with quoted fields — the labels contain commas. */
function splitCsv(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function section(title) {
  return `\n-- ---------------------------------------------------------------------------\n-- ${title}\n-- ---------------------------------------------------------------------------`;
}

/** Tables before the tables that point at them. */
function ordered() {
  const done = new Set();
  const out = [];
  const visit = (m) => {
    const table = tableOf(m.model);
    if (done.has(table)) return;
    done.add(table);
    for (const f of Object.values(m.fields)) {
      if (f.type !== "many2one") continue;
      const dep = byTable.get(f.target.pai_app);
      if (dep && tableOf(dep.model) !== table) visit(dep);
    }
    out.push(m);
  };
  [...models].sort((a, b) => a.model.localeCompare(b.model)).forEach(visit);
  return out;
}

function buildSql() {
  const ms = ordered();
  const header = `-- ============================================================================
-- Migration 073: Créditos y Entregas — expediente, checklist e historial
-- ============================================================================
-- GENERADO por scripts/generate-spec.mjs desde spec/*.json. No editar a mano:
-- cambiar la definición y volver a generar. Su reverso es 073_creditos_down.sql.
--
-- Las reglas del proceso NO están aquí: viven en el servicio de dominio
-- (SDD v5 §6.5). Lo que esta migración impone es lo que la base puede negar por
-- sí sola, y vale igual en la base de PAI APP y en Odoo: que el subtipo
-- pertenezca a su tipo, que el motivo exista solo al desistir, que una reserva
-- tenga un expediente activo, y que el historial solo admita inserción.
--
-- Se aplican aparte, escritos a mano, los dos espejos de reglas de proceso: el
-- disparador que impide cambiar el tipo de crédito y la puerta sobre
-- entrega_citas.
--
-- Idempotente. Verificar contra la base en vivo antes de aplicar: el repositorio
-- no es un retrato completo de producción.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- write_date, como lo haría el ORM de Odoo del otro lado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pai_touch_write_date() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  -- clock_timestamp(), no now(): now() es la hora de inicio de la transacción, así que
  -- un cambio hecho en la misma transacción que la creación dejaría las dos fechas
  -- idénticas. El ORM de Odoo registra el momento real de la escritura; esto también.
  NEW.write_date := clock_timestamp();
  RETURN NEW;
END;
$$;`;

  const parts = [header];
  for (const m of ms) parts.push(createTable(m));
  for (const m of ms) {
    const t = triggers(m);
    if (t) parts.push(t);
  }
  for (const m of ms) parts.push(policies(m));
  for (const m of ms) {
    const s = seed(m);
    if (s) parts.push(s);
  }
  return parts.join("\n") + "\n";
}

function buildDownSql() {
  const ms = ordered().reverse();
  const fns = [];
  for (const m of ms) {
    for (const [name, f] of Object.entries(m.fields)) {
      if (f.related) fns.push(`${tableOf(m.model)}_${name}_related`);
    }
  }
  return `-- ============================================================================
-- Reverso de la migración 073 — Créditos y Entregas
-- ============================================================================
-- GENERADO por scripts/generate-spec.mjs. El módulo es aditivo: esto lo borra
-- entero y deja la base como estaba. Borra también sus datos.
-- ============================================================================

DROP TABLE IF EXISTS ${ms.map((m) => tableOf(m.model)).join(", ")} CASCADE;

${fns.map((f) => `DROP FUNCTION IF EXISTS ${f}();`).join("\n")}
DROP FUNCTION IF EXISTS pai_touch_write_date();
`;
}

// ---------------------------------------------------------------------------
// TypeScript
// ---------------------------------------------------------------------------

const pascal = (s) => s.split(/[._]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join("");
const constName = (s) => s.replace(/[.\s]/g, "_").toUpperCase();

const TS_TYPE = {
  char: "string",
  text: "string",
  label: "string",
  boolean: "boolean",
  integer: "number",
  date: "string",
  datetime: "string",
  json: "Record<string, unknown>",
  many2one: "string",
};

function buildTs() {
  const parts = [
    `/**
 * GENERADO por scripts/generate-spec.mjs desde spec/*.json. No editar a mano.
 *
 * Los mismos nombres, valores y obligatoriedades que la migración 073, para que
 * el modelo y los tipos no puedan separarse. Las etiquetas están en español
 * porque son lo que la gente lee en pantalla.
 */
`,
  ];

  const used = new Set();
  for (const m of models) {
    for (const f of Object.values(m.fields)) if (f.values_ref) used.add(f.values_ref);
  }

  for (const name of [...used].sort()) {
    const sel = selections.selections[name];
    const VALUES = `${constName(name)}_VALUES`;
    parts.push(
      `/** ${sel.label_es}${sel.description ? ` — ${sel.description}` : ""} */`,
      `export const ${VALUES} = [${sel.values.map((v) => `"${v.value}"`).join(", ")}] as const;`,
      `export type ${pascal(name)} = (typeof ${VALUES})[number];`,
      `export const ${constName(name)}_LABELS: Record<${pascal(name)}, string> = {`,
      ...sel.values.map((v) => `  ${v.value}: ${JSON.stringify(v.label_es)},`),
      `};`,
      "",
    );
  }

  // The value maps the constraints are built from, typed by the fields that use them,
  // so the rule in the database and the one the service applies cannot drift apart.
  for (const [name, map] of Object.entries(selections.maps)) {
    const use = models
      .flatMap((m) => (m.constraints ?? []).map((c) => ({ m, c })))
      .find(({ c }) => c.kind === "selection_pair" && c.map_ref === name);
    const parentType = use ? pascal(use.m.fields[use.c.parent].values_ref) : "string";
    const childType = use ? pascal(use.m.fields[use.c.child].values_ref) : "string";
    parts.push(
      `/** ${map.description ?? name} */`,
      `export const ${constName(name)}: Record<${parentType}, readonly ${childType}[]> = {`,
      ...Object.entries(map.values).map(([k, v]) => `  ${k}: [${v.map((x) => `"${x}"`).join(", ")}],`),
      `};`,
      "",
    );
  }

  for (const m of ordered()) {
    const rows = [];
    rows.push(`  id: string;`);
    for (const [name, f] of Object.entries(m.fields)) {
      if (f.type === "one2many") continue;
      const base = f.type === "selection" ? (f.values_ref ? pascal(f.values_ref) : valuesOf(f, m.file).map((v) => `"${v.value}"`).join(" | ")) : TS_TYPE[f.type];
      // Same rule as the column: not null when it is required or carries a default.
      const nullable = !f.related && (f.required || f.default !== undefined) ? "" : " | null";
      rows.push(`  /** ${f.label_es} */`);
      rows.push(`  ${name}: ${base}${nullable};`);
    }
    if (m.soft_delete) {
      rows.push(`  active: boolean;`, `  deleted_date: string | null;`, `  deleted_by_id: string | null;`);
    }
    if (m.log_access !== false) {
      rows.push(
        `  create_uid: string | null;`,
        `  create_date: string;`,
        `  write_uid: string | null;`,
        `  write_date: string;`,
      );
    }
    parts.push(`/** ${m.label_es} — tabla ${tableOf(m.model)} */`, `export interface ${pascal(m.model)}Row {`, ...rows, `}`, "");
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Write, or check
// ---------------------------------------------------------------------------

const outputs = [
  [SQL_OUT, buildSql()],
  [SQL_DOWN_OUT, buildDownSql()],
  [TS_OUT, buildTs()],
];

let stale = false;
for (const [path, content] of outputs) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === content) {
    console.log(`= ${path.replace(ROOT + "/", "")}`);
    continue;
  }
  if (CHECK_ONLY) {
    console.error(`≠ ${path.replace(ROOT + "/", "")} está desactualizado`);
    stale = true;
    continue;
  }
  writeFileSync(path, content);
  console.log(`${current === null ? "+" : "~"} ${path.replace(ROOT + "/", "")}`);
}

if (stale) process.exit(1);
