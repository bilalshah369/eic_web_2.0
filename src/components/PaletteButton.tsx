import { useState, useEffect, useRef } from 'react';
import { themes, DEFAULT_CUSTOM_VARS, DEFAULT_THEME_ID, applyThemeVars, loadSavedTheme, ThemeVars, Theme } from '../themes/themes';

const CUSTOM_LABELS: { key: keyof ThemeVars; label: string }[] = [
  { key: '--bg-page',            label: 'Page Background' },
  { key: '--bg-nav',             label: 'Nav Bar' },
  { key: '--bg-utility',         label: 'Utility Bar' },
  { key: '--bg-footer',          label: 'Footer' },
  { key: '--bg-footer-bar',      label: 'Footer Bottom Bar' },
  { key: '--bg-card',            label: 'Cards' },
  { key: '--bg-modal',           label: 'Modal / Drawer' },
  { key: '--bg-input',           label: 'Input Fields' },
  { key: '--accent',             label: 'Accent Color' },
  { key: '--accent-hover',       label: 'Accent Hover' },
  { key: '--accent-muted',       label: 'Accent Button Bg' },
  { key: '--accent-muted-hover', label: 'Accent Button Hover' },
];

type Tab = 'deep' | 'light' | 'pastel' | 'white' | 'clean' | 'custom';

/* ── Mini theme card preview matching screenshot style ── */
function ThemeCard({ theme, active, onClick }: { theme: Theme; active: boolean; onClick: () => void }) {
  const { bg, nav, accent, accent2 } = theme.preview;
  const isClean = theme.category === 'clean';
  const sidebarLine = isClean ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)';
  const contentLine1 = isClean ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.22)';
  const contentLine2 = isClean ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.14)';
  const contentLine3 = isClean ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.10)';
  const labelText = isClean ? 'rgba(31,41,55,0.85)' : 'rgba(255,255,255,0.9)';
  const navBorder = isClean ? '1px solid rgba(0,0,0,0.08)' : 'none';
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? `2px solid ${accent}` : isClean ? '2px solid rgba(0,0,0,0.10)' : '2px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
        background: 'none',
        padding: 0,
        width: '100%',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = isClean ? '0 4px 16px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Preview area */}
      <div style={{ backgroundColor: bg, padding: '8px 6px 6px 6px' }}>
        {/* Top nav strip */}
        <div style={{ height: '6px', borderRadius: '3px 3px 0 0', backgroundColor: nav, marginBottom: '5px', border: navBorder, borderBottom: 'none' }} />
        {/* Content rows */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* Sidebar */}
          <div style={{ width: '14px', display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '1px' }}>
            {[1,1,1,1].map((_, i) => (
              <div key={i} style={{ height: '2px', borderRadius: '1px', backgroundColor: sidebarLine, width: i === 1 ? '10px' : '14px' }} />
            ))}
          </div>
          {/* Lines */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ height: '3px', borderRadius: '2px', backgroundColor: contentLine1, width: '90%' }} />
            <div style={{ height: '3px', borderRadius: '2px', backgroundColor: accent, width: '65%' }} />
            <div style={{ height: '2px', borderRadius: '2px', backgroundColor: contentLine2, width: '80%' }} />
            <div style={{ height: '3px', borderRadius: '2px', backgroundColor: accent2, width: '50%', opacity: 0.7 }} />
            <div style={{ height: '2px', borderRadius: '2px', backgroundColor: contentLine3, width: '70%' }} />
          </div>
        </div>
      </div>
      {/* Label */}
      <div style={{
        backgroundColor: nav,
        padding: '4px 7px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: navBorder,
      }}>
        <span style={{ color: labelText, fontSize: '9px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
          {theme.emoji} {theme.name}
        </span>
        {active && <span style={{ color: accent, fontSize: '10px', fontWeight: 700 }}>✓</span>}
      </div>
    </button>
  );
}

export default function PaletteButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('deep');
  const [activeId, setActiveId] = useState<string>(() => localStorage.getItem('eic-theme-id') || DEFAULT_THEME_ID);
  const [customVars, setCustomVars] = useState<ThemeVars>(() => {
    try { return JSON.parse(localStorage.getItem('eic-custom-vars') || '{}') as ThemeVars; }
    catch { return { ...DEFAULT_CUSTOM_VARS }; }
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSavedTheme(); }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const applyPreset = (id: string) => {
    const theme = themes.find(t => t.id === id);
    if (!theme) return;
    applyThemeVars(theme.vars, theme.mode);
    localStorage.setItem('eic-theme-id', id);
    setActiveId(id);
  };

  const applyCustom = (vars: ThemeVars) => {
    applyThemeVars(vars);
    localStorage.setItem('eic-theme-id', 'custom');
    localStorage.setItem('eic-custom-vars', JSON.stringify(vars));
    setActiveId('custom');
  };

  const updateCustomVar = (key: keyof ThemeVars, value: string) => {
    const updated = { ...customVars, [key]: value };
    setCustomVars(updated);
    applyCustom(updated);
  };

  const filteredThemes = themes.filter(t => t.category === tab);
  const activeName = activeId === 'custom' ? 'Custom'
    : (themes.find(t => t.id === activeId)?.name ?? 'Royal Blue');
  const activeTheme = themes.find(t => t.id === activeId);
  const activeAccent = activeTheme?.preview.accent ?? '#F97316';

  const tabStyle = (t: Tab) => ({
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: tab === t ? 700 : 500,
    color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
    borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
    marginBottom: '-1px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid' as const,
    borderBottomWidth: '2px',
    borderBottomColor: tab === t ? '#fff' : 'transparent',
    transition: 'color 0.15s',
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Utility bar button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'white', fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.06em', padding: '3px 10px',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: '4px', cursor: 'pointer', background: 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {/* Colour squares icon */}
        <span style={{ display: 'flex', gap: '2px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: activeAccent, display: 'block' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: activeTheme?.preview.nav ?? '#1B2A6B', display: 'block' }} />
        </span>
        Palette
        <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — opens below the button, aligned to right */}
      {open && (
        <>
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            zIndex: 9999, width: '680px', maxHeight: '82vh',
            display: 'flex', flexDirection: 'column',
            borderRadius: '14px', overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            backgroundColor: '#151c30',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>

            {/* Header */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>🎨 Colour Palette</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>Choose a theme or create your own</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 22px', gap: '2px' }}>
              <button style={tabStyle('deep')}   onClick={() => setTab('deep')}>Deep &amp; Rich</button>
              <button style={tabStyle('light')}  onClick={() => setTab('light')}>Light &amp; Soft</button>
              <button style={tabStyle('pastel')} onClick={() => setTab('pastel')}>Pastel &amp; Dreamy</button>
              <button style={tabStyle('white')}  onClick={() => setTab('white')}>☀️ White &amp; Light</button>
              <button style={tabStyle('clean')}  onClick={() => setTab('clean')}>✨ Clean White</button>
              <button
                style={{ ...tabStyle('custom'), display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => setTab('custom')}
              >✏️ Custom</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

              {tab !== 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {filteredThemes.map(theme => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      active={activeId === theme.id}
                      onClick={() => applyPreset(theme.id)}
                    />
                  ))}
                </div>
              )}

              {tab === 'custom' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {CUSTOM_LABELS.map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                          <p style={{ color: '#fff', fontSize: '12px', fontWeight: 500, margin: 0 }}>{label}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'monospace', margin: '2px 0 0' }}>{customVars[key] || DEFAULT_CUSTOM_VARS[key]}</p>
                        </div>
                        <input
                          type="color"
                          value={customVars[key] || DEFAULT_CUSTOM_VARS[key]}
                          onChange={e => updateCustomVar(key, e.target.value)}
                          style={{ width: 36, height: 36, borderRadius: '8px', border: 'none', padding: '2px', cursor: 'pointer', backgroundColor: 'transparent' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button
                      onClick={() => { const v = { ...DEFAULT_CUSTOM_VARS }; setCustomVars(v); applyCustom(v); }}
                      style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}
                    >Reset to Default</button>
                    <button
                      onClick={() => setOpen(false)}
                      style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >Apply &amp; Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>{themes.length} built-in · 1 custom</p>
                <button
                  onClick={() => { applyPreset(DEFAULT_THEME_ID); setTab('white'); }}
                  style={{
                    padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                >
                  ↺ Reset to Default
                </button>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: 0, whiteSpace: 'nowrap' }}>
                Active: <span style={{ color: activeAccent, fontWeight: 700 }}>{activeName}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
