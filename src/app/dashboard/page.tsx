'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projects';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Header } from '@/components/layout/Header';

export default function DashboardPage() {
  const { user } = useRequireAuth();
  const { user: authUser, logout } = useAuthStore();
  const router = useRouter();
  const { projects, isLoading, fetchProjects } = useProjectStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tagsCount, setTagsCount] = useState<number>(0);

  // Redirigir admin a su panel
  useEffect(() => {
    if (authUser?.role?.name === 'admin') {
      router.push('/admin');
    }
  }, [authUser, router]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  useEffect(() => {
    let mounted = true;
    const fetchTagsCount = async () => {
      try {
        const response: any = await api.get('/tags');
        const count = response.data?.tags?.length ?? 0;
        if (mounted) setTagsCount(count);
      } catch (err) {
        // interceptor de api manejará errores
      }
    };

    if (user) fetchTagsCount();

    return () => { mounted = false; };
  }, [user]);

  // Escucha cambios globales en tags para refrescar el contador
  useEffect(() => {
    const handler = async () => {
      try {
        const response: any = await api.get('/tags');
        setTagsCount(response.data?.tags?.length ?? 0);
      } catch (err) {
        // ignore, interceptor manejará
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tags:changed', handler as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('tags:changed', handler as EventListener);
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Bienvenido, {authUser?.username}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                {authUser?.role?.name === 'admin' 
                  ? 'Panel de supervisión - Solo lectura'
                  : 'Gestiona tus proyectos y tareas de manera eficiente'
                }
              </p>
            </div>
            {authUser?.role?.name !== 'admin' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Proyecto
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2M5 21h2m0 0h2m-2 0V5m0 16h14" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-gray-600">Proyectos activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tareas Totales</CardTitle>
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.reduce((total, project) => total + (project.tasks?.length || 0), 0)}
                </div>
                <p className="text-xs text-gray-600">En todos los proyectos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Creados</CardTitle>
                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(project => project.user_id === authUser?.id).length}
                </div>
                <p className="text-xs text-gray-600">Como propietario</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Etiquetas</CardTitle>
                <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v6a2 2 0 002 2h6l7-7-7-7H5a2 2 0 00-2 2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tagsCount}</div>
                <p className="text-xs text-gray-600">Etiquetas totales</p>
                {authUser?.role?.name !== 'admin' && (
                  <div className="mt-3">
                    <Link href="/tags"><Button variant="outline" size="sm">Gestionar Etiquetas</Button></Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Projects Section */}
        <div className="px-4 sm:px-0 mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
            <p className="text-gray-600">Proyectos de los cuales eres propietario o miembro</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mt-2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2M5 21h2m0 0h2m-2 0V5m0 16h14" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
                <p className="text-gray-600 text-center mb-4">
                  Comienza creando tu primer proyecto para organizar tus tareas
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Crear Primer Proyecto
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Proyecto"
        description="Completa la información para crear un nuevo proyecto"
      >
        <ProjectForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
}