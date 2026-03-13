/**
 * Converts a number to its Spanish legal text representation.
 *
 * Used for legal documents (PCV) where amounts must be written in words.
 * Guatemala convention: uppercase, "QUETZALES" currency.
 *
 * Examples:
 *   1500    → "MIL QUINIENTOS QUETZALES EXACTOS"
 *   1234.56 → "MIL DOSCIENTOS TREINTA Y CUATRO QUETZALES CON 56/100"
 */

const UNIDADES = [
  "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
  "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIÚN", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO",
  "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
];

const DECENAS = [
  "", "", "", "TREINTA", "CUARENTA", "CINCUENTA",
  "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
];

const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

function convertGroup(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
  }
  const c = Math.floor(n / 100);
  const rest = n % 100;
  if (rest === 0) return n === 100 ? "CIEN" : CENTENAS[c];
  return `${CENTENAS[c]} ${convertGroup(rest)}`;
}

function numberToWords(n: number): string {
  if (n === 0) return "CERO";
  if (n < 0) return `MENOS ${numberToWords(-n)}`;

  const parts: string[] = [];

  const billones = Math.floor(n / 1_000_000_000);
  const millones = Math.floor((n % 1_000_000_000) / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1_000);
  const resto = n % 1_000;

  if (billones > 0) {
    parts.push(
      billones === 1
        ? "MIL"
        : `${convertGroup(billones)} MIL`,
    );
  }

  if (millones > 0) {
    parts.push(
      millones === 1
        ? "UN MILLÓN"
        : `${convertGroup(millones)} MILLONES`,
    );
  }

  if (miles > 0) {
    parts.push(
      miles === 1
        ? "MIL"
        : `${convertGroup(miles)} MIL`,
    );
  }

  if (resto > 0) {
    parts.push(convertGroup(resto));
  }

  return parts.join(" ");
}

/**
 * Convert a currency amount to Spanish legal text with "QUETZALES".
 *
 * @param amount - The amount in GTQ (e.g., 1500, 1234.56)
 * @returns Uppercase Spanish text (e.g., "MIL QUINIENTOS QUETZALES EXACTOS")
 */
export function numeroALetras(amount: number): string {
  const intPart = Math.floor(Math.abs(amount));
  const centavos = Math.round((Math.abs(amount) - intPart) * 100);
  const words = numberToWords(intPart);

  if (centavos === 0) {
    return `${words} QUETZALES EXACTOS`;
  }
  const centStr = centavos.toString().padStart(2, "0");
  return `${words} QUETZALES CON ${centStr}/100`;
}

/**
 * Convert a day number (1-31) to Spanish words.
 * Used for legal document dates.
 */
export function diaEnLetras(day: number): string {
  return numberToWords(day).toLowerCase();
}

/**
 * Format a number with Spanish legal parenthetical notation.
 * e.g., formatLegalAmount(1500) → "MIL QUINIENTOS QUETZALES EXACTOS (Q.1,500.00)"
 */
export function formatLegalAmount(amount: number): string {
  const words = numeroALetras(amount);
  const formatted = new Intl.NumberFormat("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${words} (Q.${formatted})`;
}

/**
 * Format a number as Spanish words for legal use (no currency).
 * Used for area measurements, quantities, etc.
 */
export function numeroEnLetras(n: number): string {
  return numberToWords(Math.floor(n)).toLowerCase();
}

/**
 * Convert a digit group (possibly with leading zeros) to Spanish words.
 * Leading zeros are spoken as "cero".
 *
 * Examples:
 *   "2539"  → "dos mil quinientos treinta y nueve"
 *   "09511" → "cero nueve mil quinientos once"
 *   "0101"  → "cero ciento uno"
 */
function cuiGroupToWords(group: string): string {
  let leadingZeros = 0;
  for (const ch of group) {
    if (ch === "0") leadingZeros++;
    else break;
  }

  const parts: string[] = [];
  for (let i = 0; i < leadingZeros; i++) {
    parts.push("cero");
  }

  const remainder = parseInt(group.slice(leadingZeros), 10);
  if (!isNaN(remainder) && remainder > 0) {
    parts.push(numberToWords(remainder).toLowerCase());
  }

  return parts.join(" ");
}

/**
 * Format a 13-digit CUI in Guatemalan legal notation.
 *
 * The CUI is split into 4-5-4 groups, each spelled out in words,
 * followed by the grouped digits in parentheses.
 *
 * Example:
 *   "2539095110101" →
 *   "dos mil quinientos treinta y nueve, cero nueve mil quinientos once,
 *    cero ciento uno (2539 09511 0101)"
 *
 * Returns the raw string unchanged if it's not exactly 13 digits.
 */
export function formatCuiLegal(cui: string): string {
  const digits = cui.replace(/\D/g, "");
  if (digits.length !== 13) return cui;

  const g1 = digits.slice(0, 4);
  const g2 = digits.slice(4, 9);
  const g3 = digits.slice(9, 13);

  const w1 = cuiGroupToWords(g1);
  const w2 = cuiGroupToWords(g2);
  const w3 = cuiGroupToWords(g3);

  return `${w1}, ${w2}, ${w3} (${g1} ${g2} ${g3})`;
}
