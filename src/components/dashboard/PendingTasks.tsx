import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export const PendingTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const fetchPendingTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(10);

      if (error) throw error;
      
      // Sort: high priority first, then by nearest due date
      const sorted = (data || []).sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
      setTasks(sorted.slice(0, 5));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task marked as complete!");
      fetchPendingTasks();
    } catch (error) {
      toast.error("Error updating task");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      default: return "text-blue-600";
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No pending tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto hover:bg-transparent"
            onClick={() => handleMarkComplete(task.id)}
          >
            <Circle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{task.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              {task.due_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="link"
        className="w-full text-sm"
        onClick={() => window.location.href = '/dashboard/tasks'}
      >
        View all tasks →
      </Button>
    </div>
  );
};