import React from 'react';
import { useApp } from '../../context/AppContext';

const Sparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data, color, width = 60, height = 24,
}) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const lastX = (data.length - 1) * step;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx={lastX} cy={lastY} r="2" fill={color}/>
    </svg>
  );
};

const sparkVolume    = [82000,89000,95000,91000,103000,118000,128500];
const sparkLiquidity = [61000,68000,72000,69000,78000,81000,84200];
const sparkYield     = [13.8,14.1,14.8,14.5,15.0,15.4,15.2];
const sparkDefault   = [0.18,0.16,0.14,0.15,0.13,0.12,0.12];

const sectors = [
  { label: 'Grain & Cereals', sub: 'White Maize, Rice', pct: 42, value: '$59,850', color: 'var(--ink)' },
  { label: 'Coffee & Tea',    sub: 'Arabica exports',   pct: 28, value: '$39,900', color: '#B8821E' },
  { label: 'Export Spices',   sub: 'Culinary & herbs',  pct: 18, value: '$25,650', color: '#1E4DB8' },
  { label: 'Cold Chain',      sub: 'Transport & logistics', pct: 12, value: '$17,100', color: '#1A7A46' },
];

export const AnalyticsOverview: React.FC = () => {
  const { analytics, setAdminView } = useApp();

  return (
    <div
      className="mx-auto py-7 px-4 flex flex-col gap-6 pb-28 animate-fade-up"
      style={{ maxWidth: '800px' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p
            className="text-[9px] uppercase font-semibold mb-1.5"
            style={{ color: 'var(--ink-faint)', letterSpacing: '0.12em' }}
          >
            Platform overview
          </p>
          <h1
            className="font-display font-bold text-ink"
            style={{ fontSize: '20px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
          >
            Analytics
          </h1>
        </div>
        <button
          onClick={() => setAdminView('oversight')}
          className="self-start sm:self-auto px-3 py-1.5 text-[11px] font-semibold rounded-[7px]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-subtle)' }}
        >
          Invoice grid
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total volume — dark hero tile */}
        <div
          className="relative col-span-2 sm:col-span-1 rounded-[15px] overflow-hidden p-4 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(135deg,#0D1824 0%,#152035 100%)',
            minHeight: '110px',
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.020) 1px,transparent 1px)', backgroundSize: '18px 18px' }}
          />
          <div className="grain-overlay absolute inset-0 pointer-events-none" />
          <p
            className="relative text-[9px] uppercase font-semibold"
            style={{ color: 'rgba(255,255,255,0.30)', letterSpacing: '0.10em' }}
          >
            Total volume
          </p>
          <div className="relative mt-2">
            <p
              className="font-mono font-bold text-white"
              style={{ fontSize: '22px', letterSpacing: '-0.025em', lineHeight: 1 }}
            >
              ${analytics.totalVolumeUSD.toLocaleString()}
            </p>
          </div>
          <div className="relative flex items-center justify-between mt-2">
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(26,200,120,0.9)' }}>
              +28.4% MoM
            </span>
            <Sparkline data={sparkVolume} color="#1AC878" />
          </div>
        </div>

        {/* Active liquidity */}
        <div
          className="rounded-[15px] p-4 flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', minHeight: '110px' }}
        >
          <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}>
            Active liquidity
          </p>
          <p
            className="font-mono font-bold text-ink mt-2"
            style={{ fontSize: '20px', letterSpacing: '-0.022em', lineHeight: 1 }}
          >
            ${analytics.activeLiquidityUSD.toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>14 open batches</span>
            <Sparkline data={sparkLiquidity} color="#B8821E" />
          </div>
        </div>

        {/* Average yield */}
        <div
          className="rounded-[15px] p-4 flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', minHeight: '110px' }}
        >
          <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}>
            Avg yield APY
          </p>
          <p
            className="font-mono font-bold mt-2"
            style={{ fontSize: '20px', letterSpacing: '-0.022em', lineHeight: 1, color: '#1A7A46' }}
          >
            {analytics.averageYieldAPY}%
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>Net annualized</span>
            <Sparkline data={sparkYield} color="#1A7A46" />
          </div>
        </div>

        {/* Default rate */}
        <div
          className="rounded-[15px] p-4 flex flex-col justify-between"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', minHeight: '110px' }}
        >
          <p className="text-[9px] uppercase font-semibold" style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}>
            Default rate
          </p>
          <p
            className="font-mono font-bold text-ink mt-2"
            style={{ fontSize: '20px', letterSpacing: '-0.022em', lineHeight: 1 }}
          >
            {analytics.defaultRatePct}%
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-semibold" style={{ color: '#1A7A46' }}>Protected</span>
            <Sparkline data={sparkDefault} color="#B8821E" />
          </div>
        </div>
      </div>

      {/* Sector distribution */}
      <div
        className="rounded-[15px] p-5 flex flex-col gap-5"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)' }}
      >
        <div className="flex items-center justify-between">
          <p
            className="font-display font-semibold text-ink"
            style={{ fontSize: '13px', letterSpacing: '-0.018em' }}
          >
            Commodity sector distribution
          </p>
          <p className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>7-day window</p>
        </div>

        <div className="flex flex-col gap-4">
          {sectors.map(({ label, sub, pct, value, color }) => (
            <div key={label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div>
                  <span className="text-[12px] font-semibold text-ink">{label}</span>
                  <span className="text-[10px] ml-1.5" style={{ color: 'var(--ink-faint)' }}>{sub}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] font-semibold" style={{ color, letterSpacing: '-0.01em' }}>
                    {pct}%
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--ink-faint)', letterSpacing: '-0.01em' }}>
                    {value}
                  </span>
                </div>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arc network health */}
      <div
        className="relative rounded-[15px] overflow-hidden p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,#0D1824 0%,#152035 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '20px 20px' }}
        />
        <div className="grain-overlay absolute inset-0 pointer-events-none" />

        <div className="relative flex items-center gap-3.5">
          <div
            className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(26,200,120,0.15)', border: '1px solid rgba(26,200,120,0.25)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#1AC878' }}>
              <path d="M8 2L3 4.5V9c0 3.5 2.2 5.5 5 6.5 2.8-1 5-3 5-6.5V4.5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M5.5 8.5l1.8 1.8 3.2-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p
              className="font-display font-semibold text-white"
              style={{ fontSize: '13px', letterSpacing: '-0.018em' }}
            >
              Arc Testnet
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              &lt;1s block time · Sub-second finality · USDC native gas
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-6 sm:text-right">
          <div>
            <p className="text-[9px] uppercase font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.09em' }}>
              Capacity
            </p>
            <p className="font-mono font-bold text-white text-[13px]" style={{ letterSpacing: '-0.02em' }}>
              10,000 TPS
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.09em' }}>
              Uptime
            </p>
            <p className="font-mono font-bold text-[13px]" style={{ color: '#1AC878', letterSpacing: '-0.02em' }}>
              {analytics.systemHealthPct}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
