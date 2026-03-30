import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WorkItem } from '../models/work-item.model';

type HourEntryInput = { start_time: string; end_time: string | null; hours: number };

@Injectable({ providedIn: 'root' })
export class WorkItemService {
  private readonly supabase = inject(SupabaseService);

  async getEntriesForDate(date: string): Promise<WorkItem[]> {
    const { data, error } = await this.supabase
      .from('work_items')
      .select('*, hour_entries:work_item_hours(*)')
      .eq('work_date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return ((data ?? []) as WorkItem[])
      .map((item) => ({
        ...item,
        hour_entries: [...(item.hour_entries ?? [])].sort((a, b) =>
          a.start_time.localeCompare(b.start_time),
        ),
      }))
      .sort((a, b) => {
        const at = a.hour_entries[0]?.start_time ?? '';
        const bt = b.hour_entries[0]?.start_time ?? '';
        return at.localeCompare(bt);
      });
  }

  async addWorkItem(
    item: Pick<WorkItem, 'title' | 'description' | 'work_date'>,
    hourEntries: HourEntryInput[],
  ): Promise<WorkItem> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: workItem, error } = await this.supabase
      .from('work_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    const { error: hourError } = await this.supabase.from('work_item_hours').insert(
      hourEntries.map((e) => ({ ...e, work_item_id: workItem.id, user_id: user.id })),
    );

    if (hourError) throw hourError;

    return this.fetchWorkItem(workItem.id);
  }

  async updateWorkItem(
    id: string,
    item: Pick<WorkItem, 'title' | 'description'>,
    hourEntries: HourEntryInput[],
  ): Promise<WorkItem> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase.from('work_items').update(item).eq('id', id);
    if (error) throw error;

    const { error: deleteError } = await this.supabase
      .from('work_item_hours')
      .delete()
      .eq('work_item_id', id);
    if (deleteError) throw deleteError;

    const { error: hourError } = await this.supabase.from('work_item_hours').insert(
      hourEntries.map((e) => ({ ...e, work_item_id: id, user_id: user.id })),
    );
    if (hourError) throw hourError;

    return this.fetchWorkItem(id);
  }

  async deleteWorkItem(id: string): Promise<void> {
    const { error } = await this.supabase.from('work_items').delete().eq('id', id);
    if (error) throw error;
  }

  private async fetchWorkItem(id: string): Promise<WorkItem> {
    const { data, error } = await this.supabase
      .from('work_items')
      .select('*, hour_entries:work_item_hours(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const item = data as WorkItem;
    return {
      ...item,
      hour_entries: [...(item.hour_entries ?? [])].sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      ),
    };
  }
}
