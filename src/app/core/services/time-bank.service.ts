import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WorkItemService } from './work-item.service';
import { TimeBankBalance, TimeBankOffDay, TimeBankSettings } from '../models/time-bank.model';
import { addDays, fromLocalIso, toLocalIso } from '../utils/date.util';
import { isBrazilianHoliday } from '../utils/holidays.util';

export const DEFAULT_DAILY_GOAL_HOURS = 8;

type SettingsInput = Pick<TimeBankSettings, 'initial_balance' | 'start_date' | 'daily_goal_hours'>;

@Injectable({ providedIn: 'root' })
export class TimeBankService {
  private readonly supabase = inject(SupabaseService);
  private readonly workItems = inject(WorkItemService);

  /** Load the signed-in user's time-bank settings, or null if not configured yet. */
  async getSettings(): Promise<TimeBankSettings | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('time_bank_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return (data as TimeBankSettings | null) ?? null;
  }

  /** Persist the settings for the signed-in user (one row per user, upserted on user_id). */
  async saveSettings(settings: SettingsInput): Promise<TimeBankSettings> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('time_bank_settings')
      .upsert(
        {
          user_id: user.id,
          initial_balance: settings.initial_balance,
          start_date: settings.start_date,
          daily_goal_hours: settings.daily_goal_hours,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data as TimeBankSettings;
  }

  /** Load the user's manually-marked non-working days, ordered by date. */
  async getOffDays(): Promise<TimeBankOffDay[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('time_bank_off_days')
      .select('*')
      .eq('user_id', user.id)
      .order('day', { ascending: true });

    if (error) throw error;
    return (data as TimeBankOffDay[] | null) ?? [];
  }

  /** Mark a day as non-working (upserted on the user_id + day primary key). */
  async addOffDay(day: string, label = ''): Promise<void> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('time_bank_off_days')
      .upsert({ user_id: user.id, day, label }, { onConflict: 'user_id,day' });

    if (error) throw error;
  }

  /** Remove a previously-marked non-working day. */
  async removeOffDay(day: string): Promise<void> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('time_bank_off_days')
      .delete()
      .eq('user_id', user.id)
      .eq('day', day);

    if (error) throw error;
  }

  /**
   * Compute the time-bank balance from the given settings.
   *
   * Counts every working day (Mon–Fri, excluding Brazilian national holidays and any
   * `offDays` the user marked manually) from `start_date` up to and including yesterday
   * — the current day never counts. Each counted day contributes `worked − daily_goal`
   * to the balance, so days with no logged hours become a deficit.
   */
  async computeBalance(
    settings: SettingsInput,
    offDays: ReadonlySet<string> = new Set(),
    today = new Date(),
  ): Promise<TimeBankBalance> {
    const yesterday = addDays(today, -1);
    const yesterdayIso = toLocalIso(yesterday);
    const goal = settings.daily_goal_hours;

    const empty: TimeBankBalance = {
      balance: settings.initial_balance,
      initialBalance: settings.initial_balance,
      accrued: 0,
      workedHours: 0,
      expectedHours: 0,
      workingDays: 0,
      lastCountedDate: null,
    };

    // Nothing to count if the start date is today or in the future.
    if (settings.start_date > yesterdayIso) return empty;

    const items = await this.workItems.getEntriesForRange(settings.start_date, yesterdayIso);

    const hoursByDate = new Map<string, number>();
    for (const item of items) {
      const dayTotal = item.hour_entries.reduce((sum, h) => sum + h.hours, 0);
      hoursByDate.set(item.work_date, (hoursByDate.get(item.work_date) ?? 0) + dayTotal);
    }

    let workedHours = 0;
    let workingDays = 0;
    let lastCountedDate: string | null = null;

    for (let d = fromLocalIso(settings.start_date); toLocalIso(d) <= yesterdayIso; d = addDays(d, 1)) {
      const dow = d.getDay(); // 0 = Sunday … 6 = Saturday
      if (dow === 0 || dow === 6) continue; // weekends
      const iso = toLocalIso(d);
      if (isBrazilianHoliday(iso)) continue;
      if (offDays.has(iso)) continue; // manually-marked non-working days

      workedHours += hoursByDate.get(iso) ?? 0;
      workingDays += 1;
      lastCountedDate = iso;
    }

    const expectedHours = workingDays * goal;
    const accrued = workedHours - expectedHours;

    return {
      balance: settings.initial_balance + accrued,
      initialBalance: settings.initial_balance,
      accrued,
      workedHours,
      expectedHours,
      workingDays,
      lastCountedDate,
    };
  }
}
