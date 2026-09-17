import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SellerOnboardingTutorial: React.FC = () => {
  const { setSellerView } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Submit Unpaid Invoices',
      icon: 'description',
      description: 'Upload invoices issued to buyers with 30-90 day payment terms. Get instant AI validation.',
      detail: 'Advance accepts commercial invoices, bills of lading, and delivery receipts.',
    },
    {
      title: 'Receive Instant Cash Advance',
      icon: 'payments',
      description: 'Get up to 85% of your invoice value transferred to your Mobile Money or Bank within minutes.',
      detail: 'Zero debt created on your balance sheet — this is immediate factoring liquidity.',
    },
    {
      title: 'Buyer Settles directly on Arc',
      icon: 'account_balance',
      description: 'Your buyer pays the invoice on due date. The remaining 15% balance (minus minor fee) is released to you.',
      detail: 'Fully transparent liquidity pools managed by smart contracts on Arc.',
    },
    {
      title: 'Grow Your Credit Limit',
      icon: 'trending_up',
      description: 'Each on-time invoice settlement increases your credit limit automatically up to $5,000+.',
      detail: 'Unlock Tier 2 and institutional credit lines as your trading history grows.',
    },
  ];

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSellerView('dashboard')}
          className="text-xs font-semibold text-secondary hover:text-primary"
        >
          Skip Tutorial
        </button>
        <span className="font-label-sm text-xs text-primary font-bold">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      {/* Step Card */}
      <div className="bg-surface-card rounded-2xl p-6 shadow-md border border-border-subtle mb-6 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container text-white flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-3xl">{steps[currentStep].icon}</span>
        </div>

        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          {steps[currentStep].title}
        </h2>
        <p className="font-body-md text-sm text-secondary mb-4 leading-relaxed">
          {steps[currentStep].description}
        </p>

        <div className="w-full bg-surface-container-low p-3 rounded-xl border border-border-subtle text-left text-xs text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-success-shamrock text-base shrink-0">check_circle</span>
          <span>{steps[currentStep].detail}</span>
        </div>
      </div>

      {/* Step indicator dots */}
      <div className="flex justify-center items-center gap-2 mb-6">
        {steps.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
              idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-surface-container-high'
            }`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="flex-1 h-12 bg-surface-container text-primary font-label-lg font-bold rounded-xl hover:bg-surface-variant transition-all"
          >
            Previous
          </button>
        )}

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="flex-1 h-12 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container transition-all"
          >
            Next Step
          </button>
        ) : (
          <button
            onClick={() => setSellerView('submit_invoice')}
            className="flex-1 h-12 bg-success-shamrock text-white font-label-lg font-bold rounded-xl hover:bg-success-shamrock/90 transition-all flex items-center justify-center gap-2"
          >
            <span>Submit First Invoice</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
};
