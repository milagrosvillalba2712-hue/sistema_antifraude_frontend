import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { kycApi } from '../../api';
import { kycSchema, type KycFormData } from '../../utils';
import type { KycResponse } from '../../types';

const KYC = () => {
  const [result, setResult] = useState<KycResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  });

  const onSubmit = async (data: KycFormData) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const response = await kycApi.consultar(data.identificadorDocumento);
      setResult(response);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Error al consultar KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-gutter">
      <h1 className="text-secondary font-semibold text-2xl">Consulta KYC</h1>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">
              Identificador del Documento
            </label>
            <input
              {...register('identificadorDocumento')}
              type="text"
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
              placeholder="Ingrese número de documento"
            />
            {errors.identificadorDocumento && (
              <p className="mt-1 text-sm text-error">
                {errors.identificadorDocumento.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center font-bold text-sm transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Consultar
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container/30 border border-error-container rounded-xl p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-error mr-2" />
            <p className="text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
          <h2 className="text-secondary font-semibold text-lg mb-4">Resultado de la Consulta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-sm text-secondary/60">Identificador Documento</p>
              <p className="text-lg font-semibold text-secondary mt-1">{result.identificadorDocumento}</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-sm text-secondary/60">Tipo de Consulta</p>
              <p className="text-lg font-semibold text-secondary mt-1">{result.tipoConsulta}</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-sm text-secondary/60">Resultado</p>
              <div className="flex items-center mt-2">
                {result.resultado ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-success mr-2" />
                    <span className="text-success font-bold">Positivo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-critical mr-2" />
                    <span className="text-critical font-bold">Negativo</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-sm text-secondary/60">Mensaje</p>
              <p className="text-lg text-secondary mt-1">{result.mensaje}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-tertiary mt-0.5 mr-2" />
          <p className="text-sm text-secondary">
            <strong>Nota:</strong> Los datos se consultan en tiempo real desde el backend.
            No se almacenan localmente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KYC;
