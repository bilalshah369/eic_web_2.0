import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

/* ─── types ──────────────────────────────────────────────────────────────── */
interface Application {
  id: string;
  appNo: string;
  type: 'ESTABLISHMENT' | 'PIA';
  status: string;
  organisation: string;
  applicantName: string;
  submittedAt: string | null;
  createdAt: string;
}

interface Stats { total: number; pending: number; deficient: number; recognised: number; }

interface AppsResponse {
  applications: Application[];
  total: number;
  limit: number;
  offset: number;
  stats: Stats;
}

interface PIAPaymentRecord {
  id: string;
  paymentType: string;
  amount: string;
  gstAmount: string | null;
  totalAmount: string;
  currency: string;
  status: string;
  transactionId: string | null;
  receiptNo: string | null;
  paidAt: string | null;
}

interface PIAHistoryRecord {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedByName: string | null;
  remarks: string | null;
  changedAt: string;
}

interface PIADetail {
  id: string;
  piaStatus: string;
  payments: PIAPaymentRecord[];
  statusHistory: PIAHistoryRecord[];
}

/* ─── constants ──────────────────────────────────────────────────────────── */
const TYPE_OPTS = ['all', 'ESTABLISHMENT', 'PIA'];
const STATUS_OPTS = ['all', 'DRAFT', 'SUBMITTED', 'DEFICIENT', 'DEFICIENCY_RESPONDED', 'APPROVED', 'REJECTED', 'COA_ISSUED'];

const TYPE_LABEL: Record<string, string>  = { ESTABLISHMENT: 'Establishment', PIA: 'PIA', all: 'All Types' };
const STATUS_LABEL: Record<string, string> = {
  all: 'All Statuses', DRAFT: 'Draft', SUBMITTED: 'Submitted',
  DEFICIENT: 'Deficient', DEFICIENCY_RESPONDED: 'Deficiency Responded',
  APPROVED: 'Approved', REJECTED: 'Rejected', COA_ISSUED: 'CoA Issued',
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  DRAFT:                 { bg: '#F1F5F9', fg: '#475569',  border: '#CBD5E1' },
  SUBMITTED:             { bg: '#EFF6FF', fg: '#2563EB',  border: '#BFDBFE' },
  DEFICIENT:             { bg: '#FEF2F2', fg: '#DC2626',  border: '#FECACA' },
  DEFICIENCY_RESPONDED:  { bg: '#F5F3FF', fg: '#7C3AED',  border: '#DDD6FE' },
  APPROVED:              { bg: '#F0FDF4', fg: '#16A34A',  border: '#BBF7D0' },
  REJECTED:              { bg: '#FEF2F2', fg: '#DC2626',  border: '#FECACA' },
  COA_ISSUED:            { bg: '#DCFCE7', fg: '#166534',  border: '#86EFAC' },
};

const TYPE_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  ESTABLISHMENT: { bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A' },
  PIA:           { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
};

const PIA_STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  DRAFT:                       { bg: '#F1F5F9', fg: '#475569', border: '#CBD5E1' },
  SUBMITTED:                   { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  APPLICATION_FEE_PENDING:     { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' },
  APPLICATION_FEE_PAID:        { bg: '#D1FAE5', fg: '#065F46', border: '#A7F3D0' },
  RECEIVED_BY_EIA:             { bg: '#E0F2FE', fg: '#0369A1', border: '#BAE6FD' },
  FORWARDED_TO_EIC:            { bg: '#F0FDF4', fg: '#166534', border: '#86EFAC' },
  UNDER_DOCUMENT_SCRUTINY:     { bg: '#FFF7ED', fg: '#9A3412', border: '#FED7AA' },
  DISCREPANCY_RAISED:          { bg: '#FEF2F2', fg: '#DC2626', border: '#FECACA' },
  RESUBMITTED_BY_APPLICANT:    { bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' },
  SCRUTINY_COMPLETED:          { bg: '#ECFDF5', fg: '#059669', border: '#6EE7B7' },
  INSPECTION_OFFICER_NOMINATED:{ bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
};

const PIA_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted',
  APPLICATION_FEE_PENDING: 'Fee Pending', APPLICATION_FEE_PAID: 'Fee Paid',
  RECEIVED_BY_EIA: 'Received at EIA', FORWARDED_TO_EIC: 'Forwarded to EIC',
  UNDER_DOCUMENT_SCRUTINY: 'Under Scrutiny', DISCREPANCY_RAISED: 'Discrepancy Raised',
  RESUBMITTED_BY_APPLICANT: 'Resubmitted', SCRUTINY_COMPLETED: 'Scrutiny Completed',
  INSPECTION_OFFICER_NOMINATED: 'Officer Nominated',
};

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  PENDING:  { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' },
  SUCCESS:  { bg: '#D1FAE5', fg: '#065F46', border: '#A7F3D0' },
  FAILED:   { bg: '#FEF2F2', fg: '#DC2626', border: '#FECACA' },
  REFUNDED: { bg: '#F3F4F6', fg: '#6B7280', border: '#E5E7EB' },
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  APPLICATION_FEE: 'Application Fee', ANNUAL_FEE: 'Annual Fee',
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, accent, gradFrom, gradTo, icon, loading }: {
  label: string; value: number; accent: string;
  gradFrom: string; gradTo: string;
  icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 14, padding: '20px 22px',
      border: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      flex: 1, transition: 'box-shadow 0.15s, transform 0.15s',
      borderLeft: `4px solid ${accent}`,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 13, flexShrink: 0,
        background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${gradFrom}55`,
      }}>
        {icon}
      </div>
      <div>
        {loading
          ? <div style={{ width: 52, height: 30, borderRadius: 6, backgroundColor: '#F1F5F9' }} />
          : <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        }
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── status badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function PIAStatusBadge({ status }: { status: string }) {
  const s = PIA_STATUS_STYLE[status] ?? { bg: '#F1F5F9', fg: '#475569', border: '#CBD5E1' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}`, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
      {PIA_STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ─── detail drawer ──────────────────────────────────────────────────────── */
function DetailDrawer({ app, onClose, onSave, onPiaAction }: {
  app: Application; onClose: () => void;
  onSave: (status: string, remarks: string) => Promise<void>;
  onPiaAction: (piaStatus: string, remarks: string) => Promise<void>;
}) {
  const [status, setStatus]     = useState(app.status);
  const [remarks, setRemarks]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [drawerTab, setDrawerTab] = useState<'details' | 'payment'>('details');
  const [piaActionSaving, setPiaActionSaving] = useState(false);
  const [piaRemarks, setPiaRemarks] = useState('');

  const days = daysSince(app.submittedAt);
  const isOverdue = days !== null && days > 30;
  const statusOptions = STATUS_OPTS.filter(s => s !== 'all' && s !== 'DRAFT');

  const { data: piaDetail, isLoading: piaLoading } = useQuery({
    queryKey: ['pia-detail', app.id],
    queryFn: () => api.get<{ success: boolean; data: PIADetail | null }>(`/portal/applications/${app.id}/pia-detail`)
      .then(r => r.data.data),
    enabled: app.type === 'PIA',
  });

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(status, remarks);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } finally { setSaving(false); }
  }

  async function handlePiaWorkflowAction(newPiaStatus: string) {
    setPiaActionSaving(true);
    try {
      await onPiaAction(newPiaStatus, piaRemarks);
      onClose();
    } finally { setPiaActionSaving(false); }
  }

  const canMarkReceived = piaDetail?.piaStatus === 'APPLICATION_FEE_PAID';
  const canForwardToEIC = piaDetail?.piaStatus === 'RECEIVED_BY_EIA';
  const alreadyForwarded = piaDetail?.piaStatus === 'FORWARDED_TO_EIC';

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 200 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: app.type === 'PIA' ? 500 : 440,
        backgroundColor: '#fff', zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      }}>
        {/* Drawer header */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)', padding: '18px 22px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.60)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Application Details</p>
              <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{app.appNo}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.80)' }}>{app.organisation}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[
              { label: 'Type', value: TYPE_LABEL[app.type] ?? app.type },
              { label: 'Submitted', value: fmtDate(app.submittedAt) },
              { label: 'Age', value: days !== null ? `${days} days` : '—', warn: isOverdue },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: item.warn ? '#FCA5A5' : '#fff', fontWeight: 700 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher for PIA apps */}
        {app.type === 'PIA' && (
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', flexShrink: 0 }}>
            {(['details', 'payment'] as const).map(t => {
              const label = t === 'details' ? 'Details & Status' : 'Payment & Workflow';
              const active = drawerTab === t;
              return (
                <button key={t} onClick={() => setDrawerTab(t)} style={{
                  flex: 1, padding: '12px 16px', fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? '#1B2A6B' : '#6B7280',
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #1B2A6B' : '2px solid transparent',
                  cursor: 'pointer',
                }}>
                  {label}
                  {t === 'payment' && piaDetail && piaDetail.payments.length > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, backgroundColor: active ? '#1B2A6B' : '#E5E7EB', color: active ? '#fff' : '#6B7280', borderRadius: 10, padding: '1px 6px' }}>
                      {piaDetail.payments.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>

          {/* ── Details tab (or non-PIA) ── */}
          {(app.type !== 'PIA' || drawerTab === 'details') && (
            <>
              {/* Current status */}
              <div style={{ marginBottom: 22 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Current Status</p>
                <StatusBadge status={app.status} />
              </div>

              {isOverdue && (
                <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" fill="none" stroke="#D97706" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span style={{ fontSize: 12, color: '#92400E', fontWeight: 500 }}>This application has been pending for {days} days. Timely action is recommended.</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid #E5E7EB', marginBottom: 22 }} />

              {/* Update status form */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Update Status</p>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1.5px solid #D1D5DB', fontSize: 14, color: '#1F2937',
                  backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
                }}>
                  {statusOptions.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>

              <div>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Remarks</p>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={4}
                  placeholder="Add remarks or reason for status change…"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1.5px solid #D1D5DB', fontSize: 13, color: '#1F2937',
                    backgroundColor: '#fff', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box',
                  }} />
              </div>
            </>
          )}

          {/* ── Payment & Workflow tab ── */}
          {app.type === 'PIA' && drawerTab === 'payment' && (
            <>
              {/* PIA Workflow Status */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>PIA Workflow Status</p>
                {piaLoading
                  ? <div style={{ height: 26, width: 160, borderRadius: 20, backgroundColor: '#F1F5F9' }} />
                  : piaDetail
                    ? <PIAStatusBadge status={piaDetail.piaStatus} />
                    : <span style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>No PIA record linked</span>
                }
              </div>

              {/* EIA Workflow Actions */}
              {piaDetail && (
                <div style={{ marginBottom: 22, padding: '16px', borderRadius: 12, backgroundColor: '#F8FAFF', border: '1px solid #E0E8FF' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>EIA Actions</p>

                  {/* Remarks field */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remarks (optional)</p>
                    <textarea value={piaRemarks} onChange={e => setPiaRemarks(e.target.value)} rows={2}
                      placeholder="Add remarks for this action…"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #D1D5DB', fontSize: 13, color: '#1F2937', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                  </div>

                  {canMarkReceived && (
                    <button onClick={() => handlePiaWorkflowAction('RECEIVED_BY_EIA')} disabled={piaActionSaving} style={{
                      width: '100%', padding: '11px 16px', borderRadius: 9, border: 'none',
                      background: piaActionSaving ? '#94A3B8' : 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      cursor: piaActionSaving ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: piaActionSaving ? 'none' : '0 4px 12px rgba(3,105,161,0.35)',
                      transition: 'opacity 0.15s',
                    }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {piaActionSaving ? 'Processing…' : 'Mark Received at EIA'}
                    </button>
                  )}

                  {canForwardToEIC && (
                    <button onClick={() => handlePiaWorkflowAction('FORWARDED_TO_EIC')} disabled={piaActionSaving} style={{
                      width: '100%', padding: '11px 16px', borderRadius: 9, border: 'none',
                      background: piaActionSaving ? '#94A3B8' : 'linear-gradient(135deg, #166534 0%, #16A34A 100%)',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                      cursor: piaActionSaving ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: piaActionSaving ? 'none' : '0 4px 12px rgba(22,101,52,0.35)',
                      transition: 'opacity 0.15s',
                    }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                      {piaActionSaving ? 'Processing…' : 'Forward to EIC'}
                    </button>
                  )}

                  {alreadyForwarded && (
                    <div style={{ padding: '12px 16px', borderRadius: 9, backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="18" height="18" fill="none" stroke="#065F46" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Application Forwarded to EIC</span>
                    </div>
                  )}

                  {!canMarkReceived && !canForwardToEIC && !alreadyForwarded && (
                    <div style={{ padding: '12px 16px', borderRadius: 9, backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: 13, textAlign: 'center' }}>
                      No EIA action available at current workflow stage
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid #E5E7EB', marginBottom: 22 }} />

              {/* Payment Records */}
              <div>
                <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Payment Records</p>
                {piaLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2].map(i => <div key={i} style={{ height: 96, borderRadius: 10, backgroundColor: '#F1F5F9' }} />)}
                  </div>
                ) : !piaDetail || piaDetail.payments.length === 0 ? (
                  <div style={{ padding: '32px 20px', borderRadius: 10, border: '1.5px dashed #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <svg width="28" height="28" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>No payment records found</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {piaDetail.payments.map(p => {
                      const ps = PAYMENT_STATUS_STYLE[p.status] ?? PAYMENT_STATUS_STYLE.PENDING;
                      return (
                        <div key={p.id} style={{
                          padding: '14px 16px', borderRadius: 12, border: '1px solid #E5E7EB',
                          backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}>
                          {/* Payment header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                {PAYMENT_TYPE_LABEL[p.paymentType] ?? p.paymentType}
                              </p>
                              {p.receiptNo && (
                                <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6B7280' }}>
                                  Receipt No: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>{p.receiptNo}</span>
                                </p>
                              )}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: ps.bg, color: ps.fg, border: `1px solid ${ps.border}`, borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
                              {p.status}
                            </span>
                          </div>

                          {/* Amount grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            {[
                              { label: 'Amount', value: `₹ ${Number(p.amount).toLocaleString('en-IN')}` },
                              { label: 'GST', value: p.gstAmount ? `₹ ${Number(p.gstAmount).toLocaleString('en-IN')}` : '—' },
                              { label: 'Total', value: `₹ ${Number(p.totalAmount).toLocaleString('en-IN')}` },
                            ].map(item => (
                              <div key={item.label} style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: '#F8FAFF', border: '1px solid #E8EDF8' }}>
                                <p style={{ margin: 0, fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</p>
                                <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Transaction id + paid date */}
                          {(p.transactionId || p.paidAt) && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                              {p.transactionId && (
                                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>
                                  Txn ID: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>{p.transactionId}</span>
                                </p>
                              )}
                              {p.paidAt && (
                                <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>
                                  Paid: <span style={{ fontWeight: 600, color: '#374151' }}>{fmtDate(p.paidAt)}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer — Details tab */}
        {(app.type !== 'PIA' || drawerTab === 'details') && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #D1D5DB',
              backgroundColor: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || saved} style={{
              flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: saved ? 'linear-gradient(135deg, #16A34A, #15803D)' : 'linear-gradient(135deg, #1B2A6B, #2563EB)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: (saving || saved) ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'opacity 0.15s', opacity: saving ? 0.75 : 1,
            }}>
              {saved
                ? <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Saved</>
                : saving ? 'Saving…' : 'Update Status'
              }
            </button>
          </div>
        )}

        {/* Footer — Payment tab */}
        {app.type === 'PIA' && drawerTab === 'payment' && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', flexShrink: 0 }}>
            <button onClick={onClose} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #D1D5DB',
              backgroundColor: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── page header ─────────────────────────────────────────────────────────── */
function PageHeader({ stats, loading, onRefresh, refreshing }: {
  stats: Stats; loading: boolean; onRefresh: () => void; refreshing: boolean;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #1B2A6B 0%, #2563EB 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(27,42,107,0.30)',
          }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Applications</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Review and manage applications routed to your office</p>
          </div>
        </div>
        <button onClick={onRefresh} disabled={refreshing} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          backgroundColor: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 9,
          padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#374151',
          cursor: refreshing ? 'default' : 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          transition: 'border-color 0.15s, color 0.15s',
        }}
          onMouseEnter={e => { if (!refreshing) { (e.currentTarget as HTMLElement).style.borderColor = '#1B2A6B'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.5s', transform: refreshing ? 'rotate(360deg)' : 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Total Applications" value={stats.total} accent="#2563EB" gradFrom="#3B82F6" gradTo="#1D4ED8" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="Pending Action" value={stats.pending} accent="#F59E0B" gradFrom="#FBBF24" gradTo="#D97706" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Deficient" value={stats.deficient} accent="#EF4444" gradFrom="#F87171" gradTo="#DC2626" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard label="Recognised / CoA" value={stats.recognised} accent="#10B981" gradFrom="#34D399" gradTo="#059669" loading={loading}
          icon={<svg width="22" height="22" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function EIAApplications() {
  const qc = useQueryClient();

  const [tab, setTab]         = useState<'pending' | 'all'>('pending');
  const [search, setSearch]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]       = useState(0);
  const [selected, setSelected] = useState<Application | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const LIMIT = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['portal-applications', tab, search, typeFilter, statusFilter, page],
    queryFn: () => api.get<{ success: boolean; data: AppsResponse }>('/portal/applications', {
      params: {
        tab, limit: LIMIT, offset: page * LIMIT,
        search: search || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
    }).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const apps  = data?.applications ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats ?? { total: 0, pending: 0, deficient: 0, recognised: 0 };
  const pages = Math.ceil(total / LIMIT);

  async function handleRefresh() {
    setRefreshing(true);
    try { await refetch(); } finally { setTimeout(() => setRefreshing(false), 600); }
  }

  async function handleStatusUpdate(status: string, remarks: string) {
    if (!selected) return;
    await api.put(`/portal/applications/${selected.id}/status`, { status, remarks });
    await qc.invalidateQueries({ queryKey: ['portal-applications'] });
  }

  async function handlePiaAction(piaStatus: string, remarks: string) {
    if (!selected) return;
    await api.put(`/portal/applications/${selected.id}/pia-status`, { piaStatus, remarks });
    await qc.invalidateQueries({ queryKey: ['portal-applications'] });
    await qc.invalidateQueries({ queryKey: ['pia-detail', selected.id] });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {selected && (
        <DetailDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onSave={handleStatusUpdate}
          onPiaAction={handlePiaAction}
        />
      )}

      <PageHeader stats={stats} loading={isLoading} onRefresh={handleRefresh} refreshing={refreshing} />

      {/* Table card */}
      <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Tabs + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #E5E7EB', gap: 16, flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {(['pending', 'all'] as const).map(t => {
              const label = t === 'pending' ? 'Pending Action' : 'All Applications';
              const count = t === 'pending' ? stats.pending : stats.total;
              const active = tab === t;
              return (
                <button key={t} onClick={() => { setTab(t); setPage(0); setStatusFilter('all'); }} style={{
                  padding: '14px 4px', marginRight: 24, fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? '#1B2A6B' : '#6B7280', background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #1B2A6B' : '2px solid transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                }}>
                  {label}
                  <span style={{
                    backgroundColor: active ? '#1B2A6B' : '#E5E7EB',
                    color: active ? '#fff' : '#6B7280',
                    borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <svg width="13" height="13" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search app no, org."
                style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 8, border: '1.5px solid #E5E7EB', color: '#374151', outline: 'none', width: 200 }}
              />
            </div>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              style={{ padding: '8px 32px 8px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #E5E7EB', color: '#374151', cursor: 'pointer', outline: 'none', backgroundColor: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>)}
            </select>
            {tab === 'all' && (
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                style={{ padding: '8px 32px 8px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #E5E7EB', color: '#374151', cursor: 'pointer', outline: 'none', backgroundColor: '#fff', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFF', borderBottom: '2px solid #E8EDF8' }}>
                {['APP NO.', 'ORGANISATION', 'APPLICANT', 'TYPE', 'STATUS', 'SUBMITTED', 'WAITING', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    {[140, 160, 110, 80, 100, 90, 60, 20].map((w, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 13, borderRadius: 4, backgroundColor: '#F3F4F6', width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="28" height="28" fill="none" stroke="#94A3B8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#374151' }}>No applications found</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>
                        {tab === 'pending' ? 'No applications are currently pending action.' : 'No applications match your current filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                apps.map((app, i) => {
                  const ts = TYPE_STYLE[app.type] ?? TYPE_STYLE.ESTABLISHMENT;
                  const ss = STATUS_STYLE[app.status] ?? STATUS_STYLE.DRAFT;
                  const days = daysSince(app.submittedAt);
                  const isOverdue = days !== null && days > 30;
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FCFCFF')}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 800, color: '#1B2A6B', fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{app.appNo}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ maxWidth: 200 }}>
                          <div style={{ color: '#111827', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.organisation}</div>
                          <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>{app.applicantName}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 12 }}>{app.applicantName}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: ts.bg, color: ts.fg, border: `1px solid ${ts.border}`, borderRadius: 20, padding: '3px 10px' }}>
                          {TYPE_LABEL[app.type]}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: ss.bg, color: ss.fg, border: `1px solid ${ss.border}`, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                          {STATUS_LABEL[app.status] ?? app.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', whiteSpace: 'nowrap', fontSize: 12 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <svg width="12" height="12" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {fmtDate(app.submittedAt)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {days !== null ? (
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                            backgroundColor: isOverdue ? '#FEF3C7' : '#F1F5F9',
                            color: isOverdue ? '#92400E' : '#374151',
                            border: `1px solid ${isOverdue ? '#FDE68A' : '#E2E8F0'}`,
                          }}>
                            {days}d {isOverdue ? '⚠' : ''}
                          </span>
                        ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button onClick={() => setSelected(app)} style={{
                          background: 'none', border: '1px solid #E5E7EB', cursor: 'pointer',
                          color: '#6B7280', padding: '6px 8px', borderRadius: 7,
                          display: 'flex', alignItems: 'center', transition: 'all 0.12s',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1B2A6B'; (e.currentTarget as HTMLElement).style.color = '#1B2A6B'; (e.currentTarget as HTMLElement).style.backgroundColor = '#EEF2FF'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              Showing <strong>{page * LIMIT + 1}</strong>–<strong>{Math.min((page + 1) * LIMIT, total)}</strong> of <strong>{total}</strong>
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <PageBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</PageBtn>
              {[...Array(Math.min(pages, 7))].map((_, i) => (
                <PageBtn key={i} active={i === page} onClick={() => setPage(i)}>{i + 1}</PageBtn>
              ))}
              <PageBtn disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next →</PageBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 12px', borderRadius: 6, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
      border: active ? '2px solid #1B2A6B' : '1px solid #E5E7EB',
      backgroundColor: active ? '#1B2A6B' : '#fff',
      color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
      fontWeight: active ? 700 : 400,
    }}>
      {children}
    </button>
  );
}
