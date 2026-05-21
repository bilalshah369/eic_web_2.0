import { useState, useRef, useEffect } from 'react';
import PaletteButton from './PaletteButton';
import ChangePasswordModal from './ChangePasswordModal';
import { User } from '../types';

const GOI_EMBLEM = 'https://website.eiconline.in/assets/emblem-CXmomrxX.png';
const EIC_EMBLEM = 'https://website.eiconline.in/assets/eic-800x800-CpqoY7n5.jpg';
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
  hideNav?: boolean;
}

// ─── User Menu ────────────────────────────────────────────────────────────────

export function UserMenu({ user, onLogout, variant = 'dark' }: { user: User; onLogout?: () => void; variant?: 'dark' | 'light' }) {
  const [open, setOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
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
  const displayName = user.name || user.email || 'User';
  const roleLabel = (user.role || '').replace(/_/g, ' ');

  const isDark = variant === 'dark';

  /* ── trigger colours ── */
  const btnBg       = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27,42,107,0.06)';
  const btnBgHover  = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(27,42,107,0.11)';
  const btnBorder   = isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(27,42,107,0.15)';
  const nameColor   = isDark ? '#fff' : '#1e293b';
  const roleColor   = isDark ? 'rgba(255,255,255,0.48)' : '#64748b';
  const chevronCol  = isDark ? 'rgba(255,255,255,0.45)' : '#94a3b8';

  return (
    <>
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? btnBgHover : btnBg,
          border: btnBorder,
          borderRadius: 9, cursor: 'pointer',
          padding: '4px 10px 4px 4px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = btnBgHover)}
        onMouseLeave={e => (e.currentTarget.style.background = open ? btnBgHover : btnBg)}
      >
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #1B2A6B 0%, #3B5BDB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: '#fff',
          boxShadow: isDark ? '0 0 0 1.5px rgba(255,255,255,0.15)' : '0 0 0 1.5px rgba(27,42,107,0.2)',
        }}>
          {initial}
        </div>
        {/* Name + role */}
        <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
          <div style={{ color: nameColor, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ color: roleColor, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {roleLabel}
          </div>
        </div>
        {/* Chevron */}
        <svg width="9" height="9" fill="none" stroke={chevronCol} viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: 2, flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          backgroundColor: '#fff',
          borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #E8EAED',
          minWidth: 260, zIndex: 9999, overflow: 'hidden',
          animation: 'userMenuIn 0.15s ease',
        }}>
          <style>{`
            @keyframes userMenuIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)  scale(1); }
            }
          `}</style>

          {/* Profile header */}
          <div style={{
            padding: '18px 20px 16px',
            background: 'linear-gradient(135deg, #1B2A6B 0%, #2D4AAB 100%)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18, color: '#fff',
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <span style={{
                display: 'inline-block', marginTop: 5, padding: '1px 8px',
                borderRadius: 20, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                backgroundColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: '6px 0' }}>
            <button
              onClick={() => { setOpen(false); setChangePwOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1e293b', textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" fill="none" stroke="#4338CA" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Change Password</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Update your login credentials</div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: '#F1F5F9', margin: '0 16px' }} />

          <div style={{ padding: '6px 0 8px' }}>
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF5F5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" fill="none" stroke="#DC2626" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#DC2626' }}>Sign Out</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>End your current session</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>

    {changePwOpen && <ChangePasswordModal onClose={() => setChangePwOpen(false)} />}
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header({ onLoginClick, user, onLogout, pageTitle, sidebarCollapsed, notificationCount = 0, hideNav = false }: HeaderProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  const sidebarW = user ? (sidebarCollapsed ? 60 : 260) : 0;

  return (
    <header className={`sticky top-0 z-30 ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>

      {/* ── Utility bar ── */}
      <div className="py-[7px] px-5" style={{ backgroundColor: 'var(--bg-utility)' }}>
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 30 20" className="h-4 w-auto flex-shrink-0" aria-label="Indian flag" role="img">
              <g aria-hidden="true">
                <rect width="30" height="6.67" fill="#FF9933" />
                <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
                <rect y="13.33" width="30" height="6.67" fill="#138808" />
                <circle cx="15" cy="10" r="2.8" fill="none" stroke="#000088" strokeWidth="0.5" />
                <line x1="15.6" y1="10" x2="17.8" y2="10" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.579555495773441" y1="10.155291427061513" x2="17.704592313609393" y2="10.724693326287058" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.519615242270664" y1="10.3" x2="17.42487113059643" y2="11.4" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.424264068711928" y1="10.424264068711928" x2="16.979898987322333" y2="11.979898987322333" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.3" y1="10.519615242270664" x2="16.4" y2="12.424871130596427" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.155291427061513" y1="10.579555495773441" x2="15.724693326287058" y2="12.70459231360939" stroke="#000088" strokeWidth="0.25" />
                <line x1="15" y1="10.6" x2="15" y2="12.8" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.844708572938488" y1="10.579555495773441" x2="14.275306673712942" y2="12.70459231360939" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.7" y1="10.519615242270664" x2="13.600000000000001" y2="12.42487113059643" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.575735931288072" y1="10.424264068711928" x2="13.020101012677667" y2="11.979898987322333" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.480384757729336" y1="10.3" x2="12.57512886940357" y2="11.4" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.420444504226559" y1="10.155291427061513" x2="12.29540768639061" y2="10.724693326287058" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.4" y1="10" x2="12.2" y2="10" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.420444504226559" y1="9.844708572938487" x2="12.29540768639061" y2="9.275306673712942" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.480384757729336" y1="9.7" x2="12.57512886940357" y2="8.600000000000001" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.57573593128807" y1="9.575735931288072" x2="13.020101012677666" y2="8.020101012677667" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.7" y1="9.480384757729336" x2="13.599999999999998" y2="7.5751288694035726" stroke="#000088" strokeWidth="0.25" />
                <line x1="14.844708572938488" y1="9.420444504226559" x2="14.275306673712942" y2="7.295407686390609" stroke="#000088" strokeWidth="0.25" />
                <line x1="15" y1="9.4" x2="15" y2="7.2" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.155291427061512" y1="9.420444504226559" x2="15.724693326287056" y2="7.295407686390609" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.3" y1="9.480384757729336" x2="16.4" y2="7.5751288694035726" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.424264068711928" y1="9.57573593128807" x2="16.979898987322333" y2="8.020101012677667" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.519615242270664" y1="9.7" x2="17.42487113059643" y2="8.599999999999998" stroke="#000088" strokeWidth="0.25" />
                <line x1="15.579555495773441" y1="9.844708572938487" x2="17.70459231360939" y2="9.27530667371294" stroke="#000088" strokeWidth="0.25" />
                <circle cx="15" cy="10" r="0.7" fill="#000088" />
              </g>
            </svg>
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
      <div className="bg-white border-b border-gray-200">
        <div className="w-full flex items-center justify-between py-3 px-4 md:px-8 gap-4">
          <a href="https://commerce.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src={GOI_EMBLEM} alt="Government of India Emblem" className="h-12 sm:h-16 md:h-20 w-auto flex-shrink-0" />
            <div className="flex flex-col leading-snug">
              <span className="font-bold" style={{ color: '#C24500', fontSize: '1.7rem' }}>Government of India</span>
              <span className="font-medium text-[#222]" style={{ fontSize: '18px' }}>Ministry of Commerce &amp; Industry</span>
              <span className="font-medium text-[#222]" style={{ fontSize: '18px' }}>Department of Commerce</span>
            </div>
          </a>
          <a className="flex items-center gap-2 sm:gap-3 min-w-0" href="/">
            <div className="flex flex-col leading-snug text-right">
              <span className="font-medium text-[#222]" style={{ fontSize: '1.7rem' }}>निर्यात निरीक्षण परिषद</span>
              <span className="font-bold" style={{ fontSize: '1.4rem', color: 'var(--eic-navy, #1B2A6B)' }}>Export Inspection Council (EIC)</span>
            </div>
            <img src={EIC_EMBLEM} alt="Export Inspection Council Emblem" className="w-auto flex-shrink-0" style={{ height: '6rem' }} />
          </a>
        </div>
      </div>

      {/* ── Nav bar ── */}
      {!hideNav && <nav style={{ backgroundColor: 'var(--bg-nav)', display: 'flex', alignItems: 'stretch' }}>

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
      </nav>}
    </header>
  );
}
