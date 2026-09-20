import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SellerOnboardingTutorial: React.FC = () => {
  const { setSellerView, completeSellerTour } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Submit Unpaid Invoices',      icon: 'description',    description: 'Upload invoices issued to buyers with 30–90 day payment terms. Get instant AI validation.',               detail: 'Vesto accepts commercial invoices, bills of lading, and delivery receipts.' },
    { title: 'Receive Instant Cash Advance', icon: 'payments',       description: 'Get up to 85% of your invoice value advanced to your bank or mobile money within minutes.',             detail: 'Zero debt on your balance sheet - this is immediate factoring liquidity.' },
    { title: 'Buyer Settles on Arc',          icon: 'account_balance', description: 'Your buyer pays the invoice on due date. The remaining 15% (minus fee) is released to your wallet.', detail: 'Fully transparent liquidity pools governed by smart contracts on Arc.' },
    { title: 'Grow Your Credit Limit',       icon: 'trending_up',    description: 'Each on-time settlement increases your credit limit automatically up to $5,000+.',                      detail: 'Unlock Tier 2 and institutional credit lines as your history grows.' },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setSellerView('dashboard')}
          className="text-xs font-semibold text-secondary hover:text-primary transition-colors"
        >
          Skip Tutorial
        </button>
        <span className="text-xs font-bold text-primary mono">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Progress track */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full cursor-pointer transition-all duration-300"
            style={i <= currentStep
              ? { background: 'linear-gradient(90deg, #C9922A, #E8B96A)' }
              : { background: 'var(--surface-muted)', border: '1px solid var(--border)' }
            }
            onClick={() => setCurrentStep(i)}
          />
        ))}
      </div>

      {/* Card */}
      <div className="bg-surface-card rounded-2xl shadow-card border border-border-subtle overflow-hidden mb-6">
        {/* Gold strip */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #C9922A, #E8B96A)' }} />
        <div className="p-8 flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-gold"
            style={{ background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)' }}
          >
            <span className="material-symbols-outlined text-3xl text-white">{step.icon}</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-primary mb-3" style={{ letterSpacing: '-0.02em' }}>
            {step.title}
          </h2>
          <p className="text-sm text-secondary leading-relaxed mb-5 max-w-sm text-pretty">
            {step.description}
          </p>
          <div
            className="w-full p-3 rounded-xl text-left text-xs flex items-center gap-2"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
          >
            <span className="material-symbols-outlined text-success-shamrock text-base shrink-0">check_circle</span>
            <span className="text-secondary">{step.detail}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(p => p - 1)}
            className="flex-1 h-12 rounded-xl text-sm font-bold text-primary border border-border-strong transition-all hover:border-border-strong/60 active:scale-[0.98]"
            style={{ background: 'var(--surface-strong)' }}
          >
            Previous
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setCurrentStep(p => p + 1)}
            className="flex-1 h-12 rounded-xl text-sm font-bold text-white shadow-gold transition-all active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            Next Step
          </button>
        ) : (
          <button
            onClick={completeSellerTour}
            className="flex-1 h-12 rounded-xl text-sm font-bold text-white shadow-gold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)' }}
          >
            <span>Done - Back to Dashboard</span>
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </button>
        )}
      </div>
    </div>
  );
};
