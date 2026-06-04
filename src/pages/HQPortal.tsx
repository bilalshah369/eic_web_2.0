import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Header, { UserMenu } from '../components/Header';
import PaletteButton from '../components/PaletteButton';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface HQStats {
  total: number; inbox: number; underScrutiny: number;
  discrepancy: number; completed: number; nominated: number;
}
interface PIAApp {
  id: string; piaStatus: string; subType: string;
  nominatedOfficerName: string | null; nominatedAt: string | null;
  updatedAt: string; createdAt: string;
  application: {
    id: string; appNo: string; organisation: string; applicantName: string;
    status: string; submittedAt: string | null;
    office: { id: string; name: string; code: string; type: string } | null;
    user: { id: string; name: string; email: string } | null;
  };
  discrepancies: { id: string }[];
}
interface PIAAppDetail extends PIAApp {
  discrepancies: Discrepancy[];
  statusHistory: StatusHistory[];
  documents: PIADoc[];
  ports: { port: { id: string; name: string } }[];
  scopes: { mineralOre: { id: string; name: string } }[];
}
interface Discrepancy {
  id: string; description: string; documentType: string | null;
  status: string; raisedByName: string | null;
  raisedAt: string; respondedAt: string | null; applicantResponse: string | null;
}
interface StatusHistory {
  id: string; fromStatus: string | null; toStatus: string;
  changedByName: string | null; remarks: string | null; changedAt: string;
}
interface PIADoc {
  id: string; documentType: string; documentName: string;
  status: string; version: number; uploadedAt: string;
}
interface EIAOffice {
  id: string; name: string; code: string; type: string;
  state: string | null; _count: { applications: number };
}
interface Officer {
  id: string; name: string; designation: string;
  qualification: string; mobile: string | null; email: string | null;
}

/* ─── nav ────────────────────────────────────────────────────────────────── */
type NavKey = 'dashboard' | 'applications' | 'nomination' | 'eia-offices';

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    key: 'applications', label: 'Applications',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: 'nomination', label: 'Officer Nomination',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    key: 'eia-offices', label: 'EIA Offices',
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
];

/* ─── SidebarBtn (identical to Admin / OfficePortal) ─────────────────────── */
function SidebarBtn({ item, active, collapsed, onClick }: {
  item: typeof NAV_ITEMS[number]; active: boolean; collapsed: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: collapsed ? '11px 0' : '10px 14px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: active ? 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' : 'none',
      border: 'none', borderRadius: 10, cursor: 'pointer',
      color: active ? '#ffffff' : 'rgba(27,42,107,0.70)',
      fontSize: 13, fontWeight: active ? 600 : 500, textAlign: 'left',
      transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
      whiteSpace: 'nowrap', overflow: 'hidden',
      boxShadow: active ? '0 4px 14px rgba(27,42,107,0.30)' : 'none',
      marginBottom: 2,
    }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(27,42,107,0.70)'; } }}
    >
      <span style={{ flexShrink: 0, color: active ? '#ffffff' : 'rgba(27,42,107,0.55)' }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

/* ─── constants ──────────────────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  FORWARDED_TO_EIC:             'Forwarded to EIC',
  UNDER_DOCUMENT_SCRUTINY:      'Under Scrutiny',
  DISCREPANCY_RAISED:           'Discrepancy Raised',
  RESUBMITTED_BY_APPLICANT:     'Resubmitted',
  SCRUTINY_COMPLETED:           'Scrutiny Completed',
  INSPECTION_OFFICER_NOMINATED: 'Officer Nominated',
  DRAFT:                        'Draft',
  SUBMITTED:                    'Submitted',
  APPLICATION_FEE_PENDING:      'Fee Pending',
  APPLICATION_FEE_PAID:         'Fee Paid',
  RECEIVED_BY_EIA:              'Received by EIA',
};
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  FORWARDED_TO_EIC:             { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
  UNDER_DOCUMENT_SCRUTINY:      { backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' },
  DISCREPANCY_RAISED:           { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
  RESUBMITTED_BY_APPLICANT:     { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
  SCRUTINY_COMPLETED:           { backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' },
  INSPECTION_OFFICER_NOMINATED: { backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #DDD6FE' },
};

/* ─── shared styles ──────────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  fontSize: 13, borderRadius: 8, border: '1.5px solid #D1D5DB',
  backgroundColor: '#fff', color: '#1F2937', outline: 'none',
};
const gradBtn: React.CSSProperties = {
  padding: '8px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
  border: 'none', cursor: 'pointer', color: '#fff',
  background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)',
  boxShadow: '0 2px 8px rgba(27,42,107,0.18)',
};
const outlineBtn: React.CSSProperties = {
  padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
  border: '1.5px solid #D1D5DB', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' };
  return (
    <span style={{ ...s, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ padding: '10px 20px', backgroundColor: '#EEF2FF', borderBottom: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 8, borderLeft: '4px solid #1B2A6B' }}>
      <span style={{ color: '#1B2A6B' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: '#1B2A6B', textTransform: 'uppercase' }}>{title}</span>
    </div>
  );
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── DiscrepancyModal ───────────────────────────────────────────────────── */
function DiscrepancyModal({ appId, onClose, onDone }: { appId: string; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ description: '', documentType: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  async function submit() {
    if (!form.description.trim()) { setErr('Description is required'); return; }
    setSaving(true);
    try { await api.post(`/hq/applications/${appId}/discrepancy`, form); onDone(); }
    catch (e: any) { setErr(e?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Raise Discrepancy</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>
          {err && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>{err}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Document Type</label>
            <input style={inp} placeholder="e.g. Quality Manual, ISO Certificate" value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Description <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea style={{ ...inp, height: 100, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Describe the discrepancy…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button style={outlineBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...gradBtn, opacity: saving ? 0.7 : 1 }} onClick={submit} disabled={saving}>{saving ? 'Raising…' : 'Raise Discrepancy'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── NominateModal ──────────────────────────────────────────────────────── */
function NominateModal({ appId, onClose, onDone }: { appId: string; onClose: () => void; onDone: () => void }) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const { data: officers = [] } = useQuery<Officer[]>({ queryKey: ['hq-officers'], queryFn: () => api.get('/hq/officers').then(r => r.data.data) });
  const filtered = officers.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.designation.toLowerCase().includes(search.toLowerCase()));
  async function submit() {
    if (!selected) { setErr('Please select an officer'); return; }
    const officer = officers.find(o => o.id === selected);
    if (!officer) return;
    setSaving(true);
    try { await api.put(`/hq/applications/${appId}/nominate`, { officerId: officer.id, officerName: officer.name }); onDone(); }
    catch (e: any) { setErr(e?.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, width: 560, maxHeight: '80vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Nominate Inspection Officer</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '16px 24px', flexShrink: 0 }}>
          {err && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#DC2626', fontSize: 13 }}>{err}</div>}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
            <input style={{ ...inp, paddingLeft: 32 }} placeholder="Search officers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px' }}>
          {filtered.map(o => (
            <div key={o.id} onClick={() => setSelected(o.id)} style={{ padding: '12px 14px', borderRadius: 8, marginBottom: 6, cursor: 'pointer', border: selected === o.id ? '2px solid #1B2A6B' : '1.5px solid #E5E7EB', backgroundColor: selected === o.id ? '#EEF2FF' : '#fff', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {o.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{o.designation} · {o.qualification}</div>
                </div>
                {selected === o.id && <svg width="18" height="18" fill="none" stroke="#1B2A6B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '20px 0' }}>No officers found</div>}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F4FF', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button style={outlineBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...gradBtn, opacity: saving ? 0.7 : 1 }} onClick={submit} disabled={saving}>{saving ? 'Nominating…' : 'Nominate Officer'}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── DetailDrawer ───────────────────────────────────────────────────────── */
function DetailDrawer({ appId, onClose, onUpdated }: { appId: string; onClose: () => void; onUpdated: () => void }) {
  const [tab, setTab] = useState<'info' | 'discrepancies' | 'history'>('info');
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [showNomModal, setShowNomModal] = useState(false);
  const [statusRemarks, setStatusRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const { data: app, isLoading } = useQuery<PIAAppDetail>({
    queryKey: ['hq-app-detail', appId],
    queryFn: () => api.get(`/hq/applications/${appId}`).then(r => r.data.data),
    enabled: !!appId,
  });
  async function updateStatus(piaStatus: string) {
    setSaving(true);
    try {
      await api.put(`/hq/applications/${appId}/status`, { piaStatus, remarks: statusRemarks });
      qc.invalidateQueries({ queryKey: ['hq-app-detail', appId] });
      onUpdated();
      setStatusRemarks('');
    } finally { setSaving(false); }
  }
  const status = app?.piaStatus ?? '';
  const canBeginScrutiny    = status === 'FORWARDED_TO_EIC';
  const canRaiseDisc        = status === 'UNDER_DOCUMENT_SCRUTINY' || status === 'RESUBMITTED_BY_APPLICANT';
  const canCompleteScrutiny = status === 'UNDER_DOCUMENT_SCRUTINY' || status === 'RESUBMITTED_BY_APPLICANT' || status === 'DISCREPANCY_RAISED';
  const canNominate         = status === 'SCRUTINY_COMPLETED';
  return (
    <>
      {showDiscModal && <DiscrepancyModal appId={appId} onClose={() => setShowDiscModal(false)} onDone={() => { setShowDiscModal(false); qc.invalidateQueries({ queryKey: ['hq-app-detail', appId] }); onUpdated(); }} />}
      {showNomModal  && <NominateModal  appId={appId} onClose={() => setShowNomModal(false)}  onDone={() => { setShowNomModal(false);  qc.invalidateQueries({ queryKey: ['hq-app-detail', appId] }); onUpdated(); }} />}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 900 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, backgroundColor: '#fff', zIndex: 901, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 40px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', padding: '18px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{app?.application?.appNo ?? '—'}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>{app?.application?.organisation}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {app && <StatusBadge status={app.piaStatus} />}
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 30, height: 30, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          </div>
        </div>
        {/* Actions */}
        {app && (canBeginScrutiny || canRaiseDisc || canCompleteScrutiny || canNominate) && (
          <div style={{ padding: '12px 24px', backgroundColor: '#F8FAFF', borderBottom: '1px solid #E8EDF5', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Workflow Actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canBeginScrutiny    && <button style={{ ...gradBtn, fontSize: 12, padding: '6px 14px' }} disabled={saving} onClick={() => updateStatus('UNDER_DOCUMENT_SCRUTINY')}>Begin Scrutiny</button>}
              {canRaiseDisc        && <button style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1.5px solid #EF4444', backgroundColor: '#fff', color: '#DC2626', cursor: 'pointer' }} onClick={() => setShowDiscModal(true)}>Raise Discrepancy</button>}
              {canCompleteScrutiny && <button style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1.5px solid #16A34A', backgroundColor: '#F0FDF4', color: '#15803D', cursor: 'pointer' }} disabled={saving} onClick={() => updateStatus('SCRUTINY_COMPLETED')}>Complete Scrutiny</button>}
              {canNominate         && <button style={{ ...gradBtn, fontSize: 12, padding: '6px 14px', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }} onClick={() => setShowNomModal(true)}>Nominate Officer</button>}
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={{ ...inp, fontSize: 12, padding: '7px 10px' }} placeholder="Optional remarks for this action…" value={statusRemarks} onChange={e => setStatusRemarks(e.target.value)} />
            </div>
          </div>
        )}
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8EDF5', flexShrink: 0, backgroundColor: '#fff' }}>
          {(['info', 'discrepancies', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '11px 0', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#1B2A6B' : '#6B7280', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: tab === t ? '2.5px solid #1B2A6B' : '2.5px solid transparent', textTransform: 'capitalize' }}>
              {t === 'info' ? 'Details' : t === 'discrepancies' ? `Discrepancies (${app?.discrepancies?.length ?? 0})` : 'History'}
            </button>
          ))}
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {isLoading && <div style={{ textAlign: 'center', color: '#6B7280', padding: 40 }}>Loading…</div>}
          {!isLoading && app && tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ border: '1px solid #E8EDF5', borderRadius: 10, overflow: 'hidden' }}>
                <SectionHeader icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="Application Details" />
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                  {[['App No.', app.application.appNo], ['Type', app.subType], ['Organisation', app.application.organisation], ['Applicant', app.application.applicantName], ['Submitted', fmtDate(app.application.submittedAt)], ['EIA Office', app.application.office?.name ?? '—']].map(([l, v]) => (
                    <div key={l}><div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div><div style={{ fontSize: 13, color: '#111827', fontWeight: 500, marginTop: 2 }}>{v}</div></div>
                  ))}
                </div>
              </div>
              {app.nominatedOfficerName && (
                <div style={{ backgroundColor: '#F3E8FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#7E22CE', marginBottom: 4 }}>Nominated Officer</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#6D28D9' }}>{app.nominatedOfficerName}</div>
                  <div style={{ fontSize: 12, color: '#7C3AED', marginTop: 2 }}>Nominated on {fmtDate(app.nominatedAt)}</div>
                </div>
              )}
              {app.ports.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ports</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{app.ports.map(p => <span key={p.port.id} style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>{p.port.name}</span>)}</div>
                </div>
              )}
              {app.scopes.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mineral / Ore Scope</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{app.scopes.map(s => <span key={s.mineralOre.id} style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>{s.mineralOre.name}</span>)}</div>
                </div>
              )}
              {app.documents.length > 0 && (
                <div style={{ border: '1px solid #E8EDF5', borderRadius: 10, overflow: 'hidden' }}>
                  <SectionHeader icon={<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>} title="Documents" />
                  <div style={{ padding: '8px 0' }}>
                    {app.documents.map(d => (
                      <div key={d.id} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F9FAFB' }}>
                        <div><div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{d.documentName}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{d.documentType} · v{d.version} · {fmtDate(d.uploadedAt)}</div></div>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: d.status === 'ACCEPTED' ? '#F0FDF4' : d.status === 'REJECTED' ? '#FEF2F2' : '#FFF7ED', color: d.status === 'ACCEPTED' ? '#15803D' : d.status === 'REJECTED' ? '#DC2626' : '#D97706', border: `1px solid ${d.status === 'ACCEPTED' ? '#BBF7D0' : d.status === 'REJECTED' ? '#FECACA' : '#FDE68A'}` }}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {!isLoading && app && tab === 'discrepancies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {app.discrepancies.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>No discrepancies raised</div>}
              {app.discrepancies.map(d => (
                <div key={d.id} style={{ border: '1px solid #E8EDF5', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', backgroundColor: d.status === 'RAISED' ? '#FEF2F2' : d.status === 'RESPONDED' ? '#FFFBEB' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: d.status === 'RAISED' ? '#DC2626' : d.status === 'RESPONDED' ? '#D97706' : '#15803D' }}>{d.documentType ?? 'General'}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, backgroundColor: '#fff', color: d.status === 'RAISED' ? '#DC2626' : d.status === 'RESPONDED' ? '#D97706' : '#15803D', border: '1px solid currentColor' }}>{d.status}</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{d.description}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>Raised by {d.raisedByName ?? 'EIC'} on {fmtDate(d.raisedAt)}</div>
                    {d.applicantResponse && (
                      <div style={{ marginTop: 10, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#15803D', marginBottom: 4 }}>Applicant Response</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>{d.applicantResponse}</div>
                        {d.respondedAt && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Responded on {fmtDate(d.respondedAt)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && app && tab === 'history' && (
            <div>
              {app.statusHistory.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: i === 0 ? '#1B2A6B' : '#D1D5DB', border: '2px solid', borderColor: i === 0 ? '#1B2A6B' : '#D1D5DB', flexShrink: 0, marginTop: 2 }} />
                    {i < app.statusHistory.length - 1 && <div style={{ width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {h.fromStatus && <><span style={{ fontSize: 12, color: '#6B7280' }}>{STATUS_LABEL[h.fromStatus] ?? h.fromStatus}</span><span style={{ color: '#9CA3AF' }}>→</span></>}
                      <StatusBadge status={h.toStatus} />
                    </div>
                    {h.remarks && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{h.remarks}</div>}
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{h.changedByName} · {fmtDate(h.changedAt)}</div>
                  </div>
                </div>
              ))}
              {app.statusHistory.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>No history yet</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── DashboardSection ───────────────────────────────────────────────────── */
function DashboardSection({ onNavigate }: { onNavigate: (key: NavKey, tab?: string) => void }) {
  const { data: stats, isLoading: statsLoading } = useQuery<HQStats>({
    queryKey: ['hq-stats'],
    queryFn: () => api.get('/hq/stats').then(r => r.data.data),
    refetchInterval: 30_000,
  });
  const { data: recent, isLoading: recentLoading } = useQuery<{ applications: PIAApp[]; total: number }>({
    queryKey: ['hq-apps-recent'],
    queryFn: () => api.get('/hq/applications?tab=all&limit=8').then(r => r.data.data),
  });

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const STAT_CARDS = [
    {
      label: 'Total Applications', value: stats?.total ?? 0, accent: '#1B2A6B', accentBg: '#EEF2FF',
      click: () => onNavigate('applications', 'all'),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      label: 'EIC Inbox', value: stats?.inbox ?? 0, accent: '#1D4ED8', accentBg: '#DBEAFE',
      click: () => onNavigate('applications', 'inbox'),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
    },
    {
      label: 'Under Scrutiny', value: stats?.underScrutiny ?? 0, accent: '#C2410C', accentBg: '#FFEDD5',
      click: () => onNavigate('applications', 'scrutiny'),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>,
    },
    {
      label: 'Discrepancy Raised', value: stats?.discrepancy ?? 0, accent: '#DC2626', accentBg: '#FEE2E2',
      click: () => onNavigate('applications', 'discrepancy'),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    },
    {
      label: 'Scrutiny Completed', value: stats?.completed ?? 0, accent: '#15803D', accentBg: '#DCFCE7',
      click: () => onNavigate('applications', 'completed'),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    },
    {
      label: 'Officer Nominated', value: stats?.nominated ?? 0, accent: '#7E22CE', accentBg: '#EDE9FE',
      click: () => onNavigate('nomination'),
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
  ];

  const WORKFLOW = [
    { label: 'Forwarded to EIC', color: '#1D4ED8', value: stats?.inbox ?? 0 },
    { label: 'Under Scrutiny',   color: '#C2410C', value: stats?.underScrutiny ?? 0 },
    { label: 'Discrepancy',      color: '#DC2626', value: stats?.discrepancy ?? 0 },
    { label: 'Scrutiny Complete',color: '#15803D', value: stats?.completed ?? 0 },
    { label: 'Officer Nominated',color: '#7E22CE', value: stats?.nominated ?? 0 },
  ];

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, <span style={{ color: '#1B2A6B' }}>HQ Administrator</span>
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{dateStr} · Export Inspection Council</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onNavigate('applications', 'inbox')} style={{ ...gradBtn, fontSize: 13 }}>
            <svg style={{ marginRight: 6, verticalAlign: 'middle' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            View Inbox
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {STAT_CARDS.map(c => (
          <div key={c.label} onClick={c.click} style={{
            backgroundColor: '#ffffff', border: '1px solid #E8EDF5', borderRadius: 14,
            overflow: 'hidden', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(27,42,107,0.07)',
            transition: 'box-shadow 0.18s, transform 0.18s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(27,42,107,0.13)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            {/* Top accent bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${c.accent}, ${c.accent}99)` }} />
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Icon badge */}
              <div style={{
                width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${c.accentBg}, ${c.accent}18)`,
                border: `1.5px solid ${c.accent}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.accent,
              }}>
                {c.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {statsLoading
                  ? <div style={{ width: 50, height: 24, borderRadius: 6, backgroundColor: '#F1F5F9', marginBottom: 4 }} />
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{c.value}</div>
                }
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 500 }}>{c.label}</div>
              </div>
              {/* Arrow */}
              <svg width="16" height="16" fill="none" stroke={c.accent} strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.5 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── Workflow pipeline ── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 14, padding: '16px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>EIC Workflow Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {WORKFLOW.map((stage, i) => (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                  backgroundColor: stage.value > 0 ? stage.color : '#F3F4F6',
                  border: `2px solid ${stage.value > 0 ? stage.color : '#E5E7EB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stage.value > 0 ? '#fff' : '#9CA3AF',
                  fontSize: 14, fontWeight: 800, transition: 'all 0.2s',
                }}>
                  {stage.value}
                </div>
                <div style={{ fontSize: 11, color: stage.value > 0 ? '#374151' : '#9CA3AF', fontWeight: stage.value > 0 ? 600 : 400, lineHeight: 1.3 }}>{stage.label}</div>
              </div>
              {i < WORKFLOW.length - 1 && (
                <svg width="20" height="20" fill="none" stroke="#D1D5DB" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, margin: '0 -4px', marginBottom: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Applications ── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
        {/* Card header */}
        <div style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Recent Applications</span>
            {recent && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>· {recent.total} total</span>}
          </div>
          <button onClick={() => onNavigate('applications', 'all')} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 500 }}>View All →</button>
        </div>
        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' }}>
              {['App No.', 'Organisation', 'EIA Office', 'Type', 'Status', 'Submitted'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F0F4FF' }}>
                {[140, 180, 200, 80, 100, 90].map((w, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}>
                    <div style={{ height: 12, borderRadius: 4, backgroundColor: '#F1F5F9', width: w }} />
                  </td>
                ))}
              </tr>
            ))}
            {!recentLoading && (recent?.applications ?? []).map(a => (
              <tr key={a.id} onClick={() => onNavigate('applications', 'all')} style={{ borderBottom: '1px solid #F0F4FF', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#1B2A6B' }}>{a.application.appNo}</td>
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{a.application.organisation}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.application.applicantName}</div>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  {a.application.office
                    ? <><div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{a.application.office.name}</div><div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.application.office.code}</div></>
                    : <span style={{ color: '#D1D5DB' }}>—</span>
                  }
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>{a.subType.replace(/_/g, ' ')}</span>
                </td>
                <td style={{ padding: '11px 16px' }}><StatusBadge status={a.piaStatus} /></td>
                <td style={{ padding: '11px 16px', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(a.application.submittedAt ?? a.createdAt)}</td>
              </tr>
            ))}
            {!recentLoading && (recent?.applications ?? []).length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px 0', textAlign: 'center' }}>
                  <svg width="36" height="36" fill="none" stroke="#D1D5DB" strokeWidth={1.5} viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto 8px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <div style={{ color: '#9CA3AF', fontSize: 14 }}>No applications yet</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── ApplicationsSection ────────────────────────────────────────────────── */
/* ─── TablePagination (matches Admin / OfficePortal) ─────────────────────── */
function TablePagination({ page, total, pageSize, onPage, onPageSize }: {
  page: number; total: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to   = Math.min((page + 1) * pageSize, total);

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | '...')[] = [0];
    if (page > 3) pages.push('...');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 4) pages.push('...');
    pages.push(totalPages - 1);
    return pages;
  };

  const nb: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontSize: 12,
    color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rows per page:</span>
          <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(0); }}
            style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
            {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {total === 0 ? '0 results' : `${from}–${to} of ${total}`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* First */}
        <button onClick={() => onPage(0)} disabled={page === 0} style={{ ...nb, opacity: page === 0 ? 0.35 : 1 }} title="First page">
          «
        </button>
        {/* Prev */}
        <button onClick={() => onPage(page - 1)} disabled={page === 0} style={{ ...nb, opacity: page === 0 ? 0.35 : 1 }} title="Previous page">
          ‹
        </button>
        {/* Page numbers */}
        {getPages().map((p, i) =>
          p === '...'
            ? <span key={`el-${i}`} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 2px' }}>…</span>
            : <button key={p} onClick={() => onPage(p as number)} style={{ ...nb, backgroundColor: page === p ? '#1B2A6B' : 'var(--bg-card)', color: page === p ? '#fff' : 'var(--text-primary)', borderColor: page === p ? '#1B2A6B' : 'var(--border-subtle)', fontWeight: page === p ? 700 : 500 }}>
                {(p as number) + 1}
              </button>
        )}
        {/* Next */}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} style={{ ...nb, opacity: page >= totalPages - 1 ? 0.35 : 1 }} title="Next page">
          ›
        </button>
        {/* Last */}
        <button onClick={() => onPage(totalPages - 1)} disabled={page >= totalPages - 1} style={{ ...nb, opacity: page >= totalPages - 1 ? 0.35 : 1 }} title="Last page">
          »
        </button>
      </div>
    </div>
  );
}

function ApplicationsSection({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab ?? 'inbox');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(debounceRef.current); }, [search]);
  useEffect(() => { setPage(0); }, [tab, debouncedSearch]);
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  const { data, isLoading } = useQuery<{ applications: PIAApp[]; total: number }>({
    queryKey: ['hq-apps', tab, debouncedSearch, page, pageSize],
    queryFn: () => api.get(`/hq/applications?tab=${tab}&search=${encodeURIComponent(debouncedSearch)}&limit=${pageSize}&offset=${page * pageSize}`).then(r => r.data.data),
  });
  const TABS = [
    { key: 'inbox',       label: 'EIC Inbox',          color: '#1D4ED8' },
    { key: 'scrutiny',    label: 'Under Scrutiny',     color: '#C2410C' },
    { key: 'discrepancy', label: 'Discrepancy',        color: '#DC2626' },
    { key: 'completed',   label: 'Scrutiny Completed', color: '#15803D' },
    { key: 'nomination',  label: 'Nomination',         color: '#7E22CE' },
    { key: 'all',         label: 'All',                color: '#374151' },
  ];
  return (
    <div>
      {selectedId && <DetailDrawer appId={selectedId} onClose={() => setSelectedId(null)} onUpdated={() => { qc.invalidateQueries({ queryKey: ['hq-apps'] }); qc.invalidateQueries({ queryKey: ['hq-stats'] }); }} />}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Applications</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Manage PIA recognition application workflow</p>
      </div>
      {/* Workflow tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E8EDF5', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? t.color : '#6B7280', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: tab === t.key ? `2.5px solid ${t.color}` : '2.5px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Search bar */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
          <input style={{ ...inp, paddingLeft: 32 }} placeholder="Search by app no., organisation…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {/* Table card */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' }}>
              {['App No.', 'Organisation', 'EIA Office', 'Status', 'Discrepancies', 'Updated'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ padding: '30px 0', textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>}
            {!isLoading && (data?.applications ?? []).map(a => (
              <tr key={a.id} onClick={() => setSelectedId(a.id)} style={{ borderBottom: '1px solid #F0F4FF', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1B2A6B' }}>{a.application.appNo}</td>
                <td style={{ padding: '12px 16px' }}><div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{a.application.organisation}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.application.applicantName}</div></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>{a.application.office?.name ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={a.piaStatus} /></td>
                <td style={{ padding: '12px 16px' }}>{a.discrepancies.length > 0 ? <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{a.discrepancies.length}</span> : <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF' }}>{fmtDate(a.updatedAt)}</td>
              </tr>
            ))}
            {!isLoading && (data?.applications ?? []).length === 0 && <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No applications in this category</td></tr>}
          </tbody>
        </table>
        <TablePagination
          page={page}
          total={data?.total ?? 0}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={s => { setPageSize(s); setPage(0); }}
        />
      </div>
    </div>
  );
}

/* ─── NominationSection ──────────────────────────────────────────────────── */
function NominationSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ applications: PIAApp[]; total: number }>({ queryKey: ['hq-apps-nomination'], queryFn: () => api.get('/hq/applications?tab=nomination&limit=50').then(r => r.data.data) });
  return (
    <div>
      {selectedId && <DetailDrawer appId={selectedId} onClose={() => setSelectedId(null)} onUpdated={() => qc.invalidateQueries({ queryKey: ['hq-apps-nomination'] })} />}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Officer Nomination</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Applications with scrutiny completed — nominate inspection officers</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Loading…</div>}
        {!isLoading && (data?.applications ?? []).map(a => (
          <div key={a.id} style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><span style={{ fontSize: 15, fontWeight: 700, color: '#1B2A6B' }}>{a.application.appNo}</span><StatusBadge status={a.piaStatus} /></div>
              <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{a.application.organisation}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.application.office?.name ?? '—'} · Updated {fmtDate(a.updatedAt)}</div>
              {a.nominatedOfficerName && <div style={{ marginTop: 8, fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>✓ Officer nominated: {a.nominatedOfficerName} on {fmtDate(a.nominatedAt)}</div>}
            </div>
            <button onClick={() => setSelectedId(a.id)} style={gradBtn}>{a.piaStatus === 'SCRUTINY_COMPLETED' ? 'Nominate Officer' : 'View Details'}</button>
          </div>
        ))}
        {!isLoading && (data?.applications ?? []).length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 15 }}>No applications ready for officer nomination</div>}
      </div>
    </div>
  );
}

/* ─── EIAOfficesSection ──────────────────────────────────────────────────── */
function EIAOfficesSection() {
  const { data: offices = [], isLoading } = useQuery<EIAOffice[]>({ queryKey: ['hq-eia-offices'], queryFn: () => api.get('/hq/eia-offices').then(r => r.data.data) });
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>EIA Offices</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>All Export Inspection Agency offices under EIC jurisdiction</p>
      </div>
      <div style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' }}>
              {['Office Name', 'Code', 'Type', 'State', 'Applications'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} style={{ padding: '30px 0', textAlign: 'center', color: '#9CA3AF' }}>Loading…</td></tr>}
            {!isLoading && offices.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #F0F4FF' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{o.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', fontFamily: 'monospace' }}>{o.code}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, backgroundColor: o.type === 'EIA' ? '#EFF6FF' : '#F3E8FF', color: o.type === 'EIA' ? '#1D4ED8' : '#7E22CE', border: `1px solid ${o.type === 'EIA' ? '#BFDBFE' : '#DDD6FE'}` }}>{o.type}</span></td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{o.state ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{o._count.applications}</td>
              </tr>
            ))}
            {!isLoading && offices.length === 0 && <tr><td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF' }}>No EIA offices found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export default function HQPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();

  const VALID_KEYS: NavKey[] = ['dashboard', 'applications', 'nomination', 'eia-offices'];
  const activeNav: NavKey = VALID_KEYS.includes(section as NavKey) ? (section as NavKey) : 'dashboard';

  const [collapsed, setCollapsed] = useState(false);
  const [appTab, setAppTab] = useState<string | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const scroll = (dir: 'up' | 'down') => navRef.current?.scrollBy({ top: dir === 'down' ? 80 : -80, behavior: 'smooth' });

  function goTo(key: NavKey) { navigate(`/hq-portal/${key}`); }
  function navigateTo(key: NavKey, tab?: string) { setAppTab(tab); goTo(key); }
  async function handleLogout() { await logout(); navigate('/'); }

  const pageTitle = NAV_ITEMS.find(n => n.key === activeNav)?.label ?? 'Dashboard';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', overflow: 'hidden' }}>
      <Header user={user} onLogout={handleLogout} hideNav sidebarCollapsed={collapsed} pageTitle={pageTitle} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: collapsed ? 64 : 260,
          backgroundColor: '#ffffff',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          position: 'relative', height: '100%', overflow: 'visible',
          boxShadow: '4px 0 24px rgba(27,42,107,0.10)', zIndex: 10,
        }}>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)} style={{
            position: 'absolute', top: 20, right: -14,
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
            border: '2px solid #fff', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, fontSize: 11, fontWeight: 700,
            boxShadow: '0 2px 10px rgba(27,42,107,0.30)', transition: 'transform 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            {collapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{
            padding: collapsed ? '13px 0' : '11px 14px 12px',
            borderBottom: '1px solid var(--nav-border)',
            display: 'flex', alignItems: 'center', gap: 10,
            overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'linear-gradient(135deg, var(--grad-to) 0%, var(--grad-from) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em' }}>EIC</span>
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ color: '#1B2A6B', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap' }}>e-Services</span>
                  <span style={{ color: 'rgba(27,42,107,0.45)', fontSize: 10, fontWeight: 500 }}>PORTAL</span>
                </div>
                <p style={{ color: 'rgba(27,42,107,0.55)', fontSize: 10, margin: '3px 0 0', fontWeight: 400, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Export Inspection Council</p>
              </div>
            )}
          </div>

          {/* Scroll up */}
          <button onClick={() => scroll('up')} style={{ width: '100%', padding: '3px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(27,42,107,0.07)', cursor: 'pointer', color: 'rgba(27,42,107,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1B2A6B')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,42,107,0.35)')}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
          </button>

          {/* Nav */}
          <nav ref={navRef} className="scrollbar-none" style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV_ITEMS.map(item => (
              <SidebarBtn key={item.key} item={item} active={activeNav === item.key} collapsed={collapsed} onClick={() => goTo(item.key)} />
            ))}
          </nav>

          {/* Scroll down */}
          <button onClick={() => scroll('down')} style={{ width: '100%', padding: '3px 0', background: 'none', border: 'none', borderTop: '1px solid rgba(27,42,107,0.07)', cursor: 'pointer', color: 'rgba(27,42,107,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1B2A6B')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,42,107,0.35)')}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {/* Logout */}
          <div style={{ borderTop: '1px solid rgba(27,42,107,0.08)', padding: '8px 8px' }}>
            <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: collapsed ? '10px 0' : '9px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer',
              color: '#DC2626', fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s, background 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#B91C1C'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.07)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#DC2626'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Breadcrumb bar */}
          <div style={{
            padding: '6px 24px', borderBottom: '1px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>HQ Portal</span>
              <svg width="12" height="12" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1B2A6B' }}>{pageTitle}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 11, fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')} title="Help">?</button>
              <button style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')} title="Notifications">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              <PaletteButton variant="light" />
              {user && <UserMenu user={user} onLogout={handleLogout} variant="light" />}
            </div>
          </div>

          <div style={{ padding: '20px 28px', flex: 1, overflowY: 'auto' }}>
            {activeNav === 'dashboard'    && <DashboardSection onNavigate={navigateTo} />}
            {activeNav === 'applications' && <ApplicationsSection initialTab={appTab} />}
            {activeNav === 'nomination'   && <NominationSection />}
            {activeNav === 'eia-offices'  && <EIAOfficesSection />}
          </div>
        </main>
      </div>

      {/* ── Footer bar ── */}
      <div style={{ flexShrink: 0, padding: '7px 24px', background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>© 2026 Export Inspection Council. All Rights Reserved.</span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>HQ Portal &nbsp;|&nbsp; <span style={{ color: '#ffffff', fontWeight: 600 }}>Export Inspection Council</span></span>
      </div>
    </div>
  );
}
