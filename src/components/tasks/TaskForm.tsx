'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { useTaskStore } from '@/stores/tasks';
import api from '@/lib/api';

const taskSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .max(255, 'El título debe tener menos de 255 caracteres'),
  description: z.string()
    .max(1000, 'La descripción debe tener menos de 1000 caracteres')
    .optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  projectId: number;
  task?: {
    id: number;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'review' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    tags?: { id: number; name?: string; color?: string }[];
  };
  onSuccess?: (task: any) => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: 'pending', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'review', label: 'En Revisión' },
  { value: 'completed', label: 'Completada' },
];

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

export function TaskForm({ projectId, task, onSuccess, onCancel }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTask, updateTask } = useTaskStore();
  const [availableTags, setAvailableTags] = useState<Array<{ id: number; name: string; color?: string }>>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>(task?.tags?.map((t: any) => t.id) || []);
  const [tagQuery, setTagQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'pending',
      priority: task?.priority || 'medium',
      due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsSubmitting(true);

      const taskData = {
        ...data,
        tags: selectedTags,
        project_id: projectId,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      };

      let result;
      if (task) {
        // Actualizar tarea existente
        result = await updateTask(task.id, taskData);
        toast.success('Tarea actualizada exitosamente');
      } else {
        // Crear nueva tarea
        result = await createTask(taskData);
        toast.success('Tarea creada exitosamente');
        reset();
      }

      onSuccess?.(result);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al procesar la tarea';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchTags = async () => {
      try {
        const response: any = await api.get('/tags');
        const tags = response.data?.tags || [];
        if (mounted) setAvailableTags(tags);
      } catch (err) {
        // el interceptor de api ya muestra errores
      }
    };

    fetchTags();

    return () => { mounted = false; };
  }, []);

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const filteredTags = availableTags.filter(t => t.name.toLowerCase().includes(tagQuery.toLowerCase()) && !selectedTags.includes(t.id));

  const selectTag = (tagId: number) => {
    if (!selectedTags.includes(tagId)) setSelectedTags(prev => [...prev, tagId]);
    setTagQuery('');
    setShowTagDropdown(false);
  };

  const removeTag = (tagId: number) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {task ? 'Editar Tarea' : 'Crear Nueva Tarea'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {task 
            ? 'Modifica la información de tu tarea' 
            : 'Completa la información para crear una nueva tarea'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Título de la tarea */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título de la Tarea *
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Ej: Implementar sistema de autenticación"
            {...register('title')}
            className={errors.title ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
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
            placeholder="Describe detalladamente qué se debe hacer en esta tarea..."
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

        {/* Estado y Prioridad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              id="status"
              {...register('status')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.status ? 'border-red-500' : ''
              }`}
              disabled={isSubmitting}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad *
            </label>
            <select
              id="priority"
              {...register('priority')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.priority ? 'border-red-500' : ''
              }`}
              disabled={isSubmitting}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>
        </div>

        {/* Fecha límite */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Límite
          </label>
          <Input
            id="due_date"
            type="date"
            {...register('due_date')}
            className={errors.due_date ? 'border-red-500' : ''}
            disabled={isSubmitting}
          />
          {errors.due_date && (
            <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
          )}
        </div>

        {/* Etiquetas (autocomplete multi-select) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>

          {/* Selected chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.length === 0 && availableTags.length === 0 && (
              <p className="text-sm text-gray-500">No hay etiquetas disponibles</p>
            )}

            {selectedTags.map(id => {
              const tag = availableTags.find(t => t.id === id);
              if (!tag) return null;
              return (
                <span key={id} className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-gray-100 border">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#6B7280' }} />
                  <span>{tag.name}</span>
                  <button type="button" aria-label={`Eliminar ${tag.name}`} onClick={() => removeTag(id)} className="ml-1 text-gray-500 hover:text-gray-700">✕</button>
                </span>
              );
            })}
          </div>

          {/* Input for searching/adding tags */}
          <div className="relative">
            <Input
              placeholder={availableTags.length === 0 ? 'No hay etiquetas' : 'Buscar o seleccionar etiquetas...'}
              value={tagQuery}
              onChange={(e: any) => { setTagQuery(e.target.value); setShowTagDropdown(true); }}
              onFocus={() => setShowTagDropdown(true)}
              disabled={isSubmitting || availableTags.length === 0}
            />

            {/* Dropdown suggestions */}
            {showTagDropdown && filteredTags.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => selectTag(tag.id)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || '#6B7280' }} />
                    <span className="text-sm">{tag.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
                {task ? 'Actualizando...' : 'Creando...'}
              </div>
            ) : (
              task ? 'Actualizar Tarea' : 'Crear Tarea'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}