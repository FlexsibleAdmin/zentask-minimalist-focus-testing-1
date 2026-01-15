import { Hono } from "hono";
import { Env } from './core-utils';
import type { DemoItem, Task, ApiResponse } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
    // --- Demo Routes (Preserved) ---
    app.get('/api/demo', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getDemoItems();
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.get('/api/counter', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getCounterValue();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    app.post('/api/counter/increment', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.increment();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    app.post('/api/demo', async (c) => {
        const body = await c.req.json() as DemoItem;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.addDemoItem(body);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.put('/api/demo/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json() as Partial<Omit<DemoItem, 'id'>>;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.updateDemoItem(id, body);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.delete('/api/demo/:id', async (c) => {
        const id = c.req.param('id');
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.deleteDemoItem(id);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    // --- Task Routes (New) ---
    // Get all tasks
    app.get('/api/tasks', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getTasks();
        return c.json({ success: true, data } satisfies ApiResponse<Task[]>);
    });
    // Add a new task
    app.post('/api/tasks', async (c) => {
        const body = await c.req.json() as Task;
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.addTask(body);
        return c.json({ success: true, data } satisfies ApiResponse<Task[]>);
    });
    // Update a task (toggle completion, edit content)
    app.put('/api/tasks/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json() as Partial<Omit<Task, 'id'>>;
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.updateTask(id, body);
        return c.json({ success: true, data } satisfies ApiResponse<Task[]>);
    });
    // Delete a task
    app.delete('/api/tasks/:id', async (c) => {
        const id = c.req.param('id');
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.deleteTask(id);
        return c.json({ success: true, data } satisfies ApiResponse<Task[]>);
    });
    // Reorder tasks
    app.post('/api/tasks/reorder', async (c) => {
        const { ids } = await c.req.json() as { ids: string[] };
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.reorderTasks(ids);
        return c.json({ success: true, data } satisfies ApiResponse<Task[]>);
    });
    // Clear completed tasks
    app.post('/api/tasks/clear-completed', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.clearCompletedTasks();
        return c.json({ success: true, data } satisfies ApiResponse<Task[]>);
    });
}