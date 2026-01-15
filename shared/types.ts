export interface Task {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: number;
  order: number;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Re-export DemoItem to keep existing code working if referenced elsewhere, 
// though we are moving to Tasks.
export interface DemoItem {
  id: string;
  name: string;
  value: number;
}