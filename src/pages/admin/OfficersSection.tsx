import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  Officer,
  CreateOfficerDto,
  CertificateProduct,
  OfficeStub,
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
    width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)',
    fontWeight: 500, flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rows per page:</span>
          <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(0); }}
            style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
            {[5, 10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
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
            ? <span key={`e${idx}`} style={{ width: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
            : <button key={pg} onClick={() => onPage(pg as number)} style={{ ...nb, backgroundColor: pg === page ? 'var(--bg-nav)' : 'var(--bg-card)', color: pg === page ? '#fff' : 'var(--text-primary)', borderColor: pg === page ? 'var(--bg-nav)' : 'var(--border-subtle)', fontWeight: pg === page ? 700 : 500, cursor: 'pointer' }}>{(pg as number) + 1}</button>
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

function GenderBadge({ gender }: { gender: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    MALE:   { bg: '#DBEAFE', color: '#1E40AF', label: 'Male' },
    FEMALE: { bg: '#FCE7F3', color: '#9D174D', label: 'Female' },
    OTHER:  { bg: '#F3F4F6', color: '#374151', label: 'Other' },
  };
  const s = map[gender] ?? map.OTHER;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
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

  /* ── assign state ────────────────────────────────────────────────────────── */
  const [assignOfficerId, setAssignOfficerId]         = useState<string | null>(null);
  const [assignOfficerName, setAssignOfficerName]     = useState('');
  const [selectedOfficeIds, setSelectedOfficeIds]     = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds]   = useState<string[]>([]);
  const [assigning, setAssigning]                     = useState(false);
  const [assignError, setAssignError]                 = useState('');
  const [credentials, setCredentials]                 = useState<Credentials | null>(null);
  const [confirmDeleteId, setConfirmDeleteId]         = useState<string | null>(null);

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

  async function openAssignProducts(officer: Officer) {
    setAssignError('');
    setAssignOfficerId(officer.id);
    setAssignOfficerName(officer.name);
    try {
      const res = await adminApi.getOfficerById(officer.id);
      setSelectedProductIds(res.data.data.products.map(p => p.product.id));
    } catch {
      setSelectedProductIds([]);
    }
    setPanel('assign-products');
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
      await adminApi.assignOfficerProducts(assignOfficerId, selectedProductIds);
      await qc.invalidateQueries({ queryKey: ['admin-officers'] });
      backToList();
    } catch {
      setAssignError('Failed to assign products');
    } finally {
      setAssigning(false);
    }
  }

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {credentials && <CredentialsModal creds={credentials} onClose={() => setCredentials(null)} />}
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
          onDelete={o => setConfirmDeleteId(o.id)}
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
          selected={selectedProductIds}
          setSelected={setSelectedProductIds}
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
  onResetLogin: (o: Officer) => void;
  onDelete: (o: Officer) => void;
}

function OfficerList(p: OfficerListProps) {
  const { page, pageSize, total, setPage, setPageSize } = p;

  const ib = (bg: string, color: string, border: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: bg, color, border: `1px solid ${border}`,
    cursor: 'pointer', flexShrink: 0,
  });

  return (
    <>
      {/* header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Officer Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>Manage inspection officers and their assignments</p>
        </div>
        <button onClick={p.onCreate} style={{
          backgroundColor: 'var(--bg-nav)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '9px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Officer
        </button>
      </div>

      {/* filter bar */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
        <div style={{ position: 'relative', maxWidth: 340 }}>
          <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Search by name, designation, email…"
            value={p.search}
            onChange={e => p.setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 860 }}>
            <colgroup>
              <col style={{ minWidth: 130 }} />
              <col style={{ minWidth: 100 }} />
              <col style={{ minWidth: 120 }} />
              <col style={{ minWidth: 110 }} />
              <col style={{ minWidth: 70 }} />
              <col style={{ minWidth: 64 }} />
              <col style={{ minWidth: 70 }} />
              <col style={{ minWidth: 76 }} />
              <col style={{ minWidth: 180 }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-utility)' }}>
                {[
                  { label: 'Name', sortable: true },
                  { label: 'Qualification', sortable: true },
                  { label: 'Designation', sortable: true },
                  { label: 'Mobile', sortable: false },
                  { label: 'Gender', sortable: false },
                  { label: 'Offices', sortable: true },
                  { label: 'Products', sortable: true },
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
              </tr>
            </thead>
            <tbody>
              {p.isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {[...Array(9)].map((__, j) => (
                      <td key={j} style={{ padding: '9px 12px' }}>
                        <div style={{ height: 13, borderRadius: 4, backgroundColor: 'var(--card-overlay)', width: j === 0 ? 110 : j === 8 ? 140 : 60 }} />
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
                    style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--bg-nav)', fontSize: 13 }}>{o.name}</span>
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontSize: 12, whiteSpace: 'nowrap' }}>{o.qualification}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{o.designation}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{o.mobile || '—'}</td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}><GenderBadge gender={o.gender} /></td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', backgroundColor: 'var(--card-overlay)', color: 'var(--bg-nav)', borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: 12, border: '1px solid var(--border-subtle)' }}>
                        {o._count.offices}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', backgroundColor: '#FFF7ED', color: '#C2410C', borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: 12, border: '1px solid #FED7AA' }}>
                        {o._count.products}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}><Badge active={o.isActive} /></td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {/* Edit — primary pill */}
                        <button onClick={() => p.onEdit(o)} title="Edit Officer" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--card-overlay)', color: 'var(--text-primary)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                        {/* divider */}
                        <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-subtle)', flexShrink: 0 }} />
                        {/* Assign Offices */}
                        <button onClick={() => p.onAssignOffices(o)} title="Assign Offices" style={ib('#EFF6FF', '#1D4ED8', '#BFDBFE')}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </button>
                        {/* Assign Products */}
                        <button onClick={() => p.onAssignProducts(o)} title="Assign Products" style={ib('#FFF7ED', '#C2410C', '#FED7AA')}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </button>
                        {/* Reset Login */}
                        <button onClick={() => p.onResetLogin(o)} title="Reset Login Password" style={ib('#F0F9FF', '#0369A1', '#BAE6FD')}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </button>
                        {/* Toggle Active */}
                        <button onClick={() => p.onToggle(o)} title={o.isActive ? 'Deactivate' : 'Activate'}
                          style={ib(o.isActive ? '#FEF2F2' : '#F0FDF4', o.isActive ? '#DC2626' : '#16A34A', o.isActive ? '#FECACA' : '#BBF7D0')}>
                          {o.isActive
                            ? <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            : <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          }
                        </button>
                        {/* Delete */}
                        <button onClick={() => p.onDelete(o)} title="Delete officer"
                          style={{ ...ib('transparent', '#DC2626', 'transparent'), border: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} total={total} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </div>
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

function AssignOfficesPanel({ officerName: _officerName, allOffices, selected, setSelected, saving, error, onBack, onSave }: AssignOfficesProps) {
  const [searchO, setSearchO] = useState('');

  const grouped = allOffices
    .filter(o => o.name.toLowerCase().includes(searchO.toLowerCase()) || o.code.toLowerCase().includes(searchO.toLowerCase()))
    .reduce<Record<string, OfficeStub[]>>((acc, o) => {
      const key = o.type === 'EIC' ? 'EIC – Export Inspection Council' : o.type === 'EIA' ? 'EIA – Export Inspection Agency' : 'Sub-EIA';
      (acc[key] = acc[key] ?? []).push(o);
      return acc;
    }, {});

  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  return (
    <div>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 28 }}>
        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#DC2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        <input
          style={{ ...inputStyle, maxWidth: 340, marginBottom: 20 }}
          placeholder="Search offices…"
          value={searchO}
          onChange={e => setSearchO(e.target.value)}
        />

        <div style={{ maxHeight: 440, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
          {Object.entries(grouped).map(([group, offices]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1B2A6B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #EEF2FF' }}>
                {group}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px' }}>
                {offices.map(o => (
                  <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 6, backgroundColor: selected.includes(o.id) ? '#EEF2FF' : 'transparent' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(o.id)}
                      onChange={() => toggle(o.id)}
                      style={{ accentColor: '#1B2A6B', width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 13, color: '#1F2937' }}>
                      <strong>{o.code}</strong> — {o.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No offices found</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onBack} style={{ backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, padding: '9px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ backgroundColor: '#0369A1', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 28px', fontWeight: 600, fontSize: 14, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Office Assignments'}
          </button>
        </div>
      </div>
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

function AssignProductsPanel({ officerName: _officerName, products, selected, setSelected, saving, error, onBack, onSave }: AssignProductsProps) {
  const [searchP, setSearchP] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchP.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(searchP.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, CertificateProduct[]>>((acc, p) => {
    const key = p.category ?? 'Uncategorised';
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  function toggleGroup(ids: string[]) {
    const allChecked = ids.every(id => selected.includes(id));
    if (allChecked) {
      setSelected(selected.filter(id => !ids.includes(id)));
    } else {
      setSelected([...new Set([...selected, ...ids])]);
    }
  }

  return (
    <div>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 28 }}>
        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#DC2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        <input
          style={{ ...inputStyle, maxWidth: 340, marginBottom: 20 }}
          placeholder="Search products…"
          value={searchP}
          onChange={e => setSearchP(e.target.value)}
        />

        <div style={{ maxHeight: 480, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
          {Object.entries(grouped).map(([cat, prods]) => {
            const ids = prods.map(p => p.id);
            const allChecked = ids.every(id => selected.includes(id));
            return (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #FFF7ED' }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => toggleGroup(ids)}
                    style={{ accentColor: '#F97316', width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {cat}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', paddingLeft: 8 }}>
                  {prods.map(pr => (
                    <label key={pr.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 6, backgroundColor: selected.includes(pr.id) ? '#FFF7ED' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(pr.id)}
                        onChange={() => toggle(pr.id)}
                        style={{ accentColor: '#F97316', width: 14, height: 14 }}
                      />
                      <span style={{ fontSize: 13, color: '#1F2937' }}>{pr.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No products found</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onBack} style={{ backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, padding: '9px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ backgroundColor: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 28px', fontWeight: 600, fontSize: 14, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Product Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}
