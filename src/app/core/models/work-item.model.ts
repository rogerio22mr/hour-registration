export interface WorkItemHour {
  id: string;
  work_item_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  hours: number;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  work_date: string;
  created_at: string;
  updated_at: string;
  hour_entries: WorkItemHour[];
}
