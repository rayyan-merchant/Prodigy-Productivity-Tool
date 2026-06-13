import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, Filter } from 'lucide-react';

export type TaskSortBy = 'created' | 'due' | 'priority' | 'title';
export type TaskPriorityFilter = 'all' | 'low' | 'medium' | 'high';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: TaskSortBy;
  onSortChange: (value: TaskSortBy) => void;
  priority: TaskPriorityFilter;
  onPriorityChange: (value: TaskPriorityFilter) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  priority,
  onPriorityChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <div className="relative flex-1 min-w-0">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className="pl-9 h-9"
        />
      </div>
      <div className="flex gap-2 sm:flex-shrink-0">
        <Select value={priority} onValueChange={(v) => onPriorityChange(v as TaskPriorityFilter)}>
          <SelectTrigger
            aria-label="Filter by priority"
            className="h-9 flex-1 sm:w-[140px] sm:flex-none gap-1"
          >
            <Filter size={14} className="text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as TaskSortBy)}>
          <SelectTrigger
            aria-label="Sort tasks"
            className="h-9 flex-1 sm:w-[150px] sm:flex-none gap-1"
          >
            <ArrowUpDown size={14} className="text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="due">Due date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TaskFilters;
