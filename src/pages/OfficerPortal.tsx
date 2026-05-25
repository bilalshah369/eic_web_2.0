import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Header, { UserMenu } from '../components/Header';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface OfficeRef { id: string; name: string; code: string; type: string; }
interface OfficerData {
  id: string; name: string; qualification: string; designation: string;
  email: string | null; mobile: string | null; telephone: string | null;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; gender: string; isActive: boolean;
  offices:    { office: OfficeRef }[];
  categories: { category: string }[];
}

/* ─── nav ────────────────────────────────────────────────────────────────── */
type NavKey = 'overview' | 'offices' | 'categories' | 'profile';

const NAV: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',   label: 'Overview',             icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { key: 'offices',    label: 'EIA / Sub-EIA Offices',     icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { key: 'categories', label: 'Certified Categories', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
  { key: 'profile',    label: 'My Profile',           icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

/* ─── helpers ────────────────────────────────────────────────────────────── */
function SidebarBtn({ item, active, collapsed, onClick }: { item: typeof NAV[number]; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: collapsed ? '11px 0' : '10px 14px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: active ? 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)' : 'none',
      border: 'none', borderRadius: '10px',
      cursor: 'pointer', color: active ? '#fff' : 'rgba(27,42,107,0.70)',
      fontSize: 13, fontWeight: active ? 600 : 500, textAlign: 'left',
      transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
      whiteSpace: 'nowrap', overflow: 'hidden', marginBottom: '2px',
      boxShadow: active ? '0 4px 14px rgba(27,42,107,0.30)' : 'none',
    }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(27,42,107,0.70)'; } }}
    >
      <span style={{ flexShrink: 0, color: active ? '#fff' : 'rgba(27,42,107,0.55)' }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

export function StatCard({ label, value, iconBg, icon, loading }: { label: string; value: string | number; iconBg: string; icon: React.ReactNode; loading?: boolean }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        {loading ? <div style={{ width: 60, height: 26, borderRadius: 6, backgroundColor: 'var(--card-overlay)' }} />
          : <p style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1 }}>{value}</p>}
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

const TYPE_BADGE: Record<string, { bg: string; fg: string }> = {
  EIC: { bg: '#DBEAFE', fg: '#1D4ED8' },
  EIA: { bg: '#D1FAE5', fg: '#065F46' },
  SUB_EIA: { bg: '#FEF3C7', fg: '#92400E' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW SECTION
═══════════════════════════════════════════════════════════════════════════ */
function Overview({ officer, loading }: { officer: OfficerData | null | undefined; loading: boolean }) {
  const initials = officer?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const officeCount = officer?.offices?.length ?? 0;
  const categoryCount = officer?.categories?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero banner — compact, matches dashboard strip ── */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', borderRadius: 12, padding: '14px 20px', color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{loading ? '…' : initials}</span>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Inspection Officer</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {loading ? 'Loading…' : officer?.name ?? '—'}
              </h2>
              {officer && (
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.60)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{officer.designation}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.35)', display: 'inline-block' }} />
                  <span>{officer.qualification}</span>
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: officer?.isActive ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)', border: `1px solid ${officer?.isActive ? 'rgba(34,197,94,0.40)' : 'rgba(239,68,68,0.40)'}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: officer?.isActive ? '#86EFAC' : '#FCA5A5' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: officer?.isActive ? '#22C55E' : '#EF4444' }} />
              {loading ? '…' : officer?.isActive ? 'Active' : 'Inactive'}
            </span>
            {[
              { v: officeCount, label: 'EIA / Sub-EIA Offices' },
              { v: categoryCount, label: 'Cert. Categories' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '7px 14px', minWidth: 80 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{s.v}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { label: 'EIA / Sub-EIA Offices', value: loading ? '—' : officeCount, sub: 'Assigned offices', accentColor: '#3B82F6', accentBg: '#EFF6FF', icon: <svg width="22" height="22" fill="none" stroke="#3B82F6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
          { label: 'Certified Categories', value: loading ? '—' : categoryCount, sub: 'Certificate categories', accentColor: '#10B981', accentBg: '#ECFDF5', icon: <svg width="22" height="22" fill="none" stroke="#10B981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${c.accentBg}, ${c.accentColor}18)`, border: `1.5px solid ${c.accentColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{c.value}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: '#374151' }}>{c.label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9CA3AF' }}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Offices + Categories ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Offices */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#3B82F6' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1B2A6B', letterSpacing: '0.07em', textTransform: 'uppercase' }}>EIA / Sub-EIA Offices</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#EFF6FF', color: '#3B82F6', borderRadius: 20, padding: '2px 10px', border: '1px solid #BFDBFE' }}>{officeCount}</span>
          </div>
          {!officeCount ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <svg width="28" height="28" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 8px', display: 'block' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>No offices assigned yet</p>
            </div>
          ) : (
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {officer!.offices.map(({ office: o }) => {
                const badge = TYPE_BADGE[o.type] ?? TYPE_BADGE.EIC;
                return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, backgroundColor: '#F8FAFF', border: '1px solid #E8EEFF' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" fill="none" stroke="#3B82F6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{o.code}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: badge.bg, color: badge.fg, borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>{o.type.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E8EDF5', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#10B981' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Certified Categories</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#ECFDF5', color: '#10B981', borderRadius: 20, padding: '2px 10px', border: '1px solid #A7F3D0' }}>{categoryCount}</span>
          </div>
          {!categoryCount ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <svg width="28" height="28" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 8px', display: 'block' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>No categories assigned yet</p>
            </div>
          ) : (
            <div style={{ padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
              {officer!.categories.map(({ category }) => (
                <span key={category} style={{ fontSize: 11, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, padding: '4px 12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── assigned offices section ────────────────────────────────────────────── */
function AssignedOffices({ offices }: { offices: { office: OfficeRef }[] }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>EIA / Sub-EIA Offices</h2>
      {!offices.length ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No offices assigned yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {offices.map(({ office: o }) => {
            const badge = TYPE_BADGE[o.type] ?? TYPE_BADGE.EIC;
            return (
              <div key={o.id} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" fill="none" stroke="#1B2A6B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: badge.bg, color: badge.fg, borderRadius: 10, padding: '3px 10px' }}>{o.type.replace('_', ' ')}</span>
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{o.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Code: <strong>{o.code}</strong></p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── certified categories section ───────────────────────────────────────── */
function CertifiedCategories({ categories }: { categories: { category: string }[] }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Certified Categories</h2>
      {!categories.length ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No categories assigned yet.</div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {categories.map(({ category }) => (
              <span key={category} style={{ fontSize: 13, backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 8, padding: '7px 16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── profile section ────────────────────────────────────────────────────── */
function ProfileSection({ officer }: { officer: OfficerData | null | undefined }) {
  if (!officer) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Profile not found.</div>;

  const initials = officer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  function Field({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string | null | undefined; mono?: boolean }) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#1B2A6B' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
          <p style={{ margin: '3px 0 0', fontSize: 14, color: value ? '#111827' : '#D1D5DB', fontWeight: value ? 600 : 400, fontFamily: mono ? 'monospace' : undefined }}>
            {value ?? 'Not provided'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Identity card */}
      <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #243580 100%)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 20px rgba(27,42,107,0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{initials}</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Inspection Officer · EIC e-Services</p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{officer.name}</h2>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{officer.designation} · {officer.qualification}</p>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: officer.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${officer.isActive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: officer.isActive ? '#86EFAC' : '#FCA5A5' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: officer.isActive ? '#22C55E' : '#EF4444' }} />
            {officer.isActive ? 'Active' : 'Inactive'}
          </span>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Officer ID · {officer.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Personal */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '13px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1B2A6B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1B2A6B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Personal Information</span>
          </div>
          <div style={{ padding: '4px 20px 8px' }}>
            <Field label="Full Name" value={officer.name}
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
            <Field label="Designation" value={officer.designation}
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <Field label="Qualification" value={officer.qualification}
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>} />
            <Field label="Gender" value={officer.gender}
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          </div>
        </div>

        {/* Contact */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '13px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1B2A6B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1B2A6B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Contact & Address</span>
          </div>
          <div style={{ padding: '4px 20px 8px' }}>
            <Field label="Mobile" value={officer.mobile} mono
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
            <Field label="Telephone" value={officer.telephone} mono
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
            <Field label="Email" value={officer.email}
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <Field label="Address" value={[officer.address, officer.city, officer.state, officer.pincode].filter(Boolean).join(', ') || null}
              icon={<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export default function OfficerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavKey>('overview');
  const [collapsed, setCollapsed] = useState(false);

  const { data: officer, isLoading } = useQuery({
    queryKey: ['portal-officer-me'],
    queryFn: () => api.get<{ success: boolean; data: OfficerData }>('/portal/officer/me').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  async function handleLogout() { await logout(); navigate('/'); }

  function renderSection() {
    if (activeNav === 'overview')    return <Overview officer={officer} loading={isLoading} />;
    if (activeNav === 'offices')     return <AssignedOffices offices={officer?.offices ?? []} />;
    if (activeNav === 'categories')  return <CertifiedCategories categories={officer?.categories ?? []} />;
    if (activeNav === 'profile')     return <ProfileSection officer={officer} />;
    return null;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', overflow: 'hidden' }}>
      <Header user={user} onLogout={handleLogout} hideNav />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <aside style={{ width: collapsed ? 64 : 256, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.22s cubic-bezier(.4,0,.2,1)', position: 'relative', height: '100%', overflow: 'visible', boxShadow: '4px 0 24px rgba(27,42,107,0.10)', zIndex: 10 }}>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c => !c)} style={{ position: 'absolute', top: 20, right: -14, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1B2A6B, #2563EB)', border: '2px solid #fff', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, fontSize: 11, fontWeight: 700, boxShadow: '0 2px 10px rgba(27,42,107,0.30)', transition: 'transform 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
            {collapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{ padding: collapsed ? '13px 0' : '11px 14px 12px', borderBottom: '1px solid var(--nav-border)', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #2563EB 0%, #1B2A6B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', fontFamily: 'system-ui, sans-serif' }}>EIC</span>
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

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV.map(item => (
              <SidebarBtn key={item.key} item={item} active={activeNav === item.key} collapsed={collapsed} onClick={() => setActiveNav(item.key)} />
            ))}
          </nav>

          {/* Bottom actions */}
          <div style={{ borderTop: '1px solid rgba(27,42,107,0.08)', padding: '8px 8px' }}>
            <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: collapsed ? '10px 0' : '9px 14px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#DC2626', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s, background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget.style.color = '#B91C1C'); (e.currentTarget.style.background = 'rgba(239,68,68,0.07)'); }}
              onMouseLeave={e => { (e.currentTarget.style.color = '#DC2626'); (e.currentTarget.style.background = 'none'); }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!collapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Breadcrumb / topbar */}
          <div style={{ padding: '6px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#6b7280', fontSize: 12 }}>Dashboard</span>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>›</span>
              <span style={{ color: '#1e293b', fontSize: 12, fontWeight: 600 }}>{NAV.find(n => n.key === activeNav)?.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 11, fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                title="Help">?
              </button>
              <button style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                title="Notifications">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              {user && <UserMenu user={user} onLogout={handleLogout} variant="light" />}
            </div>
          </div>

          <div style={{ padding: '20px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {renderSection()}
          </div>
        </main>
      </div>

      {/* ── Sticky footer bar ─────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '7px 24px', background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>© 2026 Export Inspection Council. All Rights Reserved.</span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Last Updated : 28 Jan 2026 &nbsp;|&nbsp; Total Visitors : <span style={{ color: '#ffffff', fontWeight: 600 }}>2,195,193</span></span>
      </div>
    </div>
  );
}
