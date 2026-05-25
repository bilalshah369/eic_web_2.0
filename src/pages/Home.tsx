import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { signupApi, lgdApi, registrationTypesApi } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

/* ─── shared icons ──────────────────────────────────────────────────────────── */
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
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

/* ─── OTP 6-box input ───────────────────────────────────────────────────────── */
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

/* ─── Searchable dropdown for drawer ───────────────────────────────────────── */
function DrawerSelect({ value, onChange, options, placeholder, disabled }: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(''); } }}
        style={{
          width: '100%', padding: '9px 13px', fontSize: 13, textAlign: 'left',
          border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none',
          backgroundColor: disabled ? '#F9FAFB' : '#fff',
          color: selected ? '#1F2937' : '#9CA3AF',
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected?.label || placeholder || 'Select...'}
        </span>
        <svg style={{ width: 14, height: 14, flexShrink: 0, marginLeft: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          backgroundColor: '#fff', border: '1.5px solid #D1D5DB', borderRadius: 8,
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)', marginTop: 4,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search..."
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 180 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF' }}>No results</div>
            ) : filtered.map(o => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, border: 'none',
                  backgroundColor: o.value === value ? '#EEF2FF' : 'transparent',
                  color: o.value === value ? '#1B2A6B' : '#1F2937', cursor: 'pointer',
                }}
                onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
                onMouseLeave={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Captcha ───────────────────────────────────────────────────────────────── */
const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: String(a + b) };
};

/* ─── Registration type fallback ────────────────────────────────────────────── */
const FALLBACK_REG_TYPES = [
  { value: 'ESTABLISHMENT',             label: 'Establishment' },
  { value: 'MERCHANT_EXPORTER',         label: 'Merchant Exporter' },
  { value: 'COLD_STORAGE_ICE_PLANT',    label: 'Cold Storage / Ice Plant' },
  { value: 'PRE_PROCESSING_CENTRE',     label: 'Pre-processing Centre' },
  { value: 'PRIVATE_INSPECTION_AGENCY', label: 'Private Inspection Agency' },
];

/* ─── home page steps / services ────────────────────────────────────────────── */
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

/* ─── input styles ──────────────────────────────────────────────────────────── */
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

function RegLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
    </label>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { openLogin?: boolean; message?: string } | null;
    if (state?.openLogin) { openModal('login', state.message ?? ''); navigate('/', { replace: true }); }
  }, []);

  /* ── modal state ─────────────────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'register'>('login');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── login form ──────────────────────────────────────────────────────────── */
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [certNum, setCertNum] = useState('');

  /* ── register: current step (1-4, where 4 = OTP entry) ──────────────────── */
  const [regStep, setRegStep] = useState(1);

  /* ── register step 1 ─────────────────────────────────────────────────────── */
  const [regType, setRegType] = useState('');
  const [orgName, setOrgName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');

  /* ── register step 2 ─────────────────────────────────────────────────────── */
  const [fetchedDetails, setFetchedDetails] = useState<Record<string, unknown> | null>(null);

  /* ── register step 3: contact ────────────────────────────────────────────── */
  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');

  /* ── register step 3: location ───────────────────────────────────────────── */
  const [orgAddress, setOrgAddress] = useState('');
  const [orgStateId, setOrgStateId] = useState('');
  const [orgDistrictId, setOrgDistrictId] = useState('');
  const [orgSubDistrictId, setOrgSubDistrictId] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgPincode, setOrgPincode] = useState('');

  /* ── register step 4: OTP ────────────────────────────────────────────────── */
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpExpiresAt, setOtpExpiresAt] = useState('');
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [otpResending, setOtpResending] = useState(false);

  /* ── LGD data queries ────────────────────────────────────────────────────── */
  const { data: regTypesData } = useQuery({
    queryKey: ['registration-types'],
    queryFn: () => registrationTypesApi.list(),
    staleTime: Infinity,
  });
  const regTypeOptions = ((regTypesData as any)?.data?.data?.length
    ? (regTypesData as any).data.data
    : FALLBACK_REG_TYPES
  ).map((t: any) => ({ value: t.code ?? t.value, label: t.name ?? t.label }));

  const { data: statesData } = useQuery({
    queryKey: ['lgd-states'],
    queryFn: () => lgdApi.states(),
    enabled: modalOpen && modalView === 'register',
    staleTime: Infinity,
  });
  const stateOptions = ((statesData as any)?.data?.data || []).map((s: any) => ({ value: String(s.id), label: s.name }));

  const { data: districtsData } = useQuery({
    queryKey: ['lgd-districts', orgStateId],
    queryFn: () => lgdApi.districts(Number(orgStateId)),
    enabled: !!orgStateId,
    staleTime: Infinity,
  });
  const districtOptions = ((districtsData as any)?.data?.data || []).map((d: any) => ({ value: String(d.id), label: d.name }));

  const { data: subDistrictsData } = useQuery({
    queryKey: ['lgd-sub-districts', orgDistrictId],
    queryFn: () => lgdApi.subDistricts(Number(orgDistrictId)),
    enabled: !!orgDistrictId,
    staleTime: Infinity,
  });
  const subDistrictOptions = ((subDistrictsData as any)?.data?.data || []).map((sd: any) => ({ value: String(sd.id), label: sd.name }));

  /* ── OTP countdown timer ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (regStep !== 4 || !otpExpiresAt) return;
    const calc = () => setOtpTimeLeft(Math.max(0, Math.floor((new Date(otpExpiresAt).getTime() - Date.now()) / 1000)));
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [regStep, otpExpiresAt]);

  /* ── modal open / close ──────────────────────────────────────────────────── */
  function openModal(view: 'login' | 'register' = 'login', msg = '') {
    setModalView(view); setSuccessMsg(msg); setError('');
    setLoginForm({ email: '', password: '' });
    setRegStep(1);
    setRegType(''); setOrgName(''); setPan(''); setDob('');
    setCaptchaInput(''); setCaptcha(generateCaptcha());
    setFetchedDetails(null);
    setContactName(''); setContactDesignation(''); setContactEmail(''); setContactMobile('');
    setOrgAddress(''); setOrgStateId(''); setOrgDistrictId(''); setOrgSubDistrictId('');
    setOrgCity(''); setOrgPincode('');
    setSessionId(''); setOtp(Array(6).fill('')); setOtpExpiresAt('');
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setError(''); setSuccessMsg(''); }
  function switchToRegister() { setError(''); setModalView('register'); }
  function switchToLogin() { setError(''); setModalView('login'); }

  /* ── login submit ────────────────────────────────────────────────────────── */
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

  /* ── register step 1: verify PAN ─────────────────────────────────────────── */
  async function handleStep1() {
    if (!regType || !orgName || !pan) { setError('Please fill all required fields'); return; }
    if (!/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/.test(pan)) { setError('Enter valid PAN (e.g. ABCDE1234F)'); return; }
    if (captchaInput !== captcha.answer) {
      setError('Incorrect captcha answer');
      setCaptcha(generateCaptcha()); setCaptchaInput('');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await signupApi.verifyPan({ registrationType: regType, orgName, pan: pan.toUpperCase(), dateOfIncorporation: dob || null });
      setFetchedDetails((res as any).data.data.fetchedDetails);
      setRegStep(2);
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'PAN_EXISTS') setError('This PAN is already registered. Please login.');
      else if (code === 'DGFT_REQUIRED') setError(err.response?.data?.message || 'DGFT validation failed for Merchant Exporter');
      else setError(err.response?.data?.message || 'Failed to verify PAN. Please try again.');
    } finally { setLoading(false); }
  }

  /* ── register step 3: save contact + send OTP ────────────────────────────── */
  async function handleStep3() {
    if (!contactName || !contactEmail || !contactMobile) { setError('Please fill Name, Email, and Mobile'); return; }
    if (!/^[6-9]\d{9}$/.test(contactMobile)) { setError('Enter valid 10-digit mobile number starting with 6-9'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) { setError('Enter valid email address'); return; }
    if (!orgAddress.trim()) { setError('Please enter the organization address'); return; }
    if (!orgStateId) { setError('Please select a state'); return; }
    if (!orgDistrictId) { setError('Please select a district'); return; }

    const selectedState = stateOptions.find((s: any) => s.value === orgStateId);
    const selectedDistrict = districtOptions.find((d: any) => d.value === orgDistrictId);
    const selectedSubDistrict = subDistrictOptions.find((sd: any) => sd.value === orgSubDistrictId);

    setLoading(true); setError('');
    try {
      const res = await signupApi.saveContact({
        registrationType: regType, orgName, pan: pan.toUpperCase(),
        dateOfIncorporation: dob || null, fetchedDetails,
        contactName, contactDesignation: contactDesignation || null,
        contactEmail: contactEmail.toLowerCase(), contactMobile,
        orgAddress: orgAddress.trim(),
        orgStateId: Number(orgStateId), orgStateName: selectedState?.label || null,
        orgDistrictId: Number(orgDistrictId), orgDistrictName: selectedDistrict?.label || null,
        orgSubDistrictId: orgSubDistrictId ? Number(orgSubDistrictId) : null,
        orgSubDistrictName: selectedSubDistrict?.label || null,
        orgCity: orgCity.trim() || null, orgPincode: orgPincode.trim() || null,
      });
      setSessionId((res as any).data.data.sessionId);
      setOtpExpiresAt((res as any).data.data.expiresAt);
      setOtp(Array(6).fill(''));
      setRegStep(4);
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'PAN_EXISTS') setError('This PAN was already registered. Please login.');
      else setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  }

  /* ── register step 4: verify OTP ─────────────────────────────────────────── */
  async function handleOtpVerify() {
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await signupApi.verifyOtp(sessionId, otpStr);
      setModalView('login');
      setSuccessMsg((res as any).data?.message || 'Registration complete! Login credentials sent to your email and mobile.');
      setRegStep(1); setOtp(Array(6).fill(''));
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally { setLoading(false); }
  }

  /* ── register step 4: resend OTP ─────────────────────────────────────────── */
  async function handleOtpResend() {
    setOtpResending(true); setError('');
    try {
      const res = await signupApi.resendOtp(sessionId);
      setOtpExpiresAt((res as any).data?.data?.expiresAt || otpExpiresAt);
      setOtp(Array(6).fill(''));
      setSuccessMsg('New OTP sent to your email and mobile');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally { setOtpResending(false); }
  }

  /* ── drawer width: wider for register steps ──────────────────────────────── */
  const drawerW = modalView === 'register' ? 640 : 420;

  /* ── OTP time format ─────────────────────────────────────────────────────── */
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ── step indicator for register header ──────────────────────────────────── */
  const headerStepCurrent = Math.min(regStep, 3);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#0B1428' }}>
      <Header onLoginClick={() => openModal('login')} />

      {/* ── Two-column content area ── */}
      <div className="modal-dark flex-1 flex items-start px-10 py-10 gap-12 relative">
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

          <section className="border border-white/10 rounded-xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white font-bold text-base mb-1">Verify Approval / Certificate</p>
            <p className="text-white/45 text-xs mb-4">Enter the certificate or approval number to instantly verify its authenticity</p>
            <p className="text-white/55 text-xs font-semibold tracking-wider mb-2 uppercase">Certificate / Approval Number *</p>
            <input type="text" value={certNum} onChange={e => setCertNum(e.target.value)}
              placeholder="e.g. COA/MUM/2526/0034 or HC/KER/2526/0042"
              className="w-full border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-blue-400 transition mb-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <button className="w-full text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
              style={{ backgroundColor: '#F97316' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#EA6C0A')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#F97316')}>
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

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL DRAWER
      ══════════════════════════════════════════════════════════════════════ */}
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
                    {modalView === 'login'
                      ? 'Sign In'
                      : regStep === 1 ? 'Step 1: Basic Details'
                      : regStep === 2 ? 'Step 2: Verify Details'
                      : regStep === 3 ? 'Step 3: Contact & Location'
                      : 'OTP Verification'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>
                    {modalView === 'login' ? 'Enter your official EIC credentials.' : 'Applicant Registration — EIC e-Services'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {/* Step indicators — register steps 1-3 */}
                  {modalView === 'register' && regStep <= 3 && (
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((s, i) => (
                        <div key={s} className="flex items-center gap-1.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: s < headerStepCurrent ? '#22C55E' : s === headerStepCurrent ? '#1B2A6B' : 'rgba(255,255,255,0.12)',
                              color: s <= headerStepCurrent ? '#fff' : 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {s < headerStepCurrent ? '✓' : s}
                          </div>
                          {i < 2 && <div style={{ width: 20, height: 2, backgroundColor: s < headerStepCurrent ? '#22C55E' : 'rgba(255,255,255,0.15)' }} />}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Close */}
                  <button onClick={closeModal}
                    style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)')}>
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pt-4 pb-4 flex-1 overflow-y-auto">

              {/* ─────────── LOGIN VIEW ─────────── */}
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
                        <a href="#" className="text-xs font-medium transition" style={{ color: '#1B2A6B' }}>Forgot Password?</a>
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
                    <button onClick={switchToRegister} className="font-semibold transition underline-offset-2 hover:underline" style={{ color: '#1B2A6B' }}>
                      Register your organization
                    </button>
                  </p>

                  <div className="mt-3 rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: '#F0F4FF', border: '1px solid #C7D2FE' }}>
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base" style={{ backgroundColor: '#EEF2FF' }}>📞</div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1B2A6B' }}>Need Help?</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Helpdesk: <span className="font-medium" style={{ color: '#1B2A6B' }}>1800-XXX-XXXX</span> · Mon–Fri, 9am–6pm</p>
                    </div>
                  </div>
                </>
              )}

              {/* ─────────── REGISTER VIEW ─────────── */}
              {modalView === 'register' && (
                <>
                  {error && (
                    <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>
                  )}
                  {successMsg && (
                    <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">✓ {successMsg}</div>
                  )}

                  {/* ── STEP 1: Basic Details ── */}
                  {regStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <RegLabel required>Registration Type</RegLabel>
                        <DrawerSelect
                          value={regType}
                          onChange={setRegType}
                          options={regTypeOptions}
                          placeholder="Select registration type"
                        />
                      </div>

                      <RegField
                        label="Name of Organization" required
                        value={orgName} onChange={e => setOrgName(e.target.value)}
                        placeholder="Enter full organization name"
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <RegField
                          label="PAN" required
                          value={pan} onChange={e => setPan(e.target.value.toUpperCase())}
                          placeholder="e.g. ABCDE1234F" maxLength={10}
                          style={{ textTransform: 'uppercase' }}
                        />
                        <div>
                          <RegLabel>Date of Incorporation / Formation</RegLabel>
                          <input
                            type="date" value={dob} onChange={e => setDob(e.target.value)}
                            style={{ ...regInp, borderColor: '#D1D5DB' }}
                            onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                            onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                          />
                        </div>
                      </div>

                      {/* Captcha */}
                      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px' }}>
                        <RegLabel required>Captcha Verification</RegLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                          <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '8px 16px', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#1B2A6B', userSelect: 'none' }}>
                            {captcha.question}
                          </div>
                          <input
                            value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
                            style={{ ...regInp, width: 90, textAlign: 'center' }}
                            placeholder="Answer"
                            onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                            onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                          />
                          <button type="button"
                            onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput(''); }}
                            style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#4B5563')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                            title="Refresh captcha">
                            <RefreshIcon />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                        <button type="button" onClick={switchToLogin}
                          style={{ fontSize: 13, color: '#1B2A6B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                          Already registered? Sign in
                        </button>
                        <button type="button" disabled={loading} onClick={handleStep1}
                          className="disabled:opacity-60 py-2.5 px-5 rounded-lg font-semibold text-sm flex items-center gap-2 transition"
                          style={{ backgroundColor: loading ? '#94A3B8' : '#1B2A6B', color: '#fff' }}
                          onMouseOver={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'; }}
                          onMouseOut={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; }}>
                          {loading ? 'Verifying…' : 'Save & Next →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2: Verify Fetched Details ── */}
                  {regStep === 2 && fetchedDetails && (
                    <div className="space-y-4">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ fontSize: 13, color: '#6B7280' }}>Please verify the details fetched against your PAN.</p>
                        {(fetchedDetails as any).apiSource && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                            backgroundColor: (fetchedDetails as any).apiSource === 'DGFT' ? '#F0FDF4' : '#EFF6FF',
                            color: (fetchedDetails as any).apiSource === 'DGFT' ? '#15803D' : '#1D4ED8',
                            border: `1px solid ${(fetchedDetails as any).apiSource === 'DGFT' ? '#BBF7D0' : '#BFDBFE'}`,
                          }}>
                            Source: {(fetchedDetails as any).apiSource}
                          </span>
                        )}
                      </div>

                      <div style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
                        {[
                          { label: 'Organization Name', val: (fetchedDetails as any).orgName || orgName },
                          { label: 'PAN', val: pan },
                          (fetchedDetails as any).iecNumber && { label: 'IEC Number', val: (fetchedDetails as any).iecNumber },
                          (fetchedDetails as any).registeredAddress && { label: 'Registered Address', val: (fetchedDetails as any).registeredAddress },
                          (fetchedDetails as any).city && { label: 'City', val: (fetchedDetails as any).city },
                          (fetchedDetails as any).state && { label: 'State', val: (fetchedDetails as any).state },
                          (fetchedDetails as any).pincode && { label: 'Pincode', val: (fetchedDetails as any).pincode },
                        ].filter(Boolean).map((row: any, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: i < 6 ? 8 : 0 }}>
                            <span style={{ color: '#6B7280', width: 160, flexShrink: 0 }}>{row.label}:</span>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{row.val}</span>
                          </div>
                        ))}
                      </div>

                      {(fetchedDetails as any).branches?.length > 0 && (
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                            Branch Offices ({(fetchedDetails as any).branches.length})
                          </p>
                          <div className="space-y-2">
                            {(fetchedDetails as any).branches.map((b: any, i: number) => (
                              <div key={i} style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>{b.branchName} ({b.branchCode})</p>
                                <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>{[b.address, b.city, b.state].filter(Boolean).join(', ')}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E' }}>
                        If the above details are incorrect, go back and re-enter your PAN.
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                        <button type="button" onClick={() => setRegStep(1)}
                          className="py-2.5 px-5 rounded-lg font-semibold text-sm transition"
                          style={{ border: '1.5px solid #D1D5DB', color: '#374151', backgroundColor: '#fff' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}>
                          ← Back
                        </button>
                        <button type="button" onClick={() => setRegStep(3)}
                          className="py-2.5 px-5 rounded-lg font-semibold text-sm flex items-center gap-2 transition"
                          style={{ backgroundColor: '#1B2A6B', color: '#fff' }}
                          onMouseOver={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'}
                          onMouseOut={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'}>
                          Confirm & Next →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: Contact Person + Location ── */}
                  {regStep === 3 && (
                    <div className="space-y-5">
                      {/* Contact Person */}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 8, marginBottom: 12 }}>
                          Contact Person Details
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <RegField label="Contact Person Name" required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full name" />
                          <RegField label="Designation" value={contactDesignation} onChange={e => setContactDesignation(e.target.value)} placeholder="e.g. Director" />
                          <RegField label="Email ID" required type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contact@company.com" />
                          <div>
                            <RegLabel required>Mobile Number</RegLabel>
                            <input
                              value={contactMobile}
                              onChange={e => setContactMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              style={regInp}
                              placeholder="10-digit mobile"
                              maxLength={10}
                              onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                              onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Organization Location */}
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 8, marginBottom: 12 }}>
                          Organization Location
                        </p>
                        <div className="space-y-3">
                          <div>
                            <RegLabel required>Address</RegLabel>
                            <textarea
                              value={orgAddress}
                              onChange={e => setOrgAddress(e.target.value)}
                              style={{ ...regInp, height: 72, resize: 'none' }}
                              placeholder="Full postal address of the organization"
                              onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                              onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                              <RegLabel required>State</RegLabel>
                              <DrawerSelect
                                value={orgStateId}
                                onChange={val => { setOrgStateId(val); setOrgDistrictId(''); setOrgSubDistrictId(''); }}
                                options={stateOptions}
                                placeholder="Select state"
                              />
                            </div>
                            <div>
                              <RegLabel required>District</RegLabel>
                              <DrawerSelect
                                value={orgDistrictId}
                                onChange={val => { setOrgDistrictId(val); setOrgSubDistrictId(''); }}
                                options={districtOptions}
                                placeholder={orgStateId ? 'Select district' : 'Select state first'}
                                disabled={!orgStateId}
                              />
                            </div>
                            <div>
                              <RegLabel>Sub-District</RegLabel>
                              <DrawerSelect
                                value={orgSubDistrictId}
                                onChange={setOrgSubDistrictId}
                                options={subDistrictOptions}
                                placeholder={orgDistrictId ? 'Select sub-district' : 'Select district first'}
                                disabled={!orgDistrictId}
                              />
                            </div>
                            <RegField label="City / Town" value={orgCity} onChange={e => setOrgCity(e.target.value)} placeholder="City or town name" />
                            <div>
                              <RegLabel>Pincode</RegLabel>
                              <input
                                value={orgPincode}
                                onChange={e => setOrgPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                style={regInp}
                                placeholder="6-digit pincode"
                                maxLength={6}
                                onFocus={e => (e.target.style.borderColor = '#1B2A6B')}
                                onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1E40AF' }}>
                        An OTP will be sent to the above email and mobile for verification.
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                        <button type="button" onClick={() => setRegStep(2)}
                          className="py-2.5 px-5 rounded-lg font-semibold text-sm transition"
                          style={{ border: '1.5px solid #D1D5DB', color: '#374151', backgroundColor: '#fff' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}>
                          ← Back
                        </button>
                        <button type="button" disabled={loading} onClick={handleStep3}
                          className="disabled:opacity-60 py-2.5 px-5 rounded-lg font-semibold text-sm flex items-center gap-2 transition"
                          style={{ backgroundColor: loading ? '#94A3B8' : '#1B2A6B', color: '#fff' }}
                          onMouseOver={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'; }}
                          onMouseOut={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; }}>
                          {loading ? 'Sending OTP…' : 'Send OTP & Verify →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 4: OTP Verification ── */}
                  {regStep === 4 && (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                          <svg className="w-7 h-7" fill="none" stroke="#1B2A6B" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 6 }}>Enter the OTP</p>
                        <p style={{ fontSize: 13, color: '#6B7280' }}>
                          Sent to <span style={{ fontWeight: 600, color: '#374151' }}>{contactEmail}</span>
                        </p>
                        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                          and <span style={{ fontWeight: 600, color: '#374151' }}>{contactMobile}</span>
                        </p>
                        <p style={{
                          marginTop: 10, fontSize: 13, fontWeight: 600,
                          color: otpTimeLeft > 60 ? '#15803D' : otpTimeLeft > 0 ? '#92400E' : '#DC2626',
                        }}>
                          {otpTimeLeft > 0 ? `Expires in ${fmtTime(otpTimeLeft)}` : 'OTP expired — please resend'}
                        </p>
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <OtpInput value={otp} onChange={setOtp} />
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
                          Same OTP is sent to both email and mobile
                        </p>
                        {import.meta.env.VITE_BYPASS_OTP === 'true' && (
                          <p style={{ textAlign: 'center', fontSize: 12, color: '#92400E', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '6px 10px', marginTop: 8 }}>
                            ⚠️ OTP bypass active — use <strong style={{ fontFamily: 'monospace' }}>000000</strong> to proceed
                          </p>
                        )}
                      </div>

                      <button type="button" disabled={loading || otpTimeLeft === 0} onClick={handleOtpVerify}
                        className="w-full disabled:opacity-60 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition mb-4"
                        style={{ backgroundColor: (loading || otpTimeLeft === 0) ? '#94A3B8' : '#1B2A6B', color: '#fff' }}
                        onMouseOver={e => { if (!loading && otpTimeLeft > 0) (e.currentTarget as HTMLElement).style.backgroundColor = '#152260'; }}
                        onMouseOut={e => { if (!loading && otpTimeLeft > 0) (e.currentTarget as HTMLElement).style.backgroundColor = '#1B2A6B'; }}>
                        {loading ? 'Verifying…' : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Verify & Complete Registration
                          </>
                        )}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button type="button" onClick={() => { setRegStep(3); setError(''); }}
                          style={{ fontSize: 13, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                          ← Back
                        </button>
                        <button type="button" disabled={otpResending} onClick={handleOtpResend}
                          style={{ fontSize: 13, fontWeight: 600, color: '#1B2A6B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: otpResending ? 0.6 : 1 }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                          <span style={{ display: 'inline-flex', animation: otpResending ? 'spin 1s linear infinite' : 'none' }}>
                            <RefreshIcon />
                          </span>
                          {otpResending ? 'Sending…' : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Already registered link — shown on steps 2 and 3 (step 1 has it inline) */}
                  {regStep > 1 && regStep < 4 && (
                    <p className="text-center text-sm mt-4" style={{ color: '#9CA3AF' }}>
                      Already registered?{' '}
                      <button onClick={switchToLogin} style={{ color: '#1B2A6B', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Sign in
                      </button>
                    </p>
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
