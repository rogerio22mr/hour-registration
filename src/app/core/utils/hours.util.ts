/** Format a decimal hours value as a compact `Hh Mm` string (e.g. 1.5 → "1h 30m"). */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${h}h`;
}
