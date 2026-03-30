import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { WorkItemService } from '../../core/services/work-item.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { WorkItem } from '../../core/models/work-item.model';
import { AddWorkItemComponent } from './add-work-item/add-work-item';

@Component({
  selector: 'app-home',
  imports: [DatePipe, DecimalPipe, AddWorkItemComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly workItemService = inject(WorkItemService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  private readonly todayIso = new Date().toISOString().slice(0, 10);
  readonly userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  readonly selectedDate = signal(new Date());
  readonly selectedDateIso = computed(() => this.selectedDate().toISOString().slice(0, 10));
  readonly isToday = computed(() => this.selectedDateIso() === this.todayIso);

  readonly entries = signal<WorkItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly showAddForm = signal(false);
  readonly editingItem = signal<WorkItem | null>(null);
  readonly deletingItemId = signal<string | null>(null);
  readonly deleteLoading = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly totalHours = computed(() =>
    this.entries().reduce(
      (sum, entry) => sum + entry.hour_entries.reduce((s, h) => s + h.hours, 0),
      0,
    ),
  );

  readonly formWorkDate = computed(() => this.editingItem()?.work_date ?? this.selectedDateIso());

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
      this.error.set(err instanceof Error ? err.message : 'Failed to load work items.');
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

  entryTotalHours(entry: WorkItem): number {
    return entry.hour_entries.reduce((s, h) => s + h.hours, 0);
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${h}h`;
  }

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
    } else {
      this.entries.update((list) => [...list, item].sort(sortByFirstEntry));
      this.showAddForm.set(false);
    }
  }

  onFormCancelled() {
    this.showAddForm.set(false);
    this.editingItem.set(null);
  }

  async confirmDelete(id: string) {
    this.deleteLoading.set(true);
    this.deleteError.set(null);
    try {
      await this.workItemService.deleteWorkItem(id);
      this.entries.update((list) => list.filter((e) => e.id !== id));
      this.deletingItemId.set(null);
    } catch (err) {
      this.deleteError.set(err instanceof Error ? err.message : 'Failed to delete work item.');
    } finally {
      this.deleteLoading.set(false);
    }
  }

  async signOut() {
    await this.supabase.signOut();
    await this.router.navigate(['/login']);
  }
}
