/** Format a decimal hours value as a compact `Hh Mm` string (e.g. 1.5 → "1h 30m"). */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${h}h`;
}

/**
 * Format decimal hours as a signed `H:MM` string (e.g. 2.25 → "2:15", -1.75 → "-1:45").
 * Used by inputs where the user types hours and minutes directly.
 */
export function formatHoursColon(hours: number): string {
  const sign = hours < 0 ? '-' : '';
  const totalMinutes = Math.round(Math.abs(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${sign}${h}:${m.toString().padStart(2, '0')}`;
}

/**
 * Parse a signed `H:MM` (or bare `H`) string into decimal hours, or null if invalid.
 * Examples: "2:15" → 2.25, "-1:45" → -1.75, "3" → 3, "0:30" → 0.5.
 */
export function parseHoursColon(value: string): number | null {
  const match = /^\s*(-)?(\d+)(?::([0-5]?\d))?\s*$/.exec(value);
  if (!match) return null;
  const [, sign, h, m] = match;
  const hours = Number(h) + (m ? Number(m) / 60 : 0);
  return sign ? -hours : hours;
}
