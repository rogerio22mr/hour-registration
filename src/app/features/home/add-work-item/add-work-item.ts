import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkItemService } from '../../../core/services/work-item.service';
import { WorkItem } from '../../../core/models/work-item.model';

@Component({
  selector: 'app-add-work-item',
  imports: [ReactiveFormsModule],
  templateUrl: './add-work-item.html',
  styleUrl: './add-work-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddWorkItemComponent implements OnInit, AfterViewInit {
  @ViewChild('dialog') private readonly dialogRef!: ElementRef<HTMLDialogElement>;

  private readonly workItemService = inject(WorkItemService);
  private readonly fb = inject(FormBuilder);

  readonly workDate = input.required<string>();
  readonly editItem = input<WorkItem | undefined>(undefined);
  readonly saved = output<WorkItem>();
  readonly cancelled = output<void>();

  readonly isEditing = computed(() => !!this.editItem());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    hourEntries: this.fb.array([this.buildHourEntryGroup()]),
  });

  get hourEntriesArray() {
    return this.form.controls.hourEntries;
  }

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  readonly entryHoursDisplay = computed(() => {
    const entries = this.formValues().hourEntries ?? [];
    return entries.map((e) =>
      this.formatHours(this.calcHours(e?.start_time ?? '', e?.end_time ?? '')),
    );
  });

  readonly totalHoursDisplay = computed(() => {
    const entries = this.formValues().hourEntries ?? [];
    const total = entries.reduce(
      (sum, e) => sum + (this.calcHours(e?.start_time ?? '', e?.end_time ?? '') ?? 0),
      0,
    );
    return this.formatHours(total > 0 ? total : null);
  });

  private buildHourEntryGroup() {
    return this.fb.nonNullable.group({
      start_time: ['', Validators.required],
      end_time: [''],
    });
  }

  ngOnInit() {
    const item = this.editItem();
    if (!item) return;

    this.form.patchValue({ title: item.title, description: item.description });

    while (this.hourEntriesArray.length > 0) {
      this.hourEntriesArray.removeAt(0);
    }

    const entries = item.hour_entries?.length ? item.hour_entries : null;
    if (!entries) {
      this.hourEntriesArray.push(this.buildHourEntryGroup());
    } else {
      for (const entry of entries) {
        const group = this.buildHourEntryGroup();
        group.patchValue({
          start_time: this.toLocalTime(entry.start_time),
          end_time: entry.end_time ? this.toLocalTime(entry.end_time) : '',
        });
        this.hourEntriesArray.push(group);
      }
    }
  }

  ngAfterViewInit() {
    this.dialogRef.nativeElement.showModal();
  }

  addHourEntry() {
    this.hourEntriesArray.push(this.buildHourEntryGroup());
  }

  removeHourEntry(index: number) {
    if (this.hourEntriesArray.length > 1) {
      this.hourEntriesArray.removeAt(index);
    }
  }

  fillCurrentTime(entryIndex: number, field: 'start_time' | 'end_time', event: KeyboardEvent) {
    if (event.key !== 'h' && event.key !== 'H') return;
    event.preventDefault();
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    this.hourEntriesArray.at(entryIndex).controls[field].setValue(`${h}:${m}`);
  }

  private toLocalTime(isoString: string): string {
    const d = new Date(isoString);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private calcHours(startTime: string, endTime: string): number | null {
    if (!startTime) return null;
    if (!endTime) return 0;
    const start = new Date(`${this.workDate()}T${startTime}:00`);
    const end = new Date(`${this.workDate()}T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private formatHours(h: number | null): string | null {
    if (h === null || h <= 0) return null;
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return mins > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${hours}h`;
  }

  titleInvalid(): boolean {
    const c = this.form.controls.title;
    return c.invalid && c.touched;
  }

  entryStartTimeInvalid(index: number): boolean {
    const c = this.hourEntriesArray.at(index).controls.start_time;
    return c.invalid && c.touched;
  }

  entryEndTimeBeforeStart(index: number): boolean {
    const entry = this.hourEntriesArray.at(index).value;
    const endValue = entry.end_time;
    const endControl = this.hourEntriesArray.at(index).controls.end_time;
    return (
      !!endValue &&
      endControl.touched &&
      (this.calcHours(entry.start_time ?? '', endValue) ?? 0) <= 0
    );
  }

  async onSubmit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const hasEndBeforeStart = this.hourEntriesArray.controls.some((_, i) =>
      this.entryEndTimeBeforeStart(i),
    );
    if (hasEndBeforeStart) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { title, description } = this.form.getRawValue();
      const hourEntries = this.hourEntriesArray.getRawValue().map((e) => ({
        start_time: new Date(`${this.workDate()}T${e.start_time}:00`).toISOString(),
        end_time: e.end_time
          ? new Date(`${this.workDate()}T${e.end_time}:00`).toISOString()
          : null,
        hours: this.calcHours(e.start_time, e.end_time) ?? 0,
      }));

      const editItem = this.editItem();
      const result = editItem
        ? await this.workItemService.updateWorkItem(editItem.id, { title, description }, hourEntries)
        : await this.workItemService.addWorkItem(
            { title, description, work_date: this.workDate() },
            hourEntries,
          );

      this.dialogRef.nativeElement.close();
      this.saved.emit(result);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to save work item.');
    } finally {
      this.loading.set(false);
    }
  }

  onCancel() {
    this.dialogRef.nativeElement.close();
    this.cancelled.emit();
  }
}
