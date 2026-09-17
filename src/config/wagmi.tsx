import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import React from 'react';

// Arc Testnet chain definition
export const arcTestnet = defineChain({
  id: 5454,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.arc-testnet.circle.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Arc Testnet Explorer',
      url: 'https://explorer.arc-testnet.circle.com',
    },
  },
  testnet: true,
});

export const ARC_TESTNET_CHAIN_ID = arcTestnet.id;

// USDC on Arc Testnet (native ERC-20 address)
export const ARC_TESTNET_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`;
export const USDC_DECIMALS = 6;

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Vesto' }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          customTheme={{
            '--ck-font-family': "'DM Sans', sans-serif",
            '--ck-primary-button-background': '#001d37',
            '--ck-primary-button-hover-background': '#16324f',
            '--ck-body-background': '#ffffff',
            '--ck-body-color': '#1b1c1a',
            '--ck-border-radius': '12px',
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
