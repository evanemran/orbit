import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Check,
  Trash2,
  Calendar,
  Flag,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { TaskPriority } from '@/types';

export const TasksWidget: React.FC = () => {
  const tasks = useDashboardStore((s) => s.tasks);
  const activeWorkspaceId = useDashboardStore((s) => s.activeWorkspaceId);
  const addTask = useDashboardStore((s) => s.addTask);
  const toggleTask = useDashboardStore((s) => s.toggleTask);
  const updateTask = useDashboardStore((s) => s.updateTask);
  const deleteTask = useDashboardStore((s) => s.deleteTask);
  const clearCompletedTasks = useDashboardStore((s) => s.clearCompletedTasks);

  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for global 'T' shortcut
  useEffect(() => {
    const handleNewTaskShortcut = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('orbit:new-task', handleNewTaskShortcut);
    return () => window.removeEventListener('orbit:new-task', handleNewTaskShortcut);
  }, []);

  const workspaceTasks = tasks.filter((t) => t.workspaceId === activeWorkspaceId);
  const filteredTasks = workspaceTasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask(newTitle, priority, dueDate || undefined);
    setNewTitle('');
    setDueDate('');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-sky-400 bg-sky-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    high: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <div id="orbit-widget-tasks" className="space-y-3">
      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task... (Press T to focus)"
            aria-label="New task title"
            className="flex-1 px-3 py-1.5 text-xs rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-text placeholder:text-orbit-muted/70 focus:outline-none focus:border-orbit-accent"
          />
          <button
            type="submit"
            aria-label="Add task"
            className="p-1.5 rounded-orbit-sm bg-orbit-accent text-slate-950 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              aria-label="Task priority"
              className="px-2 py-1 rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-muted text-[11px] focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Task due date"
              className="px-2 py-0.5 rounded-orbit-sm bg-orbit-secondary border border-orbit-border text-orbit-muted text-[11px] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded-orbit-sm capitalize transition-colors ${
                  filter === f
                    ? 'bg-orbit-accent/20 text-orbit-accent font-medium'
                    : 'text-orbit-muted hover:text-orbit-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
        {filteredTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-orbit-muted flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-orbit-accent/60" />
            <span>No {filter === 'all' ? '' : filter} tasks in this workspace.</span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue =
              !task.completed && task.dueDate && task.dueDate < todayStr;

            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between gap-2 p-2 rounded-orbit-sm border transition-all ${
                  task.completed
                    ? 'bg-orbit-secondary/30 border-orbit-border/40 opacity-65'
                    : 'bg-orbit-secondary/70 border-orbit-border hover:border-orbit-accent/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? `Mark "${task.title}" incomplete`
                        : `Complete "${task.title}"`
                    }
                    className={`w-4 h-4 rounded-xs flex items-center justify-center border transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-orbit-accent border-orbit-accent text-slate-950'
                        : 'border-orbit-muted hover:border-orbit-accent'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {editingId === task.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => {
                        if (editingTitle.trim()) {
                          updateTask(task.id, { title: editingTitle.trim() });
                        }
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingTitle.trim()) {
                            updateTask(task.id, { title: editingTitle.trim() });
                          }
                          setEditingId(null);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-orbit-main px-2 py-0.5 text-xs text-orbit-text rounded-xs border border-orbit-accent focus:outline-none"
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs truncate ${
                          task.completed
                            ? 'line-through text-orbit-muted'
                            : 'text-orbit-text'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] rounded-xs capitalize ${
                            priorityColors[task.priority]
                          }`}
                        >
                          <Flag className="w-2.5 h-2.5" />
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] tabular-nums ${
                              isOverdue
                                ? 'text-rose-400 font-medium'
                                : 'text-orbit-muted'
                            }`}
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            {isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(task.id);
                      setEditingTitle(task.title);
                    }}
                    aria-label={`Edit ${task.title}`}
                    className="p-1 text-orbit-muted hover:text-orbit-text rounded-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    className="p-1 text-orbit-muted hover:text-rose-400 rounded-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status */}
      {workspaceTasks.some((t) => t.completed) && (
        <div className="flex items-center justify-between pt-1 border-t border-orbit-border/50 text-[11px] text-orbit-muted">
          <span>
            {workspaceTasks.filter((t) => !t.completed).length} remaining
          </span>
          <button
            type="button"
            onClick={clearCompletedTasks}
            className="text-orbit-muted hover:text-orbit-text underline"
          >
            Clear completed
          </button>
        </div>
      )}
    </div>
  );
};
