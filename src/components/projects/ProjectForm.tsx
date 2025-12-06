'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/stores/projects';

const projectSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(255, 'El nombre debe tener menos de 255 caracteres'),
  description: z.string()
    .max(1000, 'La descripción debe tener menos de 1000 caracteres')
    .optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: {
    id: number;
    name: string;
    description?: string;
  };
  onSuccess?: (project: any) => void;
  onCancel?: () => void;
}


export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject, updateProject } = useProjectStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true);

      let result;
      if (project) {
        // Actualizar proyecto existente
        result = await updateProject(project.id, data);
        toast.success('Proyecto actualizado exitosamente');
      } else {
        // Crear nuevo proyecto
        result = await createProject(data);
        toast.success('Proyecto creado exitosamente');
        reset();
      }

      onSuccess?.(result);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al procesar el proyecto';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {project 
            ? 'Modifica la información de tu proyecto' 
            : 'Completa la información para crear un nuevo proyecto'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre del proyecto */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Proyecto *
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Ej: Desarrollo de aplicación web"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe brevemente el proyecto y sus objetivos..."
            {...register('description')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* status removed in single-user mode */}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {project ? 'Actualizando...' : 'Creando...'}
              </div>
            ) : (
              project ? 'Actualizar Proyecto' : 'Crear Proyecto'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}