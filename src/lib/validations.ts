import { z } from 'zod';

// Esquemas de validación para autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  username: z.string().min(2, 'El username debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Esquemas para proyectos
export const projectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido'),
  description: z.string().optional(),
});

// Esquemas para tareas
export const taskSchema = z.object({
  title: z.string().min(1, 'El título de la tarea es requerido'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().optional(),
});

// Esquemas para comentarios
export const commentSchema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío'),
});

// Esquemas para etiquetas
export const tagSchema = z.object({
  name: z.string().min(1, 'El nombre de la etiqueta es requerido').max(30, 'Máximo 30 caracteres'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hexadecimal válido'),
});

// Tipos TypeScript derivados de los esquemas
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type TaskData = z.infer<typeof taskSchema>;
export type CommentData = z.infer<typeof commentSchema>;
export type TagData = z.infer<typeof tagSchema>;