import { create } from 'zustand';
import api from '@/lib/api';
import { ProjectState, ApiResponse, Project } from '@/types';
import { toast } from 'react-hot-toast';

// Función para mapear los datos del backend al formato del frontend
const mapBackendProject = (backendProject: any): Project => {
  return {
    ...backendProject,
    name: backendProject.name,
    description: backendProject.description || '',
    updated_at: backendProject.updated_at || backendProject.created_at
  };
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    try {
      set({ isLoading: true });
      
      const response: ApiResponse<{ projects: any[] }> = await api.get('/projects');
      
      const mappedProjects = response.data.projects.map(mapBackendProject);
      set({ projects: mappedProjects, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProject: async (id: number) => {
    try {
      set({ isLoading: true });
      
      const response: ApiResponse<{ project: any }> = await api.get(`/projects/${id}`);
      
      const mappedProject = mapBackendProject(response.data.project);
      set({ currentProject: mappedProject, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createProject: async (data: { name: string; description?: string }) => {
    try {
      // Mapear los campos al formato esperado por el backend
      const projectData = {
        name: data.name,
        description: data.description || ''
      };
      
      const response: ApiResponse<{ project: any }> = await api.post('/projects', projectData);
      
      const mappedProject = mapBackendProject(response.data.project);
      
      // Actualizar la lista de proyectos
      set((state) => ({
        projects: [mappedProject, ...state.projects]
      }));
      
      toast.success('Proyecto creado exitosamente');
      return mappedProject;
    } catch (error) {
      throw error;
    }
  },

  updateProject: async (id: number, data: { name?: string; description?: string }) => {
    try {
      // Mapear los campos al formato esperado por el backend
      const projectData = {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description })
      };
      
      const response: ApiResponse<{ project: any }> = await api.put(`/projects/${id}`, projectData);
      
      const mappedProject = mapBackendProject(response.data.project);
      
      // Actualizar en la lista
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? mappedProject : p),
        currentProject: state.currentProject?.id === id ? mappedProject : state.currentProject
      }));
      
      toast.success('Proyecto actualizado exitosamente');
    } catch (error) {
      throw error;
    }
  },

  deleteProject: async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
      
      // Remover de la lista
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
      }));
      
      toast.success('Proyecto eliminado exitosamente');
    } catch (error) {
      throw error;
    }
  },

  // members endpoints removed for single-user mode
}));