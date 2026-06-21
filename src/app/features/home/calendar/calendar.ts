import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toLocalIso } from '../../../core/utils/date.util';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [DatePipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  readonly selectedDate = input.required<Date>();
  readonly maxDate = input<Date>(new Date());
  readonly dateSelected = output<Date>();

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly viewMonth = signal(new Date());

  readonly isViewingCurrentMonth = computed(() => {
    const view = this.viewMonth();
    const today = new Date();
    return view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
  });

  readonly canGoNextMonth = computed(() => {
    const view = this.viewMonth();
    const max = this.maxDate();
    return (
      view.getFullYear() < max.getFullYear() ||
      (view.getFullYear() === max.getFullYear() && view.getMonth() < max.getMonth())
    );
  });

  readonly calendarWeeks = computed(() => {
    const view = this.viewMonth();
    const year = view.getFullYear();
    const month = view.getMonth();
    const todayIso = toLocalIso(new Date());
    const selectedIso = toLocalIso(this.selectedDate());
    const maxIso = toLocalIso(this.maxDate());

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d, 12, 0, 0);
      const dateIso = toLocalIso(date);
      days.push({
        date,
        dayNumber: d,
        isToday: dateIso === todayIso,
        isSelected: dateIso === selectedIso,
        isFuture: dateIso > maxIso,
      });
    }

    const weeks: (CalendarDay | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return weeks;
  });

  constructor() {
    effect(() => {
      const sel = this.selectedDate();
      this.viewMonth.update((vm) => {
        if (vm.getFullYear() !== sel.getFullYear() || vm.getMonth() !== sel.getMonth()) {
          return new Date(sel.getFullYear(), sel.getMonth(), 1);
        }
        return vm;
      });
    });
  }

  prevMonth() {
    this.viewMonth.update((d) => {
      const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      return prev;
    });
  }

  nextMonth() {
    if (!this.canGoNextMonth()) return;
    this.viewMonth.update((d) => {
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    });
  }

  goToToday() {
    const today = new Date();
    this.viewMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.dateSelected.emit(today);
  }

  selectDay(day: CalendarDay) {
    if (day.isFuture) return;
    this.dateSelected.emit(day.date);
  }
}
