import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { simuladorApi } from '../../api';
import { simuladorSchema, type SimuladorFormData } from '../../utils';
import type { SimuladorResponse, Producto, Canal, Moneda, Pais } from '../../types';
import api from '../../api/axios';

const Simulador = () => {
  const [resultado, setResultado] = useState<SimuladorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [canales, setCanales] = useState<Canal[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SimuladorFormData>({
    resolver: zodResolver(simuladorSchema),
    defaultValues: {
      monto: 0,
    },
  });

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [prodRes, canalRes, monedaRes, paisRes] = await Promise.all([
          api.get<Producto[]>('/catalogos/productos'),
          api.get<Canal[]>('/catalogos/canales'),
          api.get<Moneda[]>('/catalogos/monedas'),
          api.get<Pais[]>('/catalogos/paises'),
        ]);
        setProductos(prodRes.data);
        setCanales(canalRes.data);
        setMonedas(monedaRes.data);
        setPaises(paisRes.data);
      } catch (err) {
        console.error('Error loading catalogs', err);
      }
    };
    loadCatalogs();
  }, []);

  const onSubmit = async (data: SimuladorFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await simuladorApi.evaluar(data);
      setResultado(response);
    } catch (err) {
      setError('Error al ejecutar la simulación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNivelRiesgoColor = (nivel: string) => {
    switch (nivel) {
      case 'CRITICO': return 'text-critical bg-critical/10';
      case 'ALTO': return 'text-warning bg-warning/10';
      case 'MEDIO': return 'text-primary-container bg-primary-container/10';
      case 'BAJO': return 'text-success bg-success/10';
      default: return 'text-secondary bg-surface-container';
    }
  };

  return (
    <div className="space-y-gutter">
      <div>
        <h1 className="text-secondary font-semibold text-2xl">Simulador de Reglas</h1>
        <p className="text-secondary/60 text-sm mt-1">
          Evalúa transacciones sin persistir datos. Solo para pruebas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary mb-4">Datos de la Transacción</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Producto *
                </label>
                <select
                  {...register('productoCodigo')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                >
                  <option value="">Seleccionar</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.codigo}>{p.nombre}</option>
                  ))}
                </select>
                {errors.productoCodigo && (
                  <p className="mt-1 text-sm text-error">{errors.productoCodigo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Canal *
                </label>
                <select
                  {...register('canalCodigo')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                >
                  <option value="">Seleccionar</option>
                  {canales.map((c) => (
                    <option key={c.id} value={c.codigo}>{c.nombre}</option>
                  ))}
                </select>
                {errors.canalCodigo && (
                  <p className="mt-1 text-sm text-error">{errors.canalCodigo.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Moneda *
                </label>
                <select
                  {...register('monedaCodigo')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                >
                  <option value="">Seleccionar</option>
                  {monedas.map((m) => (
                    <option key={m.id} value={m.codigoIso}>{m.nombre}</option>
                  ))}
                </select>
                {errors.monedaCodigo && (
                  <p className="mt-1 text-sm text-error">{errors.monedaCodigo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  {...register('monto', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  placeholder="0"
                />
                {errors.monto && (
                  <p className="mt-1 text-sm text-error">{errors.monto.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  País Origen *
                </label>
                <select
                  {...register('paisOrigenCodigo')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                >
                  <option value="">Seleccionar</option>
                  {paises.map((p) => (
                    <option key={p.id} value={p.codigoIso}>{p.nombre}</option>
                  ))}
                </select>
                {errors.paisOrigenCodigo && (
                  <p className="mt-1 text-sm text-error">{errors.paisOrigenCodigo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  País Destino *
                </label>
                <select
                  {...register('paisDestinoCodigo')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                >
                  <option value="">Seleccionar</option>
                  {paises.map((p) => (
                    <option key={p.id} value={p.codigoIso}>{p.nombre}</option>
                  ))}
                </select>
                {errors.paisDestinoCodigo && (
                  <p className="mt-1 text-sm text-error">{errors.paisDestinoCodigo.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Documento Cliente *
                </label>
                <input
                  {...register('documentoCliente')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  placeholder="1234567"
                />
                {errors.documentoCliente && (
                  <p className="mt-1 text-sm text-error">{errors.documentoCliente.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Fecha/Hora *
                </label>
                <input
                  type="datetime-local"
                  {...register('fechaHora')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                />
                {errors.fechaHora && (
                  <p className="mt-1 text-sm text-error">{errors.fechaHora.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary-container text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-bold text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Ejecutar Simulación
            </button>
          </form>
        </section>

        {/* Results */}
        <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary mb-4">Resultado</h2>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-error/10 rounded-lg text-error">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!resultado && !error && (
            <div className="text-center py-12 text-secondary/40">
              <p>Ejecuta una simulación para ver los resultados</p>
            </div>
          )}

          {resultado && (
            <div className="space-y-6">
              {/* Score Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-surface-container-low rounded-lg">
                  <p className="text-sm text-secondary/60 mb-1">Score Total</p>
                  <p className="text-3xl font-bold text-secondary">{resultado.scoreTotal}</p>
                </div>
                <div className="text-center p-4 bg-surface-container-low rounded-lg">
                  <p className="text-sm text-secondary/60 mb-1">Nivel de Riesgo</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getNivelRiesgoColor(resultado.nivelRiesgo)}`}>
                    {resultado.nivelRiesgo}
                  </span>
                </div>
              </div>

              {/* Rules Executed */}
              <div>
                <h3 className="text-sm font-semibold text-secondary mb-3">Reglas Activadas</h3>
                <div className="space-y-2">
                  {resultado.reglasEjecutadas.map((regla, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        regla.cumplida ? 'bg-success/5 border border-success/20' : 'bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {regla.cumplida ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-secondary/40" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-secondary">{regla.codigo}</p>
                          <p className="text-xs text-secondary/60">{regla.nombre}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${regla.cumplida ? 'text-success' : 'text-secondary/40'}`}>
                        +{regla.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Actions */}
              {resultado.accionesSugeridas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary mb-2">Acciones Sugeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {resultado.accionesSugeridas.map((accion, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-container/10 text-primary-container text-xs font-bold rounded-full"
                      >
                        {accion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Simulador;
