import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, PIAFeeConfig } from '../../services/admin.service';

const FEE_TYPES: { value: PIAFeeConfig['feeType']; defaultLabel: string; hint: string }[] = [
  { value: 'APPLICATION_FEE',     defaultLabel: 'Application Processing Fee',  hint: 'Base fee charged at application submission (includes 1 default port — BR-001)' },
  { value: 'ADDITIONAL_PORT_FEE', defaultLabel: 'Additional Port Fee',          hint: 'Fee charged per extra port beyond the default port (BR-002)' },
  { value: 'INSPECTION_FEE',      defaultLabel: 'Inspection / Audit Fee',       hint: 'Fee paid by applicant after officer nomination, before audit visit (BR-003)' },
  { value: 'ANNUAL_FEE',          defaultLabel: 'Annual Recognition Fee',       hint: 'Annual fee paid after gazette notification (Rs 50,000 per year — BR-007, BR-008)' },
];

const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 7, fontSize: 13, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' };

function FeeForm({ initial, onSave, onCancel, saving }: {
  initial: PIAFeeConfig;
  onSave: (d: { feeType: string; label: string; amount: number; description: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const meta = FEE_TYPES.find(f => f.value === initial.feeType)!;
  const [label, setLabel] = useState(initial.label || meta.defaultLabel);
  const [amount, setAmount] = useState(String(initial.amount));
  const [description, setDescription] = useState(initial.description ?? '');
  const [err, setErr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!label.trim()) { setErr('Label is required'); return; }
    if (isNaN(amt) || amt < 0) { setErr('Enter a valid amount'); return; }
    onSave({ feeType: initial.feeType, label: label.trim(), amount: amt, description: description.trim() });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '24px 28px', width: 460 }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>Edit Fee — {meta.defaultLabel}</h3>
        <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: 12 }}>{meta.hint}</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Display Label *</label>
            <input value={label} onChange={e => { setLabel(e.target.value); setErr(''); }} style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Amount (₹) *</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setErr(''); }} style={{ ...inp, borderColor: err ? '#DC2626' : undefined }} min={0} step={0.01} placeholder="e.g. 50000" />
            {err && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{err}</p>}
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Description / Notes</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Optional notes for this fee" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', backgroundColor: 'var(--bg-nav)', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeeConfigSection() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<PIAFeeConfig | null>(null);

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-pia-fee-config'],
    queryFn: () => adminApi.getFeeConfig(),
    select: r => r.data?.data ?? [],
    staleTime: 60_000,
  });
  const items: PIAFeeConfig[] = raw ?? [];

  const upsertMut = useMutation({
    mutationFn: (d: { feeType: string; label: string; amount: number; description: string }) => adminApi.upsertFeeConfig({ ...d, isActive: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pia-fee-config'] }); setEditTarget(null); },
  });

  // Merge DB values with defaults so all 4 are always shown
  const feeMap = new Map(items.map(i => [i.feeType, i]));
  const rows = FEE_TYPES.map(ft => feeMap.get(ft.value) ?? { id: '', feeType: ft.value, label: ft.defaultLabel, amount: 0, description: null, isActive: true, updatedAt: '' } as PIAFeeConfig);
  const totalAnnual = rows.find(r => r.feeType === 'ANNUAL_FEE')?.amount ?? 0;
  const totalSetup = rows.filter(r => r.feeType !== 'ANNUAL_FEE').reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Fee Master</h2>
        <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>Configure all PIA recognition fee amounts. Changes apply to new applications immediately.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ padding: '12px 18px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', flex: '1 1 160px' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Total Setup Cost (min)</p>
          <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>₹{totalSetup.toLocaleString('en-IN')}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>App + Inspection fee (1 port)</p>
        </div>
        <div style={{ padding: '12px 18px', borderRadius: 10, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', flex: '1 1 160px' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Annual Fee (per year)</p>
          <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>₹{Number(totalAnnual).toLocaleString('en-IN')}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>After gazette notification</p>
        </div>
      </div>

      {/* Fee rows */}
      {isLoading ? (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((fee, idx) => {
            const meta = FEE_TYPES[idx];
            const isSet = !!fee.id;
            return (
              <div key={fee.feeType} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{fee.label}</span>
                    {!isSet && <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.1)', color: '#D97706', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 600 }}>Not configured</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{meta.hint}</p>
                  {fee.description && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{fee.description}</p>}
                  {fee.updatedAt && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Last updated: {new Date(fee.updatedAt).toLocaleDateString('en-IN')}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: isSet ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      ₹{Number(fee.amount).toLocaleString('en-IN')}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>per application</p>
                  </div>
                  <button onClick={() => setEditTarget(fee)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#3B82F6' }}>
          <strong>Note:</strong> All amounts are exclusive of GST. GST will be added at the time of invoice generation. BR-001: first port is included in the Application Fee. BR-002: Additional Port Fee applies per extra port.
        </p>
      </div>

      {editTarget && <FeeForm initial={editTarget} onSave={d => upsertMut.mutate(d)} onCancel={() => setEditTarget(null)} saving={upsertMut.isPending} />}
    </div>
  );
}
