// Tipos para la API
export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  created_at: string;
  role: {
    id: number;
    name: string;
  };
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  tasks?: Task[];
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  tags?: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  comments?: Comment[];
  project?: Project;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

// Respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Estados para el store
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (data: { name: string; description?: string }) => Promise<Project>;
  updateProject: (id: number, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
}

export interface TaskState {
  tasks: Task[];
  projectTasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  fetchTasksByProject: (projectId: number) => Promise<void>;
  createTask: (data: any) => Promise<Task>;
  updateTask: (taskId: number, data: any) => Promise<Task>;
  deleteTask: (taskId: number) => Promise<void>;
  assignTags: (taskId: number, tagIds: number[]) => Promise<void>;
}