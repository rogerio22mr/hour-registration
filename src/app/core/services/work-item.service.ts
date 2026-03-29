import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WorkItem } from '../models/work-item.model';

@Injectable({ providedIn: 'root' })
export class WorkItemService {
  private readonly supabase = inject(SupabaseService);

  async getEntriesForDate(date: string): Promise<WorkItem[]> {
    const { data, error } = await this.supabase
      .from('work_items')
      .select('*')
      .eq('work_date', date)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data ?? []) as WorkItem[];
  }

  async addWorkItem(
    item: Pick<WorkItem, 'title' | 'description' | 'work_date' | 'start_time' | 'end_time' | 'hours'>,
  ): Promise<WorkItem> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('work_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as WorkItem;
  }

  async updateWorkItem(
    id: string,
    item: Pick<WorkItem, 'title' | 'description' | 'start_time' | 'end_time' | 'hours'>,
  ): Promise<WorkItem> {
    const { data, error } = await this.supabase
      .from('work_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as WorkItem;
  }

  async deleteWorkItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('work_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
