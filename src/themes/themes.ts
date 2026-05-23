export interface ThemeVars {
  '--bg-page': string;
  '--bg-nav': string;
  '--bg-utility': string;
  '--bg-footer': string;
  '--bg-footer-bar': string;
  '--bg-card': string;
  '--bg-modal': string;
  '--bg-input': string;
  '--accent': string;
  '--accent-hover': string;
  '--accent-muted': string;
  '--accent-muted-hover': string;
}

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  category: 'deep' | 'light' | 'pastel' | 'white' | 'clean';
  mode: 'dark' | 'light' | 'clean';
  vars: ThemeVars;
  preview: { bg: string; nav: string; accent: string; accent2: string };
}

/* Helper for dark themes */
function t(id: string, name: string, emoji: string, category: Theme['category'],
  bg: string, nav: string, util: string, card: string, modal: string, input: string,
  accent: string, accentH: string, muted: string, mutedH: string, pAccent2: string): Theme {
  return {
    id, name, emoji, category, mode: 'dark',
    vars: { '--bg-page': bg, '--bg-nav': nav, '--bg-utility': util, '--bg-footer': nav, '--bg-footer-bar': util, '--bg-card': card, '--bg-modal': modal, '--bg-input': input, '--accent': accent, '--accent-hover': accentH, '--accent-muted': muted, '--accent-muted-hover': mutedH },
    preview: { bg, nav, accent, accent2: pAccent2 },
  };
}

/* Helper for light/white themes */
function tLight(id: string, name: string, emoji: string,
  bg: string, nav: string, util: string, card: string, modal: string, input: string,
  accent: string, accentH: string, muted: string, mutedH: string, pAccent2: string): Theme {
  return {
    id, name, emoji, category: 'white', mode: 'light',
    vars: { '--bg-page': bg, '--bg-nav': nav, '--bg-utility': util, '--bg-footer': nav, '--bg-footer-bar': util, '--bg-card': card, '--bg-modal': modal, '--bg-input': input, '--accent': accent, '--accent-hover': accentH, '--accent-muted': muted, '--accent-muted-hover': mutedH },
    preview: { bg, nav, accent, accent2: pAccent2 },
  };
}

/* Helper for clean white themes — white/light sidebar, dark text everywhere */
function tClean(id: string, name: string, emoji: string,
  bg: string, nav: string, util: string, card: string, modal: string, input: string,
  accent: string, accentH: string, muted: string, mutedH: string, pAccent2: string): Theme {
  return {
    id, name, emoji, category: 'clean', mode: 'clean',
    vars: { '--bg-page': bg, '--bg-nav': nav, '--bg-utility': util, '--bg-footer': nav, '--bg-footer-bar': util, '--bg-card': card, '--bg-modal': modal, '--bg-input': input, '--accent': accent, '--accent-hover': accentH, '--accent-muted': muted, '--accent-muted-hover': mutedH },
    preview: { bg, nav, accent, accent2: pAccent2 },
  };
}

export const themes: Theme[] = [

  /* ══════════════════════════════════════
     DEEP & RICH  — dark, moody, saturated
  ══════════════════════════════════════ */
  t('royal-blue',    'Royal Blue',    '💙', 'deep', '#0B1428','#1B2A6B','#0F1640','#12102A','#0D1527','#1C1838','#F97316','#EA6C0A','#5C3D18','#6E4C20','#1B2A6B'),
  t('midnight',      'Midnight Dark', '🌙', 'deep', '#08080F','#141428','#0C0C1E','#10101E','#0C0C18','#14142A','#818CF8','#6366F1','#312E81','#3730A3','#2D2B5A'),
  t('forest-green',  'Forest Green',  '🌿', 'deep', '#0A1A0E','#1A3A28','#0D2015','#0F2015','#0C1A10','#152A1E','#22C55E','#16A34A','#14532D','#166534','#1A4030'),
  t('deep-purple',   'Deep Purple',   '💜', 'deep', '#0F0A1A','#2A1A4E','#1A0F30','#1A1030','#100A20','#1E1530','#A78BFA','#8B5CF6','#3B1F7A','#4C1D95','#3B1F7A'),
  t('teal-ocean',    'Teal Ocean',    '🌊', 'deep', '#0A1A1A','#0D3B45','#0A2A32','#0F2A30','#0A1E22','#0F2A30','#06B6D4','#0891B2','#164E63','#155E75','#0D3B45'),
  t('crimson',       'Crimson',       '❤️', 'deep', '#1A0A0A','#3A1A1A','#2A0F0F','#2A1010','#1E0C0C','#2A1515','#EF4444','#DC2626','#7F1D1D','#991B1B','#5A2020'),
  t('chocolate',     'Chocolate',     '🍫', 'deep', '#1A0F0A','#3A2A1A','#2A1F10','#2A1A10','#1E1208','#2A1E14','#F59E0B','#D97706','#78350F','#92400E','#3A2A1A'),
  t('prussian-blue', 'Prussian Blue', '🔷', 'deep', '#0A0F1A','#1A2540','#0F1630','#10182A','#0C1220','#141D30','#38BDF8','#0EA5E9','#0C4A6E','#075985','#1A2540'),
  t('charcoal',      'Charcoal',      '🌑', 'deep', '#111118','#1C1C2C','#161622','#1A1A28','#141420','#1E1E2E','#60A5FA','#3B82F6','#1E3A5F','#1E40AF','#1C1C2C'),
  t('espresso',      'Espresso',      '☕', 'deep', '#1A1008','#2A2010','#221A0C','#221808','#1A1208','#281E10','#FCD34D','#FBBF24','#78480A','#92400E','#2A2010'),
  t('deep-rose',     'Deep Rose',     '🌹', 'deep', '#1A0A0F','#3A1A25','#2A0F1C','#2A1020','#1E0C18','#2A1520','#F472B6','#EC4899','#831843','#9D174D','#3A1A25'),
  t('indigo-night',  'Indigo Night',  '🔮', 'deep', '#07071A','#1A1A4E','#10103A','#141440','#0C0C2A','#181838','#6366F1','#4F46E5','#312E81','#3730A3','#1A1A4E'),
  t('olive-earth',   'Olive Earth',   '🫒', 'deep', '#0F1A0A','#283A1A','#1C2C10','#1A2A0F','#141F0A','#202E14','#84CC16','#65A30D','#365314','#3F6212','#283A1A'),
  t('bordeaux',      'Bordeaux',      '🍷', 'deep', '#1A0808','#3A1818','#2A1010','#2A1010','#1E0C0C','#2A1515','#FB923C','#F97316','#7C2D12','#9A3412','#3A1818'),
  t('petrol-dark',   'Petrol Dark',   '⚓', 'deep', '#0A1A18','#1A3A38','#0D2A28','#0F2A28','#0A1E1C','#142A28','#2DD4BF','#14B8A6','#134E4A','#115E59','#1A3A38'),

  /* ══════════════════════════════════════
     LIGHT & SOFT — vivid colourful navs
  ══════════════════════════════════════ */
  t('lavender-fields', 'Lavender Fields', '💜', 'light', '#16101F','#5B21B6','#2D1060','#1E1530','#160E28','#201640','#E879F9','#D946EF','#701A75','#86198F','#7C3AED'),
  t('mint-fresh',      'Mint Fresh',      '🌿', 'light', '#0C1A10','#166534','#0E3A1E','#121E14','#0E1812','#161E18','#4ADE80','#22C55E','#14532D','#166534','#15803D'),
  t('peach-bloom',     'Peach Bloom',     '🍑', 'light', '#1C140A','#C2410C','#7C2D0A','#241810','#1E1410','#2A1C14','#FB923C','#F97316','#9A3412','#C2410C','#EA580C'),
  t('sky-blue',        'Sky Blue',        '🩵', 'light', '#0A1525','#0E4A8A','#091E50','#0F1E30','#0A1828','#141E30','#38BDF8','#0EA5E9','#0C4A6E','#075985','#0369A1'),
  t('coral-reef',      'Coral Reef',      '🪸', 'light', '#1C0A0A','#991B1B','#6A1010','#241010','#1E0E0E','#2A1818','#FB7185','#F43F5E','#9F1239','#BE123C','#E11D48'),
  t('sandy-shore',     'Sandy Shore',     '🏖️', 'light', '#1E1A0A','#92400E','#5A2A08','#261E0C','#201A0A','#2A2010','#FCD34D','#F59E0B','#78350F','#92400E','#B45309'),
  t('emerald-isle',    'Emerald Isle',    '💚', 'light', '#0A1810','#065F46','#0A3828','#0F2018','#0A1812','#142218','#34D399','#10B981','#065F46','#047857','#059669'),
  t('blush-pink',      'Blush Pink',      '🩷', 'light', '#1E0A16','#9D174D','#6A0A38','#261018','#1E0E16','#2A1820','#F9A8D4','#F472B6','#9D174D','#BE185D','#EC4899'),
  t('arctic-white',    'Arctic White',    '❄️', 'light', '#0A1828','#1D4ED8','#0A2860','#101E30','#0A1828','#162030','#BAE6FD','#7DD3FC','#1E3A8A','#1E40AF','#3B82F6'),
  t('golden-hour',     'Golden Hour',     '🌅', 'light', '#1C1408','#B45309','#7A3A08','#221A0A','#1C1608','#282010','#FCD34D','#FBBF24','#78350F','#92400E','#D97706'),
  t('electric-violet', 'Electric Violet', '⚡', 'light', '#12091E','#4C1D95','#2D0F60','#180E28','#120C22','#1C1430','#A855F7','#9333EA','#4C1D95','#5B21B6','#7C3AED'),
  t('ocean-blue',      'Ocean Blue',      '🌊', 'light', '#091420','#1E40AF','#0C2060','#101A2E','#0A1428','#14203A','#60A5FA','#3B82F6','#1E3A8A','#1E40AF','#2563EB'),
  t('tropical-teal',   'Tropical Teal',   '🌴', 'light', '#081818','#0F766E','#0A4840','#0F2020','#081818','#102020','#2DD4BF','#14B8A6','#134E4A','#115E59','#0D9488'),
  t('hot-coral',       'Hot Coral',       '🔥', 'light', '#1C0A08','#B91C1C','#7A1010','#241210','#1E1010','#2A1818','#FF6B6B','#EF4444','#991B1B','#B91C1C','#DC2626'),
  t('berry-punch',     'Berry Punch',     '🫐', 'light', '#16081E','#7E22CE','#4A1080','#1E1028','#160E20','#201828','#C084FC','#A855F7','#6B21A8','#7E22CE','#9333EA'),
  t('lime-fresh',      'Lime Fresh',      '🍋', 'light', '#0E1A06','#3F6212','#284608','#141E0A','#101808','#181E0E','#A3E635','#84CC16','#365314','#3F6212','#4D7C0F'),
  t('tangerine',       'Tangerine',       '🍊', 'light', '#1C1008','#C2410C','#8A2C08','#221810','#1C1208','#281A10','#FB923C','#F97316','#9A3412','#C2410C','#EA580C'),
  t('sunshine',        'Sunshine',        '☀️', 'light', '#1C1A06','#B45309','#7A3C08','#221E0A','#1C1A08','#28220E','#FDE047','#FACC15','#713F12','#854D0E','#CA8A04'),

  /* ══════════════════════════════════════
     PASTEL & DREAMY — soft, muted tones
  ══════════════════════════════════════ */
  t('cotton-candy',   'Cotton Candy',   '🍬', 'pastel', '#1A1018','#7B2D6E','#501A48','#221428','#1A1020','#241C2A','#F9A8D4','#F472B6','#831843','#9D174D','#C026D3'),
  t('mint-breeze',    'Mint Breeze',    '🌱', 'pastel', '#101A14','#1A5C38','#103820','#162418','#101E14','#182818','#A7F3D0','#6EE7B7','#065F46','#047857','#059669'),
  t('lilac-dream',    'Lilac Dream',    '🪻', 'pastel', '#181018','#6B21A8','#401260','#221428','#1A1020','#26182E','#DDD6FE','#C4B5FD','#4C1D95','#5B21B6','#7C3AED'),
  t('peach-blossom',  'Peach Blossom',  '🍑', 'pastel', '#1A1410','#9A3412','#622010','#231810','#1C1410','#2A2018','#FED7AA','#FDBA74','#7C2D12','#9A3412','#C2410C'),
  t('sky-pastel',     'Sky Pastel',     '☁️', 'pastel', '#101518','#1E4D8C','#103060','#162028','#14202E','#1C2A38','#BAE6FD','#7DD3FC','#0C4A6E','#075985','#1D4ED8'),
  t('lavender-mist',  'Lavender Mist',  '💐', 'pastel', '#14101A','#5B21B6','#341060','#1C1430','#161228','#201A30','#E9D5FF','#D8B4FE','#4C1D95','#581C87','#7C3AED'),
  t('strawberry',     'Strawberry',     '🍓', 'pastel', '#1A1010','#9F1239','#681025','#221418','#1C1018','#281820','#FECDD3','#FDA4AF','#9F1239','#BE123C','#E11D48'),
  t('lemon-grass',    'Lemon Grass',    '🍃', 'pastel', '#141A10','#4D7C0F','#2E5208','#1C2415','#181E12','#202A16','#FEF08A','#FDE047','#713F12','#854D0E','#65A30D'),
  t('aqua-dream',     'Aqua Dream',     '🧊', 'pastel', '#101818','#0F766E','#0A4840','#162A28','#121E1E','#1A2C2C','#99F6E4','#5EEAD4','#134E4A','#115E59','#0D9488'),
  t('blush-rose',     'Blush Rose',     '🌷', 'pastel', '#1A1015','#BE185D','#7A1040','#221420','#1A1018','#261A22','#FBCFE8','#F9A8D4','#831843','#9D174D','#EC4899'),
  t('periwinkle',     'Periwinkle',     '🫧', 'pastel', '#101522','#1E3A8A','#102060','#161E30','#121C28','#1A2438','#C7D2FE','#A5B4FC','#3730A3','#4338CA','#4F46E5'),
  t('peach-sorbet',   'Peach Sorbet',   '🧁', 'pastel', '#1C1510','#B45309','#783808','#241C12','#1E1610','#2A2018','#FDE68A','#FCD34D','#78350F','#92400E','#D97706'),
  t('rose-quartz',    'Rose Quartz',    '💎', 'pastel', '#1C1018','#9D174D','#651030','#241420','#1C1018','#281A22','#FCA5A5','#F87171','#991B1B','#B91C1C','#EF4444'),

  /* ══════════════════════════════════════
     WHITE & LIGHT — clean bright themes
  ══════════════════════════════════════ */
  //          id                 name               emoji   bg        nav       util      card      modal     input     accent    accentH   muted     mutedH    pAccent2
  tLight('clean-white',    'Clean White',    '🤍', '#f8fafc','#1B2A6B','#0F1640','#ffffff','#ffffff','#f1f5f9','#F97316','#EA6C0A','#FEE2CC','#FDD0AA','#1B2A6B'),
  tLight('rose-white',     'Rose White',     '🌸', '#fff5f7','#9D174D','#7A1040','#ffffff','#ffffff','#fce7ef','#F43F5E','#E11D48','#FFE4E6','#FECDD3','#BE185D'),
  tLight('sage-mist',      'Sage Mist',      '🌿', '#f0fdf4','#166534','#0E3A1E','#ffffff','#ffffff','#dcfce7','#16A34A','#15803D','#DCFCE7','#BBF7D0','#15803D'),
  tLight('sky-mist',       'Sky Mist',       '🩵', '#f0f9ff','#0E4A8A','#091E50','#ffffff','#ffffff','#e0f2fe','#0EA5E9','#0284C7','#E0F2FE','#BAE6FD','#0369A1'),
  tLight('warm-ivory',     'Warm Ivory',     '🌻', '#fefce8','#92400E','#5A2A08','#ffffff','#ffffff','#fef9c3','#F59E0B','#D97706','#FEF3C7','#FDE68A','#B45309'),
  tLight('lavender-white', 'Lavender White', '💜', '#faf5ff','#5B21B6','#2D1060','#ffffff','#ffffff','#ede9fe','#7C3AED','#6D28D9','#EDE9FE','#DDD6FE','#4C1D95'),
  tLight('coral-blush',    'Coral Blush',    '🪸', '#fff1f2','#9F1239','#6A0020','#ffffff','#ffffff','#ffe4e6','#F43F5E','#E11D48','#FFE4E6','#FECDD3','#BE123C'),
  tLight('teal-frost',     'Teal Frost',     '🌊', '#f0fdfa','#0F766E','#0A4840','#ffffff','#ffffff','#ccfbf1','#0D9488','#0F766E','#CCFBF1','#99F6E4','#115E59'),
  tLight('cobalt-light',      'Cobalt Light',      '💎', '#eff6ff','#1D4ED8','#0A2860','#ffffff','#ffffff','#dbeafe','#2563EB','#1D4ED8','#DBEAFE','#BFDBFE','#1E40AF'),
  tLight('sunset-light',      'Sunset Light',      '🌅', '#fff7ed','#C2410C','#8A2C08','#ffffff','#ffffff','#ffedd5','#F97316','#EA6C0A','#FFEDD5','#FED7AA','#9A3412'),
  tLight('royal-blue-white',  'Royal Blue White',  '💙', '#f8fafc','#1B2A6B','#0F1640','#ffffff','#ffffff','#EEF2FF','#F97316','#EA6C0A','#FEE2CC','#FDD0AA','#1B2A6B'),
  tLight('midnight-white',    'Midnight White',    '🌙', '#f8fafc','#141428','#0C0C1E','#ffffff','#ffffff','#EEF2FF','#6366F1','#4F46E5','#E0E7FF','#C7D2FE','#141428'),
  tLight('forest-white',      'Forest White',      '🌿', '#f0fdf4','#1A3A28','#0D2015','#ffffff','#ffffff','#DCFCE7','#16A34A','#15803D','#DCFCE7','#BBF7D0','#1A3A28'),
  tLight('deep-purple-white', 'Deep Purple White', '💜', '#faf5ff','#2A1A4E','#1A0F30','#ffffff','#ffffff','#EDE9FE','#7C3AED','#6D28D9','#EDE9FE','#DDD6FE','#2A1A4E'),

  /* ══════════════════════════════════════
     CLEAN WHITE — white sidebar, dark text
  ══════════════════════════════════════ */
  //           id                  name                emoji   bg        nav       util      card      modal     input     accent    accentH   muted     mutedH    pAccent2
  tClean('cw-pure',        'Pure White',       '🤍', '#f8fafc','#ffffff','#f1f5f9','#ffffff','#ffffff','#f1f5f9','#3B82F6','#2563EB','#DBEAFE','#BFDBFE','#60A5FA'),
  tClean('cw-sky',         'Sky White',        '🩵', '#f0f9ff','#ffffff','#e0f2fe','#ffffff','#ffffff','#f0f9ff','#0EA5E9','#0284C7','#E0F2FE','#BAE6FD','#38BDF8'),
  tClean('cw-mint',        'Mint White',       '🌿', '#f0fdf4','#ffffff','#dcfce7','#ffffff','#ffffff','#f0fdf4','#16A34A','#15803D','#DCFCE7','#BBF7D0','#4ADE80'),
  tClean('cw-rose',        'Rose White',       '🌸', '#fff1f2','#ffffff','#ffe4e6','#ffffff','#ffffff','#fff1f2','#F43F5E','#E11D48','#FFE4E6','#FECDD3','#FB7185'),
  tClean('cw-peach',       'Peach White',      '🍑', '#fff7ed','#ffffff','#ffedd5','#ffffff','#ffffff','#fff7ed','#F97316','#EA6C0A','#FFEDD5','#FED7AA','#FB923C'),
  tClean('cw-lavender',    'Lavender White',   '💜', '#faf5ff','#ffffff','#ede9fe','#ffffff','#ffffff','#faf5ff','#8B5CF6','#7C3AED','#EDE9FE','#DDD6FE','#A78BFA'),
  tClean('cw-teal',        'Teal White',       '🌊', '#f0fdfa','#ffffff','#ccfbf1','#ffffff','#ffffff','#f0fdfa','#0D9488','#0F766E','#CCFBF1','#99F6E4','#2DD4BF'),
  tClean('cw-amber',       'Amber White',      '🌟', '#fefce8','#ffffff','#fef9c3','#ffffff','#ffffff','#fefce8','#D97706','#B45309','#FEF9C3','#FEF08A','#FACC15'),
  tClean('cw-indigo',      'Indigo White',     '💎', '#eef2ff','#ffffff','#e0e7ff','#ffffff','#ffffff','#eef2ff','#4F46E5','#4338CA','#E0E7FF','#C7D2FE','#818CF8'),
  tClean('cw-fuchsia',     'Fuchsia White',    '🪻', '#fdf4ff','#ffffff','#fae8ff','#ffffff','#ffffff','#fdf4ff','#D946EF','#C026D3','#FAE8FF','#F5D0FE','#E879F9'),
  tClean('cw-slate',       'Slate White',      '🩶', '#f8fafc','#ffffff','#f1f5f9','#ffffff','#ffffff','#f8fafc','#475569','#334155','#E2E8F0','#CBD5E1','#94A3B8'),
  tClean('cw-crimson',     'Crimson White',    '❤️', '#fff5f5','#ffffff','#fee2e2','#ffffff','#ffffff','#fff5f5','#DC2626','#B91C1C','#FEE2E2','#FECACA','#F87171'),
];

export const DEFAULT_THEME_ID = 'clean-white';

export const DEFAULT_CUSTOM_VARS: ThemeVars = {
  '--bg-page': '#f8fafc', '--bg-nav': '#1B2A6B', '--bg-utility': '#0F1640',
  '--bg-footer': '#1B2A6B', '--bg-footer-bar': '#0F1640', '--bg-card': '#ffffff',
  '--bg-modal': '#ffffff', '--bg-input': '#f1f5f9', '--accent': '#F97316',
  '--accent-hover': '#EA6C0A', '--accent-muted': '#FEE2CC', '--accent-muted-hover': '#FDD0AA',
};

export function applyThemeVars(vars: ThemeVars, mode: 'dark' | 'light' | 'clean' = 'dark') {
  const root = document.documentElement;
  (Object.entries(vars) as [string, string][]).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-theme-mode', mode);
}

export function loadSavedTheme() {
  const id = localStorage.getItem('eic-theme-id') || DEFAULT_THEME_ID;
  if (id === 'custom') {
    try {
      const vars = JSON.parse(localStorage.getItem('eic-custom-vars') || '{}') as ThemeVars;
      if (Object.keys(vars).length) applyThemeVars(vars, 'dark');
    } catch { /* ignore */ }
    return;
  }
  const theme = themes.find(t => t.id === id);
  if (theme) applyThemeVars(theme.vars, theme.mode);
  else {
    /* fallback: apply default via CSS vars already set in index.css */
    document.documentElement.setAttribute('data-theme-mode', 'light');
  }
}
