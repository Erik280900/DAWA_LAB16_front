"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Tag } from '@/types';

export default function TagsPage() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [nameError, setNameError] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);

  useEffect(() => {
    // Redirigir a admin si es administrador
    if (authUser?.role?.name === 'admin') {
      router.push('/admin');
      toast.error('Los administradores no pueden gestionar etiquetas');
    }
  }, [authUser, router]);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const response: any = await api.get('/tags');
      setTags(response.data?.tags || []);
    } catch (err) {
      // api interceptor shows errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const openCreate = () => {
    setEditingTag(null);
    setName('');
    setColor('#6B7280');
    setIsModalOpen(true);
  };

  const openEdit = (t: Tag) => {
    setEditingTag(t);
    setName(t.name);
    setColor(t.color || '#6B7280');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones cliente
      const trimmed = name?.trim() || '';
      if (trimmed.length === 0) {
        setNameError('El nombre es requerido');
        return;
      }
      if (trimmed.length > 30) {
        setNameError('El nombre no puede tener más de 30 caracteres');
        return;
      }
      setNameError(null);

      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (color && !hexColorRegex.test(color)) {
        setColorError('El color debe ser un código hex válido (ej: #FF5733)');
        return;
      }
      setColorError(null);

      if (editingTag) {
        const res: any = await api.put(`/tags/${editingTag.id}`, { name: name.trim(), color });
        toast.success('Etiqueta actualizada');
      } else {
        const res: any = await api.post('/tags', { name: name.trim(), color });
        toast.success('Etiqueta creada');
      }

      setIsModalOpen(false);
      fetchTags();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tags:changed'));
      }
    } catch (err: any) {
      // api interceptor will show message
    }
  };

  const handleDelete = async (t: Tag) => {
    if (!confirm(`¿Eliminar etiqueta "${t.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/tags/${t.id}`);
      toast.success('Etiqueta eliminada');
      fetchTags();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tags:changed'));
      }
    } catch (err) {
      // interceptor muestra error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
            <p className="text-sm text-gray-600">Gestiona las etiquetas que puedes asignar a tus tareas.</p>
          </div>
          <div>
            <Button onClick={openCreate}>Nueva etiqueta</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            <Card className="p-6">Cargando...</Card>
          ) : tags.length === 0 ? (
            <Card className="p-6">No hay etiquetas. Crea la primera.</Card>
          ) : (
            tags.map(tag => (
              <Card key={tag.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-md" style={{ backgroundColor: tag.color || '#6B7280' }} />
                  <div>
                    <div className="font-medium text-gray-800">{tag.name}</div>
                    <div className="text-xs text-gray-500">ID: {tag.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => openEdit(tag)}>Editar</Button>
                  <Button variant="destructive" onClick={() => handleDelete(tag)}>Eliminar</Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTag ? 'Editar etiqueta' : 'Nueva etiqueta'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                  <Input 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)} 
                    placeholder="#6B7280"
                    className="font-mono"
                  />
                </div>
                <div 
                  className="h-12 w-12 rounded border border-gray-300 flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
              </div>
              {colorError && <p className="text-red-500 text-sm mt-1">{colorError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={Boolean(nameError) || Boolean(colorError)}>{editingTag ? 'Guardar' : 'Crear'}</Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
