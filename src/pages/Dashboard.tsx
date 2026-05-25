import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header, { UserMenu } from '../components/Header';
import PaletteButton from '../components/PaletteButton';
import ChangePasswordModal from '../components/ChangePasswordModal';
import PIAApplicationForm from './pia/PIAApplicationForm';
import { piaApi, PIAApplicationSummary, PIASubType } from '../services/pia.service';

type NavKey = 'home' | 'establishment' | 'pia-applications' | 'pia-fees' | 'pia-nc';

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
];

const SECTION_CRUMBS: Record<NavKey, string[]> = {
  home:              ['Dashboard'],
  establishment:     ['Dashboard', 'Establishment Approval'],
  'pia-applications':['Dashboard', 'PIA Recognition', 'My Applications'],
  'pia-fees':        ['Dashboard', 'PIA Recognition', 'Pending Fees'],
  'pia-nc':          ['Dashboard', 'PIA Recognition', 'Non-Conformities'],
};

const ALL_NAV_KEYS: NavKey[] = [
  ...NAV_ITEMS.map(i => i.key),
  ...PIA_SUB_ITEMS.map(i => i.key),
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();

  const resolvedNav = (ALL_NAV_KEYS.includes(section as NavKey) ? section : 'home') as NavKey;

  const [activeNav, setActiveNav] = useState<NavKey>(resolvedNav);
  const [sectionKey, setSectionKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [piaExpanded, setPiaExpanded] = useState(() => PIA_SUB_ITEMS.some(s => s.key === resolvedNav));
  const [showChangePwd, setShowChangePwd] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Sync when browser back/forward changes URL
  useEffect(() => {
    const key = (ALL_NAV_KEYS.includes(section as NavKey) ? section : 'home') as NavKey;
    setActiveNav(key);
    setSectionKey(k => k + 1);
    if (PIA_SUB_ITEMS.some(s => s.key === key)) setPiaExpanded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const isPiaActive = PIA_SUB_ITEMS.some(s => s.key === activeNav);

  const handleSetNav = (key: NavKey) => {
    const url = key === 'home' ? '/dashboard' : `/dashboard/${key}`;
    navigate(url);
    if (key === activeNav) { setSectionKey(k => k + 1); return; }
    setActiveNav(key);
    setSectionKey(k => k + 1);
    if (PIA_SUB_ITEMS.some(s => s.key === key)) setPiaExpanded(true);
  };

  const scroll = (dir: 'up' | 'down') => {
    navRef.current?.scrollBy({ top: dir === 'up' ? -80 : 80, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const crumbs = SECTION_CRUMBS[activeNav];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', overflow: 'hidden' }}>
      <Header user={user} onLogout={handleLogout} hideNav />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar ───────────────────────────────────── */}
        <aside style={{
          width: sidebarCollapsed ? '64px' : '256px',
          backgroundColor: '#ffffff',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          position: 'relative',
          height: '100%', overflow: 'visible',
          boxShadow: '4px 0 24px rgba(27,42,107,0.10)',
          zIndex: 10,
        }}>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{
              position: 'absolute', top: '20px', right: '-14px',
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
              border: '2px solid #fff',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, fontSize: '11px', fontWeight: 700,
              boxShadow: '0 2px 10px rgba(27,42,107,0.30)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{
            padding: sidebarCollapsed ? '13px 0' : '11px 14px 12px',
            borderBottom: '1px solid var(--nav-border)',
            display: 'flex', alignItems: 'center', gap: '10px',
            overflow: 'hidden', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--grad-to) 0%, var(--grad-from) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', fontFamily: 'system-ui, sans-serif' }}>EIC</span>
            </div>
            {!sidebarCollapsed && (
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
          <button
            onClick={() => scroll('up')}
            style={{ width: '100%', padding: '3px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(27,42,107,0.07)', cursor: 'pointer', color: 'rgba(27,42,107,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1B2A6B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,42,107,0.35)')}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
          </button>

          {/* Navigation */}
          <nav ref={navRef} className="scrollbar-none" style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSetNav(item.key)}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%',
                    padding: sidebarCollapsed ? '11px 0' : '10px 14px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    background: isActive ? 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' : 'none',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: isActive ? '#ffffff' : 'rgba(27,42,107,0.70)',
                    fontSize: '13px', fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    boxShadow: isActive ? '0 4px 14px rgba(27,42,107,0.30)' : 'none',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(27,42,107,0.70)'; } }}
                >
                  <span style={{ flexShrink: 0, color: isActive ? '#ffffff' : 'rgba(27,42,107,0.55)' }}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}

            {/* PIA Recognition collapsible group */}
            {!sidebarCollapsed && (
              <div style={{ marginTop: 2 }}>
                <button
                  onClick={() => setPiaExpanded(e => !e)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: isPiaActive ? 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' : 'none',
                    border: 'none', borderRadius: '10px',
                    cursor: 'pointer',
                    color: isPiaActive ? '#ffffff' : 'rgba(27,42,107,0.70)',
                    fontSize: '13px', fontWeight: isPiaActive ? 600 : 500,
                    textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
                    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                    boxShadow: isPiaActive ? '0 4px 14px rgba(27,42,107,0.30)' : 'none',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={e => { if (!isPiaActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
                  onMouseLeave={e => { if (!isPiaActive) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(27,42,107,0.70)'; } }}
                >
                  <span style={{ flexShrink: 0, color: isPiaActive ? '#ffffff' : 'rgba(27,42,107,0.55)' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </span>
                  <span style={{ flex: 1 }}>PIA Recognition</span>
                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ flexShrink: 0, transform: piaExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {piaExpanded && (
                  <div style={{ paddingLeft: '12px', marginTop: '2px' }}>
                    <div style={{ borderLeft: '2px solid rgba(27,42,107,0.15)', paddingLeft: '8px' }}>
                      {PIA_SUB_ITEMS.map(sub => {
                        const isSubActive = activeNav === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => handleSetNav(sub.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              width: '100%', padding: '8px 12px',
                              background: isSubActive ? 'rgba(27,42,107,0.10)' : 'none',
                              border: 'none', borderRadius: '8px',
                              cursor: 'pointer',
                              color: isSubActive ? '#1B2A6B' : 'rgba(27,42,107,0.60)',
                              fontSize: '12px', fontWeight: isSubActive ? 700 : 500,
                              textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
                              transition: 'background 0.15s, color 0.15s',
                              marginBottom: '1px',
                            }}
                            onMouseEnter={e => { if (!isSubActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(27,42,107,0.06)'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
                            onMouseLeave={e => { if (!isSubActive) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(27,42,107,0.60)'; } }}
                          >
                            <span style={{ flexShrink: 0, color: isSubActive ? '#1B2A6B' : 'rgba(27,42,107,0.45)' }}>{sub.icon}</span>
                            <span>{sub.label}</span>
                            {isSubActive && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PIA icon-only when collapsed */}
            {sidebarCollapsed && (
              <button
                title="PIA Recognition"
                onClick={() => { setPiaExpanded(true); setSidebarCollapsed(false); handleSetNav('pia-applications'); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '11px 0',
                  background: isPiaActive ? 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' : 'none',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer',
                  color: isPiaActive ? '#ffffff' : 'rgba(27,42,107,0.55)',
                  boxShadow: isPiaActive ? '0 4px 14px rgba(27,42,107,0.30)' : 'none',
                  marginBottom: '2px',
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </button>
            )}
          </nav>

          {/* Scroll down */}
          <button
            onClick={() => scroll('down')}
            style={{ width: '100%', padding: '3px 0', background: 'none', border: 'none', borderTop: '1px solid rgba(27,42,107,0.07)', cursor: 'pointer', color: 'rgba(27,42,107,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1B2A6B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,42,107,0.35)')}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {/* Bottom actions */}
          <div style={{ borderTop: '1px solid rgba(27,42,107,0.08)', padding: '8px 8px' }}>
            <button
              onClick={() => setShowChangePwd(true)}
              title={sidebarCollapsed ? 'Change Password' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: sidebarCollapsed ? '10px 0' : '9px 14px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer',
                color: 'rgba(27,42,107,0.65)', fontSize: '13px', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.color = '#1B2A6B'); (e.currentTarget.style.background = 'rgba(27,42,107,0.06)'); }}
              onMouseLeave={e => { (e.currentTarget.style.color = 'rgba(27,42,107,0.65)'); (e.currentTarget.style.background = 'none'); }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {!sidebarCollapsed && 'Change Password'}
            </button>
            <button
              onClick={handleLogout}
              title={sidebarCollapsed ? 'Logout' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: sidebarCollapsed ? '10px 0' : '9px 14px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer',
                color: '#DC2626', fontSize: '13px', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.color = '#B91C1C'); (e.currentTarget.style.background = 'rgba(239,68,68,0.07)'); }}
              onMouseLeave={e => { (e.currentTarget.style.color = '#DC2626'); (e.currentTarget.style.background = 'none'); }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!sidebarCollapsed && 'Logout'}
            </button>
          </div>

        </aside>

        {/* ── Main content ──────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Breadcrumb bar */}
          <div style={{
            padding: '6px 24px',
            borderBottom: '1px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {crumbs.map((crumb, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {i > 0 && <span style={{ color: '#9ca3af', fontSize: '12px' }}>›</span>}
                  {i < crumbs.length - 1 ? (
                    <button
                      onClick={() => i === 0 ? handleSetNav('home') : undefined}
                      style={{ background: 'none', border: 'none', cursor: i === 0 ? 'pointer' : 'default', padding: 0, color: '#6b7280', fontSize: '12px' }}
                      onMouseEnter={e => { if (i === 0) { (e.currentTarget as HTMLElement).style.color = '#1e293b'; } }}
                      onMouseLeave={e => { if (i === 0) { (e.currentTarget as HTMLElement).style.color = '#6b7280'; } }}
                    >
                      {crumb}
                    </button>
                  ) : (
                    <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>{crumb}</span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button style={{
                width: 26, height: 26, borderRadius: '5px',
                border: '1px solid #d1d5db', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6b7280', fontSize: '11px', fontWeight: 700,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                title="Help">
                ?
              </button>
              <button style={{
                width: 26, height: 26, borderRadius: '5px',
                border: '1px solid #d1d5db', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6b7280',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                title="Notifications">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <PaletteButton variant="light" />
              {user && <UserMenu user={user} onLogout={handleLogout} variant="light" />}
            </div>
          </div>

          {/* Content area */}
          <div key={sectionKey} style={{ padding: '20px 24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {activeNav === 'home' && <DashboardHome onNavigate={handleSetNav} />}
            {activeNav === 'establishment' && <EstablishmentApproval />}
            {activeNav === 'pia-applications' && <PIAApplicationsSection />}
            {activeNav === 'pia-fees' && <PIAEmptySection title="Pending Fees" desc="No pending fee payments at this time." icon="fees" />}
            {activeNav === 'pia-nc' && <PIAEmptySection title="Non-Conformities" desc="No non-conformities raised for your agency." icon="nc" />}
          </div>
        </main>
      </div>

      {/* ── Sticky footer bar ─────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '7px 24px', background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>© 2026 Export Inspection Council. All Rights Reserved.</span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Last Updated : 28 Jan 2026 &nbsp;|&nbsp; Total Visitors : <span style={{ color: '#ffffff', fontWeight: 600 }}>2,195,193</span></span>
      </div>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
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
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      {/* ── Hero Welcome Strip ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 500, margin: '0 0 3px', letterSpacing: '0.02em' }}>{today}</p>
            <h1 style={{ color: '#ffffff', fontSize: '17px', fontWeight: 700, margin: '0 0 2px', lineHeight: 1.2 }}>
              Welcome to EIC e-Services Portal
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '12px', margin: 0 }}>
              Manage approvals, PIA recognition, and export certificates — all in one place.
            </p>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', gap: '8px' }}>
            {[
              { label: 'Active Applications', value: '0', icon: '📋' },
              { label: 'Pending Actions', value: '0', icon: '⏳' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '10px',
                padding: '8px 14px',
                textAlign: 'center',
                minWidth: '90px',
              }}>
                <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section heading ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: '#1B2A6B' }} />
        <p style={{ color: '#1B2A6B', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          Available Services
        </p>
      </div>

      {/* ── Service Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {SERVICES.map(svc => {
          const active = svc.key === 'establishment' || svc.key === 'pia';
          return (
            <div
              key={svc.key}
              style={{
                borderRadius: '14px',
                border: '1px solid #E8EDF5',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 2px 8px rgba(27,42,107,0.07)',
                transition: 'box-shadow 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px rgba(27,42,107,0.14)`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              {/* Accent top bar */}
              <div style={{ height: '5px', background: `linear-gradient(90deg, ${svc.accentColor}, ${svc.accentColor}99)` }} />

              <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Icon + Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '12px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${svc.accentBg}, ${svc.accentColor}18)`,
                    border: `1.5px solid ${svc.accentColor}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: svc.accentColor,
                  }}>
                    {svc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#111827', fontSize: '15px', fontWeight: 700, margin: '0 0 5px', lineHeight: 1.2 }}>
                      {svc.label}
                    </p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em',
                      padding: '3px 8px', borderRadius: '20px',
                      backgroundColor: svc.accentBg, color: svc.accentColor,
                      border: `1px solid ${svc.accentColor}35`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: svc.accentColor, flexShrink: 0 }} />
                      {svc.tag}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#4B5563', fontSize: '12.5px', lineHeight: 1.65, margin: 0 }}>
                  {svc.desc}
                </p>

                {/* Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                  {svc.steps.map((step, i) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap' }}>{step}</span>
                      {i < svc.steps.length - 1 && (
                        <svg width="9" height="9" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#FAFBFF',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? '#10B981' : '#94A3B8' }} />
                  <span style={{ fontSize: '11px', color: active ? '#059669' : '#94A3B8', fontWeight: 500 }}>
                    {active ? 'Open for applications' : 'Available'}
                  </span>
                </div>
                {active ? (
                  <button
                    onClick={() => onNavigate(svc.key === 'pia' ? 'pia-applications' : 'establishment')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 16px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
                      border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', letterSpacing: '0.01em',
                      boxShadow: '0 2px 8px rgba(27,42,107,0.30)',
                      transition: 'opacity 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                  >
                    Apply Now
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button disabled style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '7px 14px', borderRadius: '8px',
                    backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                    color: '#94A3B8', fontSize: '12px', fontWeight: 600,
                    cursor: 'default',
                  }}>
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT:                   { label: 'Draft',            color: '#475569', bg: '#F1F5F9', dot: '#94a3b8' },
  SUBMITTED:               { label: 'Submitted',        color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6' },
  APPLICATION_FEE_PENDING: { label: 'Fee Pending',      color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  APPLICATION_FEE_PAID:    { label: 'Fee Paid',         color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  RECEIVED_BY_EIA:         { label: 'Received by EIA',  color: '#3730A3', bg: '#EEF2FF', dot: '#6366F1' },
  FORWARDED_TO_EIC:        { label: 'Forwarded to EIC', color: '#1E40AF', bg: '#DBEAFE', dot: '#3B82F6' },
  UNDER_DOCUMENT_SCRUTINY: { label: 'Under Scrutiny',   color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  SCRUTINY_COMPLETED:      { label: 'Scrutiny Done',    color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  DISCREPANCY_RAISED:      { label: 'Discrepancy',      color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  RESUBMITTED_BY_APPLICANT:{ label: 'Resubmitted',      color: '#1D4ED8', bg: '#EFF6FF', dot: '#3B82F6' },
  UNDER_FINAL_REVIEW:      { label: 'Final Review',     color: '#7C2D12', bg: '#FFEDD5', dot: '#F97316' },
  APPROVED_BY_EIC:         { label: 'Approved',         color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  REJECTED:                { label: 'Rejected',         color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  ACTIVE:                  { label: 'Active',           color: '#065F46', bg: '#DCFCE7', dot: '#22C55E' },
  RENEWED:                 { label: 'Renewed',          color: '#065F46', bg: '#DCFCE7', dot: '#22C55E' },
  RENEWAL_DUE:             { label: 'Renewal Due',      color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  SUSPENDED:               { label: 'Suspended',        color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  EXPIRED:                 { label: 'Expired',          color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  WITHDRAWN:               { label: 'Withdrawn',        color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const SUBTYPE_CFG: Record<string, { label: string; color: string; bg: string; accent: string }> = {
  NEW_RECOGNITION: { label: 'New Recognition',           color: '#6D28D9', bg: '#F5F3FF', accent: '#7C3AED' },
  RENEWAL:         { label: 'Renewal',                   color: '#065F46', bg: '#ECFDF5', accent: '#059669' },
  MODIFICATION:    { label: 'Modification / Ext. Scope', color: '#92400E', bg: '#FFFBEB', accent: '#D97706' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#475569', bg: '#F1F5F9', dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px',
      color: cfg.color, backgroundColor: cfg.bg,
      border: `1px solid ${cfg.dot}30`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PIAApplicationsSection() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apps, setApps] = useState<PIAApplicationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PIAApplicationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load list
  const loadApps = () => {
    setLoadingList(true);
    piaApi.list().then(data => { setApps(data); setLoadingList(false); }).catch(() => setLoadingList(false));
  };
  useState(() => { loadApps(); });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    piaApi.deleteApplication(deleteTarget.id)
      .then(() => { setDeleteTarget(null); loadApps(); })
      .catch(() => {})
      .finally(() => setDeleting(false));
  };

  const filtered = apps.filter(a => {
    if (tab === 'all') return true;
    if (tab === 'draft') return a.status === 'DRAFT';
    if (tab === 'submitted') return a.status === 'SUBMITTED';
    if (tab === 'under-review') return ['APPLICATION_FEE_PENDING','APPLICATION_FEE_PAID','RECEIVED_BY_EIA','FORWARDED_TO_EIC','UNDER_DOCUMENT_SCRUTINY','SCRUTINY_COMPLETED'].includes(a.piaApplication?.piaStatus ?? '');
    if (tab === 'approved') return ['APPROVED_BY_EIC','ACTIVE','RENEWED'].includes(a.piaApplication?.piaStatus ?? '');
    return true;
  });

  const closeCreateModal = () => {
    setCreateModal(false);
  };

  const handleCreateNew = async (subType: PIASubType) => {
    const agencyName = user?.orgName ?? user?.name ?? '';
    setCreating(true);
    try {
      const app = await piaApi.createDraft(agencyName, subType);
      setApps(prev => [app as any, ...prev]);
      closeCreateModal();
      setEditingId(app.id);
      setView('form');
    } catch {
      // silently fail — user can retry
    } finally {
      setCreating(false);
    }
  };

  // ── Form view ──
  if (view === 'form' && editingId) {
    const backToList = () => { setView('list'); setEditingId(null); loadApps(); };
    return (
      <PIAApplicationForm
        applicationId={editingId}
        onBack={backToList}
        onSaved={() => {}}
      />
    );
  }

  // ── List view ──
  const tabCounts = {
    all: apps.length,
    draft: apps.filter(a => a.status === 'DRAFT').length,
    submitted: apps.filter(a => a.status === 'SUBMITTED').length,
    'under-review': apps.filter(a => ['APPLICATION_FEE_PENDING','APPLICATION_FEE_PAID','RECEIVED_BY_EIA','FORWARDED_TO_EIC','UNDER_DOCUMENT_SCRUTINY','SCRUTINY_COMPLETED'].includes(a.piaApplication?.piaStatus ?? '')).length,
    approved: apps.filter(a => ['APPROVED_BY_EIC','ACTIVE','RENEWED'].includes(a.piaApplication?.piaStatus ?? '')).length,
  } as Record<string, number>;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: 16 }}>
        <div>
          <h2 style={{ color: '#1B2A6B', fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            PIA Recognition
          </h2>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '3px 0 0' }}>
            My Applications &mdash; track and manage your recognition requests
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            padding: '9px 20px', borderRadius: '9px',
            background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', border: 'none',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(27,42,107,0.30)',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(27,42,107,0.40)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(27,42,107,0.30)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>

      {/* ── Stats strip ── */}
      {!loadingList && apps.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total',       value: apps.length,                 color: '#1D4ED8', bg: '#DBEAFE', accent: '#1B2A6B' },
            { label: 'Draft',       value: tabCounts['draft'],          color: '#475569', bg: '#F1F5F9', accent: '#64748B' },
            { label: 'In Progress', value: tabCounts['under-review'],   color: '#D97706', bg: '#FEF3C7', accent: '#D97706' },
            { label: 'Approved',    value: tabCounts['approved'],       color: '#059669', bg: '#D1FAE5', accent: '#059669' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 18px', borderRadius: '12px',
              backgroundColor: '#ffffff', border: '1px solid #E8EDF5',
              boxShadow: '0 2px 8px rgba(27,42,107,0.06)',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${s.bg}, ${s.accent}18)`,
                border: `1.5px solid ${s.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '17px', fontWeight: 800, color: s.accent }}>{s.value}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '2px solid #E8EDF5', backgroundColor: '#F8FAFF', padding: '4px 6px 0', borderRadius: '10px 10px 0 0' }}>
        {APP_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? '#1B2A6B' : '#6B7280',
            borderBottom: tab === t.key ? '2px solid #1B2A6B' : '2px solid transparent',
            marginBottom: '-2px', transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {t.label}
            {!loadingList && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
                background: tab === t.key ? 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' : 'none',
                backgroundColor: tab === t.key ? undefined : '#E8EDF5',
                color: tab === t.key ? '#fff' : '#6B7280',
              }}>{tabCounts[t.key] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loadingList ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 84, borderRadius: '14px', backgroundColor: '#F1F5F9', border: '1px solid #E8EDF5', boxShadow: '0 2px 8px rgba(27,42,107,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: '14px',
          backgroundColor: '#f8fafc', borderRadius: '14px',
          border: '2px dashed #e2e8f0',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '16px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            border: '1px solid #DDD6FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" fill="none" stroke="#7C3AED" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#0f172a', fontSize: '15px', fontWeight: 600, margin: 0 }}>
              {tab === 'all' ? 'No applications yet' : `No ${APP_TABS.find(t => t.key === tab)?.label.toLowerCase()} applications`}
            </p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '5px 0 0', maxWidth: '320px' }}>
              {tab === 'all' ? 'Start your PIA recognition journey. You can save as draft and continue later.' : 'Applications in this category will appear here.'}
            </p>
          </div>
          {tab === 'all' && (
            <button onClick={() => setCreateModal(true)} style={{
              marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 20px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', border: 'none',
              color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(27,42,107,0.30)',
            }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Start New Application
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(app => {
            const subCfg = SUBTYPE_CFG[app.piaApplication?.subType ?? ''] ?? SUBTYPE_CFG['NEW_RECOGNITION'];
            const isDraft = app.status === 'DRAFT';
            const updatedDate = new Date(app.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <div key={app.id} style={{
                display: 'flex', alignItems: 'stretch',
                borderRadius: '14px',
                border: '1px solid #E8EDF5',
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(27,42,107,0.07)',
                overflow: 'hidden',
                transition: 'box-shadow 0.18s, transform 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(27,42,107,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                {/* Left accent bar */}
                <div style={{ width: 5, backgroundColor: subCfg.accent, flexShrink: 0 }} />

                {/* Main content */}
                <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '11px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${subCfg.bg}, ${subCfg.accent}18)`,
                    border: `1.5px solid ${subCfg.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: subCfg.accent,
                    boxShadow: `0 2px 8px ${subCfg.accent}18`,
                  }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1B2A6B' }}>{app.organisation}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                        padding: '2px 8px', borderRadius: '5px',
                        backgroundColor: '#EFF6FF', color: '#1D4ED8',
                        border: '1px solid #BFDBFE', letterSpacing: '0.04em',
                      }}>{app.appNo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <StatusBadge status={app.piaApplication?.piaStatus ?? app.status} />
                      {app.piaApplication?.subType && (
                        <span style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          color: subCfg.color, backgroundColor: subCfg.bg,
                          border: `1px solid ${subCfg.accent}20`,
                        }}>{subCfg.label}</span>
                      )}
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Updated {updatedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '14px 20px', borderLeft: '1px solid #E8EDF5', flexShrink: 0,
                  backgroundColor: '#F8FAFF',
                }}>
                  {isDraft && (
                    <button
                      onClick={() => { setEditingId(app.id); setView('form'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '7px 18px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', border: 'none',
                        color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(27,42,107,0.28)',
                        transition: 'box-shadow 0.15s, transform 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(27,42,107,0.38)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(27,42,107,0.28)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                      Continue
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(app.id); setView('form'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 14px', borderRadius: '8px',
                      border: '1px solid #E2E8F0', backgroundColor: '#ffffff',
                      color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0F4FF'; (e.currentTarget as HTMLElement).style.borderColor = '#BFDBFE'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  {isDraft && (
                    <button
                      onClick={() => setDeleteTarget(app)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '7px 14px', borderRadius: '8px',
                        border: '1px solid #FEE2E2', backgroundColor: '#FFF5F5',
                        color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEE2E2'; (e.currentTarget as HTMLElement).style.borderColor = '#FCA5A5'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FFF5F5'; (e.currentTarget as HTMLElement).style.borderColor = '#FEE2E2'; }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}>
          <div style={{ width: 420, backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" stroke="#DC2626" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Delete Application?</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  This will permanently delete <strong>{deleteTarget.appNo}</strong>. This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #D1D5DB', backgroundColor: '#F3F4F6', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: deleting ? '#FCA5A5' : '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: deleting ? 'default' : 'pointer' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) closeCreateModal(); }}>
          <div style={{
            width: '100%', maxWidth: '480px', margin: '0 16px',
            backgroundColor: '#fff', borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            padding: '28px',
          }}>
            {/* Application Type Selection */}
            {!creating && (
              <>
                <h3 style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>PIA Application</h3>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 20px' }}>
                  Select the type of application to proceed.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {([
                    {
                      value: 'NEW_RECOGNITION' as PIASubType,
                      label: 'New Recognition',
                      desc: 'Fresh application for recognition as PIA',
                      note: 'Includes application fee, port fee, inspection fee, gazette process, annual fee, and PIA code generation.',
                      color: '#7C3AED',
                      bg: '#F5F3FF',
                      border: '#DDD6FE',
                      icon: (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      ),
                    },
                    {
                      value: 'RENEWAL' as PIASubType,
                      label: 'Renewal',
                      desc: 'Application by recognized PIA for continuation before expiry',
                      note: 'Existing data shall be reused; renewal may involve scrutiny and audit.',
                      color: '#059669',
                      bg: '#ECFDF5',
                      border: '#A7F3D0',
                      icon: (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ),
                    },
                    {
                      value: 'MODIFICATION' as PIASubType,
                      label: 'Modification / Extension of Scope',
                      desc: 'Application to add or change approved scope such as port, mineral/ore, branch, laboratory, or location',
                      note: 'Fee and approval workflow similar to new recognition, subject to EIC rules.',
                      color: '#D97706',
                      bg: '#FFFBEB',
                      border: '#FDE68A',
                      icon: (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ),
                    },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleCreateNew(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                        padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                        border: `1px solid ${opt.border}`,
                        backgroundColor: opt.bg,
                        transition: 'box-shadow 0.15s, transform 0.1s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: '9px', flexShrink: 0,
                        backgroundColor: '#fff', color: opt.color,
                        border: `1px solid ${opt.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                      }}>
                        {opt.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{opt.label}</div>
                        <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>{opt.desc}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', lineHeight: '1.4' }}>{opt.note}</div>
                      </div>
                      <svg width="14" height="14" fill="none" stroke={opt.color} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 4, opacity: 0.7 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={closeCreateModal} style={{
                    padding: '8px 18px', borderRadius: '7px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc', color: '#64748b',
                    fontSize: '13px', cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </>
            )}

            {creating && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '12px' }}>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(27,42,107,0.2)', borderTopColor: '#1B2A6B', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '13px', color: '#64748b' }}>Creating application…</span>
              </div>
            )}
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
