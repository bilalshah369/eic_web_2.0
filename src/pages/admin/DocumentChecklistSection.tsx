import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, PIADocumentChecklist } from '../../services/admin.service';

type SubType = 'NEW_RECOGNITION' | 'RENEWAL' | 'MODIFICATION';

const SUB_TYPES: { value: SubType; label: string; color: string; bg: string; border: string }[] = [
  { value: 'NEW_RECOGNITION', label: 'New Recognition', color: '#0369A1', bg: 'rgba(3,105,161,0.08)', border: 'rgba(3,105,161,0.25)' },
  { value: 'RENEWAL',         label: 'Renewal',         color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
  { value: 'MODIFICATION',    label: 'Modification',    color: '#B45309', bg: 'rgba(180,83,9,0.08)',   border: 'rgba(180,83,9,0.25)' },
];

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

function DocForm({ initial, activeSubType, onSave, onCancel, saving }: {
  initial?: PIADocumentChecklist;
  activeSubType: SubType;
  onSave: (d: { subType: string; documentType: string; documentLabel: string; description: string; isMandatory: boolean; sortOrder: number }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [subType, setSubType] = useState<SubType>(initial?.subType ?? activeSubType);
  const [documentType, setDocumentType] = useState(initial?.documentType ?? '');
  const [documentLabel, setDocumentLabel] = useState(initial?.documentLabel ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isMandatory, setIsMandatory] = useState(initial?.isMandatory ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!documentType.trim()) errs.documentType = 'Document type key is required';
    if (!documentLabel.trim()) errs.documentLabel = 'Display label is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ subType, documentType: documentType.trim().toUpperCase().replace(/\s+/g, '_'), documentLabel: documentLabel.trim(), description: description.trim(), isMandatory, sortOrder });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px 28px', width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 18px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{initial ? 'Edit Document' : 'Add Required Document'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Application Type *</label>
            <select value={subType} onChange={e => setSubType(e.target.value as SubType)} style={inp} disabled={!!initial}>
              {SUB_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Document Type Key *</label>
            <input value={documentType} onChange={e => { setDocumentType(e.target.value); setErrors(p => ({ ...p, documentType: '' })); }}
              style={{ ...inp, borderColor: errors.documentType ? '#DC2626' : undefined }} placeholder="e.g. QUALITY_MANUAL" disabled={!!initial} />
            <p style={{ margin: '3px 0 0', fontSize: 11, color: errors.documentType ? '#DC2626' : 'var(--text-muted)' }}>{errors.documentType || 'Unique key — auto-uppercased. Cannot change after creation.'}</p>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Display Label *</label>
            <input value={documentLabel} onChange={e => { setDocumentLabel(e.target.value); setErrors(p => ({ ...p, documentLabel: '' })); }}
              style={{ ...inp, borderColor: errors.documentLabel ? '#DC2626' : undefined }} placeholder="e.g. Quality Manual / QMS Document" />
            {errors.documentLabel && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#DC2626' }}>{errors.documentLabel}</p>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Description / Instructions</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Optional instructions for the applicant" />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} style={{ ...inp, width: 100 }} min={0} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
              <input type="checkbox" id="mandatory" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
              <label htmlFor="mandatory" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>Mandatory</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#94A3B8' : 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, boxShadow: saving ? 'none' : '0 4px 14px rgba(27,42,107,0.25)' }}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DocumentChecklistSection() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SubType>('NEW_RECOGNITION');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<PIADocumentChecklist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PIADocumentChecklist | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-pia-document-checklist'],
    queryFn: () => adminApi.getDocumentChecklist(),
    select: r => r.data?.data ?? [],
    staleTime: 60_000,
  });
  const allItems: PIADocumentChecklist[] = raw ?? [];

  const createMut = useMutation({
    mutationFn: (d: Parameters<typeof adminApi.createDocumentChecklist>[0]) => adminApi.createDocumentChecklist(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-document-checklist'] }); setShowCreate(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: { id: string } & Parameters<typeof adminApi.updateDocumentChecklist>[1]) => adminApi.updateDocumentChecklist(d.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-document-checklist'] }); setEditTarget(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteDocumentChecklist(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-document-checklist'] }); setDeleteTarget(null); },
  });
  const toggleMut = useMutation({
    mutationFn: (item: PIADocumentChecklist) => adminApi.updateDocumentChecklist(item.id, { isActive: !item.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pia-document-checklist'] }),
  });

  const tabItems = allItems.filter(i => i.subType === activeTab).sort((a, b) => a.sortOrder - b.sortOrder || a.documentLabel.localeCompare(b.documentLabel));
  const activeMeta = SUB_TYPES.find(s => s.value === activeTab)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Document Checklist Master</h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>Configure required documents per application type. These appear as the upload checklist for applicants.</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'var(--bg-nav)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Document
        </button>
      </div>

      {/* Stats per type */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SUB_TYPES.map(st => {
          const count = allItems.filter(i => i.subType === st.value).length;
          const mandatory = allItems.filter(i => i.subType === st.value && i.isMandatory).length;
          return (
            <div key={st.value} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: 'var(--bg-card)', border: `1px solid ${activeTab === st.value ? st.border : 'var(--border-subtle)'}`, flex: '1 1 120px' }}>
              <p style={{ margin: 0, fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{count}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{mandatory} mandatory</p>
            </div>
          );
        })}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {SUB_TYPES.map(st => (
          <button key={st.value} onClick={() => setActiveTab(st.value)}
            style={{ padding: '8px 18px', border: 'none', borderBottom: activeTab === st.value ? `2px solid ${st.color}` : '2px solid transparent', backgroundColor: 'transparent', color: activeTab === st.value ? st.color : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === st.value ? 700 : 400, transition: 'all 0.15s', marginBottom: -1 }}>
            {st.label}
          </button>
        ))}
      </div>

      {/* Document list for active tab */}
      {isLoading ? (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: activeMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: activeMeta.color }}>{activeMeta.label} — {tabItems.length} document{tabItems.length !== 1 ? 's' : ''} ({tabItems.filter(i => i.isMandatory).length} mandatory)</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--card-overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['#', 'Label', 'Type Key', 'Required', 'Status', 'Order', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: i === 6 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabItems.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No documents configured for {activeMeta.label} yet. Click "Add Document" to add one.
                </td></tr>
              ) : tabItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                  <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 500 }}>{item.documentLabel}</p>
                    {item.description && <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 11 }}>{item.description}</p>}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', backgroundColor: 'var(--card-overlay)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>{item.documentType}</span>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 500, border: '1px solid', backgroundColor: item.isMandatory ? 'rgba(220,38,38,0.08)' : 'rgba(156,163,175,0.1)', color: item.isMandatory ? '#DC2626' : '#6B7280', borderColor: item.isMandatory ? 'rgba(220,38,38,0.25)' : 'rgba(156,163,175,0.3)' }}>
                      {item.isMandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 500, border: '1px solid', backgroundColor: item.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)', color: item.isActive ? '#16A34A' : '#6B7280', borderColor: item.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(156,163,175,0.3)' }}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>{item.sortOrder}</td>
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

      {showCreate && <DocForm activeSubType={activeTab} onSave={d => createMut.mutate(d)} onCancel={() => setShowCreate(false)} saving={createMut.isPending} />}
      {editTarget && <DocForm initial={editTarget} activeSubType={activeTab} onSave={d => updateMut.mutate({ id: editTarget.id, ...d })} onCancel={() => setEditTarget(null)} saving={updateMut.isPending} />}
      {deleteTarget && <Confirm msg={`Delete "${deleteTarget.documentLabel}"? This cannot be undone.`} onOk={() => deleteMut.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}


