import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const RiskDisclosure: React.FC = () => {
  const { setLenderView, showToast, lender, setLenderProfile } = useApp();
  const [agreed1, setAgreed1] = useState(lender.riskAccepted);
  const [agreed2, setAgreed2] = useState(lender.riskAccepted);

  const handleAgree = () => {
    setLenderProfile({ riskAccepted: true });
    showToast('Risk Disclosure Acknowledged! Launching Marketplace Tour.', 'success');
    setLenderView('guided_tour');
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setLenderView('signup')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider">STEP 2 OF 3</span>
        <div className="w-10"></div>
      </div>

      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-primary-container">Plain Language Risk Disclosure</h1>
        <p className="font-body-md text-sm text-secondary mt-1">
          Clear, unvarnished disclosure of mechanics, risk waterfalls, and default safeguards.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {/* Risk Card 1 */}
        <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-warning-amber-soft bg-tertiary-container p-1 rounded-md text-base">warning</span>
            <span>Credit Risk & Delinquency</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Invoices represent real short-term commercial obligations (30-90 days). While buyers are vetted corporate entities, delays can occur. Liquidity reserves cushion initial defaults up to 5% of total pool volume.
          </p>
        </div>

        {/* Risk Card 2 */}
        <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-success-shamrock bg-success-shamrock/10 p-1 rounded-md text-base">shield</span>
            <span>First-Loss Capital Protection</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Advance maintains a 10% First-Loss Protection tranche funded by platform protocol fees to protect senior lender capital against fraud or buyer insolvencies.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle flex flex-col gap-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed1}
              onChange={(e) => setAgreed1(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <span className="text-xs text-on-surface-variant leading-tight">
              I understand that invoice factoring yield is variable and tied to merchant repayment performance.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed2}
              onChange={(e) => setAgreed2(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <span className="text-xs text-on-surface-variant leading-tight">
              I accept the Smart Contract execution terms on Arc Testnet.
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={handleAgree}
        disabled={!agreed1 || !agreed2}
        className={`w-full h-13 font-label-lg font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 py-3 ${
          agreed1 && agreed2
            ? 'bg-primary text-white hover:bg-primary-container active:scale-[0.98]'
            : 'bg-surface-container text-secondary cursor-not-allowed'
        }`}
      >
        <span>Accept & Enter Marketplace</span>
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </div>
  );
};
