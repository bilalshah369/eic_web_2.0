import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, Office, CreateOfficeDto } from '../../services/admin.service';

interface Credentials { email: string; tempPassword: string; role: string; }

function CredentialsModal({ creds, onClose }: { creds: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copyAll() {
    navigator.clipboard.writeText(`Login Email: ${creds.email}\nPassword: ${creds.tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const roleLabel: Record<string, string> = { EIA_ADMIN: 'EIA Office', SUB_EIA_ADMIN: 'Sub-EIA Office', OFFICER: 'Inspection Officer' };
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: 32, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="28" height="28" fill="none" stroke="#16A34A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Login Created Successfully</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6B7280' }}>A login account has been created for this {roleLabel[creds.role] ?? creds.role}.</p>
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
        <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 500, textAlign: 'center', margin: '0 0 20px' }}>⚠ Save these credentials now — the password cannot be shown again.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyAll} style={{ flex: 1, backgroundColor: '#EEF2FF', color: '#1B2A6B', border: '1px solid #C7D2FE', borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {copied ? '✓ Copied!' : 'Copy Credentials'}
          </button>
          <button onClick={onClose} style={{ flex: 1, backgroundColor: '#1B2A6B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Delete', confirmColor = '#DC2626', iconColor = '#DC2626', iconBg = '#FEE2E2' }: {
  message: string; onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; confirmColor?: string; iconColor?: string; iconBg?: string;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" fill="none" stroke={iconColor} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #D1D5DB', backgroundColor: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: confirmColor, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
import { INDIA_STATES, getDistricts } from '../../data/india-geo';

// ── Type config ────────────────────────────────────────────────
const OFFICE_TYPES = [
  { value: 'EIC',     label: 'EIC - Export Inspection Council' },
  { value: 'EIA',     label: 'EIA - Export Inspection Agency' },
  { value: 'SUB_EIA', label: 'Sub-EIA' },
];

const TYPE_BADGE: Record<string, { bg: string; fg: string; short: string }> = {
  EIC:     { bg: '#DBEAFE', fg: '#1D4ED8', short: 'HQ (Head Office)' },
  EIA:     { bg: '#D1FAE5', fg: '#065F46', short: 'EIA' },
  SUB_EIA: { bg: '#FEF3C7', fg: '#92400E', short: 'Sub-EIA' },
};

// ── Input style helper ─────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', fontSize: '13px', borderRadius: '8px',
  border: '1.5px solid #D1D5DB',
  backgroundColor: '#FFFFFF', color: '#1F2937',
  outline: 'none',
};

const disabledInp: React.CSSProperties = {
  ...inp,
  backgroundColor: '#F3F4F6',
  color: '#9CA3AF',
  border: '1.5px solid #E5E7EB',
  cursor: 'not-allowed',
};

function FormLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
      {text}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
    </label>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{icon}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em', color: '#ffffff', textTransform: 'uppercase' as const }}>{title}</span>
    </div>
  );
}

// ── Empty form ─────────────────────────────────────────────────
const EMPTY: CreateOfficeDto = {
  name: '', code: '', type: 'EIA', parentId: null,
  address: '', state: '', district: '', subDistrict: '',
  city: '', pincode: '', phone: '', email: '',
  hasLab: false,
};

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

// ══════════════════════════════════════════════════════════════
// OFFICE FORM (Create / Edit)
// ══════════════════════════════════════════════════════════════
function OfficeForm({
  initial,
  editId,
  allOffices,
  onSuccess,
  onCancel,
}: {
  initial: CreateOfficeDto;
  editId?: string;
  allOffices: { id: string; name: string; code: string; type: string }[];
  onSuccess: (creds?: Credentials) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateOfficeDto>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof CreateOfficeDto, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const districts = getDistricts(form.state ?? '');

  const parentOptions = allOffices.filter(o => {
    if (editId && o.id === editId) return false;
    if (form.type === 'EIA')     return o.type === 'EIC';
    if (form.type === 'SUB_EIA') return o.type === 'EIA';
    return false;
  });
  const parentDisabled = form.type === 'EIC';
  const selectedParent = parentOptions.find(o => o.id === form.parentId);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Office name is required'); return; }
    if (!form.code.trim()) { setError('Office code is required'); return; }
    if (!form.type)        { setError('Office type is required'); return; }

    setSaving(true);
    setError('');
    try {
      if (editId) {
        await adminApi.updateOffice(editId, form);
        onSuccess();
      } else {
        const res = await adminApi.createOffice(form);
        const creds = (res.data.data as unknown as { credentials?: Credentials }).credentials;
        onSuccess(creds);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save office');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Form card */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8EDF5', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>

        {error && (
          <div style={{ margin: '20px 24px 0', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '7px', padding: '10px 14px', color: '#DC2626', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* ── Section 1: Classification ── */}
        <SectionHeader title="Classification" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
        } />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F4FF', backgroundColor: '#F8FAFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <FormLabel text="Office Type" required />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, parentId: null }))} style={inp}>
                {OFFICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <FormLabel text="Parent Office" />
              <select value={form.parentId ?? ''} onChange={e => set('parentId', e.target.value || null)} disabled={parentDisabled} style={parentDisabled ? disabledInp : inp}>
                <option value="">{parentDisabled ? '— Not applicable —' : '— Select parent —'}</option>
                {parentOptions.map(o => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
              </select>
              {selectedParent && (
                <div style={{ marginTop: 6, padding: '7px 11px', borderRadius: '6px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" fill="none" stroke="#1D4ED8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <div>
                    <div style={{ color: '#1D4ED8', fontSize: '12px', fontWeight: 600 }}>{selectedParent.name}</div>
                    <div style={{ color: '#3B82F6', fontSize: '10px' }}>{selectedParent.code}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Basic Details ── */}
        <SectionHeader title="Basic Details" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        } />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F4FF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <FormLabel text="Office Name" required />
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full office name" style={inp} />
            </div>
            <div>
              <FormLabel text="Office Code" required />
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="E.G., EIA-MUM" style={inp} />
            </div>
          </div>
        </div>

        {/* ── Section 3: Location ── */}
        <SectionHeader title="Location" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        } />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F4FF', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <FormLabel text="Address" />
            <textarea value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Full postal address" rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <FormLabel text="State" />
              <select value={form.state ?? ''} onChange={e => { set('state', e.target.value); set('district', ''); set('subDistrict', ''); }} style={inp}>
                <option value="">Select state</option>
                {INDIA_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <FormLabel text="District" />
              <select value={form.district ?? ''} onChange={e => { set('district', e.target.value); set('subDistrict', ''); }} style={form.state ? inp : disabledInp} disabled={!form.state}>
                <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <FormLabel text="Sub-District" />
              <input value={form.subDistrict ?? ''} onChange={e => set('subDistrict', e.target.value)} placeholder={form.district ? 'Sub-district / Block' : 'Select district first'} disabled={!form.district} style={form.district ? inp : disabledInp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <FormLabel text="City" />
              <input value={form.city ?? ''} onChange={e => set('city', e.target.value)} placeholder="City / Town" style={inp} />
            </div>
            <div>
              <FormLabel text="Pincode" />
              <input value={form.pincode ?? ''} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" maxLength={6} style={inp} />
            </div>
            <div>
              <FormLabel text="Phone" />
              <input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="Office phone" style={inp} />
            </div>
          </div>
        </div>

        {/* ── Section 4: Contact ── */}
        <SectionHeader title="Contact" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        } />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F4FF' }}>
          <div>
            <FormLabel text="Email" />
            <input value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="Office email address" type="email" style={{ ...inp, maxWidth: 400 }} />
          </div>
        </div>

        {/* ── Section 5: Facilities & Status ── */}
        <SectionHeader title="Facilities & Status" icon={
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F4FF', display: 'grid', gridTemplateColumns: editId ? '1fr 1fr' : '1fr', gap: '12px' }}>
          {(() => {
            const labAllowed = form.type === 'EIA' || form.type === 'SUB_EIA';
            return (
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: labAllowed ? 'pointer' : 'not-allowed', padding: '12px 14px', borderRadius: '8px', border: `1.5px solid ${labAllowed ? '#D1D5DB' : '#E5E7EB'}`, backgroundColor: labAllowed ? '#F9FAFB' : '#F3F4F6', opacity: labAllowed ? 1 : 0.55 }}>
                <input type="checkbox" checked={labAllowed ? (form.hasLab ?? false) : false} onChange={e => labAllowed && set('hasLab', e.target.checked)} disabled={!labAllowed} style={{ width: 16, height: 16, cursor: labAllowed ? 'pointer' : 'not-allowed', accentColor: '#1B2A6B' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: labAllowed ? '#1F2937' : '#9CA3AF' }}>Laboratory Facility</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: 1 }}>
                    {labAllowed ? 'This office has an in-house testing lab' : 'Not applicable for EIC offices'}
                  </div>
                </div>
              </label>
            );
          })()}
          {editId && (
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #D1D5DB', backgroundColor: '#F9FAFB' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>Active Status</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: 1 }}>Inactive offices are hidden from selections</div>
              </div>
              <input type="checkbox" checked={((form as unknown) as { isActive?: boolean }).isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked } as unknown as CreateOfficeDto))} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1B2A6B' }} />
            </label>
          )}
        </div>

        {/* ── Footer: Buttons ── */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E8EDF5', backgroundColor: '#F8FAFF', display: 'flex', gap: '10px' }}>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: saving ? '#94A3B8' : 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(27,42,107,0.30)' }}>
            {saving ? 'Saving…' : editId ? 'Update Office' : 'Create Office'}
          </button>
          <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: '#ffffff', color: '#374151', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OFFICES SECTION
// ══════════════════════════════════════════════════════════════
export default function OfficesSection() {
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [createInitial, setCreateInitial] = useState<CreateOfficeDto>(EMPTY);
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetLoginId, setConfirmResetLoginId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDrop, setOpenDrop] = useState<{ id: string; top: number; right: number } | null>(null);

  useEffect(() => {
    if (!openDrop) return;
    const close = () => setOpenDrop(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openDrop]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-offices', page, pageSize, search, typeFilter],
    queryFn: () => adminApi.getOffices({ limit: pageSize, offset: page * pageSize, search: search || undefined, type: typeFilter || undefined }),
    select: r => r.data?.data,
  });

  const { data: allOfficesData } = useQuery({
    queryKey: ['admin-offices-all'],
    queryFn: () => adminApi.getAllOffices(),
    select: r => r.data?.data,
    enabled: view === 'create' || view === 'edit',
    staleTime: 5 * 60 * 1000,
  });

  const offices = Array.isArray(data?.offices) ? data.offices : [];
  const total = data?.total ?? 0;
  const allOffices = Array.isArray(allOfficesData) ? allOfficesData : [];

  const openCreate = () => { setCreateInitial(EMPTY); setView('create'); };
  const openCreateEia = (parent: Office) => {
    setCreateInitial({ ...EMPTY, type: 'EIA', parentId: parent.id });
    setView('create');
  };
  const openCreateSub = (parent: Office) => {
    setCreateInitial({ ...EMPTY, type: 'SUB_EIA', parentId: parent.id });
    setView('create');
  };
  const openEdit = (o: Office) => { setEditOffice(o); setView('edit'); };

  const handleSuccess = (creds?: Credentials) => {
    qc.invalidateQueries({ queryKey: ['admin-offices'] });
    qc.invalidateQueries({ queryKey: ['admin-offices-all'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
    setView('list');
    setEditOffice(null);
    if (creds) setCredentials(creds);
  };

  const handleCancel = () => { setView('list'); setEditOffice(null); };

  // ── Create / Edit views ──────────────────────────────────────
  if (view === 'create') {
    return (
      <OfficeForm
        initial={createInitial}
        allOffices={allOffices}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  if (view === 'edit' && editOffice) {
    const initial: CreateOfficeDto & { isActive?: boolean } = {
      name:        editOffice.name,
      code:        editOffice.code,
      type:        editOffice.type,
      parentId:    editOffice.parentId,
      address:     editOffice.address ?? '',
      state:       editOffice.state ?? '',
      district:    editOffice.district ?? '',
      subDistrict: editOffice.subDistrict ?? '',
      city:        editOffice.city ?? '',
      pincode:     editOffice.pincode ?? '',
      phone:       editOffice.phone ?? '',
      email:       editOffice.email ?? '',
      hasLab:      editOffice.hasLab,
      isActive:    editOffice.isActive,
    };
    return (
      <OfficeForm
        initial={initial}
        editId={editOffice.id}
        allOffices={allOffices}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {credentials && <CredentialsModal creds={credentials} onClose={() => setCredentials(null)} />}
      {confirmDeleteId && (
        <ConfirmModal
          message="Delete this office? This action cannot be undone."
          onConfirm={async () => {
            try {
              await adminApi.deleteOffice(confirmDeleteId);
              qc.invalidateQueries({ queryKey: ['admin-offices'] });
              qc.invalidateQueries({ queryKey: ['admin-offices-all'] });
              qc.invalidateQueries({ queryKey: ['admin-stats'] });
            } finally { setConfirmDeleteId(null); }
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      {confirmResetLoginId && (
        <ConfirmModal
          message="Reset login credentials for this office? A new temporary password will be generated."
          confirmLabel="Reset Login"
          confirmColor="#0369A1"
          iconColor="#0369A1"
          iconBg="#E0F2FE"
          onConfirm={async () => {
            const id = confirmResetLoginId;
            setConfirmResetLoginId(null);
            try {
              const res = await adminApi.resetOfficeLogin(id);
              setCredentials(res.data.data);
            } catch (e: unknown) {
              alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed');
            }
          }}
          onCancel={() => setConfirmResetLoginId(null)}
        />
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }}>Office Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '3px 0 0' }}>
            {isLoading ? 'Loading…' : `${total} office${total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name or code…"
              style={{ ...inp, paddingLeft: 32, width: 220 }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            style={{ ...inp, width: 'auto', minWidth: 140 }}
          >
            <option value="">All Types</option>
            {OFFICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
              padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(27,42,107,0.30)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Office
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8EDF5', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 780 }}>
            <colgroup>
              <col style={{ minWidth: 180 }} />
              <col style={{ minWidth: 90 }} />
              <col style={{ minWidth: 80 }} />
              <col style={{ minWidth: 160 }} />
              <col style={{ minWidth: 48 }} />
              <col style={{ minWidth: 76 }} />
              <col style={{ minWidth: 90 }} />
              <col style={{ width: 44, minWidth: 44 }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' }}>
                {[
                  { label: 'Office', sortable: true },
                  { label: 'Code', sortable: true },
                  { label: 'Type', sortable: true },
                  { label: 'Location', sortable: false },
                  { label: 'Lab', sortable: false },
                  { label: 'Status', sortable: true },
                  { label: 'Actions', sortable: false },
                ].map(col => (
                  <th key={col.label} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{col.label}</span>
                      {col.sortable && (
                        <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.35)" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
                <th style={{ padding: '10px 6px', position: 'sticky', right: 0, backgroundColor: '#1B2A6B', zIndex: 3, width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} style={{ padding: '9px 12px' }}>
                        <div style={{ height: 14, borderRadius: 4, backgroundColor: '#F1F5F9', width: j === 0 ? '75%' : '55%' }} />
                      </td>
                    ))}
                  </tr>
                ))
                : offices.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '32px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <svg width="36" height="36" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No offices found</p>
                          <button onClick={openCreate} style={{ marginTop: 4, padding: '6px 14px', borderRadius: '6px', fontSize: '12px', backgroundColor: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            Add first office
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                  : offices.map((office, i) => {
                    const tb = TYPE_BADGE[office.type] ?? { bg: '#F1F5F9', fg: '#475569', short: office.type };
                    const locationParts = [office.city, office.state].filter(Boolean);
                    return (
                      <tr
                        key={office.id}
                        style={{ borderBottom: i < offices.length - 1 ? '1px solid #F0F4FF' : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* OFFICE */}
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="15" height="15" fill="none" stroke="#1D4ED8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div title={office.name} style={{ color: '#111827', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{office.name}</div>
                              {office.email && <div title={office.email} style={{ color: '#6B7280', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{office.email}</div>}
                            </div>
                          </div>
                        </td>
                        {/* CODE */}
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, backgroundColor: '#F1F5F9', padding: '3px 7px', borderRadius: 5, color: '#1B2A6B', fontWeight: 700, border: '1px solid #E2E8F0' }}>
                            {office.code}
                          </span>
                        </td>
                        {/* TYPE */}
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: tb.bg, color: tb.fg }}>
                            {tb.short}
                          </span>
                        </td>
                        {/* LOCATION */}
                        <td style={{ padding: '9px 12px', maxWidth: 180, whiteSpace: 'nowrap' }}>
                          {office.address ? (
                            <div
                              title={[office.address, ...locationParts, office.pincode].filter(Boolean).join(', ')}
                              style={{ color: '#374151', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190 }}
                            >
                              {office.address}
                            </div>
                          ) : locationParts.length > 0 ? (
                            <div title={[...locationParts, office.pincode].filter(Boolean).join(', ')} style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190 }}>
                              {locationParts.join(', ')}{office.pincode ? ` – ${office.pincode}` : ''}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        {/* LAB */}
                        <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {office.hasLab ? (
                            <svg width="16" height="16" fill="none" stroke="#059669" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        {/* STATUS */}
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: office.isActive ? '#D1FAE5' : '#FEE2E2', color: office.isActive ? '#065F46' : '#DC2626' }}>
                            {office.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        {/* ACTIONS */}
                        <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => openEdit(office)}
                              title="Edit office"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: '5px', fontSize: 11, fontWeight: 600, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E2E8F0')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                            >
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(office.id)}
                              title="Delete office"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: '5px', fontSize: 11, fontWeight: 600, backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FECACA')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                            >
                              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>
                          </div>
                        </td>
                        {/* STICKY ⋮ */}
                        <td style={{ padding: '4px 6px', position: 'sticky', right: 0, backgroundColor: '#ffffff', borderLeft: '1px solid #E8EDF5', zIndex: 1, textAlign: 'center' }}>
                          <button
                            title="More actions"
                            onClick={e => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setOpenDrop(d => d?.id === office.id ? null : { id: office.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', cursor: 'pointer', color: '#1D4ED8', fontSize: 16, fontWeight: 700, lineHeight: 1, transition: 'background 0.15s, border-color 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget.style.backgroundColor = '#1B2A6B'); (e.currentTarget.style.color = '#fff'); (e.currentTarget.style.borderColor = '#1B2A6B'); }}
                            onMouseLeave={e => { (e.currentTarget.style.backgroundColor = '#EFF6FF'); (e.currentTarget.style.color = '#1D4ED8'); (e.currentTarget.style.borderColor = '#BFDBFE'); }}
                          >⋮</button>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
        {openDrop && (() => {
          const office = offices.find(o => o.id === openDrop.id);
          if (!office) return null;
          return (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: 'fixed', top: openDrop.top, right: openDrop.right, zIndex: 9999, backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.13)', padding: '6px 0', minWidth: 170 }}
            >
              {office.type === 'EIC' && (
                <button
                  onClick={() => { setOpenDrop(null); openCreateEia(office); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#065F46', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0FDF4')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add EIA Office
                </button>
              )}
              {office.type === 'EIA' && (
                <button
                  onClick={() => { setOpenDrop(null); openCreateSub(office); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4338CA', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add Sub-Office
                </button>
              )}
              {(office.type === 'EIA' || office.type === 'SUB_EIA') && (
                <button
                  onClick={() => { setOpenDrop(null); setConfirmResetLoginId(office.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#0369A1', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F9FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  Reset Login
                </button>
              )}
            </div>
          );
        })()}
        <TablePagination page={page} total={total} pageSize={pageSize} onPage={setPage} onPageSize={p => { setPageSize(p); setPage(0); }} />
      </div>
    </div>
  );
}
