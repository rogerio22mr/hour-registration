import { toLocalIso } from './date.util';

/**
 * Easter Sunday for a given year (Anonymous Gregorian / Meeus–Jones–Butcher algorithm).
 * Returned at local noon to stay DST-safe, like the rest of the date utils.
 */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0);
}

/** A date `offset` days away from `base`, at local noon. */
function shift(base: Date, offset: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 12, 0, 0);
}

/** Cache of `year -> Set<'YYYY-MM-DD'>` so repeated lookups are cheap. */
const cache = new Map<number, Set<string>>();

/**
 * The set of Brazilian national holidays (as local `YYYY-MM-DD` strings) for a year.
 *
 * Includes the fixed national holidays plus the movable ones derived from Easter
 * (Carnaval Monday/Tuesday, Good Friday and Corpus Christi). Consciência Negra
 * (Nov 20) is national from 2024 onward (Law 14.759/2024).
 */
export function brazilianHolidays(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const dates = [
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalho
    `${year}-09-07`, // Independência
    `${year}-10-12`, // Nossa Senhora Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-12-25`, // Natal
    toLocalIso(shift(easter, -48)), // Carnaval (segunda)
    toLocalIso(shift(easter, -47)), // Carnaval (terça)
    toLocalIso(shift(easter, -2)), // Sexta-feira Santa
    toLocalIso(shift(easter, 60)), // Corpus Christi
  ];

  if (year >= 2024) {
    dates.push(`${year}-11-20`); // Consciência Negra (nacional desde 2024)
  }

  const set = new Set(dates);
  cache.set(year, set);
  return set;
}

/** Whether a local `YYYY-MM-DD` date is a Brazilian national holiday. */
export function isBrazilianHoliday(iso: string): boolean {
  const year = Number(iso.slice(0, 4));
  return brazilianHolidays(year).has(iso);
}
