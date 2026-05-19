import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Header from '../components/Header';
import EIAApplications from './admin/EIAApplications';
import { INDIA_STATES, getDistricts } from '../data/india-geo';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface OfficerItem {
  officer: { id: string; name: string; designation: string; mobile: string | null; email: string | null; isActive: boolean };
}
interface OfficeData {
  id: string; name: string; code: string; type: string;
  email: string | null; phone: string | null;
  address: string | null; state: string | null; district: string | null;
  city: string | null; pincode: string | null;
  isActive: boolean; hasLab: boolean;
  parent: { id: string; name: string; code: string } | null;
  officers: OfficerItem[];
}
interface SubOffice {
  id: string; name: string; code: string; type: string;
  email: string | null; phone: string | null;
  address: string | null; state: string | null; district: string | null;
  subDistrict: string | null; city: string | null; pincode: string | null;
  isActive: boolean; hasLab: boolean;
  user: { id: string; email: string } | null;
  _count: { officers: number };
}
interface OfficerFull {
  id: string; name: string; qualification: string; designation: string;
  mobile: string | null; email: string | null; gender: string;
  isActive: boolean;
  user: { id: string; email: string } | null;
}
interface Credentials { email: string; tempPassword: string; role: string; }
interface OfficerDetail extends OfficerFull {
  offices: { office: { id: string; name: string; code: string; type: string } }[];
  products: { product: { id: string; name: string; category: string | null } }[];
}
interface PortalOffice { id: string; name: string; code: string; type: string; }
interface CertProduct { id: string; name: string; category: string | null; sortOrder: number; }

/* ─── nav ────────────────────────────────────────────────────────────────── */
type NavKey = 'dashboard' | 'sub-offices' | 'officer-management';

const NAV_ALL: { key: NavKey; label: string; eiaOnly?: boolean; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { key: 'sub-offices', label: 'Sub-Office Management', eiaOnly: true, icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { key: 'officer-management', label: 'Officer Management', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

/* ─── shared form styles (match admin OfficesSection) ───────────────────── */
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #D1D5DB', backgroundColor: '#fff', color: '#1F2937', outline: 'none' };
const disabledInp: React.CSSProperties = { ...inp, backgroundColor: '#F3F4F6', color: '#9CA3AF', border: '1.5px solid #E5E7EB', cursor: 'not-allowed' };

function FormLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
      {text}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
    </label>
  );
}
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ padding: '10px 20px', backgroundColor: '#EEF2FF', borderBottom: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#1B2A6B' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', color: '#1B2A6B', textTransform: 'uppercase' }}>{title}</span>
    </div>
  );
}

/* ─── confirm modal ─────────────────────────────────────────────────────── */
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

/* ─── credentials modal ──────────────────────────────────────────────────── */
function CredentialsModal({ creds, onClose }: { creds: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.tempPassword}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="#16A34A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Login Credentials Created</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Share these with the user securely</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 16, marginBottom: 16, fontFamily: 'monospace' }}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6B7280', fontFamily: 'sans-serif', fontWeight: 600 }}>EMAIL</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#1B2A6B', fontWeight: 700 }}>{creds.email}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#6B7280', fontFamily: 'sans-serif', fontWeight: 600 }}>TEMPORARY PASSWORD</p>
            <p style={{ margin: '2px 0 0', fontSize: 16, color: '#1B2A6B', fontWeight: 700, letterSpacing: '0.08em' }}>{creds.tempPassword}</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#FEF3C7', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400E' }}>
          This password will not be shown again. The user should change it upon first login.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copy} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1.5px solid #1B2A6B', backgroundColor: copied ? '#DCFCE7' : '#fff', color: copied ? '#166534' : '#1B2A6B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {copied ? '✓ Copied' : 'Copy Credentials'}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', backgroundColor: '#1B2A6B', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ─── sidebar btn ────────────────────────────────────────────────────────── */
function SidebarBtn({ item, active, collapsed, onClick }: { item: typeof NAV_ALL[number]; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: collapsed ? '12px 0' : '11px 20px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: active ? 'rgba(255,255,255,0.12)' : 'none',
      border: 'none', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
      cursor: 'pointer', color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left',
      transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

/* ─── coming soon ────────────────────────────────────────────────────────── */
function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="28" height="28" fill="none" stroke="#1B2A6B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>This section is coming soon.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-OFFICE MANAGEMENT
═══════════════════════════════════════════════════════════════════════════ */
function SubOfficeForm({ officeName, editData, onSuccess, onCancel }: {
  officeName?: string;
  editData?: SubOffice;
  onSuccess: (creds?: Credentials) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: editData?.name ?? '',
    code: editData?.code ?? '',
    email: editData?.email ?? '',
    phone: editData?.phone ?? '',
    address: editData?.address ?? '',
    state: editData?.state ?? '',
    district: editData?.district ?? '',
    subDistrict: editData?.subDistrict ?? '',
    city: editData?.city ?? '',
    pincode: editData?.pincode ?? '',
    hasLab: editData?.hasLab ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editData;

  function set(field: string, value: string | boolean) { setForm(f => ({ ...f, [field]: value })); }

  const districts = getDistricts(form.state);

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Office name is required'); return; }
    if (!form.code.trim()) { setError('Office code is required'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/portal/sub-offices/${editData.id}`, form);
        onSuccess();
      } else {
        const res = await api.post<{ success: boolean; data: { office: SubOffice; credentials?: Credentials } }>('/portal/sub-offices', form);
        onSuccess(res.data.data.credentials);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isEdit ? 'Failed to update sub-office' : 'Failed to create sub-office'));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>

        {error && (
          <div style={{ margin: '20px 24px 0', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 7, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>
        )}

        {/* Classification */}
        <SectionHeader title="Classification" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFBFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <FormLabel text="Office Type" />
              <input value="Sub-EIA — Sub Export Inspection Agency" disabled style={disabledInp} />
            </div>
            <div>
              <FormLabel text="Parent Office" />
              <input value={officeName ?? 'Your EIA Office'} disabled style={disabledInp} />
              {!isEdit && (
                <div style={{ marginTop: 6, padding: '7px 11px', borderRadius: 6, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="#1D4ED8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span style={{ color: '#1D4ED8', fontSize: 12, fontWeight: 600 }}>Auto-assigned to your agency</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Basic Details */}
        <SectionHeader title="Basic Details" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div><FormLabel text="Office Name" required /><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full office name" style={inp} /></div>
            <div><FormLabel text="Office Code" required /><input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="E.G., SEIA-DEL" style={inp} /></div>
          </div>
        </div>

        {/* Location */}
        <SectionHeader title="Location" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FormLabel text="Address" />
            <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full postal address" rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <FormLabel text="State" />
              <select value={form.state} onChange={e => { set('state', e.target.value); set('district', ''); set('subDistrict', ''); }} style={inp}>
                <option value="">Select state</option>
                {INDIA_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <FormLabel text="District" />
              <select value={form.district} onChange={e => { set('district', e.target.value); set('subDistrict', ''); }} style={form.state ? inp : disabledInp} disabled={!form.state}>
                <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <FormLabel text="Sub-District" />
              <input value={form.subDistrict} onChange={e => set('subDistrict', e.target.value)} placeholder={form.district ? 'Sub-district / Block' : 'Select district first'} disabled={!form.district} style={form.district ? inp : disabledInp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div><FormLabel text="City" /><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City / Town" style={inp} /></div>
            <div><FormLabel text="Pincode" /><input value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" maxLength={6} style={inp} /></div>
            <div><FormLabel text="Phone" /><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Office phone" style={inp} /></div>
          </div>
        </div>

        {/* Contact */}
        <SectionHeader title="Contact" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div><FormLabel text="Email" /><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Office email address (used for login)" type="email" style={{ ...inp, maxWidth: 400 }} /></div>
        </div>

        {/* Facilities */}
        <SectionHeader title="Facilities & Status" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <div style={{ padding: '18px 20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #D1D5DB', backgroundColor: '#F9FAFB', maxWidth: 400 }}>
            <input type="checkbox" checked={form.hasLab} onChange={e => set('hasLab', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1B2A6B' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>Laboratory Facility</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>This office has an in-house testing lab</div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', gap: 10 }}>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: saving ? '#94A3B8' : '#1B2A6B', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : isEdit ? 'Update Sub-Office' : 'Create Sub-Office'}
          </button>
          <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: '#fff', color: '#374151', border: '1.5px solid #D1D5DB', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function SubOfficesSection({ officeName }: { officeName?: string }) {
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editOffice, setEditOffice] = useState<SubOffice | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: subOffices = [], isLoading } = useQuery<SubOffice[]>({
    queryKey: ['portal-sub-offices'],
    queryFn: () => api.get<{ success: boolean; data: SubOffice[] }>('/portal/sub-offices').then(r => r.data.data),
  });

  function handleSuccess(c?: Credentials) {
    qc.invalidateQueries({ queryKey: ['portal-sub-offices'] });
    setView('list');
    if (c) setCreds(c);
  }

  if (view === 'create' || view === 'edit') {
    return <SubOfficeForm officeName={officeName} editData={editOffice ?? undefined} onSuccess={handleSuccess} onCancel={() => { setView('list'); setEditOffice(null); }} />;
  }

  async function handleResetLogin(id: string) {
    try {
      const res = await api.post<{ success: boolean; data: Credentials }>(`/portal/sub-offices/${id}/reset-login`);
      setCreds(res.data.data);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reset login');
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/portal/sub-offices/${id}`);
    await qc.invalidateQueries({ queryKey: ['portal-sub-offices'] });
    setConfirmId(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {creds && <CredentialsModal creds={creds} onClose={() => setCreds(null)} />}
      {confirmId && <ConfirmModal message="Delete this sub-office? This cannot be undone." onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
        <button onClick={() => setView('create')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Sub-Office
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['SUB-OFFICE', 'CODE', 'LOCATION', 'OFFICERS', 'LAB', 'LOGIN', 'STATUS', 'ACTIONS'].map(col => (
                  <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', backgroundColor: 'var(--card-overlay)', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(3)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((__, j) => <td key={j} style={{ padding: '14px 16px' }}><div style={{ height: 14, borderRadius: 4, backgroundColor: 'var(--card-overlay)', width: j === 0 ? '75%' : '55%' }} /></td>)}</tr>
              )) : subOffices.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="36" height="36" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No sub-offices yet</p>
                    <button onClick={() => setView('create')} style={{ marginTop: 4, padding: '6px 14px', borderRadius: 6, fontSize: 12, backgroundColor: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer' }}>Add first sub-office</button>
                  </div>
                </td></tr>
              ) : subOffices.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: i < subOffices.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: 'var(--card-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{o.name}</div>
                        {o.email && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{o.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: 12, backgroundColor: 'var(--card-overlay)', padding: '3px 8px', borderRadius: 5, color: 'var(--text-secondary)', fontWeight: 600 }}>{o.code}</span></td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{[o.city, o.state].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>{o._count.officers}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {o.hasLab
                      ? <svg width="16" height="16" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 11, color: o.user ? '#166534' : '#B45309', fontWeight: 600 }}>{o.user ? o.user.email : 'No login'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, backgroundColor: o.isActive ? '#D1FAE5' : '#FEE2E2', color: o.isActive ? '#065F46' : '#DC2626' }}>
                      {o.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditOffice(o); setView('edit'); }} title="Edit sub-office" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: 'var(--text-muted)', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleResetLogin(o.id)} title="Reset / View Login" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: '#0369A1', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E0F2FE')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </button>
                      <button onClick={() => setConfirmId(o.id)} title="Delete sub-office" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: '#DC2626', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ASSIGN OFFICES PANEL
═══════════════════════════════════════════════════════════════════════════ */
function AssignOfficesPanel({ officer, allOffices, selected, setSelected, saving, onSave, onCancel }: {
  officer: OfficerFull; allOffices: PortalOffice[]; selected: string[];
  setSelected: (ids: string[]) => void; saving: boolean;
  onSave: () => void; onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = allOffices.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.code.toLowerCase().includes(search.toLowerCase())
  );
  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <SectionHeader title={`Assign Offices — ${officer.name}`} icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offices…" style={{ ...inp, width: 280, marginBottom: 14 }} />
          <div style={{ border: '1.5px solid #D1D5DB', borderRadius: 8, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>No offices available</p>
            ) : filtered.map((o, i) => (
              <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid #E5E7EB' : 'none', backgroundColor: selected.includes(o.id) ? '#EEF2FF' : '#fff' }}>
                <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} style={{ accentColor: '#1B2A6B', width: 15, height: 15 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.code} · {o.type === 'EIA' ? 'Export Inspection Agency' : 'Sub-EIA'}</div>
                </div>
              </label>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{selected.length} office{selected.length !== 1 ? 's' : ''} selected</p>
        </div>
        <div style={{ padding: '14px 20px', backgroundColor: '#F9FAFB', display: 'flex', gap: 10 }}>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: saving ? '#94A3B8' : '#0369A1', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save Office Assignments'}
          </button>
          <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: '#fff', color: '#374151', border: '1.5px solid #D1D5DB', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ASSIGN PRODUCTS PANEL
═══════════════════════════════════════════════════════════════════════════ */
function AssignProductsPanel({ officer, products, selected, setSelected, saving, onSave, onCancel }: {
  officer: OfficerFull; products: CertProduct[]; selected: string[];
  setSelected: (ids: string[]) => void; saving: boolean;
  onSave: () => void; onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const grouped = filtered.reduce<Record<string, CertProduct[]>>((acc, p) => {
    const key = p.category ?? 'Uncategorised';
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});
  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }
  function toggleGroup(ids: string[]) {
    const allOn = ids.every(id => selected.includes(id));
    setSelected(allOn ? selected.filter(id => !ids.includes(id)) : [...new Set([...selected, ...ids])]);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <SectionHeader title={`Assign Products — ${officer.name}`} icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ ...inp, width: 280, marginBottom: 14 }} />
          <div style={{ maxHeight: 440, overflowY: 'auto', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '10px 14px' }}>
            {Object.keys(grouped).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20, margin: 0 }}>No products found</p>
            ) : Object.entries(grouped).map(([cat, prods]) => {
              const ids = prods.map(p => p.id);
              const allChecked = ids.every(id => selected.includes(id));
              return (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingBottom: 5, borderBottom: '1px solid #FFF7ED' }}>
                    <input type="checkbox" checked={allChecked} onChange={() => toggleGroup(ids)} style={{ accentColor: '#F97316', width: 14, height: 14 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', paddingLeft: 6 }}>
                    {prods.map(pr => (
                      <label key={pr.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6, cursor: 'pointer', backgroundColor: selected.includes(pr.id) ? '#FFF7ED' : 'transparent' }}>
                        <input type="checkbox" checked={selected.includes(pr.id)} onChange={() => toggle(pr.id)} style={{ accentColor: '#F97316', width: 13, height: 13 }} />
                        <span style={{ fontSize: 12, color: '#1F2937' }}>{pr.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{selected.length} product{selected.length !== 1 ? 's' : ''} selected</p>
        </div>
        <div style={{ padding: '14px 20px', backgroundColor: '#F9FAFB', display: 'flex', gap: 10 }}>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: saving ? '#94A3B8' : '#F97316', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save Product Assignments'}
          </button>
          <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: '#fff', color: '#374151', border: '1.5px solid #D1D5DB', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OFFICER MANAGEMENT
═══════════════════════════════════════════════════════════════════════════ */
function OfficerForm({ editData, onSuccess, onCancel }: {
  editData?: OfficerFull;
  onSuccess: (creds?: Credentials) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: editData?.name ?? '',
    qualification: editData?.qualification ?? '',
    designation: editData?.designation ?? '',
    mobile: editData?.mobile ?? '',
    email: editData?.email ?? '',
    gender: editData?.gender ?? 'MALE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editData;

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Officer name is required'); return; }
    if (!form.designation.trim()) { setError('Designation is required'); return; }
    if (!form.qualification.trim()) { setError('Qualification is required'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/portal/officers/${editData.id}`, form);
        onSuccess();
      } else {
        const res = await api.post<{ success: boolean; data: { officer: OfficerFull; credentials?: Credentials } }>('/portal/officers', form);
        onSuccess(res.data.data.credentials);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (isEdit ? 'Failed to update officer' : 'Failed to create officer'));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>

        {error && (
          <div style={{ margin: '20px 24px 0', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 7, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>
        )}

        {/* Basic Details */}
        <SectionHeader title="Basic Details" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><FormLabel text="Full Name" required /><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Officer full name" style={inp} /></div>
            <div><FormLabel text="Designation" required /><input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Inspection Officer" style={inp} /></div>
            <div><FormLabel text="Qualification" required /><input value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="e.g. B.Tech, M.Sc" style={inp} /></div>
            <div>
              <FormLabel text="Gender" />
              <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inp}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <SectionHeader title="Contact" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><FormLabel text="Mobile" /><input value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" maxLength={10} style={inp} /></div>
            <div><FormLabel text="Email (for login)" /><input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="officer@example.gov.in" style={inp} /></div>
          </div>
        </div>

        {/* Login Access */}
        <SectionHeader title="Login Access" icon={<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>} />
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 480 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {isEdit ? 'Update email above to change login address. Use Reset Login to regenerate password.' : 'If an email is provided, login credentials will be auto-generated and displayed after creation.'}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', gap: 10 }}>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: saving ? '#94A3B8' : '#1B2A6B', color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : isEdit ? 'Update Officer' : 'Create Officer'}
          </button>
          <button onClick={onCancel} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: '#fff', color: '#374151', border: '1.5px solid #D1D5DB', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function OfficerManagementSection() {
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'assign-offices' | 'assign-products'>('list');
  const [editOfficer, setEditOfficer] = useState<OfficerFull | null>(null);
  const [assignOfficer, setAssignOfficer] = useState<OfficerFull | null>(null);
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const { data: officers = [], isLoading } = useQuery<OfficerFull[]>({
    queryKey: ['portal-officers'],
    queryFn: () => api.get<{ success: boolean; data: OfficerFull[] }>('/portal/officers').then(r => r.data.data),
  });

  const { data: myOffices = [] } = useQuery<PortalOffice[]>({
    queryKey: ['portal-my-offices'],
    queryFn: () => api.get<{ success: boolean; data: PortalOffice[] }>('/portal/my-offices').then(r => r.data.data),
    enabled: view === 'assign-offices',
  });

  const { data: certProducts = [] } = useQuery<CertProduct[]>({
    queryKey: ['portal-cert-products'],
    queryFn: () => api.get<{ success: boolean; data: CertProduct[] }>('/portal/certificate-products').then(r => r.data.data),
    enabled: view === 'assign-products',
  });

  const filtered = officers.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.designation.toLowerCase().includes(search.toLowerCase())
  );

  function handleSuccess(c?: Credentials) {
    qc.invalidateQueries({ queryKey: ['portal-officers'] });
    setView('list');
    setEditOfficer(null);
    if (c) setCreds(c);
  }

  async function openAssignOffices(officer: OfficerFull) {
    try {
      const res = await api.get<{ success: boolean; data: OfficerDetail }>(`/portal/officers/${officer.id}`);
      setSelectedOfficeIds(res.data.data.offices.map(o => o.office.id));
    } catch { setSelectedOfficeIds([]); }
    setAssignOfficer(officer);
    setView('assign-offices');
  }

  async function openAssignProducts(officer: OfficerFull) {
    try {
      const res = await api.get<{ success: boolean; data: OfficerDetail }>(`/portal/officers/${officer.id}`);
      setSelectedProductIds(res.data.data.products.map(p => p.product.id));
    } catch { setSelectedProductIds([]); }
    setAssignOfficer(officer);
    setView('assign-products');
  }

  async function handleSaveOffices() {
    if (!assignOfficer) return;
    setAssigning(true);
    try {
      await api.put(`/portal/officers/${assignOfficer.id}/assign-offices`, { officeIds: selectedOfficeIds });
      await qc.invalidateQueries({ queryKey: ['portal-officers'] });
      setView('list'); setAssignOfficer(null);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save');
    } finally { setAssigning(false); }
  }

  async function handleSaveProducts() {
    if (!assignOfficer) return;
    setAssigning(true);
    try {
      await api.put(`/portal/officers/${assignOfficer.id}/assign-products`, { productIds: selectedProductIds });
      await qc.invalidateQueries({ queryKey: ['portal-officers'] });
      setView('list'); setAssignOfficer(null);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save');
    } finally { setAssigning(false); }
  }

  if (view === 'create' || view === 'edit') {
    return <OfficerForm editData={editOfficer ?? undefined} onSuccess={handleSuccess} onCancel={() => { setView('list'); setEditOfficer(null); }} />;
  }
  if (view === 'assign-offices' && assignOfficer) {
    return <AssignOfficesPanel officer={assignOfficer} allOffices={myOffices} selected={selectedOfficeIds} setSelected={setSelectedOfficeIds} saving={assigning} onSave={handleSaveOffices} onCancel={() => { setView('list'); setAssignOfficer(null); }} />;
  }
  if (view === 'assign-products' && assignOfficer) {
    return <AssignProductsPanel officer={assignOfficer} products={certProducts} selected={selectedProductIds} setSelected={setSelectedProductIds} saving={assigning} onSave={handleSaveProducts} onCancel={() => { setView('list'); setAssignOfficer(null); }} />;
  }

  async function handleResetLogin(id: string) {
    try {
      const res = await api.post<{ success: boolean; data: Credentials }>(`/portal/officers/${id}/reset-login`);
      setCreds(res.data.data);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reset login');
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/portal/officers/${id}`);
    await qc.invalidateQueries({ queryKey: ['portal-officers'] });
    setConfirmId(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {creds && <CredentialsModal creds={creds} onClose={() => setCreds(null)} />}
      {confirmId && <ConfirmModal message="Delete this officer? This cannot be undone." onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
        <button onClick={() => setView('create')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, backgroundColor: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Officer
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search officers…" style={{ ...inp, width: 280 }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--card-overlay)' }}>
                {['Name', 'Qualification', 'Designation', 'Mobile', 'Gender', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#1B2A6B', fontSize: 12, whiteSpace: 'nowrap', borderBottom: '2px solid var(--border-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(4)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((__, j) => <td key={j} style={{ padding: '10px 14px' }}><div style={{ height: 14, borderRadius: 4, backgroundColor: 'var(--card-overlay)', width: j === 0 ? 120 : 60 }} /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="36" height="36" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No officers yet</p>
                    <button onClick={() => setView('create')} style={{ marginTop: 4, padding: '6px 14px', borderRadius: 6, fontSize: 12, backgroundColor: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer' }}>Add first officer</button>
                  </div>
                </td></tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--card-overlay)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1B2A6B' }}>{o.name}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{o.qualification}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{o.designation}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{o.mobile || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {(() => {
                      const g = o.gender === 'MALE' ? { bg: '#DBEAFE', color: '#1E40AF', label: 'Male' } : o.gender === 'FEMALE' ? { bg: '#FCE7F3', color: '#9D174D', label: 'Female' } : { bg: '#F3F4F6', color: '#374151', label: 'Other' };
                      return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: g.bg, color: g.color }}>{g.label}</span>;
                    })()}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: o.isActive ? '#DCFCE7' : '#FEE2E2', color: o.isActive ? '#166534' : '#991B1B' }}>
                      {o.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Edit */}
                      <button onClick={() => { setEditOfficer(o); setView('edit'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', color: '#1B2A6B', border: '1px solid #C7D2FE', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      {/* Assign Offices */}
                      <button onClick={() => openAssignOffices(o)} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Assign Offices
                      </button>
                      {/* Assign Products */}
                      <button onClick={() => openAssignProducts(o)} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        Assign Products
                      </button>
                      {/* Login */}
                      <button onClick={() => handleResetLogin(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        Login
                      </button>
                      {/* Deactivate / Activate */}
                      <button onClick={async () => { await api.put(`/portal/officers/${o.id}`, { isActive: !o.isActive }); qc.invalidateQueries({ queryKey: ['portal-officers'] }); }} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: o.isActive ? '#FEF2F2' : '#F0FDF4', color: o.isActive ? '#DC2626' : '#16A34A', border: `1px solid ${o.isActive ? '#FECACA' : '#BBF7D0'}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {o.isActive
                          ? <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          : <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        }
                        {o.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {/* Delete */}
                      <button onClick={() => setConfirmId(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: '#DC2626', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export default function OfficePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const [collapsed, setCollapsed] = useState(false);

  const VALID_KEYS: NavKey[] = ['dashboard', 'sub-offices', 'officer-management'];
  const activeNav: NavKey = VALID_KEYS.includes(section as NavKey) ? (section as NavKey) : 'dashboard';

  function setActiveNav(key: NavKey) { navigate(`/office-portal/${key}`, { replace: false }); }

  const { data: office, isLoading } = useQuery({
    queryKey: ['portal-office-me'],
    queryFn: () => api.get<{ success: boolean; data: OfficeData }>('/portal/office/me').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const isEIA = user?.role === 'EIA_ADMIN';
  const roleLabel = isEIA ? 'Export Inspection Agency' : 'Sub Export Inspection Agency';
  const nav = NAV_ALL.filter(item => !item.eiaOnly || isEIA);

  async function handleLogout() { await logout(); navigate('/'); }

  function renderSection() {
    if (activeNav === 'dashboard') return <EIAApplications />;
    if (activeNav === 'sub-offices') return <SubOfficesSection officeName={office?.name} />;
    if (activeNav === 'officer-management') return <OfficerManagementSection />;
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Header user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{ width: collapsed ? 60 : 240, backgroundColor: 'var(--bg-nav)', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s ease', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setCollapsed(c => !c)} style={{ position: 'absolute', top: 16, right: -12, width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--bg-nav)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: 10 }}>
            {collapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{ padding: collapsed ? '14px 0' : '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.85)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isLoading ? 'Loading…' : office?.name ?? user?.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: '2px 0 0' }}>{roleLabel}</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 0' }}>
            {nav.map(item => (
              <SidebarBtn key={item.key} item={item} active={activeNav === item.key} collapsed={collapsed} onClick={() => setActiveNav(item.key as NavKey)} />
            ))}
          </nav>

          {/* User info */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
            {!collapsed && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0 }}>{user?.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0' }}>{user?.email}</p>
              </div>
            )}
            <button onClick={handleLogout} title="Logout" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: collapsed ? '8px 0' : '8px 4px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Page header bar */}
          <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {nav.find(n => n.key === activeNav)?.label}
              </h1>
              {office && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{office.code} · {roleLabel}</p>}
            </div>
          </div>

          <div style={{ padding: '20px 28px', flex: 1, overflowY: 'auto' }}>
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
