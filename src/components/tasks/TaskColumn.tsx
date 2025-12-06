'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';

interface TaskColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function TaskColumn({ id, title, color, count, children }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header de la columna */}
      <div className={`p-4 rounded-t-lg ${color} border-b`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-4 rounded-b-lg bg-white border-l border-r border-b transition-colors duration-200 ${
          isOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
        } min-h-[400px]`}
      >
        {children}
      </div>
    </div>
  );
}