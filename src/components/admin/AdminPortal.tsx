import React from 'react';
import { useApp } from '../../context/AppContext';

import { AdminLogin2FA } from './AdminLogin2FA';
import { VerificationQueue } from './VerificationQueue';
import { InvoiceOversightTable } from './InvoiceOversightTable';
import { DisputeResolution } from './DisputeResolution';
import { AnalyticsOverview } from './AnalyticsOverview';
import { BuyerMonitoring } from './BuyerMonitoring';

// ─── Icons ───────────────────────────────────────────────────────────────────
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 13H2.5A1.5 1.5 0 0 1 1 11.5v-8A1.5 1.5 0 0 1 2.5 2h3"/>
    <path d="M10 10.5l3.5-3-3.5-3"/>
    <path d="M13.5 7.5H5.5"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5L2 4.5v4C2 11.8 4.8 14.4 8 15c3.2-.6 6-3.2 6-6.5v-4L8 1.5z"/>
    <path d="M5.5 8l2 2 3-3"/>
  </svg>
);

// ─── Admin Navbar ─────────────────────────────────────────────────────────────
const AdminNavbar: React.FC<{ view: string; setView: (v: string) => void }> = ({ view, setView }) => {
  const { adminOnboarded, signOut } = useApp();

  const navBtn = (id: string, label: string) => {
    const active = view === id;
    return (
      <button
        key={id}
        onClick={() => setView(id)}
        className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap transition-all duration-150 text-[11px] sm:text-[11.5px] active:scale-[0.97]"
        style={active ? {
          background: 'var(--cream)',
          color: 'var(--ink)',
          fontWeight: 700,
          boxShadow: '0 1px 4px rgba(13,24,36,0.10), 0 0 0 1px rgba(13,24,36,0.07)',
        } : {
          background: 'transparent',
          color: 'var(--ink-subtle)',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40" style={{
        background: 'var(--accent)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(10,22,40,0.22)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4" style={{ height: '62px' }}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 select-none shrink-0">
              <div className="flex items-center justify-center shrink-0" style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg,#C9922A,#E8B96A)',
                borderRadius: '9px',
                boxShadow: '0 2px 8px rgba(201,146,42,0.35)',
              }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: '#fff', fontSize: '18px', letterSpacing: '-0.04em', lineHeight: 1 }}>V</span>
              </div>
              <div style={{ lineHeight: 1 }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: '#FFFFFF', fontSize: '20px', letterSpacing: '-0.03em', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>Vesto</div>
                <div className="hidden sm:block" style={{ fontSize: '9px', letterSpacing: '0.12em', fontWeight: 600, color: 'rgba(233,190,104,0.85)', textTransform: 'uppercase', marginTop: '2px' }}>Admin Portal</div>
              </div>
            </div>

            {/* Right: admin badge + sign out */}
            <div className="flex items-center gap-2 ml-auto">
              {adminOnboarded && (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                    background: 'rgba(201,146,42,0.15)',
                    border: '1px solid rgba(201,146,42,0.3)',
                  }}>
                    <ShieldIcon />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#E9BE68', letterSpacing: '0.04em' }}>ADMIN</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 transition-all active:scale-[0.97]"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.75)',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  >
                    <LogoutIcon />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sub-nav — only shown after authentication */}
      {adminOnboarded && (
        <div className="border-b border-border-subtle" style={{ background: 'var(--surface-strong)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-end gap-0.5 sm:gap-1 overflow-x-auto py-1.5 sm:py-2 no-scrollbar">
            {navBtn('oversight', 'Invoices')}
            {navBtn('queue',     'KYC Queue')}
            {navBtn('dispute',   'Disputes')}
            {navBtn('buyers',    'Buyers')}
            {navBtn('analytics', 'Analytics')}
          </div>
        </div>
      )}
    </>
  );
};

// ─── Admin Portal (root component for /admin route) ───────────────────────────
export const AdminPortal: React.FC = () => {
  const { adminOnboarded, adminView, setAdminView } = useApp();

  return (
    <div className="min-h-dvh flex flex-col bg-surface text-on-surface">
      <AdminNavbar view={adminView} setView={setAdminView} />

      <main
        className="flex-1 max-w-7xl w-full mx-auto p-0 sm:p-2"
        key={adminView}
        style={{ animation: 'vesto-fade-in 0.18s ease-out both' }}
      >
        {/* Gate: show login until authenticated */}
        {!adminOnboarded && <AdminLogin2FA />}

        {/* Panel: shown after authentication */}
        {adminOnboarded && adminView === 'oversight'  && <InvoiceOversightTable />}
        {adminOnboarded && adminView === 'queue'      && <VerificationQueue />}
        {adminOnboarded && adminView === 'dispute'    && <DisputeResolution />}
        {adminOnboarded && adminView === 'buyers'     && <BuyerMonitoring />}
        {adminOnboarded && adminView === 'analytics'  && <AnalyticsOverview />}
        {/* Fallback: if adminOnboarded but view is unrecognised, show invoices */}
        {adminOnboarded && !['oversight','queue','dispute','buyers','analytics'].includes(adminView) && <InvoiceOversightTable />}
      </main>
    </div>
  );
};
