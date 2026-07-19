import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const reglaSchema = z.object({
  escenarioId: z.number().min(1, 'El escenario es requerido'),
  codigo: z.string().min(1, 'El código es requerido').max(30),
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  descripcion: z.string().optional(),
  severidad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
    message: 'La severidad es requerida',
  }),
  prioridad: z.number().min(1, 'La prioridad es requerida'),
  score: z.number().min(0, 'El score debe ser positivo'),
  estado: z.enum(['ACTIVA', 'INACTIVA', 'EN_PRUEBA', 'BORRADOR']).optional(),
});

export const usuarioSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  nombreCompleto: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  rol: z.enum(['ADMIN_GENERAL', 'ADMIN_EMPRESA', 'GERENTE_SUPERVISOR', 'ANALISTA', 'AUDITOR'], {
    message: 'El rol es requerido',
  }),
  empresaId: z.union([z.string(), z.number(), z.null()]).optional(),
});

export const kycSchema = z.object({
  identificadorDocumento: z.string().min(1, 'El documento es requerido').max(30),
});

export const simuladorSchema = z.object({
  productoCodigo: z.string().min(1, 'El producto es requerido'),
  canalCodigo: z.string().min(1, 'El canal es requerido'),
  monedaCodigo: z.string().min(1, 'La moneda es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  paisOrigenCodigo: z.string().min(1, 'El país de origen es requerido'),
  paisDestinoCodigo: z.string().min(1, 'El país de destino es requerido'),
  documentoCliente: z.string().min(1, 'El documento del cliente es requerido').max(30),
  fechaHora: z.string().min(1, 'La fecha y hora son requeridas'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ReglaFormData = z.infer<typeof reglaSchema>;
export type UsuarioFormData = z.infer<typeof usuarioSchema>;
export type KycFormData = z.infer<typeof kycSchema>;
export type SimuladorFormData = z.infer<typeof simuladorSchema>;
