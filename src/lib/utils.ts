import { Task, Holiday, Absence, KpiMetrics } from '../types';

export const RECURRING_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (QLY)' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export function isHoliday(date: string, holidays: Holiday[]): boolean {
  return holidays.some((h) => h.date === date);
}

export function isUserAbsent(userId: string, date: string, absences: Absence[]): boolean {
  const d = date.split('T')[0];
  return absences.some(
    (a) => a.user_id === userId && a.from_date <= d && a.to_date >= d
  );
}

export function computeKpi(
  tasks: Task[],
  holidays: Holiday[],
  absences: Absence[],
  userId?: string
): KpiMetrics {
  const today = new Date().toISOString().split('T')[0];
  let filtered = tasks;
  if (userId) {
    filtered = tasks.filter((t) => t.assigned_to_id === userId);
  }
  const countable = filtered.filter((t) => {
    if (t.is_holiday || isHoliday(t.due_date, holidays)) return false;
    if (isUserAbsent(t.assigned_to_id, t.due_date, absences)) return false;
    return true;
  });
  const total = countable.length;
  const onTime = countable.filter(
    (t) => t.status === 'completed' && t.completed_at && t.completed_at.split('T')[0] <= t.due_date
  ).length;
  const late = countable.filter(
    (t) => t.status === 'completed' && t.completed_at && t.completed_at.split('T')[0] > t.due_date
  ).length;
  const overdue = countable.filter(
    (t) => (t.status === 'pending' || t.status === 'overdue') && t.due_date < today
  ).length;
  const completed = onTime + late;
  const latePercent = completed > 0 ? Math.round((late / completed) * 100) : 0;
  const overduePercent = total > 0 ? Math.round((overdue / total) * 100) : 0;
  return {
    total_assigned: total,
    on_time_completed: onTime,
    late_completed: late,
    overdue_count: overdue,
    overdue_percent: overduePercent,
    late_completion_percent: latePercent,
  };
}

export interface MemberKpiRow {
  userId: string;
  userName: string;
  city?: string;
  total_assigned: number;
  on_time_completed: number;
  late_completed: number;
  overdue_count: number;
  late_completion_percent: number;
}

export function computeKpiByMember(
  tasks: Task[],
  holidays: Holiday[],
  absences: Absence[],
  users: { id: string; name: string; city?: string }[]
): MemberKpiRow[] {
  const today = new Date().toISOString().split('T')[0];
  const rows: MemberKpiRow[] = users.map((u) => {
    const userTasks = tasks.filter((t) => t.assigned_to_id === u.id);
    const countable = userTasks.filter((t) => {
      if (t.is_holiday || isHoliday(t.due_date, holidays)) return false;
      if (isUserAbsent(t.assigned_to_id, t.due_date, absences)) return false;
      return true;
    });
    const onTime = countable.filter(
      (t) => t.status === 'completed' && t.completed_at && t.completed_at.split('T')[0] <= t.due_date
    ).length;
    const late = countable.filter(
      (t) => t.status === 'completed' && t.completed_at && t.completed_at.split('T')[0] > t.due_date
    ).length;
    const overdue = countable.filter(
      (t) => (t.status === 'pending' || t.status === 'overdue') && t.due_date < today
    ).length;
    const completed = onTime + late;
    const latePercent = completed > 0 ? Math.round((late / completed) * 100) : 0;
    return {
      userId: u.id,
      userName: u.name,
      city: u.city,
      total_assigned: countable.length,
      on_time_completed: onTime,
      late_completed: late,
      overdue_count: overdue,
      late_completion_percent: latePercent,
    };
  });
  return rows.sort((a, b) => b.total_assigned - a.total_assigned);
}

export function getPendingDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
