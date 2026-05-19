import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PIAApplicationForm from './pia/PIAApplicationForm';
import { piaApi, PIAApplicationSummary } from '../services/pia.service';

type NavKey = 'home' | 'establishment' | 'pia-applications' | 'pia-fees' | 'pia-nc' | 'pia-alerts';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    key: 'home' as NavKey,
  },
  {
    label: 'Establishment Approval',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    key: 'establishment' as NavKey,
  },
];

const PIA_SUB_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'pia-applications',
    label: 'My Applications',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: 'pia-fees',
    label: 'Pending Fees',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'pia-nc',
    label: 'Non-Conformities',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    key: 'pia-alerts',
    label: 'Alerts',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const NAV_LABELS: Record<NavKey, string> = {
  home: 'Dashboard',
  establishment: 'Establishment Approval',
  'pia-applications': 'PIA Recognition › My Applications',
  'pia-fees': 'PIA Recognition › Pending Fees',
  'pia-nc': 'PIA Recognition › Non-Conformities',
  'pia-alerts': 'PIA Recognition › Alerts',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavKey>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [piaExpanded, setPiaExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isPiaActive = PIA_SUB_ITEMS.some(s => s.key === activeNav);

  const handleSetNav = (key: NavKey) => {
    setActiveNav(key);
    if (PIA_SUB_ITEMS.some(s => s.key === key)) {
      setPiaExpanded(true);
    }
  };

  const scroll = (dir: 'up' | 'down') => {
    navRef.current?.scrollBy({ top: dir === 'up' ? -80 : 80, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Header user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, display: 'flex' }}>

        {/* Sidebar */}
        <aside style={{
          width: sidebarCollapsed ? '60px' : '260px',
          backgroundColor: 'var(--bg-nav)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.2s ease',
          position: 'relative',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{
              position: 'absolute', top: '16px', right: '-12px',
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: 'var(--bg-nav)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, fontSize: '10px',
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{
            padding: sidebarCollapsed ? '12px 0' : '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: '10px',
            overflow: 'hidden', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.8)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>EIC EServices</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', margin: '2px 0 0', lineHeight: 1.2 }}>Export Inspection Council</p>
              </div>
            )}
          </div>

          {/* Scroll up */}
          {!sidebarCollapsed && (
            <button onClick={() => scroll('up')} style={{
              width: '100%', padding: '4px 0', background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}

          {/* Navigation */}
          <nav ref={navRef} className="scrollbar-none" style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => handleSetNav(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: sidebarCollapsed ? '12px 0' : '12px 20px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  background: activeNav === item.key ? 'rgba(255,255,255,0.12)' : 'none',
                  border: 'none',
                  borderLeft: activeNav === item.key ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor: 'pointer',
                  color: activeNav === item.key ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: '13px', fontWeight: activeNav === item.key ? 600 : 400,
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
                onMouseEnter={e => { if (activeNav !== item.key) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (activeNav !== item.key) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}

            {/* PIA Recognition collapsible group */}
            {sidebarCollapsed ? (
              <button
                onClick={() => { setPiaExpanded(true); setSidebarCollapsed(false); handleSetNav('pia-applications'); }}
                title="PIA Recognition"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '12px 0',
                  background: isPiaActive ? 'rgba(255,255,255,0.12)' : 'none',
                  border: 'none',
                  borderLeft: isPiaActive ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor: 'pointer',
                  color: isPiaActive ? '#fff' : 'rgba(255,255,255,0.55)',
                }}
                onMouseEnter={e => { if (!isPiaActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isPiaActive) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </button>
            ) : (
              <div>
                {/* Group header */}
                <button
                  onClick={() => setPiaExpanded(e => !e)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '12px 20px',
                    background: isPiaActive && !piaExpanded ? 'rgba(255,255,255,0.08)' : 'none',
                    border: 'none',
                    borderLeft: isPiaActive ? '3px solid var(--accent)' : '3px solid transparent',
                    cursor: 'pointer',
                    color: isPiaActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontSize: '13px', fontWeight: isPiaActive ? 600 : 400,
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isPiaActive && !piaExpanded ? 'rgba(255,255,255,0.08)' : 'none'; }}
                >
                  <span style={{ flexShrink: 0 }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <span style={{ flex: 1 }}>PIA Recognition</span>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ transform: piaExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Sub-items */}
                {piaExpanded && (
                  <div style={{ position: 'relative', marginLeft: '20px' }}>
                    <div style={{ position: 'absolute', left: '18px', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.12)' }} />
                    {PIA_SUB_ITEMS.map(sub => (
                      <button
                        key={sub.key}
                        onClick={() => handleSetNav(sub.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '9px 12px 9px 30px',
                          background: activeNav === sub.key ? 'rgba(255,255,255,0.10)' : 'none',
                          border: 'none',
                          borderLeft: activeNav === sub.key ? '2px solid var(--accent)' : '2px solid transparent',
                          cursor: 'pointer',
                          color: activeNav === sub.key ? '#fff' : 'rgba(255,255,255,0.50)',
                          fontSize: '12px', fontWeight: activeNav === sub.key ? 600 : 400,
                          textAlign: 'left',
                          transition: 'background 0.15s',
                          whiteSpace: 'nowrap', overflow: 'hidden',
                        }}
                        onMouseEnter={e => { if (activeNav !== sub.key) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (activeNav !== sub.key) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span style={{ flexShrink: 0, opacity: 0.7 }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Scroll down */}
          {!sidebarCollapsed && (
            <button onClick={() => scroll('down')} style={{
              width: '100%', padding: '4px 0', background: 'none', border: 'none',
              cursor: 'pointer', color: 'rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'center',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7 7 7" />
              </svg>
            </button>
          )}

          {/* Bottom actions */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: sidebarCollapsed ? '11px 0' : '11px 20px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              title={sidebarCollapsed ? 'Change Password' : undefined}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {!sidebarCollapsed && 'Change Password'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: sidebarCollapsed ? '11px 0' : '11px 20px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(239,68,68,0.7)', fontSize: '13px', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.7)')}
              title={sidebarCollapsed ? 'Logout' : undefined}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!sidebarCollapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Breadcrumb bar */}
          <div style={{
            padding: '7px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}>
            <button
              onClick={() => setActiveNav('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: activeNav === 'home' ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '11px' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = activeNav === 'home' ? 'var(--text-secondary)' : 'var(--text-muted)')}
            >
              Dashboard
            </button>
            {activeNav !== 'home' && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>›</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {NAV_LABELS[activeNav]}
                </span>
              </>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '16px 24px', flex: 1, minHeight: 'calc(100vh - 340px)' }}>
            {activeNav === 'home' ? (
              <DashboardHome onNavigate={handleSetNav} />
            ) : (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '18px 22px',
                minHeight: '320px',
              }}>
                {activeNav === 'establishment' && <EstablishmentApproval />}
                {activeNav === 'pia-applications' && <PIAApplicationsSection />}
                {activeNav === 'pia-fees' && <PIAEmptySection title="Pending Fees" desc="No pending fee payments at this time." icon="fees" />}
                {activeNav === 'pia-nc' && <PIAEmptySection title="Non-Conformities" desc="No non-conformities raised for your agency." icon="nc" />}
                {activeNav === 'pia-alerts' && <PIAEmptySection title="Alerts" desc="No alerts or notifications at this time." icon="alerts" />}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

// ─── Service Cards ────────────────────────────────────────────────────────────

const SERVICES = [
  {
    key: 'establishment',
    label: 'Establishment Approval',
    shortLabel: 'CoA',
    desc: 'Apply for Certificate of Approval (CoA) for food export establishments. Submit documents, pay fees and track your application in real-time.',
    tag: 'Certificate of Approval',
    steps: ['Register', 'Upload Docs', 'Pay Fee', 'Inspection', 'CoA Issued'],
    accentColor: '#3B82F6',
    accentBg: '#EFF6FF',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" />
      </svg>
    ),
  },
  {
    key: 'pia',
    label: 'PIA Recognition',
    shortLabel: 'PIA',
    desc: 'Get recognition as a Private Inspection Agency for conducting inspections on behalf of EIC. Valid for 3 years, renewable online.',
    tag: 'Inspection Agency',
    steps: ['Apply', 'Document Review', 'Verification', 'Recognition'],
    accentColor: '#8B5CF6',
    accentBg: '#F5F3FF',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    key: 'export-cert',
    label: 'Export Certificates',
    shortLabel: 'CERT',
    desc: 'Obtain Health Certificates, Pre-shipment Inspection Certificates and other statutory documents required for export of food products.',
    tag: 'Health & Inspection',
    steps: ['Request', 'Inspection', 'Lab Test', 'Certificate'],
    accentColor: '#10B981',
    accentBg: '#ECFDF5',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'renewal',
    label: 'Renewal & Amendment',
    shortLabel: 'RNW',
    desc: 'Renew your existing Certificate of Approval, amend establishment details, or add new commodities to your existing approval.',
    tag: 'Existing Approvals',
    steps: ['Request', 'Review', 'Inspection (if req.)', 'Renewed'],
    accentColor: '#F59E0B',
    accentBg: '#FFFBEB',
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

function DashboardHome({ onNavigate }: { onNavigate: (key: NavKey) => void }) {
  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          Available Services
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        {SERVICES.map(svc => (
          <div
            key={svc.key}
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            <div style={{ height: '3px', backgroundColor: svc.accentColor }} />

            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
                  backgroundColor: svc.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: svc.accentColor,
                }}>
                  {svc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                    {svc.label}
                  </p>
                  <span style={{
                    display: 'inline-block', marginTop: '4px',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                    padding: '2px 7px', borderRadius: '20px',
                    backgroundColor: svc.accentBg, color: svc.accentColor,
                    border: `1px solid ${svc.accentColor}30`,
                  }}>
                    {svc.tag}
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                {svc.desc}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {svc.steps.map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{step}</span>
                    {i < svc.steps.length - 1 && (
                      <svg width="10" height="10" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {svc.key === 'establishment' || svc.key === 'pia' ? 'Open for applications' : 'Available'}
              </span>
              {svc.key === 'establishment' || svc.key === 'pia' ? (
                <button
                  onClick={() => onNavigate(svc.key === 'pia' ? 'pia-applications' : 'establishment')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '6px',
                    backgroundColor: svc.accentColor, border: 'none',
                    color: '#fff', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Apply Now
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '6px',
                    backgroundColor: svc.accentColor, border: 'none',
                    color: '#fff', fontSize: '12px', fontWeight: 600,
                    cursor: 'default', opacity: 0.45,
                  }}
                >
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Establishment Approval ───────────────────────────────────────────────────

function EstablishmentApproval() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>Establishment Approval</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '3px 0 0' }}>Manage your establishment approval applications</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '7px 14px', borderRadius: '7px',
          backgroundColor: 'var(--accent)', border: 'none',
          color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No applications yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, textAlign: 'center' }}>Click "New Application" to submit your first establishment approval request</p>
      </div>
    </div>
  );
}

// ─── PIA Applications Section ─────────────────────────────────────────────────

const APP_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under-review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:                   { label: 'Draft',             color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  SUBMITTED:               { label: 'Submitted',         color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
  APPLICATION_FEE_PENDING: { label: 'Fee Pending',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  APPLICATION_FEE_PAID:    { label: 'Fee Paid',          color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  RECEIVED_BY_EIA:         { label: 'Received by EIA',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
  UNDER_DOCUMENT_SCRUTINY: { label: 'Under Scrutiny',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  DISCREPANCY_RAISED:      { label: 'Discrepancy',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  APPROVED_BY_EIC:         { label: 'Approved',          color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  REJECTED:                { label: 'Rejected',          color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  ACTIVE:                  { label: 'Active',            color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { label: status, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
      color: cfg.color, backgroundColor: cfg.bg,
    }}>{cfg.label}</span>
  );
}

function PIAApplicationsSection() {
  const [tab, setTab] = useState('all');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apps, setApps] = useState<PIAApplicationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [createError, setCreateError] = useState('');

  // Load list
  const loadApps = () => {
    setLoadingList(true);
    piaApi.list().then(data => { setApps(data); setLoadingList(false); }).catch(() => setLoadingList(false));
  };
  useState(() => { loadApps(); });

  const filtered = apps.filter(a => {
    if (tab === 'all') return true;
    if (tab === 'draft') return a.status === 'DRAFT';
    if (tab === 'submitted') return a.status === 'SUBMITTED';
    if (tab === 'under-review') return ['APPLICATION_FEE_PENDING','APPLICATION_FEE_PAID','RECEIVED_BY_EIA','FORWARDED_TO_EIC','UNDER_DOCUMENT_SCRUTINY','SCRUTINY_COMPLETED'].includes(a.piaApplication?.piaStatus ?? '');
    if (tab === 'approved') return ['APPROVED_BY_EIC','ACTIVE','RENEWED'].includes(a.piaApplication?.piaStatus ?? '');
    return true;
  });

  const handleCreateNew = async () => {
    if (!newAgencyName.trim()) { setCreateError('Agency name is required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const app = await piaApi.createDraft(newAgencyName.trim());
      setApps(prev => [app as any, ...prev]);
      setCreateModal(false);
      setNewAgencyName('');
      setEditingId(app.id);
      setView('form');
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Could not create application. Try again.');
    } finally {
      setCreating(false);
    }
  };

  // ── Form view ──
  if (view === 'form' && editingId) {
    return (
      <PIAApplicationForm
        applicationId={editingId}
        onBack={() => { setView('list'); setEditingId(null); loadApps(); }}
        onSaved={() => {}}
      />
    );
  }

  // ── List view ──
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>PIA Recognition — My Applications</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '3px 0 0' }}>Track and manage your PIA recognition applications</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 14px', borderRadius: '7px',
            backgroundColor: '#8B5CF6', border: 'none',
            color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {APP_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? '#8B5CF6' : 'var(--text-muted)',
            borderBottom: tab === t.key ? '2px solid #8B5CF6' : '2px solid transparent',
            marginBottom: '-1px', transition: 'color 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      {loadingList ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '10px' }}>
          <div style={{ width: 18, height: 18, border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6', borderRadius: '50%' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', gap: '12px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" fill="none" stroke="rgba(139,92,246,0.5)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No applications yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, textAlign: 'center', maxWidth: '320px' }}>
            Click "New Application" to start your PIA recognition request. You can save it as a draft and return any time.
          </p>
          <button onClick={() => setCreateModal(true)} style={{
            marginTop: '4px', padding: '8px 20px', borderRadius: '7px',
            backgroundColor: '#8B5CF6', border: 'none',
            color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>Start New Application</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(app => (
            <div key={app.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{app.organisation}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.appNo}</span>
                  <StatusBadge status={app.piaApplication?.piaStatus ?? app.status} />
                  {app.piaApplication?.subType && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {app.piaApplication.subType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Last updated: {new Date(app.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {app.status === 'DRAFT' && (
                  <button
                    onClick={() => { setEditingId(app.id); setView('form'); }}
                    style={{
                      padding: '6px 14px', borderRadius: '6px',
                      border: '1px solid #8B5CF6',
                      backgroundColor: 'rgba(139,92,246,0.1)',
                      color: '#8B5CF6', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                    Continue
                  </button>
                )}
                <button
                  onClick={() => { setEditingId(app.id); setView('form'); }}
                  style={{
                    padding: '6px 14px', borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'none',
                    color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
          <div className="modal-dark" style={{
            width: '100%', maxWidth: '440px', margin: '0 16px',
            backgroundColor: '#1a2342', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '24px',
          }}>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>New PIA Application</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: '0 0 20px' }}>
              Enter your agency name to begin. You can save as draft and continue later.
            </p>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              Agency Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={newAgencyName}
              onChange={e => { setNewAgencyName(e.target.value); setCreateError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateNew(); }}
              placeholder="Full registered name of your agency"
              autoFocus
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '7px', border: `1px solid ${createError ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
                backgroundColor: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {createError && <p style={{ color: '#EF4444', fontSize: '11px', margin: '6px 0 0' }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCreateModal(false); setNewAgencyName(''); setCreateError(''); }} style={{
                padding: '8px 18px', borderRadius: '7px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: '13px', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleCreateNew} disabled={creating} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 20px', borderRadius: '7px',
                backgroundColor: '#8B5CF6', border: 'none',
                color: '#fff', fontSize: '13px', fontWeight: 600,
                cursor: creating ? 'wait' : 'pointer', opacity: creating ? 0.7 : 1,
              }}>
                {creating ? 'Creating…' : 'Start Application'}
                {!creating && (
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic PIA Empty Section ────────────────────────────────────────────────

function PIAEmptySection({ title, desc, icon }: { title: string; desc: string; icon: 'fees' | 'nc' | 'alerts' }) {
  const icons = {
    fees: (
      <svg width="26" height="26" fill="none" stroke="rgba(139,92,246,0.5)" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    nc: (
      <svg width="26" height="26" fill="none" stroke="rgba(245,158,11,0.5)" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    alerts: (
      <svg width="26" height="26" fill="none" stroke="rgba(59,130,246,0.5)" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  };

  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>PIA Recognition — {title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '3px 0 0' }}>{desc}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icons[icon]}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Nothing here yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, textAlign: 'center' }}>{desc}</p>
      </div>
    </div>
  );
}
