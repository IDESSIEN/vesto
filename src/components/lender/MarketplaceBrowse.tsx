import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { useFundInvoice, useUSDCBalance } from '../../hooks/useVestoEscrow';
import { formatUSDC, explorerTxUrl } from '../../config/contracts';

const RiskBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#E8B96A' : '#EF4444';
  const label = score >= 75 ? 'Low Risk' : score >= 50 ? 'Medium Risk' : 'High Risk';
  return (
    <div className="flex items-center gap-2 group relative">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold font-tnum cursor-help" style={{ color }}>{score}</span>
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-1.5 w-56 bg-[#0A1628] border border-white/10 text-white text-[10px] rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed">
        <span className="font-bold" style={{ color }}>{label} · {score}/100</span>
        <br />Score based on buyer payment history, invoice age, and seller tier. <span style={{ color: '#10B981' }}>70+</span> = Low Risk.
      </div>
    </div>
  );
};

export const MarketplaceBrowse: React.FC = () => {
  const { invoices, fundInvoiceLender, setLenderView, lender, setSelectedBatchIds } = useApp();
  const { address: _address, isConnected } = useAccount();
  const { raw: usdcBalance } = useUSDCBalance();
  const { execute, step, txHash, isConfirming, isSuccess, errorMsg, reset } = useFundInvoice();

  const [searchTerm, setSearchTerm] = useState('');
  // H4: pre-seed category filter based on lender's target allocation
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [fundingModal, setFundingModal] = useState<Invoice | null>(null);

  // M3: gate behind risk disclosure acceptance
  if (!lender.riskAccepted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(201,146,42,0.10)' }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: '#C9922A' }}>gavel</span>
        </div>
        <div>
          <h2 className="font-headline text-xl font-extrabold text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>Risk Disclosure Required</h2>
          <p className="text-sm text-secondary max-w-xs mx-auto">You must review and accept the risk disclosure before accessing the marketplace and funding invoices.</p>
        </div>
        <button
          onClick={() => setLenderView('risk_disclosure')}
          className="px-6 py-3 rounded-xl text-sm font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg,#C9922A,#E8B96A)' }}
        >
          Review Risk Disclosure
        </button>
      </div>
    );
  }

  // H6: only show admin-approved invoices
  const openInvoices = invoices.filter(i => i.status === 'published_marketplace');
  const totalPool = openInvoices.reduce((s, i) => s + i.amount, 0);
  const avgYield = openInvoices.length
    ? (openInvoices.reduce((s, i) => s + i.expectedYieldPct, 0) / openInvoices.length).toFixed(1)
    : '-';
  const avgRisk = openInvoices.length
    ? Math.round(openInvoices.reduce((s, i) => s + i.riskScore, 0) / openInvoices.length)
    : 0;

  // H4: filter invoices affordable within lender's target allocation
  const allocationFiltered = lender.targetAllocation > 0
    ? openInvoices.filter(i => i.advanceAmount <= lender.targetAllocation)
    : openInvoices;

  const filteredInvoices = allocationFiltered.filter(inv => {
    const q = searchTerm.toLowerCase();
    const match = inv.sellerBusinessName.toLowerCase().includes(q) ||
      inv.buyerName.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q);
    if (selectedCategory === 'All') return match;
    if (selectedCategory === 'High Yield') return match && inv.expectedYieldPct >= 15;
    if (selectedCategory === 'Short Term') return match && inv.termDays <= 45;
    return match && inv.sellerCategory.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  // H3: balance sufficiency check
  const hasInsufficientBalance = (inv: Invoice) =>
    isConnected && usdcBalance !== undefined && usdcBalance < BigInt(Math.round(inv.advanceAmount * 1e6));

  const toggleSelect = (id: string) =>
    setSelectedInvoices(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleFund = async (inv: Invoice) => {
    if (!isConnected) return;
    fundInvoiceLender(inv.id);
    const sellerAddr = ('0x' + inv.sellerId.replace(/[^a-fA-F0-9]/g, '').padStart(40, '0')) as `0x${string}`;
    await execute(inv.id, sellerAddr, inv.advanceAmount);
  };

  const categories = ['All', 'Agri Exporter', 'High Yield', 'Short Term', 'Cold Chain'];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 flex flex-col gap-5 sm:gap-6 pb-32">

      {/* ── Hero Pool Banner ─────────────────────────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg,#0A1628 0%,#0D1F3C 50%,#112240 100%)',
          boxShadow: '0 20px 60px rgba(10,22,40,0.45), 0 0 0 1px rgba(201,146,42,0.18)',
        }}
      >
        {/* Gold strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg,transparent 0%,#C9922A 20%,#E8B96A 50%,#C9922A 80%,transparent 100%)' }}
        />
        {/* Glow */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(201,146,42,0.06) 0%,transparent 60%)', transform: 'translate(-25%,-40%)' }}
        />
        {/* Dot matrix */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="relative p-5 sm:p-7">
          {/* Live badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Vesto Marketplace · Arc Testnet
            </span>
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              {openInvoices.length} Live Opportunities
            </span>
          </div>

          {/* Pool volume */}
          <div className="mb-1" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
            Total Pool Volume
          </div>
          <div className="flex items-end gap-3 mb-5">
            <span
              className="font-headline font-extrabold text-white font-tnum leading-none"
              style={{ fontSize: 'clamp(38px,7vw,58px)', letterSpacing: '-0.04em' }}
            >
              ${totalPool.toLocaleString()}
            </span>
            <span className="text-lg font-medium mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>USDC</span>
          </div>

          {/* Pool health bar */}
          <div className="mb-5">
            <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Pool deployment</span>
              <span className="font-tnum">{openInvoices.length > 0 ? Math.round((openInvoices.filter(i=>i.status==='funded').length/openInvoices.length)*100) : 0}% funded</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${openInvoices.length > 0 ? Math.round((openInvoices.filter(i=>i.status==='funded').length/openInvoices.length)*100) : 0}%`,
                  background: 'linear-gradient(90deg,#10B981,#6EE7B7)',
                  transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
          </div>

          {/* Perforation */}
          <div className="relative mb-5">
            <div className="absolute -left-7 w-5 h-5 rounded-full" style={{ background: 'var(--canvas)', top: '-10px' }} />
            <div className="absolute -right-7 w-5 h-5 rounded-full" style={{ background: 'var(--canvas)', top: '-10px' }} />
            <div className="border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.10)' }} />
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 sm:gap-6">
              <div>
                <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg APY</div>
                <div className="font-headline font-extrabold text-lg font-tnum" style={{ color: '#E8B96A' }}>{avgYield}%</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg Risk</div>
                <div className="font-headline font-extrabold text-lg text-white font-tnum">{avgRisk}/100</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Finality</div>
                <div className="font-headline font-extrabold text-lg text-white">&lt;1s</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* M4: Tour link */}
              <button
                onClick={() => setLenderView('tour')}
                className="h-8 px-3 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <span className="material-symbols-outlined text-[13px]">help_outline</span>
                Tour
              </button>
              {isConnected ? (
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Your Balance</div>
                  <div className="font-headline font-bold text-base text-white font-tnum">
                    {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '-'} <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>USDC</span>
                  </div>
                </div>
              ) : (
                <ConnectKitButton label="Connect Wallet" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Search + Filters ─────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-lg pointer-events-none">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search seller, buyer, invoice ID…"
              className="w-full h-12 pl-11 pr-4 rounded-2xl text-sm text-primary border transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border)',
                boxShadow: '0 1px 3px rgba(10,22,40,0.04)',
              }}
            />
          </div>
          {selectedInvoices.length > 0 && (
            <button
              onClick={() => { setSelectedBatchIds(selectedInvoices); setLenderView('batch'); }}
              className="px-4 h-12 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#C9922A,#E8B96A)', boxShadow: '0 6px 16px rgba(201,146,42,0.30)' }}
            >
              <span className="material-symbols-outlined text-base">layers</span>
              Batch ({selectedInvoices.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all"
              style={selectedCategory === cat
                ? { background: 'linear-gradient(135deg,#C9922A,#E8B96A)', color: '#fff', boxShadow: '0 4px 12px rgba(201,146,42,0.25)' }
                : { background: 'var(--surface-card)', color: 'var(--secondary)', border: '1px solid var(--border)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoice Cards ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {filteredInvoices.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(201,146,42,0.08)' }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: '#C9922A' }}>search_off</span>
            </div>
            <p className="text-sm font-semibold text-primary mb-1">No opportunities found</p>
            <p className="text-xs text-secondary">Try a different filter or search term.</p>
          </div>
        ) : (
          filteredInvoices.map(inv => {
            const isSelected = selectedInvoices.includes(inv.id);
            return (
              <div
                key={inv.id}
                className="relative rounded-2xl overflow-hidden transition-all"
                style={{
                  background: 'var(--surface-card)',
                  border: isSelected ? '1.5px solid #C9922A' : '1px solid var(--border)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(201,146,42,0.10)' : '0 1px 4px rgba(10,22,40,0.05)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(10,22,40,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = isSelected ? '0 0 0 3px rgba(201,146,42,0.10)' : '0 1px 4px rgba(10,22,40,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Gold top accent */}
                <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />

                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(inv.id)}
                        className="mt-1 w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: '#C9922A' }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-headline font-extrabold text-base text-primary" style={{ letterSpacing: '-0.01em' }}>
                            {inv.sellerBusinessName}
                          </span>
                          <span className="material-symbols-outlined text-[15px]" style={{ color: '#10B981' }}>verified</span>
                        </div>
                        <span className="text-[11px] text-secondary">{inv.sellerCategory}</span>
                        <div className="mt-1.5 w-32">
                          <RiskBar score={inv.riskScore} />
                        </div>
                      </div>
                    </div>
                    {/* APY badge */}
                    <div
                      className="shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg,rgba(201,146,42,0.10) 0%,rgba(232,185,106,0.06) 100%)', border: '1px solid rgba(201,146,42,0.20)' }}
                    >
                      <span className="font-headline font-extrabold text-xl font-tnum" style={{ color: '#C9922A', letterSpacing: '-0.02em' }}>
                        {inv.expectedYieldPct}%
                      </span>
                      <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(201,146,42,0.7)' }}>APY</span>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                      { label: 'Buyer', value: inv.buyerName },
                      { label: 'Invoice Total', value: `$${inv.amount.toLocaleString()}`, mono: true },
                      { label: 'Advance', value: `$${inv.advanceAmount.toLocaleString()} (${inv.advanceRatePct}%)`, mono: true },
                      { label: 'Term', value: `${inv.termDays}d · ${inv.dueDate}` },
                    ].map(({ label, value, mono }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl"
                        style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-[9px] text-secondary uppercase tracking-widest font-semibold">{label}</span>
                        <span className={`text-xs font-bold text-primary truncate ${mono ? 'font-tnum' : ''}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-secondary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px]">description</span>
                      {inv.docName || 'commercial_invoice.pdf'}
                    </span>
                    <button
                      onClick={() => setFundingModal(inv)}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all active:scale-[0.97] flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg,#C9922A,#E8B96A)',
                        boxShadow: '0 4px 14px rgba(201,146,42,0.28)',
                      }}
                    >
                      Fund ${inv.advanceAmount.toLocaleString()} USDC
                      <span className="material-symbols-outlined text-sm">bolt</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Funding Modal ─────────────────────────────────────── */}
      {fundingModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(5,12,25,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: 'var(--surface-card)',
              boxShadow: '0 32px 80px rgba(5,12,25,0.6), 0 0 0 1px rgba(201,146,42,0.20)',
            }}
          >
            {/* Gold strip */}
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />

            <div className="p-6 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-headline font-extrabold text-lg text-primary" style={{ letterSpacing: '-0.025em' }}>
                    Confirm Funding
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">{fundingModal.sellerBusinessName} · {fundingModal.sellerCategory}</p>
                </div>
                <button
                  onClick={() => { setFundingModal(null); reset(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-secondary transition-all hover:text-primary"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Deal rows */}
              <div className="flex flex-col divide-y rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border)', border: '1px solid var(--border)' }}>
                {[
                  ['Buyer Offtaker', fundingModal.buyerName],
                  ['Expected Yield', `${fundingModal.expectedYieldPct}% APY`],
                  ['Term Duration', `${fundingModal.termDays} days · due ${fundingModal.dueDate}`],
                  ['Risk Score', `${fundingModal.riskScore}/100`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-secondary">{label}</span>
                    <span
                      className="text-xs font-bold text-primary"
                      style={label === 'Expected Yield' ? { color: '#C9922A' } : {}}
                    >{value}</span>
                  </div>
                ))}
              </div>

              {/* Capital card */}
              <div
                className="relative rounded-2xl p-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
                  boxShadow: '0 0 0 1px rgba(201,146,42,0.20)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
                <div className="absolute inset-0 opacity-[0.025]"
                  style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }}
                />
                <div className="relative flex items-end justify-between">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest font-semibold mb-1 text-white/40">Capital Required</div>
                    <div className="font-headline font-extrabold text-white font-tnum" style={{ fontSize: '32px', letterSpacing: '-0.03em' }}>
                      ${fundingModal.advanceAmount.toLocaleString()}
                      <span className="text-base font-medium ml-2 text-white/35">USDC</span>
                    </div>
                  </div>
                  {isConnected && usdcBalance !== undefined && (
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-widest font-semibold mb-1 text-white/40">Your Balance</div>
                      <div className="font-bold text-white font-tnum text-sm">{formatUSDC(usdcBalance)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction state */}
              {(step === 'approving' || step === 'funding' || isConfirming) && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
                >
                  <span className="material-symbols-outlined text-sm animate-spin" style={{ color: '#818CF8' }}>progress_activity</span>
                  <span className="text-xs font-semibold" style={{ color: '#818CF8' }}>
                    {step === 'approving' ? 'Step 1 of 2 - Approve USDC spend in wallet…'
                      : step === 'funding' ? 'Step 2 of 2 - Confirm funding transaction…'
                      : 'Waiting for Arc block confirmation…'}
                  </span>
                </div>
              )}
              {isSuccess && txHash && (
                <div
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.20)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9L7 13L15 5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#10B981' }}>Invoice Funded on Arc</span>
                  <a
                    href={explorerTxUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-[11px] underline text-secondary hover:text-primary"
                  >
                    View transaction on ArcScan ↗
                  </a>
                </div>
              )}
              {step === 'error' && (
                <div className="text-xs text-center font-semibold py-2 rounded-xl" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  {errorMsg || 'Transaction failed. Please try again.'}
                </div>
              )}

              {/* CTA */}
              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectKitButton label="Connect Wallet to Fund" />
                </div>
              ) : hasInsufficientBalance(fundingModal) ? (
                /* H3: Insufficient balance guard */
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
                  >
                    <span className="material-symbols-outlined text-lg shrink-0 mt-0.5" style={{ color: '#EF4444' }}>account_balance_wallet</span>
                    <div>
                      <p className="text-xs font-bold mb-0.5" style={{ color: '#EF4444' }}>Insufficient USDC balance</p>
                      <p className="text-[11px] text-secondary leading-relaxed">
                        You need <span className="font-bold text-primary">${fundingModal.advanceAmount.toLocaleString()} USDC</span> to fund this invoice. Get test USDC from the Arc Studio sidebar to continue.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg,#0A1628,#112240)', border: '1px solid rgba(201,146,42,0.25)' }}
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Get Test USDC
                  </a>
                </div>
              ) : step === 'idle' || step === 'error' ? (
                <button
                  onClick={() => handleFund(fundingModal)}
                  className="w-full h-14 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
                    boxShadow: '0 8px 24px rgba(201,146,42,0.35)',
                  }}
                >
                  <span className="material-symbols-outlined text-lg">bolt</span>
                  Fund on Arc · ${fundingModal.advanceAmount.toLocaleString()} USDC
                </button>
              ) : (
                <button
                  disabled
                  className="w-full h-14 rounded-2xl text-sm font-extrabold text-white/60 flex items-center justify-center gap-2 cursor-not-allowed"
                  style={{ background: 'var(--accent)', opacity: 0.6 }}
                >
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  Processing on Arc…
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
