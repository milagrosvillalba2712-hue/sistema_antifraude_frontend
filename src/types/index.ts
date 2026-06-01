export type Rol = 'ADMINISTRADOR' | 'ANALISTA';

export type EstadoAlerta = 'PENDIENTE' | 'ASIGNADA' | 'INVESTIGANDO' | 'RESUELTA' | 'DESCARTADA';

export type PrioridadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  email: string;
  rol: Rol;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  intentosFallidos: number;
  fechaCreacion: string;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;
  rol: Rol;
}

export interface Alerta {
  id: number;
  transaccionId: number | null;
  reglaId: number | null;
  prioridad: PrioridadAlerta;
  estado: EstadoAlerta;
  observacion: string | null;
  asignadoA: number | null;
  fechaGeneracion: string;
  fechaResolucion: string | null;
}

export interface AlertaRequest {
  transaccionId: number;
  reglaId: number;
  prioridad: PrioridadAlerta;
  observacion?: string;
}

export interface ReglaRiesgo {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipoRegla: string | null;
  severidad: string | null;
  condicion: string;
  activa: boolean;
  creadaPor: number | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface ReglaRiesgoRequest {
  nombre: string;
  descripcion?: string;
  tipoRegla?: string;
  severidad?: string;
  condicion: string;
  activa?: boolean;
}

export interface DashboardResponse {
  totalTransacciones: number;
  transaccionesSospechosas: number;
  alertasPendientes: number;
  alertasResueltas: number;
  promedioScoreRiesgo: number;
  transaccionesPorEstado: Record<string, number>;
  alertasPorPrioridad: Record<string, number>;
}

export interface KycResponse {
  identificadorDocumento: string;
  tipoConsulta: string;
  resultado: boolean;
  mensaje: string;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}

export interface Transaccion {
  id: number;
  transactionUuid: string;
  identificadorDocumento: string | null;
  cuentaOrigen: string;
  cuentaDestino: string;
  monto: number;
  moneda: string;
  canal: string;
  tipoTransaccion: string;
  ipOrigen: string | null;
  paisOrigen: string | null;
  fechaTransaccion: string;
  estado: string;
  scoreRiesgo: number | null;
  procesada: boolean;
  fechaProcesamiento: string | null;
}
