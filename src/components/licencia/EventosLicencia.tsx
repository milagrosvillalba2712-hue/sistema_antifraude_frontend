import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { licensingLocalApi } from '../../api';

interface Props {
  instalacionId?: string | null;
}

const rowsPorPeriodo = (eventos: Record<string, unknown>[], max = 30): Record<string, unknown>[] =>
  eventos.slice(0, max);

const EventosLicencia = ({ instalacionId }: Props) => {
  const [eventos, setEventos] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instalacionId) return;
    let active = true;
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await licensingLocalApi.eventos(instalacionId);
        if (active) setEventos(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    cargar().catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [instalacionId]);

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: 'Fecha', dataIndex: 'fechaEvento', key: 'fechaEvento', width: 200 },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 140 },
    { title: 'Canal', dataIndex: 'canal', key: 'canal', width: 120 },
    { title: 'Detalle', dataIndex: 'detalle', key: 'detalle' },
  ];

  return (
    <Card title="Eventos De La Licencia" size="small">
      <Table
        rowKey={(record) => String(record.idEvento ?? record.fechaEvento)}
        size="small"
        loading={loading}
        columns={columns}
        dataSource={rowsPorPeriodo(eventos)}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: 'Sin eventos registrados' }}
      />
    </Card>
  );
};

export default EventosLicencia;