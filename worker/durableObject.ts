import { DurableObject } from "cloudflare:workers";
import type { Task, DemoItem } from '@shared/types';
import { MOCK_ITEMS } from '@shared/mock-data';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    // --- Existing Demo Methods (Preserved for backward compatibility) ---
    async getCounterValue(): Promise<number> {
      const value = (await this.ctx.storage.get("counter_value")) || 0;
      return value as number;
    }
    async increment(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value += amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async decrement(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value -= amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get("demo_items");
      if (items) {
        return items as DemoItem[];
      }
      await this.ctx.storage.put("demo_items", MOCK_ITEMS);
      return MOCK_ITEMS;
    }
    async addDemoItem(item: DemoItem): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = [...items, item];
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async updateDemoItem(id: string, updates: Partial<Omit<DemoItem, 'id'>>): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async deleteDemoItem(id: string): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.filter(item => item.id !== id);
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    // --- New Task Management Methods ---
    async getTasks(): Promise<Task[]> {
        const tasks = await this.ctx.storage.get<Task[]>("tasks");
        return tasks || [];
    }
    async addTask(task: Task): Promise<Task[]> {
        const tasks = await this.getTasks();
        // Ensure the new task has the correct order (last)
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : -1;
        const newTask = { ...task, order: maxOrder + 1 };
        const updatedTasks = [...tasks, newTask];
        await this.ctx.storage.put("tasks", updatedTasks);
        return updatedTasks;
    }
    async updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Promise<Task[]> {
        const tasks = await this.getTasks();
        const updatedTasks = tasks.map(task => 
            task.id === id ? { ...task, ...updates } : task
        );
        await this.ctx.storage.put("tasks", updatedTasks);
        return updatedTasks;
    }
    async deleteTask(id: string): Promise<Task[]> {
        const tasks = await this.getTasks();
        const updatedTasks = tasks.filter(task => task.id !== id);
        await this.ctx.storage.put("tasks", updatedTasks);
        return updatedTasks;
    }
    async reorderTasks(newOrderIds: string[]): Promise<Task[]> {
        const tasks = await this.getTasks();
        // Create a map for quick lookup
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        // Reconstruct the array based on the new ID order
        const reorderedTasks: Task[] = [];
        newOrderIds.forEach((id, index) => {
            const task = taskMap.get(id);
            if (task) {
                reorderedTasks.push({ ...task, order: index });
                taskMap.delete(id);
            }
        });
        // Append any tasks that weren't in the newOrderIds (safety fallback)
        // Sort remaining by their original order to maintain relative stability
        const remainingTasks = Array.from(taskMap.values()).sort((a, b) => a.order - b.order);
        remainingTasks.forEach((task, i) => {
            reorderedTasks.push({ ...task, order: reorderedTasks.length + i });
        });
        await this.ctx.storage.put("tasks", reorderedTasks);
        return reorderedTasks;
    }
    async clearCompletedTasks(): Promise<Task[]> {
        const tasks = await this.getTasks();
        const activeTasks = tasks.filter(t => !t.isCompleted);
        await this.ctx.storage.put("tasks", activeTasks);
        return activeTasks;
    }
}