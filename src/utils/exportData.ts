
import { Task } from '@/types/tasks';
import { Habit } from '@/types/habits';

// CSV Export
function toCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
}

export function exportTasksCSV(tasks: Task[]): void {
  const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Recurrence', 'Created At'];
  const rows = tasks.map(t => [
    t.title, t.description, t.status, t.priority,
    t.dueDate || '', (t.tags || []).join('; '),
    t.recurrence || '', t.createdAt || ''
  ]);
  downloadFile(toCSV(headers, rows), 'tasks.csv', 'text/csv');
}

export function exportHabitsCSV(habits: Habit[]): void {
  const headers = ['Name', 'Category', 'Frequency', 'Current Streak', 'Longest Streak', 'Target Streak', 'Active'];
  const rows = habits.map(h => [
    h.name, h.category, h.frequency, String(h.currentStreak),
    String(h.longestStreak), String(h.targetStreak), h.isActive ? 'Yes' : 'No'
  ]);
  downloadFile(toCSV(headers, rows), 'habits.csv', 'text/csv');
}

// JSON Export
export function exportAllJSON(data: { tasks: Task[]; habits: Habit[] }): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'prodigy-export.json', 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
