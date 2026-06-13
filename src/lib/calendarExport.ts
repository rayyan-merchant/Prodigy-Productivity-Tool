import { parseLocalDate, toLocalDateKey } from '@/lib/dateOnly';
import type { Task } from '@/types/tasks';

const escapeIcs = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const foldLine = (line: string): string => {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = remaining.slice(75);
  }
  chunks.push(remaining);
  return chunks.join('\r\n ');
};

const nextDate = (dateOnly: string): string => {
  const date = parseLocalDate(dateOnly);
  date.setDate(date.getDate() + 1);
  return toLocalDateKey(date);
};

export const tasksToIcs = (tasks: Task[]): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prodigy//Productivity Workspace//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const task of tasks.filter((candidate) => candidate.dueDate)) {
    const dueDate = task.dueDate.replace(/-/g, '');
    const endDate = nextDate(task.dueDate).replace(/-/g, '');
    const description = [
      `Priority: ${task.priority}`,
      `Status: ${task.status}`,
      task.description,
    ].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeIcs(`task-${task.id}@prodigy`)}`,
      `DTSTART;VALUE=DATE:${dueDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${escapeIcs(task.title)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `STATUS:${task.status === 'completed' ? 'COMPLETED' : 'NEEDS-ACTION'}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
};
