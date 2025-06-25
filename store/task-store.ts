import { create } from 'zustand';
import { tasks as mockTasks } from '@/mocks/tasks';
import { Task } from '@/types';
import { storage } from '@/utils/storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  getTodaysTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,

      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would be an API call
          set({ tasks: mockTasks, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch tasks', isLoading: false });
        }
      },

      addTask: async (task) => {
        set({ isLoading: true, error: null });
        try {
          const newTask: Task = {
            ...task,
            id: Date.now().toString()
          };
          
          set(state => ({
            tasks: [...state.tasks, newTask],
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to add task', isLoading: false });
        }
      },

      updateTask: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id ? { ...task, ...updates } : task
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to update task', isLoading: false });
        }
      },

      deleteTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete task', isLoading: false });
        }
      },

      toggleTaskCompletion: async (id) => {
        try {
          const task = get().tasks.find(t => t.id === id);
          if (task) {
            await get().updateTask(id, { completed: !task.completed });
          }
        } catch (error) {
          set({ error: 'Failed to toggle task completion' });
        }
      },

      getTodaysTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().tasks.filter(task => 
          task.dueDate.startsWith(today) && !task.completed
        );
      }
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => storage)
    }
  )
);