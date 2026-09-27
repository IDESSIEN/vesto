import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { AppContent } from './App';
import { AcknowledgePage } from './components/AcknowledgePage';
import { AdminPortal } from './components/admin/AdminPortal';
import { Web3Provider } from './config/wagmi';
import './index.css';

// Simple path-based router — no library needed for three routes.
// /acknowledge  → buyer debt-confirmation landing (no auth, no app shell)
// /admin        → admin portal (separate UI, separate auth gate)
// *             → main app (Seller + Lender only)
const path = window.location.pathname;
const isAcknowledgePage = path === '/acknowledge';
const isAdminPortal     = path === '/admin' || path.startsWith('/admin/');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAcknowledgePage ? (
      <AcknowledgePage />
    ) : isAdminPortal ? (
      <Web3Provider>
        <AppProvider>
          <AdminPortal />
        </AppProvider>
      </Web3Provider>
    ) : (
      <Web3Provider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </Web3Provider>
    )}
  </React.StrictMode>
);
