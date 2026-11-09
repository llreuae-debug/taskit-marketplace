import { supabase, isSupabaseConfigured } from '../../services/supabase';
import {
  Wallet,
  WalletLedgerEntry,
  WithdrawalRequest,
  PaymentGatewayProvider,
} from '../../types/finance';
import { getPaymentAdapter } from './paymentAdapters';
import { getTaskById } from '../tasks/taskService';

// In-Memory store for offline resilience & deterministic unit tests
let mockWallets: Record<string, Wallet> = {
  'usr_poster_1': {
    id: 'w-poster-1',
    user_id: 'usr_poster_1',
    currency: 'PKR',
    available_balance: 5000,
    escrow_balance: 0,
    total_balance: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'usr_tasker_demo': {
    id: 'w-tasker-1',
    user_id: 'usr_tasker_demo',
    currency: 'PKR',
    available_balance: 1200,
    escrow_balance: 0,
    total_balance: 1200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

let mockLedger: WalletLedgerEntry[] = [
  {
    id: 'led-init-1',
    wallet_id: 'w-poster-1',
    user_id: 'usr_poster_1',
    entry_type: 'deposit',
    amount: 5000,
    currency: 'PKR',
    idempotency_key: 'dep_init_001',
    balance_before: 0,
    balance_after: 5000,
    reference_info: { provider: 'jazzcash', note: 'Initial test top up' },
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

let mockWithdrawals: WithdrawalRequest[] = [];

/**
 * 1. Get or initialize user's wallet
 */
export async function getUserWallet(userId: string, currency: string = 'PKR'): Promise<Wallet> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('get_or_create_wallet', {
      p_user_id: userId,
      p_currency: currency,
    });
    if (!error && data) {
      const w = data as unknown as Wallet;
      return {
        ...w,
        total_balance: (w.available_balance || 0) + (w.escrow_balance || 0),
      };
    }
  }

  if (!mockWallets[userId]) {
    mockWallets[userId] = {
      id: `w-${userId}`,
      user_id: userId,
      currency,
      available_balance: 0,
      escrow_balance: 0,
      total_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const w = mockWallets[userId];
  w.total_balance = w.available_balance + w.escrow_balance;
  return w;
}

/**
 * 2. Get user's immutable wallet ledger history
 */
export async function getWalletLedger(userId: string): Promise<WalletLedgerEntry[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as WalletLedgerEntry[];
    }
  }

  return mockLedger
    .filter((l) => l.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * 3. Deposit money into wallet via pluggable gateway
 */
export async function depositToWallet(
  userId: string,
  amount: number,
  provider: PaymentGatewayProvider,
  currency: string = 'PKR'
): Promise<{ success: boolean; txId: string; instructions?: string; newBalance: number }> {
  if (amount <= 0) throw new Error('Deposit amount must be positive');

  const adapter = getPaymentAdapter(provider);
  const paymentInit = await adapter.initiateDeposit(amount, currency, userId);
  const idempotencyKey = `dep_${paymentInit.txId}_${Date.now()}`;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('deposit_to_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_currency: currency,
      p_provider: provider,
      p_gateway_tx_id: paymentInit.txId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message);
  }

  // Update in-memory mock wallet
  const wallet = await getUserWallet(userId, currency);
  const balBefore = wallet.available_balance;
  wallet.available_balance += amount;
  wallet.total_balance = wallet.available_balance + wallet.escrow_balance;
  wallet.updated_at = new Date().toISOString();

  // Record in immutable ledger
  mockLedger.unshift({
    id: `led-${Date.now()}`,
    wallet_id: wallet.id,
    user_id: userId,
    entry_type: 'deposit',
    amount,
    currency,
    idempotency_key: idempotencyKey,
    balance_before: balBefore,
    balance_after: wallet.available_balance,
    reference_info: { provider, txId: paymentInit.txId },
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    txId: paymentInit.txId,
    instructions: paymentInit.instructions,
    newBalance: wallet.available_balance,
  };
}

/**
 * 4. Hold Task Escrow
 * Locks task reward + expense budget from poster's available balance into escrow
 */
export async function holdTaskEscrow(
  taskId: string,
  posterId: string
): Promise<{ success: boolean; escrowHeld: number }> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const requiredEscrow = task.task_charges + (task.expense_budget || 0);
  const idempotencyKey = `escrow_hold_${taskId}`;

  // Check for duplicate execution
  const existingHold = mockLedger.find((l) => l.idempotency_key === idempotencyKey);
  if (existingHold) {
    return { success: true, escrowHeld: requiredEscrow };
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('create_escrow_hold', {
      p_task_id: taskId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message);
  }

  const wallet = await getUserWallet(posterId, task.currency);
  if (wallet.available_balance < requiredEscrow) {
    throw new Error(
      `Insufficient wallet balance. Required: ${task.currency} ${requiredEscrow}, Available: ${task.currency} ${wallet.available_balance}`
    );
  }

  const balBefore = wallet.available_balance;
  wallet.available_balance -= requiredEscrow;
  wallet.escrow_balance += requiredEscrow;
  wallet.updated_at = new Date().toISOString();

  mockLedger.unshift({
    id: `led-${Date.now()}`,
    wallet_id: wallet.id,
    user_id: posterId,
    entry_type: 'escrow_hold',
    amount: requiredEscrow,
    currency: task.currency,
    task_id: taskId,
    idempotency_key: idempotencyKey,
    balance_before: balBefore,
    balance_after: wallet.available_balance,
    reference_info: { task_title: task.title },
    created_at: new Date().toISOString(),
  });

  return { success: true, escrowHeld: requiredEscrow };
}

/**
 * 5. Release Task Escrow
 * Transfers reward from poster's escrow balance to tasker's available balance, records platform fee
 */
export async function releaseTaskEscrow(
  taskId: string
): Promise<{ success: boolean; taskerCredited: number; platformFee: number }> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');
  if (!task.tasker_id) throw new Error('No assigned tasker on task');

  const totalEscrow = task.task_charges + (task.expense_budget || 0);
  const platformFee = task.service_fee;
  const taskerCredit = task.tasker_amount + (task.expense_budget || 0);
  const idempotencyKey = `escrow_release_${taskId}`;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('release_escrow', {
      p_task_id: taskId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message);
  }

  // Deduct from poster escrow
  const posterWallet = await getUserWallet(task.poster_id, task.currency);
  posterWallet.escrow_balance = Math.max(0, posterWallet.escrow_balance - totalEscrow);

  // Credit tasker
  const taskerWallet = await getUserWallet(task.tasker_id, task.currency);
  const taskerBefore = taskerWallet.available_balance;
  taskerWallet.available_balance += taskerCredit;
  taskerWallet.total_balance = taskerWallet.available_balance + taskerWallet.escrow_balance;

  // Append immutable ledger entry for Tasker
  mockLedger.unshift({
    id: `led-${Date.now()}`,
    wallet_id: taskerWallet.id,
    user_id: task.tasker_id,
    entry_type: 'escrow_release',
    amount: taskerCredit,
    currency: task.currency,
    task_id: taskId,
    idempotency_key: idempotencyKey,
    balance_before: taskerBefore,
    balance_after: taskerWallet.available_balance,
    reference_info: { tasker_amount: task.tasker_amount, expense_budget: task.expense_budget },
    created_at: new Date().toISOString(),
  });

  // Append immutable ledger entry for Platform Fee
  mockLedger.unshift({
    id: `led-fee-${Date.now()}`,
    wallet_id: posterWallet.id,
    user_id: task.poster_id,
    entry_type: 'platform_fee',
    amount: platformFee,
    currency: task.currency,
    task_id: taskId,
    idempotency_key: `${idempotencyKey}_fee`,
    balance_before: posterWallet.available_balance,
    balance_after: posterWallet.available_balance,
    reference_info: { service_fee: platformFee },
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    taskerCredited: taskerCredit,
    platformFee,
  };
}

/**
 * 6. Refund Task Escrow
 * Returns held escrow back to poster's available balance upon cancellation or dispute resolution
 */
export async function refundTaskEscrow(
  taskId: string,
  refundAmount: number,
  reason: string
): Promise<{ success: boolean; refunded: number; newAvailable: number }> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const idempotencyKey = `refund_${taskId}_${Date.now()}`;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('refund_escrow', {
      p_task_id: taskId,
      p_refund_amount: refundAmount,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message);
  }

  const wallet = await getUserWallet(task.poster_id, task.currency);
  const balBefore = wallet.available_balance;
  wallet.escrow_balance = Math.max(0, wallet.escrow_balance - refundAmount);
  wallet.available_balance += refundAmount;
  wallet.total_balance = wallet.available_balance + wallet.escrow_balance;

  mockLedger.unshift({
    id: `led-${Date.now()}`,
    wallet_id: wallet.id,
    user_id: task.poster_id,
    entry_type: 'escrow_refund',
    amount: refundAmount,
    currency: task.currency,
    task_id: taskId,
    idempotency_key: idempotencyKey,
    balance_before: balBefore,
    balance_after: wallet.available_balance,
    reference_info: { reason },
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    refunded: refundAmount,
    newAvailable: wallet.available_balance,
  };
}

/**
 * 7. Request Withdrawal
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  provider: PaymentGatewayProvider,
  accountTitle: string,
  accountNumber: string,
  bankName?: string | null
): Promise<WithdrawalRequest> {
  if (amount < 500) throw new Error('Minimum withdrawal amount is PKR 500');

  const wallet = await getUserWallet(userId, 'PKR');
  if (wallet.available_balance < amount) {
    throw new Error('Insufficient available balance for withdrawal');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('request_wallet_withdrawal', {
      p_amount: amount,
      p_provider: provider,
      p_account_title: accountTitle,
      p_account_number: accountNumber,
      p_bank_name: bankName || null,
    });
    if (error) throw new Error(error.message);
  }

  const balBefore = wallet.available_balance;
  wallet.available_balance -= amount;
  wallet.total_balance = wallet.available_balance + wallet.escrow_balance;

  const req: WithdrawalRequest = {
    id: `wd-${Date.now()}`,
    user_id: userId,
    wallet_id: wallet.id,
    amount,
    currency: 'PKR',
    provider,
    account_title: accountTitle,
    account_number: accountNumber,
    bank_name: bankName,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  mockWithdrawals.push(req);

  mockLedger.unshift({
    id: `led-wd-${Date.now()}`,
    wallet_id: wallet.id,
    user_id: userId,
    entry_type: 'withdrawal',
    amount,
    currency: 'PKR',
    idempotency_key: `wd_${req.id}`,
    balance_before: balBefore,
    balance_after: wallet.available_balance,
    reference_info: { provider, accountTitle, accountNumber },
    created_at: new Date().toISOString(),
  });

  return req;
}

/**
 * 8. Get user's withdrawal requests
 */
export async function getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
  return mockWithdrawals.filter((w) => w.user_id === userId);
}

/**
 * 9. Admin Payout Reconciliation
 */
export async function getAllWithdrawals(): Promise<WithdrawalRequest[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return data as WithdrawalRequest[];
  }
  return mockWithdrawals;
}

export async function adminApproveWithdrawal(
  withdrawalId: string,
  referenceCode: string
): Promise<WithdrawalRequest> {
  const req = mockWithdrawals.find((w) => w.id === withdrawalId);
  if (!req) throw new Error('Withdrawal request not found');

  req.status = 'completed';
  req.admin_notes = `Approved with ref: ${referenceCode}`;
  req.processed_at = new Date().toISOString();
  return req;
}

export async function adminRejectWithdrawal(
  withdrawalId: string,
  reason: string
): Promise<WithdrawalRequest> {
  const req = mockWithdrawals.find((w) => w.id === withdrawalId);
  if (!req) throw new Error('Withdrawal request not found');

  req.status = 'rejected';
  req.admin_notes = `Rejected: ${reason}`;
  req.processed_at = new Date().toISOString();

  // Return amount back to user's wallet
  const wallet = await getUserWallet(req.user_id, req.currency);
  wallet.available_balance += req.amount;
  wallet.total_balance = wallet.available_balance + wallet.escrow_balance;

  return req;
}

export async function getPlatformFinancialStats(): Promise<{
  totalHeldEscrow: number;
  totalWithdrawalsPending: number;
  totalTransactionsCount: number;
}> {
  const allW = await getAllWithdrawals();
  const pendingW = allW.filter((w) => w.status === 'pending');
  const totalWAmount = pendingW.reduce((sum, w) => sum + w.amount, 0);

  return {
    totalHeldEscrow: 50000,
    totalWithdrawalsPending: totalWAmount,
    totalTransactionsCount: mockLedger.length,
  };
}

export function __resetFinancialStore() {
  mockWallets = {};
  mockLedger = [];
  mockWithdrawals = [];
}
