'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projects';
import { useTaskStore } from '@/stores/tasks';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { TaskForm } from '@/components/tasks/TaskForm';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
  const { user } = useRequireAuth();
  const { user: authUser } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  const isAdmin = authUser?.role?.name === 'admin';
  
  const { 
    currentProject, 
    isLoading: projectLoading, 
    fetchProject 
  } = useProjectStore();
  
  const { 
    projectTasks, 
    isLoading: tasksLoading, 
    fetchTasksByProject 
  } = useTaskStore();

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    if (user && projectId) {
      const loadProjectData = async () => {
        try {
          await Promise.all([
            fetchProject(projectId),
            fetchTasksByProject(projectId)
          ]);
        } catch (error: any) {
          if (error.response?.status === 404) {
            toast.error('Proyecto no encontrado');
            router.push('/dashboard');
            return;
          }
          toast.error('Error al cargar el proyecto');
        } finally {
          setIsLoading(false);
        }
      };

      loadProjectData();
    }
  }, [user, projectId, fetchProject, fetchTasksByProject, router]);

  const handleTaskCreated = () => {
    setIsCreateTaskModalOpen(false);
    fetchTasksByProject(projectId); // Refrescar tareas
  };

  const handleTaskUpdated = () => {
    fetchTasksByProject(projectId); // Refrescar tareas
  };

  const handleEditProject = () => {
    if (currentProject) {
      setProjectName(currentProject.name);
      setProjectDescription(currentProject.description || '');
      setIsEditProjectModalOpen(true);
    }
  };

  const handleSaveProject = async () => {
    try {
      const { updateProject } = useProjectStore.getState();
      await updateProject(projectId, {
        name: projectName,
        description: projectDescription
      });
      setIsEditProjectModalOpen(false);
      toast.success('Proyecto actualizado');
      fetchProject(projectId);
    } catch (error) {
      // El interceptor ya muestra el error
    }
  };

  const handleDeleteProject = async () => {
    try {
      const { deleteProject } = useProjectStore.getState();
      await deleteProject(projectId);
      toast.success('Proyecto eliminado');
      router.push('/dashboard');
    } catch (error) {
      // El interceptor ya muestra el error
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Cargando proyecto...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Proyecto no encontrado</h2>
            <p className="text-gray-600 mb-4">El proyecto que buscas no existe o no tienes acceso a él.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Project status removed in single-user mode

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del Proyecto */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-gray-600">
                    Creado el {format(new Date(currentProject.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                  <span className="text-gray-600">
                    Por {currentProject.user?.username}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isAdmin && (
                <>
                  <Button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Tarea
                  </Button>
                  <Button variant="outline" onClick={handleEditProject}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar Proyecto
                  </Button>
                  <Button variant="destructive" onClick={() => setIsDeleteProjectModalOpen(true)}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Descripción */}
          {currentProject.description && (
            <div className="mt-4">
              <Card className="p-4">
                <p className="text-gray-700">{currentProject.description}</p>
              </Card>
            </div>
          )}
        </div>

        {/* Estadísticas del Proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h2m0-14V5a2 2 0 012-2h2a2 2 0 012 2v2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tareas</p>
                <p className="text-2xl font-semibold text-gray-900">{projectTasks.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projectTasks.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projectTasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projectTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tablero Kanban */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tablero de Tareas</h2>
          <KanbanBoard 
            tasks={projectTasks} 
            onTaskUpdate={handleTaskUpdated}
            projectId={projectId}
          />
        </div>
      </main>

      {/* Modal para crear tarea */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title="Crear Nueva Tarea"
        size="lg"
      >
        <TaskForm
          projectId={projectId}
          onSuccess={handleTaskCreated}
          onCancel={() => setIsCreateTaskModalOpen(false)}
        />
      </Modal>

      {/* Modal para editar proyecto */}
      <Modal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        title="Editar Proyecto"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del proyecto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción del proyecto"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditProjectModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProject} disabled={!projectName.trim()}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para confirmar eliminación de proyecto */}
      <Modal
        isOpen={isDeleteProjectModalOpen}
        onClose={() => setIsDeleteProjectModalOpen(false)}
        title="Eliminar Proyecto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que quieres eliminar el proyecto <strong>"{currentProject?.name}"</strong>? 
            Esta acción eliminará también todas las tareas asociadas y no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteProjectModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Eliminar Proyecto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}