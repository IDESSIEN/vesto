/**
 * Supabase Edge Function: process-settlements
 *
 * Cron job — runs every 15 minutes.
 * Finds pending settlements whose 24-hour buffer has expired and have not been
 * blocked by admin, then executes approvePayout on the VestoEscrow contract.
 *
 * Also checks for overdue invoices (past repaymentDeadline) and marks them
 * DEFAULTED so lenders can call claimRefund().
 *
 * Schedule: every 15 minutes (set in supabase/config.toml or dashboard)
 * Idempotent: processed records are marked executed=true immediately.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPublicClient, createWalletClient, http, parseAbi } from 'https://esm.sh/viem@2';
import { privateKeyToAccount } from 'https://esm.sh/viem@2/accounts';

// ─── ABI (minimal — only functions this cron needs) ──────────────────────────

const ESCROW_ABI = parseAbi([
  'function approvePayout(bytes32 invoiceId) external',
  'function approvePartialPayout(bytes32 invoiceId, uint256 coverageBps) external',
  'function getInvoice(bytes32 invoiceId) external view returns (address seller, address lender, uint256 advanceAmount, uint256 lenderYield, uint256 platformFee, uint256 repaymentDeadline, uint8 state)',
]);

// ─── Arc Testnet chain config ────────────────────────────────────────────────

const ARC_TESTNET = {
  id: 5454,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [Deno.env.get('ARC_RPC_URL') ?? 'https://rpc.arc.io/testnet'] },
  },
};

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const contractAddress = Deno.env.get('VITE_VESTO_ESCROW_ADDRESS') as `0x${string}` | undefined;
  const adminPrivateKey  = Deno.env.get('ADMIN_WALLET_PRIVATE_KEY') as `0x${string}` | undefined;

  if (!contractAddress || !adminPrivateKey) {
    return new Response(JSON.stringify({ error: 'Missing contract address or admin key' }), { status: 500 });
  }

  const account = privateKeyToAccount(adminPrivateKey);
  const walletClient = createWalletClient({
    account,
    chain: ARC_TESTNET as Parameters<typeof createWalletClient>[0]['chain'],
    transport: http(),
  });
  const publicClient = createPublicClient({
    chain: ARC_TESTNET as Parameters<typeof createPublicClient>[0]['chain'],
    transport: http(),
  });

  const results: Array<{ invoiceId: string; action: string; txHash?: string; error?: string }> = [];

  // ── 1. Process matured settlements (24h buffer expired, not blocked) ──────

  const now = new Date().toISOString();
  const { data: pending, error: pendErr } = await supabase
    .from('pending_settlements')
    .select('*, invoice_settlements(*), invoices(*)')
    .lte('execute_after', now)
    .eq('executed', false)
    .eq('blocked', false)
    .limit(20);  // batch cap — prevents gas spike on backlog

  if (pendErr) {
    console.error('Failed to fetch pending settlements', pendErr);
    return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 });
  }

  for (const ps of (pending ?? [])) {
    const invoiceId = ps.invoice_id as string;
    const settlement = ps.invoice_settlements as Record<string, unknown>;

    // Mark as executing immediately to prevent double-execution
    await supabase.from('pending_settlements').update({ executed: true, executed_at: now }).eq('id', ps.id);

    try {
      // Encode invoice ID as bytes32
      const idBytes = (invoiceId.replace(/-/g, '') + '0'.repeat(64)).slice(0, 64) as `0x${string}`;
      const idBytes32 = `0x${idBytes}` as `0x${string}`;

      const paymentType = settlement?.['payment_type'] as string;

      let txHash: string;
      if (paymentType === 'partial') {
        // Calculate coverage in basis points (0–10000)
        const totalDue = Number((ps.invoices as Record<string, unknown>)?.['total_due'] ?? 0);
        const received = Number(settlement?.['amount'] ?? 0);
        const coverageBps = Math.min(10000, Math.floor((received / totalDue) * 10000));

        txHash = await walletClient.writeContract({
          address: contractAddress,
          abi: ESCROW_ABI,
          functionName: 'approvePartialPayout',
          args: [idBytes32, BigInt(coverageBps)],
        });
      } else {
        txHash = await walletClient.writeContract({
          address: contractAddress,
          abi: ESCROW_ABI,
          functionName: 'approvePayout',
          args: [idBytes32],
        });
      }

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, timeout: 30_000 });

      // Update records
      await supabase.from('pending_settlements').update({ tx_hash: txHash }).eq('id', ps.id);
      await supabase.from('invoice_settlements').update({ status: 'executed' }).eq('id', settlement?.['id']);
      await supabase.from('invoices').update({ status: 'repaid', settled_at: now }).eq('id', invoiceId);

      // Notify seller + lender
      await supabase.from('admin_notifications').insert({
        type: 'settlement_executed',
        invoice_id: invoiceId,
        message: `Invoice ${invoiceId} settled onchain. Tx: ${txHash}`,
        metadata: { tx_hash: txHash, settlement_id: settlement?.['id'] },
      });

      results.push({ invoiceId, action: 'settled', txHash });
      console.log(`Settled invoice ${invoiceId} — tx ${txHash}`);

    } catch (err) {
      // Undo the "executed" mark so it can be retried, but add error log
      await supabase.from('pending_settlements').update({ executed: false }).eq('id', ps.id);
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ invoiceId, action: 'failed', error: msg.slice(0, 200) });
      console.error(`Failed to settle invoice ${invoiceId}:`, msg);

      await supabase.from('admin_notifications').insert({
        type: 'settlement_failed',
        invoice_id: invoiceId,
        message: `Auto-settlement failed for invoice ${invoiceId}: ${msg.slice(0, 200)}`,
        metadata: { error: msg },
      });
    }
  }

  // ── 2. Check for overdue shortfall cure windows ───────────────────────────

  const { data: overdueShortfalls } = await supabase
    .from('invoice_shortfalls')
    .select('*')
    .lte('cure_deadline', now)
    .eq('cured', false)
    .eq('status', 'open');

  for (const shortfall of (overdueShortfalls ?? [])) {
    await supabase.from('invoice_shortfalls').update({ status: 'disputed' }).eq('id', shortfall.id);
    await supabase.from('invoices').update({ status: 'disputed' }).eq('id', shortfall.invoice_id);
    await supabase.from('admin_notifications').insert({
      type: 'shortfall_escalated',
      invoice_id: shortfall.invoice_id,
      message: `Partial payment cure window expired for invoice ${shortfall.invoice_id}. Moved to dispute.`,
      metadata: { shortfall_id: shortfall.id, shortfall_amount: shortfall.shortfall },
    });
    results.push({ invoiceId: shortfall.invoice_id, action: 'shortfall_disputed' });
  }

  // ── 3. Mark invoices past repaymentDeadline as DEFAULTED (off-chain flag) ─

  // Note: the actual claimRefund is a lender action on the contract.
  // Here we just mark invoices as defaulted in our DB so the UI shows it.
  const { data: fundedInvoices } = await supabase
    .from('invoices')
    .select('id, repayment_deadline')
    .eq('status', 'funded')
    .not('repayment_deadline', 'is', null);

  for (const inv of (fundedInvoices ?? [])) {
    const deadline = new Date(inv.repayment_deadline as string);
    if (deadline < new Date()) {
      await supabase.from('invoices').update({ status: 'defaulted' }).eq('id', inv.id);
      await supabase.from('admin_notifications').insert({
        type: 'invoice_defaulted',
        invoice_id: inv.id,
        message: `Invoice ${inv.id} has passed its repayment deadline and is now in default. Lender can claim refund.`,
        metadata: { repayment_deadline: inv.repayment_deadline },
      });
      results.push({ invoiceId: inv.id, action: 'marked_defaulted' });
    }
  }

  return new Response(JSON.stringify({
    processed: results.length,
    results,
    timestamp: now,
  }), { status: 200 });
});
