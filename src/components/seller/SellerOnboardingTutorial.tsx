import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="6"/><path d="M4.5 7l2 2 3-3"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5h7M7 3l3.5 3.5L7 10"/>
  </svg>
);
const ArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 6.5H3M6 10 2.5 6.5 6 3"/>
  </svg>
);

// Per-step icons — inline SVG, no Material Symbols
const StepIcons = [
  // Upload document
  () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 20V11"/><path d="M10 14l4-4 4 4"/>
      <rect x="3" y="3" width="22" height="16" rx="2.5"/>
      <path d="M3 23h22"/>
    </svg>
  ),
  // Cash / payment
  () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="22" height="14" rx="2.5"/>
      <circle cx="14" cy="14" r="3.5"/>
      <path d="M3 11h4M21 11h4M3 17h4M21 17h4"/>
    </svg>
  ),
  // Onchain settlement
  () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14h18M14 5v18"/>
      <circle cx="14" cy="14" r="10"/>
      <path d="M10 10c1-2 7-2 8 0s-1 4-4 4-5 2-4 4 7 2 8 0"/>
    </svg>
  ),
  // Trending up / credit growth
  () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l6-7 4 4 10-11"/>
      <path d="M18 6h6v6"/>
    </svg>
  ),
];

const steps = [
  {
    title: 'Submit your unpaid invoices',
    description: 'Upload invoices issued to buyers with 30–90 day payment terms. Vesto\'s AI validates the document in seconds.',
    detail: 'Accepts commercial invoices, bills of lading, and delivery receipts.',
  },
  {
    title: 'Receive an immediate cash advance',
    description: 'Get up to 90% of the invoice face value advanced to your wallet within 24 hours of approval.',
    detail: 'No debt added to your balance sheet — this is receivables factoring, not a loan.',
  },
  {
    title: 'Buyer settles onchain',
    description: 'Your buyer pays on the due date. Vesto\'s hybrid settlement system detects payment automatically and releases your remaining balance.',
    detail: 'Fully transparent. Escrow is governed by a smart contract on Arc Testnet.',
  },
  {
    title: 'Grow your credit limit',
    description: 'Each on-time settlement builds your track record. Credit limits increase automatically — up to $5,000+ with Tier 2 verification.',
    detail: 'Institutional credit lines available for sellers with 6+ months of clean history.',
  },
];

export const SellerOnboardingTutorial: React.FC = () => {
  const { setSellerView, completeSellerTour } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = StepIcons[currentStep];

  return (
    <div className="max-w-[480px] mx-auto px-4 py-8 view-enter">

      {/* Top nav */}
      <div className="flex items-center justify-between mb-7">
        <button
          onClick={() => setSellerView('dashboard')}
          className="text-[11.5px] font-semibold transition-colors duration-150"
          style={{ color: 'var(--ink-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Skip
        </button>
        <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--ink-subtle)' }}>
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Progress track */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full cursor-pointer transition-all duration-300"
            style={i <= currentStep
              ? { background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }
              : { background: 'var(--border)' }
            }
            onClick={() => setCurrentStep(i)}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="relative rounded-[15px] overflow-hidden mb-6"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e2)' }}
      >
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="px-7 py-8 flex flex-col items-center text-center">
          {/* Icon tile */}
          <div
            className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
              boxShadow: '0 8px 20px rgba(201,146,42,0.30)',
              color: '#fff',
            }}
          >
            <Icon />
          </div>

          <h2
            className="font-display font-bold text-ink mb-3"
            style={{ fontSize: '22px', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            {step.title}
          </h2>
          <p className="text-[13.5px] leading-relaxed mb-5 max-w-[320px]" style={{ color: 'var(--ink-subtle)' }}>
            {step.description}
          </p>
          <div
            className="w-full px-4 py-3 rounded-[9px] text-left flex items-start gap-2.5"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: '#047857' }}><CheckIcon /></span>
            <span className="text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
              {step.detail}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2.5">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(p => p - 1)}
            className="flex-1 h-[50px] rounded-[11px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
            style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-subtle)', cursor: 'pointer' }}
          >
            <ArrowLeft /> Previous
          </button>
        )}
        {!isLast ? (
          <button
            onClick={() => setCurrentStep(p => p + 1)}
            className="btn-primary flex-1 h-[50px] rounded-[11px] text-[13.5px] justify-center gap-2"
          >
            Next <ArrowRight />
          </button>
        ) : (
          <button
            onClick={completeSellerTour}
            className="btn-primary flex-1 h-[50px] rounded-[11px] text-[13.5px] justify-center gap-2"
          >
            <CheckIcon /> Done
          </button>
        )}
      </div>
    </div>
  );
};
