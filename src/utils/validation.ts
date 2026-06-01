import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const reglaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  descripcion: z.string().optional(),
  tipoRegla: z.string().optional(),
  severidad: z.string().optional(),
  condicion: z.string().min(1, 'La condición es requerida'),
  activa: z.boolean().optional(),
});

export const usuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  rol: z.enum(['ADMINISTRADOR', 'ANALISTA']),
});

export const kycSchema = z.object({
  identificadorDocumento: z.string().min(1, 'El documento es requerido').max(30),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ReglaFormData = z.infer<typeof reglaSchema>;
export type UsuarioFormData = z.infer<typeof usuarioSchema>;
export type KycFormData = z.infer<typeof kycSchema>;
