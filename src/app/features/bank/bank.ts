import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DEFAULT_DAILY_GOAL_HOURS,
  TimeBankService,
} from '../../core/services/time-bank.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { LocaleService } from '../../core/services/locale.service';
import { TimeBankBalance, TimeBankOffDay } from '../../core/models/time-bank.model';
import { fromLocalIso, toLocalIso } from '../../core/utils/date.util';
import { formatHours, formatHoursColon, parseHoursColon } from '../../core/utils/hours.util';

/** Validates a signed `H:MM` (or bare `H`) time string. */
function hoursColonValidator(control: AbstractControl): ValidationErrors | null {
  return parseHoursColon(control.value ?? '') === null ? { hoursColon: true } : null;
}

@Component({
  selector: 'app-bank',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, RouterLink, MatTooltipModule],
  templateUrl: './bank.html',
  styleUrl: './bank.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankComponent {
  private readonly bank = inject(TimeBankService);
  private readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  protected readonly loc = inject(LocaleService);
  protected readonly t = this.loc.t;

  readonly isDark = this.theme.isDark;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly calculating = signal(false);
  readonly result = signal<TimeBankBalance | null>(null);
  readonly offDays = signal<TimeBankOffDay[]>([]);
  readonly addingOffDay = signal(false);
  readonly removingOffDay = signal<string | null>(null);

  readonly form = new FormGroup({
    initialBalance: new FormControl('0:00', {
      nonNullable: true,
      validators: [Validators.required, hoursColonValidator],
    }),
    startDate: new FormControl(toLocalIso(new Date()), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dailyGoal: new FormControl(DEFAULT_DAILY_GOAL_HOURS, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.1)],
    }),
  });

  readonly offDayForm = new FormGroup({
    day: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    label: new FormControl('', { nonNullable: true }),
  });

  readonly balance = computed(() => this.result()?.balance ?? 0);
  readonly isPositive = computed(() => this.balance() >= 0);

  constructor() {
    void this.load();
  }

  private async load() {
    this.loading.set(true);
    try {
      const [settings, offDays] = await Promise.all([
        this.bank.getSettings(),
        this.bank.getOffDays(),
      ]);
      this.offDays.set(offDays);
      if (settings) {
        this.form.setValue({
          initialBalance: formatHoursColon(settings.initial_balance),
          startDate: settings.start_date,
          dailyGoal: settings.daily_goal_hours,
        });
        await this.calculate();
      }
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : this.t('bank.loadError'));
    } finally {
      this.loading.set(false);
    }
  }

  private offDaySet(): Set<string> {
    return new Set(this.offDays().map((o) => o.day));
  }

  private currentSettings() {
    const v = this.form.getRawValue();
    return {
      initial_balance: parseHoursColon(v.initialBalance) ?? 0,
      start_date: v.startDate,
      daily_goal_hours: v.dailyGoal,
    };
  }

  async calculate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.calculating.set(true);
    try {
      this.result.set(await this.bank.computeBalance(this.currentSettings(), this.offDaySet()));
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : this.t('bank.calcError'));
    } finally {
      this.calculating.set(false);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      await this.bank.saveSettings(this.currentSettings());
      await this.calculate();
      this.toast.success(this.t('bank.saved'));
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : this.t('bank.saveError'));
    } finally {
      this.saving.set(false);
    }
  }

  async addOffDay() {
    if (this.offDayForm.invalid) {
      this.offDayForm.markAllAsTouched();
      return;
    }
    const { day, label } = this.offDayForm.getRawValue();
    this.addingOffDay.set(true);
    try {
      await this.bank.addOffDay(day, label.trim());
      this.offDays.set(await this.bank.getOffDays());
      this.offDayForm.reset({ day: '', label: '' });
      await this.calculate();
      this.toast.success(this.t('bank.offDayAdded'));
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : this.t('bank.offDayError'));
    } finally {
      this.addingOffDay.set(false);
    }
  }

  async removeOffDay(day: string) {
    this.removingOffDay.set(day);
    try {
      await this.bank.removeOffDay(day);
      this.offDays.update((list) => list.filter((o) => o.day !== day));
      await this.calculate();
      this.toast.success(this.t('bank.offDayRemoved'));
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : this.t('bank.offDayError'));
    } finally {
      this.removingOffDay.set(null);
    }
  }

  toggleTheme() {
    this.theme.toggle();
  }

  /** Parse a local `YYYY-MM-DD` into a Date for the DatePipe (timezone-safe). */
  parseDay(iso: string): Date {
    return fromLocalIso(iso);
  }

  /** Format a signed hours value as e.g. "+12h 30m" / "−4h". */
  signedHours(hours: number): string {
    const sign = hours < 0 ? '−' : '+';
    return `${sign}${formatHours(Math.abs(hours))}`;
  }

  readonly formatHours = formatHours;
}
