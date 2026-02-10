/**
 * Calendar-based date presets for executive dashboards.
 * Uses inclusive start/end (YYYY-MM-DD) so APIs can use gte/lte.
 */

export type DateRange = { start: string; end: string };

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function firstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function lastDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export const DATE_PRESETS: Record<
  string,
  { label: string; getRange: () => DateRange }
> = {
  this_month: {
    label: "Este mes",
    getRange: () => {
      const now = new Date();
      return {
        start: toISO(firstDayOfMonth(now)),
        end: toISO(lastDayOfMonth(now))
      };
    }
  },
  last_month: {
    label: "Mes pasado",
    getRange: () => {
      const d = new Date();
      const prev = new Date(d.getFullYear(), d.getMonth() - 1);
      return {
        start: toISO(firstDayOfMonth(prev)),
        end: toISO(lastDayOfMonth(prev))
      };
    }
  },
  this_year: {
    label: "Este año",
    getRange: () => {
      const y = new Date().getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
  },
  last_year: {
    label: "Año pasado",
    getRange: () => {
      const y = new Date().getFullYear() - 1;
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
  },
  last_7_days: {
    label: "Últimos 7 días",
    getRange: () => {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return { start: toISO(start), end: toISO(end) };
    }
  },
  last_30_days: {
    label: "Últimos 30 días",
    getRange: () => {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      return { start: toISO(start), end: toISO(end) };
    }
  }
};

export type PresetKey = keyof typeof DATE_PRESETS;

/** Format range for display, e.g. "1 ene – 31 ene 2025" */
export function formatDateRangeLabel(start: string, end: string): string {
  if (!start || !end) return "";
  const a = new Date(start + "T12:00:00");
  const b = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric"
  };
  return `${a.toLocaleDateString("es-GT", opts)} – ${b.toLocaleDateString("es-GT", opts)}`;
}

/** Detect which preset matches the current start/end, if any */
export function getPresetKeyForRange(
  start: string,
  end: string
): PresetKey | null {
  if (!start || !end) return null;
  for (const key of Object.keys(DATE_PRESETS) as PresetKey[]) {
    const { getRange } = DATE_PRESETS[key];
    const r = getRange();
    if (r.start === start && r.end === end) return key;
  }
  return null;
}
