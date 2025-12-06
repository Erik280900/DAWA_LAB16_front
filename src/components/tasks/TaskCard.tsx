'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/tasks/TaskForm';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  isOverlay?: boolean;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
};

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export function TaskCard({ task, onUpdate, isOverlay = false }: TaskCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDueDateColor = () => {
    if (!task.due_date) return '';
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    
    if (isBefore(dueDate, today)) {
      return 'text-red-600'; // Vencida
    } else if (isToday(dueDate)) {
      return 'text-yellow-600'; // Vence hoy
    } else if (isAfter(dueDate, today)) {
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) {
        return 'text-orange-600'; // Vence en los próximos 3 días
      }
    }
    return 'text-gray-600';
  };

  const handleTaskUpdated = () => {
    setIsEditModalOpen(false);
    onUpdate();
  };

  const handleDelete = async () => {
    try {
      const { useTaskStore } = await import('@/stores/tasks');
      await useTaskStore.getState().deleteTask(task.id);
      setIsDeleteModalOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-4 hover:shadow-md transition-shadow duration-200 ${
          isDragging ? 'opacity-50' : ''
        } ${isOverlay ? 'shadow-lg' : ''}`}
      >
        {/* Header con prioridad y acciones */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority] || ''}`}>
            {priorityLabels[task.priority] || ''}
          </span>
          <div className="flex items-center gap-1">
            {/* Icono de arrastrar */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            {/* Botón editar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              className="p-1 h-auto text-gray-400 hover:text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            {/* Botón eliminar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              className="p-1 h-auto text-gray-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Título */}
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Descripción */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {task.description}
          </p>
        )}

        {/* Fecha límite */}
        {task.due_date && (
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`text-xs font-medium ${getDueDateColor()}`}>
              {format(new Date(task.due_date), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
        )}

        {/* Assignee removed in single-user mode */}

        {/* Etiquetas */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {task.tags.map(tag => (
              <span key={tag.id} className="inline-flex items-center text-xs px-2 py-1 rounded-full border" style={{ backgroundColor: tag.color || '#F3F4F6' }}>
                <span className="mr-2" style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: tag.color || '#6B7280' }} />
                <span className="text-gray-700">{tag.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Footer con fecha de creación */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Creada {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      </Card>

      {/* Modal para editar tarea */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Tarea"
        size="lg"
      >
        <TaskForm
          projectId={task.project_id}
          task={task}
          onSuccess={handleTaskUpdated}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Modal para confirmar eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Tarea"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que quieres eliminar la tarea <strong>"{task.title}"</strong>? 
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}