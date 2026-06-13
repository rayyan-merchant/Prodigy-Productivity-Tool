
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, BarChart, Settings2, TrendingUp, TrendingDown } from "lucide-react";
import CompactTimer from "@/components/CompactTimer";
import QuickActionsPanel from "@/components/dashboard/QuickActionsPanel";
import HabitStreaks from "@/components/dashboard/HabitStreaks";
import RecentActivityTimeline from "@/components/dashboard/RecentActivityTimeline";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentTasksSection from "@/components/dashboard/RecentTasksSection";
import WidgetCustomizer, { loadWidgetLayout, saveWidgetLayout, DashboardWidget } from "@/components/dashboard/WidgetCustomizer";
import AIDailyBrief from "@/components/dashboard/AIDailyBrief";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import FocusMusicPlayer from "@/components/FocusMusicPlayer";
import { Task } from "@/components/TaskCard";
import { toast } from "sonner";
import { getTasks, updateTask, deleteTask } from "@/services/taskService";
import { getCurrentUser } from "@/lib/auth";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from 'framer-motion';

const motivationalQuotes = [
  "Stay focused. You've got this!",
  "Small progress is still progress.",
  "One task at a time leads to great achievements.",
  "Your future self will thank you for today's effort.",
  "Discipline is choosing between what you want now and what you want most.",
  "The best way to predict your future is to create it.",
  "Focus on the journey, not the destination.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "You don't have to be great to start, but you have to start to be great."
];

const Dashboard: React.FC = () => {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { title: "Total Tasks", value: 0 as string | number, icon: <CheckCircle size={18} />, accent: "bg-primary", gradient: "", changePercent: 0 },
    { title: "In Progress", value: 0 as string | number, icon: <Clock size={18} />, accent: "bg-amber-500", gradient: "", changePercent: 0 },
    { title: "Completed", value: 0 as string | number, icon: <CheckCircle size={18} />, accent: "bg-accent", gradient: "", changePercent: 0 },
    { title: "Completion Rate", value: "0%" as string | number, icon: <BarChart size={18} />, accent: "bg-brand", gradient: "", changePercent: 0 }
  ]);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(loadWidgetLayout);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        
        const hour = new Date().getHours();
        if (hour < 12) {
          setGreeting(`Good Morning, ${userName}! 🌅`);
        } else if (hour < 17) {
          setGreeting(`Good Afternoon, ${userName}! 🌞`);
        } else {
          setGreeting(`Good Evening, ${userName}! 🌙`);
        }
        
        const user = getCurrentUser();
        if (user) {
          const tasks = await getTasks();
          setRecentTasks(tasks.slice(0, 4));
          
          const totalTasks = tasks.length;
          const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
          const completedTasks = tasks.filter(task => task.status === 'completed').length;
          const completionRate = totalTasks > 0 
            ? Math.round((completedTasks / totalTasks) * 100) 
            : 0;
          
          setStats([
            { title: "Total Tasks", value: totalTasks, icon: <CheckCircle size={18} />, accent: "bg-primary", gradient: "from-blue-500/20 to-blue-600/5", changePercent: 12 },
            { title: "In Progress", value: inProgressTasks, icon: <Clock size={18} />, accent: "bg-amber-500", gradient: "from-amber-500/20 to-amber-600/5", changePercent: -3 },
            { title: "Completed", value: completedTasks, icon: <CheckCircle size={18} />, accent: "bg-green-500", gradient: "from-green-500/20 to-green-600/5", changePercent: 8 },
            { title: "Completion Rate", value: `${completionRate}%`, icon: <BarChart size={18} />, accent: "bg-brand", gradient: "from-primary/20 to-primary/5", changePercent: 5 }
          ]);
        } else {
          setRecentTasks([
            {
              id: "1",
              title: "Complete Project Proposal",
              description: "Finish drafting the project proposal document for client review",
              status: "in-progress",
              priority: "high",
              dueDate: "2025-05-01"
            },
            {
              id: "2",
              title: "Weekly Team Meeting",
              description: "Prepare agenda and materials for weekly team sync meeting",
              status: "todo",
              priority: "medium",
              dueDate: "2025-04-28"
            }
          ]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load some dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [userName]);

  const handleEditTask = (task: Task) => {
    navigate(`/tasks?edit=${task.id}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setRecentTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTask(taskId, { status: newStatus });
      
      const updatedTasks = recentTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      
      setRecentTasks(updatedTasks);
      toast.success("Task status updated");
      
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const isWidgetVisible = (id: string) => {
    const w = widgets.find(w => w.id === id);
    return w ? w.visible : true;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <DashboardGreeting 
          greeting={greeting} 
          quotes={motivationalQuotes} 
          completionRate={stats[3]?.value?.toString()?.replace('%', '') ? parseInt(stats[3].value.toString().replace('%', '')) : 0}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0 rounded-xl border-border/60 hover:bg-muted/60"
          onClick={() => setShowCustomizer(!showCustomizer)}
        >
          <Settings2 size={14} />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </div>

      <AnimatePresence>
        {showCustomizer && (
          <WidgetCustomizer
            widgets={widgets}
            onWidgetsChange={(w) => { setWidgets(w); saveWidgetLayout(w); }}
            isOpen={showCustomizer}
            onClose={() => setShowCustomizer(false)}
          />
        )}
      </AnimatePresence>

      {/* Stats row */}
      {isWidgetVisible('stats') && <DashboardStats stats={stats} />}

      {/* AI Brief */}
      <AIDailyBrief />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left column - 2/3 */}
        <div className="xl:col-span-2 space-y-5">
          {isWidgetVisible('timer') && <CompactTimer />}
          {isWidgetVisible('tasks') && (
            <RecentTasksSection
              tasks={recentTasks}
              isLoading={isLoading}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
          {isWidgetVisible('habits') && <HabitStreaks />}
        </div>

        {/* Right column - 1/3 */}
        <div className="space-y-5">
          {isWidgetVisible('quickActions') && <QuickActionsPanel />}
          {isWidgetVisible('calendar') && <CalendarWidget />}
          <FocusMusicPlayer />
          {isWidgetVisible('activity') && <RecentActivityTimeline />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
