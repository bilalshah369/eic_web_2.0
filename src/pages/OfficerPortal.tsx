import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Header from '../components/Header';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface OfficeRef { id: string; name: string; code: string; type: string; }
interface ProductRef { id: string; name: string; category: string | null; }
interface OfficerData {
  id: string; name: string; qualification: string; designation: string;
  email: string | null; mobile: string | null; telephone: string | null;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; gender: string; isActive: boolean;
  offices: { office: OfficeRef }[];
  products: { product: ProductRef }[];
}

/* ─── nav ────────────────────────────────────────────────────────────────── */
type NavKey = 'overview' | 'offices' | 'products' | 'profile';

const NAV: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { key: 'offices', label: 'Assigned Offices', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { key: 'products', label: 'Assigned Products', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { key: 'profile', label: 'My Profile', icon: <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

/* ─── helpers ────────────────────────────────────────────────────────────── */
function SidebarBtn({ item, active, collapsed, onClick }: { item: typeof NAV[number]; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: collapsed ? '12px 0' : '11px 20px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: active ? 'rgba(255,255,255,0.12)' : 'none',
      border: 'none', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
      cursor: 'pointer', color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left',
      transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

function StatCard({ label, value, iconBg, icon, loading }: { label: string; value: string | number; iconBg: string; icon: React.ReactNode; loading?: boolean }) {
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

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
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
  const productsByCategory = (officer?.products ?? []).reduce<Record<string, ProductRef[]>>((acc, { product: p }) => {
    const cat = p.category ?? 'General';
    (acc[cat] = acc[cat] ?? []).push(p);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #2D3E8C 100%)', borderRadius: 14, padding: '26px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inspection Officer Portal</p>
          <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700 }}>{loading ? 'Loading…' : officer?.name}</h2>
          {officer && <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>{officer.designation} · {officer.qualification}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ backgroundColor: officer?.isActive ? '#22C55E' : '#EF4444', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700 }}>
            {loading ? '…' : officer?.isActive ? 'Active' : 'Inactive'}
          </span>
          {officer && (
            <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.8 }}>
              {officer.offices.length} Office{officer.offices.length !== 1 ? 's' : ''} · {officer.products.length} Product{officer.products.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard label="Assigned Offices" value={loading ? '…' : officer?.offices.length ?? 0} iconBg="#EEF2FF" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#1B2A6B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard label="Certificate Products" value={loading ? '…' : officer?.products.length ?? 0} iconBg="#FFF7ED" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#C2410C" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
        <StatCard label="Product Categories" value={loading ? '…' : Object.keys(productsByCategory).length} iconBg="#D1FAE5" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#065F46" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
      </div>

      {/* Offices + Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Offices */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#EEF2FF' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1B2A6B' }}>ASSIGNED OFFICES ({officer?.offices.length ?? 0})</p>
          </div>
          {!officer?.offices.length ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No offices assigned yet.</div>
          ) : (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {officer.offices.map(({ office: o }) => {
                const badge = TYPE_BADGE[o.type] ?? TYPE_BADGE.EIC;
                return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, backgroundColor: '#F8FAFF', border: '1px solid #E0E7FF' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{o.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{o.code}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: badge.bg, color: badge.fg, borderRadius: 10, padding: '3px 10px' }}>
                      {o.type.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Products */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#FFF7ED' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#C2410C' }}>ASSIGNED PRODUCTS ({officer?.products.length ?? 0})</p>
          </div>
          {!Object.keys(productsByCategory).length ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No products assigned yet.</div>
          ) : (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto' }}>
              {Object.entries(productsByCategory).map(([cat, prods]) => (
                <div key={cat}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {prods.map(p => (
                      <span key={p.id} style={{ fontSize: 12, backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 6, padding: '3px 10px', fontWeight: 500 }}>{p.name}</span>
                    ))}
                  </div>
                </div>
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
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Assigned Offices</h2>
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

/* ─── assigned products section ──────────────────────────────────────────── */
function AssignedProducts({ products }: { products: { product: ProductRef }[] }) {
  const grouped = products.reduce<Record<string, ProductRef[]>>((acc, { product: p }) => {
    const cat = p.category ?? 'General';
    (acc[cat] = acc[cat] ?? []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Assigned Certificate Products</h2>
      {!products.length ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No products assigned yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([cat, prods]) => (
            <div key={cat} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#C2410C' }}>{cat}</p>
                <span style={{ fontSize: 11, backgroundColor: '#FED7AA', color: '#92400E', borderRadius: 10, padding: '2px 10px', fontWeight: 700 }}>{prods.length} product{prods.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {prods.map(p => (
                  <span key={p.id} style={{ fontSize: 13, backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 8, padding: '6px 14px', fontWeight: 500 }}>{p.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── profile section ────────────────────────────────────────────────────── */
function ProfileSection({ officer }: { officer: OfficerData | null | undefined }) {
  if (!officer) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Profile not found.</div>;
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>My Profile</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#EEF2FF' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1B2A6B' }}>PERSONAL INFORMATION</p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <InfoRow label="Full Name" value={officer.name} />
            <InfoRow label="Designation" value={officer.designation} />
            <InfoRow label="Qualification" value={officer.qualification} />
            <InfoRow label="Gender" value={officer.gender} />
            <InfoRow label="Status" value={officer.isActive ? 'Active' : 'Inactive'} />
          </div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#EEF2FF' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1B2A6B' }}>CONTACT & ADDRESS</p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <InfoRow label="Mobile" value={officer.mobile} />
            <InfoRow label="Telephone" value={officer.telephone} />
            <InfoRow label="Email" value={officer.email} />
            <InfoRow label="Address" value={officer.address} />
            <InfoRow label="City" value={officer.city} />
            <InfoRow label="State" value={officer.state} />
            <InfoRow label="Pincode" value={officer.pincode} />
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
    if (activeNav === 'overview')  return <Overview officer={officer} loading={isLoading} />;
    if (activeNav === 'offices')   return <AssignedOffices offices={officer?.offices ?? []} />;
    if (activeNav === 'products')  return <AssignedProducts products={officer?.products ?? []} />;
    if (activeNav === 'profile')   return <ProfileSection officer={officer} />;
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Header user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{ width: collapsed ? 60 : 220, backgroundColor: 'var(--bg-nav)', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s ease', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setCollapsed(c => !c)} style={{ position: 'absolute', top: 16, right: -12, width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--bg-nav)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: 10 }}>
            {collapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{ padding: collapsed ? '14px 0' : '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.85)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isLoading ? 'Loading…' : officer?.name ?? user?.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: '2px 0 0' }}>Inspection Officer</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 0' }}>
            {NAV.map(item => (
              <SidebarBtn key={item.key} item={item} active={activeNav === item.key} collapsed={collapsed} onClick={() => setActiveNav(item.key)} />
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
          <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {NAV.find(n => n.key === activeNav)?.label}
              </h1>
              {officer && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{officer.designation} · {officer.qualification}</p>}
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
