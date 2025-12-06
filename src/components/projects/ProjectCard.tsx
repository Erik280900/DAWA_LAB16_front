'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at?: string;
    user?: {
      id: number;
      username: string;
      email: string;
    };
    tasks?: Array<{
      id: number;
      status: 'pending' | 'in_progress' | 'completed' | 'review';
    }>;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role?.name === 'admin';
  
  const taskStats = project.tasks?.reduce(
    (acc, task) => {
      if (task.status === 'pending') acc.pending++;
      else if (task.status === 'in_progress') acc.in_progress++;
      else if (task.status === 'review') acc.review++;
      else if (task.status === 'completed') acc.completed++;
      acc.total++;
      return acc;
    },
    { pending: 0, in_progress: 0, review: 0, completed: 0, total: 0 }
  ) || { pending: 0, in_progress: 0, review: 0, completed: 0, total: 0 };

  const completionPercentage = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={`/projects/${project.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1">
                {project.name}
              </h3>
            </Link>
            {project.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        {/* Task Progress */}
        {taskStats.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Progreso de tareas</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{taskStats.completed} completadas</span>
              <span>{taskStats.total} total</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {(() => {
              const dateToFormat = project.updated_at || project.created_at;
              if (!dateToFormat) return 'Fecha no disponible';

              try {
                const date = new Date(dateToFormat);
                if (isNaN(date.getTime())) return 'Fecha inválida';

                return `Actualizado ${formatDistanceToNow(date, {
                  addSuffix: true,
                  locale: es
                })}`;
              } catch (error) {
                return 'Fecha no disponible';
              }
            })()}
          </div>
          <div className="flex space-x-2">
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline" size="sm">
                {isAdmin ? 'Ver Detalles' : 'Ver Proyecto'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}