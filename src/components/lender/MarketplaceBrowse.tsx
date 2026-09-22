import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { useFundInvoice, useUSDCBalance } from '../../hooks/useVestoEscrow';
import { formatUSDC, explorerTxUrl } from '../../config/contracts';

/* ─────────────────────────────────────────────────────────────────
   RISK METER — horizontal bar with tooltip
───────────────────────────────────────────────────────────────── */
const RISK_COLOR = (s: number) => s >= 75 ? '#1A6645' : s >= 50 ? '#B8821E' : '#8C1A1A';
const RISK_LABEL = (s: number) => s >= 75 ? 'Low risk' : s >= 50 ? 'Medium risk' : 'High risk';

const RiskMeter: React.FC<{ score: number }> = ({ score }) => {
  const color = RISK_COLOR(score);
  const [tip, setTip] = useState(false);
  return (
    <div className="relative flex items-center gap-2" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <div
        className="h-[3px] rounded-full overflow-hidden flex-1"
        style={{ background: 'rgba(13,24,36,0.08)', minWidth: '52px' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: color, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </div>
      <span
        className="font-mono text-[10px] font-semibold font-tnum cursor-default"
        style={{ color }}
      >{score}</span>

      {tip && (
        <div
          className="absolute z-20 bottom-full right-0 mb-2 w-52 rounded-[9px] px-3 py-2.5 text-[10px] leading-relaxed pointer-events-none"
          style={{
            background: '#0D1824',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            color: 'rgba(255,255,255,0.70)',
          }}
        >
          <span className="font-semibold" style={{ color }}>{RISK_LABEL(score)} · {score}/100</span>
          <br />Based on buyer history, invoice age, and seller verification tier.{' '}
          <span style={{ color: '#1A6645' }}>70+</span> = low risk.
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   YIELD BADGE — split: gross APY + net after 2.8% platform fee
───────────────────────────────────────────────────────────────── */
const FEE_PCT = 2.8;
const YieldBadge: React.FC<{ pct: number }> = ({ pct }) => {
  const net = Math.max(0, pct - FEE_PCT).toFixed(1);
  return (
    <div
      className="shrink-0 flex flex-col gap-1 px-3 py-2.5 rounded-[11px]"
      style={{
        background: 'linear-gradient(160deg,rgba(184,130,30,0.09) 0%,rgba(184,130,30,0.03) 100%)',
        border: '1px solid rgba(184,130,30,0.18)',
        minWidth: '68px',
      }}
    >
      <div>
        <span
          className="font-mono text-[20px] font-bold font-tnum leading-none"
          style={{ color: '#B8821E', letterSpacing: '-0.025em' }}
        >
          {net}%
        </span>
        <span
          className="text-[8px] font-semibold uppercase tracking-[0.09em] ml-0.5"
          style={{ color: 'rgba(184,130,30,0.50)' }}
        >
          net
        </span>
      </div>
      <span
        className="text-[9px] font-medium"
        style={{ color: 'rgba(184,130,30,0.50)' }}
      >
        {pct}% gross · {FEE_PCT}% fee
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   INVOICE CARD
───────────────────────────────────────────────────────────────── */
const InvoiceCard: React.FC<{
  inv: Invoice;
  selected: boolean;
  onToggle: () => void;
  onFund: () => void;
  lenderPosition?: number; // USDC already deployed by this lender into this invoice
}> = ({ inv, selected, onToggle, onFund, lenderPosition }) => {
  const [hovered, setHovered] = useState(false);
  // One-liner thesis — the single most important trust signal on the card
  const thesis = `${inv.termDays}d trade receivable · ${inv.buyerName} · ${inv.riskTier} risk`;

  return (
    <div
      className="relative rounded-[15px] overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--cream)',
        border: selected
          ? '1.5px solid rgba(184,130,30,0.55)'
          : hovered
          ? '1px solid rgba(13,24,36,0.16)'
          : '1px solid var(--border)',
        boxShadow: selected
          ? 'var(--shadow-e2), 0 0 0 3px rgba(184,130,30,0.09)'
          : hovered
          ? 'var(--shadow-e3)'
          : 'var(--shadow-e1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left border accent = seller tier quality indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: RISK_COLOR(inv.riskScore) }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Top row: seller info + yield + checkbox */}
        <div className="flex items-start gap-3 mb-4">
          {/* Checkbox */}
          <button
            onClick={onToggle}
            className="mt-0.5 w-5 h-5 rounded-[5px] shrink-0 flex items-center justify-center transition-all duration-150"
            style={selected
              ? { background: '#B8821E', border: '1.5px solid #B8821E' }
              : { background: 'transparent', border: '1.5px solid rgba(13,24,36,0.20)' }
            }
            aria-label="Select for batch"
          >
            {selected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Seller name + thesis one-liner + risk */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span
                className="font-display text-[15px] font-semibold text-ink leading-tight"
                style={{ letterSpacing: '-0.018em' }}
              >
                {inv.sellerBusinessName}
              </span>
              {/* Tier badge as trust signal */}
              <span
                className="text-[8.5px] font-bold uppercase tracking-[0.07em] px-1.5 py-0.5 rounded-[4px]"
                style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
              >
                T{inv.sellerVerificationTier ?? 1}
              </span>
            </div>
            {/* One-liner thesis */}
            <p className="text-[10.5px] font-medium" style={{ color: 'var(--ink-subtle)' }}>{thesis}</p>
            <div className="mt-2 w-28">
              <RiskMeter score={inv.riskScore} />
            </div>
          </div>

          <YieldBadge pct={inv.expectedYieldPct} />
        </div>

        {/* Metrics strip — Morpho-style: spacing separates, no interior borders */}
        <div
          className="flex flex-wrap items-start gap-x-5 gap-y-2 mb-3 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[
            { label: 'Invoice', value: `$${inv.amount.toLocaleString()} USDC`, mono: true },
            { label: 'Advance', value: `$${inv.advanceAmount.toLocaleString()} (${inv.advanceRatePct}%)`, mono: true },
            { label: 'Term', value: `${inv.termDays}d`, mono: false },
            { label: 'Due', value: inv.dueDate, mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span
                className="text-[8px] uppercase font-semibold"
                style={{ color: 'var(--ink-faint)', letterSpacing: '0.09em' }}
              >
                {label}
              </span>
              <span
                className={`text-[12.5px] font-semibold text-ink leading-snug ${mono ? 'font-mono font-tnum' : ''}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Inline lender position strip — only shown when this lender has already funded */}
        {lenderPosition !== undefined && lenderPosition > 0 && (
          <div className="position-strip mb-2">
            <span className="position-strip-label">Your position</span>
            <span className="position-strip-value">${lenderPosition.toLocaleString()} USDC deployed</span>
          </div>
        )}

        {/* Bottom: doc + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--ink-faint)' }}>
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
              <rect x="1" y="1" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
              <path d="M3 4.5h5M3 7h5M3 9.5h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] truncate max-w-[120px]">
              {inv.docName || 'commercial_invoice.pdf'}
            </span>
          </div>

          <button
            onClick={onFund}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[12px] font-semibold transition-all duration-150 active:scale-[0.96]"
            style={{
              background: 'linear-gradient(135deg,#B8821E,#D4A032)',
              color: '#fff',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            Fund ${inv.advanceAmount.toLocaleString()}
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 5.5h9M6.5 1.5L10 5.5l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   FUNDING MODAL
───────────────────────────────────────────────────────────────── */
const FundingModal: React.FC<{
  inv: Invoice;
  usdcBalance: bigint | undefined;
  isConnected: boolean;
  step: string;
  txHash?: string;
  isConfirming: boolean;
  isSuccess: boolean;
  errorMsg: string;
  onFund: () => void;
  onClose: () => void;
}> = ({ inv, usdcBalance, isConnected, step, txHash, isConfirming, isSuccess, errorMsg, onFund, onClose }) => {
  const insufficient = isConnected && usdcBalance !== undefined && usdcBalance < BigInt(Math.round(inv.advanceAmount * 1e6));
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(5,11,20,0.80)', backdropFilter: 'blur(10px) saturate(120%)' }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[420px] rounded-[20px] overflow-hidden animate-fade-up"
        style={{
          background: 'var(--canvas)',
          boxShadow: '0 40px 100px rgba(5,11,20,0.65), 0 0 0 1px rgba(184,130,30,0.18)',
        }}
      >
        {/* Gold strip */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#B8821E 30%,#E9BE68 60%,#B8821E 85%,transparent)' }} />

        <div className="px-5 pt-5 pb-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-1" style={{ color: 'var(--ink-faint)' }}>
                Deploying capital
              </p>
              <h3
                className="font-display text-[17px] font-bold text-ink"
                style={{ letterSpacing: '-0.022em', lineHeight: 1.2 }}
              >
                {inv.sellerBusinessName}
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-subtle)' }}>
                {inv.sellerCategory} · {inv.riskTier} grade
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(13,24,36,0.07)]"
              style={{ border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Deal facts — Morpho-style: yield split into gross / fee / net */}
          <div
            className="rounded-[11px] overflow-hidden divide-y"
            style={{ border: '1px solid var(--border)' }}
          >
            {([
              ['Buyer offtaker', inv.buyerName, false],
              ['Gross APY', `${inv.expectedYieldPct}%`, true],
              ['Platform fee', `${FEE_PCT}%`, false],
              ['Net APY to you', `${Math.max(0, inv.expectedYieldPct - FEE_PCT).toFixed(1)}%`, true],
              ['Term', `${inv.termDays}d · due ${inv.dueDate}`, false],
              ['Risk', `${RISK_LABEL(inv.riskScore)} · ${inv.riskScore}/100`, false],
            ] as [string, string, boolean][]).map(([label, value, isGold]) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: 'var(--cream)' }}
              >
                <span className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>{label}</span>
                <span
                  className="text-[12px] font-semibold font-tnum"
                  style={{ color: isGold ? '#B8821E' : 'var(--ink)' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Capital card */}
          <div
            className="relative rounded-[15px] px-5 pt-5 pb-4 overflow-hidden grain-overlay"
            style={{
              background: 'linear-gradient(160deg,#0D1824 0%,#1A2A3E 100%)',
              boxShadow: '0 2px 12px rgba(5,11,20,0.20)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg,#B8821E,#E9BE68)' }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.022]"
              style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '18px 18px' }}
            />
            <div className="relative flex items-end justify-between">
              <div>
                <p className="text-[8px] uppercase tracking-[0.12em] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Capital required
                </p>
                <p
                  className="font-mono font-bold text-white font-tnum"
                  style={{ fontSize: '30px', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  ${inv.advanceAmount.toLocaleString()}
                  <span className="text-[12px] font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>USDC</span>
                </p>
              </div>
              {isConnected && usdcBalance !== undefined && (
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.12em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Your balance
                  </p>
                  <p className="font-mono text-[13px] font-semibold text-white font-tnum">
                    {formatUSDC(usdcBalance)}
                  </p>
                </div>
              )}
            </div>

            {/* Perforation */}
            <div className="relative mt-4">
              <div className="absolute left-[-21px] top-[-8px] w-4 h-4 rounded-full" style={{ background: 'var(--canvas)' }} />
              <div className="absolute right-[-21px] top-[-8px] w-4 h-4 rounded-full" style={{ background: 'var(--canvas)' }} />
              <div className="perforation" />
            </div>

            {/* Step indicators */}
            <div className="relative flex items-center gap-3 mt-4">
              {['USDC approval', 'Fund invoice'].map((label, i) => {
                const active = (i === 0 && step === 'approving') || (i === 1 && (step === 'funding' || isConfirming));
                const done = (i === 0 && (step === 'funding' || isConfirming || isSuccess)) || (i === 1 && isSuccess);
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={done
                        ? { background: '#EBF5F0', color: '#1A6645' }
                        : active
                        ? { background: '#B8821E', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.40)' }
                      }
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="text-[9px] font-medium" style={{ color: active ? '#E9BE68' : done ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.28)' }}>
                      {label}
                    </span>
                    {i === 0 && <div className="w-5 h-px mx-1" style={{ background: 'rgba(255,255,255,0.12)' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction status */}
          {(step === 'approving' || step === 'funding' || isConfirming) && (
            <div
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-[9px]"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' }}
            >
              <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(99,102,241,0.25)" strokeWidth="1.5"/>
                <path d="M6.5 1A5.5 5.5 0 0 1 12 6.5" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[11px] font-medium" style={{ color: '#818CF8' }}>
                {step === 'approving'
                  ? 'Step 1 of 2 — Approve USDC in your wallet'
                  : 'Step 2 of 2 — Confirm the funding transaction'}
              </span>
            </div>
          )}

          {isSuccess && txHash && (
            <div
              className="flex flex-col items-center gap-2 py-5 rounded-[13px]"
              style={{ background: '#EBF5F0', border: '1px solid rgba(26,102,69,0.18)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,102,69,0.15)' }}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M2.5 8.5L6.5 12.5L14.5 4.5" stroke="#1A6645" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[13px] font-semibold" style={{ color: '#1A6645' }}>Capital deployed on Arc</p>
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] underline-offset-2 underline"
                style={{ color: '#1A6645', opacity: 0.7 }}
              >
                View on ArcScan ↗
              </a>
            </div>
          )}

          {step === 'error' && errorMsg && (
            <p
              className="text-center text-[11px] font-medium py-2 rounded-[9px]"
              style={{ color: '#8C1A1A', background: '#FBE8E8', border: '1px solid rgba(140,26,26,0.15)' }}
            >
              {errorMsg}
            </p>
          )}

          {/* Primary CTA */}
          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectKitButton label="Connect wallet to deploy" />
            </div>
          ) : insufficient ? (
            <div
              className="flex items-start gap-3 px-4 py-3.5 rounded-[11px]"
              style={{ background: '#FBE8E8', border: '1.5px solid rgba(140,26,26,0.18)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                <circle cx="7" cy="7" r="6" stroke="#8C1A1A" strokeWidth="1.3"/>
                <path d="M7 4.5v3.5" stroke="#8C1A1A" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="7" cy="10" r="0.7" fill="#8C1A1A"/>
              </svg>
              <div>
                <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#8C1A1A' }}>Not enough USDC</p>
                <p className="text-[11px] leading-relaxed" style={{ color: '#8C1A1A', opacity: 0.75 }}>
                  You need ${inv.advanceAmount.toLocaleString()} USDC. Get test USDC from the Arc Studio sidebar.
                </p>
              </div>
            </div>
          ) : step === 'idle' || step === 'error' ? (
            <button
              onClick={onFund}
              className="w-full h-[52px] rounded-[11px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#B8821E 0%,#D4A032 100%)',
                boxShadow: 'var(--shadow-gold)',
                letterSpacing: '-0.01em',
              }}
            >
              Deploy ${inv.advanceAmount.toLocaleString()} USDC
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 7h11M8 2.5L12.5 7 8 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <button disabled className="w-full h-[52px] rounded-[11px] text-[13px] font-medium text-ink/40 flex items-center justify-center gap-2 cursor-not-allowed"
              style={{ background: 'rgba(13,24,36,0.05)', border: '1px solid var(--border)' }}>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(13,24,36,0.12)" strokeWidth="1.5"/>
                <path d="M6.5 1A5.5 5.5 0 0 1 12 6.5" stroke="rgba(13,24,36,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Processing on Arc
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export const MarketplaceBrowse: React.FC = () => {
  const { invoices, fundInvoiceLender, setLenderView, lender, setSelectedBatchIds } = useApp();
  const { isConnected } = useAccount();
  const { raw: usdcBalance } = useUSDCBalance();
  const { execute, step, txHash, isConfirming, isSuccess, errorMsg, reset } = useFundInvoice();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<Invoice | null>(null);

  /* Risk disclosure gate */
  if (!lender.riskAccepted) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center gap-5 py-20 px-4 text-center animate-fade-up">
        <div
          className="w-14 h-14 rounded-[15px] flex items-center justify-center"
          style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#B8821E" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M12 12v5" stroke="#B8821E" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="8.5" r="0.75" fill="#B8821E"/>
          </svg>
        </div>
        <div>
          <h2 className="font-display text-[18px] font-bold text-ink mb-2" style={{ letterSpacing: '-0.022em' }}>
            Review risk disclosure first
          </h2>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            You must read and accept the platform risk disclosure before accessing investment opportunities.
          </p>
        </div>
        <button
          onClick={() => setLenderView('risk_disclosure')}
          className="btn-primary px-6 py-3"
        >
          Read risk disclosure
        </button>
      </div>
    );
  }

  /* Derived */
  const live = invoices.filter(i => i.status === 'published_marketplace');
  const totalPool = live.reduce((s, i) => s + i.amount, 0);
  const avgYield = live.length
    ? (live.reduce((s, i) => s + i.expectedYieldPct, 0) / live.length).toFixed(1)
    : '--';
  const avgRisk = live.length
    ? Math.round(live.reduce((s, i) => s + i.riskScore, 0) / live.length)
    : 0;

  const allocationFiltered = lender.targetAllocation > 0
    ? live.filter(i => i.advanceAmount <= lender.targetAllocation)
    : live;

  const displayed = allocationFiltered.filter(inv => {
    const q = search.toLowerCase();
    const textMatch = inv.sellerBusinessName.toLowerCase().includes(q) ||
      inv.buyerName.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q);
    if (!textMatch) return false;
    if (filter === 'All') return true;
    if (filter === 'High Yield') return inv.expectedYieldPct >= 15;
    if (filter === 'Short Term') return inv.termDays <= 45;
    return inv.sellerCategory.toLowerCase().includes(filter.toLowerCase());
  });

  const toggleSelect = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleFund = async (inv: Invoice) => {
    if (!isConnected) return;
    fundInvoiceLender(inv.id);
    const addr = ('0x' + inv.sellerId.replace(/[^a-fA-F0-9]/g, '').padStart(40, '0')) as `0x${string}`;
    await execute(inv.id, addr, inv.advanceAmount);
  };

  const FILTERS = ['All', 'Agri Exporter', 'High Yield', 'Short Term', 'Cold Chain'];

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-7 sm:py-10 flex flex-col gap-7 pb-32 animate-fade-up">

      {/* ── Pool hero ────────────────────────────────────────────── */}
      <section
        className="relative rounded-[20px] overflow-hidden text-white grain-overlay vesto-hero gold-strip"
      >
        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-60px', left: '-60px',
            width: '380px', height: '380px',
            background: 'radial-gradient(circle,rgba(184,130,30,0.07) 0%,transparent 60%)',
          }}
        />
        {/* Dot matrix */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.032) 1px,transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative px-6 pt-6 pb-5">
          {/* Label row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Vesto Marketplace · Arc Testnet
            </p>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[9px] font-semibold"
              style={{ background: 'rgba(26,102,69,0.20)', color: '#6EE7B7', border: '1px solid rgba(26,102,69,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse-live_2s_ease-in-out_infinite] shrink-0" />
              {live.length} live
            </div>
          </div>

          {/* Pool total */}
          <p className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Total pool volume
          </p>
          <div className="flex items-end gap-2 mb-5">
            <span
              className="font-mono font-bold text-white font-tnum leading-[0.95]"
              style={{ fontSize: 'clamp(36px,7vw,54px)', letterSpacing: '-0.045em' }}
            >
              ${totalPool.toLocaleString()}
            </span>
            <span className="text-[14px] font-normal mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>USDC</span>
          </div>

          {/* Deployment health bar */}
          <div className="mb-4">
            <div
              className="flex justify-between text-[9px] font-semibold uppercase tracking-[0.08em] mb-1.5"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              <span>Pool deployed</span>
              <span className="font-mono font-tnum">
                {live.length > 0 ? Math.round((live.filter(i => i.status === 'funded').length / live.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${live.length > 0 ? Math.round((live.filter(i => i.status === 'funded').length / live.length) * 100) : 0}%`,
                  background: 'linear-gradient(90deg,#1A6645,#6EE7B7)',
                  transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
          </div>

          {/* Perforation */}
          <div className="relative my-4">
            <div className="absolute rounded-full" style={{ left: '-26px', top: '-8px', width: '16px', height: '16px', background: 'var(--canvas)' }} />
            <div className="absolute rounded-full" style={{ right: '-26px', top: '-8px', width: '16px', height: '16px', background: 'var(--canvas)' }} />
            <div className="perforation" />
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              {[
                { label: 'Avg APY', value: `${avgYield}%`, gold: true },
                { label: 'Avg risk', value: `${avgRisk}/100` },
                { label: 'Finality', value: '<1s' },
              ].map(({ label, value, gold }) => (
                <div key={label}>
                  <p className="text-[8px] uppercase tracking-[0.10em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {label}
                  </p>
                  <p
                    className="font-mono text-[16px] font-semibold font-tnum"
                    style={{ color: gold ? '#E9BE68' : 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em' }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLenderView('tour')}
                className="h-8 px-3 rounded-[7px] text-[10px] font-medium transition-all duration-150 hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Tour
              </button>
              {isConnected ? (
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.10em] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Balance</p>
                  <p className="font-mono text-[14px] font-semibold text-white font-tnum">
                    {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '--'}
                  </p>
                </div>
              ) : (
                <ConnectKitButton label="Connect" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Search + filters ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 14 14" fill="none"
            >
              <circle cx="6" cy="6" r="5" stroke="rgba(13,24,36,0.30)" strokeWidth="1.3"/>
              <path d="M10 10l3 3" stroke="rgba(13,24,36,0.30)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by seller, buyer, or invoice ID"
              className="input w-full h-[46px] pl-10 pr-4 text-[13px]"
            />
          </div>

          {/* Batch CTA */}
          {selected.length > 0 && (
            <button
              onClick={() => { setSelectedBatchIds(selected); setLenderView('batch'); }}
              className="btn-primary h-[46px] px-4 text-[12px] shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-1.5">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="7" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="1" y="7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="7" y="7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              Batch {selected.length}
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 px-3.5 py-1.5 rounded-[7px] text-[11px] font-medium transition-all duration-150"
              style={filter === f
                ? { background: 'var(--ink)', color: '#fff' }
                : { background: 'var(--cream)', color: 'var(--ink-muted)', border: '1px solid var(--border-2)' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoice cards ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {displayed.length === 0 ? (
          <div
            className="flex flex-col items-center py-16 rounded-[15px]"
            style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-11 h-11 rounded-[11px] flex items-center justify-center mb-3"
              style={{ background: 'var(--gold-bg)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="#B8821E" strokeWidth="1.4"/>
                <path d="M14 14l4 4" stroke="#B8821E" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 6.5v5M6.5 9h5" stroke="#B8821E" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-ink mb-1">
              {live.length === 0 ? 'Pool is empty right now' : 'No matches for that filter'}
            </p>
            <p className="text-[11px] max-w-[240px] text-center leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
              {live.length === 0
                ? 'Verified sellers submit invoices every day. Advances typically clear admin review in under 2 hours.'
                : 'Try a different category or clear the search to see all live invoices.'}
            </p>
          </div>
        ) : (
          displayed.map(inv => (
            <InvoiceCard
              key={inv.id}
              inv={inv}
              selected={selected.includes(inv.id)}
              onToggle={() => toggleSelect(inv.id)}
              onFund={() => { reset(); setModal(inv); }}
              lenderPosition={inv.fundedByLenderId === lender.id ? inv.advanceAmount : undefined}
            />
          ))
        )}
      </div>

      {/* ── Funding modal ────────────────────────────────────────── */}
      {modal && (
        <FundingModal
          inv={modal}
          usdcBalance={usdcBalance}
          isConnected={isConnected}
          step={step}
          txHash={txHash}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
          errorMsg={errorMsg}
          onFund={() => handleFund(modal)}
          onClose={() => { setModal(null); reset(); }}
        />
      )}
    </div>
  );
};
