import {
  AgoraAccount,
  AgoraBankAccount,
  AgoraChain,
  AgoraDepositSetup,
  AgoraOnChainInstruction,
  AgoraPayoutResult,
  AgoraRoute,
  AgoraRouteInstruction,
  AgoraWalletAccount,
  AgoraWireInstruction,
} from '../types/agora';

const AGORA_API_KEY = import.meta.env.VITE_AGORA_API_KEY || '';
const ADVANCE_CHAIN: AgoraChain = 'monad';

/** Dev: Vite proxies `/agora` → api.agora.finance. Prod: set VITE_AGORA_API_BASE to your Supabase `agora` function URL. */
function resolveAgoraApiBase(): string {
  if (import.meta.env.VITE_AGORA_API_BASE) {
    return import.meta.env.VITE_AGORA_API_BASE.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '/agora';
  }
  return 'https://api.agora.finance';
}

const AGORA_API_BASE = resolveAgoraApiBase();

/** Direct browser auth only when an org API key is present (local demo). Prefer server proxy in production. */
const isAgoraConfigured = Boolean(AGORA_API_KEY) || AGORA_API_BASE !== 'https://api.agora.finance';

interface SessionCache {
  jwt: string;
  expiresAt: number;
}

interface AgoraErrorBody {
  code?: string;
  context?: { routeId?: string; reason?: string };
  message?: string;
}

let sessionCache: SessionCache | null = null;

function isWireInstruction(
  instruction: AgoraRoute['instructions'][number]
): instruction is AgoraWireInstruction {
  return 'memo' in instruction;
}

function isOnChainInstruction(
  instruction: AgoraRoute['instructions'][number]
): instruction is AgoraOnChainInstruction {
  return 'depositAddress' in instruction;
}

function mergeRouteInstructions(routes: AgoraRoute[]): AgoraRouteInstruction[] {
  const seen = new Set<string>();
  const merged: AgoraRouteInstruction[] = [];

  for (const route of routes) {
    for (const instruction of route.instructions) {
      const key = isWireInstruction(instruction)
        ? `wire:${instruction.memo}`
        : `onchain:${instruction.chain}:${instruction.depositAddress.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(instruction);
    }
  }

  return merged;
}

function normalizeWalletAccount(account: AgoraWalletAccount): AgoraWalletAccount {
  return {
    ...account,
    address: account.address,
    networks: account.networks?.length
      ? account.networks.map((n) => (typeof n === 'string' ? { chain: n as AgoraChain } : n))
      : [{ chain: ADVANCE_CHAIN }],
  };
}

async function getSessionJwt(): Promise<string | null> {
  if (!AGORA_API_KEY) {
    return null;
  }

  const now = Date.now();
  if (sessionCache && sessionCache.expiresAt > now + 60_000) {
    return sessionCache.jwt;
  }

  const response = await fetch(`${AGORA_API_BASE}/v0/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AGORA_API_KEY}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Agora auth failed (${response.status}): ${errorBody}`);
  }

  const { sessionJwt } = (await response.json()) as { sessionJwt: string };
  sessionCache = {
    jwt: sessionJwt,
    expiresAt: now + 14 * 60 * 1000,
  };
  return sessionJwt;
}

async function agoraFetch<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  const jwt = await getSessionJwt();
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  const response = await fetch(`${AGORA_API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && jwt && !retried) {
    sessionCache = null;
    return agoraFetch<T>(path, init, true);
  }

  if (response.status === 409) {
    const conflict = (await response.json()) as AgoraErrorBody;
    if (conflict.context?.routeId) {
      return agoraFetch<T>(`/v0/routes/${conflict.context.routeId}`);
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Agora API ${path} failed (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

async function createRoute(payload: Record<string, unknown>): Promise<AgoraRoute> {
  return agoraFetch<AgoraRoute>('/v0/routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function findWalletByAddress(address: string): Promise<AgoraWalletAccount | null> {
  const result = await agoraFetch<{ data: AgoraAccount[] }>('/v0/accounts');
  const normalized = address.toLowerCase();
  const match = result.data.find(
    (account): account is AgoraWalletAccount =>
      account.kind === 'wallet' && account.address.toLowerCase() === normalized
  );
  return match ? normalizeWalletAccount(match) : null;
}

async function findBankByIdentity(params: {
  accountNumber: string;
  routingNumber: string;
  beneficiary: string;
}): Promise<AgoraBankAccount | null> {
  const result = await agoraFetch<{ data: AgoraAccount[] }>('/v0/accounts');
  const match = result.data.find(
    (account): account is AgoraBankAccount =>
      account.kind === 'bank' &&
      account.accountNumber === params.accountNumber &&
      account.routingNumber === params.routingNumber &&
      account.beneficiary === params.beneficiary
  );
  return match ?? null;
}

function simulateWalletAccount(address: string, label: string): AgoraWalletAccount {
  return {
    id: `sim-wallet-${address.slice(-8)}`,
    kind: 'wallet',
    address,
    name: label,
    networks: [{ chain: ADVANCE_CHAIN }],
  };
}

function simulateBankAccount(params: {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  beneficiary: string;
  label: string;
}): AgoraBankAccount {
  return {
    id: `sim-bank-${params.accountNumber.slice(-4)}`,
    kind: 'bank',
    bankName: params.bankName,
    accountNumber: params.accountNumber,
    routingNumber: params.routingNumber,
    beneficiary: params.beneficiary,
    name: params.label,
  };
}

function simulateLenderDepositRoute(walletAccountId: string): AgoraRoute {
  return {
    id: 'sim-route-lender-inbound',
    name: 'Advance Lender USD → USDC (Monad)',
    createdAt: new Date().toISOString(),
    direction: 'mint-fiat',
    from: { currency: 'usd' },
    to: { currency: 'usdc', accountId: walletAccountId, chain: ADVANCE_CHAIN },
    instructions: [
      {
        memo: 'ADV-LENDER-MONAD',
        beneficiaryName: 'Agora Bermuda Limited FBO Customer Funds',
        beneficiaryAddress: 'Russell Eve Bldg Suite 208, 21 Church Street, Hamilton HM11, Bermuda-BMU',
        accountNumber: '8798897',
        bankName: 'Customers Bank',
        bankAddress: '40 General Warren Blvd Suite 200, Malvern PA 19355',
        routingNumber: '031302971',
        swiftCode: 'CUESUS33',
        supportedCurrencies: ['usd'],
      },
      {
        chain: ADVANCE_CHAIN,
        depositAddress: '0xAgoraMintStablecoinMonad000000000000000001',
        supportedCurrencies: ['stablecoin', 'usdc'],
      },
      {
        chain: ADVANCE_CHAIN,
        depositAddress: '0xAgoraRedeemAusdToUsdcMonad0000000000000001',
        supportedCurrencies: ['ausd'],
      },
    ],
  };
}

function simulateSellerPayoutRoute(bankAccountId: string): AgoraRoute {
  return {
    id: 'sim-route-seller-outbound',
    name: 'Advance Seller USDC → Local Bank',
    createdAt: new Date().toISOString(),
    direction: 'redeem-fiat',
    from: { currency: 'ausd' },
    to: { currency: 'usd', accountId: bankAccountId },
    instructions: [
      {
        chain: ADVANCE_CHAIN,
        depositAddress: '0xAgoraRedeemDepositMonad000000000000000001',
        supportedCurrencies: ['ausd'],
      },
    ],
  };
}

export const agoraService = {
  isConfigured: () => isAgoraConfigured,

  /** Register a Monad wallet that receives minted USDC from lender deposits. */
  registerWallet: async (
    address: string,
    label: string,
    chain: AgoraChain = ADVANCE_CHAIN
  ): Promise<AgoraWalletAccount> => {
    if (!isAgoraConfigured) {
      return simulateWalletAccount(address, label);
    }

    try {
      const account = await agoraFetch<AgoraWalletAccount>('/v0/accounts', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'wallet',
          address,
          name: label,
          networks: [chain],
        }),
      });
      return normalizeWalletAccount(account);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('409') || message.includes('account_already_exists')) {
        const existing = await findWalletByAddress(address);
        if (existing) return existing;
      }
      throw err;
    }
  },

  /** Register a seller bank account for fiat redemption (USD wire → local FX at bank). */
  registerBankAccount: async (params: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    beneficiary: string;
    label: string;
  }): Promise<AgoraBankAccount> => {
    if (!isAgoraConfigured) {
      return simulateBankAccount(params);
    }

    try {
      return await agoraFetch<AgoraBankAccount>('/v0/accounts', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'bank',
          bankName: params.bankName,
          accountNumber: params.accountNumber,
          routingNumber: params.routingNumber,
          beneficiary: params.beneficiary,
          name: params.label,
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('409') || message.includes('account_already_exists')) {
        const existing = await findBankByIdentity(params);
        if (existing) return existing;
      }
      throw err;
    }
  },

  /**
   * Lender inbound: USD wire or external USDC → USDC on Monad.
   * Agora legs: USD→AUSD (wire), stablecoin→AUSD (USDC mint), AUSD→USDC (on Monad).
   */
  setupLenderDepositRoute: async (
    walletAddress: string,
    lenderName: string
  ): Promise<AgoraDepositSetup> => {
    if (!isAgoraConfigured) {
      const walletAccount = simulateWalletAccount(walletAddress, `${lenderName} — Advance Lender Wallet`);
      return {
        route: simulateLenderDepositRoute(walletAccount.id),
        walletAccount,
        status: 'simulated',
      };
    }

    const walletAccount = await agoraService.registerWallet(
      walletAddress,
      `${lenderName} — Advance Lender Wallet`
    );

    const wireToAusd = await createRoute({
      name: `Advance Lender USD wire → AUSD (${lenderName})`,
      from: { currency: 'usd' },
      to: {
        currency: 'ausd',
        accountId: walletAccount.id,
        chain: ADVANCE_CHAIN,
      },
    });

    let stablecoinToAusd: AgoraRoute | null = null;
    try {
      stablecoinToAusd = await createRoute({
        name: `Advance Lender USDC → AUSD (${lenderName})`,
        from: { currency: 'stablecoin' },
        to: {
          currency: 'ausd',
          accountId: walletAccount.id,
          chain: ADVANCE_CHAIN,
        },
      });
    } catch {
      // Optional if stablecoin mint on Monad is not yet enabled for the org.
    }

    let ausdToUsdc: AgoraRoute | null = null;
    try {
      ausdToUsdc = await createRoute({
        name: `Advance Lender AUSD → USDC on Monad (${lenderName})`,
        from: { currency: 'ausd' },
        to: {
          currency: 'usdc',
          accountId: walletAccount.id,
          chain: ADVANCE_CHAIN,
        },
      });
    } catch {
      // USDC leg optional if topology unavailable on testnet.
    }

    const legRoutes = [wireToAusd, stablecoinToAusd, ausdToUsdc].filter(Boolean) as AgoraRoute[];
    const route: AgoraRoute = {
      ...wireToAusd,
      name: `Advance Lender Deposit → USDC on Monad (${lenderName})`,
      to: {
        currency: 'usdc',
        accountId: walletAccount.id,
        chain: ADVANCE_CHAIN,
      },
      instructions: mergeRouteInstructions(legRoutes),
    };

    return { route, walletAccount, status: 'ready' };
  },

  /**
   * Seller outbound: invoice USDC balance → USD wire to seller bank (local FX on receipt).
   * On-chain: Advance sends AUSD to Agora's Monad redeem address from the seller's USDC balance.
   */
  initiateSellerPayout: async (params: {
    walletAddress: string;
    sellerName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    beneficiary: string;
    amountUsd: number;
  }): Promise<AgoraPayoutResult> => {
    if (!isAgoraConfigured) {
      const bankAccount = simulateBankAccount({
        bankName: params.bankName,
        accountNumber: params.accountNumber,
        routingNumber: params.routingNumber,
        beneficiary: params.beneficiary,
        label: `${params.sellerName} — Payout Bank`,
      });
      return {
        route: simulateSellerPayoutRoute(bankAccount.id),
        status: 'simulated',
        message: `Simulated Agora redeem of $${params.amountUsd.toLocaleString()} USDC → ${params.bankName}. Advance converts USDC to AUSD, then Agora wires USD for local FX (KES).`,
      };
    }

    await agoraService.registerWallet(params.walletAddress, `${params.sellerName} — Advance Seller Wallet`);

    const bankAccount = await agoraService.registerBankAccount({
      bankName: params.bankName,
      accountNumber: params.accountNumber,
      routingNumber: params.routingNumber,
      beneficiary: params.beneficiary,
      label: `${params.sellerName} — Payout Bank`,
    });

    const route = await createRoute({
      name: `Advance Seller Payout (${params.sellerName})`,
      from: { currency: 'ausd' },
      to: {
        currency: 'usd',
        accountId: bankAccount.id,
      },
    });

    return {
      route,
      status: 'initiated',
      message: `Agora redeem route created for $${params.amountUsd.toLocaleString()}. Advance submits AUSD to the Monad redeem address; USD wire settles to ${params.bankName} (local currency at your bank).`,
    };
  },

  getRoute: async (routeId: string): Promise<AgoraRoute> => {
    if (!isAgoraConfigured) {
      if (routeId.includes('lender')) return simulateLenderDepositRoute('sim-wallet');
      return simulateSellerPayoutRoute('sim-bank');
    }
    return agoraFetch<AgoraRoute>(`/v0/routes/${routeId}`);
  },

  listAccounts: async (): Promise<AgoraAccount[]> => {
    if (!isAgoraConfigured) return [];
    const result = await agoraFetch<{ data: AgoraAccount[] }>('/v0/accounts');
    return result.data;
  },

  /** Poll recent redeem settlements on Monad (seller payout confirmation). */
  pollRecentSettlement: async (routeId: string): Promise<boolean> => {
    if (!isAgoraConfigured) {
      await new Promise((res) => setTimeout(res, 800));
      return true;
    }

    const result = await agoraFetch<{
      data: Array<{ id: string; type: string; settledAt: string | null; recipient?: { accountId?: string | null } }>;
    }>(`/v0/transactions?limit=20&type=redeem&recipientChain=${ADVANCE_CHAIN}`);

    return result.data.some((txn) => txn.settledAt != null && txn.type === 'redeem');
  },

  getWireInstructions: (route: AgoraRoute): AgoraWireInstruction | null => {
    const wire = route.instructions.find(isWireInstruction);
    return wire ?? null;
  },

  getMonadOnChainInstructions: (route: AgoraRoute): AgoraOnChainInstruction[] => {
    return route.instructions.filter(
      (instruction): instruction is AgoraOnChainInstruction =>
        isOnChainInstruction(instruction) && instruction.chain === ADVANCE_CHAIN
    );
  },

  getMonadOnChainInstruction: (route: AgoraRoute): AgoraOnChainInstruction | null => {
    const instructions = agoraService.getMonadOnChainInstructions(route);
    return instructions[0] ?? null;
  },

  /** Redeem address used for AUSD → USD (seller payout). */
  getMonadRedeemInstruction: (route: AgoraRoute): AgoraOnChainInstruction | null => {
    const redeem = agoraService
      .getMonadOnChainInstructions(route)
      .find((instruction) => instruction.supportedCurrencies.includes('ausd'));
    return redeem ?? agoraService.getMonadOnChainInstruction(route);
  },
};

export type { AgoraWireInstruction, AgoraOnChainInstruction };
