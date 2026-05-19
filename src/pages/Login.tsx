import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

const steps = [
  { n: 1, bg: 'bg-blue-500',   title: 'Register & Login',  desc: 'Register with PAN & IEC. Verify via OTP. Login credentials delivered to your registered email and mobile.' },
  { n: 2, bg: 'bg-orange-500', title: 'Fill & Upload',      desc: 'Complete the application form, upload documents. Auto-saved at every step.' },
  { n: 3, bg: 'bg-yellow-400', title: 'Pay Online',         desc: 'Pay fees via UPI, Credit/Debit Card or Net Banking. Instant confirmation.' },
  { n: 4, bg: 'bg-green-500',  title: 'Track & Receive',    desc: 'Track real-time status. Receive digitally signed certificate with QR code.' },
];

const services = [
  {
    title: 'Establishment Approval', sub: 'Certificate of Approval (CoA)',
    icon: (
      <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11" />
      </svg>
    ),
  },
  {
    title: 'PIA Recognition', sub: 'Inspection Agency Approval',
    icon: (
      <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    title: 'Export Certificates', sub: 'Health & Inspection Certs',
    icon: (
      <svg className="w-9 h-9 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4H7zM14 3v4h4" />
      </svg>
    ),
  },
  {
    title: 'Renewal & Amendment', sub: 'For existing approvals',
    icon: (
      <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="4" fill="#1B6FE4" />
        <path stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
          d="M12 4v2m0 12v2M4 12h2m12 0h2M6.34 6.34l1.42 1.42m8.48 8.48 1.42 1.42M6.34 17.66l1.42-1.42M16.24 7.76l1.42-1.42" />
        <path stroke="white" strokeWidth={1.8} strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const successMsg = searchParams.get('message');

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [certNum, setCertNum] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('modal') === 'login') {
      navigate('/', { replace: true });
      const frame = requestAnimationFrame(() => setDrawerOpen(true));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#0B1428] min-h-screen">
      <Header />

      {/* ── Two-column dark content area ── */}
      <div className="flex-1 flex items-start px-10 py-10 gap-12 relative">
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-800/20 blur-3xl -translate-x-1/2 translate-y-1/2" />

        {/* ══════════════ LEFT ══════════════ */}
        <div className="flex-1 relative z-10">

          {/* Tagline */}
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-white leading-tight">Apply. Track. Receive.</h1>
            <h2 className="text-5xl font-extrabold text-orange-500 leading-tight mb-5">All in one place.</h2>
            <ul className="space-y-3 mb-3">
              {[
                { icon: '📋', text: 'Establishment Approvals & Certificate of Approval (CoA)' },
                { icon: '✏️', text: 'PIA Recognition for Inspection Agencies' },
                { icon: '📄', text: 'All Export Certificates — fully digital & paperless' },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-white/75 text-sm">
                  <span className="mt-0.5">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-cyan-400 italic text-sm">From anywhere. Anytime. No paperwork.</p>
          </div>

          {/* Verify Certificate */}
          <section className="bg-[#12102A] border border-white/10 rounded-xl p-6">
            <p className="text-white font-bold text-base mb-1">Verify Approval / Certificate</p>
            <p className="text-white/45 text-xs mb-4">
              Enter the certificate or approval number to instantly verify its authenticity
            </p>
            <p className="text-white/55 text-xs font-semibold tracking-wider mb-2 uppercase">
              Certificate / Approval Number *
            </p>
            <input
              type="text"
              value={certNum}
              onChange={(e) => setCertNum(e.target.value)}
              placeholder="e.g. COA/MUM/2526/0034 or HC/KER/2526/0042"
              className="w-full bg-[#1C1838] border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-orange-500 transition mb-3"
            />
            <button className="w-full bg-[#5C3D18] hover:bg-[#6E4C20] text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Verify Now
            </button>
          </section>
        </div>

        {/* ══════════════ RIGHT ══════════════ */}
        <div className="w-[480px] flex-shrink-0 relative z-10">

          {/* How it Works */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-px bg-orange-500 block" />
              <span className="text-orange-500 text-xs font-semibold tracking-widest uppercase">How it Works</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-4">Simple 4-step digital process</h3>
            <div className="grid grid-cols-2 gap-3">
              {steps.map((s) => (
                <div key={s.n} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] transition">
                  <div className={`${s.bg} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3`}>
                    {s.n}
                  </div>
                  <p className="text-white text-sm font-semibold mb-1">{s.title}</p>
                  <p className="text-white/45 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Services Available */}
          <section>
            <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase mb-4">
              Services Available
            </p>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s) => (
                <button
                  key={s.title}
                  className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition group"
                >
                  <div className="mb-3 opacity-70">{s.icon}</div>
                  <p className="text-white text-xs font-semibold leading-snug group-hover:text-orange-400 transition">
                    {s.title}
                  </p>
                  <p className="text-white/40 text-[11px] mt-0.5 leading-snug">{s.sub}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

      </div>

      <Footer />

      {/* ════════════════════════════════════
          BACKDROP
      ════════════════════════════════════ */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/40 z-10 transition-opacity duration-400
          ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ════════════════════════════════════
          LOGIN DRAWER — slides in from right
      ════════════════════════════════════ */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[420px] bg-white z-20 shadow-2xl
          flex flex-col
          transition-transform duration-[400ms] ease-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close button */}
        <button
          onClick={closeDrawer}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition z-10"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Login form */}
        <div className="px-8 pt-8 pb-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Log In</h2>
          </div>

          {successMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
              ✓ {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email ID / User ID
              </label>
              <input
                type="text"
                required
                placeholder="Enter email or user ID"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-orange-600 text-sm hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-gray-400 text-xs">OR</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            New applicant?{' '}
            <Link to="/register" className="text-orange-600 font-semibold hover:underline">
              Register your organization
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              <span className="text-green-600">🔒</span> SSL Secured
            </span>
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              🏛️ Govt. of India Portal
            </span>
            <span className="flex items-center gap-1 text-gray-500 text-xs">
              <span className="text-orange-500">🕐</span> 24×7 Access
            </span>
          </div>

          {/* Help */}
          <div className="mt-4 bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0B1428] rounded-full flex-shrink-0 flex items-center justify-center text-white text-base">
              📞
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-sm">Need Help?</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Helpdesk: <span className="text-orange-600 font-medium">1800-XXX-XXXX</span> · Mon–Fri, 9am–6pm
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-center text-gray-400 text-xs">
            © 2026 Export Inspection Council. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
