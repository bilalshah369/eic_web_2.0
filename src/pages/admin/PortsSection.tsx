import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, PIAPort } from '../../services/admin.service';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

function ib(extra?: React.CSSProperties): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0, color: 'var(--text-muted)', padding: 0, ...extra };
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 7, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' };

function Confirm({ msg, onOk, onCancel }: { msg: string; onOk: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px 28px', maxWidth: 360, width: '100%' }}>
        <p style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: 14 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '7px 18px', borderRadius: 7, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button onClick={onOk} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', backgroundColor: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function PortForm({ initial, onSave, onCancel, saving }: {
  initial?: PIAPort;
  onSave: (d: { name: string; code: string; state: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [err, setErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr('Port name is required'); return; }
    onSave({ name: name.trim(), code: code.trim(), state: state.trim() });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px 28px', width: 440 }}>
        <h3 style={{ margin: '0 0 18px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{initial ? 'Edit Port' : 'Add Port'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Port Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); setErr(''); }} style={{ ...inp, borderColor: err ? '#DC2626' : undefined }} placeholder="e.g. Visakhapatnam Port" autoFocus />
            {err && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{err}</p>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Port Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} style={inp} placeholder="e.g. INVTZ" />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>State</label>
            <select value={state} onChange={e => setState(e.target.value)} style={inp}>
              <option value="">— Select State —</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#94A3B8' : 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, boxShadow: saving ? 'none' : '0 4px 14px rgba(27,42,107,0.25)' }}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Port'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PortsSection() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<PIAPort | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PIAPort | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-pia-ports'],
    queryFn: () => adminApi.getPorts(),
    select: r => r.data?.data ?? [],
    staleTime: 60_000,
  });
  const items: PIAPort[] = raw ?? [];

  const createMut = useMutation({ mutationFn: (d: { name: string; code: string; state: string }) => adminApi.createPort(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-ports'] }); setShowCreate(false); } });
  const updateMut = useMutation({ mutationFn: (d: { id: string; name: string; code: string; state: string }) => adminApi.updatePort(d.id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-ports'] }); setEditTarget(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => adminApi.deletePort(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-ports'] }); setDeleteTarget(null); } });
  const toggleMut = useMutation({ mutationFn: (item: PIAPort) => adminApi.updatePort(item.id, { isActive: !item.isActive }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pia-ports'] }) });

  const allStates = Array.from(new Set(items.map(i => i.state).filter(Boolean) as string[])).sort();
  const filtered = items.filter(i => {
    const ms = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.code ?? '').toLowerCase().includes(search.toLowerCase());
    const mst = !stateFilter || i.state === stateFilter;
    return ms && mst;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Port & Location Master</h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>Manage ports and crushing sheds available for PIA scope ({items.length} total)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ports…"
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: 200 }} />
          </div>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', minWidth: 140 }}>
            <option value="">All States</option>
            {allStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || stateFilter) && <button onClick={() => { setSearch(''); setStateFilter(''); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Clear</button>}
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--bg-nav)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Port
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[{ label: 'Total', value: items.length }, { label: 'Active', value: items.filter(i => i.isActive).length }, { label: 'States', value: allStates.length }].map(s => (
          <div key={s.label} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>


      {isLoading ? (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--card-overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['#', 'Port Name', 'Code', 'State', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: i === 5 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{search || stateFilter ? 'No results.' : 'No ports added yet.'}</td></tr>
              ) : filtered.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{item.code || '—'}</td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{item.state || '—'}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 500, border: '1px solid', backgroundColor: item.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)', color: item.isActive ? '#16A34A' : '#6B7280', borderColor: item.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(156,163,175,0.3)' }}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => toggleMut.mutate(item)} title={item.isActive ? 'Deactivate' : 'Activate'} style={ib({ color: item.isActive ? '#D97706' : '#16A34A' })}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                      <button onClick={() => setEditTarget(item)} title="Edit" style={ib({ color: '#0369A1', borderColor: '#BFDBFE' })}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)'; }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteTarget(item)} title="Delete" style={ib({ color: '#DC2626', borderColor: '#FECACA' })}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-card)'; }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <PortForm onSave={d => createMut.mutate(d)} onCancel={() => setShowCreate(false)} saving={createMut.isPending} />}
      {editTarget && <PortForm initial={editTarget} onSave={d => updateMut.mutate({ id: editTarget.id, ...d })} onCancel={() => setEditTarget(null)} saving={updateMut.isPending} />}
      {deleteTarget && <Confirm msg={`Delete "${deleteTarget.name}"? This cannot be undone.`} onOk={() => deleteMut.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}


