/**
 * Canonical salesperson name resolution.
 *
 * Ported from scripts/backfill_reservations.py SALESPERSON_CANONICAL.
 * Maps accent-stripped, lowercased name variants → canonical full_name
 * as stored in the `salespeople` table.
 */

/**
 * Variant → canonical name. Keys are lowercase, accent-stripped.
 * Add new entries when salespeople are added or when new name variants appear in Excel.
 */
export const SALESPERSON_CANONICAL: Record<string, string> = {
  // Original 28 from backfill
  "paula hernandez": "Paula Hernandez",
  "paula hernadez": "Paula Hernandez",
  "paula hernande": "Paula Hernandez",
  "jose gutierrez": "Jose Gutierrez",
  "antonio rada": "Antonio Rada",
  "brenda bucaro": "Brenda Bucaro",
  "alexander franco": "Alexander Franco",
  "erwin cardona": "Erwin Cardona",
  "anahi cisneros": "Anahi Cisneros",
  "diana alvarez": "Diana Alvarez",
  "sofia paredes": "Sofia Paredes",
  "laura molina": "Laura Molina",
  "efren sanchez": "Efren Sanchez",
  "eder veliz": "Eder Veliz",
  "pedro pablo sarti": "Pedro Pablo Sarti",
  "ronaldo ogaldez": "Ronaldo Ogaldez",
  "pablo marroquin": "Pablo Marroquin",
  "rony ramirez": "Rony Ramirez",
  "noemi menendez": "Noemi Menendez",
  "mario rodriguez": "Mario Rodriguez",
  "forma capital": "Forma Capital",
  "junta directiva": "Junta Directiva",
  "alejandra calderon": "Alejandra Calderon",
  "andrea gonzalez": "Andrea Gonzalez",
  "abigail garcia": "Abigail Garcia",
  "ivan castillo": "Ivan Castillo",
  "karina fuentes": "Karina Fuentes",
  "luis esteban": "Luis Esteban",
  "otto h.": "Otto Herrera",
  "otto herrera": "Otto Herrera",
  // Added post-backfill (migrations 045, 049)
  "luccia calvo": "Luccia Calvo",
  "keilly pinto": "Keilly Pinto",
  "job jimenez": "Job Jimenez",
  "alek hernandez": "Alek Hernandez",
};

/** Names to exclude — these are not actual salespeople. */
export const SALESPERSON_EXCLUDE = new Set(["traslado", "jd"]);
