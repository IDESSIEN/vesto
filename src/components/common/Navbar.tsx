import React from 'react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    walletConnected,
    walletAddress,
    monadBalance,
    walletType,
    userHandle,
    connectWallet,
    disconnectWallet,
    notification,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-primary text-on-primary border-b border-primary-container shadow-md">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRole('seller')}>
            <div className="w-9 h-9 rounded-lg bg-tertiary-fixed text-primary flex items-center justify-center font-headline font-bold text-xl shadow-sm">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-extrabold text-lg tracking-tight leading-none text-white">
                ADVANCE
              </span>
              <span className="text-[10px] text-on-primary-container uppercase tracking-widest font-semibold mt-0.5">
                Modern Agrarian Capital
              </span>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <div className="bg-primary-container p-1 rounded-full border border-secondary/30 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setCurrentRole('seller')}
              className={`px-4 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                currentRole === 'seller'
                  ? 'bg-tertiary-fixed text-primary shadow-sm'
                  : 'text-on-primary-container hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              <span>Seller</span>
            </button>

            <button
              onClick={() => setCurrentRole('lender')}
              className={`px-4 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                currentRole === 'lender'
                  ? 'bg-tertiary-fixed text-primary shadow-sm'
                  : 'text-on-primary-container hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              <span>Lender</span>
            </button>

            <button
              onClick={() => setCurrentRole('admin')}
              className={`px-4 py-1.5 rounded-full font-label-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                currentRole === 'admin'
                  ? 'bg-tertiary-fixed text-primary shadow-sm'
                  : 'text-on-primary-container hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Admin</span>
            </button>
          </div>

          {/* Monad Web3 / Privy MPC Wallet Pill */}
          <div className="flex items-center gap-3">
            {walletConnected ? (
              <div
                onClick={connectWallet}
                className="flex items-center gap-2.5 bg-primary-container border border-success-shamrock/40 rounded-full px-3.5 py-1.5 cursor-pointer hover:border-success-shamrock transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-success-shamrock animate-pulse shrink-0"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-label-sm text-[11px] text-success-shamrock font-bold leading-tight">
                      {monadBalance}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-secondary-container/40 text-inverse-primary rounded-full uppercase font-semibold">
                      {walletType === 'embedded' ? 'Embedded MPC' : 'External'}
                    </span>
                  </div>
                  <span className="font-body-sm text-[10px] text-on-primary-container leading-tight">
                    {userHandle ? userHandle : walletAddress}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectWallet();
                  }}
                  title="Disconnect Wallet"
                  className="ml-1 text-on-primary-container hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">power_settings_new</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-success-shamrock text-white px-4 py-1.5 rounded-full font-label-md text-xs font-bold hover:bg-success-shamrock/90 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>Sign In / Connect</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`w-full text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-success-shamrock text-white'
              : notification.type === 'warning'
              ? 'bg-warning-amber-soft text-primary'
              : 'bg-primary-container text-inverse-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'warning' ? 'warning' : 'info'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}
    </header>
  );
};
