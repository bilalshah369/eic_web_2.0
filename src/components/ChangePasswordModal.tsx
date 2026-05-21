import { useState } from 'react';
import { authApi } from '../services/auth.service';

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strengthScore = (() => {
    if (!next) return 0;
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[0-9]/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][strengthScore];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('New passwords do not match'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: next });
      setSuccess(true);
      setTimeout(onClose, 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      backgroundColor: 'rgba(15,22,64,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        width: '100%', maxWidth: 440, overflow: 'hidden',
        animation: 'cpModalIn 0.18s ease',
      }}>
        <style>{`
          @keyframes cpModalIn {
            from { opacity: 0; transform: scale(0.96) translateY(-8px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1B2A6B 0%, #2D4AAB 100%)',
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="17" fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Change Password</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11.5, marginTop: 1 }}>Update your login credentials</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5',
                border: '2px solid #10B981', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <svg width="26" height="26" fill="none" stroke="#10B981" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Password Changed!</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Your password has been updated successfully.</div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <PasswordField label="Current Password" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />

              <div style={{ height: 14 }} />
              <PasswordField label="New Password" value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(v => !v)} />

              {/* Strength bar */}
              {next.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        backgroundColor: i <= strengthScore ? strengthColor : '#E2E8F0',
                        transition: 'background-color 0.2s',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
                </div>
              )}

              <div style={{ height: 14 }} />
              <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />

              {confirm && next && confirm !== next && (
                <div style={{ marginTop: 5, fontSize: 11.5, color: '#EF4444' }}>Passwords do not match</div>
              )}

              <button type="submit" disabled={loading || !current || !next || !confirm} style={{
                marginTop: 22, width: '100%', padding: '11px 0',
                borderRadius: 9, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1B2A6B 0%, #3B5BDB 100%)',
                color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
                transition: 'opacity 0.15s',
                opacity: (!current || !next || !confirm) ? 0.6 : 1,
              }}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 40px 9px 12px',
            border: '1.5px solid #D1D5DB', borderRadius: 8,
            fontSize: 13, color: '#1e293b', outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#3B5BDB')}
          onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
        />
        <button type="button" onClick={onToggle} tabIndex={-1} style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', padding: 2, display: 'flex', alignItems: 'center',
        }}>
          {show ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
