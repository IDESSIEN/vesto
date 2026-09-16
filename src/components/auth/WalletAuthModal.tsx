import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const WalletAuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    loginWithEmailOrPhone,
    connectExternalWallet,
  } = useApp();

  const [authHandle, setAuthHandle] = useState('amina@nairobfresh.co');
  const [authMode, setAuthMode] = useState<'embedded' | 'external'>('embedded');

  if (!showAuthModal) return null;

  const handleEmbeddedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authHandle) return;
    loginWithEmailOrPhone(authHandle);
    setShowAuthModal(false);
  };

  const handleExternalConnect = (walletName: string) => {
    connectExternalWallet(walletName);
    setShowAuthModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 shadow-xl border border-border-subtle animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white font-bold flex items-center justify-center text-sm">
              A
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-primary">Monad Wallet Authentication</h3>
              <span className="text-[11px] text-secondary">Privy / Para Embedded MPC Integration</span>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-secondary hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('embedded')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'embedded'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">mail</span>
            <span>Email / Phone Sign-In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('external')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'external'
                ? 'bg-white text-primary shadow-sm font-bold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            <span>Existing Wallet</span>
          </button>
        </div>

        {/* Mode 1: Embedded MPC Wallet Creation (Zero Seed Phrases) */}
        {authMode === 'embedded' && (
          <form onSubmit={handleEmbeddedSubmit} className="flex flex-col gap-4">
            <div className="bg-success-shamrock/10 border border-success-shamrock/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-success-shamrock">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">shield</span>
              <div className="leading-snug">
                <strong className="block text-primary">Zero Seed Phrase Wallet</strong>
                <span>Privy MPC automatically creates your Monad wallet behind your email or phone number. No browser extensions or secret recovery phrases needed.</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-semibold text-on-surface-variant">Email Address or Mobile Phone</label>
              <input
                type="text"
                required
                value={authHandle}
                onChange={(e) => setAuthHandle(e.target.value)}
                placeholder="amina@nairobfresh.co or +254 712 345 678"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest font-body-md text-sm text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-1"
            >
              <span>Create Account & Embedded Wallet</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>
        )}

        {/* Mode 2: Connect Existing External Wallet */}
        {authMode === 'external' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-secondary mb-1">
              Connect your pre-existing Web3 wallet to interact with Monad Testnet:
            </p>

            <button
              onClick={() => handleExternalConnect('MetaMask')}
              className="w-full p-3 rounded-xl border border-border-subtle bg-surface-container-lowest hover:bg-surface-container-low transition-all flex items-center justify-between text-xs font-bold text-primary shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-warning-amber-soft text-on-tertiary-container flex items-center justify-center font-bold text-base">
                  🦊
                </span>
                <span>MetaMask Wallet</span>
              </div>
              <span className="text-secondary text-[11px]">Popular</span>
            </button>

            <button
              onClick={() => handleExternalConnect('Coinbase Wallet')}
              className="w-full p-3 rounded-xl border border-border-subtle bg-surface-container-lowest hover:bg-surface-container-low transition-all flex items-center justify-between text-xs font-bold text-primary shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-base">
                  C
                </span>
                <span>Coinbase Wallet</span>
              </div>
              <span className="text-secondary text-[11px]">Passkey / Extension</span>
            </button>

            <button
              onClick={() => handleExternalConnect('WalletConnect')}
              className="w-full p-3 rounded-xl border border-border-subtle bg-surface-container-lowest hover:bg-surface-container-low transition-all flex items-center justify-between text-xs font-bold text-primary shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-primary flex items-center justify-center font-bold text-base">
                  WC
                </span>
                <span>WalletConnect</span>
              </div>
              <span className="text-secondary text-[11px]">Mobile QR Scan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
