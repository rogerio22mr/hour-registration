export interface TimeBankSettings {
  user_id: string;
  /** Hours already in the bank at the start date (can be negative). */
  initial_balance: number;
  /** Local `YYYY-MM-DD` date from which the calculation starts (inclusive). */
  start_date: string;
  /** Expected hours per working day used to compute the daily surplus/deficit. */
  daily_goal_hours: number;
  created_at: string;
  updated_at: string;
}

/** A day the user manually marked as non-working, excluded from the calculation. */
export interface TimeBankOffDay {
  user_id: string;
  /** Local `YYYY-MM-DD` date. */
  day: string;
  /** Optional note (e.g. "Folga", "Feriado municipal"). */
  label: string;
  created_at: string;
}

/** Computed time-bank result, derived from the settings and logged work hours. */
export interface TimeBankBalance {
  /** Final balance = initial + accumulated surplus/deficit (can be negative). */
  balance: number;
  /** The configured initial balance carried into the calculation. */
  initialBalance: number;
  /** Surplus/deficit accumulated over the counted working days. */
  accrued: number;
  /** Total hours actually worked across the counted working days. */
  workedHours: number;
  /** Total expected hours (counted working days × daily goal). */
  expectedHours: number;
  /** Number of working days counted (weekdays, excluding holidays). */
  workingDays: number;
  /** Last day included in the calculation (yesterday), or null if none. */
  lastCountedDate: string | null;
}
