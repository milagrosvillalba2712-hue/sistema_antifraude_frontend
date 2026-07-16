import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Eye,
  FlaskConical,
  GitBranch,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ruleEngineApi, rulesApi, simuladorApi } from '../../api';
import type {
  CondicionRegla,
  EntityFieldSchema,
  EntityRecord,
  EntitySchema,
  EntitySummary,
  EstadoRegla,
  ReglaRiesgo,
  SeveridadRegla,
  SimuladorResponse,
} from '../../types';

type Tab = 'reglas' | 'constructor' | 'entidades' | 'simulador';
type FormMode = 'create' | 'edit' | 'detail';
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

const tabs: Array<{ id: Tab; label: string; icon: typeof ListChecks }> = [
  { id: 'reglas', label: 'Reglas', icon: ListChecks },
  { id: 'constructor', label: 'Constructor', icon: GitBranch },
  { id: 'entidades', label: 'Entidades y Catálogos', icon: Database },
  { id: 'simulador', label: 'Simulador', icon: FlaskConical },
];

const facts = ['monto', 'moneda', 'canal', 'paisOrigen', 'paisDestino', 'documento', 'pep', 'observado', 'listas', 'horario', 'frecuencia'];
const operadores = ['==', '!=', '>', '>=', '<', '<=', 'in', 'between', 'exists'] as const;
const hiddenOnCreate = new Set(['id', 'fechaCreacion', 'fechaModificacion', 'createdAt', 'updatedAt']);

const RuleEngine = () => {
  const [activeTab, setActiveTab] = useState<Tab>('entidades');
  const [rules, setRules] = useState<ReglaRiesgo[]>([]);
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('pais');
  const [schema, setSchema] = useState<EntitySchema | null>(null);
  const [rows, setRows] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formData, setFormData] = useState<EntityRecord>({});
  const [simResult, setSimResult] = useState<SimuladorResponse | null>(null);
  const [condiciones, setCondiciones] = useState<CondicionRegla[]>([
    { fact: 'monto', operador: '>', valor: 10000 },
  ]);
  const [ruleForm, setRuleForm] = useState({
    escenarioId: 0,
    codigo: '',
    nombre: '',
    descripcion: '',
    severidad: 'MEDIA' as SeveridadRegla,
    prioridad: 1,
    score: 30,
    estado: 'BORRADOR' as EstadoRegla,
    accion: 'REVISION_MANUAL',
  });
  const [simForm, setSimForm] = useState({
    productoCodigo: 'TRANSFERENCIA',
    canalCodigo: 'WEB',
    monedaCodigo: 'USD',
    monto: 15000,
    paisOrigenCodigo: 'PY',
    paisDestinoCodigo: 'US',
    documentoCliente: '12345678',
    fechaHora: new Date().toISOString().slice(0, 16),
  });

  const filteredEntities = useMemo(() => {
    const query = search.toLowerCase();
    return entities.filter((entity) => entity.table.toLowerCase().includes(query) || entity.key.toLowerCase().includes(query));
  }, [entities, search]);

  const visibleRows = useMemo(() => {
    const query = search.toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  }, [rows, search]);

  const preview = useMemo(() => {
    const readable = condiciones.map((c) => `${c.fact} ${c.operador} ${formatValue(c.valor)}`).join(' y ');
    return `Si ${readable}, sumar ${ruleForm.score} puntos y sugerir ${ruleForm.accion}.`;
  }, [condiciones, ruleForm.score, ruleForm.accion]);

  const selectedSummary = entities.find((entity) => entity.key === selectedEntity || entity.table === selectedEntity);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ruleData, entityData] = await Promise.all([rulesApi.getAll(), ruleEngineApi.getEntities()]);
      setRules(ruleData);
      setEntities(entityData);
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
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadEntity();
  }, [selectedEntity]);

  const openForm = (mode: FormMode, row?: EntityRecord) => {
    setFormMode(mode);
    setFormData(mode === 'create' ? {} : row || {});
  };

  const saveEntity = async () => {
    if (!schema || !formMode || formMode === 'detail') return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = normalizePayload(formData, schema.fields);
      if (formMode === 'create') {
        await ruleEngineApi.createEntity(schema.key, payload);
        setMessage('Registro creado. El ID fue asignado automaticamente.');
      } else {
        await ruleEngineApi.updateEntity(schema.key, Number(formData.id), payload);
        setMessage('Registro actualizado.');
      }
      setFormMode(null);
      await Promise.all([loadAll(), loadEntity(schema.key)]);
    } catch (error) {
      setMessage('No se pudo guardar. Revisa campos requeridos, relaciones y valores enum.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntity = async (row: EntityRecord) => {
    if (!schema || !window.confirm(`Eliminar registro #${String(row.id)} de ${schema.table}?`)) return;
    setSaving(true);
    try {
      await ruleEngineApi.deleteEntity(schema.key, Number(row.id));
      setMessage('Registro eliminado.');
      await Promise.all([loadAll(), loadEntity(schema.key)]);
    } catch (error) {
      setMessage('No se pudo eliminar. Puede tener relaciones con otras tablas.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const saveRule = async () => {
    setSaving(true);
    try {
      await rulesApi.create({
        ...ruleForm,
        condiciones: { combinador: 'ALL', items: condiciones },
        acciones: [{ codigo: ruleForm.accion, descripcion: ruleForm.accion.replaceAll('_', ' ') }],
      });
      setMessage('Regla creada correctamente.');
      setActiveTab('reglas');
      await loadAll();
    } catch (error) {
      setMessage('No se pudo crear la regla.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: ReglaRiesgo) => {
    if (rule.estado === 'ACTIVA') await rulesApi.desactivar(rule.id);
    else await rulesApi.activar(rule.id);
    await loadAll();
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
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-container" /></div>;
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary">Motor de Reglas</h1>
          <p className="text-sm text-secondary/60">Reglas guiadas, simulacion y CRUD centralizado de entidades del esquema antifraude.</p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-surface-container-highest bg-white px-3 py-2 text-sm text-secondary">
          <Database className="h-4 w-4 text-primary-container" />
          {entities.length} entidades disponibles
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-surface-container-highest">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'border-b-2 border-primary-container text-primary-container' : 'text-secondary/60 hover:text-secondary'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-md border border-surface-container-highest bg-white p-3 text-sm text-secondary">
          <AlertTriangle className="h-4 w-4 text-primary-container" />
          {message}
        </div>
      )}

      {activeTab === 'reglas' && <RulesPanel rules={rules} toggleRule={toggleRule} />}
      {activeTab === 'constructor' && (
        <ConstructorPanel
          ruleForm={ruleForm}
          setRuleForm={setRuleForm}
          condiciones={condiciones}
          setCondiciones={setCondiciones}
          preview={preview}
          saving={saving}
          saveRule={saveRule}
          escenarioOptions={rowsForEntity(entities, 'escenario')}
        />
      )}
      {activeTab === 'entidades' && (
        <section className="grid min-h-[620px] gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-lg border border-surface-container-highest bg-white">
            <div className="border-b border-surface-container-highest p-3">
              <label className="flex items-center gap-2 rounded-md bg-surface-container-low px-3 py-2 text-sm text-secondary">
                <Search className="h-4 w-4 text-secondary/50" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tabla o registro" className="w-full bg-transparent outline-none" />
              </label>
            </div>
            <div className="max-h-[560px] overflow-y-auto p-2">
              {filteredEntities.map((entity) => (
                <button
                  key={entity.key}
                  onClick={() => setSelectedEntity(entity.key)}
                  className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    selectedEntity === entity.key ? 'bg-primary-container text-white' : 'text-secondary hover:bg-surface-container-low'
                  }`}
                >
                  <span className="min-w-0 truncate font-semibold">{entity.table}</span>
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{entity.count}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 rounded-lg border border-surface-container-highest bg-white">
            <div className="flex flex-col gap-3 border-b border-surface-container-highest p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-secondary">{schema?.table || selectedEntity}</h2>
                <p className="text-xs text-secondary/60">
                  {selectedSummary?.count ?? rows.length} registros cargados. El ID es autoincremental y no se solicita en altas.
                </p>
              </div>
              <button
                disabled={!schema?.editable}
                onClick={() => openForm('create')}
                className="flex items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </button>
            </div>
            <EntityTable rows={visibleRows} schema={schema} openForm={openForm} deleteEntity={deleteEntity} saving={saving} />
          </main>
        </section>
      )}
      {activeTab === 'simulador' && <SimulatorPanel simForm={simForm} setSimForm={setSimForm} runSimulation={runSimulation} saving={saving} simResult={simResult} />}

      {formMode && schema && (
        <EntityDrawer
          schema={schema}
          mode={formMode}
          data={formData}
          setData={setFormData}
          close={() => setFormMode(null)}
          save={saveEntity}
          saving={saving}
        />
      )}
    </div>
  );
};

const RulesPanel = ({ rules, toggleRule }: { rules: ReglaRiesgo[]; toggleRule: (rule: ReglaRiesgo) => void }) => (
  <section className="overflow-hidden rounded-lg border border-surface-container-highest bg-white">
    <TableHeader columns={['Codigo', 'Regla', 'Escenario', 'Score', 'Estado', 'Acciones']} />
    <div className="divide-y divide-surface-container-highest">
      {rules.map((rule) => (
        <div key={rule.id} className="grid min-w-[900px] grid-cols-[140px_1.6fr_1fr_90px_110px_110px] items-center gap-3 px-4 py-3 text-sm">
          <span className="font-mono text-secondary">{rule.codigo}</span>
          <span className="min-w-0">
            <p className="font-semibold text-secondary">{rule.nombre}</p>
            <p className="truncate text-xs text-secondary/60">{rule.condicion || rule.descripcion}</p>
          </span>
          <span className="text-secondary">{rule.escenarioNombre || '-'}</span>
          <span className="font-semibold text-secondary">{rule.score}</span>
          <span className="text-xs font-bold text-secondary">{rule.estado}</span>
          <button onClick={() => toggleRule(rule)} className="rounded-full p-2 text-secondary hover:bg-surface-container-low" title="Activar o desactivar">
            <Power className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  </section>
);

const ConstructorPanel = ({ ruleForm, setRuleForm, condiciones, setCondiciones, preview, saving, saveRule }: {
  ruleForm: {
    escenarioId: number; codigo: string; nombre: string; descripcion: string; severidad: SeveridadRegla;
    prioridad: number; score: number; estado: EstadoRegla; accion: string;
  };
  setRuleForm: (value: typeof ruleForm) => void;
  condiciones: CondicionRegla[];
  setCondiciones: (value: CondicionRegla[]) => void;
  preview: string;
  saving: boolean;
  saveRule: () => void;
  escenarioOptions: Array<[string, string]>;
}) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
    <div className="space-y-4 rounded-lg border border-surface-container-highest bg-white p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Codigo" value={ruleForm.codigo} onChange={(v) => setRuleForm({ ...ruleForm, codigo: v })} />
        <Field label="Nombre" value={ruleForm.nombre} onChange={(v) => setRuleForm({ ...ruleForm, nombre: v })} />
        <Field label="Escenario ID" type="number" value={String(ruleForm.escenarioId || '')} onChange={(v) => setRuleForm({ ...ruleForm, escenarioId: Number(v) })} />
        <Select label="Severidad" value={ruleForm.severidad} onChange={(v) => setRuleForm({ ...ruleForm, severidad: v as SeveridadRegla })} options={['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map((v) => [v, v])} />
        <Field label="Prioridad" type="number" value={String(ruleForm.prioridad)} onChange={(v) => setRuleForm({ ...ruleForm, prioridad: Number(v) })} />
        <Field label="Score" type="number" value={String(ruleForm.score)} onChange={(v) => setRuleForm({ ...ruleForm, score: Number(v) })} />
      </div>
      <textarea value={ruleForm.descripcion} onChange={(event) => setRuleForm({ ...ruleForm, descripcion: event.target.value })} className="min-h-20 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20" placeholder="Descripcion" />
      <div className="space-y-3">
        {condiciones.map((condition, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-surface-container-highest p-3 md:grid-cols-[1fr_120px_1fr_44px]">
            <Select label="Dato" value={condition.fact} onChange={(v) => setCondiciones(updateCondition(condiciones, index, { fact: v }))} options={facts.map((v) => [v, v])} />
            <Select label="Operador" value={condition.operador} onChange={(v) => setCondiciones(updateCondition(condiciones, index, { operador: v as CondicionRegla['operador'] }))} options={operadores.map((v) => [v, v])} />
            <Field label="Valor" value={String(condition.valor)} onChange={(v) => setCondiciones(updateCondition(condiciones, index, { valor: parseValue(v) }))} />
            <button onClick={() => setCondiciones(condiciones.filter((_, current) => current !== index))} className="mt-6 rounded-md p-2 text-critical hover:bg-critical/10" title="Quitar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button onClick={() => setCondiciones([...condiciones, { fact: 'canal', operador: '==', valor: '' }])} className="flex items-center gap-2 rounded-md border border-surface-container-highest px-3 py-2 text-sm font-semibold text-secondary">
          <Plus className="h-4 w-4" />
          Condicion
        </button>
      </div>
    </div>
    <aside className="space-y-4 rounded-lg border border-surface-container-highest bg-white p-5">
      <h2 className="font-semibold text-secondary">Vista previa</h2>
      <p className="rounded-md bg-surface-container-low p-3 text-sm leading-6 text-secondary">{preview}</p>
      <Field label="Accion sugerida" value={ruleForm.accion} onChange={(v) => setRuleForm({ ...ruleForm, accion: v })} />
      <button onClick={saveRule} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        <Save className="h-4 w-4" />
        Guardar regla
      </button>
    </aside>
  </section>
);

const EntityTable = ({ rows, schema, openForm, deleteEntity, saving }: {
  rows: EntityRecord[];
  schema: EntitySchema | null;
  openForm: (mode: FormMode, row?: EntityRecord) => void;
  deleteEntity: (row: EntityRecord) => void;
  saving: boolean;
}) => {
  const columns = useMemo(() => {
    const names = new Set<string>();
    rows.slice(0, 20).forEach((row) => Object.keys(row).forEach((key) => names.add(key)));
    return Array.from(names).slice(0, 8);
  }, [rows]);

  if (!rows.length) {
    return <div className="p-10 text-center text-sm text-secondary/60">No hay registros cargados para esta entidad.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-surface-container-low/40 text-xs uppercase text-secondary/60">
          <tr>
            {columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-highest">
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="text-sm text-secondary">
              {columns.map((column) => <td key={column} className="max-w-[220px] truncate px-4 py-3">{renderCell(row[column])}</td>)}
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <IconButton title="Ver detalle" onClick={() => openForm('detail', row)} icon={Eye} />
                  <IconButton title="Editar" onClick={() => openForm('edit', row)} icon={Pencil} disabled={!schema?.editable} />
                  <IconButton title="Eliminar" onClick={() => deleteEntity(row)} icon={Trash2} danger disabled={!schema?.editable || saving} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EntityDrawer = ({ schema, mode, data, setData, close, save, saving }: {
  schema: EntitySchema;
  mode: FormMode;
  data: EntityRecord;
  setData: (data: EntityRecord) => void;
  close: () => void;
  save: () => void;
  saving: boolean;
}) => {
  const readonly = mode === 'detail';
  const fields = schema.fields.filter((field) => field.editable && !hiddenOnCreate.has(field.name));
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-surface-container-highest bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold text-secondary">{mode === 'create' ? 'Nuevo registro' : mode === 'edit' ? 'Editar registro' : 'Detalle'}</h2>
            <p className="text-xs text-secondary/60">{schema.table}</p>
          </div>
          <button onClick={close} className="rounded-md p-2 text-secondary hover:bg-surface-container-low"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          {mode !== 'create' && <ReadOnly label="ID" value={String(data.id ?? '')} />}
          {fields.map((field) => (
            <DynamicField
              key={field.name}
              field={field}
              readonly={readonly}
              value={field.relation ? relationId(data[field.name]) ?? data[`${field.name}Id`] : data[field.name]}
              onChange={(value) => setData({ ...data, [field.relation ? `${field.name}Id` : field.name]: value })}
            />
          ))}
          {!readonly && (
            <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DynamicField = ({ field, value, readonly, onChange }: { field: EntityFieldSchema; value: unknown; readonly: boolean; onChange: (value: string) => void }) => {
  const label = field.relation ? `${field.name}Id (${field.relationType})` : `${field.name} (${field.type})`;
  if (readonly) return <ReadOnly label={label} value={renderCell(value)} />;
  return <Field label={label} value={value == null ? '' : String(value)} onChange={onChange} type={inputType(field)} />;
};

const SimulatorPanel = ({ simForm, setSimForm, runSimulation, saving, simResult }: {
  simForm: SimForm;
  setSimForm: (value: SimForm) => void;
  runSimulation: () => void;
  saving: boolean;
  simResult: SimuladorResponse | null;
}) => (
  <section className="grid gap-5 lg:grid-cols-2">
    <div className="grid gap-3 rounded-lg border border-surface-container-highest bg-white p-5 md:grid-cols-2">
      {Object.entries(simForm).map(([key, value]) => (
        <Field key={key} label={key} type={key === 'monto' ? 'number' : key === 'fechaHora' ? 'datetime-local' : 'text'} value={String(value)} onChange={(v) => setSimForm({ ...simForm, [key]: key === 'monto' ? Number(v) : v })} />
      ))}
      <button onClick={runSimulation} disabled={saving} className="md:col-span-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        Ejecutar simulacion
      </button>
    </div>
    <div className="rounded-lg border border-surface-container-highest bg-white p-5">
      {simResult ? (
        <div className="space-y-3 text-sm text-secondary">
          <p className="text-3xl font-bold">{simResult.scoreTotal}</p>
          <p className="font-semibold">{simResult.nivelRiesgo}</p>
          {simResult.reglasEjecutadas.map((rule) => (
            <div key={rule.codigo} className="rounded-md bg-surface-container-low p-3">{rule.codigo} - {rule.nombre} (+{rule.score})</div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-secondary/60">Ejecuta una prueba para ver reglas cumplidas y acciones sugeridas.</p>
      )}
    </div>
  </section>
);

const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => (
  <label className="block text-sm font-medium text-secondary">
    {label}
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20" />
  </label>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) => (
  <label className="block text-sm font-medium text-secondary">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20">
      {options.map(([optionValue, labelValue]) => <option key={optionValue} value={optionValue}>{labelValue}</option>)}
    </select>
  </label>
);

const ReadOnly = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-surface-container-low p-3 text-sm">
    <p className="mb-1 font-semibold text-secondary/60">{label}</p>
    <p className="break-words text-secondary">{value || '-'}</p>
  </div>
);

const IconButton = ({ title, onClick, icon: Icon, danger, disabled }: { title: string; onClick: () => void; icon: typeof Eye; danger?: boolean; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} title={title} className={`rounded-md p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'text-critical hover:bg-critical/10' : 'text-secondary hover:bg-surface-container-low'}`}>
    <Icon className="h-4 w-4" />
  </button>
);

const TableHeader = ({ columns }: { columns: string[] }) => (
  <div className="grid min-w-[900px] grid-cols-[140px_1.6fr_1fr_90px_110px_110px] gap-3 bg-surface-container-low/40 px-4 py-3 text-xs font-bold uppercase text-secondary/60">
    {columns.map((column) => <span key={column}>{column}</span>)}
  </div>
);

const updateCondition = (conditions: CondicionRegla[], index: number, patch: Partial<CondicionRegla>) =>
  conditions.map((condition, currentIndex) => currentIndex === index ? { ...condition, ...patch } : condition);

const parseValue = (value: string): string | number | boolean | Array<string | number> => {
  if (value.includes(',')) return value.split(',').map((part) => {
    const parsed = parseValue(part.trim());
    return typeof parsed === 'boolean' || Array.isArray(parsed) ? String(parsed) : parsed;
  });
  const numberValue = Number(value);
  if (!Number.isNaN(numberValue) && value.trim() !== '') return numberValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const normalizePayload = (data: EntityRecord, fields: EntityFieldSchema[]) => {
  const payload: EntityRecord = {};
  fields.forEach((field) => {
    const key = field.relation ? `${field.name}Id` : field.name;
    if (data[key] !== undefined && !hiddenOnCreate.has(field.name)) {
      payload[key] = data[key];
    }
  });
  return payload;
};

const inputType = (field: EntityFieldSchema) => {
  if (field.type.includes('DateTime')) return 'datetime-local';
  if (field.type.includes('Date')) return 'date';
  if (field.type.includes('Time')) return 'time';
  if (['Long', 'Integer', 'Short', 'BigDecimal'].includes(field.type) || field.relation) return 'number';
  return 'text';
};

const renderCell = (value: unknown) => {
  if (value == null) return '-';
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    if ('label' in objectValue || 'id' in objectValue) return `${objectValue.label ?? 'registro'} (${objectValue.id ?? '-'})`;
    return JSON.stringify(objectValue);
  }
  return String(value);
};

const relationId = (value: unknown) => {
  if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) return (value as Record<string, unknown>).id;
  return null;
};

const formatValue = (value: CondicionRegla['valor']) => Array.isArray(value) ? value.join(', ') : String(value);
const rowsForEntity = (_entities: EntitySummary[], _table: string): Array<[string, string]> => [];

export default RuleEngine;
