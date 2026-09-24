import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { AppContent } from './App';
import { AcknowledgePage } from './components/AcknowledgePage';
import { Web3Provider } from './config/wagmi';
import './index.css';

// Route /acknowledge?token=... to the buyer acknowledgement page.
// All other paths render the main app.
const isAcknowledgePage = window.location.pathname === '/acknowledge';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAcknowledgePage ? (
      <AcknowledgePage />
    ) : (
      <Web3Provider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </Web3Provider>
    )}
  </React.StrictMode>
);
