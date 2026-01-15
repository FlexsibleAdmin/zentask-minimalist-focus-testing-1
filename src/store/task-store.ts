import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Task, ApiResponse } from '@shared/types';
import { arrayMove } from '@dnd-kit/sortable';
interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'active' | 'completed';
  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (content: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (activeId: string, overId: string) => Promise<void>;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => Promise<void>;
}
export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filter: 'all',
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json() as ApiResponse<Task[]>;
      if (data.success && data.data) {
        // Sort by order just in case
        const sortedTasks = [...data.data].sort((a, b) => a.order - b.order);
        set({ tasks: sortedTasks, isLoading: false });
      } else {
        set({ error: data.error || 'Failed to fetch tasks', isLoading: false });
      }
    } catch (err) {
      set({ error: 'Network error', isLoading: false });
    }
  },
  addTask: async (content: string) => {
    const tempId = uuidv4();
    const currentTasks = get().tasks;
    const maxOrder = currentTasks.length > 0 ? Math.max(...currentTasks.map(t => t.order)) : -1;
    const newTask: Task = {
      id: tempId,
      content,
      isCompleted: false,
      createdAt: Date.now(),
      order: maxOrder + 1
    };
    // Optimistic update
    set({ tasks: [...currentTasks, newTask] });
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      const data = await res.json() as ApiResponse<Task[]>;
      if (data.success && data.data) {
        // Sync with server state
        const sortedTasks = [...data.data].sort((a, b) => a.order - b.order);
        set({ tasks: sortedTasks });
      } else {
        // Revert on error
        set({ tasks: currentTasks, error: data.error || 'Failed to add task' });
      }
    } catch (err) {
      set({ tasks: currentTasks, error: 'Network error' });
    }
  },
  toggleTask: async (id: string) => {
    const currentTasks = get().tasks;
    const taskIndex = currentTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;
    const updatedTask = { ...currentTasks[taskIndex], isCompleted: !currentTasks[taskIndex].isCompleted };
    const newTasks = [...currentTasks];
    newTasks[taskIndex] = updatedTask;
    // Optimistic update
    set({ tasks: newTasks });
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: updatedTask.isCompleted })
      });
      const data = await res.json() as ApiResponse<Task[]>;
      if (!data.success) {
        set({ tasks: currentTasks, error: data.error || 'Failed to update task' });
      }
    } catch (err) {
      set({ tasks: currentTasks, error: 'Network error' });
    }
  },
  deleteTask: async (id: string) => {
    const currentTasks = get().tasks;
    const newTasks = currentTasks.filter(t => t.id !== id);
    // Optimistic update
    set({ tasks: newTasks });
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json() as ApiResponse<Task[]>;
      if (!data.success) {
        set({ tasks: currentTasks, error: data.error || 'Failed to delete task' });
      }
    } catch (err) {
      set({ tasks: currentTasks, error: 'Network error' });
    }
  },
  reorderTasks: async (activeId: string, overId: string) => {
    const currentTasks = get().tasks;
    const oldIndex = currentTasks.findIndex(t => t.id === activeId);
    const newIndex = currentTasks.findIndex(t => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    // Optimistic update
    const reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex).map((task, index) => ({
      ...task,
      order: index
    }));
    set({ tasks: reorderedTasks });
    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reorderedTasks.map(t => t.id) })
      });
      const data = await res.json() as ApiResponse<Task[]>;
      if (!data.success) {
        set({ tasks: currentTasks, error: data.error || 'Failed to reorder tasks' });
      }
    } catch (err) {
      set({ tasks: currentTasks, error: 'Network error' });
    }
  },
  setFilter: (filter) => set({ filter }),
  clearCompleted: async () => {
    const currentTasks = get().tasks;
    const activeTasks = currentTasks.filter(t => !t.isCompleted);
    // Optimistic update
    set({ tasks: activeTasks });
    try {
      const res = await fetch('/api/tasks/clear-completed', {
        method: 'POST'
      });
      const data = await res.json() as ApiResponse<Task[]>;
      if (!data.success) {
        set({ tasks: currentTasks, error: data.error || 'Failed to clear completed tasks' });
      }
    } catch (err) {
      set({ tasks: currentTasks, error: 'Network error' });
    }
  }
}));