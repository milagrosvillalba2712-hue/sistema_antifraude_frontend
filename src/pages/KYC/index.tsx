import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Consulta KYC</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identificador del Documento
            </label>
            <input
              {...register('identificadorDocumento')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese número de documento"
            />
            {errors.identificadorDocumento && (
              <p className="mt-1 text-sm text-red-600">
                {errors.identificadorDocumento.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Resultado de la Consulta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Identificador Documento</p>
              <p className="text-lg font-semibold">{result.identificadorDocumento}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Tipo de Consulta</p>
              <p className="text-lg font-semibold">{result.tipoConsulta}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Resultado</p>
              <div className="flex items-center mt-1">
                {result.resultado ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-semibold">Positivo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700 font-semibold">Negativo</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Mensaje</p>
              <p className="text-lg">{result.mensaje}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Nota:</strong> Los datos se consultan en tiempo real desde el backend.
          No se almacenan localmente.
        </p>
      </div>
    </div>
  );
};

export default KYC;
