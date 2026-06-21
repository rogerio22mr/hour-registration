/** Format a Date as a local `YYYY-MM-DD` string (timezone-safe, unlike toISOString). */
export function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a local `YYYY-MM-DD` string into a Date at local noon (avoids DST edge cases). */
export function fromLocalIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Add (or subtract) whole days to a date, returning a new Date. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-based start of the week containing `date`, at local midnight. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

/** The seven local dates (Mon→Sun) of the week containing `date`. */
export function weekDates(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
