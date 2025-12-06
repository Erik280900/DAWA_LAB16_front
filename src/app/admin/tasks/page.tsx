'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  project: {
    id: number;
    name: string;
  };
  assignedUser: {
    id: number;
    username: string;
  } | null;
  created_at: string;
  due_date: string | null;
}

export default function AdminTasksPage() {
  const { user } = useRequireAuth();
  const { user: authUser } = useAuthStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Verificar que el usuario sea admin
    if (authUser && authUser.role?.name !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await api.get('/admin/tasks');
        const data = response.data.data || response.data;
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error al cargar tareas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchTasks();
    }
  }, [authUser, router]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Tareas</h1>
          <p className="text-gray-600 mt-2">Administra todas las tareas del sistema</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('pending')}
                >
                  Pendientes
                </Button>
                <Button
                  variant={filterStatus === 'in-progress' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('in-progress')}
                >
                  En Progreso
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('completed')}
                >
                  Completadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando tareas...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No se encontraron tareas</p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.project && (
                            <Badge variant="outline">
                              📁 {task.project.name}
                            </Badge>
                          )}
                          {task.assignedUser && (
                            <Badge variant="outline">
                              👤 {task.assignedUser.username}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                          <span>Creada: {new Date(task.created_at).toLocaleDateString()}</span>
                          {task.due_date && (
                            <span>Vence: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        <div className="mt-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredTasks.length} de {tasks.length} tareas
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                >
                  Volver al Panel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
