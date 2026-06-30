import { TestBed } from '@angular/core/testing';
import { TimeBankService } from './time-bank.service';
import { WorkItemService } from './work-item.service';
import { SupabaseService } from './supabase.service';
import { WorkItem } from '../models/work-item.model';

function workItem(date: string, hours: number[]): WorkItem {
  return {
    id: date,
    user_id: 'u',
    title: 't',
    description: '',
    work_date: date,
    approved: false,
    approved_at: null,
    approved_by: null,
    created_at: '',
    updated_at: '',
    hour_entries: hours.map((h, i) => ({
      id: `${date}-${i}`,
      work_item_id: date,
      user_id: 'u',
      start_time: '',
      end_time: null,
      hours: h,
      created_at: '',
      updated_at: '',
    })),
  };
}

describe('TimeBankService.computeBalance', () => {
  let service: TimeBankService;
  let entries: WorkItem[] = [];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TimeBankService,
        { provide: SupabaseService, useValue: {} },
        {
          provide: WorkItemService,
          useValue: { getEntriesForRange: async () => entries },
        },
      ],
    });
    service = TestBed.inject(TimeBankService);
  });

  it('accrues worked − goal over weekdays, skipping weekends and holidays', async () => {
    // Mon 2025-06-30 .. today Thu 2025-07-03 → counts Mon, Tue (yesterday is Wed 07-02).
    entries = [workItem('2025-06-30', [10]), workItem('2025-07-01', [6])];
    const r = await service.computeBalance(
      { initial_balance: 0, start_date: '2025-06-30', daily_goal_hours: 8 },
      new Set(),
      new Date(2025, 6, 3, 12), // Thu Jul 3 → yesterday = Wed Jul 2
    );
    // Mon(10) + Tue(6) + Wed(0) = 16 worked, 3 days × 8 = 24 expected.
    expect(r.workingDays).toBe(3);
    expect(r.workedHours).toBe(16);
    expect(r.expectedHours).toBe(24);
    expect(r.accrued).toBe(-8);
    expect(r.balance).toBe(-8);
    expect(r.lastCountedDate).toBe('2025-07-02');
  });

  it('adds the initial balance and excludes the current day', async () => {
    entries = [workItem('2025-07-01', [9])]; // Tue, only counted day
    const r = await service.computeBalance(
      { initial_balance: 5, start_date: '2025-07-01', daily_goal_hours: 8 },
      new Set(),
      new Date(2025, 6, 2, 12), // Wed Jul 2 → yesterday = Tue Jul 1
    );
    expect(r.workingDays).toBe(1);
    expect(r.accrued).toBe(1);
    expect(r.balance).toBe(6);
  });

  it('skips Brazilian holidays (Tiradentes 2025-04-21, a Monday)', async () => {
    entries = [];
    const r = await service.computeBalance(
      { initial_balance: 0, start_date: '2025-04-21', daily_goal_hours: 8 },
      new Set(),
      new Date(2025, 3, 22, 12), // Tue Apr 22 → yesterday = Mon Apr 21 (holiday)
    );
    expect(r.workingDays).toBe(0);
    expect(r.balance).toBe(0);
    expect(r.lastCountedDate).toBeNull();
  });

  it('skips manually-marked non-working days', async () => {
    // Mon 2025-06-30 .. Tue 2025-07-01 counted; mark Mon as off → only Tue counts.
    entries = [workItem('2025-06-30', [8]), workItem('2025-07-01', [10])];
    const r = await service.computeBalance(
      { initial_balance: 0, start_date: '2025-06-30', daily_goal_hours: 8 },
      new Set(['2025-06-30']),
      new Date(2025, 6, 2, 12), // Wed Jul 2 → yesterday = Tue Jul 1
    );
    expect(r.workingDays).toBe(1);
    expect(r.workedHours).toBe(10);
    expect(r.accrued).toBe(2);
    expect(r.lastCountedDate).toBe('2025-07-01');
  });

  it('returns the initial balance when the start date is today or later', async () => {
    entries = [];
    const r = await service.computeBalance(
      { initial_balance: 12, start_date: '2025-07-02', daily_goal_hours: 8 },
      new Set(),
      new Date(2025, 6, 2, 12), // start date is today
    );
    expect(r.workingDays).toBe(0);
    expect(r.balance).toBe(12);
  });
});
