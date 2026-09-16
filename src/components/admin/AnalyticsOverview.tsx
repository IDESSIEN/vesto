import React from 'react';
import { useApp } from '../../context/AppContext';

export const AnalyticsOverview: React.FC = () => {
  const { analytics, setAdminView } = useApp();

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <span className="text-[10px] text-success-shamrock font-bold">+28.4% MoM</span>
        </div>

        <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Active Liquidity</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-primary">
              ${analytics.activeLiquidityUSD.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-secondary">14 Open Batches</span>
        </div>

        <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Average Yield APY</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-success-shamrock">
              {analytics.averageYieldAPY}%
            </span>
          </div>
          <span className="text-[10px] text-secondary">Net Annualized</span>
        </div>

        <div className="bg-surface-card border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">Default Rate</span>
          <div className="my-1">
            <span className="font-headline text-2xl font-extrabold text-primary">
              {analytics.defaultRatePct}%
            </span>
          </div>
          <span className="text-[10px] text-success-shamrock font-bold">First-Loss Protected</span>
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

      {/* System & Monad Network Health */}
      <div className="bg-primary-container text-on-primary rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-shamrock text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">bolt</span>
          </div>
          <div>
            <h4 className="font-headline font-bold text-sm text-white">Monad Testnet Performance</h4>
            <span className="text-xs text-on-primary-container">Avg Block Time: 400ms · Finality: 800ms · Gas limit optimized</span>
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
