export type LedgerEntryType =
  | 'deposit'
  | 'withdrawal'
  | 'escrow_hold'
  | 'escrow_release'
  | 'escrow_refund'
  | 'platform_fee'
  | 'payout';

export type PaymentGatewayProvider =
  | 'jazzcash'
  | 'easypaisa'
  | 'bank_transfer'
  | 'stripe';

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  available_balance: number;
  escrow_balance: number;
  total_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  user_id: string;
  entry_type: LedgerEntryType;
  amount: number;
  currency: string;
  task_id?: string | null;
  idempotency_key: string;
  balance_before: number;
  balance_after: number;
  reference_info: Record<string, unknown>;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  provider: PaymentGatewayProvider;
  account_title: string;
  account_number: string;
  bank_name?: string | null;
  status: WithdrawalStatus;
  admin_notes?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  provider: PaymentGatewayProvider;
  gateway_tx_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  payload: Record<string, unknown>;
  created_at: string;
}

export interface PaymentGatewayAdapter {
  provider: PaymentGatewayProvider;
  displayName: string;
  icon: string;
  initiateDeposit(amount: number, currency: string, userId: string): Promise<{ paymentUrl?: string; txId: string; instructions?: string }>;
  verifyWebhook(payload: Record<string, unknown>, signature: string): Promise<boolean>;
}
