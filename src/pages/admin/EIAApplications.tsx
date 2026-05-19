import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface Application {
  id: string;
  appNo: string;
  type: 'ESTABLISHMENT' | 'PIA';
  status: string;
  organisation: string;
  applicantName: string;
  submittedAt: string | null;
  createdAt: string;
}

interface Stats { total: number; pending: number; deficient: number; recognised: number; }

interface AppsResponse {
  applications: Application[];
  total: number;
  limit: number;
  offset: number;
  stats: Stats;
}

/* ─── constants ──────────────────────────────────────────────────────────── */
const TYPE_OPTS = ['all', 'ESTABLISHMENT', 'PIA'];
const STATUS_OPTS = ['all', 'DRAFT', 'SUBMITTED', 'DEFICIENT', 'DEFICIENCY_RESPONDED', 'APPROVED', 'REJECTED', 'COA_ISSUED'];

const TYPE_LABEL: Record<string, string>  = { ESTABLISHMENT: 'Establishment', PIA: 'PIA', all: 'All Types' };
const STATUS_LABEL: Record<string, string> = {
  all: 'All Statuses', DRAFT: 'Draft', SUBMITTED: 'Submitted',
  DEFICIENT: 'Deficient', DEFICIENCY_RESPONDED: 'Deficiency Responded',
  APPROVED: 'Approved', REJECTED: 'Rejected', COA_ISSUED: 'CoA Issued',
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  DRAFT:                 { bg: '#F1F5F9', fg: '#475569',  border: '#CBD5E1' },
  SUBMITTED:             { bg: '#EFF6FF', fg: '#2563EB',  border: '#BFDBFE' },
  DEFICIENT:             { bg: '#FEF2F2', fg: '#DC2626',  border: '#FECACA' },
  DEFICIENCY_RESPONDED:  { bg: '#F5F3FF', fg: '#7C3AED',  border: '#DDD6FE' },
  APPROVED:              { bg: '#F0FDF4', fg: '#16A34A',  border: '#BBF7D0' },
  REJECTED:              { bg: '#FEF2F2', fg: '#DC2626',  border: '#FECACA' },
  COA_ISSUED:            { bg: '#DCFCE7', fg: '#166534',  border: '#86EFAC' },
};

const TYPE_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  ESTABLISHMENT: { bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A' },
  PIA:           { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
};

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  return `${diff}d`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, borderColor, iconBg, icon, loading }: {
  label: string; value: number; borderColor: string; iconBg: string; icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 12, padding: '20px 24px',
      border: `1.5px solid ${borderColor}`,
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      flex: 1,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        {loading
          ? <div style={{ width: 48, height: 28, borderRadius: 6, backgroundColor: '#F1F5F9' }} />
          : <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>{value}</p>
        }
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── status update modal ────────────────────────────────────────────────── */
function StatusModal({ app, onClose, onSave }: {
  app: Application; onClose: () => void; onSave: (status: string, remarks: string) => Promise<void>;
}) {
  const [status, setStatus]   = useState(app.status);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving]   = useState(false);

  const statusOptions = STATUS_OPTS.filter(s => s !== 'all' && s !== 'DRAFT');

  async function handleSave() {
    setSaving(true);
    try { await onSave(status, remarks); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1F2937' }}>Update Application Status</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>{app.appNo} — {app.organisation}</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>New Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14, color: '#1F2937', backgroundColor: '#fff', cursor: 'pointer', outline: 'none' }}>
            {statusOptions.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Remarks (optional)</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Add remarks or reason for status change…"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 14, color: '#1F2937', backgroundColor: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #D1D5DB', backgroundColor: '#F9FAFB', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', backgroundColor: '#1B2A6B', color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function EIAApplications() {
  const qc = useQueryClient();

  const [tab, setTab]         = useState<'pending' | 'all'>('pending');
  const [search, setSearch]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]       = useState(0);
  const [selected, setSelected] = useState<Application | null>(null);

  const LIMIT = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['portal-applications', tab, search, typeFilter, statusFilter, page],
    queryFn: () => api.get<{ success: boolean; data: AppsResponse }>('/portal/applications', {
      params: {
        tab, limit: LIMIT, offset: page * LIMIT,
        search: search || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
    }).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const apps  = data?.applications ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats ?? { total: 0, pending: 0, deficient: 0, recognised: 0 };
  const pages = Math.ceil(total / LIMIT);

  async function handleStatusUpdate(status: string, remarks: string) {
    if (!selected) return;
    await api.put(`/portal/applications/${selected.id}/status`, { status, remarks });
    await qc.invalidateQueries({ queryKey: ['portal-applications'] });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {selected && (
        <StatusModal
          app={selected}
          onClose={() => setSelected(null)}
          onSave={handleStatusUpdate}
        />
      )}

      {/* Refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => refetch()} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16 }}>
        <StatCard label="Total Applications" value={stats.total} borderColor="#93C5FD" iconBg="#EFF6FF" loading={isLoading}
          icon={<svg width="22" height="22" fill="none" stroke="#2563EB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="Pending Action" value={stats.pending} borderColor="#FCD34D" iconBg="#FFFBEB" loading={isLoading}
          icon={<svg width="22" height="22" fill="none" stroke="#D97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Deficient" value={stats.deficient} borderColor="#FCA5A5" iconBg="#FEF2F2" loading={isLoading}
          icon={<svg width="22" height="22" fill="none" stroke="#DC2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard label="Recognised / CoA Issued" value={stats.recognised} borderColor="#86EFAC" iconBg="#F0FDF4" loading={isLoading}
          icon={<svg width="22" height="22" fill="none" stroke="#16A34A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Table card */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Tabs + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #E5E7EB', gap: 16 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {(['pending', 'all'] as const).map(t => {
              const label = t === 'pending' ? 'Pending Action' : 'All Applications';
              const count = t === 'pending' ? stats.pending : stats.total;
              const active = tab === t;
              return (
                <button key={t} onClick={() => { setTab(t); setPage(0); setStatusFilter('all'); }} style={{
                  padding: '14px 4px', marginRight: 24, fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? '#1B2A6B' : '#6B7280', background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #1B2A6B' : '2px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                }}>
                  {label}
                  <span style={{ backgroundColor: active ? '#1B2A6B' : '#E5E7EB', color: active ? '#fff' : '#6B7280', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search app no, org."
                style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB', color: '#374151', outline: 'none', width: 200 }}
              />
            </div>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              style={{ padding: '8px 32px 8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB', color: '#374151', cursor: 'pointer', outline: 'none', backgroundColor: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
            </select>
            {tab === 'all' && (
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                style={{ padding: '8px 32px 8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB', color: '#374151', cursor: 'pointer', outline: 'none', backgroundColor: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                {['APP NO.', 'ORGANISATION', 'APPLICANT', 'TYPE', 'STATUS', 'SUBMITTED', 'AGE (DAYS)', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.06em', backgroundColor: '#FAFAFA', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    {[140, 100, 100, 80, 100, 90, 50, 20].map((w, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 13, borderRadius: 4, backgroundColor: '#F3F4F6', width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    No applications found
                  </td>
                </tr>
              ) : (
                apps.map((app, i) => {
                  const ts = TYPE_STYLE[app.type] ?? TYPE_STYLE.ESTABLISHMENT;
                  const ss = STATUS_STYLE[app.status] ?? STATUS_STYLE.DRAFT;
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FAFAFA')}>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#1B2A6B', fontSize: 13, fontFamily: 'monospace' }}>{app.appNo}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#1F2937', fontWeight: 500 }}>{app.organisation}</td>
                      <td style={{ padding: '13px 16px', color: '#6B7280' }}>{app.applicantName}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: ts.bg, color: ts.fg, border: `1px solid ${ts.border}`, borderRadius: 20, padding: '3px 12px' }}>
                          {TYPE_LABEL[app.type]}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: ss.bg, color: ss.fg, border: `1px solid ${ss.border}`, borderRadius: 20, padding: '3px 12px', whiteSpace: 'nowrap' }}>
                          {STATUS_LABEL[app.status] ?? app.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <svg width="13" height="13" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {fmtDate(app.submittedAt)}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: '#374151' }}>
                        {daysSince(app.submittedAt)}
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <button onClick={() => setSelected(app)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#1B2A6B')} onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <PageBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</PageBtn>
              {[...Array(Math.min(pages, 7))].map((_, i) => (
                <PageBtn key={i} active={i === page} onClick={() => setPage(i)}>{i + 1}</PageBtn>
              ))}
              <PageBtn disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next →</PageBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 12px', borderRadius: 6, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
      border: active ? '2px solid #1B2A6B' : '1px solid #E5E7EB',
      backgroundColor: active ? '#1B2A6B' : '#fff',
      color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
      fontWeight: active ? 700 : 400,
    }}>
      {children}
    </button>
  );
}
