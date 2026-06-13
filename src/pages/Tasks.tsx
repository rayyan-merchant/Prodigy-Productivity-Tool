
import React, { useState } from 'react';
import TasksContainer from '@/components/tasks/TasksContainer';
import TasksHeader from "@/components/tasks/TasksHeader";
import TaskDialogs from "@/components/tasks/TaskDialogs";
import TasksTabs from '@/components/tasks/TasksTabs';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Tasks: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => 
    (localStorage.getItem('taskViewMode') as 'list' | 'kanban') || 'list'
  );

  const toggleView = (mode: 'list' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('taskViewMode', mode);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <TasksContainer>
        {({
          tasks,
          isLoading,
          isRefreshing,
          selectedTask,
          taskToDelete,
          activeTab,
          isPrioritizing,
          isDialogOpen,
          isDeleteDialogOpen,
          todoTasks,
          inProgressTasks,
          completedTasks,
          handleAddTask,
          handleEditTask,
          handleStatusChange,
          handleDeleteTask,
          openEditDialog,
          openDeleteDialog,
          handleTabChange,
          handlePrioritizeTasks,
          setIsDialogOpen,
          setIsDeleteDialogOpen,
          setSelectedTask,
          setTaskToDelete,
        }) => (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <TasksHeader
                onAddTask={() => setIsDialogOpen(true)}
                onPrioritize={handlePrioritizeTasks}
                isPrioritizing={isPrioritizing}
                isLoading={isLoading || isRefreshing}
                disablePrioritize={tasks.filter(t => t.status !== 'completed').length < 2}
              />
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 px-2', viewMode === 'list' && 'bg-background shadow-sm')}
                  onClick={() => toggleView('list')}
                >
                  <List size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-7 px-2', viewMode === 'kanban' && 'bg-background shadow-sm')}
                  onClick={() => toggleView('kanban')}
                >
                  <LayoutGrid size={14} />
                </Button>
              </div>
            </motion.div>

            <TaskDialogs
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
              isDeleteDialogOpen={isDeleteDialogOpen}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
              taskToDelete={taskToDelete}
              setTaskToDelete={setTaskToDelete}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {viewMode === 'kanban' ? (
                <KanbanBoard
                  todoTasks={todoTasks}
                  inProgressTasks={inProgressTasks}
                  completedTasks={completedTasks}
                  isLoading={isLoading || isRefreshing}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <TasksTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  tasks={tasks}
                  todoTasks={todoTasks}
                  inProgressTasks={inProgressTasks}
                  completedTasks={completedTasks}
                  isLoading={isLoading || isRefreshing}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onStatusChange={handleStatusChange}
                />
              )}
            </motion.div>

          </>
        )}
      </TasksContainer>
    </motion.div>
  );
};

export default Tasks;
