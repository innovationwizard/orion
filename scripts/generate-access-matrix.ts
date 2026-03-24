/**
 * Generate docs/access-control-matrix.md from src/lib/permissions.ts
 *
 * Usage: npx tsx scripts/generate-access-matrix.ts
 *
 * Satisfies:
 * - SOC 2 CC6.1 (formal access control matrix)
 * - ISO 27001 A.5.15 (auditable access control document)
 */

import { PERMISSIONS, type Resource, type Action } from "../src/lib/permissions";
import type { Role } from "../src/lib/auth";
import * as fs from "fs";
import * as path from "path";

const ALL_ROLES: Role[] = [
  "master",
  "torredecontrol",
  "gerencia",
  "financiero",
  "contabilidad",
  "marketing",
  "inventario",
  "ventas",
];

const lines: string[] = [];

lines.push("# Orion Access Control Matrix");
lines.push("");
lines.push(`> **Auto-generated** from \`src/lib/permissions.ts\` on ${new Date().toISOString().slice(0, 10)}.`);
lines.push("> Do not edit manually. Run `npx tsx scripts/generate-access-matrix.ts` to regenerate.");
lines.push("");

// Build header
const header = ["Resource", "Action", ...ALL_ROLES];
const separator = header.map((h) => (h === "Resource" || h === "Action" ? "-".repeat(h.length) : ":---:"));

lines.push("| " + header.join(" | ") + " |");
lines.push("| " + separator.join(" | ") + " |");

// Build rows
const resources = Object.keys(PERMISSIONS) as Resource[];
for (const resource of resources) {
  const actions = PERMISSIONS[resource];
  const actionNames = Object.keys(actions) as Action[];

  for (const action of actionNames) {
    const allowedRoles = actions[action] ?? [];
    const cells = ALL_ROLES.map((role) =>
      allowedRoles.includes(role) ? "✓" : ""
    );
    lines.push(`| ${resource} | ${action} | ${cells.join(" | ")} |`);
  }
}

lines.push("");

// Summary stats
let totalPermissions = 0;
for (const resource of resources) {
  const actions = PERMISSIONS[resource];
  for (const action of Object.keys(actions) as Action[]) {
    totalPermissions += (actions[action] ?? []).length;
  }
}

const totalTriples = resources.reduce((sum, r) => sum + Object.keys(PERMISSIONS[r]).length, 0);

lines.push("---");
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- **Resources:** ${resources.length}`);
lines.push(`- **Permission triples (resource × action):** ${totalTriples}`);
lines.push(`- **Total role grants:** ${totalPermissions}`);
lines.push(`- **Roles defined:** ${ALL_ROLES.length} (${ALL_ROLES.join(", ")})`);
lines.push("");

const outPath = path.join(__dirname, "..", "docs", "access-control-matrix.md");
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

console.log(`✓ Generated ${outPath}`);
console.log(`  ${resources.length} resources, ${totalTriples} permission triples, ${totalPermissions} role grants`);
