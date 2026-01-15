import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTaskStore } from '@/store/task-store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
// --- Sortable Item Component ---
interface SortableItemProps {
  id: string;
  content: string;
  isCompleted: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}
const SortableItem = React.memo(({ id, content, isCompleted, onToggle, onDelete }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn("group mb-3", isDragging && "opacity-50")}>
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
        "bg-card hover:shadow-md hover:border-primary/20",
        isCompleted ? "bg-secondary/30 border-transparent" : "border-border/50"
      )}>
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground transition-colors p-1 -ml-2"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        {/* Checkbox Custom */}
        <button 
          onClick={() => onToggle(id)}
          className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-green-500 transition-all duration-300 ease-out scale-110" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        {/* Content */}
        <span className={cn(
          "flex-1 text-base font-medium transition-all duration-300 break-words",
          isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
        )}>
          {content}
        </span>
        {/* Delete Action */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
SortableItem.displayName = 'SortableItem';
// --- Main Page Component ---
export function HomePage() {
  // Zustand Selectors (Primitives only)
  const tasks = useTaskStore(s => s.tasks);
  const isLoading = useTaskStore(s => s.isLoading);
  const filter = useTaskStore(s => s.filter);
  const fetchTasks = useTaskStore(s => s.fetchTasks);
  const addTask = useTaskStore(s => s.addTask);
  const toggleTask = useTaskStore(s => s.toggleTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const reorderTasks = useTaskStore(s => s.reorderTasks);
  const setFilter = useTaskStore(s => s.setFilter);
  const clearCompleted = useTaskStore(s => s.clearCompleted);
  const [newTaskInput, setNewTaskInput] = useState('');
  // Initial Fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  // Derived State
  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter(t => !t.isCompleted);
    if (filter === 'completed') return tasks.filter(t => t.isCompleted);
    return tasks;
  }, [tasks, filter]);
  const activeCount = useMemo(() => tasks.filter(t => !t.isCompleted).length, [tasks]);
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // Require 8px movement before drag starts (prevents accidental clicks)
        },
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 250, // Press and hold for 250ms to drag on touch devices
            tolerance: 5,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    try {
      await addTask(newTaskInput.trim());
      setNewTaskInput('');
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };
  const handleClearCompleted = async () => {
    if (tasks.some(t => t.isCompleted)) {
        await clearCompleted();
        toast.success('Completed tasks cleared');
    }
  };
  return (
    <AppLayout container contentClassName="max-w-3xl py-0">
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8">
        <ThemeToggle className="fixed top-4 right-4" />
        {/* Main Focus Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5">
            {/* Header Section */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-b border-border/40">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">
                    ZenTask
                  </h1>
                  <div className="flex items-center text-muted-foreground text-sm font-medium">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(), 'EEEE, MMMM do')}
                  </div>
                </div>
                <div className="hidden sm:flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary">
                  <ListTodo className="h-6 w-6" />
                </div>
              </div>
              {/* Input Area */}
              <form onSubmit={handleAddTask} className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Plus className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="What needs to be done?"
                  className="pl-12 h-14 text-lg bg-background/50 border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary rounded-xl shadow-sm transition-all"
                />
                <Button 
                  type="submit" 
                  disabled={!newTaskInput.trim()}
                  className="absolute right-2 top-2 bottom-2 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity"
                  size="sm"
                >
                  Add
                </Button>
              </form>
            </div>
            {/* Task List Section */}
            <div className="bg-background/40 min-h-[400px] flex flex-col">
              <ScrollArea className="flex-1 h-[50vh] px-6 py-4">
                {isLoading && tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p>Loading your focus...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground py-12 opacity-60">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">Add a task to get started.</p>
                  </div>
                ) : (
                  <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={filteredTasks.map(t => t.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1 pb-4">
                        {filteredTasks.map((task) => (
                          <SortableItem
                            key={task.id}
                            id={task.id}
                            content={task.content}
                            isCompleted={task.isCompleted}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </ScrollArea>
              {/* Footer Controls */}
              <div className="p-4 border-t border-border/40 bg-background/60 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground font-medium">
                  {activeCount} {activeCount === 1 ? 'item' : 'items'} left
                </span>
                <div className="flex p-1 bg-secondary/50 rounded-lg">
                  {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-md capitalize transition-all font-medium",
                        filter === f 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearCompleted}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  disabled={!tasks.some(t => t.isCompleted)}
                >
                  Clear Completed
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        <footer className="mt-8 text-center text-muted-foreground/60 text-xs">
          <p>Built with ❤️ by Aurelia | Your AI Co-founder</p>
        </footer>
      </div>
    </AppLayout>
  );
}