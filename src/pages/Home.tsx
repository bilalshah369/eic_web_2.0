import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/auth.service';
import Header from '../components/Header';
import Footer from '../components/Footer';

/* ─── shared icons ───────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

/* ─── OTP 6-box input ────────────────────────────────────────────────────── */
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  function handleChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value]; next[idx] = ch; onChange(next);
    if (ch && idx < 5) refs.current[idx + 1]?.focus();
  }
  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) refs.current[idx - 1]?.focus();
  }
  function handlePaste(e: React.ClipboardEvent) {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { onChange(p.split('')); refs.current[5]?.focus(); }
    e.preventDefault();
  }
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {value.map((digit, idx) => (
        <input key={idx} ref={el => (refs.current[idx] = el)}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={e => handleChange(idx, e)} onKeyDown={e => handleKeyDown(idx, e)} onPaste={handlePaste}
          style={{ width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700, border: '2px solid #D1D5DB', borderRadius: 10, outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
          onBlur={e => (e.target.style.borderColor = digit ? '#1B2A6B' : '#D1D5DB')}
        />
      ))}
    </div>
  );
}

/* ─── home page content ──────────────────────────────────────────────────── */
const steps = [
  { n: 1, bg: 'bg-blue-500',   title: 'Register & Login',  desc: 'Register with PAN & IEC. Verify via OTP. Login credentials delivered to your registered email and mobile.' },
  { n: 2, bg: 'bg-orange-500', title: 'Fill & Upload',      desc: 'Complete the application form, upload documents. Auto-saved at every step.' },
  { n: 3, bg: 'bg-yellow-400', title: 'Pay Online',         desc: 'Pay fees via UPI, Credit/Debit Card or Net Banking. Instant confirmation.' },
  { n: 4, bg: 'bg-green-500',  title: 'Track & Receive',    desc: 'Track real-time status. Receive digitally signed certificate with QR code.' },
];

const services = [
  { title: 'Establishment Approval', sub: 'Certificate of Approval (CoA)', icon: <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" /></svg> },
  { title: 'PIA Recognition', sub: 'Inspection Agency Approval', icon: <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6" /></svg> },
  { title: 'Export Certificates', sub: 'Health & Inspection Certs', icon: <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4H7zM14 3v4h4" /></svg> },
  { title: 'Renewal & Amendment', sub: 'For existing approvals', icon: <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#1B6FE4" /><path stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M12 4v2m0 12v2M4 12h2m12 0h2M6.34 6.34l1.42 1.42m8.48 8.48 1.42 1.42M6.34 17.66l1.42-1.42M16.24 7.76l1.42-1.42" /><path stroke="white" strokeWidth={1.8} strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

/* ─── input styles ───────────────────────────────────────────────────────── */
const regInp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 13px', fontSize: 13,
  border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none',
  color: '#1F2937', backgroundColor: '#fff', transition: 'border-color 0.15s',
};

function RegField({ label, required, badge, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; badge?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        {badge && <span style={{ marginLeft: 6, fontSize: 10, backgroundColor: '#F3F4F6', color: '#6B7280', padding: '1px 6px', borderRadius: 4 }}>{badge}</span>}
      </label>
      <input {...props} style={{ ...regInp, borderColor: focused ? '#1B2A6B' : '#D1D5DB' }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { openLogin?: boolean; message?: string } | null;
    if (state?.openLogin) { openModal('login', state.message ?? ''); navigate('/', { replace: true }); }
  }, []);

  /* ── modal state ─────────────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');
  const [successMsg, setSuccessMsg] = useState('');

  function openModal(view: 'login' | 'register' = 'login', msg = '') {
    setModalView(view); setSuccessMsg(msg); setError(''); setLoginForm({ email: '', password: '' });
    setRegForm({ name: '', email: '', mobile: '', pan: '', iec: '', gstin: '', password: '', confirmPassword: '' });
    setRegStep(1); setOtp(Array(6).fill(''));
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false); setError(''); setSuccessMsg('');
  }
  function switchToRegister() { setError(''); setModalView('register'); }
  function switchToLogin() { setError(''); setModalView('login'); }

  /* ── login form ──────────────────────────────────────────────────────── */
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [certNum, setCertNum] = useState('');

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const result = await login(loginForm.email, loginForm.password);
      const role = result.user?.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') navigate('/admin');
      else if (role === 'EIA_ADMIN' || role === 'SUB_EIA_ADMIN') navigate('/office-portal');
      else if (role === 'OFFICER') navigate('/officer-portal');
      else navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  }

  /* ── register form ───────────────────────────────────────────────────── */
  const [regForm, setRegForm] = useState({ name: '', email: '', mobile: '', pan: '', iec: '', gstin: '', password: '', confirmPassword: '' });
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setReg = (k: keyof typeof regForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRegForm(f => ({ ...f, [k]: e.target.value }));

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(timerRef.current!); return 0; } return p - 1; });
    }, 1000);
  }, []);

  useEffect(() => {
    if (regStep === 2 && modalView === 'register') startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [regStep, modalView, startCountdown]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (regForm.password !== regForm.confirmPassword) { setError('Passwords do not match.'); return; }
    if (regForm.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await authApi.sendOtp(regForm.email, regForm.mobile);
      setRegStep(2);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.register({
        name: regForm.name, email: regForm.email, password: regForm.password,
        mobile: regForm.mobile, pan: regForm.pan.toUpperCase(),
        iec: regForm.iec.toUpperCase(), gstin: regForm.gstin.toUpperCase() || undefined, otp: otpStr,
      });
      setModalView('login');
      setSuccessMsg('Account created successfully! Please sign in.');
      setRegStep(1); setOtp(Array(6).fill(''));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Verification failed. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError(''); setLoading(true);
    try {
      await authApi.sendOtp(regForm.email, regForm.mobile);
      setOtp(Array(6).fill('')); startCountdown();
    } catch { setError('Failed to resend OTP.'); }
    finally { setLoading(false); }
  }

  /* ── drawer width ────────────────────────────────────────────────────── */
  const drawerW = modalView === 'register' ? 580 : 420;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Header onLoginClick={() => openModal('login')} />

      {/* ── Two-column content area ── */}
      <div className="flex-1 flex items-start px-10 py-10 gap-12 relative">
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-800/20 blur-3xl -translate-x-1/2 translate-y-1/2" />

        {/* LEFT */}
        <div className="flex-1 relative z-10">
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-white leading-tight">Apply. Track. Receive.</h1>
            <h2 className="text-5xl font-extrabold text-orange-500 leading-tight mb-5">All in one place.</h2>
            <ul className="space-y-3 mb-3">
              {[
                { icon: '📋', text: 'Establishment Approvals & Certificate of Approval (CoA)' },
                { icon: '✏️', text: 'PIA Recognition for Inspection Agencies' },
                { icon: '📄', text: 'All Export Certificates — fully digital & paperless' },
              ].map(f => (
                <li key={f.text} className="flex items-start gap-3 text-white/75 text-sm">
                  <span className="mt-0.5">{f.icon}</span><span>{f.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-cyan-400 italic text-sm">From anywhere. Anytime. No paperwork.</p>
          </div>

          <section className="border border-white/10 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
            <p className="text-white font-bold text-base mb-1">Verify Approval / Certificate</p>
            <p className="text-white/45 text-xs mb-4">Enter the certificate or approval number to instantly verify its authenticity</p>
            <p className="text-white/55 text-xs font-semibold tracking-wider mb-2 uppercase">Certificate / Approval Number *</p>
            <input type="text" value={certNum} onChange={e => setCertNum(e.target.value)}
              placeholder="e.g. COA/MUM/2526/0034 or HC/KER/2526/0042"
              className="w-full border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-400 transition mb-3"
              style={{ backgroundColor: 'var(--bg-input)' }} />
            <button className="w-full text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
              style={{ backgroundColor: 'var(--accent-muted)' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = 'var(--accent-muted-hover)')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = 'var(--accent-muted)')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Verify Now
            </button>
          </section>
        </div>

        {/* RIGHT */}
        <div className="w-[480px] flex-shrink-0 relative z-10">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-px bg-orange-500 block" />
              <span className="text-orange-500 text-xs font-semibold tracking-widest uppercase">How it Works</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-4">Simple 4-step digital process</h3>
            <div className="grid grid-cols-2 gap-3">
              {steps.map(s => (
                <div key={s.n} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] transition">
                  <div className={`${s.bg} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3`}>{s.n}</div>
                  <p className="text-white text-sm font-semibold mb-1">{s.title}</p>
                  <p className="text-white/45 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase mb-4">Services Available</p>
            <div className="grid grid-cols-2 gap-3">
              {services.map(s => (
                <button key={s.title} className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition group">
                  <div className="mb-3 opacity-70">{s.icon}</div>
                  <p className="text-white text-xs font-semibold leading-snug group-hover:text-orange-400 transition">{s.title}</p>
                  <p className="text-white/40 text-[11px] mt-0.5 leading-snug">{s.sub}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <Footer />

      {/* ════════════════════════════════════════════════════════════════════
          MODAL DRAWER
      ════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <>
          <div onClick={closeModal} className="fixed inset-0 bg-black/60 z-40" />

          <div className="fixed top-0 right-0 bottom-0 z-50 shadow-2xl flex flex-col border-l border-gray-200 transition-all duration-200"
            style={{ width: drawerW, backgroundColor: '#ffffff' }}>

            {/* ── Header band ── */}
            <div className="modal-dark" style={{ backgroundColor: 'var(--bg-utility)', padding: '12px 20px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                SECURE ACCESS · EIC e-SERVICES
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                    {modalView === 'login' ? 'Sign In' : regStep === 1 ? 'Register Organization' : 'Verify Identity'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>
                    {modalView === 'login' ? 'Enter your official EIC credentials.' : 'EIC e-Services Portal'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {/* Step indicators — register only */}
                  {modalView === 'register' && (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${regStep === 1 ? 'text-white' : 'bg-green-500 text-white'}`}
                        style={regStep === 1 ? { backgroundColor: '#1B2A6B' } : {}}>
                        {regStep === 1 ? '1' : '✓'}
                      </div>
                      <div className="w-8 h-0.5" style={{ backgroundColor: regStep === 2 ? 'var(--bg-nav)' : 'rgba(255,255,255,0.2)' }} />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${regStep === 2 ? 'text-white' : 'bg-white/10 text-white/40'}`}
                        style={regStep === 2 ? { backgroundColor: '#1B2A6B' } : {}}>
                        2
                      </div>
                    </div>
                  )}
                  {/* Close */}
                  <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)')}>
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pt-4 pb-4 flex-1 overflow-y-auto">

              {/* ── LOGIN VIEW ── */}
              {modalView === 'login' && (
                <>
                  {successMsg && (
                    <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-lg">✓ {successMsg}</div>
                  )}
                  {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{error}</div>
                  )}

                  <form onSubmit={onLoginSubmit} className="space-y-3" autoComplete="off">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Email ID / User ID</label>
                      <input type="text" required placeholder="Enter email or user ID"
                        value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                        autoComplete="off"
                        className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none transition"
                        style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #D1D5DB', color: '#1F2937' }}
                        onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                        onBlur={e => (e.target.style.borderColor = '#D1D5DB')} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium" style={{ color: '#374151' }}>Password</label>
                        <a href="#" className="text-xs font-medium transition" style={{ color: 'var(--bg-nav)' }}>Forgot Password?</a>
                      </div>
                      <div className="relative">
                        <input type={showPwd ? 'text' : 'password'} required placeholder="Enter your password"
                          value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                          autoComplete="new-password"
                          className="w-full rounded-lg px-4 py-2 text-sm pr-11 focus:outline-none transition"
                          style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #D1D5DB', color: '#1F2937' }}
                          onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                          onBlur={e => (e.target.style.borderColor = '#D1D5DB')} />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition" style={{ color: '#9CA3AF' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                          {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full disabled:opacity-60 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                      style={{ backgroundColor: loading ? '#94A3B8' : '#1B2A6B', color: '#fff' }}
                      onMouseOver={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'; }}
                      onMouseOut={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                  </form>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center">
                      <span className="px-3 text-xs" style={{ backgroundColor: '#ffffff', color: '#9CA3AF' }}>OR</span>
                    </div>
                  </div>

                  <p className="text-center text-sm" style={{ color: '#6B7280' }}>
                    New applicant?{' '}
                    <button onClick={switchToRegister} className="font-semibold transition underline-offset-2 hover:underline" style={{ color: 'var(--bg-nav)' }}>
                      Register your organization
                    </button>
                  </p>

                  {/* Trust badges */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}><span className="text-green-500">🔒</span> SSL Secured</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>🏛️ Govt. of India</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}><span className="text-orange-400">🕐</span> 24×7 Access</span>
                  </div>

                  <div className="mt-3 rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: '#F0F4FF', border: '1px solid #C7D2FE' }}>
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base" style={{ backgroundColor: '#EEF2FF' }}>📞</div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1B2A6B' }}>Need Help?</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Helpdesk: <span className="font-medium" style={{ color: 'var(--bg-nav)' }}>1800-XXX-XXXX</span> · Mon–Fri, 9am–6pm</p>
                    </div>
                  </div>
                </>
              )}

              {/* ── REGISTER VIEW ── */}
              {modalView === 'register' && (
                <>
                  {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{error}</div>
                  )}

                  {/* Step 1 */}
                  {regStep === 1 && (
                    <form onSubmit={handleSendOtp} autoComplete="off">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <RegField label="Contact Person Name" required placeholder="Full name" autoComplete="off" value={regForm.name} onChange={setReg('name')} />
                        <RegField label="Email Address" required type="email" placeholder="official@example.com" autoComplete="off" value={regForm.email} onChange={setReg('email')} />
                        <RegField label="Mobile Number" required type="tel" placeholder="+91 98765 43210" maxLength={15} autoComplete="off" value={regForm.mobile} onChange={setReg('mobile')} />
                        <RegField label="PAN Number" required placeholder="ABCDE1234F" maxLength={10} autoComplete="off" value={regForm.pan} onChange={setReg('pan')} style={{ textTransform: 'uppercase' }} />
                        <RegField label="IEC Number" required placeholder="Import Export Code" maxLength={10} autoComplete="off" value={regForm.iec} onChange={setReg('iec')} style={{ textTransform: 'uppercase' }} />
                        <RegField label="GSTIN" badge="Optional" placeholder="22AAAAA0000A1Z5" maxLength={15} autoComplete="off" value={regForm.gstin} onChange={setReg('gstin')} style={{ textTransform: 'uppercase' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                        {/* Password */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                            Password <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input type={showRegPwd ? 'text' : 'password'} required placeholder="Min. 8 characters"
                              autoComplete="new-password" value={regForm.password} onChange={setReg('password')}
                              style={{ ...regInp, paddingRight: 40 }}
                              onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                              onBlur={e => (e.target.style.borderColor = '#D1D5DB')} />
                            <button type="button" onClick={() => setShowRegPwd(!showRegPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                              {showRegPwd ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          </div>
                        </div>
                        {/* Confirm password */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                            Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input type={showRegConfirm ? 'text' : 'password'} required placeholder="Re-enter password"
                              autoComplete="new-password" value={regForm.confirmPassword} onChange={setReg('confirmPassword')}
                              style={{ ...regInp, paddingRight: 40 }}
                              onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                              onBlur={e => (e.target.style.borderColor = '#D1D5DB')} />
                            <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                              {showRegConfirm ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={loading}
                        className="w-full disabled:opacity-60 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition mb-4"
                        style={{ backgroundColor: loading ? '#94A3B8' : '#1B2A6B', color: '#fff' }}
                        onMouseOver={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'; }}
                        onMouseOut={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; }}>
                        {loading ? 'Sending OTP…' : <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                          Send OTP &amp; Continue
                        </>}
                      </button>

                      <p className="text-center text-sm" style={{ color: '#6B7280' }}>
                        Already registered?{' '}
                        <button type="button" onClick={switchToLogin} className="font-semibold transition" style={{ color: 'var(--bg-nav)' }}>Sign in</button>
                      </p>
                    </form>
                  )}

                  {/* Step 2 — OTP */}
                  {regStep === 2 && (
                    <form onSubmit={handleVerify}>
                      <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <svg className="w-7 h-7" fill="none" stroke="#1B2A6B" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <p className="font-semibold text-base" style={{ color: '#111827' }}>Enter the OTP</p>
                        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Sent to <span className="font-medium" style={{ color: '#374151' }}>{regForm.email}</span> &amp; <span className="font-medium" style={{ color: '#374151' }}>{regForm.mobile}</span></p>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--bg-nav)' }}>(Development mode: OTP is logged in the API console)</p>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <OtpInput value={otp} onChange={setOtp} />
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        {countdown > 0 ? (
                          <p className="text-sm" style={{ color: '#6B7280' }}>Resend OTP in <span className="font-semibold" style={{ color: 'var(--bg-nav)' }}>{countdown}s</span></p>
                        ) : (
                          <button type="button" onClick={handleResend} disabled={loading} className="hover:underline text-sm font-semibold" style={{ color: 'var(--bg-nav)' }}>Resend OTP</button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => { setRegStep(1); setError(''); setOtp(Array(6).fill('')); }}
                          className="flex-1 py-3 rounded-lg font-semibold text-sm transition" style={{ border: '1.5px solid #D1D5DB', color: '#374151', backgroundColor: '#fff' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}>
                          ← Back
                        </button>
                        <button type="submit" disabled={loading || otp.join('').length < 6}
                          className="flex-1 disabled:opacity-60 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                          style={{ backgroundColor: '#1B2A6B', color: '#fff' }}
                          onMouseOver={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'}
                          onMouseOut={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'}>
                          {loading ? 'Verifying…' : <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Verify &amp; Create Account
                          </>}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-3 flex-shrink-0" style={{ borderTop: '1px solid #E5E7EB' }}>
              <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>© 2026 Export Inspection Council. All rights reserved.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
