import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, PIAStatusMaster } from '../../services/admin.service';

const PHASE_OPTIONS = ['Application', 'Scrutiny', 'Inspection', 'Final Review', 'Post-Approval', 'Lifecycle'];
const PHASES = ['All', ...PHASE_OPTIONS];

const PHASE_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  'Application':   { bg: 'rgba(99,102,241,0.1)',  color: '#4338CA', border: 'rgba(99,102,241,0.3)'  },
  'Scrutiny':      { bg: 'rgba(245,158,11,0.1)',  color: '#B45309', border: 'rgba(245,158,11,0.3)'  },
  'Inspection':    { bg: 'rgba(14,165,233,0.1)',  color: '#0369A1', border: 'rgba(14,165,233,0.3)'  },
  'Final Review':  { bg: 'rgba(168,85,247,0.1)',  color: '#7C3AED', border: 'rgba(168,85,247,0.3)'  },
  'Post-Approval': { bg: 'rgba(34,197,94,0.1)',   color: '#15803D', border: 'rgba(34,197,94,0.3)'   },
  'Lifecycle':     { bg: 'rgba(156,163,175,0.1)', color: '#4B5563', border: 'rgba(156,163,175,0.3)' },
};

const inp: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: 13, width: '100%', boxSizing: 'border-box',
};

interface EditState {
  id: string;
  label: string;
  description: string;
  isActive: boolean;
}

interface AddState {
  code: string;
  label: string;
  description: string;
  phase: string;
  isActive: boolean;
}

const EMPTY_ADD: AddState = { code: '', label: '', description: '', phase: 'Application', isActive: true };

export default function PIAStatusMasterSection() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [phaseFilter, setPhaseFilter] = useState('All');
  const [editing, setEditing]         = useState<EditState | null>(null);
  const [adding, setAdding]           = useState(false);
  const [addForm, setAddForm]         = useState<AddState>(EMPTY_ADD);
  const [deleteTarget, setDeleteTarget] = useState<PIAStatusMaster | null>(null);
  const [reordering, setReordering]   = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pia-status-master'],
    queryFn: () => adminApi.getStatusMaster().then(r => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: string; label?: string; description?: string; isActive?: boolean; sortOrder?: number }) =>
      adminApi.updateStatusMaster(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pia-status-master'] }),
  });

  const createMut = useMutation({
    mutationFn: (d: AddState) => adminApi.createStatusMaster({ ...d, code: d.code.trim().toUpperCase() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pia-status-master'] }); setAdding(false); setAddForm(EMPTY_ADD); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteStatusMaster(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pia-status-master'] }); setDeleteTarget(null); },
  });

  const statuses = data ?? [];

  const filtered = statuses.filter(s => {
    const matchSearch = !search ||
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchPhase = phaseFilter === 'All' || s.phase === phaseFilter;
    return matchSearch && matchPhase;
  });

  const openEdit = (s: PIAStatusMaster) =>
    setEditing({ id: s.id, label: s.label, description: s.description ?? '', isActive: s.isActive });

  const saveEdit = () => {
    if (!editing) return;
    updateMut.mutate({ id: editing.id, label: editing.label, description: editing.description, isActive: editing.isActive },
      { onSuccess: () => setEditing(null) });
  };

  const moveItem = async (s: PIAStatusMaster, dir: 'up' | 'down') => {
    const sorted = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(x => x.id === s.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const neighbor = sorted[swapIdx];
    setReordering(true);
    await Promise.all([
      adminApi.updateStatusMaster(s.id,        { sortOrder: neighbor.sortOrder }),
      adminApi.updateStatusMaster(neighbor.id,  { sortOrder: s.sortOrder }),
    ]);
    await qc.invalidateQueries({ queryKey: ['pia-status-master'] });
    setReordering(false);
  };

  const btnStyle = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: variant === 'ghost' ? '1px solid var(--border-subtle)' : 'none',
    backgroundColor: variant === 'primary' ? '#4F46E5' : variant === 'danger' ? '#ef4444' : 'var(--bg-page)',
    color: variant === 'ghost' ? 'var(--text-muted)' : '#fff',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Application Status Master</h2>
          <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
            SRS §13 — {statuses.length} statuses across {PHASE_OPTIONS.length} phases
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search statuses…"
              style={{ padding: '8px 12px 8px 32px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: 200 }}
            />
          </div>
          <select
            value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            {PHASES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Phases' : p}</option>)}
          </select>
          <button
            onClick={() => { setAddForm(EMPTY_ADD); setAdding(true); }}
            style={{ ...btnStyle('primary'), display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
            </svg>
            Add Status
          </button>
        </div>
      </div>

      {/* Phase chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PHASE_OPTIONS.map(phase => {
          const count = statuses.filter(s => s.phase === phase).length;
          const c = PHASE_COLOR[phase];
          return (
            <button key={phase}
              onClick={() => setPhaseFilter(phaseFilter === phase ? 'All' : phase)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                backgroundColor: phaseFilter === phase ? c.bg : 'var(--bg-card)',
                color: phaseFilter === phase ? c.color : 'var(--text-muted)',
                border: `1px solid ${phaseFilter === phase ? c.border : 'var(--border-subtle)'}`,
              }}
            >
              {phase} <span style={{ opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        ) : isError ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>Failed to load status master.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--card-overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['Order', '#', 'Status', 'System Code', 'Phase', 'Active', 'Description', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', width: i === 0 ? 72 : i === 1 ? 36 : i === 4 ? 60 : i === 5 ? 56 : i === 7 ? 100 : undefined }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No statuses match your search.
                  </td>
                </tr>
              ) : filtered.map((s, idx) => {
                const c = PHASE_COLOR[s.phase];
                const sorted = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder);
                const globalIdx = sorted.findIndex(x => x.id === s.id);
                const isFirst = globalIdx === 0;
                const isLast  = globalIdx === sorted.length - 1;
                return (
                  <tr key={s.code}
                    style={{ borderBottom: '1px solid var(--border-subtle)', opacity: s.isActive ? 1 : 0.45 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    {/* Reorder */}
                    <td style={{ padding: '8px 14px' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          disabled={isFirst || reordering}
                          onClick={() => moveItem(s, 'up')}
                          title="Move up"
                          style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-page)', cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1 }}
                        >
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          disabled={isLast || reordering}
                          onClick={() => moveItem(s, 'down')}
                          title="Move down"
                          style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-page)', cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1 }}
                        >
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>{s.label}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace' }}>
                        {s.code}
                      </code>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 500, border: '1px solid', backgroundColor: c.bg, color: c.color, borderColor: c.border, whiteSpace: 'nowrap' }}>
                        {s.phase}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, border: '1px solid', backgroundColor: s.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: s.isActive ? '#15803D' : '#b91c1c', borderColor: s.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}>
                        {s.isActive ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{s.description}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(s)}
                          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteTarget(s)}
                          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.07)', color: '#b91c1c' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
        System codes are immutable once created. You may edit labels, descriptions, active state, and sort order.
      </p>

      {/* ── Edit Modal ── */}
      {editing && (
        <Modal title="Edit Status" onClose={() => setEditing(null)}>
          <Field label="Label">
            <input value={editing.label} onChange={e => setEditing(p => p && ({ ...p, label: e.target.value }))} style={inp} />
          </Field>
          <Field label="Description">
            <textarea value={editing.description} onChange={e => setEditing(p => p && ({ ...p, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input id="em-active" type="checkbox" checked={editing.isActive} onChange={e => setEditing(p => p && ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="em-active" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Active</label>
          </div>
          <ModalFooter>
            <button onClick={() => setEditing(null)} style={btnStyle('ghost')}>Cancel</button>
            <button onClick={saveEdit} disabled={updateMut.isPending || !editing.label.trim()} style={{ ...btnStyle('primary'), opacity: updateMut.isPending ? 0.7 : 1 }}>
              {updateMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Add Modal ── */}
      {adding && (
        <Modal title="Add New Status" onClose={() => setAdding(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="System Code *">
              <input value={addForm.code} onChange={e => setAddForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                placeholder="e.g. PENDING_DOCS" style={inp} />
            </Field>
            <Field label="Phase *">
              <select value={addForm.phase} onChange={e => setAddForm(p => ({ ...p, phase: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                {PHASE_OPTIONS.map(ph => <option key={ph} value={ph}>{ph}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Label *">
            <input value={addForm.label} onChange={e => setAddForm(p => ({ ...p, label: e.target.value }))} placeholder="Display name" style={inp} />
          </Field>
          <Field label="Description">
            <textarea value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Optional description" />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input id="am-active" type="checkbox" checked={addForm.isActive} onChange={e => setAddForm(p => ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="am-active" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Active</label>
          </div>
          {createMut.isError && (
            <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>
              {(createMut.error as any)?.response?.data?.message ?? 'Failed to create status.'}
            </p>
          )}
          <ModalFooter>
            <button onClick={() => setAdding(false)} style={btnStyle('ghost')}>Cancel</button>
            <button
              onClick={() => createMut.mutate(addForm)}
              disabled={createMut.isPending || !addForm.code.trim() || !addForm.label.trim()}
              style={{ ...btnStyle('primary'), opacity: createMut.isPending ? 0.7 : 1 }}
            >
              {createMut.isPending ? 'Creating…' : 'Create'}
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <Modal title="Delete Status" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>{deleteTarget.label}</strong> (<code>{deleteTarget.code}</code>)?
            This cannot be undone and may break existing applications referencing this status.
          </p>
          <ModalFooter>
            <button onClick={() => setDeleteTarget(null)} style={btnStyle('ghost')}>Cancel</button>
            <button
              onClick={() => deleteMut.mutate(deleteTarget.id)}
              disabled={deleteMut.isPending}
              style={{ ...btnStyle('danger'), opacity: deleteMut.isPending ? 0.7 : 1 }}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 520, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>{children}</div>;
}
