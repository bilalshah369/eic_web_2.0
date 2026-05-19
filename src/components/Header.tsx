import { useState, useRef, useEffect } from 'react';
import PaletteButton from './PaletteButton';
import { User } from '../types';

const GOI_LOGO = 'https://website.eiconline.in/assets/GOI-ChnNbBjX.png';
const EIC_LOGO = 'https://website.eiconline.in/assets/Frame%20629800%20(1)-D4jM2TG7.png';
const EIC_WEBSITE = 'https://website.eiconline.in/';

const PUBLIC_NAV = [
  { label: 'HOME', href: EIC_WEBSITE },
  { label: 'ABOUT US', dropdown: true },
  { label: 'OFFERINGS', dropdown: true },
  { label: 'PUBLICATIONS', dropdown: true },
  { label: 'VIGILANCE', dropdown: true },
  { label: 'CONNECT', dropdown: true },
];

interface HeaderProps {
  onLoginClick?: () => void;
  user?: User | null;
  onLogout?: () => void;
  pageTitle?: string;
  sidebarCollapsed?: boolean;
  notificationCount?: number;
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout }: { user: User; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
  const roleLabel = (user.role || '').replace(/_/g, ' ');

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px', cursor: 'pointer',
          padding: '5px 10px 5px 5px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '7px',
          backgroundColor: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {user.name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.04em', lineHeight: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {roleLabel}
          </div>
        </div>
        <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.5)" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          backgroundColor: '#fff', borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          border: '1px solid rgba(0,0,0,0.08)',
          minWidth: '220px', zIndex: 9999, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <p style={{ fontWeight: 700, fontSize: '14px', color: '#111', margin: 0 }}>{user.name}</p>
            <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>{user.email}</p>
          </div>
          <div style={{ padding: '6px 0' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#333', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#EF4444', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header({ onLoginClick, user, onLogout, pageTitle, sidebarCollapsed, notificationCount = 0 }: HeaderProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  const sidebarW = user ? (sidebarCollapsed ? 60 : 260) : 0;

  return (
    <header className={`sticky top-0 z-30 ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>

      {/* ── Utility bar ── */}
      <div className="py-[7px] px-5" style={{ backgroundColor: 'var(--bg-utility)' }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex flex-col w-[22px] h-[15px] rounded-sm overflow-hidden flex-shrink-0 border border-white/20">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="w-[6px] h-[6px] rounded-full border border-[#000080]" style={{ borderWidth: '0.5px' }} />
              </div>
              <div className="flex-1 bg-[#138808]" />
            </div>
            <span className="text-white text-[12px] tracking-wide leading-none">
              Ministry of Commerce &amp; Industry | GOI
            </span>
          </div>
          <div className="flex items-center gap-[14px] text-white text-[12px]">
            <button className="flex items-center gap-[6px] hover:text-blue-300 transition leading-none">
              <svg className="w-[14px] h-[14px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="6" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round" />
                <line x1="2" y1="12" x2="6" y2="12" strokeLinecap="round" />
                <line x1="18" y1="12" x2="22" y2="12" strokeLinecap="round" />
              </svg>
              <span>Accessibility Controls</span>
            </button>
            <span className="text-white/30 text-sm leading-none select-none">|</span>
            <div className="flex items-center border border-white/40 rounded-sm overflow-hidden leading-none">
              <button onClick={() => setFontSize('normal')} className={`px-[7px] py-[3px] text-[11px] transition ${fontSize === 'normal' ? 'bg-white text-[#0F1640] font-bold' : 'hover:bg-white/10'}`}>अ</button>
              <span className="text-white/30 text-[11px] px-[2px]">/</span>
              <button onClick={() => setFontSize('large')} className={`px-[7px] py-[3px] text-[12px] transition ${fontSize === 'large' ? 'bg-white text-[#0F1640] font-bold' : 'hover:bg-white/10'}`}>A</button>
            </div>
            <button className="w-[22px] h-[22px] rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 transition flex-shrink-0" title="Language">
              <svg className="w-[13px] h-[13px]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 010 20M12 2a14.5 14.5 0 000 20M2 12h20" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-white/30 text-sm leading-none select-none">|</span>
            <PaletteButton />
          </div>
        </div>
      </div>

      {/* ── Branding bar ── */}
      <div className="bg-white border-b border-gray-200 py-2.5 px-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <a href={EIC_WEBSITE} target="_blank" rel="noreferrer">
            <img src={GOI_LOGO} alt="Government of India" className="h-[72px] w-auto object-contain flex-shrink-0" />
          </a>
          <a href={EIC_WEBSITE} target="_blank" rel="noreferrer">
            <img src={EIC_LOGO} alt="Export Inspection Council" className="h-[72px] w-auto object-contain flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* ── Nav bar ── */}
      <nav style={{ backgroundColor: 'var(--bg-nav)', display: 'flex', alignItems: 'stretch' }}>

        {user ? (
          /* ── DASHBOARD NAV — sidebar spacer + page title + actions ── */
          <>
            {/* Sidebar-width spacer so title aligns with main content */}
            <div style={{
              width: sidebarW,
              flexShrink: 0,
              borderRight: '1px solid rgba(255,255,255,0.10)',
              transition: 'width 0.2s ease',
            }} />

            {/* Page title */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px', minHeight: '46px',
            }}>
              {/* Title text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                  EIC EServices
                </span>
                <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.25)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                  {pageTitle || 'Dashboard'}
                </span>
              </div>

              {/* Right actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                {/* Help */}
                <button style={{
                  width: 32, height: 32, borderRadius: '7px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 700,
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
                  title="Help">
                  ?
                </button>

                {/* Notifications */}
                <button style={{
                  width: 32, height: 32, borderRadius: '7px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                  position: 'relative',
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
                  title="Notifications">
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-5px', right: '-5px',
                      minWidth: '16px', height: '16px', borderRadius: '8px',
                      backgroundColor: '#EF4444',
                      fontSize: '9px', fontWeight: 700, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', lineHeight: 1,
                      border: '1.5px solid var(--bg-nav)',
                    }}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* User menu */}
                <UserMenu user={user} onLogout={onLogout} />
              </div>
            </div>
          </>
        ) : (
          /* ── PUBLIC NAV ── */
          <div className="max-w-screen-xl mx-auto flex items-center justify-between w-full px-5">
            <ul className="flex items-center">
              {PUBLIC_NAV.map(item => (
                <li key={item.label} className="relative group">
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-white text-[12px] font-semibold tracking-widest px-5 py-[14px] hover:bg-white/10 transition border-b-2 border-transparent hover:border-white/40">
                      {item.label}
                    </a>
                  ) : (
                    <button className="flex items-center gap-[5px] text-white text-[12px] font-semibold tracking-widest px-5 py-[14px] hover:bg-white/10 transition border-b-2 border-transparent hover:border-white/40">
                      {item.label}
                      <svg className="w-3 h-3 opacity-70 group-hover:rotate-180 transition-transform duration-200"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 border border-white text-white text-[12px] font-semibold tracking-widest px-5 py-[7px] rounded hover:bg-white hover:text-[#1B2A6B] transition my-[7px]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              LOG IN
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
