import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbSchema } from '../services/dbschema.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbInfo     { name: string; version: string; size: string; db_user: string; current_schema: string; }
interface SchemaInfo { schema_name: string; table_count: number; view_count: number; function_count: number; sequence_count: number; type_count: number; }
interface TableRow   { table_name: string; table_type: string; column_count: number; }
interface Column     { ordinal_position: number; column_name: string; data_type: string; udt_name: string; is_nullable: string; column_default: string | null; character_maximum_length: number | null; numeric_precision: number | null; numeric_scale: number | null; is_primary_key: boolean; }
interface Index      { indexname: string; indexdef: string; is_primary: boolean; is_unique: boolean; }
interface Constraint { constraint_name: string; constraint_type: string; columns: string[]; fk_schema?: string; fk_table?: string; fk_column?: string; update_rule?: string; delete_rule?: string; }
interface DbType     { type_name: string; kind: string; enum_values: string[]; }
interface DbFunction { routine_name: string; routine_type: string; return_type: string; routine_definition: string; language: string; }
interface Sequence   { sequence_name: string; data_type: string; start_value: string; minimum_value: string; maximum_value: string; increment: string; cycle_option: string; }

type SelType   = 'db' | 'schema' | 'table' | 'view' | 'type' | 'function' | 'sequence';
type Selection = { type: SelType; schema?: string; name?: string; };
type Tab       = 'columns' | 'indexes' | 'constraints' | 'script';

// ─── Constants ────────────────────────────────────────────────────────────────

const PG_TYPES = [
  'TEXT','VARCHAR(255)','CHAR(1)','INTEGER','BIGINT','SMALLINT','SERIAL','BIGSERIAL',
  'BOOLEAN','REAL','DOUBLE PRECISION','NUMERIC','DECIMAL(10,2)','DATE','TIMESTAMP',
  'TIMESTAMPTZ','JSON','JSONB','UUID','BYTEA','INET','CIDR',
];

const CON_COLOR: Record<string, string> = {
  'PRIMARY KEY': 'bg-amber-100 text-amber-800',
  'FOREIGN KEY': 'bg-blue-100  text-blue-800',
  'UNIQUE':      'bg-purple-100 text-purple-800',
  'CHECK':       'bg-green-100  text-green-800',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoDB = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
  </svg>
);
const IcoSchema = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
  </svg>
);
const IcoTable = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm1 2h8v2H6V5zm0 4h2v2H6V9zm4 0h2v2h-2V9zm-4 4h2v2H6v-2zm4 0h2v2h-2v-2z"/>
  </svg>
);
const IcoView = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
  </svg>
);
const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function DbSchemaPage() {
  const navigate = useNavigate();

  // Root data
  const [dbInfo,  setDbInfo]  = useState<DbInfo | null>(null);
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rootErr, setRootErr] = useState<string | null>(null);

  // Tree
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set(['db']));
  const [selection, setSelection] = useState<Selection | null>({ type: 'db' });

  // Per-schema/table caches
  const [tablesCache,  setTablesCache]  = useState<Record<string, TableRow[]>>({});
  const [columnsCache, setColumnsCache] = useState<Record<string, Column[]>>({});
  const [indexesCache, setIndexesCache] = useState<Record<string, Index[]>>({});
  const [consCache,    setConsCache]    = useState<Record<string, Constraint[]>>({});
  const [scriptsCache, setScriptsCache] = useState<Record<string, string>>({});
  const [typesCache,   setTypesCache]   = useState<Record<string, DbType[]>>({});
  const [funcsCache,   setFuncsCache]   = useState<Record<string, DbFunction[]>>({});
  const [seqsCache,    setSeqsCache]    = useState<Record<string, Sequence[]>>({});
  const [viewDefCache, setViewDefCache] = useState<Record<string, string>>({});

  // Loading keys
  const [fetching, setFetching] = useState<Set<string>>(new Set());

  // Detail
  const [tab,    setTab]    = useState<Tab>('columns');
  const [copied, setCopied] = useState(false);

  // Modals
  const [addModal,    setAddModal]    = useState<{ schema: string; table: string } | null>(null);
  const [renameModal, setRenameModal] = useState<{ schema: string; table: string; column: string } | null>(null);
  const [addForm,     setAddForm]     = useState({ columnName: '', dataType: 'TEXT', nullable: true, defaultValue: '' });
  const [renameNew,   setRenameNew]   = useState('');
  const [actLoading,  setActLoading]  = useState(false);
  const [actMsg,      setActMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // ─── Initial load ──────────────────────────────────────────────────────────

  const loadRoot = useCallback(() => {
    setLoading(true);
    setRootErr(null);
    Promise.all([dbSchema.getInfo(), dbSchema.getSchemas()])
      .then(([info, scs]) => { setDbInfo(info); setSchemas(scs); })
      .catch(e => setRootErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRoot(); }, [loadRoot]);

  // ─── Lazy fetchers ─────────────────────────────────────────────────────────

  const startFetch = (key: string, fn: () => Promise<void>) => {
    if (fetching.has(key)) return;
    setFetching(p => new Set([...p, key]));
    fn().finally(() => setFetching(p => { const n = new Set(p); n.delete(key); return n; }));
  };

  const fetchTables = useCallback((schema: string) => {
    if (tablesCache[schema]) return;
    startFetch(`tables:${schema}`, async () => {
      const data = await dbSchema.getTables(schema);
      setTablesCache(p => ({ ...p, [schema]: data }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesCache]);

  const fetchTypes = useCallback((schema: string) => {
    if (typesCache[schema]) return;
    startFetch(`types:${schema}`, async () => {
      const data = await dbSchema.getTypes(schema);
      setTypesCache(p => ({ ...p, [schema]: data }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesCache]);

  const fetchFunctions = useCallback((schema: string) => {
    if (funcsCache[schema]) return;
    startFetch(`functions:${schema}`, async () => {
      const data = await dbSchema.getFunctions(schema);
      setFuncsCache(p => ({ ...p, [schema]: data }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funcsCache]);

  const fetchSequences = useCallback((schema: string) => {
    if (seqsCache[schema]) return;
    startFetch(`sequences:${schema}`, async () => {
      const data = await dbSchema.getSequences(schema);
      setSeqsCache(p => ({ ...p, [schema]: data }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seqsCache]);

  // Fetch table details when table is selected
  useEffect(() => {
    if (!selection) return;
    const { type, schema, name } = selection;
    if (type === 'table' && schema && name) {
      const k = `${schema}.${name}`;
      if (!columnsCache[k])  dbSchema.getColumns(schema, name).then(d => setColumnsCache(p => ({ ...p, [k]: d }))).catch(() => {});
      if (!indexesCache[k])  dbSchema.getIndexes(schema, name).then(d => setIndexesCache(p => ({ ...p, [k]: d }))).catch(() => {});
      if (!consCache[k])     dbSchema.getConstraints(schema, name).then(d => setConsCache(p => ({ ...p, [k]: d }))).catch(() => {});
    }
    if (type === 'view' && schema && name) {
      const k = `${schema}.${name}`;
      if (!viewDefCache[k])  dbSchema.getViewDefinition(schema, name).then(d => setViewDefCache(p => ({ ...p, [k]: d?.view_definition || '' }))).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  const ensureScript = (schema: string, name: string) => {
    const k = `${schema}.${name}`;
    if (scriptsCache[k]) return;
    dbSchema.getTableScript(schema, name).then(d => setScriptsCache(p => ({ ...p, [k]: d.script }))).catch(() => {});
  };

  // ─── Tree helpers ──────────────────────────────────────────────────────────

  const toggle = (id: string) =>
    setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openFolder = (kind: string, schema: string) => {
    if (kind === 'tables' || kind === 'views') fetchTables(schema);
    if (kind === 'types')     fetchTypes(schema);
    if (kind === 'functions') fetchFunctions(schema);
    if (kind === 'sequences') fetchSequences(schema);
    toggle(`${kind}:${schema}`);
  };

  const isSel = (s: Selection) =>
    selection?.type === s.type && selection?.schema === s.schema && selection?.name === s.name;

  const rowCls = (s: Selection) =>
    `flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-sm transition-colors ${
      isSel(s) ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-700 hover:bg-slate-100'
    }`;

  // ─── Copy ──────────────────────────────────────────────────────────────────

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ─── DDL actions ──────────────────────────────────────────────────────────

  const doAddColumn = async () => {
    if (!addModal) return;
    setActLoading(true);
    try {
      const r = await dbSchema.addColumn(addModal.schema, addModal.table, addForm);
      setActMsg({ ok: true, text: r.message });
      const k = `${addModal.schema}.${addModal.table}`;
      setColumnsCache(p => { const n = { ...p }; delete n[k]; return n; });
      setTimeout(() => { setAddModal(null); setActMsg(null); setAddForm({ columnName: '', dataType: 'TEXT', nullable: true, defaultValue: '' }); }, 1500);
    } catch (e: any) {
      setActMsg({ ok: false, text: e.response?.data?.message || e.message });
    } finally { setActLoading(false); }
  };

  const doRenameColumn = async () => {
    if (!renameModal) return;
    setActLoading(true);
    try {
      const r = await dbSchema.renameColumn(renameModal.schema, renameModal.table, { oldName: renameModal.column, newName: renameNew });
      setActMsg({ ok: true, text: r.message });
      const k = `${renameModal.schema}.${renameModal.table}`;
      setColumnsCache(p => { const n = { ...p }; delete n[k]; return n; });
      setTimeout(() => { setRenameModal(null); setRenameNew(''); setActMsg(null); }, 1500);
    } catch (e: any) {
      setActMsg({ ok: false, text: e.response?.data?.message || e.message });
    } finally { setActLoading(false); }
  };

  const resetAllCaches = () => {
    setTablesCache({}); setColumnsCache({}); setIndexesCache({}); setConsCache({});
    setScriptsCache({}); setTypesCache({}); setFuncsCache({}); setSeqsCache({}); setViewDefCache({});
    setExpanded(new Set(['db']));
    loadRoot();
  };

  // ─── Tree ─────────────────────────────────────────────────────────────────

  const renderTree = () => {
    if (loading) return <div className="p-4 text-sm text-slate-400 animate-pulse">Loading...</div>;
    if (rootErr)  return <div className="p-4 text-sm text-red-500">{rootErr}</div>;

    const dbOpen = expanded.has('db');

    return (
      <div className="select-none py-1">
        {/* Database node */}
        <div
          onClick={() => { setSelection({ type: 'db' }); toggle('db'); }}
          className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer font-semibold rounded mx-1 transition-colors ${isSel({ type: 'db' }) ? 'bg-blue-100 text-blue-800' : 'text-slate-800 hover:bg-slate-100'}`}
        >
          <Chevron open={dbOpen} />
          <span className="text-blue-600"><IcoDB /></span>
          <span className="truncate text-sm">{dbInfo?.name || 'Database'}</span>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">DB</span>
        </div>

        {dbOpen && schemas.map(sc => {
          const scOpen  = expanded.has(`schema:${sc.schema_name}`);
          const tbRows  = tablesCache[sc.schema_name] || [];
          const bTables = tbRows.filter(t => t.table_type === 'BASE TABLE');
          const bViews  = tbRows.filter(t => t.table_type === 'VIEW');

          type FolderDef = {
            key: string; label: string; count: number;
            icon: React.ReactNode; selType: SelType;
            items: { name: string; colCount?: number }[];
          };

          const folders: FolderDef[] = [
            {
              key: 'tables', label: 'Tables', count: sc.table_count,
              icon: <IcoTable />, selType: 'table',
              items: bTables.map(t => ({ name: t.table_name, colCount: t.column_count })),
            },
            {
              key: 'views', label: 'Views', count: sc.view_count,
              icon: <IcoView />, selType: 'view',
              items: bViews.map(t => ({ name: t.table_name })),
            },
            {
              key: 'types', label: 'Types', count: sc.type_count,
              icon: <span className="text-xs font-bold text-purple-600 w-3.5 text-center">T</span>,
              selType: 'type',
              items: (typesCache[sc.schema_name] || []).map(t => ({ name: t.type_name })),
            },
            {
              key: 'functions', label: 'Functions', count: sc.function_count,
              icon: <span className="text-xs font-bold text-green-600 w-3.5 text-center">ƒ</span>,
              selType: 'function',
              items: (funcsCache[sc.schema_name] || []).map(f => ({ name: f.routine_name })),
            },
            {
              key: 'sequences', label: 'Sequences', count: sc.sequence_count,
              icon: <span className="text-xs font-bold text-orange-500 w-3.5 text-center">⚡</span>,
              selType: 'sequence',
              items: (seqsCache[sc.schema_name] || []).map(s => ({ name: s.sequence_name })),
            },
          ];

          return (
            <div key={sc.schema_name} className="ml-2">
              {/* Schema node */}
              <div
                onClick={() => { setSelection({ type: 'schema', schema: sc.schema_name }); toggle(`schema:${sc.schema_name}`); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer font-medium rounded mx-1 transition-colors ${isSel({ type: 'schema', schema: sc.schema_name }) ? 'bg-blue-100 text-blue-800' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <Chevron open={scOpen} />
                <span className="text-blue-500"><IcoSchema /></span>
                <span className="text-sm">{sc.schema_name}</span>
              </div>

              {scOpen && (
                <div className="ml-4 border-l border-slate-200 pl-1">
                  {folders.map(folder => {
                    const fKey   = `${folder.key}:${sc.schema_name}`;
                    const fOpen  = expanded.has(fKey);
                    const isLoading = fetching.has(`${folder.key}:${sc.schema_name}`) ||
                      (folder.key === 'views' && fetching.has(`tables:${sc.schema_name}`));

                    return (
                      <div key={folder.key}>
                        <div
                          onClick={() => openFolder(folder.key, sc.schema_name)}
                          className="flex items-center gap-1.5 px-2 py-1 cursor-pointer text-slate-500 hover:bg-slate-100 rounded mx-1 transition-colors"
                        >
                          <Chevron open={fOpen} />
                          {folder.icon}
                          <span className="text-xs font-semibold uppercase tracking-wide">{folder.label}</span>
                          <span className="ml-auto text-xs text-slate-400 tabular-nums">
                            {isLoading ? <span className="animate-pulse">…</span> : folder.count}
                          </span>
                        </div>

                        {fOpen && (
                          <div className="ml-4">
                            {folder.items.length === 0 && !isLoading && (
                              <div className="px-3 py-1 text-xs text-slate-400 italic">empty</div>
                            )}
                            {folder.items.map(item => (
                              <div
                                key={item.name}
                                onClick={() => setSelection({ type: folder.selType, schema: sc.schema_name, name: item.name })}
                                className={rowCls({ type: folder.selType, schema: sc.schema_name, name: item.name })}
                              >
                                {folder.icon}
                                <span className="truncate font-mono text-xs flex-1">{item.name}</span>
                                {item.colCount !== undefined && (
                                  <span className="text-xs text-slate-400 tabular-nums">{item.colCount}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Detail panel ─────────────────────────────────────────────────────────

  const renderDetail = () => {
    if (!selection) return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Select an item from the tree
      </div>
    );

    // DB info
    if (selection.type === 'db' && dbInfo) {
      return (
        <div className="p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2 bg-blue-100 rounded-lg text-blue-600"><IcoDB /></span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{dbInfo.name}</h2>
              <p className="text-sm text-slate-500">Connection Properties</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([['Database', dbInfo.name], ['User', dbInfo.db_user], ['Size', dbInfo.size], ['Default Schema', dbInfo.current_schema], ['Version', dbInfo.version]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{k}</div>
                <div className="text-sm font-medium text-slate-800 break-all font-mono">{v}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Schema overview
    if (selection.type === 'schema' && selection.schema) {
      const sc = schemas.find(s => s.schema_name === selection.schema);
      if (!sc) return null;
      return (
        <div className="p-6 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2 bg-blue-100 rounded-lg text-blue-500"><IcoSchema /></span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{sc.schema_name}</h2>
              <p className="text-sm text-slate-500">Schema Overview</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              ['Tables',    sc.table_count,    'text-blue-700',   'bg-blue-50   border-blue-100'],
              ['Views',     sc.view_count,     'text-indigo-700', 'bg-indigo-50 border-indigo-100'],
              ['Types',     sc.type_count,     'text-purple-700', 'bg-purple-50 border-purple-100'],
              ['Functions', sc.function_count, 'text-green-700',  'bg-green-50  border-green-100'],
              ['Sequences', sc.sequence_count, 'text-orange-700', 'bg-orange-50 border-orange-100'],
            ] as [string, number, string, string][]).map(([label, count, txt, bg]) => (
              <div key={label} className={`rounded-lg border p-4 ${bg}`}>
                <div className={`text-3xl font-bold ${txt}`}>{count}</div>
                <div className={`text-xs mt-1 ${txt} opacity-70`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // View definition
    if (selection.type === 'view' && selection.schema && selection.name) {
      const def = viewDefCache[`${selection.schema}.${selection.name}`];
      return (
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="text-indigo-500"><IcoView /></span>
              <span className="text-slate-400 font-normal text-sm">{selection.schema}.</span>
              {selection.name}
            </h2>
            {def && (
              <button onClick={() => copy(def)} className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors">
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
            )}
          </div>
          {def !== undefined
            ? <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-auto flex-1 font-mono leading-relaxed">{def || '(empty definition)'}</pre>
            : <div className="text-slate-400 text-sm animate-pulse">Loading definition…</div>
          }
        </div>
      );
    }

    // Type / Enum
    if (selection.type === 'type' && selection.schema) {
      const t = (typesCache[selection.schema] || []).find(x => x.type_name === selection.name);
      if (!t) return <div className="p-6 text-slate-400 text-sm animate-pulse">Loading…</div>;
      return (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-lg text-purple-700 font-bold text-sm">T</span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                <span className="text-slate-400 font-normal text-sm">{selection.schema}.</span>{t.type_name}
              </h2>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{t.kind}</span>
            </div>
          </div>
          {t.enum_values?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Enum Values ({t.enum_values.length})</div>
              <div className="flex flex-wrap gap-2">
                {t.enum_values.map((v, i) => (
                  <span key={i} onClick={() => copy(v)} className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 font-mono cursor-pointer hover:bg-purple-100 transition-colors">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Function
    if (selection.type === 'function' && selection.schema) {
      const fn = (funcsCache[selection.schema] || []).find(x => x.routine_name === selection.name);
      if (!fn) return <div className="p-6 text-slate-400 text-sm animate-pulse">Loading…</div>;
      return (
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              <span className="text-slate-400 font-normal text-sm">{selection.schema}.</span>{fn.routine_name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{fn.routine_type}</span>
              <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">{fn.language}</span>
              <span className="text-xs text-slate-500">→ {fn.return_type}</span>
            </div>
          </div>
          {fn.routine_definition
            ? <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-auto flex-1 font-mono leading-relaxed">{fn.routine_definition}</pre>
            : <div className="text-slate-400 text-sm">(no definition available)</div>
          }
        </div>
      );
    }

    // Sequence
    if (selection.type === 'sequence' && selection.schema) {
      const sq = (seqsCache[selection.schema] || []).find(x => x.sequence_name === selection.name);
      if (!sq) return <div className="p-6 text-slate-400 text-sm animate-pulse">Loading…</div>;
      return (
        <div className="p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-lg text-orange-600 font-bold">⚡</span>
            <h2 className="text-lg font-bold text-slate-800">
              <span className="text-slate-400 font-normal text-sm">{selection.schema}.</span>{sq.sequence_name}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([['Data Type', sq.data_type], ['Start', sq.start_value], ['Min', sq.minimum_value], ['Max', sq.maximum_value], ['Increment', sq.increment], ['Cycle', sq.cycle_option]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{k}</div>
                <div className="text-sm font-mono font-medium text-slate-800 truncate">{v}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Table detail
    if (selection.type === 'table' && selection.schema && selection.name) {
      const key  = `${selection.schema}.${selection.name}`;
      const cols = columnsCache[key];
      const idxs = indexesCache[key];
      const cons = consCache[key];
      const scr  = scriptsCache[key];

      return (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-600"><IcoTable /></span>
              <span className="text-slate-400 font-normal text-sm">{selection.schema}.</span>
              {selection.name}
              {cols && <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cols.length} columns</span>}
            </h2>
            <button
              onClick={() => { setAddModal({ schema: selection.schema!, table: selection.name! }); setActMsg(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Add Column
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 px-5 flex-shrink-0">
            {(['columns', 'indexes', 'constraints', 'script'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === 'script') ensureScript(selection.schema!, selection.name!); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                  tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t}
                {t === 'columns'     && cols && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{cols.length}</span>}
                {t === 'indexes'     && idxs && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{idxs.length}</span>}
                {t === 'constraints' && cons && <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">{cons.length}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4">

            {/* Columns */}
            {tab === 'columns' && (
              !cols
                ? <div className="text-slate-400 text-sm animate-pulse pt-4">Loading columns…</div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          {['#', 'Column Name', 'Data Type', 'Nullable', 'Default', 'PK', 'Actions'].map(h => (
                            <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cols.map(col => {
                          const typeLbl =
                            col.data_type === 'character varying'
                              ? `varchar${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`
                            : col.data_type === 'USER-DEFINED' ? col.udt_name
                            : col.data_type;
                          return (
                            <tr key={col.column_name} className="hover:bg-slate-50 border-b border-slate-100">
                              <td className="px-3 py-2 text-slate-400 border border-slate-200 text-center w-8">{col.ordinal_position}</td>
                              <td className="px-3 py-2 font-mono text-slate-800 border border-slate-200">{col.column_name}</td>
                              <td className="px-3 py-2 border border-slate-200">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">{typeLbl}</span>
                              </td>
                              <td className="px-3 py-2 text-center border border-slate-200">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${col.is_nullable === 'YES' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600 font-medium'}`}>
                                  {col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs font-mono text-slate-500 border border-slate-200 max-w-[160px]">
                                <span className="block truncate" title={col.column_default || ''}>{col.column_default || '—'}</span>
                              </td>
                              <td className="px-3 py-2 text-center border border-slate-200 w-8">
                                {col.is_primary_key && <span title="Primary Key">🔑</span>}
                              </td>
                              <td className="px-3 py-2 border border-slate-200">
                                <button
                                  onClick={() => { setRenameModal({ schema: selection.schema!, table: selection.name!, column: col.column_name }); setRenameNew(col.column_name); setActMsg(null); }}
                                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                                >
                                  Rename
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
            )}

            {/* Indexes */}
            {tab === 'indexes' && (
              !idxs
                ? <div className="text-slate-400 text-sm animate-pulse pt-4">Loading indexes…</div>
                : idxs.length === 0
                  ? <div className="text-slate-400 text-sm pt-4">No indexes found.</div>
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            {['Index Name', 'Primary', 'Unique', 'Definition'].map(h => (
                              <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {idxs.map(idx => (
                            <tr key={idx.indexname} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono text-slate-800 text-xs border border-slate-200">{idx.indexname}</td>
                              <td className="px-3 py-2 text-center border border-slate-200 text-emerald-600">{idx.is_primary && '✓'}</td>
                              <td className="px-3 py-2 text-center border border-slate-200 text-blue-600">{idx.is_unique && '✓'}</td>
                              <td className="px-3 py-2 text-xs font-mono text-slate-500 border border-slate-200 max-w-xs">
                                <span className="block truncate" title={idx.indexdef}>{idx.indexdef}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
            )}

            {/* Constraints */}
            {tab === 'constraints' && (
              !cons
                ? <div className="text-slate-400 text-sm animate-pulse pt-4">Loading constraints…</div>
                : cons.length === 0
                  ? <div className="text-slate-400 text-sm pt-4">No constraints found.</div>
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            {['Constraint Name', 'Type', 'Columns', 'References'].map(h => (
                              <th key={h} className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cons.map(con => (
                            <tr key={con.constraint_name} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono text-xs text-slate-800 border border-slate-200">{con.constraint_name}</td>
                              <td className="px-3 py-2 border border-slate-200">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CON_COLOR[con.constraint_type] || 'bg-slate-100 text-slate-600'}`}>
                                  {con.constraint_type}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs font-mono text-slate-600 border border-slate-200">
                                {Array.isArray(con.columns) ? con.columns.join(', ') : con.columns}
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-500 border border-slate-200">
                                {con.fk_table ? `${con.fk_schema}.${con.fk_table}(${con.fk_column})` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
            )}

            {/* Script */}
            {tab === 'script' && (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-500">CREATE TABLE script</span>
                  <button
                    onClick={() => scr && copy(scr)}
                    disabled={!scr}
                    className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    {copied ? '✓ Copied!' : '⎘ Copy Script'}
                  </button>
                </div>
                {!scr
                  ? <div className="text-slate-400 text-sm animate-pulse">Loading script…</div>
                  : <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-xl overflow-auto font-mono leading-relaxed whitespace-pre">{scr}</pre>
                }
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div style={{ backgroundColor: '#1a3a6b' }} className="flex items-center justify-between px-5 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white text-sm transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div className="w-px h-5 bg-slate-600" />
          <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
          </svg>
          <span className="text-white font-semibold text-sm">Database Explorer</span>
          {dbInfo && (
            <>
              <div className="w-px h-4 bg-slate-600" />
              <span className="text-blue-300 font-mono text-sm">{dbInfo.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {dbInfo && (
            <span className="text-slate-400 text-xs font-mono hidden md:block">
              {dbInfo.version?.split(' ').slice(0, 3).join(' ')}
            </span>
          )}
          {dbInfo && (
            <span className="text-slate-400 text-xs">
              Size: <span className="text-slate-300">{dbInfo.size}</span>
            </span>
          )}
          <button
            onClick={resetAllCaches}
            className="px-3 py-1.5 text-xs text-slate-300 border border-slate-600 rounded-lg hover:border-slate-400 hover:text-white transition-colors"
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Tree panel */}
        <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Object Explorer</span>
          </div>
          {renderTree()}
        </div>

        {/* Detail panel */}
        <div className="flex-1 bg-white overflow-auto min-h-0">
          {renderDetail()}
        </div>
      </div>

      {/* ── Add Column Modal ───────────────────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add Column</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{addModal.schema}.{addModal.table}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Column Name <span className="text-red-500">*</span></label>
                <input
                  autoFocus
                  type="text"
                  value={addForm.columnName}
                  onChange={e => setAddForm(f => ({ ...f, columnName: e.target.value }))}
                  placeholder="e.g. created_by"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Data Type <span className="text-red-500">*</span></label>
                <select
                  value={addForm.dataType}
                  onChange={e => setAddForm(f => ({ ...f, dataType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  {PG_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.nullable}
                  onChange={e => setAddForm(f => ({ ...f, nullable: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-sm text-slate-700">Nullable <span className="text-slate-400 text-xs">(allow NULL)</span></span>
              </label>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Value <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={addForm.defaultValue}
                  onChange={e => setAddForm(f => ({ ...f, defaultValue: e.target.value }))}
                  placeholder="e.g. now(), 0, 'active'"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              {actMsg && (
                <div className={`p-3 rounded-lg text-sm border ${actMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {actMsg.text}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setAddModal(null); setActMsg(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={doAddColumn}
                disabled={actLoading || !addForm.columnName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {actLoading ? 'Adding…' : 'Add Column'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename Column Modal ────────────────────────────────────────────── */}
      {renameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Rename Column</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{renameModal.schema}.{renameModal.table}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Name</label>
                <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600">
                  {renameModal.column}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Name <span className="text-red-500">*</span></label>
                <input
                  autoFocus
                  type="text"
                  value={renameNew}
                  onChange={e => setRenameNew(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              {actMsg && (
                <div className={`p-3 rounded-lg text-sm border ${actMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {actMsg.text}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setRenameModal(null); setActMsg(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={doRenameColumn}
                disabled={actLoading || !renameNew.trim() || renameNew === renameModal.column}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {actLoading ? 'Renaming…' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
