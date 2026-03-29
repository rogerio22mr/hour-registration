export interface WorkItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  work_date: string;
  start_time: string;
  end_time: string | null;
  hours: number;
  created_at: string;
  updated_at: string;
}
