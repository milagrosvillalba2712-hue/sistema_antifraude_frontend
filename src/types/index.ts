export type Rol =
  | 'ANALISTA'
  | 'AUDITOR'
  | 'ADMINISTRADOR'
  | 'SUPERVISOR';

export type UUID = string;

export type Permission =
  | 'EMPRESAS_VER' | 'EMPRESAS_EDITAR'
  | 'LICENCIAS_VER' | 'LICENCIAS_GESTIONAR'
  | 'PAGOS_VER' | 'PAGOS_GESTIONAR'
  | 'USUARIOS_VER' | 'USUARIOS_CREAR' | 'USUARIOS_EDITAR'
  | 'REGLAS_VER' | 'REGLAS_CREAR' | 'REGLAS_EDITAR' | 'REGLAS_ACTIVAR'
  | 'CATALOGOS_VER' | 'CATALOGOS_EDITAR'
  | 'ALERTAS_VER' | 'ALERTAS_ASIGNAR' | 'ALERTAS_RESOLVER' | 'ALERTAS_APROBAR'
  | 'CASOS_VER' | 'CASOS_GESTIONAR' | 'CASOS_APROBAR'
  | 'REPORTES_VER' | 'REPORTES_GENERAR'
  | 'AUDITORIA_VER';

export type EstadoAlerta = 'NUEVA' | 'ASIGNADA' | 'EN_REVISION' | 'PENDIENTE_APROBACION' | 'REEVALUACION' | 'CERRADA';

export type PrioridadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type EstadoUsuario =
  | 'DISPONIBLE' | 'OCUPADO' | 'AUSENTE' | 'NO_DISPONIBLE'
  | 'EN_REUNION' | 'ALMUERZO' | 'VACACIONES' | 'CAPACITACION' | 'FUERA_OFICINA';

export type EstadoEvaluacion = 'PENDIENTE' | 'EN_PROCESO' | 'APROBADA' | 'RECHAZADA' | 'REVISION_MANUAL' | 'SOSPECHOSA';

export type NivelRiesgo = 'MUY_BAJO' | 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type EstadoRegla = 'ACTIVA' | 'INACTIVA' | 'EN_PRUEBA' | 'BORRADOR';

export type SeveridadRegla = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type EstadoCaso = 'NUEVO' | 'ASIGNADO' | 'EN_INVESTIGACION' | 'EN_REVISION' | 'RESUELTO' | 'ROS_GENERADO' | 'CERRADO';

export type ResultadoCaso = 'FALSO_POSITIVO' | 'OPERACION_JUSTIFICADA' | 'RIESGO_CONFIRMADO' | 'ROS_GENERADO' | 'ESCALADO';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuarioId: UUID;
  email: string;
  rol: Rol;
  empresaId: UUID | null;
  rolId: number | null;
  permisos: Permission[];
}

export interface Usuario {
  id: UUID;
  username: string;
  nombreCompleto: string;
  email: string;
  rol: Rol;
  empresaId: UUID | null;
  empresaNombre?: string | null;
  activo: boolean;
  intentosFallidos: number;
  bloqueadoHasta: string | null;
  fechaCreacion: string;
  nombre?: string;
}

export interface UsuarioRequest {
  username: string;
  nombreCompleto: string;
  email: string;
  password?: string;
  rol: Rol;
  empresaId?: UUID | null;
}

export interface Pais {
  id: number;
  codigoIso: string;
  nombre: string;
  continente: string | null;
  activo: boolean;
}

export interface Moneda {
  id: number;
  codigoIso: string;
  nombre: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Canal {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface NivelRiesgoEntity {
  id: number;
  codigo: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface Escenario {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface ParametroRegla {
  id: number;
  reglaId: number;
  clave: string;
  valor: string;
  tipoDato: 'NUMERICO' | 'TEXTO' | 'FECHA' | 'BOOLEANO';
}

export interface Accion {
  id: number;
  codigo: string;
  descripcion: string | null;
}

export interface CatalogoItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface EntitySummary {
  key: string;
  table: string;
  count: number;
  editable: boolean;
}

export interface EntityFieldSchema {
  name: string;
  type: string;
  relationType: string | null;
  relation: boolean;
  editable: boolean;
}

export interface EntitySchema {
  key: string;
  table: string;
  editable: boolean;
  fields: EntityFieldSchema[];
}

export type EntityRecord = Record<string, unknown>;

export interface CondicionRegla {
  fact: string;
  operador: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'between' | 'exists';
  valor: string | number | boolean | Array<string | number>;
}

export interface ReglaRiesgo {
  id: number;
  escenarioId: number;
  escenarioNombre?: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  severidad: SeveridadRegla;
  prioridad: number;
  score: number;
  version: number;
  estado: EstadoRegla;
  parametros?: ParametroRegla[];
  acciones?: Accion[];
  condicion?: string;
  condicionesJson?: string | null;
  accionesJson?: string | null;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface ReglaRiesgoRequest {
  escenarioId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  severidad: SeveridadRegla;
  prioridad: number;
  score: number;
  estado?: EstadoRegla;
  condiciones?: { combinador: 'ALL' | 'ANY'; items: CondicionRegla[] };
  acciones?: Array<{ codigo: string; descripcion: string }>;
  parametros?: { clave: string; valor: string; tipoDato: string }[];
  accionIds?: number[];
}

export interface Alerta {
  id: number;
  codigo: string;
  transaccionId: number;
  reglaId: number;
  reglaNombre?: string;
  escenarioId?: number | null;
  escenarioNombre?: string | null;
  clienteDocumento?: string | null;
  clienteNombre?: string | null;
  monto?: number | null;
  moneda?: string | null;
  canal?: string | null;
  paisOrigen?: string | null;
  fechaTransaccion?: string | null;
  nivelRiesgo?: string | null;
  severidad?: SeveridadRegla | string | null;
  prioridad: PrioridadAlerta;
  score: number;
  estado: EstadoAlerta;
  observacion: string | null;
  asignadoA: UUID | null;
  asignadoNombre?: string;
  fechaGeneracion: string;
  fechaResolucion: string | null;
}

export interface AnalistaDisponible {
  usuarioId: UUID;
  nombre: string;
  email: string;
  estado: string;
  alertasActivas: number;
  disponible: boolean;
}

export interface ResolucionAlertaRequest {
  resultado: 'FRAUDE_CONFIRMADO' | 'FALSO_POSITIVO' | 'OPERACION_JUSTIFICADA' | 'ESCALAR' | 'ROS_REQUERIDO';
  conclusion: string;
  decision: string;
  justificacion: string;
  evidenciaDescripcion: string;
  contactoCliente: string;
  fondosRetenidos: boolean;
  movimientoLiberable: boolean;
  requiereRos: boolean;
  requiereBloqueo: boolean;
  requiereEscalamientoLegal: boolean;
}

export interface ResolucionAlerta extends ResolucionAlertaRequest {
  id: number;
  alertaId: number;
  usuarioId: UUID | null;
  usuarioNombre: string | null;
  fechaResolucion: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface AlertaFiltros {
  severidades: FilterOption[];
  estados: FilterOption[];
  escenarios: FilterOption[];
  analistas: FilterOption[];
  rangosFecha: FilterOption[];
  ordenes: FilterOption[];
  tamanosPagina: number[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface TransaccionAlerta {
  id: number;
  codigo: string;
  transactionUuid: string | null;
  identificadorDocumento: string | null;
  cuentaOrigen: string | null;
  cuentaDestino: string | null;
  monto: number | null;
  moneda: string | null;
  canal: string | null;
  tipoTransaccion: string | null;
  ipOrigen: string | null;
  paisOrigen: string | null;
  fechaTransaccion: string | null;
  scoreRiesgo: number | null;
  nivelRiesgo: string | null;
  estadoEvaluacion: string | null;
  remitente?: Record<string, unknown>;
  beneficiario?: Record<string, unknown>;
  operacion?: Record<string, unknown>;
  controlSeguimiento?: Record<string, unknown>;
  internacional?: Record<string, unknown>;
}

export interface ClienteAlerta {
  documento: string | null;
  personaRemitente: string | null;
  personaBeneficiario: string | null;
  pep: string | null;
  observado: string | null;
  listas: string | null;
  fuente?: string | null;
  personal?: Record<string, unknown>;
  laboral?: Record<string, unknown>;
  academico?: Record<string, unknown>;
  familiar?: Record<string, unknown>;
  judicialRegulatorio?: Record<string, unknown>;
}

export interface ReglaAlerta {
  id: number | null;
  codigo: string | null;
  nombre: string | null;
  descripcion: string | null;
  severidad: string | null;
  prioridad: number | null;
  estado: string | null;
  condicion: string | null;
  condicionesJson: string | null;
  accionesJson: string | null;
  scoreBase: number | null;
  escenarioId: number | null;
  escenarioNombre: string | null;
}

export interface ServicioExternoAlerta {
  servicio: string;
  estado: string;
  mensaje: string;
}

export interface EvidenciaAlerta {
  id: number | null;
  nombre: string | null;
  descripcion: string | null;
  tipo: string | null;
  extension: string | null;
  mimeType: string | null;
  tamanoBytes: number | null;
  estado: string | null;
  referenciaArchivo: string | null;
  cargadoPor: string | null;
  fechaCarga: string | null;
}

export interface EvidenciaAlertaRequest {
  nombre: string;
  descripcion: string;
  tipo: string;
  extension: string;
  mimeType?: string;
  tamanoBytes?: number;
  referenciaArchivo?: string;
  estado?: string;
}

export interface HallazgoAlerta {
  id: number | null;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  severidad: string | null;
  score: number | null;
  fuente: string | null;
  detalleJson: string | null;
  regla: ReglaAlerta | null;
}

export interface AprobacionSupervisor {
  id: number;
  alertaId: number;
  resolucionId: number | null;
  supervisorId: UUID | null;
  supervisorNombre: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | string;
  observacion: string | null;
  motivoRechazo: string | null;
  faltantes: string | null;
  fechaSolicitud: string;
  fechaAprobacion: string | null;
}

export interface AlertaDetalle {
  alerta: Alerta;
  transaccion: TransaccionAlerta | null;
  regla: ReglaAlerta | null;
  reglasDisparadas: ReglaAlerta[];
  hallazgosRegulatorios: HallazgoAlerta[];
  cliente: ClienteAlerta | null;
  historialTransaccional: TransaccionAlerta[];
  serviciosExternos: ServicioExternoAlerta[];
  timeline: TimelineEvent[];
  accionesTimeline: TimelineEvent[];
  evidencias: EvidenciaAlerta[];
  resolucion: ResolucionAlerta | null;
  aprobacion: AprobacionSupervisor | null;
  accionesDisponibles: string[];
}

export interface RuleFactDefinition {
  fact: string;
  etiqueta: string;
  tipo: 'NUMERICO' | 'CATALOGO' | 'BOOLEANO' | 'EXISTENCIA';
  catalogo: string | null;
  operadores: CondicionRegla['operador'][];
}

export interface AlertaRequest {
  transaccionId: number;
  reglaId: number;
  prioridad: PrioridadAlerta;
  observacion?: string;
}

export interface Transaccion {
  id: number;
  codigo: string;
  transactionUuid: string;
  personaRemitenteId: number;
  personaRemitenteNombre?: string;
  personaBeneficiarioId: number | null;
  personaBeneficiarioNombre?: string;
  productoId: number;
  productoNombre?: string;
  canalId: number;
  canalNombre?: string;
  monedaId: number;
  monedaCodigo?: string;
  monto: number;
  paisOrigenId: number;
  paisOrigenNombre?: string;
  paisDestinoId: number;
  paisDestinoNombre?: string;
  fechaHoraOperacion: string;
  scoreTotal: number | null;
  nivelRiesgoId: number | null;
  nivelRiesgoNombre?: string;
  estadoEvaluacion: EstadoEvaluacion;
  fechaCreacion: string;
}

export interface EjecucionRegla {
  id: number;
  transaccionId: number;
  transaccionCodigo?: string;
  reglaId: number;
  reglaCodigo: string;
  reglaNombre: string;
  versionReglaEvaluada: number;
  resultadoBooleano: boolean;
  scoreAportado: number;
  accionesGeneradas: string | null;
  tiempoEjecucionMs: number | null;
  fechaHoraEjecucion: string;
}

export interface Caso {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoCaso;
  prioridad: PrioridadAlerta;
  score: number | null;
  usuarioAnalistaId: UUID | null;
  usuarioAnalistaNombre?: string;
  fechaApertura: string;
  fechaCierre: string | null;
  resultado: ResultadoCaso | null;
  observaciones: string | null;
  cantidadAlertas?: number;
}

export interface DashboardResponse {
  totalTransacciones: number;
  transaccionesSospechosas: number;
  alertasPendientes: number;
  alertasResueltas: number;
  promedioScoreRiesgo: number;
  transaccionesPorEstado: Record<string, number>;
  alertasPorPrioridad: Record<string, number>;
  casosPorEstado?: Record<string, number>;
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

export interface SimuladorRequest {
  productoCodigo: string;
  canalCodigo: string;
  monedaCodigo: string;
  monto: number;
  paisOrigenCodigo: string;
  paisDestinoCodigo: string;
  documentoCliente: string;
  fechaHora: string;
}

export interface SimuladorReglaResultado {
  codigo: string;
  nombre: string;
  cumplida: boolean;
  score: number;
  severidad: string;
}

export interface SimuladorResponse {
  scoreTotal: number;
  nivelRiesgo: string;
  requiereAccionInmediata: boolean;
  observaciones: string | null;
  estado: string;
  estadoEvaluacion: string;
  reglasEjecutadas: SimuladorReglaResultado[];
  accionesSugeridas: string[];
}

export interface PerfilUsuario {
  id: number;
  usuarioId: UUID;
  fotoUrl: string | null;
  telefono: string | null;
  biografia: string | null;
  zonaHoraria: string;
  nombreVisible?: string | null;
  imagenPerfil?: string | null;
  estado?: EstadoUsuario;
  estadoPersonalizado?: string | null;
  ultimaActualizacionEstado?: string | null;
}

export interface Disponibilidad {
  id: number;
  usuarioId: UUID;
  estado: EstadoUsuario;
  emoji: string | null;
  mensajePersonalizado: string | null;
  disponibleHasta: string | null;
  fechaActualizacion: string;
  tipoEstado?: string;
  fechaInicio?: string;
  fechaFin?: string | null;
  esProgramado?: boolean;
  motivo?: string | null;
  activo?: boolean;
}

export interface HistorialAsignacion {
  id: number;
  alertaId: number;
  usuarioOrigenId: UUID | null;
  usuarioOrigenNombre: string | null;
  usuarioDestinoId: UUID;
  usuarioDestinoNombre: string;
  fecha: string;
  motivo: string | null;
  tipo: 'ASIGNACION' | 'REASIGNACION' | 'REBALANCEO';
}

export interface TimelineEvent {
  id: number | null;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuario: string | null;
}

export interface WorkloadData {
  usuarioId: UUID;
  nombre: string;
  alertasAsignadas: number;
  alertasPendientes: number;
  tiempoPromedioResolucion: number;
}

export interface AlertFilters {
  search: string;
  estado: EstadoAlerta | '';
  prioridad: PrioridadAlerta | '';
}

export interface ReglaHistorialVersion {
  id: number;
  reglaId: number;
  version: number;
  snapshotJson: string;
  motivoCambio: string;
  usuarioId: UUID;
  usuarioNombre?: string;
  fechaHora: string;
}

export type TipoDocumentoLegal = 'TERMINOS' | 'POLITICA_PRIVACIDAD';

export type EstadoJobLocal = 'ACTIVO' | 'INACTIVO';

export type UnidadFrecuenciaJob = 'MINUTOS' | 'HORAS' | 'DIAS';

export interface JobLocalDetalle {
  frecuenciaValor?: number | null;
  frecuenciaUnidad?: UnidadFrecuenciaJob | null;
  hora?: string | null;
  cron?: string | null;
  ultimaEjecucion?: string | null;
  proximaEjecucion?: string | null;
  ultimoResultado?: string | null;
  ultimoDetalle?: string | null;
}

export interface JobLocal {
  id: number | string;
  tipo: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  estado: EstadoJobLocal;
  editable: boolean;
  orden: number;
  detalle: JobLocalDetalle;
}

export interface JobLocalFrecuencia {
  valor: number;
  unidad: UnidadFrecuenciaJob;
  hora?: string | null;
  cron?: string | null;
}

export interface JobLocalUpdateRequest {
  estado?: EstadoJobLocal;
  frecuencia?: JobLocalFrecuencia;
}
