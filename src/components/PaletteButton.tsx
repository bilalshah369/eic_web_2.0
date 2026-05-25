import { useState, useEffect, useRef } from 'react';

const GRADIENTS = [
  { id: 'royal-blue', name: 'Royal Blue',  from: '#1B2A6B', to: '#2563EB' },
  { id: 'ocean',      name: 'Ocean Green', from: '#065F46', to: '#10B981' },
  { id: 'purple',     name: 'Deep Purple', from: '#4C1D95', to: '#7C3AED' },
  { id: 'crimson',    name: 'Crimson',     from: '#7F1D1D', to: '#DC2626' },
  { id: 'sunset',     name: 'Sunset',      from: '#7C2D12', to: '#F97316' },
  { id: 'teal',       name: 'Teal',        from: '#134E4A', to: '#0D9488' },
  { id: 'indigo',     name: 'Indigo',      from: '#1E1B4B', to: '#6366F1' },
  { id: 'rose',       name: 'Rose',        from: '#831843', to: '#EC4899' },
  { id: 'slate',      name: 'Slate',       from: '#0F172A', to: '#475569' },
  { id: 'forest',     name: 'Forest',      from: '#14532D', to: '#16A34A' },
];

const STORAGE_KEY = 'eic-gradient';

export function loadSavedGradient() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.from && saved.to) {
      document.documentElement.style.setProperty('--grad-from', saved.from);
      document.documentElement.style.setProperty('--grad-to', saved.to);
    }
  } catch { /* ignore */ }
}

function applyGradient(from: string, to: string) {
  document.documentElement.style.setProperty('--grad-from', from);
  document.documentElement.style.setProperty('--grad-to', to);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
}

export default function PaletteButton({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return GRADIENTS.find(g => g.from === saved.from && g.to === saved.to)?.id ?? 'royal-blue';
    } catch { return 'royal-blue'; }
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSavedGradient(); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const active = GRADIENTS.find(g => g.id === activeId) ?? GRADIENTS[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Colour Palette"
        style={{
          width: 26, height: 26, padding: 0,
          borderRadius: variant === 'light' ? '5px' : '4px',
          border: variant === 'light' ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.35)',
          background: `linear-gradient(135deg, ${active.from}, ${active.to})`,
          cursor: 'pointer',
          boxShadow: variant === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
        }}
      />

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          zIndex: 9999, width: 218,
          borderRadius: 12,
          backgroundColor: '#1a2235',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          padding: '14px 14px 12px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, margin: '0 0 10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Accent Colour
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {GRADIENTS.map(g => (
              <button
                key={g.id}
                title={g.name}
                onClick={() => { applyGradient(g.from, g.to); setActiveId(g.id); setOpen(false); }}
                style={{
                  height: 32, borderRadius: 6, padding: 0,
                  border: activeId === g.id ? '2px solid #fff' : '2px solid transparent',
                  background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                  cursor: 'pointer',
                  boxShadow: activeId === g.id ? `0 0 0 2px ${g.to}` : 'none',
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: `linear-gradient(135deg, ${active.from}, ${active.to})` }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              Active: <span style={{ color: '#fff', fontWeight: 600 }}>{active.name}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
