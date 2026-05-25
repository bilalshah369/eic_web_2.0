import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, PIADocumentMaster } from '../../services/admin.service';

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 7, fontSize: 13,
  border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)',
  color: 'var(--text-primary)', boxSizing: 'border-box',
};
function ib(extra?: React.CSSProperties): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0, color: 'var(--text-muted)', padding: 0, ...extra };
}

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

function DocMasterForm({ initial, onSave, onCancel, saving }: {
  initial?: PIADocumentMaster;
  onSave: (d: { code: string; label: string; description: string; isRequired: boolean; sortOrder: number }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [code, setCode]             = useState(initial?.code ?? '');
  const [label, setLabel]           = useState(initial?.label ?? '');
  const [description, setDesc]      = useState(initial?.description ?? '');
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? true);
  const [sortOrder, setSortOrder]   = useState(initial?.sortOrder ?? 0);
  const [err, setErr]               = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setErr('Code is required'); return; }
    if (!label.trim()) { setErr('Label is required'); return; }
    onSave({ code: code.trim(), label: label.trim(), description: description.trim(), isRequired, sortOrder: Number(sortOrder) });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '28px', width: '100%', maxWidth: 500 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          {initial ? 'Edit Document' : 'Add Document'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Code *</label>
              <input value={code} onChange={e => { setCode(e.target.value); setErr(''); }} placeholder="e.g. a" style={inp} maxLength={10} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={inp} min={0} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Label *</label>
            <input value={label} onChange={e => { setLabel(e.target.value); setErr(''); }} placeholder="Document name / description" style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Additional Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} placeholder="Optional notes" rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="isReq" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} style={{ accentColor: '#1B2A6B', width: 15, height: 15 }} />
            <label htmlFor="isReq" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Mandatory document</label>
          </div>
          {err && <p style={{ color: '#DC2626', fontSize: 12, margin: 0 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#94A3B8' : 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(27,42,107,0.25)' }}>
              {saving ? 'Saving…' : initial ? 'Update' : 'Add Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DocumentMasterSection() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState<PIADocumentMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PIADocumentMaster | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-pia-document-master'],
    queryFn: () => adminApi.getDocumentMaster(),
    select: r => r.data?.data ?? [],
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: (d: Parameters<typeof adminApi.createDocumentMaster>[0]) => adminApi.createDocumentMaster(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-document-master'] }); setShowCreate(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: { id: string } & Parameters<typeof adminApi.updateDocumentMaster>[1]) => adminApi.updateDocumentMaster(d.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-document-master'] }); setEditTarget(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteDocumentMaster(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-document-master'] }); setDeleteTarget(null); },
  });
  const toggleMut = useMutation({
    mutationFn: (item: PIADocumentMaster) => adminApi.updateDocumentMaster(item.id, { isActive: !item.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pia-document-master'] }),
  });

  const items = (raw ?? []).filter(d =>
    !search || d.label.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Document Master</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Part IV enclosures required for PIA Recognition application</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13, width: 220 }} />
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, border: 'none', backgroundColor: '#1B2A6B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Document
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'Total', value: raw?.length ?? 0, color: '#1B2A6B' },
          { label: 'Mandatory', value: raw?.filter(d => d.isRequired).length ?? 0, color: '#DC2626' },
          { label: 'Optional', value: raw?.filter(d => !d.isRequired).length ?? 0, color: '#059669' },
          { label: 'Active', value: raw?.filter(d => d.isActive).length ?? 0, color: '#0369A1' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', minWidth: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-page)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Code', 'Label', 'Required', 'Order', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                {search ? 'No documents match your search.' : 'No documents configured yet.'}
              </td></tr>
            ) : items.map((doc, idx) => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, backgroundColor: '#1B2A6B', color: '#fff', fontSize: 12, fontWeight: 700 }}>{doc.code}</span>
                </td>
                <td style={{ padding: '10px 14px', maxWidth: 420 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</span>
                  {doc.description && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{doc.description}</span>}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, backgroundColor: doc.isRequired ? 'rgba(220,38,38,0.08)' : 'rgba(5,150,105,0.08)', color: doc.isRequired ? '#DC2626' : '#059669' }}>
                    {doc.isRequired ? 'Mandatory' : 'Optional'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{doc.sortOrder}</td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => toggleMut.mutate(doc)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', backgroundColor: doc.isActive ? 'rgba(5,150,105,0.1)' : 'rgba(100,116,139,0.1)', color: doc.isActive ? '#059669' : '#64748b' }}>
                    {doc.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditTarget(doc)} style={ib()} title="Edit">
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteTarget(doc)} style={ib({ borderColor: 'rgba(220,38,38,0.3)', color: '#DC2626' })} title="Delete">
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <DocMasterForm onSave={d => createMut.mutate(d)} onCancel={() => setShowCreate(false)} saving={createMut.isPending} />
      )}
      {editTarget && (
        <DocMasterForm initial={editTarget} onSave={d => updateMut.mutate({ id: editTarget.id, ...d })} onCancel={() => setEditTarget(null)} saving={updateMut.isPending} />
      )}
      {deleteTarget && (
        <Confirm msg={`Delete "${deleteTarget.label}"? This cannot be undone.`} onOk={() => deleteMut.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

