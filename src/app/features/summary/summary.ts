import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkItemService } from '../../core/services/work-item.service';
import { ThemeService } from '../../core/services/theme.service';
import { ExportService } from '../../core/services/export.service';
import { ToastService } from '../../core/services/toast.service';
import { WorkItem } from '../../core/models/work-item.model';
import { addDays, startOfWeek, toLocalIso, weekDates } from '../../core/utils/date.util';
import { formatHours } from '../../core/utils/hours.util';

interface DayBucket {
  date: Date;
  iso: string;
  isToday: boolean;
  hours: number;
  itemCount: number;
}

@Component({
  selector: 'app-summary',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  private readonly workItemService = inject(WorkItemService);
  private readonly theme = inject(ThemeService);
  private readonly exportService = inject(ExportService);
  private readonly toast = inject(ToastService);

  readonly dailyGoalHours = 8;
  readonly isDark = this.theme.isDark;

  private readonly todayIso = toLocalIso(new Date());
  readonly weekStart = signal(startOfWeek(new Date()));
  readonly weekEnd = computed(() => addDays(this.weekStart(), 6));

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly items = signal<WorkItem[]>([]);

  readonly isCurrentWeek = computed(
    () => toLocalIso(this.weekStart()) === toLocalIso(startOfWeek(new Date())),
  );

  readonly days = computed<DayBucket[]>(() => {
    const items = this.items();
    return weekDates(this.weekStart()).map((date) => {
      const iso = toLocalIso(date);
      const dayItems = items.filter((i) => i.work_date === iso);
      const hours = dayItems.reduce(
        (sum, i) => sum + i.hour_entries.reduce((s, h) => s + h.hours, 0),
        0,
      );
      return { date, iso, isToday: iso === this.todayIso, hours, itemCount: dayItems.length };
    });
  });

  readonly hasData = computed(() => this.items().length > 0);
  readonly weekTotal = computed(() => this.days().reduce((s, d) => s + d.hours, 0));
  readonly maxDayHours = computed(() => Math.max(this.dailyGoalHours, ...this.days().map((d) => d.hours)));
  readonly activeDays = computed(() => this.days().filter((d) => d.hours > 0).length);
  readonly dailyAverage = computed(() => {
    const active = this.activeDays();
    return active > 0 ? this.weekTotal() / active : 0;
  });

  constructor() {
    effect(() => {
      this.loadWeek(toLocalIso(this.weekStart()), toLocalIso(this.weekEnd()));
    });
  }

  private async loadWeek(start: string, end: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.items.set(await this.workItemService.getEntriesForRange(start, end));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load weekly summary.');
    } finally {
      this.loading.set(false);
    }
  }

  previousWeek() {
    this.weekStart.update((d) => addDays(d, -7));
  }

  nextWeek() {
    if (this.isCurrentWeek()) return;
    this.weekStart.update((d) => addDays(d, 7));
  }

  goToThisWeek() {
    this.weekStart.set(startOfWeek(new Date()));
  }

  toggleTheme() {
    this.theme.toggle();
  }

  exportCsv() {
    const items = this.items();
    if (!items.length) {
      this.toast.error('No hours to export for this week');
      return;
    }
    this.exportService.downloadCsv(
      items,
      `hours-${toLocalIso(this.weekStart())}_${toLocalIso(this.weekEnd())}`,
    );
    this.toast.success('Weekly CSV exported');
  }

  /** Bar height as a percentage of the tallest bar in the week. */
  barHeight(hours: number): number {
    const max = this.maxDayHours();
    return max > 0 ? Math.round((hours / max) * 100) : 0;
  }

  readonly formatHours = formatHours;
}
