import { useEffect, useState } from 'react';
import { Building2, CreditCard, Gauge, ShieldCheck, Users } from 'lucide-react';
import { licensingApi } from '../../api';

const AdminGeneral = () => {
  const [data, setData] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [empresas, planes, suscripciones, pagos, uso, roles, permisos] = await Promise.all([
        licensingApi.empresas(),
        licensingApi.planes(),
        licensingApi.suscripciones(),
        licensingApi.pagos(),
        licensingApi.uso(),
        licensingApi.roles(),
        licensingApi.permisos(),
      ]);
      setData({ empresas, planes, suscripciones, pagos, uso, roles, permisos });
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Empresas', value: data.empresas?.length || 0, icon: Building2 },
    { title: 'Planes', value: data.planes?.length || 0, icon: ShieldCheck },
    { title: 'Suscripciones', value: data.suscripciones?.length || 0, icon: CreditCard },
    { title: 'Pagos', value: data.pagos?.length || 0, icon: CreditCard },
    { title: 'Roles', value: data.roles?.length || 0, icon: Users },
    { title: 'Permisos', value: data.permisos?.length || 0, icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-secondary font-semibold text-2xl">Admin General</h1>
        <p className="text-secondary/60 text-sm mt-1">
          Vista global de clientes, licencias, consumo, roles y permisos de Regula.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(({ title, value, icon: Icon }) => (
          <div key={title} className="bg-white border border-surface-container-highest rounded-lg p-4">
            <Icon className="w-5 h-5 text-primary-container mb-3" />
            <p className="text-xs text-secondary/50">{title}</p>
            <p className="text-2xl font-semibold text-secondary">{loading ? '-' : value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white border border-surface-container-highest rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-container-highest">
          <h2 className="text-sm font-semibold text-secondary">Empresas Suscritas</h2>
          <p className="text-xs text-secondary/50 mt-1">Clientes que contrataron el servicio y su estado operativo.</p>
        </div>
        <SimpleTable rows={data.empresas || []} />
      </section>

      <section className="bg-white border border-surface-container-highest rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-container-highest">
          <h2 className="text-sm font-semibold text-secondary">Consumo Mensual</h2>
          <p className="text-xs text-secondary/50 mt-1">Uso agregado por empresa para validar limites del plan anual.</p>
        </div>
        <SimpleTable rows={data.uso || []} />
      </section>
    </div>
  );
};

const SimpleTable = ({ rows }: { rows: Record<string, unknown>[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <tbody>
        {rows.length === 0 ? (
          <tr><td className="px-5 py-6 text-secondary/50">Sin registros disponibles.</td></tr>
        ) : rows.slice(0, 10).map((row, index) => (
          <tr key={index} className="border-b border-surface-container-highest last:border-b-0">
            {Object.entries(row).slice(0, 6).map(([key, value]) => (
              <td key={key} className="px-5 py-3">
                <p className="text-[10px] uppercase font-bold text-secondary/40">{key}</p>
                <p className="text-secondary">{formatValue(value)}</p>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default AdminGeneral;
