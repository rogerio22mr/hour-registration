import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WorkItemService } from '../../core/services/work-item.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ThemeService } from '../../core/services/theme.service';
import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { toLocalIso } from '../../core/utils/date.util';
import { formatHours } from '../../core/utils/hours.util';
import { WorkItem } from '../../core/models/work-item.model';
import { AddWorkItemComponent } from './add-work-item/add-work-item';
import { CalendarComponent } from './calendar/calendar';

@Component({
  selector: 'app-home',
  imports: [DatePipe, DecimalPipe, RouterLink, AddWorkItemComponent, CalendarComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly workItemService = inject(WorkItemService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly exportService = inject(ExportService);
  protected readonly loc = inject(LocaleService);
  protected readonly t = this.loc.t;

  /** Target hours for a full work day, used by the daily goal progress bar. */
  readonly dailyGoalHours = 8;
  readonly isDark = this.theme.isDark;

  private readonly todayIso = toLocalIso(new Date());
  readonly userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  readonly selectedDate = signal(new Date());
  readonly selectedDateIso = computed(() => toLocalIso(this.selectedDate()));
  readonly isToday = computed(() => this.selectedDateIso() === this.todayIso);

  readonly entries = signal<WorkItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly showCalendar = signal(false);
  readonly showAddForm = signal(false);
  readonly editingItem = signal<WorkItem | null>(null);
  readonly deletingItemId = signal<string | null>(null);
  readonly deleteLoading = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly copiedItemId = signal<string | null>(null);
  readonly approvingItemId = signal<string | null>(null);
  readonly approveErrorItemId = signal<string | null>(null);
  readonly approveError = signal<string | null>(null);

  readonly totalHours = computed(() =>
    this.entries().reduce(
      (sum, entry) => sum + entry.hour_entries.reduce((s, h) => s + h.hours, 0),
      0,
    ),
  );

  readonly goalProgress = computed(() => {
    const ratio = this.totalHours() / this.dailyGoalHours;
    return Math.min(Math.round(ratio * 100), 100);
  });
  readonly goalReached = computed(() => this.totalHours() >= this.dailyGoalHours);

  readonly formWorkDate = computed(() => this.editingItem()?.work_date ?? this.selectedDateIso());

  toggleTheme() {
    this.theme.toggle();
  }

  exportDay() {
    const items = this.entries();
    if (!items.length) {
      this.toast.error(this.t('toast.noItemsToExport'));
      return;
    }
    this.exportService.downloadCsv(items, `hours-${this.selectedDateIso()}`);
    this.toast.success(this.t('toast.dayExported'));
  }

  constructor() {
    effect(() => {
      this.loadEntries(this.selectedDateIso());
    });
  }

  private async loadEntries(date: string) {
    this.loading.set(true);
    this.error.set(null);
    this.entries.set([]);
    try {
      const data = await this.workItemService.getEntriesForDate(date);
      this.entries.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.t('error.loadItems'));
    } finally {
      this.loading.set(false);
    }
  }

  previousDay() {
    this.selectedDate.update((d) => {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      return prev;
    });
  }

  nextDay() {
    if (this.isToday()) return;
    this.selectedDate.update((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  goToToday() {
    this.selectedDate.set(new Date());
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
    this.showCalendar.set(false);
  }

  entryTotalHours(entry: WorkItem): number {
    return entry.hour_entries.reduce((s, h) => s + h.hours, 0);
  }

  async copyHours(entry: WorkItem) {
    const total = this.entryTotalHours(entry);
    const decimal = total.toFixed(2);
    try {
      await navigator.clipboard.writeText(decimal);
      this.copiedItemId.set(entry.id);
      setTimeout(() => this.copiedItemId.set(null), 2000);
      this.toast.success(this.t('toast.copied', { value: decimal }));
    } catch {
      this.toast.error(this.t('toast.copyFailed'));
    }
  }

  readonly formatHours = formatHours;

  onWorkItemSaved(item: WorkItem) {
    const sortByFirstEntry = (a: WorkItem, b: WorkItem) => {
      const at = a.hour_entries[0]?.start_time ?? '';
      const bt = b.hour_entries[0]?.start_time ?? '';
      return at.localeCompare(bt);
    };

    if (this.editingItem()) {
      this.entries.update((list) =>
        list.map((e) => (e.id === item.id ? item : e)).sort(sortByFirstEntry),
      );
      this.editingItem.set(null);
      this.toast.success(this.t('toast.itemUpdated'));
    } else {
      this.entries.update((list) => [...list, item].sort(sortByFirstEntry));
      this.showAddForm.set(false);
      this.toast.success(this.t('toast.itemAdded'));
    }
  }

  onFormCancelled() {
    this.showAddForm.set(false);
    this.editingItem.set(null);
  }

  async toggleApprove(entry: WorkItem) {
    this.approvingItemId.set(entry.id);
    this.approveError.set(null);
    this.approveErrorItemId.set(null);
    try {
      const updated = await this.workItemService.approveWorkItem(entry.id, !entry.approved);
      this.entries.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
      this.toast.success(updated.approved ? this.t('toast.itemApproved') : this.t('toast.approvalRemoved'));
    } catch (err) {
      this.approveError.set(err instanceof Error ? err.message : this.t('error.updateApproval'));
      this.approveErrorItemId.set(entry.id);
    } finally {
      this.approvingItemId.set(null);
    }
  }

  async confirmDelete(id: string) {
    this.deleteLoading.set(true);
    this.deleteError.set(null);
    try {
      await this.workItemService.deleteWorkItem(id);
      this.entries.update((list) => list.filter((e) => e.id !== id));
      this.deletingItemId.set(null);
      this.toast.success(this.t('toast.itemDeleted'));
    } catch (err) {
      this.deleteError.set(err instanceof Error ? err.message : this.t('error.deleteItem'));
    } finally {
      this.deleteLoading.set(false);
    }
  }

  async signOut() {
    await this.supabase.signOut();
    await this.router.navigate(['/login']);
  }
}
