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
    start_time: ['', Validators.required],
    end_time: [''],
  });

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  readonly calculatedHours = computed((): number | null => {
    const { start_time, end_time } = this.formValues();
    if (!start_time) return null;
    if (!end_time) return 0;
    const start = new Date(`${this.workDate()}T${start_time}:00`);
    const end = new Date(`${this.workDate()}T${end_time}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  });

  readonly hoursDisplay = computed(() => {
    const h = this.calculatedHours();
    if (h === null || h <= 0) return null;
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    return mins > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${hours}h`;
  });

  ngOnInit() {
    const item = this.editItem();
    if (item) {
      this.form.patchValue({
        title: item.title,
        description: item.description,
        start_time: item.start_time.slice(11, 16),
        end_time: item.end_time ? item.end_time.slice(11, 16) : '',
      });
    }
  }

  ngAfterViewInit() {
    this.dialogRef.nativeElement.showModal();
  }

  fillCurrentTime(field: 'start_time' | 'end_time', event: KeyboardEvent) {
    if (event.key !== 'h' && event.key !== 'H') return;
    event.preventDefault();
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    this.form.controls[field].setValue(`${h}:${m}`);
  }

  titleInvalid() {
    const c = this.form.controls.title;
    return c.invalid && c.touched;
  }

  startTimeInvalid() {
    const c = this.form.controls.start_time;
    return c.invalid && c.touched;
  }

  endTimeBeforeStart() {
    const endValue = this.form.controls.end_time.value;
    return (
      !!endValue &&
      this.form.controls.end_time.touched &&
      (this.calculatedHours() ?? 0) <= 0
    );
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.endTimeBeforeStart()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const { title, description, start_time, end_time } = this.form.getRawValue();
      const payload = {
        title,
        description,
        start_time: `${this.workDate()}T${start_time}:00`,
        end_time: end_time ? `${this.workDate()}T${end_time}:00` : null,
        hours: this.calculatedHours() ?? 0,
      };

      const editItem = this.editItem();
      const result = editItem
        ? await this.workItemService.updateWorkItem(editItem.id, payload)
        : await this.workItemService.addWorkItem({ ...payload, work_date: this.workDate() });

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
