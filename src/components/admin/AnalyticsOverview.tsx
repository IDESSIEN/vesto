import React from 'react';
import { useApp } from '../../context/AppContext';

// Tiny inline sparkline - pure SVG, no deps
const Sparkline: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data, color, width = 64, height = 28,
}) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="shrink-0">
      <polyline points={pts} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      {/* Dot at last point */}
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5" fill={color}
      />
    </svg>
  );
};

// 7-day demo data for sparklines
const sparkVolume   = [82000, 89000, 95000, 91000, 103000, 118000, 128500];
const sparkLiquidity= [61000, 68000, 72000, 69000, 78000, 81000, 84200];
const sparkYield    = [13.8, 14.1, 14.8, 14.5, 15.0, 15.4, 15.2];
const sparkDefault  = [0.18, 0.16, 0.14, 0.15, 0.13, 0.12, 0.12];

export const AnalyticsOverview: React.FC = () => {
  const { analytics, setAdminView } = useApp();

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">Platform Analytics Overview</h1>
          <span className="text-xs text-secondary">Real-Time Macro Performance & System Health</span>
        </div>

        <button
          onClick={() => setAdminView('oversight')}
          className="px-3 py-1.5 bg-surface-card border border-border-subtle rounded-xl text-xs font-semibold text-primary hover:bg-surface-container"
        >
          Invoice Grid
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-primary text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-primary-fixed-dim uppercase tracking-wider font-semibold">Total Volume</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-white">
              ${analytics.totalVolumeUSD.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-success-shamrock font-bold">+28.4% MoM</span>
            <Sparkline data={sparkVolume} color="#10B981" />
          </div>
        </div>

        <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Active Liquidity</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-primary">
              ${analytics.activeLiquidityUSD.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-secondary">14 Open Batches</span>
            <Sparkline data={sparkLiquidity} color="#C9922A" />
          </div>
        </div>

        <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Average Yield APY</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-success-shamrock">
              {analytics.averageYieldAPY}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-secondary">Net Annualized</span>
            <Sparkline data={sparkYield} color="#10B981" />
          </div>
        </div>

        <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Default Rate</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-primary">
              {analytics.defaultRatePct}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-success-shamrock font-bold">First-Loss Protected</span>
            <Sparkline data={sparkDefault} color="#E8B96A" />
          </div>
        </div>
      </div>

      {/* Sector Volume Distribution */}
      <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm flex flex-col gap-4">
        <h3 className="font-headline font-bold text-base text-primary">Commodity Sector Distribution</h3>

        <div className="flex flex-col gap-3 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-primary">Grain & Cereals (White Maize, Rice)</span>
              <span className="font-bold text-primary">42% ($59,850)</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full w-[42%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-primary">Coffee & Tea (Arabica Exports)</span>
              <span className="font-bold text-primary">28% ($39,900)</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-on-tertiary-container h-full rounded-full w-[28%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-primary">Export Spices & Culinary</span>
              <span className="font-bold text-primary">18% ($25,650)</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-tertiary-fixed-dim h-full rounded-full w-[18%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-primary">Cold Chain Transport & Logistics</span>
              <span className="font-bold text-primary">12% ($17,100)</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-success-shamrock h-full rounded-full w-[12%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* System & Arc Network Health */}
      <div className="bg-primary-container text-on-primary rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-shamrock text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">bolt</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-sm text-white">Arc Testnet Performance</h4>
            <span className="text-xs text-on-primary-container">Avg Block Time: &lt;1s · Finality: Sub-second · USDC native gas</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-success-shamrock font-bold block">10,000 TPS Capacity</span>
          <span className="text-[11px] text-on-primary-container">System Uptime: {analytics.systemHealthPct}%</span>
        </div>
      </div>
    </div>
  );
};
