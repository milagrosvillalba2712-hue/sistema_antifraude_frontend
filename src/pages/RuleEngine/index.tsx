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
  RuleFactDefinition,
  SeveridadRegla,
  SimuladorResponse,
} from '../../types';

type Tab = 'reglas' | 'constructor' | 'entidades' | 'simulador';
type FormMode = 'create' | 'edit' | 'detail';
type RuleFormMode = 'edit' | 'detail';
type SelectOption = [string, string];
type RelationOptions = Record<string, SelectOption[]>;
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
  { id: 'entidades', label: 'Entidades y Catálogos', icon: Database },
  { id: 'constructor', label: 'Constructor', icon: GitBranch },
  { id: 'simulador', label: 'Simulador', icon: FlaskConical },
];

const operatorLabels: Record<CondicionRegla['operador'], string> = {
  '==': 'Es igual a',
  '!=': 'Es diferente de',
  '>': 'Es mayor que',
  '>=': 'Es mayor o igual que',
  '<': 'Es menor que',
  '<=': 'Es menor o igual que',
  in: 'Esta dentro de una lista',
  between: 'Esta entre dos valores',
  exists: 'Existe o esta informado',
};
const fallbackFacts: RuleFactDefinition[] = [
  { fact: 'monto', etiqueta: 'Monto de la transaccion', tipo: 'NUMERICO', catalogo: null, operadores: ['>', '>=', '<', '<=', 'between'] },
  { fact: 'moneda', etiqueta: 'Moneda', tipo: 'CATALOGO', catalogo: 'moneda', operadores: ['==', '!=', 'in'] },
  { fact: 'canal', etiqueta: 'Canal utilizado', tipo: 'CATALOGO', catalogo: 'canal', operadores: ['==', '!=', 'in'] },
  { fact: 'paisOrigen', etiqueta: 'Pais de origen', tipo: 'CATALOGO', catalogo: 'pais', operadores: ['==', '!=', 'in'] },
  { fact: 'paisDestino', etiqueta: 'Pais de destino', tipo: 'CATALOGO', catalogo: 'pais', operadores: ['==', '!=', 'in'] },
  { fact: 'pep', etiqueta: 'Cliente PEP', tipo: 'BOOLEANO', catalogo: null, operadores: ['exists', '=='] },
  { fact: 'observado', etiqueta: 'Cliente observado', tipo: 'BOOLEANO', catalogo: null, operadores: ['exists', '=='] },
  { fact: 'listas', etiqueta: 'Listas regulatorias', tipo: 'EXISTENCIA', catalogo: null, operadores: ['exists', '=='] },
];
const hiddenOnCreate = new Set(['id', 'fechaCreacion', 'fechaModificacion', 'createdAt', 'updatedAt']);
const pageSizeOptions = [5, 10, 20, 50];

const sectionDescriptions: Record<Tab, string> = {
  reglas: 'Consulta, filtra y administra las reglas de riesgo. Desde aquí puedes activar o desactivar reglas y revisar su score, escenario y estado operativo.',
  entidades: 'Explora las tablas y catálogos disponibles del sistema. Permite ver registros, crear nuevos datos, editar información y eliminar registros cuando no estén bloqueados por relaciones.',
  constructor: 'Crea reglas guiadas sin escribir código. Define datos, operadores, valores, score y acción sugerida para que el motor pueda evaluar transacciones.',
  simulador: 'Prueba las reglas activas con una transacción de ejemplo. El resultado muestra score, nivel de riesgo y reglas cumplidas sin usar la pantalla de simulador independiente.',
};

const entityDescriptions: Record<string, string> = {
  accion: 'Catálogo de acciones sugeridas o ejecutables por el motor de reglas.',
  escenario: 'Agrupa reglas por contexto antifraude, como lavado, PEP, listas o fraude clásico.',
  pais: 'Catálogo de países utilizado por transacciones, KYC, listas y controles de riesgo.',
  moneda: 'Catálogo de monedas usadas en transacciones, reglas y controles de importe.',
  canal: 'Catálogo de canales de operación, por ejemplo web, móvil, sucursal o API.',
  producto: 'Catálogo de productos financieros evaluados por el sistema antifraude.',
  tipo_documento: 'Catálogo de tipos de documento para personas, KYC y validaciones regulatorias.',
  nivel_riesgo: 'Catálogo de niveles usados para clasificar transacciones, clientes y controles.',
  reglas_riesgo: 'Tabla principal de reglas configuradas para el motor de riesgo.',
  ejecucion_regla: 'Historial técnico de reglas evaluadas por el motor.',
  alertas: 'Alertas generadas por reglas cumplidas o por evaluación de riesgo.',
  transacciones: 'Operaciones evaluadas por el sistema antifraude.',
  usuarios: 'Usuarios del sistema y sus roles de acceso.',
  reportes_ros: 'Reportes de operaciones sospechosas generados desde alertas.',
  consultas_externas: 'Auditoría de consultas realizadas a servicios externos de KYC.',
};

const simPlaceholders: Record<keyof SimForm, string> = {
  productoCodigo: 'Ej. TRANSFERENCIA',
  canalCodigo: 'Ej. WEB',
  monedaCodigo: 'Ej. USD',
  monto: 'Ej. 15000',
  paisOrigenCodigo: 'Ej. PY',
  paisDestinoCodigo: 'Ej. US',
  documentoCliente: 'Ej. 12345678',
  fechaHora: 'Selecciona fecha y hora',
};

const simHelp: Record<keyof SimForm, string> = {
  productoCodigo: 'Código del producto que se usará como hecho de evaluación.',
  canalCodigo: 'Canal por el que se originó la operación.',
  monedaCodigo: 'Moneda de la transacción simulada.',
  monto: 'Importe que será comparado contra reglas y controles.',
  paisOrigenCodigo: 'País donde se origina la operación.',
  paisDestinoCodigo: 'País destino de la operación.',
  documentoCliente: 'Documento usado para evaluar PEP, observado o listas.',
  fechaHora: 'Fecha y hora usadas para reglas de horario y calendario.',
};

const RuleEngine = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reglas');
  const [rules, setRules] = useState<ReglaRiesgo[]>([]);
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('pais');
  const [schema, setSchema] = useState<EntitySchema | null>(null);
  const [rows, setRows] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [entitySearch, setEntitySearch] = useState('');
  const [rowSearch, setRowSearch] = useState('');
  const [rowFieldFilter, setRowFieldFilter] = useState('');
  const [entityPage, setEntityPage] = useState(1);
  const [entityPageSize, setEntityPageSize] = useState(10);
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleEstado, setRuleEstado] = useState<EstadoRegla | ''>('');
  const [ruleSeveridad, setRuleSeveridad] = useState<SeveridadRegla | ''>('');
  const [rulePage, setRulePage] = useState(1);
  const [rulePageSize, setRulePageSize] = useState(10);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formData, setFormData] = useState<EntityRecord>({});
  const [relationOptions, setRelationOptions] = useState<RelationOptions>({});
  const [factDefinitions, setFactDefinitions] = useState<RuleFactDefinition[]>(fallbackFacts);
  const [factValueOptions, setFactValueOptions] = useState<RelationOptions>({});
  const [ruleDrawerMode, setRuleDrawerMode] = useState<RuleFormMode | null>(null);
  const [selectedRule, setSelectedRule] = useState<ReglaRiesgo | null>(null);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [ruleDraftConditions, setRuleDraftConditions] = useState<CondicionRegla[]>([]);
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
  }, [rows, rowSearch, rowFieldFilter]);

  const filteredRules = useMemo(() => {
    const query = ruleSearch.toLowerCase();
    return rules.filter((rule) => {
      const matchesText = !query || [
        rule.codigo,
        rule.nombre,
        rule.descripcion,
        rule.condicion,
        rule.escenarioNombre,
      ].some((value) => String(value ?? '').toLowerCase().includes(query));
      const matchesEstado = !ruleEstado || rule.estado === ruleEstado;
      const matchesSeveridad = !ruleSeveridad || rule.severidad === ruleSeveridad;
      return matchesText && matchesEstado && matchesSeveridad;
    });
  }, [rules, ruleSearch, ruleEstado, ruleSeveridad]);

  const paginatedRows = useMemo(() => paginate(visibleRows, entityPage, entityPageSize), [visibleRows, entityPage, entityPageSize]);
  const paginatedRules = useMemo(() => paginate(filteredRules, rulePage, rulePageSize), [filteredRules, rulePage, rulePageSize]);

  const preview = useMemo(() => {
    const readable = condiciones.map((c) => {
      const fact = factDefinitions.find((definition) => definition.fact === c.fact);
      return `${fact?.etiqueta || titleize(c.fact)} ${operatorLabels[c.operador]} ${formatValue(c.valor)}`;
    }).join(' y ');
    return `Si ${readable}, sumar ${ruleForm.score} puntos y sugerir ${ruleForm.accion}.`;
  }, [condiciones, factDefinitions, ruleForm.score, ruleForm.accion]);

  const selectedSummary = entities.find((entity) => entity.key === selectedEntity || entity.table === selectedEntity);
  const factOptions = factDefinitions.map((fact) => [fact.fact, fact.etiqueta] as SelectOption);
  const rowFilterFields = useMemo(() => {
    const names = new Set<string>();
    rows.slice(0, 50).forEach((row) => Object.keys(row).forEach((key) => names.add(key)));
    return Array.from(names);
  }, [rows]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ruleData, entityData, factData] = await Promise.all([
        rulesApi.getAll(),
        ruleEngineApi.getEntities(),
        ruleEngineApi.getFacts().catch(() => fallbackFacts),
      ]);
      setRules(ruleData);
      setEntities(entityData);
      setFactDefinitions(factData.length ? factData : fallbackFacts);
      await loadOptionsFor(['escenario', 'accion']);
      await loadFactValueOptions(factData.length ? factData : fallbackFacts);
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

  const loadOptionsFor = async (entityKeys: string[]) => {
    const unique = Array.from(new Set(entityKeys.filter(Boolean)));
    const missing = unique.filter((key) => !relationOptions[key]);
    if (!missing.length) return;
    const loadedEntries = await Promise.all(missing.map(async (key) => {
      try {
        const items = await ruleEngineApi.getEntityRows(key);
        return [key, items.map((item) => [key === 'accion' ? String(item.codigo ?? item.id) : String(item.id), optionLabel(item)] as SelectOption)] as const;
      } catch (error) {
        console.warn(`No se pudieron cargar opciones para ${key}`, error);
        return [key, []] as const;
      }
    }));
    setRelationOptions((current) => ({
      ...current,
      ...Object.fromEntries(loadedEntries),
    }));
  };

  const loadFactValueOptions = async (definitions: RuleFactDefinition[]) => {
    const catalogs = Array.from(new Set(definitions.map((fact) => fact.catalogo).filter(Boolean))) as string[];
    const entries = await Promise.all(catalogs.map(async (catalog) => {
      try {
        const items = await ruleEngineApi.getEntityRows(catalog);
        return [catalog, items.map((item) => [catalogValue(item), optionLabel(item)] as SelectOption)] as const;
      } catch (error) {
        console.warn(`No se pudieron cargar valores para ${catalog}`, error);
        return [catalog, []] as const;
      }
    }));
    setFactValueOptions(Object.fromEntries(entries));
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadEntity();
  }, [selectedEntity]);

  useEffect(() => {
    setEntityPage(1);
  }, [selectedEntity, rowSearch, rowFieldFilter, rows.length]);

  useEffect(() => {
    setRowSearch('');
    setRowFieldFilter('');
  }, [selectedEntity]);

  useEffect(() => {
    setRulePage(1);
  }, [ruleSearch, ruleEstado, ruleSeveridad, rules.length]);

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

  const openRuleDrawer = (mode: RuleFormMode, rule: ReglaRiesgo) => {
    setSelectedRule(rule);
    setRuleDrawerMode(mode);
    setRuleDraft(toRuleDraft(rule));
    setRuleDraftConditions(parseRuleConditions(rule));
  };

  const saveRuleDraft = async () => {
    if (!selectedRule || !ruleDraft || ruleDrawerMode !== 'edit') return;
    setSaving(true);
    setMessage(null);
    try {
      await rulesApi.update(selectedRule.id, {
        ...ruleDraft,
        condiciones: { combinador: 'ALL', items: ruleDraftConditions },
        acciones: [{ codigo: ruleDraft.accion, descripcion: ruleDraft.accion.replaceAll('_', ' ') }],
      });
      setMessage('Regla actualizada correctamente.');
      setRuleDrawerMode(null);
      setSelectedRule(null);
      await loadAll();
    } catch (error) {
      setMessage('No se pudo actualizar la regla.');
      console.error(error);
    } finally {
      setSaving(false);
    }
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
          <p className="text-sm text-secondary/60">Reglas guiadas, simulación y CRUD centralizado de entidades del esquema antifraude.</p>
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

      <SectionIntro description={sectionDescriptions[activeTab]} />

      {activeTab === 'reglas' && (
        <RulesPanel
          rules={paginatedRules}
          total={filteredRules.length}
          page={rulePage}
          pageSize={rulePageSize}
          search={ruleSearch}
          estado={ruleEstado}
          severidad={ruleSeveridad}
          setPage={setRulePage}
          setPageSize={setRulePageSize}
          setSearch={setRuleSearch}
          setEstado={setRuleEstado}
          setSeveridad={setRuleSeveridad}
          toggleRule={toggleRule}
          openRule={openRuleDrawer}
        />
      )}
      {activeTab === 'constructor' && (
        <ConstructorPanel
          ruleForm={ruleForm}
          setRuleForm={setRuleForm}
          condiciones={condiciones}
          setCondiciones={setCondiciones}
          preview={preview}
          saving={saving}
          saveRule={saveRule}
          escenarioOptions={relationOptions.escenario || []}
          accionOptions={relationOptions.accion || []}
          factOptions={factOptions}
          factDefinitions={factDefinitions}
          factValueOptions={factValueOptions}
        />
      )}
      {activeTab === 'entidades' && (
        <section className="grid min-h-[620px] gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-lg border border-surface-container-highest bg-white">
            <div className="border-b border-surface-container-highest p-3">
              <label className="flex items-center gap-2 rounded-md bg-surface-container-low px-3 py-2 text-sm text-secondary">
                <Search className="h-4 w-4 text-secondary/50" />
                <input
                  value={entitySearch}
                  onChange={(event) => setEntitySearch(event.target.value)}
                  placeholder="Buscar catálogo, entidad o registro..."
                  className="w-full bg-transparent outline-none"
                />
              </label>
              <p className="mt-2 text-xs text-secondary/50">Filtra el listado de entidades y también los registros de la tabla seleccionada.</p>
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
                  <span className="min-w-0 truncate font-semibold">{titleize(entity.table)}</span>
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{entity.count}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 rounded-lg border border-surface-container-highest bg-white">
            <div className="flex flex-col gap-3 border-b border-surface-container-highest p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-secondary">{titleize(schema?.table || selectedEntity)}</h2>
                <p className="mt-1 max-w-3xl text-sm text-secondary/60">
                  {entityDescriptions[schema?.key || selectedEntity] || entityDescriptions[schema?.table || selectedEntity] || 'Entidad del esquema antifraude disponible para consulta y administración según permisos.'}
                </p>
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
                Nuevo Registro
              </button>
            </div>
            <div className="grid gap-3 border-b border-surface-container-highest p-4 md:grid-cols-[1fr_220px]">
              <label className="block text-sm font-medium text-secondary">
                Buscar Registros
                <div className="mt-1 flex items-center gap-2 rounded-md bg-surface-container-low px-3 py-2">
                  <Search className="h-4 w-4 text-secondary/50" />
                  <input
                    value={rowSearch}
                    onChange={(event) => setRowSearch(event.target.value)}
                    placeholder="Buscar dentro de la tabla seleccionada..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <span className="mt-1 block text-xs font-normal text-secondary/50">Busca en todos los campos o en el campo seleccionado.</span>
              </label>
              <Select
                label="Filtrar Por Campo"
                value={rowFieldFilter}
                onChange={setRowFieldFilter}
                options={[['', 'Todos los campos'], ...rowFilterFields.map((field) => [field, titleize(field)] as SelectOption)]}
                help="Limita la búsqueda a una columna concreta."
              />
            </div>
            <EntityTable rows={paginatedRows} schema={schema} openForm={openForm} deleteEntity={deleteEntity} saving={saving} />
            <PaginationControls
              total={visibleRows.length}
              page={entityPage}
              pageSize={entityPageSize}
              onPageChange={setEntityPage}
              onPageSizeChange={setEntityPageSize}
            />
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
          relationOptions={relationOptions}
        />
      )}
      {ruleDrawerMode && selectedRule && ruleDraft && (
        <RuleDrawer
          mode={ruleDrawerMode}
          rule={selectedRule}
          draft={ruleDraft}
          setDraft={setRuleDraft}
          condiciones={ruleDraftConditions}
          setCondiciones={setRuleDraftConditions}
          escenarioOptions={relationOptions.escenario || []}
          accionOptions={relationOptions.accion || []}
          factOptions={factOptions}
          factDefinitions={factDefinitions}
          factValueOptions={factValueOptions}
          close={() => {
            setRuleDrawerMode(null);
            setSelectedRule(null);
          }}
          save={saveRuleDraft}
          saving={saving}
        />
      )}
    </div>
  );
};

const SectionIntro = ({ description }: { description: string }) => (
  <div className="rounded-lg border border-surface-container-highest bg-white p-4 text-sm leading-6 text-secondary/70">
    {description}
  </div>
);

const RulesPanel = ({
  rules,
  total,
  page,
  pageSize,
  search,
  estado,
  severidad,
  setPage,
  setPageSize,
  setSearch,
  setEstado,
  setSeveridad,
  toggleRule,
  openRule,
}: {
  rules: ReglaRiesgo[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  estado: EstadoRegla | '';
  severidad: SeveridadRegla | '';
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (value: string) => void;
  setEstado: (value: EstadoRegla | '') => void;
  setSeveridad: (value: SeveridadRegla | '') => void;
  toggleRule: (rule: ReglaRiesgo) => void;
  openRule: (mode: RuleFormMode, rule: ReglaRiesgo) => void;
}) => (
  <section className="overflow-hidden rounded-lg border border-surface-container-highest bg-white">
    <div className="grid gap-3 border-b border-surface-container-highest p-4 xl:grid-cols-[1fr_180px_180px_150px]">
      <label className="block text-sm font-medium text-secondary">
        Buscar Regla
        <div className="mt-1 flex items-center gap-2 rounded-md bg-surface-container-low px-3 py-2">
          <Search className="h-4 w-4 text-secondary/50" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código, nombre, escenario o condición..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <span className="mt-1 block text-xs font-normal text-secondary/50">Filtra por el texto visible de la regla.</span>
      </label>
      <Select
        label="Estado"
        value={estado}
        onChange={(value) => setEstado(value as EstadoRegla | '')}
        options={[['', 'Todos'], ['BORRADOR', 'Borrador'], ['EN_PRUEBA', 'En Prueba'], ['ACTIVA', 'Activa'], ['INACTIVA', 'Inactiva']]}
        help="Muestra reglas según su estado operativo."
      />
      <Select
        label="Severidad"
        value={severidad}
        onChange={(value) => setSeveridad(value as SeveridadRegla | '')}
        options={[['', 'Todas'], ['BAJA', 'Baja'], ['MEDIA', 'Media'], ['ALTA', 'Alta'], ['CRITICA', 'Crítica']]}
        help="Filtra por impacto de riesgo."
      />
      <Select
        label="Registros Por Página"
        value={String(pageSize)}
        onChange={(value) => setPageSize(Number(value))}
        options={pageSizeOptions.map((value) => [String(value), String(value)])}
        help="Cantidad de reglas visibles."
      />
    </div>
    <div className="overflow-x-auto">
      <TableHeader columns={['Código', 'Regla', 'Escenario', 'Score', 'Estado', 'Acciones']} />
      <div className="divide-y divide-surface-container-highest">
        {rules.map((rule) => (
          <div key={rule.id} className="grid min-w-[900px] grid-cols-[140px_1.6fr_1fr_90px_110px_110px] items-center gap-3 px-4 py-3 text-sm">
            <span className="font-mono text-secondary">{rule.codigo}</span>
            <span className="min-w-0">
              <p className="font-semibold text-secondary">{rule.nombre}</p>
              <p className="truncate text-xs text-secondary/60">{rule.condicion || rule.descripcion || 'Sin descripción registrada'}</p>
            </span>
            <span className="text-secondary">{rule.escenarioNombre || '-'}</span>
            <span className="font-semibold text-secondary">{rule.score}</span>
            <span className="text-xs font-bold text-secondary">{titleize(rule.estado)}</span>
            <div className="flex items-center gap-1">
              <IconButton title="Ver Detalle" onClick={() => openRule('detail', rule)} icon={Eye} />
              <IconButton title="Editar Regla" onClick={() => openRule('edit', rule)} icon={Pencil} />
              <button onClick={() => toggleRule(rule)} className="rounded-md p-2 text-secondary hover:bg-surface-container-low" title={rule.estado === 'ACTIVA' ? 'Desactivar regla' : 'Activar regla'}>
                <Power className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {!rules.length && (
          <div className="px-4 py-10 text-center text-sm text-secondary/60">No se encontraron reglas con los filtros seleccionados.</div>
        )}
      </div>
    </div>
    <PaginationControls total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
  </section>
);

const ConstructorPanel = ({ ruleForm, setRuleForm, condiciones, setCondiciones, preview, saving, saveRule, escenarioOptions, accionOptions, factOptions, factDefinitions, factValueOptions }: {
  ruleForm: RuleDraft;
  setRuleForm: (value: RuleDraft) => void;
  condiciones: CondicionRegla[];
  setCondiciones: (value: CondicionRegla[]) => void;
  preview: string;
  saving: boolean;
  saveRule: () => void;
  escenarioOptions: SelectOption[];
  accionOptions: SelectOption[];
  factOptions: SelectOption[];
  factDefinitions: RuleFactDefinition[];
  factValueOptions: RelationOptions;
}) => (
  <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
    <div className="space-y-4 rounded-lg border border-surface-container-highest bg-white p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Código" value={ruleForm.codigo} onChange={(v) => setRuleForm({ ...ruleForm, codigo: v })} placeholder="Ej. RG_MONTO_ALTO_V1" help="Identificador único de la regla. Usa un código corto y estable." />
        <Field label="Nombre" value={ruleForm.nombre} onChange={(v) => setRuleForm({ ...ruleForm, nombre: v })} placeholder="Ej. Transferencia internacional alta" help="Nombre visible para analistas y supervisores." />
        <Select label="Escenario" value={String(ruleForm.escenarioId || '')} onChange={(v) => setRuleForm({ ...ruleForm, escenarioId: Number(v) })} options={[['', 'Selecciona un escenario'], ...escenarioOptions]} help="Escenario existente donde se agrupa esta regla." />
        <Select label="Severidad" value={ruleForm.severidad} onChange={(v) => setRuleForm({ ...ruleForm, severidad: v as SeveridadRegla })} options={['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map((v) => [v, titleize(v)])} help="Nivel cualitativo de impacto de la regla." />
        <Field label="Prioridad" type="number" value={String(ruleForm.prioridad)} onChange={(v) => setRuleForm({ ...ruleForm, prioridad: Number(v) })} placeholder="Ej. 1" help="Orden de evaluación. Menor número implica mayor prioridad." />
        <Field label="Score" type="number" value={String(ruleForm.score)} onChange={(v) => setRuleForm({ ...ruleForm, score: Number(v) })} placeholder="Ej. 40" help="Puntos que suma si se cumplen las condiciones." />
      </div>
      <label className="block text-sm font-medium text-secondary">
        Descripción
        <textarea
          value={ruleForm.descripcion}
          onChange={(event) => setRuleForm({ ...ruleForm, descripcion: event.target.value })}
          className="mt-1 min-h-20 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20"
          placeholder="Describe cuándo debe aplicar esta regla y qué riesgo representa..."
        />
        <span className="mt-1 block text-xs font-normal text-secondary/50">Ayuda a entender la regla sin revisar el JSON técnico.</span>
      </label>
      <div className="space-y-3">
        {condiciones.map((condition, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-surface-container-highest p-3 md:grid-cols-[1fr_180px_1fr_44px]">
            <ConditionFields
              condition={condition}
              factOptions={factOptions}
              factDefinitions={factDefinitions}
              factValueOptions={factValueOptions}
              onChange={(patch) => setCondiciones(updateConditionSmart(condiciones, index, patch, factDefinitions))}
            />
            <button onClick={() => setCondiciones(condiciones.filter((_, current) => current !== index))} className="mt-6 rounded-md p-2 text-critical hover:bg-critical/10" title="Quitar">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button onClick={() => setCondiciones([...condiciones, { fact: 'canal', operador: '==', valor: '' }])} className="flex items-center gap-2 rounded-md border border-surface-container-highest px-3 py-2 text-sm font-semibold text-secondary">
          <Plus className="h-4 w-4" />
          Condición
        </button>
      </div>
    </div>
    <aside className="space-y-4 rounded-lg border border-surface-container-highest bg-white p-5">
      <h2 className="font-semibold text-secondary">Vista previa</h2>
      <p className="rounded-md bg-surface-container-low p-3 text-sm leading-6 text-secondary">{preview}</p>
      {accionOptions.length ? (
        <Select label="Acción Sugerida" value={ruleForm.accion} onChange={(v) => setRuleForm({ ...ruleForm, accion: v })} options={accionOptions} help="Acción existente que verá el analista cuando la regla se cumpla." />
      ) : (
        <Field label="Acción Sugerida" value={ruleForm.accion} onChange={(v) => setRuleForm({ ...ruleForm, accion: v })} placeholder="Ej. REVISION_MANUAL" help="Acción que verá el analista cuando la regla se cumpla." />
      )}
      <button onClick={saveRule} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        <Save className="h-4 w-4" />
        Guardar Regla
      </button>
    </aside>
  </section>
);

const RuleDrawer = ({ mode, rule, draft, setDraft, condiciones, setCondiciones, escenarioOptions, accionOptions, factOptions, factDefinitions, factValueOptions, close, save, saving }: {
  mode: RuleFormMode;
  rule: ReglaRiesgo;
  draft: RuleDraft;
  setDraft: (value: RuleDraft) => void;
  condiciones: CondicionRegla[];
  setCondiciones: (value: CondicionRegla[]) => void;
  escenarioOptions: SelectOption[];
  accionOptions: SelectOption[];
  factOptions: SelectOption[];
  factDefinitions: RuleFactDefinition[];
  factValueOptions: RelationOptions;
  close: () => void;
  save: () => void;
  saving: boolean;
}) => {
  const readonly = mode === 'detail';
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-container-highest bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold text-secondary">{readonly ? 'Detalle De La Regla' : 'Editar Regla'}</h2>
            <p className="text-xs text-secondary/60">{rule.codigo} - Versión {rule.version}</p>
          </div>
          <button onClick={close} className="rounded-md p-2 text-secondary hover:bg-surface-container-low"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-5">
          {readonly ? (
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnly label="ID" value={String(rule.id)} />
              <ReadOnly label="Código" value={rule.codigo || '-'} />
              <ReadOnly label="Nombre" value={rule.nombre || '-'} />
              <ReadOnly label="Escenario" value={rule.escenarioNombre || '-'} />
              <ReadOnly label="Estado" value={titleize(rule.estado)} />
              <ReadOnly label="Severidad" value={titleize(rule.severidad)} />
              <ReadOnly label="Prioridad" value={String(rule.prioridad ?? '-')} />
              <ReadOnly label="Score" value={String(rule.score ?? '-')} />
              <ReadOnly label="Descripción" value={rule.descripcion || '-'} />
              <ReadOnly label="Condición Legible" value={rule.condicion || '-'} />
              <ReadOnly label="Condiciones JSON" value={rule.condicionesJson || '-'} />
              <ReadOnly label="Acciones JSON" value={rule.accionesJson || '-'} />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Código" value={draft.codigo} onChange={(value) => setDraft({ ...draft, codigo: value })} placeholder="Ej. RG_MONTO_ALTO_V1" help="Identificador único de esta versión de regla." />
                <Field label="Nombre" value={draft.nombre} onChange={(value) => setDraft({ ...draft, nombre: value })} placeholder="Nombre visible de la regla" help="Nombre usado en listados, alertas e historial." />
                <Select label="Escenario" value={String(draft.escenarioId || '')} onChange={(value) => setDraft({ ...draft, escenarioId: Number(value) })} options={[['', 'Selecciona un escenario'], ...escenarioOptions]} help="Escenario existente donde se agrupa la regla." />
                <Select label="Estado" value={draft.estado} onChange={(value) => setDraft({ ...draft, estado: value as EstadoRegla })} options={[['BORRADOR', 'Borrador'], ['EN_PRUEBA', 'En Prueba'], ['ACTIVA', 'Activa'], ['INACTIVA', 'Inactiva']]} help="Estado operativo de la regla." />
                <Select label="Severidad" value={draft.severidad} onChange={(value) => setDraft({ ...draft, severidad: value as SeveridadRegla })} options={['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map((value) => [value, titleize(value)])} help="Impacto de riesgo cuando la regla se cumple." />
                <Field label="Prioridad" type="number" value={String(draft.prioridad)} onChange={(value) => setDraft({ ...draft, prioridad: Number(value) })} placeholder="Ej. 1" help="Orden relativo de evaluación." />
                <Field label="Score" type="number" value={String(draft.score)} onChange={(value) => setDraft({ ...draft, score: Number(value) })} placeholder="Ej. 40" help="Puntos que aporta si se cumple." />
                {accionOptions.length ? (
                  <Select label="Acción Sugerida" value={draft.accion} onChange={(value) => setDraft({ ...draft, accion: value })} options={accionOptions} help="Acción sugerida para el analista." />
                ) : (
                  <Field label="Acción Sugerida" value={draft.accion} onChange={(value) => setDraft({ ...draft, accion: value })} placeholder="Ej. REVISION_MANUAL" help="Acción sugerida para el analista." />
                )}
              </div>
              <label className="block text-sm font-medium text-secondary">
                Descripción
                <textarea
                  value={draft.descripcion}
                  onChange={(event) => setDraft({ ...draft, descripcion: event.target.value })}
                  className="mt-1 min-h-20 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20"
                  placeholder="Explica el objetivo y el riesgo cubierto por esta regla..."
                />
                <span className="mt-1 block text-xs font-normal text-secondary/50">Texto de ayuda para comprender la regla sin leer JSON.</span>
              </label>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-secondary">Condiciones</h3>
                {condiciones.map((condition, index) => (
                  <div key={index} className="grid gap-2 rounded-md border border-surface-container-highest p-3 md:grid-cols-[1fr_180px_1fr_44px]">
                    <ConditionFields
                      condition={condition}
                      factOptions={factOptions}
                      factDefinitions={factDefinitions}
                      factValueOptions={factValueOptions}
                      onChange={(patch) => setCondiciones(updateConditionSmart(condiciones, index, patch, factDefinitions))}
                    />
                    <button onClick={() => setCondiciones(condiciones.filter((_, current) => current !== index))} className="mt-6 rounded-md p-2 text-critical hover:bg-critical/10" title="Quitar condición">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setCondiciones([...condiciones, { fact: 'canal', operador: '==', valor: '' }])} className="flex items-center gap-2 rounded-md border border-surface-container-highest px-3 py-2 text-sm font-semibold text-secondary">
                  <Plus className="h-4 w-4" />
                  Agregar Condición
                </button>
              </div>
              <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ConditionFields = ({ condition, factOptions, factDefinitions, factValueOptions, onChange }: {
  condition: CondicionRegla;
  factOptions: SelectOption[];
  factDefinitions: RuleFactDefinition[];
  factValueOptions: RelationOptions;
  onChange: (patch: Partial<CondicionRegla>) => void;
}) => {
  const definition = factDefinitions.find((fact) => fact.fact === condition.fact) || fallbackFacts[0];
  const operatorOptions = definition.operadores.map((operator) => [operator, operatorLabels[operator]] as SelectOption);
  const valueOptions = definition.catalogo ? factValueOptions[definition.catalogo] || [] : [];

  return (
    <>
      <Select
        label="Dato"
        value={condition.fact}
        onChange={(value) => onChange({ fact: value })}
        options={factOptions}
        help="Dato de la transaccion o del cliente que evaluara el motor."
      />
      <Select
        label="Operador"
        value={condition.operador}
        onChange={(value) => onChange({ operador: value as CondicionRegla['operador'] })}
        options={operatorOptions}
        help={`Operadores permitidos para ${definition.etiqueta.toLowerCase()}.`}
      />
      {definition.tipo === 'CATALOGO' && valueOptions.length ? (
        <Select
          label="Valor"
          value={String(condition.valor ?? '')}
          onChange={(value) => onChange({ valor: condition.operador === 'in' ? parseValue(value) : value })}
          options={[['', 'Selecciona un valor'], ...valueOptions]}
          help="Valor cargado desde el catalogo correspondiente."
        />
      ) : definition.tipo === 'BOOLEANO' || definition.tipo === 'EXISTENCIA' ? (
        <Select
          label="Valor"
          value={String(condition.valor ?? true)}
          onChange={(value) => onChange({ valor: value === 'true' })}
          options={[['true', 'Si'], ['false', 'No']]}
          help="Indica si la condicion debe cumplirse o no."
        />
      ) : (
        <Field
          label="Valor"
          type="number"
          value={Array.isArray(condition.valor) ? condition.valor.join(',') : String(condition.valor ?? '')}
          onChange={(value) => onChange({ valor: parseValue(value) })}
          placeholder={condition.operador === 'between' ? 'Ej. 10000,20000' : 'Ej. 10000'}
          help="Para rangos usa dos numeros separados por coma."
        />
      )}
    </>
  );
};

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
            {columns.map((column) => <th key={column} className="px-4 py-3">{titleize(column)}</th>)}
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-surface-container-highest bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold text-secondary">{mode === 'create' ? 'Nuevo Registro' : mode === 'edit' ? 'Editar Registro' : 'Detalle Del Registro'}</h2>
            <p className="text-xs text-secondary/60">{titleize(schema.table)}</p>
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
              options={field.relation && field.relationType ? relationOptions[field.relationType] || [] : []}
            />
          ))}
          {!readonly && (
            <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DynamicField = ({ field, value, readonly, onChange, options }: {
  field: EntityFieldSchema;
  value: unknown;
  readonly: boolean;
  onChange: (value: string) => void;
  options: SelectOption[];
}) => {
  const label = field.relation ? `${titleize(field.name)} ID` : titleize(field.name);
  const help = field.relation
    ? `Selecciona un registro existente de ${titleize(field.relationType || field.name)}.`
    : fieldHelp(field);
  if (readonly) return <ReadOnly label={label} value={renderCell(value)} />;
  if (field.relation && options.length) {
    return <Select label={label} value={value == null ? '' : String(value)} onChange={onChange} options={[['', 'Selecciona una opción'], ...options]} help={help} />;
  }
  return <Field label={label} value={value == null ? '' : String(value)} onChange={onChange} type={inputType(field)} placeholder={placeholderForField(field)} help={help} />;
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
        <Field
          key={key}
          label={titleize(key)}
          type={key === 'monto' ? 'number' : key === 'fechaHora' ? 'datetime-local' : 'text'}
          value={String(value)}
          onChange={(v) => setSimForm({ ...simForm, [key]: key === 'monto' ? Number(v) : v })}
          placeholder={simPlaceholders[key as keyof SimForm]}
          help={simHelp[key as keyof SimForm]}
        />
      ))}
      <button onClick={runSimulation} disabled={saving} className="md:col-span-2 rounded-md bg-primary-container px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        Ejecutar Simulación
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

const Field = ({ label, value, onChange, type = 'text', placeholder, help }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  help?: string;
}) => (
  <label className="block text-sm font-medium text-secondary">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20"
    />
    {help && <span className="mt-1 block text-xs font-normal text-secondary/50">{help}</span>}
  </label>
);

const Select = ({ label, value, onChange, options, help }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; help?: string }) => (
  <label className="block text-sm font-medium text-secondary">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-container/20">
      {options.map(([optionValue, labelValue]) => <option key={optionValue} value={optionValue}>{labelValue}</option>)}
    </select>
    {help && <span className="mt-1 block text-xs font-normal text-secondary/50">{help}</span>}
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

const PaginationControls = ({ total, page, pageSize, onPageChange, onPageSizeChange }: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  return (
    <div className="flex flex-col gap-3 border-t border-surface-container-highest px-4 py-3 text-sm text-secondary/70 md:flex-row md:items-center md:justify-between">
      <p>{from}-{to} de {total} registros</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Por Página"
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          options={pageSizeOptions.map((value) => [String(value), String(value)])}
          help="Cambia la cantidad mostrada."
        />
        <button
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="rounded-md border border-surface-container-highest px-3 py-2 font-semibold text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="px-2 font-semibold text-secondary">Página {safePage} de {totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="rounded-md border border-surface-container-highest px-3 py-2 font-semibold text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

const updateCondition = (conditions: CondicionRegla[], index: number, patch: Partial<CondicionRegla>) =>
  conditions.map((condition, currentIndex) => currentIndex === index ? { ...condition, ...patch } : condition);

const updateConditionSmart = (
  conditions: CondicionRegla[],
  index: number,
  patch: Partial<CondicionRegla>,
  definitions: RuleFactDefinition[]
) => {
  const current = conditions[index];
  if (patch.fact && patch.fact !== current.fact) {
    const definition = definitions.find((fact) => fact.fact === patch.fact) || fallbackFacts[0];
    return updateCondition(conditions, index, {
      fact: patch.fact,
      operador: definition.operadores[0],
      valor: defaultValueForFact(definition),
    });
  }
  if (patch.operador && patch.operador !== current.operador) {
    const definition = definitions.find((fact) => fact.fact === current.fact) || fallbackFacts[0];
    return updateCondition(conditions, index, {
      operador: patch.operador,
      valor: patch.operador === 'between' ? [0, 0] : defaultValueForFact(definition),
    });
  }
  return updateCondition(conditions, index, patch);
};

const defaultValueForFact = (definition: RuleFactDefinition): CondicionRegla['valor'] => {
  if (definition.tipo === 'NUMERICO') return 0;
  if (definition.tipo === 'BOOLEANO' || definition.tipo === 'EXISTENCIA') return true;
  return '';
};

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

const placeholderForField = (field: EntityFieldSchema) => {
  if (field.relation) return 'Ej. 1';
  if (inputType(field) === 'number') return 'Ej. 100';
  if (inputType(field) === 'date') return 'Selecciona una fecha';
  if (inputType(field) === 'time') return 'Selecciona una hora';
  if (inputType(field) === 'datetime-local') return 'Selecciona fecha y hora';
  return `Ingresa ${titleize(field.name).toLowerCase()}`;
};

const fieldHelp = (field: EntityFieldSchema) => {
  if (field.type.includes('Boolean')) return 'Usa true o false según corresponda.';
  if (['Long', 'Integer', 'Short', 'BigDecimal'].includes(field.type)) return 'Ingresa solo valores numéricos.';
  if (field.type.includes('Date') || field.type.includes('Time')) return 'Respeta el formato de fecha u hora solicitado.';
  if (field.type.includes('Enum') || field.type === 'String') return 'Completa el valor según el catálogo o formato esperado.';
  return `Campo tipo ${field.type}.`;
};

const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const start = (Math.max(1, page) - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const titleize = (value: string) => {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim();
  if (!normalized) return value;
  return normalized
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      const accents: Record<string, string> = {
        codigo: 'Código',
        descripcion: 'Descripción',
        accion: 'Acción',
        simulacion: 'Simulación',
        pais: 'País',
        catalogos: 'Catálogos',
        critica: 'Crítica',
      };
      if (accents[lower]) return accents[lower];
      if (word.toUpperCase() === word && word.length <= 4) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
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

const optionLabel = (item: EntityRecord) => {
  const codigo = item.codigo ?? item.codigoIso;
  const nombre = item.nombre ?? item.descripcion ?? item.email ?? item.numeroDocumento ?? item.titulo;
  if (codigo && nombre) return `${String(codigo)} - ${String(nombre)}`;
  if (nombre) return String(nombre);
  if (codigo) return String(codigo);
  return `Registro #${String(item.id ?? '-')}`;
};

const catalogValue = (item: EntityRecord) => String(item.codigo ?? item.codigoIso ?? item.nombre ?? item.id ?? '');

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

const parseRuleConditions = (rule: ReglaRiesgo): CondicionRegla[] => {
  if (!rule.condicionesJson) return [{ fact: 'monto', operador: '>', valor: 10000 }];
  try {
    const parsed = JSON.parse(rule.condicionesJson) as { items?: CondicionRegla[] };
    return Array.isArray(parsed.items) && parsed.items.length ? parsed.items : [{ fact: 'monto', operador: '>', valor: 10000 }];
  } catch {
    return [{ fact: 'monto', operador: '>', valor: 10000 }];
  }
};

const firstActionCode = (rule: ReglaRiesgo) => {
  if (!rule.accionesJson) return null;
  try {
    const parsed = JSON.parse(rule.accionesJson) as Array<{ codigo?: string }> | string[] | number[];
    const first = Array.isArray(parsed) ? parsed[0] : null;
    if (typeof first === 'object' && first && 'codigo' in first) return first.codigo || null;
    if (typeof first === 'string') return first;
  } catch {
    return null;
  }
  return null;
};

export default RuleEngine;
