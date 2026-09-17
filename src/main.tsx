import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { AppContent } from './App';
import { Web3Provider } from './config/wagmi';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3Provider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Web3Provider>
  </React.StrictMode>
);
