import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header, { UserMenu } from '../components/Header';
import ChangePasswordModal from '../components/ChangePasswordModal';
import PIAApplicationForm from './pia/PIAApplicationForm';
import { piaApi, PIAApplicationSummary, PIASubType } from '../services/pia.service';

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

const SECTION_CRUMBS: Record<NavKey, string[]> = {
  home:              ['Dashboard'],
  establishment:     ['Dashboard', 'Establishment Approval'],
  'pia-applications':['Dashboard', 'PIA Recognition', 'My Applications'],
  'pia-fees':        ['Dashboard', 'PIA Recognition', 'Pending Fees'],
  'pia-nc':          ['Dashboard', 'PIA Recognition', 'Non-Conformities'],
  'pia-alerts':      ['Dashboard', 'PIA Recognition', 'Alerts'],
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavKey>('home');
  const [sectionKey, setSectionKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [piaExpanded, setPiaExpanded] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isPiaActive = PIA_SUB_ITEMS.some(s => s.key === activeNav);

  const handleSetNav = (key: NavKey) => {
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
          width: sidebarCollapsed ? '60px' : '260px',
          backgroundColor: 'var(--bg-nav)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          transition: 'width 0.2s ease',
          position: 'relative',
          height: '100%', overflow: 'visible',
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
              zIndex: 50, fontSize: '10px',
            }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{
            padding: sidebarCollapsed ? '14px 0' : '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: '10px',
            overflow: 'hidden', justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.85)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>EIC EServices</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', margin: '2px 0 0' }}>Export Inspection Council</p>
              </div>
            )}
          </div>

          {/* Scroll up */}
          <button
            onClick={() => scroll('up')}
            style={{ width: '100%', padding: '4px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
          </button>

          {/* Navigation */}
          <nav ref={navRef} className="scrollbar-none" style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => handleSetNav(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%',
                  padding: sidebarCollapsed ? '12px 0' : '11px 20px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  background: activeNav === item.key ? 'rgba(255,255,255,0.15)' : 'none',
                  border: 'none',
                  borderLeft: activeNav === item.key ? '3px solid #60A5FA' : '3px solid transparent',
                  cursor: 'pointer',
                  color: activeNav === item.key ? '#fff' : 'rgba(255,255,255,0.78)',
                  fontSize: '13px', fontWeight: activeNav === item.key ? 700 : 500,
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
                onMouseEnter={e => { if (activeNav !== item.key) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                onMouseLeave={e => { if (activeNav !== item.key) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.78)'; } }}
              >
                <span style={{ flexShrink: 0, color: activeNav === item.key ? '#60A5FA' : 'rgba(255,255,255,0.65)' }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}

            {/* PIA Recognition collapsible group */}
            {!sidebarCollapsed && (
              <div style={{ marginTop: 4 }}>
                <button
                  onClick={() => setPiaExpanded(e => !e)}
                  title="PIA Recognition"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '11px 20px',
                    background: isPiaActive ? 'rgba(255,255,255,0.15)' : 'none',
                    border: 'none',
                    borderLeft: isPiaActive ? '3px solid #60A5FA' : '3px solid transparent',
                    cursor: 'pointer',
                    color: isPiaActive ? '#fff' : 'rgba(255,255,255,0.78)',
                    fontSize: '13px', fontWeight: isPiaActive ? 700 : 500,
                    textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isPiaActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                  onMouseLeave={e => { if (!isPiaActive) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.78)'; } }}
                >
                  <span style={{ flexShrink: 0, color: isPiaActive ? '#60A5FA' : 'rgba(255,255,255,0.65)' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </span>
                  <span style={{ flex: 1 }}>PIA Recognition</span>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ flexShrink: 0, transform: piaExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {piaExpanded && (
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: 28 }}>
                    {PIA_SUB_ITEMS.map(sub => (
                      <button
                        key={sub.key}
                        onClick={() => handleSetNav(sub.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '9px 16px',
                          background: activeNav === sub.key ? 'rgba(255,255,255,0.15)' : 'none',
                          border: 'none',
                          borderLeft: activeNav === sub.key ? '2px solid #60A5FA' : '2px solid transparent',
                          cursor: 'pointer',
                          color: activeNav === sub.key ? '#fff' : 'rgba(255,255,255,0.75)',
                          fontSize: '12px', fontWeight: activeNav === sub.key ? 700 : 500,
                          textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { if (activeNav !== sub.key) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = '#fff'; } }}
                        onMouseLeave={e => { if (activeNav !== sub.key) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; } }}
                      >
                        <span style={{ flexShrink: 0, color: activeNav === sub.key ? '#60A5FA' : 'rgba(255,255,255,0.6)' }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    ))}
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
                  width: '100%', padding: '12px 0',
                  background: isPiaActive ? 'rgba(255,255,255,0.12)' : 'none',
                  border: 'none',
                  borderLeft: isPiaActive ? '3px solid #60A5FA' : '3px solid transparent',
                  cursor: 'pointer',
                  color: isPiaActive ? '#fff' : 'rgba(255,255,255,0.55)',
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
            style={{ width: '100%', padding: '4px 0', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {/* Bottom actions */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
            <button
              onClick={() => setShowChangePwd(true)}
              title={sidebarCollapsed ? 'Change Password' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: sidebarCollapsed ? '11px 0' : '11px 20px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.color = '#fff'); (e.currentTarget.style.background = 'rgba(255,255,255,0.10)'); }}
              onMouseLeave={e => { (e.currentTarget.style.color = 'rgba(255,255,255,0.75)'); (e.currentTarget.style.background = 'none'); }}
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
                width: '100%', padding: sidebarCollapsed ? '11px 0' : '11px 20px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#FCA5A5', fontSize: '13px', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.color = '#FEE2E2'); (e.currentTarget.style.background = 'rgba(239,68,68,0.15)'); }}
              onMouseLeave={e => { (e.currentTarget.style.color = '#FCA5A5'); (e.currentTarget.style.background = 'none'); }}
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
            backgroundColor: '#f8fafc',
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
            {activeNav === 'pia-alerts' && <PIAEmptySection title="Alerts" desc="No alerts or notifications at this time." icon="alerts" />}
          </div>
        </main>
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
  const [tab, setTab] = useState('all');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apps, setApps] = useState<PIAApplicationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<'type' | 'name'>('type');
  const [selectedSubType, setSelectedSubType] = useState<PIASubType | null>(null);
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

  const closeCreateModal = () => {
    setCreateModal(false);
    setModalStep('type');
    setSelectedSubType(null);
    setNewAgencyName('');
    setCreateError('');
  };

  const handleCreateNew = async () => {
    if (!newAgencyName.trim()) { setCreateError('Agency name is required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const app = await piaApi.createDraft(newAgencyName.trim(), selectedSubType ?? 'NEW_RECOGNITION');
      setApps(prev => [app as any, ...prev]);
      closeCreateModal();
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
          <h2 style={{ color: '#0f172a', fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            PIA Recognition
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '3px 0 0' }}>
            My Applications &mdash; track and manage your recognition requests
          </p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            padding: '9px 18px', borderRadius: '8px',
            backgroundColor: '#1B2A6B', border: 'none',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(27,42,107,0.3)',
            transition: 'background 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#142057'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(27,42,107,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,42,107,0.3)'; }}
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
            { label: 'Total', value: apps.length, color: '#1B2A6B', bg: '#EEF2FF' },
            { label: 'Draft', value: tabCounts['draft'], color: '#475569', bg: '#F1F5F9' },
            { label: 'In Progress', value: tabCounts['under-review'], color: '#D97706', bg: '#FEF3C7' },
            { label: 'Approved', value: tabCounts['approved'], color: '#059669', bg: '#D1FAE5' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px', borderRadius: '10px',
              backgroundColor: s.bg, border: `1px solid ${s.color}20`,
            }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: s.color, opacity: 0.75, lineHeight: 1.3 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
        {APP_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? '#1B2A6B' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #1B2A6B' : '2px solid transparent',
            marginBottom: '-2px', transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {t.label}
            {!loadingList && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px',
                backgroundColor: tab === t.key ? '#1B2A6B' : '#f1f5f9',
                color: tab === t.key ? '#fff' : '#64748b',
              }}>{tabCounts[t.key] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loadingList ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 84, borderRadius: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
              backgroundColor: '#1B2A6B', border: 'none',
              color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(27,42,107,0.3)',
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
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transition: 'box-shadow 0.15s, transform 0.1s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                {/* Left accent bar */}
                <div style={{ width: 4, backgroundColor: subCfg.accent, flexShrink: 0 }} />

                {/* Main content */}
                <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '10px', flexShrink: 0,
                    backgroundColor: subCfg.bg, border: `1px solid ${subCfg.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: subCfg.accent,
                  }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{app.organisation}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                        padding: '2px 7px', borderRadius: '4px',
                        backgroundColor: '#f1f5f9', color: '#475569',
                        border: '1px solid #e2e8f0', letterSpacing: '0.04em',
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
                  padding: '14px 18px', borderLeft: '1px solid #f1f5f9', flexShrink: 0,
                }}>
                  {isDraft && (
                    <button
                      onClick={() => { setEditingId(app.id); setView('form'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '7px 16px', borderRadius: '7px',
                        backgroundColor: '#1B2A6B', border: 'none',
                        color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(27,42,107,0.25)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#142057'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'}
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
                      padding: '7px 14px', borderRadius: '7px',
                      border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                      color: '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f1f5f9'; (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
              </div>
            );
          })}
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
            {/* Step 1 — Application Type Selection */}
            {modalStep === 'type' && (
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
                      onClick={() => { setSelectedSubType(opt.value); setModalStep('name'); }}
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

            {/* Step 2 — Agency Name */}
            {modalStep === 'name' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <button onClick={() => setModalStep('type')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    color: '#64748b', cursor: 'pointer',
                  }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 style={{ color: '#0f172a', fontSize: '16px', fontWeight: 700, margin: 0 }}>PIA Application</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 16px 38px' }}>
                  {selectedSubType === 'NEW_RECOGNITION' && 'New Recognition — Fresh application for recognition as PIA'}
                  {selectedSubType === 'RENEWAL' && 'Renewal — Continuation of existing recognition before expiry'}
                  {selectedSubType === 'MODIFICATION' && 'Modification / Extension of Scope — Add or change approved scope'}
                </p>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Name of the Applicant / Inspection Agency <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newAgencyName}
                  onChange={e => { setNewAgencyName(e.target.value); setCreateError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateNew(); }}
                  placeholder="Enter the full registered name of the applicant / inspection agency"
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: '7px', border: `1px solid ${createError ? '#EF4444' : '#d1d5db'}`,
                    backgroundColor: '#f9fafb',
                    color: '#0f172a', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {createError && <p style={{ color: '#EF4444', fontSize: '11px', margin: '6px 0 0' }}>{createError}</p>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button onClick={closeCreateModal} style={{
                    padding: '8px 18px', borderRadius: '7px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc', color: '#64748b',
                    fontSize: '13px', cursor: 'pointer',
                  }}>Cancel</button>
                  <button onClick={handleCreateNew} disabled={creating} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 20px', borderRadius: '7px',
                    backgroundColor: '#1B2A6B', border: 'none',
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
              </>
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
