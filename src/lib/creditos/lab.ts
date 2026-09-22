/**
 * TEMPORARY — E06 lab simulation of the Entregas keys appointment.
 *
 * The real Entregas gate is not built yet, and `entregado` sits in the middle of the
 * closing path, so the tail after it cannot be exercised by hand. Until it exists, the
 * local lab offers a "simulate delivery" action. It must never run against production:
 * a simulated delivery written to a real expediente would be permanent false history.
 *
 * Delete this file, the `entregado-simulado` route and the button in
 * `nuevo-expediente.tsx` when the real Entregas gate lands.
 */

/** Recorded in the history, so a simulated delivery is never mistaken for a real one. */
export const ORIGEN_SIMULADO = "simulación de laboratorio (E06, temporal)";

/** True only when the given Supabase URL is the local lab. Anything unparsable is not. */
export function isLocalLab(supabaseUrl: string | undefined): boolean {
  if (!supabaseUrl) return false;
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(supabaseUrl).hostname);
  } catch {
    return false;
  }
}
