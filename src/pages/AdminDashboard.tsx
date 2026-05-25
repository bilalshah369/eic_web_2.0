import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { adminApi } from '../services/admin.service';
import Header, { UserMenu } from '../components/Header';
import ChangePasswordModal from '../components/ChangePasswordModal';
import OfficesSection from './admin/OfficesSection';
import OfficersSection from './admin/OfficersSection';
import ProductsSection from './admin/ProductsSection';
import MineralsSection from './admin/MineralsSection';
import PortsSection from './admin/PortsSection';
import FeeConfigSection from './admin/FeeConfigSection';
import DocumentChecklistSection from './admin/DocumentChecklistSection';
import PIAStatusMasterSection from './admin/PIAStatusMasterSection';

// ── Sidebar nav items ──────────────────────────────────────────
type NavKey = 'home' | 'offices' | 'officers' | 'products' | 'audit-logs' | 'workflow-inbox' | 'pia-minerals' | 'pia-ports' | 'pia-fee-config' | 'pia-doc-checklist' | 'pia-status-master';

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'home',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'offices',
    label: 'Office Management',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'officers',
    label: 'Officer Management',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'products',
    label: 'Product Management',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'audit-logs',
    label: 'Audit Logs',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'workflow-inbox',
    label: 'Workflow Inbox',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
];

// PIA sub-menu items (rendered separately as a collapsible group)
const PIA_SUB_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'pia-minerals',
    label: 'Minerals / Ores',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'pia-ports',
    label: 'Ports',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    key: 'pia-fee-config',
    label: 'Fee Config',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'pia-doc-checklist',
    label: 'Doc Checklist',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'pia-status-master',
    label: 'Status Master',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// ── Helpers ────────────────────────────────────────────────────
function SidebarBtn({
  item, active, collapsed, onClick,
}: {
  item: typeof NAV_ITEMS[number];
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%',
        padding: collapsed ? '11px 0' : '10px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: active ? 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)' : 'none',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        color: active ? '#ffffff' : 'rgba(27,42,107,0.70)',
        fontSize: '13px', fontWeight: active ? 600 : 500,
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        whiteSpace: 'nowrap', overflow: 'hidden',
        boxShadow: active ? '0 4px 14px rgba(27,42,107,0.30)' : 'none',
        marginBottom: '2px',
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'rgba(27,42,107,0.70)'; } }}
    >
      <span style={{ flexShrink: 0, color: active ? '#ffffff' : 'rgba(27,42,107,0.55)' }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({
  label, value, accentColor, accentBg, icon, loading,
}: {
  label: string;
  value: string | number;
  accentColor: string;
  accentBg: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E8EDF5',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(27,42,107,0.07)',
        transition: 'box-shadow 0.18s, transform 0.18s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(27,42,107,0.13)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(27,42,107,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }} />
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '12px', flexShrink: 0,
          background: `linear-gradient(135deg, ${accentBg}, ${accentColor}18)`,
          border: `1.5px solid ${accentColor}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div>
          {loading ? (
            <div style={{ width: 60, height: 26, borderRadius: 6, backgroundColor: '#F1F5F9' }} />
          ) : (
            <p style={{ color: '#111827', fontSize: '26px', fontWeight: 700, margin: 0, lineHeight: 1 }}>
              {value}
            </p>
          )}
          <p style={{ color: '#6B7280', fontSize: '12px', margin: '4px 0 0', fontWeight: 500 }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Action badge ───────────────────────────────────────────────
const ACTION_COLORS: Record<string, { bg: string; fg: string }> = {
  LOGIN:           { bg: '#DBEAFE', fg: '#1D4ED8' },
  LOGOUT:          { bg: '#FEE2E2', fg: '#DC2626' },
  TOKEN_REFRESHED: { bg: '#EDE9FE', fg: '#6D28D9' },
  REGISTER:        { bg: '#D1FAE5', fg: '#065F46' },
  PASSWORD_CHANGE: { bg: '#FEF3C7', fg: '#92400E' },
  UPDATE:          { bg: '#E0F2FE', fg: '#0369A1' },
  DELETE:          { bg: '#FEE2E2', fg: '#DC2626' },
  CREATE:          { bg: '#D1FAE5', fg: '#065F46' },
};

function ActionBadge({ action }: { action: string }) {
  const c = ACTION_COLORS[action] ?? { bg: '#F1F5F9', fg: '#475569' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
      backgroundColor: c.bg, color: c.fg,
    }}>
      {action}
    </span>
  );
}

// ── Skeleton row ───────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '10px 16px' }}>
          <div style={{ height: 13, borderRadius: 4, backgroundColor: 'var(--card-overlay)', width: i === 0 ? '70%' : i === cols - 1 ? '50%' : '85%' }} />
          {i === 0 && <div style={{ height: 10, borderRadius: 4, backgroundColor: 'var(--card-overlay)', width: '50%', marginTop: 5 }} />}
        </td>
      ))}
    </tr>
  );
}

// ── User cell with avatar ───────────────────────────────────────
function UserCell({ name, email }: { name?: string; email?: string }) {
  const display = name || email?.split('@')[0] || '?';
  const initials = display.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const palette = ['#1B2A6B', '#0369A1', '#065F46', '#6D28D9', '#92400E', '#0F766E'];
  const color = palette[(display.charCodeAt(0) ?? 0) % palette.length];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{initials}</span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{name || '—'}</div>
        {email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{email}</div>}
      </div>
    </div>
  );
}

// ── Relative time cell ──────────────────────────────────────────
function RelativeTime({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const rel = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : hours < 24 ? `${hours}h ago` : `${days}d ago`;
  return (
    <div title={date.toLocaleString('en-IN')}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{rel}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
        {date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

// ── IP badge ────────────────────────────────────────────────────
function IpBadge({ ip }: { ip?: string }) {
  if (!ip) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return (
    <span style={{ fontSize: 11, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 5, backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
      {ip}
    </span>
  );
}

// ── Table pagination ────────────────────────────────────────────
function TablePagination({ page, total, pageSize, onPage, onPageSize }: {
  page: number; total: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | '...')[] = [0];
    if (page > 3) pages.push('...');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 4) pages.push('...');
    pages.push(totalPages - 1);
    return pages;
  };

  const nb: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)',
    fontWeight: 500, flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rows per page:</span>
          <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(0); }}
            style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
            {[5, 10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {total === 0 ? 'No records' : `${from}–${to} of ${total} records`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button disabled={page === 0} onClick={() => onPage(0)} title="First" style={{ ...nb, opacity: page === 0 ? 0.35 : 1, cursor: page === 0 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
        <button disabled={page === 0} onClick={() => onPage(page - 1)} title="Previous" style={{ ...nb, opacity: page === 0 ? 0.35 : 1, cursor: page === 0 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        {getPages().map((pg, idx) =>
          pg === '...'
            ? <span key={`e${idx}`} style={{ width: 28, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
            : <button key={pg} onClick={() => onPage(pg as number)} style={{ ...nb, backgroundColor: pg === page ? 'var(--bg-nav)' : 'var(--bg-card)', color: pg === page ? '#fff' : 'var(--text-primary)', borderColor: pg === page ? 'var(--bg-nav)' : 'var(--border-subtle)', fontWeight: pg === page ? 700 : 500, cursor: 'pointer' }}>{(pg as number) + 1}</button>
        )}
        <button disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} title="Next" style={{ ...nb, opacity: page >= totalPages - 1 ? 0.35 : 1, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
        <button disabled={page >= totalPages - 1} onClick={() => onPage(totalPages - 1)} title="Last" style={{ ...nb, opacity: page >= totalPages - 1 ? 0.35 : 1, cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD HOME — real API
// ══════════════════════════════════════════════════════════════
function AdminHome(_props: { user: { name?: string; email?: string; role: string } }) {
  const [auditPage, setAuditPage] = useState(0);
  const [auditPageSize, setAuditPageSize] = useState(5);
  const [auditSearch, setAuditSearch] = useState('');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    select: r => r.data?.data,
    refetchInterval: 30_000,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit-logs-home', auditPage, auditPageSize, auditSearch],
    queryFn: () => adminApi.getAuditLogs({ limit: auditPageSize, offset: auditPage * auditPageSize, search: auditSearch || undefined }),
    select: r => r.data?.data,
    refetchInterval: 15_000,
  });

  const stats = statsData;
  const logs = Array.isArray(auditData?.logs) ? auditData.logs : [];
  const auditTotal = auditData?.total ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          loading={statsLoading}
          accentColor="#1D4ED8"
          accentBg="#DBEAFE"
          icon={
            <svg width="24" height="24" fill="none" stroke="#1D4ED8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Admin Users"
          value={stats?.totalAdmins ?? 0}
          loading={statsLoading}
          accentColor="#059669"
          accentBg="#D1FAE5"
          icon={
            <svg width="24" height="24" fill="none" stroke="#059669" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          label="Audit Events"
          value={stats?.totalAuditLogs ?? 0}
          loading={statsLoading}
          accentColor="#D97706"
          accentBg="#FEF3C7"
          icon={
            <svg width="24" height="24" fill="none" stroke="#D97706" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <StatCard
          label="Applications"
          value={stats?.totalApplications ?? 0}
          loading={statsLoading}
          accentColor="#7C3AED"
          accentBg="#EDE9FE"
          icon={
            <svg width="24" height="24" fill="none" stroke="#7C3AED" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
      </div>

      {/* Recent Activity */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8EDF5', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>

        {/* Card header — dark gradient */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" fill="none" stroke="rgba(255,255,255,0.9)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Recent Activity</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 20, padding: '1px 8px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#4ADE80' }}>LIVE</span>
                </span>
                {auditTotal > 0 && (
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 12 }}>
                    {auditTotal} events
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={auditSearch}
              onChange={e => { setAuditSearch(e.target.value); setAuditPage(0); }}
              placeholder="Search user / action…"
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', width: 220 }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '2px solid #E8EDF8' }}>
                {[
                  { label: 'User', w: '22%' },
                  { label: 'Action', w: '10%' },
                  { label: 'Description', w: '36%' },
                  { label: 'IP Address', w: '14%' },
                  { label: 'Time', w: '18%' },
                ].map(col => (
                  <th key={col.label} style={{ padding: '9px 16px', textAlign: 'left', width: col.w }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                : logs.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <svg width="36" height="36" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity found</span>
                        </div>
                      </td>
                    </tr>
                  )
                  : logs.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--card-overlay)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <UserCell name={row.userName ?? undefined} email={row.userEmail ?? undefined} />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <ActionBadge action={row.action} />
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 0 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }} title={row.description || ''}>
                          {row.description || <span style={{ color: '#D1D5DB' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <IpBadge ip={row.ipAddress ?? undefined} />
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <RelativeTime dateStr={row.createdAt} />
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        <TablePagination page={auditPage} total={auditTotal} pageSize={auditPageSize} onPage={setAuditPage} onPageSize={s => { setAuditPageSize(s); setAuditPage(0); }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOGS SECTION — real API (full page)
// ══════════════════════════════════════════════════════════════
const AUDIT_ACTIONS = ['', 'LOGIN', 'LOGOUT', 'REGISTER', 'TOKEN_REFRESHED', 'PASSWORD_CHANGE', 'UPDATE', 'DELETE', 'CREATE'];

function AuditLogsSection() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs-full', page, pageSize, search, action],
    queryFn: () => adminApi.getAuditLogs({
      limit: pageSize,
      offset: page * pageSize,
      search: search || undefined,
      action: action || undefined,
    }),
    select: r => r.data?.data,
    refetchInterval: 15_000,
  });

  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const total = data?.total ?? 0;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #E8EDF5', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(27,42,107,0.07)' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" fill="none" stroke="rgba(255,255,255,0.9)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Audit Logs</span>
              {total > 0 && (
                <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 12 }}>
                  {isLoading ? '…' : `${total} records`}
                </span>
              )}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Complete system event log</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(0); }}
            style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', cursor: 'pointer' }}>
            {AUDIT_ACTIONS.map(a => <option key={a} value={a} style={{ backgroundColor: '#1B2A6B' }}>{a || 'All actions'}</option>)}
          </select>
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search user / action…"
              style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', width: 210 }} />
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '2px solid #E8EDF8' }}>
              {[
                { label: 'User', w: '22%' },
                { label: 'Action', w: '10%' },
                { label: 'Description', w: '36%' },
                { label: 'IP Address', w: '14%' },
                { label: 'Time', w: '18%' },
              ].map(col => (
                <th key={col.label} style={{ padding: '9px 16px', textAlign: 'left', width: col.w }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : logs.length === 0
                ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <svg width="40" height="40" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No audit logs found</span>
                      </div>
                    </td>
                  </tr>
                )
                : logs.map((row, i) => (
                  <tr key={row.id}
                    style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <UserCell name={row.userName ?? undefined} email={row.userEmail ?? undefined} />
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <ActionBadge action={row.action} />
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340 }} title={row.description || ''}>
                        {row.description || <span style={{ color: '#D1D5DB' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <IpBadge ip={row.ipAddress ?? undefined} />
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <RelativeTime dateStr={row.createdAt} />
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <TablePagination page={page} total={total} pageSize={pageSize} onPage={setPage} onPageSize={s => { setPageSize(s); setPage(0); }} />
    </div>
  );
}

// ── Placeholder section ────────────────────────────────────────
function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '18px 22px',
      minHeight: '300px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, margin: 0 }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '3px 0 0' }}>{desc}</p>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '10px',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          backgroundColor: 'var(--card-overlay)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Module under construction</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0 }}>This section will be available in a future release.</p>
      </div>
    </div>
  );
}

const SECTION_META: Record<NavKey, { title: string; desc: string }> = {
  home:             { title: 'Dashboard',          desc: '' },
  offices:          { title: 'Offices',            desc: 'Manage EIA regional offices and their directors' },
  officers:         { title: 'Officers',           desc: 'Manage inspection officers and their office/product assignments' },
  products:         { title: 'Product Management', desc: 'Manage certificate products available for officer assignment' },
  'audit-logs':     { title: 'Audit Logs',         desc: 'View immutable system-wide activity and access logs' },
  'workflow-inbox':    { title: 'Workflow Inbox',          desc: 'Pending approvals and workflow items requiring action' },
  'pia-minerals':      { title: 'Mineral / Ore Master',   desc: 'Manage minerals and ores available for PIA recognition scope' },
  'pia-ports':         { title: 'Port & Location Master', desc: 'Manage ports and crushing sheds available for PIA scope' },
  'pia-fee-config':    { title: 'PIA Fee Configuration',  desc: 'Configure application, inspection, and annual fee amounts' },
  'pia-doc-checklist':  { title: 'Document Checklist',      desc: 'Configure required documents per PIA application type' },
  'pia-status-master':  { title: 'Application Status Master', desc: 'SRS §13 — all 36 system-defined PIA application statuses' },
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();

  const ALL_NAV_KEYS: NavKey[] = [
    ...NAV_ITEMS.map(i => i.key),
    ...(PIA_SUB_ITEMS as { key: NavKey }[]).map(i => i.key),
  ];
  const resolvedNav = (ALL_NAV_KEYS.includes(section as NavKey) ? section : 'home') as NavKey;

  const [activeNav, setActiveNav] = useState<NavKey>(resolvedNav);
  const [sectionKey, setSectionKey] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [piaExpanded, setPiaExpanded] = useState(() =>
    (PIA_SUB_ITEMS as { key: NavKey }[]).some(i => i.key === resolvedNav));
  const navRef = useRef<HTMLElement>(null);
  const scroll = (dir: 'up' | 'down') => navRef.current?.scrollBy({ top: dir === 'down' ? 80 : -80, behavior: 'smooth' });

  // Sync state when the URL param changes (browser back/forward)
  useEffect(() => {
    const key = (ALL_NAV_KEYS.includes(section as NavKey) ? section : 'home') as NavKey;
    setActiveNav(key);
    setSectionKey(k => k + 1);
    if ((PIA_SUB_ITEMS as { key: NavKey }[]).some(i => i.key === key)) setPiaExpanded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const isPiaActive = (PIA_SUB_ITEMS as { key: NavKey }[]).some(i => i.key === activeNav);

  const handleSetActiveNav = (key: NavKey) => {
    navigate(`/admin/${key}`);
    if (key === activeNav) { setSectionKey(k => k + 1); return; }
    setActiveNav(key);
    setSectionKey(k => k + 1);
    if ((PIA_SUB_ITEMS as { key: NavKey }[]).some(i => i.key === key)) {
      setPiaExpanded(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const meta = SECTION_META[activeNav];

  function renderSection() {
    if (activeNav === 'home') return <AdminHome user={{ name: user?.name, email: user?.email, role: user?.role ?? 'ADMIN' }} />;
    if (activeNav === 'offices') return <OfficesSection />;
    if (activeNav === 'officers') return <OfficersSection />;
    if (activeNav === 'products') return <ProductsSection />;
    if (activeNav === 'audit-logs') return <AuditLogsSection />;
    if (activeNav === 'pia-minerals') return <MineralsSection />;
    if (activeNav === 'pia-ports') return <PortsSection />;
    if (activeNav === 'pia-fee-config') return <FeeConfigSection />;
    if (activeNav === 'pia-doc-checklist') return <DocumentChecklistSection />;
    if (activeNav === 'pia-status-master') return <PIAStatusMasterSection />;
    return <ComingSoon title={meta.title} desc={meta.desc} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', overflow: 'hidden' }}>
      <Header user={user} onLogout={handleLogout} hideNav />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside style={{
          width: collapsed ? '64px' : '260px',
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
            onClick={() => setCollapsed(c => !c)}
            style={{
              position: 'absolute', top: '20px', right: '-14px',
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1B2A6B, #2563EB)',
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
            {collapsed ? '›' : '‹'}
          </button>

          {/* Brand */}
          <div style={{
            padding: collapsed ? '13px 0' : '11px 14px 12px',
            borderBottom: '1px solid var(--nav-border)',
            display: 'flex', alignItems: 'center', gap: '10px',
            overflow: 'hidden', justifyContent: collapsed ? 'center' : 'flex-start',
            flexShrink: 0,
          }}>
            {/* Monogram badge */}
            <div style={{
              width: 36, height: 36, borderRadius: '9px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1B2A6B 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            }}>
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

          {/* Scroll up button */}
          <button
            onClick={() => scroll('up')}
            style={{ width: '100%', padding: '3px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(27,42,107,0.07)', cursor: 'pointer', color: 'rgba(27,42,107,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1B2A6B')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(27,42,107,0.35)')}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
          </button>

          {/* Nav items */}
          <nav ref={navRef} className="scrollbar-none" style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
            {NAV_ITEMS.map(item => (
              <SidebarBtn
                key={item.key}
                item={item}
                active={activeNav === item.key}
                collapsed={collapsed}
                onClick={() => handleSetActiveNav(item.key)}
              />
            ))}

            {/* ── PIA group ───────────────────────────────── */}
            {!collapsed && (
              <div style={{ marginTop: 4 }}>
                {/* PIA group header */}
                <button
                  onClick={() => setPiaExpanded(x => !x)}
                  title="PIA Recognition"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 14px',
                    background: isPiaActive ? 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)' : 'none',
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
                  {/* PIA icon */}
                  <span style={{ flexShrink: 0, color: isPiaActive ? '#ffffff' : 'rgba(27,42,107,0.55)' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </span>
                  <span style={{ flex: 1 }}>PIA Recognition</span>
                  <svg
                    width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ flexShrink: 0, transform: piaExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Sub-items */}
                {piaExpanded && (
                  <div style={{ paddingLeft: '12px', marginTop: '2px' }}>
                    <div style={{ borderLeft: '2px solid rgba(27,42,107,0.15)', paddingLeft: '8px' }}>
                      {PIA_SUB_ITEMS.map(item => {
                        const isSubActive = activeNav === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleSetActiveNav(item.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
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
                            <span style={{ flexShrink: 0, color: isSubActive ? '#1B2A6B' : 'rgba(27,42,107,0.45)' }}>{item.icon}</span>
                            <span>{item.label}</span>
                            {isSubActive && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PIA icon-only when sidebar collapsed */}
            {collapsed && (
              <button
                title="PIA Recognition"
                onClick={() => { setPiaExpanded(true); setCollapsed(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '11px 0',
                  background: isPiaActive ? 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)' : 'none',
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

          {/* Scroll down button */}
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
              title={collapsed ? 'Change Password' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              {!collapsed && 'Change Password'}
            </button>
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
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
              {!collapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Breadcrumb bar */}
          <div style={{
            padding: '6px 24px',
            borderBottom: '1px solid #d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {/* Crumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handleSetActiveNav('home')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: '#6b7280', fontSize: '12px',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
              >
                Dashboard
              </button>
              {activeNav !== 'home' && (
                <>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>›</span>
                  <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
                    {meta.title}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button style={{
                width: 26, height: 26, borderRadius: '5px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
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
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6b7280',
                position: 'relative',
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
            {renderSection()}
          </div>
        </main>
      </div>

      {/* ── Sticky footer bar ─────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '7px 24px', background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>© 2026 Export Inspection Council. All Rights Reserved.</span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Last Updated : 28 Jan 2026 &nbsp;|&nbsp; Total Visitors : <span style={{ color: '#ffffff', fontWeight: 600 }}>2,195,193</span></span>
      </div>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </div>
  );
}
