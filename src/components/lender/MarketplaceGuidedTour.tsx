import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5h7M7 3l3.5 3.5L7 10"/>
  </svg>
);

// Per-step icons — all inline SVG
const StepIcons = [
  // Invoice / document check
  () => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-6z"/>
      <path d="M16 2v6h5"/><path d="M9 13l2.5 2.5 5-5"/>
    </svg>
  ),
  // Trending up
  () => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18l5.5-6 4 4 9-10"/>
      <path d="M16 5h7v7"/>
    </svg>
  ),
  // Batch / grid
  () => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5"/>
      <rect x="15" y="3" width="8" height="8" rx="1.5"/>
      <rect x="3" y="15" width="8" height="8" rx="1.5"/>
      <rect x="15" y="15" width="8" height="8" rx="1.5"/>
    </svg>
  ),
];

const steps = [
  {
    title: 'Real-world invoice batches',
    description: 'Invoices are uploaded by verified East African agricultural merchants with attached bills of lading and buyer acknowledgements.',
    stat: '14 open positions available',
    statColor: '#1A6645',
    statBg: 'rgba(26,102,69,0.08)',
    statBorder: 'rgba(26,102,69,0.18)',
  },
  {
    title: 'Predictable net yield',
    description: 'Earn 8.7%–15.2% net APY (after platform fee) depending on credit risk tier, term duration (15–90 days), and sector.',
    stat: '12.0% average net APY',
    statColor: '#B8821E',
    statBg: 'rgba(184,130,30,0.08)',
    statBorder: 'rgba(184,130,30,0.20)',
  },
  {
    title: 'Single-click or batch funding',
    description: 'Fund individual invoices or select multiple to deploy capital across diverse pools in one transaction. Settlement is instant onchain.',
    stat: 'Onchain · <1 second finality',
    statColor: '#1E4DB8',
    statBg: 'rgba(30,77,184,0.07)',
    statBorder: 'rgba(30,77,184,0.16)',
  },
];

export const MarketplaceGuidedTour: React.FC = () => {
  const { setLenderView } = useApp();
  const [activeStep, setActiveStep] = useState(0);

  const step = steps[activeStep];
  const Icon = StepIcons[activeStep];
  const isLast = activeStep === steps.length - 1;

  return (
    <div className="max-w-[480px] mx-auto px-4 py-8 view-enter">

      {/* Top nav */}
      <div className="flex items-center justify-between mb-7">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--ink-subtle)' }}>
          Marketplace tour
        </span>
        <button
          onClick={() => setLenderView('browse')}
          className="text-[11.5px] font-semibold transition-colors duration-150"
          style={{ color: 'var(--ink-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Skip
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-7">
        {steps.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setActiveStep(idx)}
            className="cursor-pointer rounded-full transition-all duration-300"
            style={{
              height: '6px',
              width: idx === activeStep ? '28px' : '6px',
              background: idx === activeStep ? '#C9922A' : 'var(--border-2)',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="rounded-[15px] overflow-hidden mb-6"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e2)' }}
      >
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="px-7 py-8 flex flex-col items-center text-center">
          {/* Icon tile */}
          <div
            className="w-[60px] h-[60px] rounded-[15px] flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
              boxShadow: '0 8px 20px rgba(201,146,42,0.28)',
              color: '#fff',
            }}
          >
            <Icon />
          </div>

          <h2
            className="font-display font-bold text-ink mb-3"
            style={{ fontSize: '21px', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            {step.title}
          </h2>
          <p className="text-[13.5px] leading-relaxed mb-5 max-w-[300px]" style={{ color: 'var(--ink-subtle)' }}>
            {step.description}
          </p>

          {/* Stat chip */}
          <div
            className="px-4 py-2.5 rounded-[9px] text-[12px] font-bold"
            style={{
              background: step.statBg,
              border: `1px solid ${step.statBorder}`,
              color: step.statColor,
            }}
          >
            {step.stat}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => isLast ? setLenderView('browse') : setActiveStep(s => s + 1)}
        className="btn-primary w-full h-[50px] rounded-[11px] text-[13.5px] justify-center gap-2"
      >
        {isLast ? 'Explore marketplace' : 'Next'} <ArrowRight />
      </button>
    </div>
  );
};
