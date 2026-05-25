import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  Officer,
  CreateOfficerDto,
  CertificateProduct,
  OfficeStub,
  OfficerDetail,
} from '../../services/admin.service';
import { INDIA_STATES, getDistricts } from '../../data/india-geo';

function TablePagination({ page, total, pageSize, onPage, onPageSize }: {
  page: number; total: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

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
    width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff', cursor: 'pointer', fontSize: 12, color: '#374151',
    fontWeight: 500, flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #E8EDF5', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>Rows per page:</span>
          <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(0); }}
            style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#ffffff', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
            {[5, 10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
          {total === 0 ? 'No records' : `${from}–${to} of ${total} records`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button disabled={page === 0} onClick={() => onPage(0)} title="First" style={{ ...nb, opacity: page === 0 ? 0.35 : 1, cursor: page === 0 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
        <button disabled={page === 0} onClick={() => onPage(page - 1)} title="Previous" style={{ ...nb, opacity: page === 0 ? 0.35 : 1, cursor: page === 0 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        {getPages().map((pg, idx) =>
          pg === '...'
            ? <span key={`e${idx}`} style={{ width: 28, textAlign: 'center', fontSize: 12, color: '#6B7280' }}>…</span>
            : <button key={pg} onClick={() => onPage(pg as number)} style={{ ...nb, backgroundColor: pg === page ? '#1B2A6B' : '#ffffff', color: pg === page ? '#fff' : '#374151', borderColor: pg === page ? '#1B2A6B' : '#E2E8F0', fontWeight: pg === page ? 700 : 500, cursor: 'pointer' }}>{(pg as number) + 1}</button>
        )}
        <button disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} title="Next" style={{ ...nb, opacity: page >= totalPages - 1 ? 0.35 : 1, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
        <button disabled={page >= totalPages - 1} onClick={() => onPage(totalPages - 1)} title="Last" style={{ ...nb, opacity: page >= totalPages - 1 ? 0.35 : 1, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

interface Credentials { email: string; tempPassword: string; role: string; }

function CredentialsModal({ creds, onClose }: { creds: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(`Login Email: ${creds.email}\nPassword: ${creds.tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const roleLabel: Record<string, string> = {
    OFFICER: 'Inspection Officer',
    EIA_ADMIN: 'EIA Office',
    SUB_EIA_ADMIN: 'Sub-EIA Office',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: 32, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="28" height="28" fill="none" stroke="#16A34A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Login Created Successfully</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6B7280' }}>
            A login account has been created for this {roleLabel[creds.role] ?? creds.role}.
          </p>
        </div>

        <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login Email</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1B2A6B', fontFamily: 'monospace' }}>{creds.email}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temporary Password</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1F2937', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{creds.tempPassword}</p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 500, textAlign: 'center', margin: '0 0 20px' }}>
          ⚠ Save these credentials now — the password cannot be shown again.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyAll} style={{
            flex: 1, backgroundColor: '#EEF2FF', color: '#1B2A6B', border: '1px solid #C7D2FE',
            borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            {copied ? '✓ Copied!' : 'Copy Credentials'}
          </button>
          <button onClick={onClose} style={{
            flex: 1, backgroundColor: '#1B2A6B', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" fill="none" stroke="#DC2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #D1D5DB', backgroundColor: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: '#DC2626', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid #D1D5DB',
  borderRadius: 6,
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {children}
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      backgroundColor: '#EEF2FF',
      borderLeft: '4px solid #1B2A6B',
      padding: '8px 14px',
      marginBottom: 14,
      borderRadius: '0 6px 6px 0',
    }}>
      <span style={{ fontWeight: 700, color: '#1B2A6B', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </span>
    </div>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: active ? '#DCFCE7' : '#FEE2E2',
      color: active ? '#166534' : '#991B1B',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ─── blank form ───────────────────────────────────────────────────────────── */

const BLANK: CreateOfficerDto = {
  name: '', qualification: '', designation: '',
  address: '', city: '', state: '', pincode: '',
  telephone: '', mobile: '', email: '', gender: 'MALE',
};

type Panel = 'list' | 'form' | 'assign-offices' | 'assign-products';

/* ═══════════════════════════════════════════════════════════════════════════
   View Assignments Modal (read-only)
═══════════════════════════════════════════════════════════════════════════ */
function ViewAssignmentsModal({
  type,
  officerName,
  detail,
  loading,
  onClose,
}: {
  type: 'offices' | 'products';
  officerName: string;
  detail: OfficerDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const isOffices = type === 'offices';
  const accentColor = isOffices ? '#1D4ED8' : '#C2410C';
  const accentBg    = isOffices ? '#EFF6FF' : '#FFF7ED';

  const offices = detail?.offices ?? [];

  const typeLabel: Record<string, string> = { EIC: 'EIC', EIA: 'EIA', SUB_EIA: 'Sub-EIA' };
  const typeBadgeColor: Record<string, { bg: string; color: string }> = {
    EIA:     { bg: '#EFF6FF', color: '#1D4ED8' },
    SUB_EIA: { bg: '#F5F3FF', color: '#7C3AED' },
    EIC:     { bg: '#F0FDFA', color: '#0F766E' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isOffices
                ? <svg width="18" height="18" fill="none" stroke={accentColor} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                : <svg width="18" height="18" fill="none" stroke={accentColor} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              }
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                Assigned {isOffices ? 'Offices' : 'Certificate Categories'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                <span style={{ fontWeight: 600, color: '#1B2A6B' }}>{officerName}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 6, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 44, borderRadius: 8, backgroundColor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : isOffices ? (
            offices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5" />
                </svg>
                No offices assigned
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {offices.map(({ office }) => {
                  const badge = typeBadgeColor[office.type] ?? typeBadgeColor.EIA;
                  return (
                    <div key={office.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: '1px solid #F3F4F6', backgroundColor: '#FAFAFA' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: badge.color, backgroundColor: badge.bg, padding: '2px 8px', borderRadius: 5, flexShrink: 0 }}>
                        {typeLabel[office.type] ?? office.type}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#374151', backgroundColor: '#F3F4F6', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                        {office.code}
                      </span>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{office.name}</span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            (detail?.categories ?? []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                No categories assigned
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(detail?.categories ?? []).map(({ category }) => (
                  <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: '1px solid #FEE4CC', backgroundColor: '#FFFAF7' }}>
                    <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                      {category}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {!loading && (isOffices
              ? `${offices.length} office${offices.length !== 1 ? 's' : ''} assigned`
              : `${(detail?.categories ?? []).length} categor${(detail?.categories ?? []).length !== 1 ? 'ies' : 'y'} assigned`
            )}
          </span>
          <button onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function OfficersSection() {
  const qc = useQueryClient();

  const [page, setPage]       = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch]   = useState('');
  const [panel, setPanel]     = useState<Panel>('list');
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<CreateOfficerDto>(BLANK);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  /* ── transfer state ─────────────────────────────────────────────────────── */
  const [transferTarget, setTransferTarget]           = useState<Officer | null>(null);
  const [transferCurrentIds, setTransferCurrentIds]   = useState<string[]>([]);

  /* ── assign state ────────────────────────────────────────────────────────── */
  const [assignOfficerId, setAssignOfficerId]         = useState<string | null>(null);
  const [assignOfficerName, setAssignOfficerName]     = useState('');
  const [selectedOfficeIds, setSelectedOfficeIds]         = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories]       = useState<string[]>([]);
  const [assigning, setAssigning]                     = useState(false);
  const [assignError, setAssignError]                 = useState('');
  const [credentials, setCredentials]                 = useState<Credentials | null>(null);
  const [confirmDeleteId, setConfirmDeleteId]         = useState<string | null>(null);
  const [viewAssign, setViewAssign]                   = useState<{ officerName: string; type: 'offices' | 'products'; detail: OfficerDetail | null; loading: boolean } | null>(null);

  /* ── queries ─────────────────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-officers', page, pageSize, search],
    queryFn: () => adminApi.getOfficers({ limit: pageSize, offset: page * pageSize, search: search || undefined }),
    select: r => r.data?.data,
  });

  const { data: allOffices } = useQuery({
    queryKey: ['admin-offices-all'],
    queryFn: () => adminApi.getAllOffices(),
    select: r => r.data?.data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: products } = useQuery({
    queryKey: ['admin-certificate-products'],
    queryFn: () => adminApi.getCertificateProducts(),
    select: r => r.data?.data,
    staleTime: 10 * 60 * 1000,
  });

  const officers = Array.isArray(data?.officers) ? data.officers : [];
  const total    = data?.total ?? 0;

  /* ── form helpers ────────────────────────────────────────────────────────── */
  function openCreate() {
    setEditId(null);
    setForm(BLANK);
    setError('');
    setPanel('form');
  }

  async function openEdit(id: string) {
    setError('');
    try {
      const res = await adminApi.getOfficerById(id);
      const o = res.data.data;
      setForm({
        name: o.name, qualification: o.qualification, designation: o.designation,
        address: o.address ?? '', city: o.city ?? '', state: o.state ?? '',
        pincode: o.pincode ?? '', telephone: o.telephone ?? '',
        mobile: o.mobile ?? '', email: o.email ?? '', gender: o.gender,
      });
      setEditId(id);
      setPanel('form');
    } catch {
      setError('Failed to load officer');
    }
  }

  async function openAssignOffices(officer: Officer) {
    setAssignError('');
    setAssignOfficerId(officer.id);
    setAssignOfficerName(officer.name);
    try {
      const res = await adminApi.getOfficerById(officer.id);
      setSelectedOfficeIds(res.data.data.offices.map(o => o.office.id));
    } catch {
      setSelectedOfficeIds([]);
    }
    setPanel('assign-offices');
  }

  async function openTransfer(officer: Officer) {
    try {
      const res = await adminApi.getOfficerById(officer.id);
      setTransferCurrentIds(res.data.data.offices.map((o: { office: { id: string } }) => o.office.id));
    } catch {
      setTransferCurrentIds([]);
    }
    setTransferTarget(officer);
  }

  async function openAssignProducts(officer: Officer) {
    setAssignError('');
    setAssignOfficerId(officer.id);
    setAssignOfficerName(officer.name);
    try {
      const res = await adminApi.getOfficerById(officer.id);
      setSelectedCategories(res.data.data.categories.map(c => c.category));
    } catch {
      setSelectedCategories([]);
    }
    setPanel('assign-products');
  }

  async function openViewAssignments(officer: Officer, type: 'offices' | 'products') {
    setViewAssign({ officerName: officer.name, type, detail: null, loading: true });
    try {
      const res = await adminApi.getOfficerById(officer.id);
      setViewAssign(prev => prev ? { ...prev, detail: res.data.data, loading: false } : null);
    } catch {
      setViewAssign(prev => prev ? { ...prev, loading: false } : null);
    }
  }

  function backToList() { setPanel('list'); setEditId(null); }

  function set(k: keyof CreateOfficerDto, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.qualification.trim() || !form.designation.trim()) {
      setError('Name, Qualification and Designation are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await adminApi.updateOfficer(editId, form);
        await qc.invalidateQueries({ queryKey: ['admin-officers'] });
        backToList();
      } else {
        const res = await adminApi.createOfficer(form);
        await qc.invalidateQueries({ queryKey: ['admin-officers'] });
        backToList();
        const creds = (res.data.data as unknown as { credentials?: Credentials }).credentials;
        if (creds) setCredentials(creds);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(officer: Officer) {
    await adminApi.updateOfficer(officer.id, { isActive: !officer.isActive });
    await qc.invalidateQueries({ queryKey: ['admin-officers'] });
  }

  async function handleSaveOffices() {
    if (!assignOfficerId) return;
    setAssigning(true);
    setAssignError('');
    try {
      await adminApi.assignOfficerOffices(assignOfficerId, selectedOfficeIds);
      await qc.invalidateQueries({ queryKey: ['admin-officers'] });
      backToList();
    } catch {
      setAssignError('Failed to assign offices');
    } finally {
      setAssigning(false);
    }
  }

  async function handleSaveProducts() {
    if (!assignOfficerId) return;
    setAssigning(true);
    setAssignError('');
    try {
      await adminApi.assignOfficerCategories(assignOfficerId, selectedCategories);
      await qc.invalidateQueries({ queryKey: ['admin-officers'] });
      backToList();
    } catch {
      setAssignError('Failed to assign categories');
    } finally {
      setAssigning(false);
    }
  }

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {credentials && <CredentialsModal creds={credentials} onClose={() => setCredentials(null)} />}
      {viewAssign && (
        <ViewAssignmentsModal
          type={viewAssign.type}
          officerName={viewAssign.officerName}
          detail={viewAssign.detail}
          loading={viewAssign.loading}
          onClose={() => setViewAssign(null)}
        />
      )}
      {transferTarget && (
        <TransferOfficerModal
          officer={transferTarget}
          allOffices={Array.isArray(allOffices) ? allOffices : []}
          currentOfficeIds={transferCurrentIds}
          onClose={() => setTransferTarget(null)}
          onConfirm={async (ids) => {
            await adminApi.assignOfficerOffices(transferTarget.id, ids);
            await qc.invalidateQueries({ queryKey: ['admin-officers'] });
            setTransferTarget(null);
          }}
        />
      )}
      {confirmDeleteId && (
        <ConfirmModal
          message="Delete this officer? This action cannot be undone."
          onConfirm={async () => {
            try {
              await adminApi.deleteOfficer(confirmDeleteId);
              qc.invalidateQueries({ queryKey: ['admin-officers'] });
              qc.invalidateQueries({ queryKey: ['admin-stats'] });
            } finally { setConfirmDeleteId(null); }
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {panel === 'list' && (
        <OfficerList
          officers={officers}
          isLoading={isLoading}
          search={search}
          setSearch={v => { setSearch(v); setPage(0); }}
          page={page}
          pageSize={pageSize}
          total={total}
          setPage={setPage}
          setPageSize={s => { setPageSize(s); setPage(0); }}
          onCreate={openCreate}
          onEdit={o => openEdit(o.id)}
          onToggle={handleToggleActive}
          onAssignOffices={openAssignOffices}
          onAssignProducts={openAssignProducts}
          onTransfer={openTransfer}
          onDelete={o => setConfirmDeleteId(o.id)}
          onViewAssignments={openViewAssignments}
          onResetLogin={async (o) => {
            try {
              const res = await adminApi.resetOfficerLogin(o.id);
              setCredentials(res.data.data);
            } catch (e: unknown) {
              alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed — ensure officer has an email');
            }
          }}
        />
      )}

      {panel === 'form' && (
        <OfficerForm
          editId={editId}
          form={form}
          set={set}
          saving={saving}
          error={error}
          onBack={backToList}
          onSave={handleSave}
        />
      )}

      {panel === 'assign-offices' && (
        <AssignOfficesPanel
          officerName={assignOfficerName}
          allOffices={Array.isArray(allOffices) ? allOffices : []}
          selected={selectedOfficeIds}
          setSelected={setSelectedOfficeIds}
          saving={assigning}
          error={assignError}
          onBack={backToList}
          onSave={handleSaveOffices}
        />
      )}

      {panel === 'assign-products' && (
        <AssignProductsPanel
          officerName={assignOfficerName}
          products={Array.isArray(products) ? products : []}
          selected={selectedCategories}
          setSelected={setSelectedCategories}
          saving={assigning}
          error={assignError}
          onBack={backToList}
          onSave={handleSaveProducts}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Officer List
═══════════════════════════════════════════════════════════════════════════ */
interface OfficerListProps {
  officers: Officer[];
  isLoading: boolean;
  search: string;
  setSearch: (v: string) => void;
  page: number;
  pageSize: number;
  total: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  onCreate: () => void;
  onEdit: (o: Officer) => void;
  onToggle: (o: Officer) => void;
  onAssignOffices: (o: Officer) => void;
  onAssignProducts: (o: Officer) => void;
  onTransfer: (o: Officer) => void;
  onResetLogin: (o: Officer) => void;
  onDelete: (o: Officer) => void;
  onViewAssignments: (o: Officer, type: 'offices' | 'products') => void;
}

function OfficerList(p: OfficerListProps) {
  const { page, pageSize, total, setPage, setPageSize, onViewAssignments } = p;
  const [openDrop, setOpenDrop] = useState<{ id: string; top: number; right: number } | null>(null);

  useEffect(() => {
    if (!openDrop) return;
    function close() { setOpenDrop(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openDrop]);


  return (
    <>
      {/* header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Officer Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>Manage inspection officers and their assignments</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              style={{ ...inputStyle, paddingLeft: 32, width: 260 }}
              placeholder="Search by name, designation, email…"
              value={p.search}
              onChange={e => p.setSearch(e.target.value)}
            />
          </div>
          <button onClick={p.onCreate} style={{
            background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(27,42,107,0.30)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Officer
          </button>
        </div>
      </div>

      {/* table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8EDF5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <colgroup>
              <col style={{ minWidth: 160 }} />
              <col style={{ minWidth: 110 }} />
              <col style={{ minWidth: 130 }} />
              <col style={{ minWidth: 100 }} />
              <col style={{ minWidth: 80 }} />
              <col style={{ minWidth: 76 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' }}>
                {[
                  { label: 'Officer Name', sortable: true },
                  { label: 'Qualification', sortable: true },
                  { label: 'Designation', sortable: true },
                  { label: 'Workplace', sortable: true },
                  { label: 'Cert. Category', sortable: true },
                  { label: 'Status', sortable: true },
                  { label: 'Actions', sortable: false },
                ].map(col => (
                  <th key={col.label} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{col.label}</span>
                      {col.sortable && (
                        <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.35)" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
                {/* sticky ⋮ column — no header */}
                <th style={{ padding: 0, position: 'sticky', right: 0, zIndex: 3, backgroundColor: '#1B2A6B', borderLeft: '1px solid rgba(255,255,255,0.08)', width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {p.isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F0F4FF' }}>
                    {[...Array(9)].map((__, j) => (
                      <td key={j} style={{ padding: '9px 12px' }}>
                        <div style={{ height: 13, borderRadius: 4, backgroundColor: '#F1F5F9', width: j === 0 ? 130 : j === 6 ? 140 : 70 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : p.officers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <svg width="36" height="36" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No officers found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                p.officers.map((o) => (
                  <tr key={o.id}
                    style={{ borderBottom: '1px solid #F0F4FF', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#1B2A6B', fontSize: 13 }}>{o.name}</span>
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontSize: 12, whiteSpace: 'nowrap' }}>{o.qualification}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{o.designation}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onViewAssignments(o, 'offices')}
                        title="View assigned offices"
                        style={{ display: 'inline-block', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: 12, border: '1px solid #BFDBFE', cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#DBEAFE'; (e.currentTarget as HTMLElement).style.borderColor = '#93C5FD'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF'; (e.currentTarget as HTMLElement).style.borderColor = '#BFDBFE'; }}
                      >
                        {o._count.offices}
                      </button>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onViewAssignments(o, 'products')}
                        title="View assigned categories"
                        style={{ display: 'inline-block', backgroundColor: '#FFF7ED', color: '#C2410C', borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: 12, border: '1px solid #FED7AA', cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FFEDD5'; (e.currentTarget as HTMLElement).style.borderColor = '#FDBA74'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FFF7ED'; (e.currentTarget as HTMLElement).style.borderColor = '#FED7AA'; }}
                      >
                        {o._count.categories}
                      </button>
                    </td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}><Badge active={o.isActive} /></td>
                    {/* Actions — Edit, Transfer, Deactivate only */}
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {/* Edit */}
                        <button onClick={() => p.onEdit(o)} title="Edit Officer" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFF', color: '#374151',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                        {/* Transfer */}
                        <button onClick={() => p.onTransfer(o)} title="Transfer Officer"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', color: '#D97706', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEF3C7')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFBEB')}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          Transfer
                        </button>
                        {/* Deactivate / Activate */}
                        <button onClick={() => p.onToggle(o)} title={o.isActive ? 'Deactivate' : 'Activate'}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${o.isActive ? '#FECACA' : '#BBF7D0'}`, backgroundColor: o.isActive ? '#FEF2F2' : '#F0FDF4', color: o.isActive ? '#DC2626' : '#16A34A', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = o.isActive ? '#FECACA' : '#DCFCE7')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = o.isActive ? '#FEF2F2' : '#F0FDF4')}>
                          {o.isActive
                            ? <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            : <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          }
                          {o.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>

                    {/* Sticky ⋮ dropdown column */}
                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', position: 'sticky', right: 0, backgroundColor: '#ffffff', borderLeft: '1px solid #E8EDF5', zIndex: 1, textAlign: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (openDrop?.id === o.id) { setOpenDrop(null); return; }
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setOpenDrop({ id: o.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        }}
                        title="More actions"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #BFDBFE', backgroundColor: openDrop?.id === o.id ? '#1B2A6B' : '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: openDrop?.id === o.id ? '#fff' : '#1D4ED8', transition: 'background 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#1B2A6B'; }}
                        onMouseLeave={e => { if (openDrop?.id !== o.id) { (e.currentTarget as HTMLElement).style.backgroundColor = '#EFF6FF'; (e.currentTarget as HTMLElement).style.color = '#1D4ED8'; (e.currentTarget as HTMLElement).style.borderColor = '#BFDBFE'; } }}
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} total={total} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Fixed dropdown — rendered outside scroll container so it's never clipped */}
      {openDrop && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', top: openDrop.top, right: openDrop.right, backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: 175, overflow: 'hidden' }}
        >
          {p.officers.filter(o => o.id === openDrop.id).map(o => (
            <div key={o.id}>
              {/* Assign Offices */}
              <button onClick={() => { setOpenDrop(null); p.onAssignOffices(o); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#1D4ED8', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Assign Offices
              </button>
              {/* Assign Categories */}
              <button onClick={() => { setOpenDrop(null); p.onAssignProducts(o); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#C2410C', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFF7ED')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Assign Categories
              </button>
              {/* Reset Login */}
              <button onClick={() => { setOpenDrop(null); p.onResetLogin(o); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0369A1', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F9FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                Reset Login
              </button>
              <div style={{ height: 1, backgroundColor: '#F3F4F6', margin: '2px 0' }} />
              {/* Delete */}
              <button onClick={() => { setOpenDrop(null); p.onDelete(o); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#DC2626', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}


/* ─── Address sub-form ─────────────────────────────────────────────────────── */
function AddressFields({ form, set }: { form: CreateOfficerDto; set: (k: keyof CreateOfficerDto, v: string) => void }) {
  const districts = getDistricts(form.state ?? '');
  const disabledStyle: React.CSSProperties = { ...inputStyle, backgroundColor: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', marginBottom: 28 }}>
      <div style={{ gridColumn: '1 / 4' }}>
        <FormLabel>Street Address</FormLabel>
        <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="House / Flat, Street, Area" />
      </div>
      <div>
        <FormLabel>State</FormLabel>
        <select
          style={selectStyle}
          value={form.state ?? ''}
          onChange={e => { set('state', e.target.value); set('city', ''); }}
        >
          <option value="">Select state</option>
          {INDIA_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <FormLabel>District</FormLabel>
        <select
          style={form.state ? selectStyle : disabledStyle}
          disabled={!form.state}
          value={form.city ?? ''}
          onChange={e => set('city', e.target.value)}
        >
          <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <FormLabel>Pincode</FormLabel>
        <input style={inputStyle} value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" maxLength={6} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Officer Form
═══════════════════════════════════════════════════════════════════════════ */
interface OfficerFormProps {
  editId: string | null;
  form: CreateOfficerDto;
  set: (k: keyof CreateOfficerDto, v: string) => void;
  saving: boolean;
  error: string;
  onBack: () => void;
  onSave: () => void;
}

function OfficerForm({ editId, form, set, saving, error, onBack, onSave }: OfficerFormProps) {
  return (
    <div>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 28 }}>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: '#DC2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── Personal Information ── */}
        <SectionHeader title="Personal Information" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', marginBottom: 24 }}>
          <div style={{ gridColumn: '1 / 3' }}>
            <FormLabel>Full Name *</FormLabel>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Officer full name" />
          </div>
          <div>
            <FormLabel>Gender</FormLabel>
            <select style={selectStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <FormLabel>Qualification *</FormLabel>
            <input style={inputStyle} value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="e.g. B.Sc. (Agriculture)" />
          </div>
          <div style={{ gridColumn: '2 / 4' }}>
            <FormLabel>Designation *</FormLabel>
            <input style={inputStyle} value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Senior Inspection Officer" />
          </div>
        </div>

        {/* ── Contact Details ── */}
        <SectionHeader title="Contact Details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 20px', marginBottom: 24 }}>
          <div>
            <FormLabel>Mobile</FormLabel>
            <input style={inputStyle} value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="10-digit mobile" />
          </div>
          <div>
            <FormLabel>Telephone</FormLabel>
            <input style={inputStyle} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="STD + number" />
          </div>
          <div>
            <FormLabel>Email</FormLabel>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="officer@example.gov.in" />
          </div>
        </div>

        {/* ── Address ── */}
        <SectionHeader title="Address" />
        <AddressFields form={form} set={set} />


        {/* actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onBack} style={{
            backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB',
            borderRadius: 8, padding: '9px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{
            backgroundColor: '#1B2A6B', color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 28px', fontWeight: 600, fontSize: 14,
            cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving…' : editId ? 'Update Officer' : 'Create Officer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Transfer Officer Modal
═══════════════════════════════════════════════════════════════════════════ */
interface TransferModalProps {
  officer: Officer;
  allOffices: OfficeStub[];
  currentOfficeIds: string[];
  onClose: () => void;
  onConfirm: (officeIds: string[]) => Promise<void>;
}

function TransferOfficerModal({ officer, allOffices, currentOfficeIds, onClose, onConfirm }: TransferModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(currentOfficeIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const transferable = allOffices.filter(o => o.type === 'EIA' || o.type === 'SUB_EIA');
  const filtered = transferable.filter(o => {
    const q = search.toLowerCase();
    return !q || o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q);
  });

  const eiaOffices    = filtered.filter(o => o.type === 'EIA');
  const subEiaOffices = filtered.filter(o => o.type === 'SUB_EIA');

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function handleConfirm() {
    setSaving(true);
    setError('');
    try {
      await onConfirm(selected);
      onClose();
    } catch {
      setError('Transfer failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const changed = JSON.stringify([...selected].sort()) !== JSON.stringify([...currentOfficeIds].sort());

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" fill="none" stroke="#D97706" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Transfer Officer</h3>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
              Reassign <span style={{ fontWeight: 600, color: '#1B2A6B' }}>{officer.name}</span> to EIA / Sub-EIA office(s)
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 6, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current offices info bar */}
        {currentOfficeIds.length > 0 && (
          <div style={{ padding: '8px 24px', backgroundColor: '#FFF7ED', borderBottom: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" fill="none" stroke="#D97706" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 8v4m0 4h.01"/></svg>
            <span style={{ fontSize: 12, color: '#92400E' }}>
              Currently assigned to <strong>{currentOfficeIds.length}</strong> office{currentOfficeIds.length !== 1 ? 's' : ''}. Selection below will <strong>replace</strong> current assignments.
            </span>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '14px 24px 10px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search offices by name or code…"
              autoFocus
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, fontSize: 13, border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#111827', boxSizing: 'border-box', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Office list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 8px', display: 'block' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p style={{ margin: 0, fontSize: 13 }}>No offices match "<strong>{search}</strong>"</p>
            </div>
          ) : (
            <>
              {eiaOffices.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '6px 0 6px', borderBottom: '1px solid #DBEAFE', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1D4ED8' }} />
                    EIA — Export Inspection Agency
                    <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 10, color: '#3B82F6' }}>{eiaOffices.filter(o => selected.includes(o.id)).length}/{eiaOffices.length} selected</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {eiaOffices.map(o => {
                      const isSel = selected.includes(o.id);
                      const wasOriginal = currentOfficeIds.includes(o.id);
                      return (
                        <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', backgroundColor: isSel ? '#EFF6FF' : 'transparent', border: `1px solid ${isSel ? '#BFDBFE' : 'transparent'}`, transition: 'all 0.1s' }}
                          onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSel ? '#EFF6FF' : 'transparent'; }}>
                          <input type="checkbox" checked={isSel} onChange={() => toggle(o.id)}
                            style={{ accentColor: '#1D4ED8', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: isSel ? '#1D4ED8' : '#374151', backgroundColor: isSel ? '#DBEAFE' : '#F3F4F6', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{o.code}</span>
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                            {wasOriginal && <span style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', flexShrink: 0 }}>current</span>}
                          </div>
                          {isSel && <svg width="14" height="14" fill="none" stroke="#1D4ED8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {subEiaOffices.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '6px 0 6px', borderBottom: '1px solid #EDE9FE', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                    Sub-EIA — Sub Offices
                    <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 10, color: '#7C3AED' }}>{subEiaOffices.filter(o => selected.includes(o.id)).length}/{subEiaOffices.length} selected</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {subEiaOffices.map(o => {
                      const isSel = selected.includes(o.id);
                      const wasOriginal = currentOfficeIds.includes(o.id);
                      return (
                        <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', backgroundColor: isSel ? '#F5F3FF' : 'transparent', border: `1px solid ${isSel ? '#DDD6FE' : 'transparent'}`, transition: 'all 0.1s' }}
                          onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSel ? '#F5F3FF' : 'transparent'; }}>
                          <input type="checkbox" checked={isSel} onChange={() => toggle(o.id)}
                            style={{ accentColor: '#7C3AED', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: isSel ? '#7C3AED' : '#374151', backgroundColor: isSel ? '#EDE9FE' : '#F3F4F6', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{o.code}</span>
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                            {wasOriginal && <span style={{ fontSize: 10, color: '#6B7280', fontStyle: 'italic', flexShrink: 0 }}>current</span>}
                          </div>
                          {isSel && <svg width="14" height="14" fill="none" stroke="#7C3AED" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '0 24px 8px', padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 8v4m0 4h.01"/></svg>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, backgroundColor: '#FAFAFA' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {selected.length > 0 ? (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selected.length} office{selected.length !== 1 ? 's' : ''} selected
                </div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                  {allOffices
                    .filter(o => selected.includes(o.id))
                    .map(o => o.name)
                    .join(', ')}
                </div>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>No offices selected</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || !changed}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: (!changed || saving) ? '#9CA3AF' : '#D97706', color: '#fff', fontSize: 13, fontWeight: 600, cursor: (!changed || saving) ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (changed && !saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#B45309'; }}
              onMouseLeave={e => { if (changed && !saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#D97706'; }}>
              {saving ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}><path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>Transferring…</>
              ) : (
                <><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>Confirm Transfer</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Assign Offices Panel
═══════════════════════════════════════════════════════════════════════════ */
interface AssignOfficesProps {
  officerName: string;
  allOffices: OfficeStub[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  saving: boolean;
  error: string;
  onBack: () => void;
  onSave: () => void;
}

const GROUP_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  EIC:     { label: 'EIC — Export Inspection Council',  color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  EIA:     { label: 'EIA — Export Inspection Agency',   color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  SUB_EIA: { label: 'Sub-EIA — Sub Offices',            color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
};

function AssignOfficesPanel({ officerName, allOffices, selected, setSelected, saving, error, onBack, onSave }: AssignOfficesProps) {
  const [searchO, setSearchO] = useState('');

  const filtered = allOffices.filter(o => {
    const q = searchO.toLowerCase();
    return !q || o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce<Record<string, OfficeStub[]>>((acc, o) => {
    if (o.type === 'EIC') return acc;
    const key = o.type === 'EIA' ? 'EIA' : 'SUB_EIA';
    (acc[key] = acc[key] ?? []).push(o);
    return acc;
  }, {});

  const groupOrder = ['EIA', 'SUB_EIA'];

  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  function toggleGroup(ids: string[], allSelected: boolean) {
    if (allSelected) setSelected(selected.filter(x => !ids.includes(x)));
    else setSelected([...new Set([...selected, ...ids])]);
  }

  function toggleAll() {
    if (selected.length === allOffices.length) setSelected([]);
    else setSelected(allOffices.map(o => o.id));
  }

  const allSelected = selected.length === allOffices.length && allOffices.length > 0;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header — single production row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Icon */}
        <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="#4338CA" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        {/* Title + officer name inline */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Assign Offices</span>
          <span style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>for</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2A6B', whiteSpace: 'nowrap' }}>{officerName}</span>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchO}
              onChange={e => setSearchO(e.target.value)}
              placeholder="Search offices…"
              style={{ padding: '6px 28px 6px 28px', fontSize: 12, border: '1.5px solid #E5E7EB', borderRadius: 8, backgroundColor: '#F9FAFB', color: '#111827', width: 200, outline: 'none', boxSizing: 'border-box' as const }}
              onFocus={e => (e.currentTarget.style.borderColor = '#A5B4FC')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
            {searchO && (
              <button onClick={() => setSearchO('')}
                style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex', borderRadius: 4 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 22, backgroundColor: '#E5E7EB' }} />

          {/* Selected count pill */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            backgroundColor: selected.length > 0 ? '#EEF2FF' : '#F3F4F6',
            border: `1px solid ${selected.length > 0 ? '#C7D2FE' : '#E5E7EB'}`,
            fontSize: 12, fontWeight: 600,
            color: selected.length > 0 ? '#4338CA' : '#9CA3AF',
            transition: 'all 0.15s',
          }}>
            {selected.length > 0
              ? <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
              : <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            }
            {selected.length > 0 ? `${selected.length} selected` : 'None selected'}
          </span>

          {/* Divider */}
          <div style={{ width: 1, height: 22, backgroundColor: '#E5E7EB' }} />

          {/* Select All / Deselect All */}
          <button
            onClick={toggleAll}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8,
              border: '1.5px solid #C7D2FE',
              backgroundColor: allSelected ? '#EEF2FF' : '#fff',
              color: '#4338CA', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EEF2FF'; (e.currentTarget as HTMLElement).style.borderColor = '#A5B4FC'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = allSelected ? '#EEF2FF' : '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#C7D2FE'; }}
          >
            {allSelected
              ? <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>Deselect All</>
              : <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Select All</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#DC2626', fontSize: 13 }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 8v4m0 4h.01"/></svg>
          {error}
        </div>
      )}



      {/* ── Groups ── */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        {groupOrder.filter(k => grouped[k]?.length).map((key, gi) => {
          const offices = grouped[key];
          const meta = GROUP_META[key];
          const groupIds = offices.map(o => o.id);
          const allGroupSelected = groupIds.every(id => selected.includes(id));
          const someGroupSelected = groupIds.some(id => selected.includes(id)) && !allGroupSelected;

          return (
            <div key={key} style={{ borderTop: gi > 0 ? '1px solid #F3F4F6' : 'none' }}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: meta.bg, borderBottom: `1px solid ${meta.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    ref={el => { if (el) el.indeterminate = someGroupSelected; }}
                    onChange={() => toggleGroup(groupIds, allGroupSelected)}
                    style={{ accentColor: '#1B2A6B', width: 13, height: 13, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {meta.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, backgroundColor: meta.border, padding: '2px 8px', borderRadius: 10 }}>
                  {groupIds.filter(id => selected.includes(id)).length}/{offices.length}
                </span>
              </div>

              {/* Office items */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, backgroundColor: '#F9FAFB' }}>
                {offices.map(o => {
                  const isSel = selected.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '9px 14px', backgroundColor: isSel ? '#EEF2FF' : '#fff',
                        borderLeft: isSel ? '3px solid #4338CA' : '3px solid transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSel ? '#EEF2FF' : '#fff'; }}
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(o.id)}
                        style={{ accentColor: '#4338CA', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: isSel ? '#4338CA' : '#374151', backgroundColor: isSel ? '#E0E7FF' : '#F3F4F6', padding: '1px 6px', borderRadius: 4 }}>
                            {o.code}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: isSel ? '#1E1B4B' : '#6B7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.name}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <svg width="32" height="32" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 10px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: 13 }}>No offices match <strong>"{searchO}"</strong></p>
            <button onClick={() => setSearchO('')} style={{ marginTop: 8, fontSize: 12, color: '#4338CA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
          </div>
        )}
      </div>

      {/* ── Sticky Footer ── */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 0, padding: '12px 16px',
        backgroundColor: '#fff',
        borderTop: '1.5px solid #E5E7EB',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        borderRadius: '0 0 10px 10px',
      }}>
        {/* Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: (someSelected || allSelected) ? '#4338CA' : '#D1D5DB' }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {someSelected || allSelected
              ? <><span style={{ fontWeight: 700, color: '#1B2A6B' }}>{selected.length}</span> of {allOffices.length} offices selected</>
              : <span style={{ color: '#9CA3AF' }}>No offices selected</span>}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onBack}
            style={{ backgroundColor: '#F9FAFB', color: '#374151', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, backgroundColor: saving ? '#93C5FD' : '#1B2A6B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 13, cursor: saving ? 'wait' : 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#162255'; }}
            onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; }}
          >
            {saving ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Save Assignments
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Assign Products Panel
═══════════════════════════════════════════════════════════════════════════ */
interface AssignProductsProps {
  officerName: string;
  products: CertificateProduct[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  saving: boolean;
  error: string;
  onBack: () => void;
  onSave: () => void;
}

function AssignProductsPanel({ officerName, products, selected, setSelected, saving, error, onBack, onSave }: AssignProductsProps) {
  const [searchP, setSearchP] = useState('');

  /* Build category map from all products (not filtered — we always show all categories) */
  const allGrouped = products.reduce<Record<string, CertificateProduct[]>>((acc, p) => {
    const key = p.category ?? '__none__';
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  const allCatKeys = Object.keys(allGrouped).sort((a, b) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return a.localeCompare(b);
  });

  /* Filter categories by search */
  const q = searchP.toLowerCase();
  const catKeys = q
    ? allCatKeys.filter(k => (k === '__none__' ? 'uncategorised' : k).toLowerCase().includes(q))
    : allCatKeys;

  function isCatSelected(key: string) {
    return selected.includes(key);
  }

  function toggleCat(key: string) {
    if (isCatSelected(key)) {
      setSelected(selected.filter(c => c !== key));
    } else {
      setSelected([...selected, key]);
    }
  }

  function toggleAll(allSel: boolean) {
    if (allSel) setSelected([]);
    else setSelected([...allCatKeys]);
  }

  const selectedCatCount = allCatKeys.filter(k => isCatSelected(k)).length;
  const totalCats = allCatKeys.length;
  const allSelected = selectedCatCount === totalCats && totalCats > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="#C2410C" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Assign Certificate Categories</span>
          <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>for</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2A6B', marginLeft: 6 }}>{officerName}</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchP}
            onChange={e => setSearchP(e.target.value)}
            placeholder="Search categories…"
            style={{ padding: '7px 28px 7px 32px', fontSize: 13, border: '1.5px solid #E5E7EB', borderRadius: 8, backgroundColor: '#F9FAFB', color: '#111827', width: 220, outline: 'none', boxSizing: 'border-box' as const }}
            onFocus={e => (e.currentTarget.style.borderColor = '#FCA5A5')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          />
          {searchP && (
            <button onClick={() => setSearchP('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Selected pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 20,
          backgroundColor: selectedCatCount > 0 ? '#FFF7ED' : '#F3F4F6',
          border: `1px solid ${selectedCatCount > 0 ? '#FED7AA' : '#E5E7EB'}`,
          fontSize: 12, fontWeight: 600,
          color: selectedCatCount > 0 ? '#C2410C' : '#9CA3AF',
          whiteSpace: 'nowrap',
        }}>
          {selectedCatCount > 0
            ? <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            : <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          }
          {selectedCatCount > 0 ? `${selectedCatCount} of ${totalCats} selected` : 'None selected'}
        </span>

        {/* Select All / Deselect All */}
        <button
          onClick={() => toggleAll(allSelected)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #FED7AA', backgroundColor: allSelected ? '#FFF7ED' : '#fff', color: '#C2410C', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FFF7ED'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = allSelected ? '#FFF7ED' : '#fff'; }}
        >
          {allSelected
            ? <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>Deselect All</>
            : <><svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Select All</>
          }
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#DC2626', fontSize: 13 }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 8v4m0 4h.01"/></svg>
          {error}
        </div>
      )}

      {/* ── Category list ── */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', maxHeight: 520, overflowY: 'auto' }}>
        {catKeys.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <svg width="32" height="32" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 10px', display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: 13 }}>
              {searchP ? <>No categories match "<strong>{searchP}</strong>"</> : 'No categories available'}
            </p>
            {searchP && <button onClick={() => setSearchP('')} style={{ marginTop: 8, fontSize: 12, color: '#C2410C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>}
          </div>
        ) : (
          catKeys.map((catKey, gi) => {
            const prods = allGrouped[catKey];
            const label = catKey === '__none__' ? 'Uncategorised' : catKey;
            const isSel = isCatSelected(catKey);

            return (
              <label
                key={catKey}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 20px',
                  backgroundColor: isSel ? '#FFF7ED' : '#fff',
                  borderTop: gi > 0 ? '1px solid #F3F4F6' : 'none',
                  borderLeft: isSel ? '4px solid #F97316' : '4px solid transparent',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFAF7'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSel ? '#FFF7ED' : '#fff'; }}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggleCat(catKey)}
                  style={{ accentColor: '#C2410C', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? '#7C2D12' : '#C2410C', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
                  {label}
                </span>
                <span style={{ fontSize: 11, color: isSel ? '#92400E' : '#9CA3AF', backgroundColor: isSel ? '#FED7AA' : '#F3F4F6', padding: '2px 9px', borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>
                  {prods.length} product{prods.length !== 1 ? 's' : ''}
                </span>
                {isSel && (
                  <svg width="16" height="16" fill="none" stroke="#F97316" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </label>
            );
          })
        )}
      </div>

      {/* ── Sticky Footer ── */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', backgroundColor: '#fff',
        borderTop: '1.5px solid #E5E7EB',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        borderRadius: '0 0 10px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: selectedCatCount > 0 ? '#F97316' : '#D1D5DB' }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            {selectedCatCount > 0
              ? <><span style={{ fontWeight: 700, color: '#C2410C' }}>{selectedCatCount}</span> of {totalCats} categor{totalCats !== 1 ? 'ies' : 'y'} selected</>
              : <span style={{ color: '#9CA3AF' }}>No categories selected</span>}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack}
            style={{ backgroundColor: '#F9FAFB', color: '#374151', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '8px 22px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, backgroundColor: saving ? '#FCA5A5' : '#C2410C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, fontSize: 13, cursor: saving ? 'wait' : 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#991B1B'; }}
            onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLElement).style.backgroundColor = '#C2410C'; }}>
            {saving ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}><path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>Saving…</>
            ) : (
              <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Save Assignments</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
