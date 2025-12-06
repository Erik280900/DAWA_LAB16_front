'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskColumn } from '@/components/tasks/TaskColumn';
import { Card } from '@/components/ui/card';
import { useTaskStore } from '@/stores/tasks';
import { Task } from '@/types';
import toast from 'react-hot-toast';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: () => void;
  projectId: number;
}

// Usar los estados que expone el backend: 'pending', 'in_progress', 'completed'
const columns = [
  {
    id: 'pending',
    title: 'Por Hacer',
    color: 'bg-gray-100',
  },
  {
    id: 'in_progress',
    title: 'En Progreso',
    color: 'bg-blue-100',
  },
  {
    id: 'review',
    title: 'En Revisión',
    color: 'bg-yellow-100',
  },
  {
    id: 'completed',
    title: 'Completadas',
    color: 'bg-green-100',
  },
];

export function KanbanBoard({ tasks, onTaskUpdate, projectId }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { updateTask } = useTaskStore();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id;
    // over.id será uno de los ids definidos arriba: 'pending' | 'in_progress' | 'review' | 'completed'
    const newStatus = over.id as 'pending' | 'in_progress' | 'review' | 'completed';
    
    const task = tasks.find(t => t.id.toString() === taskId.toString());
    if (!task) return;

    if (task.status === newStatus) {
      setActiveId(null);
      return;
    }

    try {
      await updateTask(task.id, { status: newStatus });
      onTaskUpdate();
      toast.success('Tarea actualizada exitosamente');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al actualizar la tarea';
      toast.error(errorMessage);
    }

    setActiveId(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const activeTask = tasks.find(task => task.id.toString() === activeId);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <TaskColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={columnTasks.length}
            >
              <SortableContext 
                items={columnTasks.map(task => task.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={onTaskUpdate}
                    />
                  ))}
                </div>
              </SortableContext>
              
              {columnTasks.length === 0 && (
                <Card className="p-4 border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <p className="text-sm">No hay tareas</p>
                  </div>
                </Card>
              )}
            </TaskColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onUpdate={onTaskUpdate} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}