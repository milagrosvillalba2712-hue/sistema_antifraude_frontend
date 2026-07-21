import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ruleEngineApi, rulesApi, simuladorApi } from '../../api';
import { ActionDropdown, useConfirmAction } from '../../components/common';
import type {
  CondicionRegla,
  EntityFieldSchema,
  EntityRecord,
  EntitySchema,
  EntitySummary,
  EstadoRegla,
  ReglaRiesgo,
  RuleFactDefinition,
  SeveridadRegla,
  SimuladorResponse,
} from '../../types';

type Tab = 'reglas' | 'entidades' | 'constructor' | 'simulador';
type FormMode = 'create' | 'edit' | 'detail';
type RuleFormMode = 'edit' | 'detail';
type SelectOption = [string, string];
type RelationOptions = Record<string, SelectOption[]>;
type SimForm = {
  productoCodigo: string;
  canalCodigo: string;
  monedaCodigo: string;
  monto: number;
  paisOrigenCodigo: string;
  paisDestinoCodigo: string;
  documentoCliente: string;
  fechaHora: string;
};
type RuleDraft = {
  escenarioId: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  severidad: SeveridadRegla;
  prioridad: number;
  score: number;
  estado: EstadoRegla;
  accion: string;
};

const fallbackFacts: RuleFactDefinition[] = [
  { fact: 'monto', etiqueta: 'Monto de la transaccion', tipo: 'NUMERICO', catalogo: null, operadores: ['>', '>=', '<', '<=', 'between'] },
  { fact: 'moneda', etiqueta: 'Moneda', tipo: 'CATALOGO', catalogo: 'moneda', operadores: ['==', '!=', 'in'] },
  { fact: 'canal', etiqueta: 'Canal utilizado', tipo: 'CATALOGO', catalogo: 'canal', operadores: ['==', '!=', 'in'] },
  { fact: 'paisOrigen', etiqueta: 'País de origen', tipo: 'CATALOGO', catalogo: 'pais', operadores: ['==', '!=', 'in'] },
  { fact: 'paisDestino', etiqueta: 'País de destino', tipo: 'CATALOGO', catalogo: 'pais', operadores: ['==', '!=', 'in'] },
  { fact: 'pep', etiqueta: 'Cliente PEP', tipo: 'BOOLEANO', catalogo: null, operadores: ['exists', '=='] },
  { fact: 'observado', etiqueta: 'Cliente observado', tipo: 'BOOLEANO', catalogo: null, operadores: ['exists', '=='] },
  { fact: 'listas', etiqueta: 'Listas regulatorias', tipo: 'EXISTENCIA', catalogo: null, operadores: ['exists', '=='] },
];

const operatorLabels: Record<CondicionRegla['operador'], string> = {
  '==': 'Es igual a',
  '!=': 'Es distinto de',
  '>': 'Es mayor que',
  '>=': 'Es mayor o igual que',
  '<': 'Es menor que',
  '<=': 'Es menor o igual que',
  in: 'Esta dentro de una lista',
  between: 'Esta entre dos valores',
  exists: 'Existe o esta informado',
};

const sectionDescriptions: Record<Tab, string> = {
  reglas: 'Consulta, filtra y administra reglas activas, inactivas o en borrador.',
  entidades: 'Gestiona entidades y catálogos que alimentan reglas, escenarios, acciones y controles.',
  constructor: 'Crea reglas guiadas seleccionando datos, operadores entendibles y valores dinamicos.',
  simulador: 'Prueba una transaccion contra reglas activas para validar score, nivel y acciones sugeridas.',
};

const entityDescriptions: Record<string, string> = {
  accion: 'Acciones sugeridas o ejecutables por el motor de reglas.',
  escenario: 'Agrupa reglas por contexto antifraude.',
  pais: 'Catalogo de paises usado por transacciones, KYC y reglas.',
  moneda: 'Catalogo de monedas usadas en transacciones y controles.',
  canal: 'Canales de operacion como web, movil, sucursal o API.',
  producto: 'Productos financieros evaluados por el sistema.',
  tipo_documento: 'Tipos de documento para KYC y personas.',
  nivel_riesgo: 'Niveles de riesgo para clasificar operaciones o clientes.',
};

const hiddenOnCreate = new Set(['id', 'fechaCreacion', 'fechaModificacion', 'createdAt', 'updatedAt']);

const RuleEngine = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reglas');
  const [rules, setRules] = useState<ReglaRiesgo[]>([]);
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('pais');
  const [schema, setSchema] = useState<EntitySchema | null>(null);
  const [rows, setRows] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [relationOptions, setRelationOptions] = useState<RelationOptions>({});
  const [factDefinitions, setFactDefinitions] = useState<RuleFactDefinition[]>(fallbackFacts);
  const [factValueOptions, setFactValueOptions] = useState<RelationOptions>({});
  const [entitySearch, setEntitySearch] = useState('');
  const [rowSearch, setRowSearch] = useState('');
  const [rowFieldFilter, setRowFieldFilter] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleEstado, setRuleEstado] = useState<EstadoRegla | ''>('');
  const [ruleSeveridad, setRuleSeveridad] = useState<SeveridadRegla | ''>('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formData, setFormData] = useState<EntityRecord>({});
  const [ruleDrawerMode, setRuleDrawerMode] = useState<RuleFormMode | null>(null);
  const [selectedRule, setSelectedRule] = useState<ReglaRiesgo | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [ruleDraftConditions, setRuleDraftConditions] = useState<CondicionRegla[]>([]);
  const [condiciones, setCondiciones] = useState<CondicionRegla[]>([{ fact: 'monto', operador: '>', valor: 10000 }]);
  const [ruleForm, setRuleForm] = useState<RuleDraft>({
    escenarioId: 0,
    codigo: '',
    nombre: '',
    descripcion: '',
    severidad: 'MEDIA',
    prioridad: 1,
    score: 30,
    estado: 'BORRADOR',
    accion: 'REVISION_MANUAL',
  });
  const [simForm, setSimForm] = useState<SimForm>({
    productoCodigo: 'TRANSFERENCIA',
    canalCodigo: 'WEB',
    monedaCodigo: 'USD',
    monto: 15000,
    paisOrigenCodigo: 'PY',
    paisDestinoCodigo: 'US',
    documentoCliente: '12345678',
    fechaHora: new Date().toISOString().slice(0, 16),
  });
  const [simResult, setSimResult] = useState<SimuladorResponse | null>(null);
  const { confirm, confirmationModal } = useConfirmAction();

  const loadOptionsFor = async (entityKeys: string[]) => {
    const missing = Array.from(new Set(entityKeys.filter(Boolean))).filter((key) => !relationOptions[key]);
    if (!missing.length) return;
    const loaded = await Promise.all(missing.map(async (key) => {
      try {
        const items = await ruleEngineApi.getEntityRows(key);
        return [key, items.map((item) => [key === 'accion' ? String(item.codigo ?? item.id) : String(item.id), optionLabel(item)] as SelectOption)] as const;
      } catch {
        return [key, []] as const;
      }
    }));
    setRelationOptions((current) => ({ ...current, ...Object.fromEntries(loaded) }));
  };

  const loadFactValueOptions = async (definitions: RuleFactDefinition[]) => {
    const catalogs = Array.from(new Set(definitions.map((fact) => fact.catalogo).filter(Boolean))) as string[];
    const entries = await Promise.all(catalogs.map(async (catalog) => {
      try {
        const items = await ruleEngineApi.getEntityRows(catalog);
        return [catalog, items.map((item) => [catalogValue(item), optionLabel(item)] as SelectOption)] as const;
      } catch {
        return [catalog, []] as const;
      }
    }));
    setFactValueOptions(Object.fromEntries(entries));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ruleData, entityData, factData] = await Promise.all([
        rulesApi.getAll(),
        ruleEngineApi.getEntities(),
        ruleEngineApi.getFacts().catch(() => fallbackFacts),
      ]);
      const facts = factData.length ? factData : fallbackFacts;
      setRules(ruleData);
      setEntities(entityData);
      setFactDefinitions(facts);
      await loadOptionsFor(['escenario', 'accion']);
      await loadFactValueOptions(facts);
      if (!entityData.some((item) => item.key === selectedEntity || item.table === selectedEntity) && entityData[0]) {
        setSelectedEntity(entityData[0].key);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEntity = async (entity = selectedEntity) => {
    if (!entity) return;
    const [schemaData, rowData] = await Promise.all([
      ruleEngineApi.getEntitySchema(entity),
      ruleEngineApi.getEntityRows(entity),
    ]);
    setSchema(schemaData);
    setRows(rowData);
    await loadOptionsFor(schemaData.fields.filter((field) => field.relation && field.relationType).map((field) => field.relationType as string));
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadEntity();
  }, [selectedEntity]);

  const filteredRules = useMemo(() => rules.filter((rule) => {
    const query = ruleSearch.toLowerCase();
    const matchesText = !query || [rule.codigo, rule.nombre, rule.descripcion, rule.condicion, rule.escenarioNombre].some((value) => String(value ?? '').toLowerCase().includes(query));
    return matchesText && (!ruleEstado || rule.estado === ruleEstado) && (!ruleSeveridad || rule.severidad === ruleSeveridad);
  }), [ruleEstado, ruleSearch, ruleSeveridad, rules]);

  const filteredEntities = useMemo(() => {
    const query = entitySearch.toLowerCase();
    return entities.filter((entity) => entity.table.toLowerCase().includes(query) || entity.key.toLowerCase().includes(query));
  }, [entities, entitySearch]);

  const visibleRows = useMemo(() => {
    const query = rowSearch.toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      if (rowFieldFilter) return String(row[rowFieldFilter] ?? '').toLowerCase().includes(query);
      return JSON.stringify(row).toLowerCase().includes(query);
    });
  }, [rowFieldFilter, rowSearch, rows]);

  const rowFilterFields = useMemo(() => Array.from(new Set(rows.slice(0, 50).flatMap((row) => Object.keys(row)))), [rows]);
  const factOptions = factDefinitions.map((fact) => [fact.fact, fact.etiqueta] as SelectOption);
  const preview = useMemo(() => {
    const readable = condiciones.map((condition) => {
      const fact = factDefinitions.find((definition) => definition.fact === condition.fact);
      return `${fact?.etiqueta || titleize(condition.fact)} ${operatorLabels[condition.operador]} ${formatValue(condition.valor)}`;
    }).join(' y ');
    return `Si ${readable}, sumar ${ruleForm.score} puntos y sugerir ${ruleForm.accion}.`;
  }, [condiciones, factDefinitions, ruleForm.accion, ruleForm.score]);

  const saveEntity = async () => {
    if (!schema || !formMode || formMode === 'detail') return;
    confirm({
      title: formMode === 'create' ? 'Confirmar Creación' : 'Confirmar Edición',
      description: formMode === 'create' ? `Se creara un registro en ${schema.table}.` : `Se actualizara el registro #${String(formData.id)} de ${schema.table}.`,
      detail: 'Esta accion quedara registrada en auditoria.',
      confirmLabel: formMode === 'create' ? 'Crear' : 'Guardar',
      action: async () => {
        setSaving(true);
        try {
          const payload = normalizePayload(formData, schema.fields);
          if (formMode === 'create') await ruleEngineApi.createEntity(schema.key, payload);
          else await ruleEngineApi.updateEntity(schema.key, Number(formData.id), payload);
          setNotice(formMode === 'create' ? 'Registro creado. El ID fue asignado automaticamente.' : 'Registro actualizado.');
          setFormMode(null);
          await Promise.all([loadAll(), loadEntity(schema.key)]);
        } catch (error) {
          console.error(error);
          setNotice('No se pudo guardar. Revisa campos requeridos, relaciones y valores enum.');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const deleteEntity = (row: EntityRecord) => {
    if (!schema) return;
    confirm({
      title: 'Confirmar Eliminación',
      description: `Se eliminara el registro #${String(row.id)} de ${schema.table}.`,
      detail: 'Esta accion puede fallar si el registro tiene relaciones.',
      confirmLabel: 'Eliminar',
      variant: 'critical',
      action: async () => {
        await ruleEngineApi.deleteEntity(schema.key, Number(row.id));
        setNotice('Registro eliminado.');
        await Promise.all([loadAll(), loadEntity(schema.key)]);
      },
    });
  };

  const saveRule = () => {
    confirm({
      title: 'Confirmar Creación de Regla',
      description: `Se creara la regla ${ruleForm.nombre || ruleForm.codigo}.`,
      detail: preview,
      confirmLabel: 'Crear regla',
      action: async () => {
        setSaving(true);
        try {
          await rulesApi.create({
            ...ruleForm,
            condiciones: { combinador: 'ALL', items: condiciones },
            acciones: [{ codigo: ruleForm.accion, descripcion: ruleForm.accion.replaceAll('_', ' ') }],
          });
          setNotice('Regla creada correctamente.');
          setActiveTab('reglas');
          await loadAll();
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const toggleRule = (rule: ReglaRiesgo) => {
    const activating = rule.estado !== 'ACTIVA';
    confirm({
      title: activating ? 'Confirmar Activación' : 'Confirmar Desactivación',
      description: `${activating ? 'Se activara' : 'Se desactivara'} la regla ${rule.nombre}.`,
      detail: `Codigo: ${rule.codigo}. Version: ${rule.version}.`,
      confirmLabel: activating ? 'Activar' : 'Desactivar',
      variant: activating ? 'normal' : 'warning',
      action: async () => {
        if (activating) await rulesApi.activar(rule.id);
        else await rulesApi.desactivar(rule.id);
        await loadAll();
      },
    });
  };

  const openRuleDrawer = (mode: RuleFormMode, rule: ReglaRiesgo) => {
    setSelectedRule(rule);
    setRuleDrawerMode(mode);
    setRuleDraft(toRuleDraft(rule));
    setRuleDraftConditions(parseRuleConditions(rule));
  };

  const saveRuleDraft = () => {
    if (!selectedRule || !ruleDraft || ruleDrawerMode !== 'edit') return;
    confirm({
      title: 'Confirmar Edición de Regla',
      description: `Se actualizaran los datos de la regla ${selectedRule.nombre}.`,
      detail: `Codigo: ${selectedRule.codigo}. Version actual: ${selectedRule.version}.`,
      confirmLabel: 'Guardar cambios',
      action: async () => {
        setSaving(true);
        try {
          await rulesApi.update(selectedRule.id, {
            ...ruleDraft,
            condiciones: { combinador: 'ALL', items: ruleDraftConditions },
            acciones: [{ codigo: ruleDraft.accion, descripcion: ruleDraft.accion.replaceAll('_', ' ') }],
          });
          setNotice('Regla actualizada correctamente.');
          setRuleDrawerMode(null);
          await loadAll();
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const runSimulation = async () => {
    setSaving(true);
    try {
      setSimResult(await simuladorApi.evaluar(simForm));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card><Spin /> Cargando motor de reglas...</Card>;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="end" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>Motor De Reglas</Typography.Title>
          <Typography.Text type="secondary">Gestiona reglas, entidades, catálogos y simulaciones desde una pantalla central.</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadAll}>Actualizar</Button>
      </Space>

      {notice && <Alert type="info" showIcon closable message={notice} onClose={() => setNotice(null)} />}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as Tab)}
        items={[
          { key: 'reglas', label: 'Reglas', children: <RulesPanel rules={filteredRules} search={ruleSearch} estado={ruleEstado} severidad={ruleSeveridad} setSearch={setRuleSearch} setEstado={setRuleEstado} setSeveridad={setRuleSeveridad} openRuleDrawer={openRuleDrawer} toggleRule={toggleRule} /> },
          { key: 'entidades', label: 'Entidades y Catálogos', children: <EntitiesPanel entities={filteredEntities} selectedEntity={selectedEntity} setSelectedEntity={setSelectedEntity} entitySearch={entitySearch} setEntitySearch={setEntitySearch} schema={schema} rows={visibleRows} rowSearch={rowSearch} setRowSearch={setRowSearch} rowFieldFilter={rowFieldFilter} setRowFieldFilter={setRowFieldFilter} rowFilterFields={rowFilterFields} openForm={(mode, row) => { setFormMode(mode); setFormData(mode === 'create' ? {} : row || {}); }} deleteEntity={deleteEntity} saving={saving} /> },
          { key: 'constructor', label: 'Constructor', children: <ConstructorPanel ruleForm={ruleForm} setRuleForm={setRuleForm} condiciones={condiciones} setCondiciones={setCondiciones} factOptions={factOptions} factDefinitions={factDefinitions} factValueOptions={factValueOptions} relationOptions={relationOptions} preview={preview} saveRule={saveRule} saving={saving} /> },
          { key: 'simulador', label: 'Simulador', children: <SimulatorPanel simForm={simForm} setSimForm={setSimForm} runSimulation={runSimulation} saving={saving} simResult={simResult} /> },
        ].map((item) => ({ ...item, children: <Space direction="vertical" size="middle" style={{ width: '100%' }}><Alert type="info" showIcon message={sectionDescriptions[item.key as Tab]} />{item.children}</Space> }))}
      />

      {schema && formMode && (
        <EntityDrawer
          schema={schema}
          mode={formMode}
          data={formData}
          setData={setFormData}
          close={() => setFormMode(null)}
          save={saveEntity}
          saving={saving}
          relationOptions={relationOptions}
        />
      )}
      {selectedRule && ruleDrawerMode && ruleDraft && (
        <RuleDrawer
          rule={selectedRule}
          mode={ruleDrawerMode}
          draft={ruleDraft}
          setDraft={setRuleDraft}
          conditions={ruleDraftConditions}
          setConditions={setRuleDraftConditions}
          factOptions={factOptions}
          factDefinitions={factDefinitions}
          factValueOptions={factValueOptions}
          relationOptions={relationOptions}
          close={() => setRuleDrawerMode(null)}
          save={saveRuleDraft}
          saving={saving}
        />
      )}
      {confirmationModal}
    </Space>
  );
};

const RulesPanel = ({ rules, search, estado, severidad, setSearch, setEstado, setSeveridad, openRuleDrawer, toggleRule }: {
  rules: ReglaRiesgo[];
  search: string;
  estado: EstadoRegla | '';
  severidad: SeveridadRegla | '';
  setSearch: (value: string) => void;
  setEstado: (value: EstadoRegla | '') => void;
  setSeveridad: (value: SeveridadRegla | '') => void;
  openRuleDrawer: (mode: RuleFormMode, rule: ReglaRiesgo) => void;
  toggleRule: (rule: ReglaRiesgo) => void;
}) => {
  const columns: ColumnsType<ReglaRiesgo> = [
    { title: 'Codigo', dataIndex: 'codigo', render: (value, rule) => <Space direction="vertical" size={0}><Typography.Text code>{value}</Typography.Text><Typography.Text type="secondary">v{rule.version}</Typography.Text></Space> },
    { title: 'Nombre', dataIndex: 'nombre', render: (value, rule) => <Space direction="vertical" size={0}><Typography.Text strong>{value}</Typography.Text><Typography.Text type="secondary">{rule.escenarioNombre || 'Sin escenario'}</Typography.Text></Space> },
    { title: 'Severidad', dataIndex: 'severidad', render: (value) => <Tag color={severityColor(value)}>{value}</Tag> },
    { title: 'Score', dataIndex: 'score' },
    { title: 'Estado', dataIndex: 'estado', render: (value) => <Tag color={value === 'ACTIVA' ? 'green' : value === 'INACTIVA' ? 'default' : 'blue'}>{titleize(value)}</Tag> },
    { title: 'Condición', dataIndex: 'condicion', ellipsis: true },
    {
      title: 'Acciones',
      align: 'right',
      render: (_, rule) => (
        <ActionDropdown
          items={[
            { key: 'view', label: 'Ver Detalle', icon: <EyeOutlined />, onClick: () => openRuleDrawer('detail', rule) },
            { key: 'edit', label: 'Editar', icon: <EditOutlined />, onClick: () => openRuleDrawer('edit', rule) },
            {
              key: 'toggle',
              label: rule.estado === 'ACTIVA' ? 'Desactivar' : 'Activar',
              icon: <PoweroffOutlined />,
              danger: rule.estado === 'ACTIVA',
              onClick: () => toggleRule(rule),
            },
          ]}
        />
      ),
    },
  ];
  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Input.Search allowClear placeholder="Buscar regla" value={search} onChange={(event) => setSearch(event.target.value)} style={{ width: 280 }} />
          <Select allowClear placeholder="Estado" value={estado || undefined} onChange={(value) => setEstado(value || '')} style={{ width: 180 }} options={['ACTIVA', 'INACTIVA', 'EN_PRUEBA', 'BORRADOR'].map((value) => ({ value, label: titleize(value) }))} />
          <Select allowClear placeholder="Severidad" value={severidad || undefined} onChange={(value) => setSeveridad(value || '')} style={{ width: 180 }} options={['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map((value) => ({ value, label: titleize(value) }))} />
        </Space>
        <Table rowKey="id" columns={columns} dataSource={rules} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: true }} />
      </Space>
    </Card>
  );
};

const EntitiesPanel = ({ entities, selectedEntity, setSelectedEntity, entitySearch, setEntitySearch, schema, rows, rowSearch, setRowSearch, rowFieldFilter, setRowFieldFilter, rowFilterFields, openForm, deleteEntity, saving }: {
  entities: EntitySummary[];
  selectedEntity: string;
  setSelectedEntity: (value: string) => void;
  entitySearch: string;
  setEntitySearch: (value: string) => void;
  schema: EntitySchema | null;
  rows: EntityRecord[];
  rowSearch: string;
  setRowSearch: (value: string) => void;
  rowFieldFilter: string;
  setRowFieldFilter: (value: string) => void;
  rowFilterFields: string[];
  openForm: (mode: FormMode, row?: EntityRecord) => void;
  deleteEntity: (row: EntityRecord) => void;
  saving: boolean;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 16 }}>
    <Card title="Entidades">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search allowClear placeholder="Buscar entidad" value={entitySearch} onChange={(event) => setEntitySearch(event.target.value)} />
        <Select
          value={selectedEntity}
          onChange={setSelectedEntity}
          style={{ width: '100%' }}
          options={entities.map((entity) => ({ value: entity.key, label: `${titleize(entity.table)} (${entity.count})` }))}
        />
        <Typography.Text type="secondary">{entityDescriptions[selectedEntity] || 'Entidad disponible para consulta o mantenimiento desde el motor de reglas.'}</Typography.Text>
      </Space>
    </Card>
    <Card
      title={schema ? titleize(schema.table) : 'Registros'}
      extra={schema?.editable && <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm('create')}>Nuevo Registro</Button>}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Input.Search allowClear placeholder="Buscar registro" value={rowSearch} onChange={(event) => setRowSearch(event.target.value)} style={{ width: 280 }} />
          <Select allowClear placeholder="Campo" value={rowFieldFilter || undefined} onChange={(value) => setRowFieldFilter(value || '')} style={{ width: 220 }} options={rowFilterFields.map((field) => ({ value: field, label: titleize(field) }))} />
        </Space>
        <EntityTable rows={rows} schema={schema} openForm={openForm} deleteEntity={deleteEntity} saving={saving} />
      </Space>
    </Card>
  </div>
);

const EntityTable = ({ rows, schema, openForm, deleteEntity, saving }: {
  rows: EntityRecord[];
  schema: EntitySchema | null;
  openForm: (mode: FormMode, row?: EntityRecord) => void;
  deleteEntity: (row: EntityRecord) => void;
  saving: boolean;
}) => {
  const columns: ColumnsType<EntityRecord> = useMemo(() => {
    const names = Array.from(new Set(rows.slice(0, 20).flatMap((row) => Object.keys(row)))).slice(0, 8);
    return [
      ...names.map((name) => ({ title: titleize(name), dataIndex: name, ellipsis: true, render: renderCell })),
      {
        title: 'Acciones',
        key: 'actions',
        align: 'right' as const,
        render: (_: unknown, row: EntityRecord) => (
          <ActionDropdown
            items={[
              { key: 'view', label: 'Ver Detalle', icon: <EyeOutlined />, onClick: () => openForm('detail', row) },
              { key: 'edit', label: 'Editar', icon: <EditOutlined />, disabled: !schema?.editable, onClick: () => openForm('edit', row) },
              { key: 'delete', label: 'Eliminar', icon: <DeleteOutlined />, danger: true, disabled: !schema?.editable || saving, onClick: () => deleteEntity(row) },
            ]}
          />
        ),
      },
    ];
  }, [deleteEntity, openForm, rows, saving, schema?.editable]);
  return <Table rowKey={(row, index) => String(row.id ?? index)} columns={columns} dataSource={rows} locale={{ emptyText: <Empty description="No hay registros cargados" /> }} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: true }} />;
};

const ConstructorPanel = ({ ruleForm, setRuleForm, condiciones, setCondiciones, factOptions, factDefinitions, factValueOptions, relationOptions, preview, saveRule, saving }: {
  ruleForm: RuleDraft;
  setRuleForm: (value: RuleDraft) => void;
  condiciones: CondicionRegla[];
  setCondiciones: (value: CondicionRegla[]) => void;
  factOptions: SelectOption[];
  factDefinitions: RuleFactDefinition[];
  factValueOptions: RelationOptions;
  relationOptions: RelationOptions;
  preview: string;
  saveRule: () => void;
  saving: boolean;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 16 }}>
    <Card title="Datos De La Regla">
      <Form layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Form.Item label="Escenario"><Select value={ruleForm.escenarioId || undefined} onChange={(value) => setRuleForm({ ...ruleForm, escenarioId: Number(value) })} options={(relationOptions.escenario || []).map(([value, label]) => ({ value: Number(value), label }))} placeholder="Selecciona escenario" /></Form.Item>
          <Form.Item label="Codigo"><Input value={ruleForm.codigo} onChange={(event) => setRuleForm({ ...ruleForm, codigo: event.target.value })} placeholder="Ej. AML_MONTO_ALTO" /></Form.Item>
          <Form.Item label="Nombre"><Input value={ruleForm.nombre} onChange={(event) => setRuleForm({ ...ruleForm, nombre: event.target.value })} placeholder="Nombre descriptivo" /></Form.Item>
          <Form.Item label="Severidad"><Select value={ruleForm.severidad} onChange={(value) => setRuleForm({ ...ruleForm, severidad: value })} options={severityOptions()} /></Form.Item>
          <Form.Item label="Prioridad"><InputNumber min={1} value={ruleForm.prioridad} onChange={(value) => setRuleForm({ ...ruleForm, prioridad: Number(value || 1) })} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Score"><InputNumber min={0} value={ruleForm.score} onChange={(value) => setRuleForm({ ...ruleForm, score: Number(value || 0) })} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Estado"><Select value={ruleForm.estado} onChange={(value) => setRuleForm({ ...ruleForm, estado: value })} options={stateOptions()} /></Form.Item>
          <Form.Item label="Acción"><Select value={ruleForm.accion} onChange={(value) => setRuleForm({ ...ruleForm, accion: value })} options={(relationOptions.accion || []).map(([value, label]) => ({ value, label }))} /></Form.Item>
        </div>
        <Form.Item label="Descripción"><Input.TextArea rows={3} value={ruleForm.descripcion} onChange={(event) => setRuleForm({ ...ruleForm, descripcion: event.target.value })} placeholder="Explica cuándo se aplica la regla" /></Form.Item>
      </Form>
      <Typography.Title level={5}>Condiciones</Typography.Title>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {condiciones.map((condition, index) => (
          <Card key={index} size="small">
            <ConditionFields condition={condition} factOptions={factOptions} factDefinitions={factDefinitions} factValueOptions={factValueOptions} onChange={(patch) => setCondiciones(updateConditionSmart(condiciones, index, patch, factDefinitions))} />
            <Button danger style={{ marginTop: 12 }} onClick={() => setCondiciones(condiciones.filter((_, current) => current !== index))}>Quitar Condición</Button>
          </Card>
        ))}
        <Button icon={<PlusOutlined />} onClick={() => setCondiciones([...condiciones, { fact: 'canal', operador: '==', valor: '' }])}>Agregar Condición</Button>
      </Space>
    </Card>
    <Card title="Vista Previa">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert type="success" showIcon message={preview} />
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveRule} block>Guardar Regla</Button>
      </Space>
    </Card>
  </div>
);

const ConditionFields = ({ condition, factOptions, factDefinitions, factValueOptions, onChange }: {
  condition: CondicionRegla;
  factOptions: SelectOption[];
  factDefinitions: RuleFactDefinition[];
  factValueOptions: RelationOptions;
  onChange: (patch: Partial<CondicionRegla>) => void;
}) => {
  const definition = factDefinitions.find((fact) => fact.fact === condition.fact) || fallbackFacts[0];
  const valueOptions = definition.catalogo ? factValueOptions[definition.catalogo] || [] : [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      <Form.Item label="Dato"><Select value={condition.fact} onChange={(value) => onChange({ fact: value })} options={factOptions.map(([value, label]) => ({ value, label }))} /></Form.Item>
      <Form.Item label="Operador"><Select value={condition.operador} onChange={(value) => onChange({ operador: value })} options={definition.operadores.map((operator) => ({ value: operator, label: operatorLabels[operator] }))} /></Form.Item>
      <Form.Item label="Valor">
        {definition.tipo === 'CATALOGO' && valueOptions.length ? (
          <Select value={String(condition.valor ?? '')} onChange={(value) => onChange({ valor: value })} options={valueOptions.map(([value, label]) => ({ value, label }))} />
        ) : definition.tipo === 'BOOLEANO' || definition.tipo === 'EXISTENCIA' ? (
          <Select value={String(condition.valor ?? true)} onChange={(value) => onChange({ valor: value === 'true' })} options={[{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]} />
        ) : (
          <Input value={Array.isArray(condition.valor) ? condition.valor.join(',') : String(condition.valor ?? '')} onChange={(event) => onChange({ valor: parseValue(event.target.value) })} placeholder={condition.operador === 'between' ? '10000,20000' : '10000'} />
        )}
      </Form.Item>
    </div>
  );
};

const EntityDrawer = ({ schema, mode, data, setData, close, save, saving, relationOptions }: {
  schema: EntitySchema;
  mode: FormMode;
  data: EntityRecord;
  setData: (data: EntityRecord) => void;
  close: () => void;
  save: () => void;
  saving: boolean;
  relationOptions: RelationOptions;
}) => {
  const readonly = mode === 'detail';
  const fields = schema.fields.filter((field) => field.editable && !hiddenOnCreate.has(field.name));
  return (
    <Drawer open onClose={close} title={mode === 'create' ? 'Nuevo Registro' : mode === 'edit' ? 'Editar Registro' : 'Detalle Del Registro'} width={560} extra={!readonly && <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>Guardar</Button>}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {mode !== 'create' && <Descriptions size="small" bordered items={[{ key: 'id', label: 'ID', children: String(data.id ?? '-') }]} />}
        {fields.map((field) => <DynamicField key={field.name} field={field} readonly={readonly} value={field.relation ? relationId(data[field.name]) ?? data[`${field.name}Id`] : data[field.name]} onChange={(value) => setData({ ...data, [field.relation ? `${field.name}Id` : field.name]: value })} options={field.relation && field.relationType ? relationOptions[field.relationType] || [] : []} />)}
      </Space>
    </Drawer>
  );
};

const DynamicField = ({ field, value, readonly, onChange, options }: { field: EntityFieldSchema; value: unknown; readonly: boolean; onChange: (value: string | number | boolean) => void; options: SelectOption[] }) => {
  const label = field.relation ? `${titleize(field.name)} ID` : titleize(field.name);
  if (readonly) return <Descriptions bordered size="small" items={[{ key: field.name, label, children: renderCell(value) }]} />;
  if (field.relation && options.length) return <Form.Item label={label}><Select value={value == null ? undefined : String(value)} onChange={onChange} options={options.map(([optionValue, labelValue]) => ({ value: optionValue, label: labelValue }))} placeholder="Selecciona una opcion" /></Form.Item>;
  if (field.type.includes('Boolean')) return <Form.Item label={label}><Select value={String(value ?? false)} onChange={(next) => onChange(next === 'true')} options={[{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]} /></Form.Item>;
  if (isNumericField(field)) return <Form.Item label={label}><InputNumber value={value == null ? undefined : Number(value)} onChange={(next) => onChange(Number(next || 0))} style={{ width: '100%' }} /></Form.Item>;
  return <Form.Item label={label}><Input value={value == null ? '' : String(value)} onChange={(event) => onChange(event.target.value)} placeholder={`Ingresa ${label.toLowerCase()}`} /></Form.Item>;
};

const RuleDrawer = ({ rule, mode, draft, setDraft, conditions, setConditions, factOptions, factDefinitions, factValueOptions, relationOptions, close, save, saving }: {
  rule: ReglaRiesgo;
  mode: RuleFormMode;
  draft: RuleDraft;
  setDraft: (value: RuleDraft) => void;
  conditions: CondicionRegla[];
  setConditions: (value: CondicionRegla[]) => void;
  factOptions: SelectOption[];
  factDefinitions: RuleFactDefinition[];
  factValueOptions: RelationOptions;
  relationOptions: RelationOptions;
  close: () => void;
  save: () => void;
  saving: boolean;
}) => {
  const readonly = mode === 'detail';
  return (
    <Drawer open onClose={close} title={readonly ? 'Detalle De La Regla' : 'Editar Regla'} width={680} extra={!readonly && <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>Guardar</Button>}>
      {readonly ? (
        <Descriptions bordered column={1} items={Object.entries(rule).map(([key, value]) => ({ key, label: titleize(key), children: renderCell(value) }))} />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Form layout="vertical">
            <Form.Item label="Escenario"><Select value={draft.escenarioId || undefined} onChange={(value) => setDraft({ ...draft, escenarioId: Number(value) })} options={(relationOptions.escenario || []).map(([value, label]) => ({ value: Number(value), label }))} /></Form.Item>
            <Form.Item label="Codigo"><Input value={draft.codigo} onChange={(event) => setDraft({ ...draft, codigo: event.target.value })} /></Form.Item>
            <Form.Item label="Nombre"><Input value={draft.nombre} onChange={(event) => setDraft({ ...draft, nombre: event.target.value })} /></Form.Item>
            <Form.Item label="Descripción"><Input.TextArea rows={3} value={draft.descripcion} onChange={(event) => setDraft({ ...draft, descripcion: event.target.value })} /></Form.Item>
            <Form.Item label="Severidad"><Select value={draft.severidad} onChange={(value) => setDraft({ ...draft, severidad: value })} options={severityOptions()} /></Form.Item>
            <Form.Item label="Score"><InputNumber value={draft.score} min={0} onChange={(value) => setDraft({ ...draft, score: Number(value || 0) })} style={{ width: '100%' }} /></Form.Item>
            <Form.Item label="Estado"><Select value={draft.estado} onChange={(value) => setDraft({ ...draft, estado: value })} options={stateOptions()} /></Form.Item>
          </Form>
          {conditions.map((condition, index) => (
            <Card key={index} size="small">
              <ConditionFields condition={condition} factOptions={factOptions} factDefinitions={factDefinitions} factValueOptions={factValueOptions} onChange={(patch) => setConditions(updateConditionSmart(conditions, index, patch, factDefinitions))} />
              <Button danger onClick={() => setConditions(conditions.filter((_, current) => current !== index))}>Quitar Condición</Button>
            </Card>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => setConditions([...conditions, { fact: 'canal', operador: '==', valor: '' }])}>Agregar Condición</Button>
        </Space>
      )}
    </Drawer>
  );
};

const SimulatorPanel = ({ simForm, setSimForm, runSimulation, saving, simResult }: {
  simForm: SimForm;
  setSimForm: (value: SimForm) => void;
  runSimulation: () => void;
  saving: boolean;
  simResult: SimuladorResponse | null;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 1fr)', gap: 16 }}>
    <Card title="Datos de la Transacción">
      <Form layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Form.Item label="Producto"><Input value={simForm.productoCodigo} onChange={(event) => setSimForm({ ...simForm, productoCodigo: event.target.value })} /></Form.Item>
          <Form.Item label="Canal"><Input value={simForm.canalCodigo} onChange={(event) => setSimForm({ ...simForm, canalCodigo: event.target.value })} /></Form.Item>
          <Form.Item label="Moneda"><Input value={simForm.monedaCodigo} onChange={(event) => setSimForm({ ...simForm, monedaCodigo: event.target.value })} /></Form.Item>
          <Form.Item label="Monto"><InputNumber value={simForm.monto} onChange={(value) => setSimForm({ ...simForm, monto: Number(value || 0) })} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="País Origen"><Input value={simForm.paisOrigenCodigo} onChange={(event) => setSimForm({ ...simForm, paisOrigenCodigo: event.target.value })} /></Form.Item>
          <Form.Item label="País Destino"><Input value={simForm.paisDestinoCodigo} onChange={(event) => setSimForm({ ...simForm, paisDestinoCodigo: event.target.value })} /></Form.Item>
          <Form.Item label="Documento Cliente"><Input value={simForm.documentoCliente} onChange={(event) => setSimForm({ ...simForm, documentoCliente: event.target.value })} /></Form.Item>
          <Form.Item label="Fecha Hora"><Input value={dayjs(simForm.fechaHora).format('YYYY-MM-DDTHH:mm')} onChange={(event) => setSimForm({ ...simForm, fechaHora: event.target.value })} /></Form.Item>
        </div>
        <Button type="primary" loading={saving} onClick={runSimulation}>Ejecutar Simulacion</Button>
      </Form>
    </Card>
    <Card title="Resultado">
      {simResult ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Title level={2}>{simResult.scoreTotal}</Typography.Title>
          <Tag color={severityColor(simResult.nivelRiesgo)}>{simResult.nivelRiesgo}</Tag>
          <Table rowKey="codigo" size="small" pagination={false} dataSource={simResult.reglasEjecutadas} columns={[{ title: 'Codigo', dataIndex: 'codigo' }, { title: 'Regla', dataIndex: 'nombre' }, { title: 'Score', dataIndex: 'score', render: (value) => `+${value}` }]} />
        </Space>
      ) : (
        <Empty description="Ejecuta una simulacion para ver el resultado" />
      )}
    </Card>
  </div>
);

const updateConditionSmart = (conditions: CondicionRegla[], index: number, patch: Partial<CondicionRegla>, definitions: RuleFactDefinition[]) =>
  conditions.map((condition, currentIndex) => {
    if (currentIndex !== index) return condition;
    if (patch.fact && patch.fact !== condition.fact) {
      const definition = definitions.find((fact) => fact.fact === patch.fact) || fallbackFacts[0];
      return { fact: patch.fact, operador: definition.operadores[0], valor: defaultValueForFact(definition) };
    }
    return { ...condition, ...patch };
  });

const defaultValueForFact = (definition: RuleFactDefinition): CondicionRegla['valor'] => {
  if (definition.tipo === 'BOOLEANO' || definition.tipo === 'EXISTENCIA') return true;
  if (definition.tipo === 'NUMERICO') return 0;
  return '';
};

const normalizePayload = (data: EntityRecord, fields: EntityFieldSchema[]) => {
  const payload: EntityRecord = {};
  fields.forEach((field) => {
    const key = field.relation ? `${field.name}Id` : field.name;
    if (data[key] !== undefined && !hiddenOnCreate.has(field.name)) payload[key] = data[key];
  });
  return payload;
};

const parseValue = (value: string): CondicionRegla['valor'] => {
  if (value.includes(',')) return value.split(',').map((part) => parseValue(part.trim()) as string | number);
  if (value === 'true' || value === 'false') return value === 'true';
  const numeric = Number(value);
  return Number.isFinite(numeric) && value.trim() !== '' ? numeric : value;
};

const parseRuleConditions = (rule: ReglaRiesgo): CondicionRegla[] => {
  if (!rule.condicionesJson) return [{ fact: 'monto', operador: '>', valor: 10000 }];
  try {
    const parsed = JSON.parse(rule.condicionesJson) as { items?: CondicionRegla[] };
    return Array.isArray(parsed.items) && parsed.items.length ? parsed.items : [{ fact: 'monto', operador: '>', valor: 10000 }];
  } catch {
    return [{ fact: 'monto', operador: '>', valor: 10000 }];
  }
};

const toRuleDraft = (rule: ReglaRiesgo): RuleDraft => ({
  escenarioId: rule.escenarioId || 0,
  codigo: rule.codigo || '',
  nombre: rule.nombre || '',
  descripcion: rule.descripcion || '',
  severidad: rule.severidad || 'MEDIA',
  prioridad: rule.prioridad || 1,
  score: Number(rule.score || 0),
  estado: rule.estado || 'BORRADOR',
  accion: firstActionCode(rule) || 'REVISION_MANUAL',
});

const firstActionCode = (rule: ReglaRiesgo) => {
  if (!rule.accionesJson) return null;
  try {
    const parsed = JSON.parse(rule.accionesJson) as Array<{ codigo?: string }> | string[];
    const first = Array.isArray(parsed) ? parsed[0] : null;
    if (typeof first === 'object' && first && 'codigo' in first) return first.codigo || null;
    if (typeof first === 'string') return first;
  } catch {
    return null;
  }
  return null;
};

const severityOptions = () => ['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map((value) => ({ value, label: titleize(value) }));
const stateOptions = () => ['ACTIVA', 'INACTIVA', 'EN_PRUEBA', 'BORRADOR'].map((value) => ({ value, label: titleize(value) }));
const severityColor = (value?: string | null) => ({ CRITICA: 'red', CRITICO: 'red', ALTA: 'orange', ALTO: 'orange', MEDIA: 'gold', MEDIO: 'gold', BAJA: 'blue', BAJO: 'blue' }[String(value || '').toUpperCase()] || 'default');
const isNumericField = (field: EntityFieldSchema) => ['Long', 'Integer', 'Short', 'BigDecimal', 'Double', 'Float'].some((type) => field.type.includes(type)) || field.relation;
const relationId = (value: unknown) => value && typeof value === 'object' && 'id' in (value as Record<string, unknown>) ? (value as Record<string, unknown>).id : null;
const catalogValue = (item: EntityRecord) => String(item.codigo ?? item.codigoIso ?? item.nombre ?? item.id ?? '');
const formatValue = (value: CondicionRegla['valor']) => Array.isArray(value) ? value.join(', ') : String(value);
const renderCell = (value: unknown) => {
  if (value == null || value === '') return '-';
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    if ('label' in objectValue || 'id' in objectValue) return `${objectValue.label ?? objectValue.nombre ?? 'registro'} (${objectValue.id ?? '-'})`;
    return JSON.stringify(value);
  }
  return String(value);
};
const optionLabel = (item: EntityRecord) => {
  const codigo = item.codigo ?? item.codigoIso;
  const nombre = item.nombre ?? item.descripcion ?? item.email ?? item.numeroDocumento ?? item.titulo;
  if (codigo && nombre) return `${String(codigo)} - ${String(nombre)}`;
  if (nombre) return String(nombre);
  if (codigo) return String(codigo);
  return `Registro #${String(item.id ?? '-')}`;
};
const titleize = (value: string) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default RuleEngine;
