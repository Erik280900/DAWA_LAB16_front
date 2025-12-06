import { create } from 'zustand';
import api from '@/lib/api';
import { TaskState, ApiResponse, Task } from '@/types';
import { toast } from 'react-hot-toast';

// Normalización simple de status/priority (usar valores del backend)
const mapStatusToBackend = (status: string) => {
  const s = (status || '').toString().trim().toLowerCase();
  if (['pending', 'in_progress', 'review', 'completed'].includes(s)) return s;
  return 'pending';
};

const mapPriorityToBackend = (priority: string) => {
  const p = (priority || '').toString().trim().toLowerCase();
  if (['low', 'medium', 'high'].includes(p)) return p;
  return 'medium';
};

const mapStatusFromBackend = (status: string): 'pending' | 'in_progress' | 'review' | 'completed' => {
  const s = (status || '').toString().trim().toLowerCase();
  if (['pending', 'in_progress', 'review', 'completed'].includes(s)) {
    return s as 'pending' | 'in_progress' | 'review' | 'completed';
  }
  return 'pending';
};

const mapPriorityFromBackend = (priority: string): 'low' | 'medium' | 'high' => {
  const p = (priority || '').toString().trim().toLowerCase();
  if (['low', 'medium', 'high'].includes(p)) return p as 'low' | 'medium' | 'high';
  return 'medium';
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  projectTasks: [],
  isLoading: false,

  fetchTasks: async () => {
    try {
      set({ isLoading: true });
      
      const response: ApiResponse<{ tasks: Task[] }> = await api.get('/tasks');
      
      // Mapear las tareas del backend al formato del frontend
      const mappedTasks = response.data.tasks.map(task => ({
        ...task,
        status: mapStatusFromBackend(task.status),
        priority: mapPriorityFromBackend(task.priority)
      }));
      
      set({ tasks: mappedTasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchTasksByProject: async (projectId: number) => {
    try {
      set({ isLoading: true });
      
      const response: ApiResponse<{ tasks: Task[] }> = await api.get(`/tasks/project/${projectId}`);
      
      // Mapear las tareas del backend al formato del frontend
      const mappedTasks = response.data.tasks.map(task => ({
        ...task,
        status: mapStatusFromBackend(task.status),
        priority: mapPriorityFromBackend(task.priority)
      }));
      
      set({ projectTasks: mappedTasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTask: async (data: any) => {
    try {
      // Usar la ruta correcta del backend: /tasks/project/:projectId
      if (!data.project_id) {
        throw new Error('Project ID es requerido para crear una tarea');
      }
      
      // Mapear los datos del frontend al formato del backend
      const mappedData = {
        ...data,
        status: mapStatusToBackend(data.status),
        priority: mapPriorityToBackend(data.priority)
      };
      
      const response: ApiResponse<{ task: Task }> = await api.post(`/tasks/project/${data.project_id}`, mappedData);
      
      const newTask = {
        ...response.data.task,
        status: mapStatusFromBackend(response.data.task.status),
        priority: mapPriorityFromBackend(response.data.task.priority)
      };
      
      // Agregar a ambas listas si corresponde
      set((state) => ({
        tasks: [...state.tasks, newTask],
        projectTasks: [...state.projectTasks, newTask]
      }));
      
      return newTask;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (taskId: number, data: any) => {
    try {
      // Mapear los datos del frontend al formato del backend
      const mappedData = {
        ...data,
        status: data.status ? mapStatusToBackend(data.status) : undefined,
        priority: data.priority ? mapPriorityToBackend(data.priority) : undefined
      };
      
      const response: ApiResponse<{ task: Task }> = await api.put(`/tasks/${taskId}`, mappedData);
      
      const updatedTask = {
        ...response.data.task,
        status: mapStatusFromBackend(response.data.task.status),
        priority: mapPriorityFromBackend(response.data.task.priority)
      };
      
      // Actualizar en ambas listas
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
        projectTasks: state.projectTasks.map(t => t.id === taskId ? updatedTask : t)
      }));
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      
      // Remover de ambas listas
      set((state) => ({
        tasks: state.tasks.filter((t: Task) => t.id !== taskId),
        projectTasks: state.projectTasks.filter((t: Task) => t.id !== taskId)
      }));
      
      toast.success('Tarea eliminada exitosamente');
    } catch (error) {
      throw error;
    }
  },

  // assignUsers removed in single-user mode

  assignTags: async (taskId: number, tagIds: number[]) => {
    try {
      const response: ApiResponse<{ task: Task }> = await api.put(`/tasks/${taskId}/assign-tags`, {
        tagIds
      });
      
      const updatedTask = response.data.task;
      
      // Actualizar en ambas listas
      set((state) => ({
        tasks: state.tasks.map((t: Task) => t.id === taskId ? updatedTask : t),
        projectTasks: state.projectTasks.map((t: Task) => t.id === taskId ? updatedTask : t)
      }));
      
      toast.success('Etiquetas actualizadas');
    } catch (error) {
      throw error;
    }
  },
}));