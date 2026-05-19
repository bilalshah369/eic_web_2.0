import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth.service';
import Header from '../components/Header';

/* ── OTP 6-box input ── */
function OtpInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = ch;
    onChange(next);
    if (ch && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted.split(''));
      refs.current[5]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {value.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
        />
      ))}
    </div>
  );
}

/* ── Field ── */
function Field({
  label,
  required,
  badge,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  badge?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {badge && (
          <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-normal">
            {badge}
          </span>
        )}
      </label>
      <input
        {...props}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition placeholder-gray-400"
      />
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function Register() {
  const navigate = useNavigate();

  /* Step 1 form state */
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    pan: '',
    iec: '',
    gstin: '',
    password: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* Stepper */
  const [step, setStep] = useState<1 | 2>(1);

  /* OTP state */
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* UI state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  /* Countdown for OTP resend */
  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (step === 2) startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, startCountdown]);

  /* Step 1 → send OTP */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(form.email, form.mobile);
      setStep(2);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* Step 2 → verify OTP & register */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        mobile: form.mobile,
        pan: form.pan.toUpperCase(),
        iec: form.iec.toUpperCase(),
        gstin: form.gstin.toUpperCase() || undefined,
        otp: otpStr,
      });
      navigate('/', { state: { openLogin: true, message: 'Account created successfully! Please sign in.' } });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(form.email, form.mobile);
      setOtp(Array(6).fill(''));
      startCountdown();
    } catch {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-orange-900/10 blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl -translate-x-1/2 translate-y-1/2" />

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 mb-8 z-10">
        <div className="w-12 h-12 rounded-full border-2 border-orange-500/40 bg-white/5 flex flex-col items-center justify-center">
          <span className="text-orange-500 font-extrabold text-xs">EIC</span>
        </div>
        <div>
          <p className="text-orange-500 text-xl font-bold tracking-tight">e·Services</p>
          <p className="text-white/40 text-xs">EIC · Export Inspection Council</p>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10">

        {/* Card header */}
        <div className="px-8 py-6" style={{ backgroundColor: 'var(--bg-page)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-bold">
                {step === 1 ? 'Register your Organization' : 'Verify Your Identity'}
              </h2>
              <p className="text-white/50 text-sm mt-0.5">
                {step === 1
                  ? 'Fill in your organization details to create an account'
                  : `We've sent a 6-digit OTP to ${form.email} & ${form.mobile}`}
              </p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                {step === 1 ? '1' : '✓'}
              </div>
              <div className={`w-10 h-0.5 ${step === 2 ? 'bg-orange-500' : 'bg-white/20'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-orange-500 text-white' : 'bg-white/20 text-white/40'}`}>
                2
              </div>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="px-8 py-7">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-lg">
              {error}
            </div>
          )}

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Contact Person Name"
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={set('name')}
                />
                <Field
                  label="Email Address"
                  required
                  type="email"
                  placeholder="official@example.com"
                  value={form.email}
                  onChange={set('email')}
                />
                <Field
                  label="Mobile Number"
                  required
                  type="tel"
                  placeholder="+91 98765 43210"
                  maxLength={15}
                  value={form.mobile}
                  onChange={set('mobile')}
                />
                <Field
                  label="PAN Number"
                  required
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={form.pan}
                  onChange={set('pan')}
                  style={{ textTransform: 'uppercase' }}
                />
                <Field
                  label="IEC Number"
                  required
                  placeholder="Import Export Code"
                  maxLength={10}
                  value={form.iec}
                  onChange={set('iec')}
                  style={{ textTransform: 'uppercase' }}
                />
                <Field
                  label="GSTIN"
                  badge="Optional"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  value={form.gstin}
                  onChange={set('gstin')}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={set('password')}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition mt-2"
              >
                {loading ? (
                  'Sending OTP…'
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send OTP
                  </>
                )}
              </button>
            </form>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-50 rounded-full mb-4">
                  <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-gray-800 font-semibold text-base">Enter the OTP</p>
                <p className="text-gray-500 text-sm mt-1">
                  Sent to{' '}
                  <span className="font-medium text-gray-700">{form.email}</span> &amp;{' '}
                  <span className="font-medium text-gray-700">{form.mobile}</span>
                </p>
                <p className="text-orange-600 text-xs mt-1 font-medium">
                  (Development mode: OTP is logged in the API console)
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend OTP in{' '}
                    <span className="font-semibold text-orange-600">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-orange-600 hover:underline text-sm font-semibold"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(Array(6).fill('')); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    'Verifying…'
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verify & Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/" className="text-orange-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
