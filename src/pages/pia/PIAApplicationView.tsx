import { useEffect, useState } from 'react';
import { piaApi, PIAApplicationFull, PIADocumentItem } from '../../services/pia.service';

const uploadBaseUrl = (import.meta.env.VITE_API_URL as string).replace(/\/api\/v1\/?$/, '') + '/uploads';

interface Props { applicationId: string; onBack: () => void; }

/* ─── Status config ──────────────────────────────────────────────────────── */
const PIA_STATUS: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
  DRAFT:                       { label: 'Draft',             bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', dot: '#94A3B8' },
  SUBMITTED:                   { label: 'Submitted',         bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  APPLICATION_FEE_PENDING:     { label: 'Fee Pending',       bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  APPLICATION_FEE_PAID:        { label: 'Fee Paid',          bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  RECEIVED_BY_EIA:             { label: 'Received at EIA',   bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  FORWARDED_TO_EIC:            { label: 'Forwarded to EIC',  bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
  UNDER_DOCUMENT_SCRUTINY:     { label: 'Under Scrutiny',    bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', dot: '#F97316' },
  DISCREPANCY_RAISED:          { label: 'Discrepancy Raised',bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', dot: '#EF4444' },
  RESUBMITTED_BY_APPLICANT:    { label: 'Resubmitted',       bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', dot: '#8B5CF6' },
  SCRUTINY_COMPLETED:          { label: 'Scrutiny Complete', bg: '#ECFDF5', color: '#059669', border: '#6EE7B7', dot: '#10B981' },
  INSPECTION_OFFICER_NOMINATED:{ label: 'Officer Nominated', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  UNDER_FINAL_REVIEW:          { label: 'Final Review',      bg: '#FFEDD5', color: '#7C2D12', border: '#FED7AA', dot: '#F97316' },
  APPROVED_BY_EIC:             { label: 'Approved by EIC',   bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  REJECTED:                    { label: 'Rejected',          bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', dot: '#EF4444' },
  ACTIVE:                      { label: 'Active',            bg: '#DCFCE7', color: '#166534', border: '#86EFAC', dot: '#22C55E' },
  RENEWED:                     { label: 'Renewed',           bg: '#DCFCE7', color: '#166534', border: '#86EFAC', dot: '#22C55E' },
};

const APP_STATUS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  SUBMITTED: { label: 'Submitted', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  APPROVED:  { label: 'Approved',  bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  REJECTED:  { label: 'Rejected',  bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
};

/* ─── Workflow steps ─────────────────────────────────────────────────────── */
const WORKFLOW_STEPS = [
  { key: 'SUBMITTED',                    label: 'Submitted'     },
  { key: 'APPLICATION_FEE_PAID',         label: 'Fee Paid'      },
  { key: 'RECEIVED_BY_EIA',             label: 'Received (EIA)' },
  { key: 'FORWARDED_TO_EIC',            label: 'Forwarded (EIC)'},
  { key: 'SCRUTINY_COMPLETED',          label: 'Scrutiny Done'  },
  { key: 'INSPECTION_OFFICER_NOMINATED',label: 'Officer Assigned'},
  { key: 'APPROVED_BY_EIC',            label: 'Approved'        },
];

const WORKFLOW_ORDER = [
  'DRAFT','SUBMITTED','APPLICATION_FEE_PENDING','APPLICATION_FEE_PAID',
  'RECEIVED_BY_EIA','FORWARDED_TO_EIC','UNDER_DOCUMENT_SCRUTINY',
  'DISCREPANCY_RAISED','RESUBMITTED_BY_APPLICANT','SCRUTINY_COMPLETED',
  'INSPECTION_OFFICER_NOMINATED','UNDER_FINAL_REVIEW','APPROVED_BY_EIC','ACTIVE',
];

function workflowStep(piaStatus: string): number {
  const idx = WORKFLOW_ORDER.indexOf(piaStatus);
  return idx < 0 ? 0 : idx;
}

/* ─── UI primitives ──────────────────────────────────────────────────────── */
function StatusPill({ status, cfg }: { status: string; cfg: { label: string; bg: string; color: string; border: string; dot?: string } }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
      {cfg.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />}
      {cfg.label || status}
    </span>
  );
}

function InfoField({ label, value, mono }: { label: string; value?: string | number | null | boolean; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, letterSpacing: mono ? '0.04em' : undefined }}>{display}</span>
    </div>
  );
}

function YesNoBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, width: 'fit-content',
        backgroundColor: value ? '#D1FAE5' : 'var(--bg-input)', color: value ? '#065F46' : 'var(--text-muted)', border: `1px solid ${value ? '#A7F3D0' : 'var(--border-subtle)'}` }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: value ? '#10B981' : '#9CA3AF' }} />
        {value ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

function FieldGrid({ cols = 3, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px 28px' }}>{children}</div>;
}

function SectionCard({ title, icon, children, count }: {
  title: string; icon: React.ReactNode; accent?: string; children: React.ReactNode; count?: number;
}) {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', boxShadow: '0 1px 6px rgba(27,42,107,0.06)', overflow: 'hidden', marginBottom: 16 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--card-overlay)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(27,42,107,0.30)' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--grad-from)', letterSpacing: '-0.01em' }}>{title}</span>
          {count !== undefined && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: 'var(--card-overlay)', color: 'var(--grad-from)', border: '1px solid var(--border-subtle)' }}>{count}</span>
          )}
        </div>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function ModernTable({ headers, rows }: { headers: string[]; rows: (string | number | null | undefined)[][] }) {
  if (!rows.length) return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>None recorded</div>
  );
  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-input)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', color: 'var(--text-primary)', verticalAlign: 'top', fontSize: 12 }}>{cell ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function PIAApplicationView({ applicationId, onBack }: Props) {
  const [app, setApp]     = useState<PIAApplicationFull | null>(null);
  const [docs, setDocs]   = useState<PIADocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'documents'>('overview');

  useEffect(() => {
    Promise.all([piaApi.getById(applicationId), piaApi.listDocuments(applicationId)])
      .then(([a, d]) => { setApp(a); setDocs(d); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [applicationId]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 12 }}>
      <div style={{ width: 20, height: 20, border: '2.5px solid var(--card-overlay)', borderTopColor: 'var(--grad-to)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading application…</span>
    </div>
  );

  if (!app?.piaApplication) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Application not found.</div>
  );

  const pia = app.piaApplication;
  const appStatusCfg  = APP_STATUS[app.status]  ?? { label: app.status,      bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
  const piaStatusCfg  = PIA_STATUS[pia.piaStatus] ?? { label: pia.piaStatus, bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', dot: '#9CA3AF' };
  const subTypeLabel  = pia.subType === 'NEW_RECOGNITION' ? 'New Recognition' : pia.subType === 'RENEWAL' ? 'Renewal' : 'Modification / Extension of Scope';
  const currentStep   = workflowStep(pia.piaStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', borderRadius: 14, overflow: 'clip', minHeight: 600 }}>

      {/* ── Sticky top bar ── */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', padding: '11px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '4px 8px', borderRadius: 6, transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-input)'; (e.currentTarget as HTMLElement).style.color = 'var(--grad-from)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--grad-from)' }}>{subTypeLabel}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, backgroundColor: 'var(--bg-input)', color: 'var(--grad-to)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{app.appNo}</span>
          <StatusPill status={app.status} cfg={appStatusCfg} />
        </div>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1.5px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.12s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--grad-from)'; (e.currentTarget as HTMLElement).style.color = 'var(--grad-from)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Hero card ── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(27,42,107,0.18)' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Application No.</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subTypeLabel}</span>
                </div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.05em', lineHeight: 1 }}>{app.appNo}</h1>
                <p style={{ margin: '8px 0 0', fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{app.organisation}</p>
                {pia.agencyNameHindi && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.60)', fontFamily: 'sans-serif' }}>{pia.agencyNameHindi}</p>
                )}
              </div>

              {/* Stats pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <StatusPill status={pia.piaStatus} cfg={piaStatusCfg} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {[
                    { label: 'Submitted', value: fmtDate((app as any).submittedAt) },
                    { label: 'Created', value: fmtDate(app.createdAt) },
                  ].filter(i => i.value !== '—').map(item => (
                    <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(4px)' }}>
                      <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#fff', fontWeight: 700 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow progress bar */}
          <div style={{ background: 'var(--card-overlay)', borderTop: '1px solid var(--border-subtle)', padding: '14px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const stepOrder = workflowStep(step.key);
                const isCompleted = currentStep > stepOrder;
                const isActive    = pia.piaStatus === step.key || (currentStep === stepOrder && pia.piaStatus !== 'DRAFT');
                const isDisabled  = !isCompleted && !isActive;
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                      {/* Step circle */}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isCompleted ? '#10B981' : isActive ? 'var(--grad-from)' : 'var(--bg-input)',
                        border: `2px solid ${isCompleted ? '#059669' : isActive ? 'var(--grad-from)' : 'var(--border-subtle)'}`,
                        boxShadow: isActive ? '0 0 0 3px rgba(27,42,107,0.20)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {isCompleted
                          ? <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          : <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? '#fff' : 'var(--text-muted)' }}>{i + 1}</span>
                        }
                      </div>
                      {/* Step label */}
                      <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 600, color: isDisabled ? 'var(--text-muted)' : isActive ? 'var(--grad-from)' : 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.label}
                      </span>
                    </div>
                    {/* Connector line */}
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div style={{ height: 2, flex: 1, marginBottom: 16, backgroundColor: isCompleted ? '#10B981' : 'var(--border-subtle)', transition: 'background 0.2s' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-subtle)', padding: 4, gap: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {([
            { key: 'overview',   label: 'Overview',   icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
            { key: 'technical',  label: 'Technical Details', icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg> },
            { key: 'documents',  label: `Documents (${docs.length})`, icon: <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
          ] as const).map(t => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'var(--text-muted)', background: active ? 'linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%)' : 'transparent', boxShadow: active ? '0 2px 8px rgba(27,42,107,0.30)' : 'none', transition: 'all 0.15s' }}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ Overview tab ══ */}
        {activeTab === 'overview' && (
          <>
            {/* Application Summary */}
            <SectionCard title="Application Summary"              icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            >
              <FieldGrid cols={3}>
                <InfoField label="Application No." value={app.appNo} mono />
                <InfoField label="Application Type" value={subTypeLabel} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>PIA Workflow Status</span>
                  <StatusPill status={pia.piaStatus} cfg={piaStatusCfg} />
                </div>
                <InfoField label="Agency Name" value={app.organisation} />
                {pia.agencyNameHindi && <InfoField label="Agency Name (Hindi)" value={pia.agencyNameHindi} />}
                <InfoField label="Submitted On" value={fmtDate((app as any).submittedAt)} />
                {pia.recognitionPeriod && <InfoField label="Recognition Period" value={`${pia.recognitionPeriod} year(s)`} />}
                {pia.existingRecognitionNo && <InfoField label="Existing Recognition No." value={pia.existingRecognitionNo} mono />}
                {pia.recognitionValidityDate && <InfoField label="Validity Date" value={fmtDate(pia.recognitionValidityDate)} />}
                <InfoField label="Legal Status" value={pia.legalStatus?.replace(/_/g, ' ')} />
                {pia.legalStatusDetails && <InfoField label="Legal Status Details" value={pia.legalStatusDetails} />}
              </FieldGrid>
            </SectionCard>

            {/* Head Office */}
            <SectionCard title="Head Office Details"              icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            >
              <FieldGrid cols={3}>
                <InfoField label="Address" value={pia.headOfficeAddress} />
                <InfoField label="City" value={pia.headOfficeCity} />
                <InfoField label="District" value={pia.headOfficeDistrict} />
                <InfoField label="State" value={pia.headOfficeState} />
                <InfoField label="Pincode" value={pia.headOfficePincode} />
                <InfoField label="Country" value={pia.headOfficeCountry} />
                <InfoField label="Phone" value={pia.headOfficePhone} />
                <InfoField label="Fax" value={pia.headOfficeFax} />
                <InfoField label="Email" value={pia.headOfficeEmail} />
                <InfoField label="Head of Organisation" value={pia.headOfOrgName} />
                <InfoField label="Designation" value={pia.headOfOrgDesignation} />
                <InfoField label="Contact" value={pia.headOfOrgContact} />
              </FieldGrid>
            </SectionCard>

            {/* Division contacts */}
            {(pia.inspectionDivHeadName || pia.labDivHeadName) && (
              <SectionCard title="Division Contacts"                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {pia.inspectionDivHeadName && (
                    <div style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, color: 'var(--grad-from)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inspection Division</p>
                      <FieldGrid cols={1}>
                        <InfoField label="Head of Division" value={pia.inspectionDivHeadName} />
                        <InfoField label="Designation" value={pia.inspectionDivHeadDesignation} />
                        <InfoField label="Phone" value={pia.inspectionDivPhone} />
                        <InfoField label="Email" value={pia.inspectionDivEmail} />
                      </FieldGrid>
                    </div>
                  )}
                  {pia.labDivHeadName && (
                    <div style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, color: 'var(--grad-from)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Laboratory Division</p>
                      <FieldGrid cols={1}>
                        <InfoField label="Head of Division" value={pia.labDivHeadName} />
                        <InfoField label="Designation" value={pia.labDivHeadDesignation} />
                        <InfoField label="Phone" value={pia.labDivPhone} />
                        <InfoField label="Email" value={pia.labDivEmail} />
                      </FieldGrid>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Declarations */}
            <SectionCard title="Declarations"              icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            >
              <FieldGrid cols={3}>
                <YesNoBadge label="Other Activities" value={pia.hasOtherActivities} />
                <YesNoBadge label="Linked Organization" value={pia.hasLinkedOrganization} />
                <YesNoBadge label="Related Activities" value={pia.hasRelatedActivities} />
                <YesNoBadge label="Disputes with Clients" value={pia.hasDisputesWithClients} />
                <YesNoBadge label="Criminal Proceedings" value={pia.hasCriminalProceedings} />
              </FieldGrid>
              {(pia.hasOtherActivities || pia.hasLinkedOrganization || pia.hasRelatedActivities || pia.hasDisputesWithClients || pia.hasCriminalProceedings) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pia.hasOtherActivities && pia.otherActivitiesDetails && <InfoField label="Other Activities Details" value={pia.otherActivitiesDetails} />}
                  {pia.hasLinkedOrganization && pia.linkedOrgDetails && <InfoField label="Linked Organization Details" value={pia.linkedOrgDetails} />}
                  {pia.hasRelatedActivities && pia.relatedActivitiesDetails && <InfoField label="Related Activities Details" value={pia.relatedActivitiesDetails} />}
                  {pia.hasDisputesWithClients && pia.disputesDetails && <InfoField label="Disputes Details" value={pia.disputesDetails} />}
                  {pia.hasCriminalProceedings && pia.criminalProceedingsDetails && <InfoField label="Criminal Proceedings Details" value={pia.criminalProceedingsDetails} />}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ══ Technical Details tab ══ */}
        {activeTab === 'technical' && (
          <>
            {/* Branches */}
            {pia.branches.length > 0 && (
              <SectionCard title="Branch / Location Details" count={pia.branches.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pia.branches.map((b, i) => (
                    <div key={(b as any).id ?? i} style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: 'var(--grad-from)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--grad-from)' }}>{b.branchName}</span>
                      </div>
                      <FieldGrid cols={3}>
                        <InfoField label="Address" value={b.address} />
                        <InfoField label="City" value={b.city} />
                        <InfoField label="State" value={b.state} />
                        <InfoField label="District" value={b.district} />
                        <InfoField label="Pincode" value={b.pincode} />
                        <InfoField label="Phone" value={b.phone} />
                        <InfoField label="Email" value={b.email} />
                        <InfoField label="Branch Head" value={b.headOfBranchName} />
                        <InfoField label="Designation" value={b.headOfBranchDesignation} />
                      </FieldGrid>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Mineral / Ore Scope */}
            {pia.scopes.length > 0 && (
              <SectionCard title="Mineral / Ore Scope" count={pia.scopes.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              >
                <ModernTable
                  headers={['Mineral / Ore', 'HS Code', 'Specifications']}
                  rows={pia.scopes.map(s => [s.mineralOre.name, s.mineralOre.hsCode, s.specifications])}
                />
              </SectionCard>
            )}

            {/* Ports */}
            {pia.ports.length > 0 && (
              <SectionCard title="Ports / Crushing Sheds" count={pia.ports.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
              >
                <ModernTable
                  headers={['Port Name', 'Code', 'State', 'Type']}
                  rows={pia.ports.map(p => [p.port.name, p.port.code, p.port.state, p.isDefault ? 'Default (No extra fee)' : 'Additional'])}
                />
              </SectionCard>
            )}

            {/* Inspection Capabilities */}
            <SectionCard title="Inspection Capabilities"              icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            >
              <FieldGrid cols={3}>
                <InfoField label="Senior Management Count" value={pia.seniorMgmtCount} />
                <InfoField label="Inspecting Staff Count" value={pia.inspectingStaffCount} />
                <YesNoBadge label="QMS Implemented" value={pia.qmsImplemented} />
                {pia.qmsImplemented && <InfoField label="QMS Type" value={pia.qmsType?.replace(/_/g, ' ')} />}
                <YesNoBadge label="Accredited" value={pia.isAccredited} />
                {pia.isAccredited && <InfoField label="Accreditation Body" value={pia.accreditationBody} />}
                {pia.isAccredited && <InfoField label="Accreditation Scope" value={pia.accreditationScope} />}
                <YesNoBadge label="Domestic Experience" value={pia.hasDomesticExperience} />
                <YesNoBadge label="Export Experience" value={pia.hasExportExperience} />
              </FieldGrid>
            </SectionCard>

            {/* Inspection Manpower */}
            {pia.inspectionManpower.length > 0 && (
              <SectionCard title="Inspection Manpower" count={pia.inspectionManpower.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              >
                <ModernTable
                  headers={['Name', 'Designation', 'Qualification', 'Exp (yrs)', 'Specialization', 'Category']}
                  rows={pia.inspectionManpower.map(m => [m.name, m.designation, m.qualification, m.experienceYears, m.specialization, m.isSeniorMgmt ? 'Senior Mgmt' : 'Inspecting Staff'])}
                />
              </SectionCard>
            )}

            {/* Lab capabilities */}
            {pia.hasLaboratory && (
              <SectionCard title="Laboratory Capabilities"                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
              >
                <FieldGrid cols={3}>
                  <YesNoBadge label="Lab Accredited" value={pia.hasLabAccreditation} />
                  {pia.hasLabAccreditation && <InfoField label="Accreditation Type" value={pia.labAccreditationType} />}
                  {pia.hasLabAccreditation && <InfoField label="Accreditation Scope" value={pia.labAccreditationScope} />}
                  {pia.labConsultancyDetails && <InfoField label="Consultancy Details" value={pia.labConsultancyDetails} />}
                </FieldGrid>
              </SectionCard>
            )}

            {pia.labManpower.length > 0 && (
              <SectionCard title="Lab Manpower" count={pia.labManpower.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              >
                <ModernTable
                  headers={['Name', 'Designation', 'Qualification', 'Exp (yrs)', 'Category']}
                  rows={pia.labManpower.map(m => [m.name, m.designation, m.qualification, m.experienceYears, m.isSeniorMgmt ? 'Senior Mgmt' : 'Staff'])}
                />
              </SectionCard>
            )}

            {pia.labEquipment.length > 0 && (
              <SectionCard title="Lab Equipment" count={pia.labEquipment.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              >
                <ModernTable
                  headers={['Equipment', 'Make', 'Model', 'Serial No.', 'Range / Capacity', 'Calibration Due']}
                  rows={pia.labEquipment.map(e => [e.name, e.make, e.model, e.serialNo, e.rangeCapacity, e.calibrationDueDate])}
                />
              </SectionCard>
            )}

            {pia.labProducts.length > 0 && (
              <SectionCard title="Products Tested in Lab" count={pia.labProducts.length}
                icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              >
                <ModernTable
                  headers={['Product Name', 'Test Parameters', 'Test Methods']}
                  rows={pia.labProducts.map(p => [p.productName, p.testParameters, p.testMethods])}
                />
              </SectionCard>
            )}
          </>
        )}

        {/* ══ Documents tab ══ */}
        {activeTab === 'documents' && (
          <SectionCard title="Uploaded Documents" count={docs.length}
            icon={<svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
          >
            {docs.length === 0 ? (
              <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" stroke="#94A3B8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>No documents uploaded</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Documents will appear here once uploaded via the application form.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {docs.map(doc => {
                  const isPDF = doc.mimeType === 'application/pdf' || doc.fileName?.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', backgroundColor: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border-subtle)', transition: 'box-shadow 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(27,42,107,0.10)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      {/* File icon */}
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isPDF ? '#FEF2F2' : '#EFF6FF', border: `1px solid ${isPDF ? '#FECACA' : '#BFDBFE'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" fill="none" stroke={isPDF ? '#DC2626' : 'var(--grad-to)'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.documentName}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>v{doc.version}</span>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--border-subtle)' }} />
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                          {doc.fileSize && (
                            <>
                              <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'var(--border-subtle)' }} />
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {doc.fileSize < 1024 * 1024 ? `${(doc.fileSize / 1024).toFixed(0)} KB` : `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <a href={`${uploadBaseUrl}/${doc.filePath}`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: '1.5px solid var(--border-subtle)', backgroundColor: 'var(--bg-input)', color: 'var(--grad-to)', fontSize: 11, fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card-overlay)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-input)'; }}
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        View
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

      </div>
    </div>
  );
}
