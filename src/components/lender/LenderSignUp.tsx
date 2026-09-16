import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const LenderSignUp: React.FC = () => {
  const { setLenderView, loginWithEmailOrPhone, connectExternalWallet, showToast } = useApp();
  const [accountType, setAccountType] = useState<'individual' | 'institutional'>('institutional');
  const [fullName, setFullName] = useState('Standard Agrarian Yield Fund');
  const [email, setEmail] = useState('invest@agrarian-capital.io');
  const [targetAllocation, setTargetAllocation] = useState<number>(50000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithEmailOrPhone(email);
    showToast('Lender Account Created! Embedded MPC Wallet provisioned (Zero seed phrases).', 'success');
    setLenderView('risk_disclosure');
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Context Banner */}
      <div className="flex items-center gap-2 bg-secondary-container px-4 py-3 rounded-xl shadow-sm mb-6 border border-secondary-container/80">
        <span className="material-symbols-outlined text-primary text-lg shrink-0">account_balance</span>
        <p className="font-label-sm text-xs text-primary leading-snug">
          Lender Portal — Deploy capital into real-world commodity invoice pools on Monad.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-semibold">
            1
          </span>
          <span className="font-label-sm text-xs text-secondary uppercase tracking-wider">
            Step 1 of 3 · Liquidity Provider Onboarding
          </span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">
          Create Liquidity Provider Account
        </h1>
        <p className="font-body-md text-sm text-secondary">
          Embedded Monad wallet created automatically via email. No seed phrase required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Account Type Tabs */}
        <div className="grid grid-cols-2 gap-3 bg-surface-container p-1.5 rounded-xl border border-border-subtle">
          <button
            type="button"
            onClick={() => setAccountType('individual')}
            className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              accountType === 'individual'
                ? 'bg-white text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">person</span>
            <span>Individual Investor</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('institutional')}
            className={`py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              accountType === 'institutional'
                ? 'bg-white text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">corporate_fare</span>
            <span>Institutional Fund</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant">
              Entity or Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant">
              Corporate / Personal Email (Creates Embedded Wallet)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant">
              Target Capital Pool Allocation ($ USD)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-secondary font-bold text-sm">$</span>
              <input
                type="number"
                min="500"
                step="500"
                required
                value={targetAllocation}
                onChange={(e) => setTargetAllocation(Number(e.target.value))}
                className="w-full h-12 pl-8 pr-3 rounded-lg bg-surface-container-lowest font-headline font-bold text-base text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-13 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 py-3"
        >
          <span>Create Account & Provision Embedded Wallet</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>

        {/* External Wallet Option */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => connectExternalWallet('MetaMask')}
            className="text-xs text-secondary font-semibold hover:text-primary transition-colors underline"
          >
            Connect Existing Web3 Wallet (MetaMask / Coinbase / WalletConnect)
          </button>
        </div>
      </form>
    </div>
  );
};
