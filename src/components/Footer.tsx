import { useState } from 'react';

const MANDALA = 'https://website.eiconline.in/assets/Mandala%20Art-BLNb4i0w.png';
const INDIA_GOV = 'https://website.eiconline.in/assets/image%202749-BiYovwYA.png';
const EIC_SEAL = 'https://eic-web.onrender.com/assets/img_19119_204_High_Resolution_Logo__EIC.png';

const NAV_LINKS = ['About Us', 'Contact Us', 'Website Policies', 'Sitemap', 'Help', 'Feedback', 'Admin Login'];

export default function Footer() {
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <>
      <footer className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg-footer)' }}>

        {/* ── Main row ── */}
        <div className="flex items-stretch">

          {/* Left content */}
          <div className="flex-1 px-10 py-8 relative z-10">

            {/* Logo + name */}
            <div className="flex items-center gap-4 mb-4">
              <img src={EIC_SEAL} alt="EIC Logo" className="w-16 h-16 object-contain" />
              <div>
                <p className="text-white font-bold text-base leading-snug tracking-wide">
                  EXPORT INSPECTION COUNCIL (EIC)
                </p>
                <p className="text-white/60 text-xs italic mt-0.5">
                  (Ministry of Commerce and Industry, Govt. of India)
                </p>
              </div>
            </div>

            {/* Address */}
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              2nd Floor, B- Plate, Block-I, Commercial Complex,<br />
              East Kidwai Nagar, New Delhi - 110023
            </p>

            <hr className="border-white/20 mb-5" />

            {/* Nav links */}
            <div className="flex flex-wrap items-center gap-x-0 gap-y-2 mb-6">
              {NAV_LINKS.map((link, i) => (
                <span key={link} className="flex items-center">
                  <a href="#" className="text-white/80 hover:text-white text-sm transition">
                    {link}
                  </a>
                  {i < NAV_LINKS.length - 1 && (
                    <span className="text-white/30 mx-3 text-xs">|</span>
                  )}
                </span>
              ))}
            </div>

            {/* Social + india.gov.in + credit */}
            <div className="flex items-center gap-4">
              {/* X (Twitter) */}
              <a
                href="#"
                className="w-9 h-9 border border-white/30 rounded flex items-center justify-center text-white/80 hover:bg-white/10 transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.252 2.25H8.08l4.258 5.632 5.906-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                className="w-9 h-9 border border-white/30 rounded flex items-center justify-center text-white/80 hover:bg-white/10 transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* india.gov.in badge */}
              <a href="https://india.gov.in" target="_blank" rel="noreferrer">
                <img src={INDIA_GOV} alt="india.gov.in" className="h-10 object-contain brightness-0 invert" />
              </a>
            </div>

            {/* Designed by */}
            <p className="text-white/50 text-xs mt-5">
              Designed &amp; Developed by:{' '}
              <span className="text-white font-semibold">Logicsoft</span>
            </p>
          </div>

          {/* Right — Mandala art */}
          <div className="w-[420px] flex-shrink-0 flex items-end justify-end">
            <img
              src={MANDALA}
              alt="Mandala Art"
              className="w-full h-full object-cover object-left-top"
            />
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="px-10 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-footer-bar)' }}>
          <p className="text-white/60 text-xs">
            © 2026 Export Inspection Council. All Rights Reserved.
          </p>
          <p className="text-white/60 text-xs">
            Last Updated : 28 Jan 2026 &nbsp;|&nbsp; Total Visitors :{' '}
            <span className="text-white/80">2,195,193</span>
          </p>
        </div>

      </footer>

      {/* ── Floating chatbot bubble ── */}
      <div className="fixed bottom-6 right-5 z-50 flex items-end gap-2">
        {chatOpen && (
          <div className="bg-white rounded-2xl rounded-br-none shadow-lg px-4 py-2.5 text-sm text-gray-700 font-medium border border-gray-100">
            Hello! I'm your{' '}
            <span className="font-bold" style={{ color: 'var(--bg-nav)' }}>EIC Assistant</span>
          </div>
        )}
        <div
          onClick={() => setChatOpen(o => !o)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-nav)' }}
        >
          <svg className="w-7 h-7" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
          </svg>
        </div>
      </div>

    </>
  );
}
