# TaskIt ⚡ — Task Financial Engine & Immutable Ledger Architecture

## 1. Overview
The Financial Engine powers the escrow, deposits, platform commissions, and payout withdrawals for the Task Marketplace.
Balances cannot be mutated from client-side code; all balance transitions occur through atomic PostgreSQL stored procedures (`SECURITY DEFINER`) with strict Row Level Security (RLS).

## 2. Real Estate Financial Separation
> [!IMPORTANT]
> Real estate property purchase transactions, booking deposits, and commissions are **strictly decoupled** from the task escrow engine.
> Initial real estate functionality supports property discovery, verified buyer inquiries, scheduled viewings, and offer negotiations. Any future property payment workflows will use an independent, legally compliant real estate settlement module.

## 3. Double-Entry Accounting Ledger
The `public.wallet_ledger` table is an append-only accounting journal:
- **Immutable Trigger**: `trg_prevent_ledger_tampering` prevents any `UPDATE` or `DELETE` on ledger entries.
- **Audit Columns**: Every entry records `balance_before`, `balance_after`, `idempotency_key`, `currency`, `task_id`, and `reference_info`.
- **Supported Entry Types**:
  - `deposit`: Top up funds via JazzCash, Easypaisa, Bank Transfer, or Stripe.
  - `escrow_hold`: Locks task reward + expense budget on task creation/acceptance.
  - `escrow_release`: Credits tasker on task completion.
  - `platform_fee`: Records platform service fee (10% default).
  - `escrow_refund`: Returns held escrow back to poster on cancellation or dispute resolution.
  - `withdrawal`: Deducts available balance for payout processing.

## 4. Pluggable Payment Gateway Adapters
Defined in [src/features/wallet/paymentAdapters.ts](file:///Users/dilnawaz/Task%20It/src/features/wallet/paymentAdapters.ts):
- **JazzCash**: Mobile wallet & MPIN prompt dispatch.
- **Easypaisa**: In-app push notification approval.
- **Bank Transfer / Raast Instant**: Local bank clearing with escrow reference matching.
- **Stripe**: Credit/Debit card checkout.
