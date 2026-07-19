import { useEffect, useState } from 'react';
import { CreditCard, FileCheck2, Gauge, Users } from 'lucide-react';
import { licensingApi } from '../../api';
import { useAuthStore } from '../../store';

const AdminEmpresa = () => {
  const { user } = useAuthStore();
  const [suscripciones, setSuscripciones] = useState<Record<string, unknown>[]>([]);
  const [pagos, setPagos] = useState<Record<string, unknown>[]>([]);
  const [uso, setUso] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const load = async () => {
      const [suscripcionesData, pagosData, usoData] = await Promise.all([
        licensingApi.suscripciones(user?.empresaId),
        licensingApi.pagos(user?.empresaId),
        licensingApi.uso(user?.empresaId),
      ]);
      setSuscripciones(suscripcionesData);
      setPagos(pagosData);
      setUso(usoData);
    };
    load().catch(() => undefined);
  }, [user?.empresaId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-secondary font-semibold text-2xl">Admin Empresa</h1>
        <p className="text-secondary/60 text-sm mt-1">
          Administra tu suscripcion, pagos, consumo y usuarios habilitados para operar Regula.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric title="Suscripciones" value={suscripciones.length} icon={FileCheck2} />
        <Metric title="Pagos" value={pagos.length} icon={CreditCard} />
        <Metric title="Consumos" value={uso.length} icon={Gauge} />
        <Metric title="Empresa ID" value={user?.empresaId || '-'} icon={Users} />
      </div>

      <Section title="Suscripcion Activa" description="Vigencia anual, plan contratado y estado de renovacion." rows={suscripciones} />
      <Section title="Pagos Realizados" description="Historial financiero de tu empresa hacia Regula." rows={pagos} />
      <Section title="Consumo Del Mes" description="Usuarios, transacciones, alertas, KYC y reportes usados contra el limite del plan." rows={uso} />
    </div>
  );
};

const Metric = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof CreditCard }) => (
  <div className="bg-white border border-surface-container-highest rounded-lg p-4">
    <Icon className="w-5 h-5 text-primary-container mb-3" />
    <p className="text-xs text-secondary/50">{title}</p>
    <p className="text-2xl font-semibold text-secondary">{value}</p>
  </div>
);

const Section = ({ title, description, rows }: { title: string; description: string; rows: Record<string, unknown>[] }) => (
  <section className="bg-white border border-surface-container-highest rounded-lg overflow-hidden">
    <div className="px-5 py-4 border-b border-surface-container-highest">
      <h2 className="text-sm font-semibold text-secondary">{title}</h2>
      <p className="text-xs text-secondary/50 mt-1">{description}</p>
    </div>
    <div className="divide-y divide-surface-container-highest">
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-secondary/50">Sin registros disponibles.</p>
      ) : rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 px-5 py-4">
          {Object.entries(row).slice(0, 8).map(([key, value]) => (
            <div key={key}>
              <p className="text-[10px] uppercase font-bold text-secondary/40">{key}</p>
              <p className="text-sm text-secondary truncate">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

export default AdminEmpresa;
