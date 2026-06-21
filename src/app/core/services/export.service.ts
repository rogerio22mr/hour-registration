import { Injectable } from '@angular/core';
import { WorkItem } from '../models/work-item.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly columns = [
    'Date',
    'Title',
    'Description',
    'Start',
    'End',
    'Hours',
    'Approved',
  ] as const;

  /** Build a CSV string from work items, one row per time entry. */
  buildCsv(items: WorkItem[]): string {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const rows: string[][] = [[...this.columns]];

    for (const item of items) {
      const entries = item.hour_entries.length ? item.hour_entries : [null];
      for (const entry of entries) {
        rows.push([
          item.work_date,
          item.title,
          item.description ?? '',
          entry ? this.formatTime(entry.start_time, timeZone) : '',
          entry?.end_time ? this.formatTime(entry.end_time, timeZone) : '',
          entry ? entry.hours.toFixed(2) : '0.00',
          item.approved ? 'yes' : 'no',
        ]);
      }
    }

    return rows.map((row) => row.map((cell) => this.escape(cell)).join(',')).join('\r\n');
  }

  /** Trigger a browser download of the given items as a CSV file. */
  downloadCsv(items: WorkItem[], filename: string) {
    const csv = this.buildCsv(items);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private formatTime(iso: string, timeZone: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(new Date(iso));
  }

  private escape(value: string): string {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
