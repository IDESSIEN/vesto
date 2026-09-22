import React, { useState, useRef, useEffect } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';

const SellerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="12" height="9" rx="1.5"/><path d="M4 4V3a3 3 0 0 1 6 0v1"/><path d="M7 8v2"/>
  </svg>
);
const LenderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="12" height="8" rx="1.5"/><path d="M1 8h12"/><path d="M4 2h6"/><path d="M2 5V3.5A1.5 1.5 0 0 1 3.5 2h7A1.5 1.5 0 0 1 12 3.5V5"/>
  </svg>
);
const AdminIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1L2 3.5v3.5C2 10.09 4.24 12.81 7 13c2.76-.19 5-2.91 5-6V3.5L7 1z"/>
    <path d="M5 7l1.5 1.5L9 5.5"/>
  </svg>
);
const ChevronIcon = ({ up }: { up?: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {up ? <path d="M2 7.5l3.5-3 3.5 3"/> : <path d="M2 3.5l3.5 3 3.5-3"/>}
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 13H2.5A1.5 1.5 0 0 1 1 11.5v-8A1.5 1.5 0 0 1 2.5 2h3"/><path d="M10 10.5l3.5-3-3.5-3"/><path d="M13.5 7.5H5.5"/>
  </svg>
);
const SuccessIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6.5" cy="6.5" r="5.5"/><path d="M4 6.5l2 2 3-3"/>
  </svg>
);
const WarningIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 1L1 11h11L6.5 1z"/><path d="M6.5 5v3"/><circle cx="6.5" cy="9.5" r="0.6" fill="currentColor"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 5.5v4"/><circle cx="6.5" cy="3.8" r="0.6" fill="currentColor"/>
  </svg>
);

export const Navbar: React.FC = () => {
  const { currentRole, setCurrentRole, notification, sellerOnboarded, lenderOnboarded, adminOnboarded, seller, lender, signOut } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAuthenticated =
    (currentRole === 'seller' && sellerOnboarded) ||
    (currentRole === 'lender' && lenderOnboarded) ||
    (currentRole === 'admin' && adminOnboarded);

  const displayName =
    currentRole === 'seller' ? seller.fullName || 'Seller' :
    currentRole === 'lender' ? lender.fullName || 'Lender' :
    'Admin';

  const rawInitials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const initials = rawInitials || currentRole[0].toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roles = [
    { id: 'seller' as const, label: 'Seller', Icon: SellerIcon },
    { id: 'lender' as const, label: 'Lender', Icon: LenderIcon },
    { id: 'admin'  as const, label: 'Admin',  Icon: AdminIcon  },
  ];

  const ActiveIcon = roles.find(r => r.id === currentRole)?.Icon ?? SellerIcon;

  return (
    <header className="sticky top-0 z-40" style={{
      background: 'var(--accent)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.07), 0 4px 24px rgba(10,22,40,0.22)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4" style={{ height: '62px' }}>

          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => setCurrentRole('seller')}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg,#C9922A,#E8B96A)',
                borderRadius: '9px',
                boxShadow: '0 2px 8px rgba(201,146,42,0.35)',
              }}
            >
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: '#fff', fontSize: '18px', letterSpacing: '-0.04em', lineHeight: 1 }}>V</span>
            </div>
            <div style={{ lineHeight: 1 }}>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                color: '#FFFFFF',
                fontSize: '20px',
                letterSpacing: '-0.03em',
                textShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}>Vesto</div>
              <div className="hidden sm:block" style={{ fontSize: '9px', letterSpacing: '0.12em', fontWeight: 600, color: 'rgba(233,190,104,0.85)', textTransform: 'uppercase', marginTop: '2px' }}>Invoice Capital, Onchain</div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">

            {/* Role switcher — desktop (always visible) */}
            <nav
              className="hidden sm:flex items-center gap-0.5 p-[3px]"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '999px' }}
            >
              {roles.map(({ id, label, Icon }) => {
                const active = currentRole === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCurrentRole(id)}
                    className="flex items-center gap-1.5 transition-all duration-150"
                    style={{
                      padding: '5px 14px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#0A1628' : 'rgba(255,255,255,0.65)',
                      background: active ? 'linear-gradient(135deg,#C9922A,#E8B96A)' : 'transparent',
                      letterSpacing: active ? '-0.01em' : '0',
                    }}
                  >
                    <Icon />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Role switcher — mobile: tap the active-role icon to expand a dropdown */}
            <div className="relative flex sm:hidden" ref={roleRef}>
              <button
                onClick={() => setRoleOpen(o => !o)}
                style={{
                  width: '34px', height: '34px',
                  borderRadius: '999px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0A1628',
                  background: 'linear-gradient(135deg,#C9922A,#E8B96A)',
                  border: 'none',
                  flexShrink: 0,
                }}
                aria-label="Switch role"
              >
                <ActiveIcon />
              </button>

              {roleOpen && (
                <div
                  className="absolute right-0 top-full z-50 overflow-hidden"
                  style={{
                    marginTop: '8px',
                    background: '#0D1824',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '13px',
                    boxShadow: '0 20px 48px rgba(5,11,20,0.55)',
                    minWidth: '140px',
                  }}
                >
                  {roles.map(({ id, label, Icon }) => {
                    const active = currentRole === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { setCurrentRole(id); setRoleOpen(false); }}
                        className="w-full flex items-center gap-2.5 transition-colors"
                        style={{
                          padding: '11px 16px',
                          fontSize: '13px',
                          fontWeight: active ? 700 : 500,
                          color: active ? '#E9BE68' : 'rgba(255,255,255,0.65)',
                          background: active ? 'rgba(184,130,30,0.12)' : 'transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <Icon />
                        {label}
                        {active && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto">
                            <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="#E9BE68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ConnectKit — CSS in index.css collapses to icon-only on mobile */}
            <ConnectKitButton />

            {/* Avatar + sign-out */}
            {isAuthenticated && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 transition-all"
                  style={{
                    padding: '3px 8px 3px 3px',
                    borderRadius: '999px',
                    background: menuOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.09)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '999px',
                    background: 'linear-gradient(135deg,#C9922A,#E8B96A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '10px', color: '#0A1628',
                    letterSpacing: '-0.01em', flexShrink: 0,
                  }}>{initials}</div>
                  <span className="hidden sm:block" style={{ color: '#fff', fontSize: '11.5px', fontWeight: 600, maxWidth: '76px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center' }}><ChevronIcon up={menuOpen} /></span>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full z-50 overflow-hidden"
                    style={{
                      marginTop: '8px', width: '196px',
                      background: 'var(--cream)',
                      border: '1px solid var(--border)',
                      borderRadius: '13px',
                      boxShadow: '0 20px 48px rgba(10,22,40,0.18)',
                    }}
                  >
                    <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                      <p style={{ fontSize: '10px', color: 'var(--ink-subtle)', marginTop: '1px', textTransform: 'capitalize' }}>{currentRole} account</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="w-full flex items-center gap-2.5 transition-colors"
                      style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#DC2626' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogoutIcon />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast strip */}
      {notification && (
        <div
          className="w-full text-center py-1.5 px-4 flex items-center justify-center gap-2"
          style={{
            fontSize: '12px', fontWeight: 600,
            background: notification.type === 'success' ? 'rgba(4,120,87,0.85)' : notification.type === 'warning' ? 'var(--gold-bg)' : 'rgba(255,255,255,0.08)',
            borderTop: notification.type === 'warning' ? '1px solid rgba(201,146,42,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: notification.type === 'success' ? '#fff' : notification.type === 'warning' ? 'var(--primary)' : '#fff',
          }}
        >
          {notification.type === 'success' ? <SuccessIcon /> : notification.type === 'warning' ? <WarningIcon /> : <InfoIcon />}
          <span>{notification.message}</span>
        </div>
      )}
    </header>
  );
};
