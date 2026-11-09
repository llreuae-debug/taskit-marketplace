-- =============================================================================
-- TASKIT ⚡ — MIGRATION 00005: TASK FINANCIAL ENGINE & IMMUTABLE LEDGER
-- Wallets, Immutable Ledger, Escrow Hold/Release/Refund, Withdrawals & Gateways
-- =============================================================================

-- 1. FINANCIAL ENUMS
DO $$ BEGIN
  CREATE TYPE ledger_entry_type AS ENUM (
    'deposit',
    'withdrawal',
    'escrow_hold',
    'escrow_release',
    'escrow_refund',
    'platform_fee',
    'payout'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_gateway_provider AS ENUM (
    'jazzcash',
    'easypaisa',
    'bank_transfer',
    'stripe'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM (
    'pending',
    'approved',
    'processing',
    'completed',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. WALLETS TABLE (One wallet per member, server-updated balances only)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  available_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
  escrow_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (escrow_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- 3. IMMUTABLE WALLET LEDGER TABLE (Append-Only)
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  entry_type ledger_entry_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  idempotency_key VARCHAR(128) UNIQUE NOT NULL,
  balance_before NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2) NOT NULL,
  reference_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DATABASE TRIGGER: Strictly prevent any UPDATE or DELETE on wallet_ledger
CREATE OR REPLACE FUNCTION public.prevent_ledger_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TAMPER ERROR: wallet_ledger is an immutable accounting ledger. Mutations and deletions are strictly prohibited!';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_ledger_tampering ON public.wallet_ledger;
CREATE TRIGGER trg_prevent_ledger_tampering
  BEFORE UPDATE OR DELETE ON public.wallet_ledger
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_tampering();

-- 4. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 500),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  provider payment_gateway_provider NOT NULL,
  account_title VARCHAR(150) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100),
  status withdrawal_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PAYMENT TRANSACTIONS / WEBHOOKS (Idempotent Gateway Logging)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider payment_gateway_provider NOT NULL,
  gateway_tx_id VARCHAR(150) UNIQUE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'succeeded' | 'failed'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. HELPER: GET OR CREATE WALLET FOR USER
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(
  p_user_id UUID,
  p_currency VARCHAR(10) DEFAULT 'PKR'
)
RETURNS public.wallets%ROWTYPE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id AND currency = p_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, currency, available_balance, escrow_balance)
    VALUES (p_user_id, p_currency, 0.00, 0.00)
    RETURNING * INTO v_wallet;
  END IF;

  RETURN v_wallet;
END;
$$;

-- 7. ATOMIC ESCROW HOLD RPC (Locks poster funds on task publication/acceptance)
CREATE OR REPLACE FUNCTION public.create_escrow_hold(
  p_task_id UUID,
  p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_wallet public.wallets%ROWTYPE;
  v_bal_before NUMERIC(14,2);
  v_bal_after NUMERIC(14,2);
  v_total_required NUMERIC(14,2);
BEGIN
  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  v_total_required := v_task.task_charges + v_task.expense_budget;

  -- Lock poster's wallet row
  v_wallet := public.get_or_create_wallet(v_task.poster_id, v_task.currency);
  v_bal_before := v_wallet.available_balance;

  IF v_bal_before < v_total_required THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Required: % %, Available: % %',
      v_total_required, v_task.currency, v_bal_before, v_task.currency;
  END IF;

  v_bal_after := v_bal_before - v_total_required;

  -- Update wallet: move available -> escrow
  UPDATE public.wallets
  SET
    available_balance = v_bal_after,
    escrow_balance = escrow_balance + v_total_required,
    updated_at = NOW()
  WHERE id = v_wallet.id;

  -- Append to immutable ledger
  INSERT INTO public.wallet_ledger (
    wallet_id,
    user_id,
    entry_type,
    amount,
    currency,
    task_id,
    idempotency_key,
    balance_before,
    balance_after,
    reference_info
  )
  VALUES (
    v_wallet.id,
    v_task.poster_id,
    'escrow_hold',
    v_total_required,
    v_task.currency,
    p_task_id,
    p_idempotency_key,
    v_bal_before,
    v_bal_after,
    jsonb_build_object('task_title', v_task.title, 'charges', v_task.task_charges, 'expenses', v_task.expense_budget)
  );

  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'escrow_held', v_total_required,
    'available_remaining', v_bal_after
  );
END;
$$;

-- 8. ATOMIC ESCROW RELEASE RPC (Credits Tasker & Records Platform Commission)
CREATE OR REPLACE FUNCTION public.release_escrow(
  p_task_id UUID,
  p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_poster_wallet public.wallets%ROWTYPE;
  v_tasker_wallet public.wallets%ROWTYPE;
  v_total_escrow NUMERIC(14,2);
  v_tasker_credit NUMERIC(14,2);
  v_platform_fee NUMERIC(14,2);
  v_tasker_before NUMERIC(14,2);
BEGIN
  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.status <> 'completed' AND v_task.status <> 'rated' THEN
    RAISE EXCEPTION 'Cannot release escrow for uncompleted task (status: %)', v_task.status;
  END IF;

  IF v_task.tasker_id IS NULL THEN
    RAISE EXCEPTION 'Task has no assigned tasker';
  END IF;

  v_total_escrow := v_task.task_charges + v_task.expense_budget;
  v_platform_fee := v_task.service_fee;
  v_tasker_credit := v_task.tasker_amount + v_task.expense_budget;

  -- 1. Deduct escrow from poster wallet
  v_poster_wallet := public.get_or_create_wallet(v_task.poster_id, v_task.currency);
  IF v_poster_wallet.escrow_balance < v_total_escrow THEN
    RAISE EXCEPTION 'Inconsistent escrow balance in poster wallet';
  END IF;

  UPDATE public.wallets
  SET
    escrow_balance = escrow_balance - v_total_escrow,
    updated_at = NOW()
  WHERE id = v_poster_wallet.id;

  -- 2. Credit Tasker available balance
  v_tasker_wallet := public.get_or_create_wallet(v_task.tasker_id, v_task.currency);
  v_tasker_before := v_tasker_wallet.available_balance;

  UPDATE public.wallets
  SET
    available_balance = available_balance + v_tasker_credit,
    updated_at = NOW()
  WHERE id = v_tasker_wallet.id;

  -- 3. Record Tasker Payout in immutable ledger
  INSERT INTO public.wallet_ledger (
    wallet_id,
    user_id,
    entry_type,
    amount,
    currency,
    task_id,
    idempotency_key,
    balance_before,
    balance_after,
    reference_info
  )
  VALUES (
    v_tasker_wallet.id,
    v_task.tasker_id,
    'escrow_release',
    v_tasker_credit,
    v_task.currency,
    p_task_id,
    p_idempotency_key,
    v_tasker_before,
    v_tasker_before + v_tasker_credit,
    jsonb_build_object('tasker_amount', v_task.tasker_amount, 'expenses_reimbursed', v_task.expense_budget)
  );

  -- 4. Record Platform Commission in immutable ledger
  INSERT INTO public.wallet_ledger (
    wallet_id,
    user_id,
    entry_type,
    amount,
    currency,
    task_id,
    idempotency_key,
    balance_before,
    balance_after,
    reference_info
  )
  VALUES (
    v_poster_wallet.id,
    v_task.poster_id,
    'platform_fee',
    v_platform_fee,
    v_task.currency,
    p_task_id,
    p_idempotency_key || '_fee',
    v_poster_wallet.available_balance,
    v_poster_wallet.available_balance,
    jsonb_build_object('service_fee', v_platform_fee)
  );

  RETURN jsonb_build_object(
    'success', true,
    'tasker_credited', v_tasker_credit,
    'platform_fee', v_platform_fee,
    'tasker_new_balance', v_tasker_before + v_tasker_credit
  );
END;
$$;

-- 9. ATOMIC ESCROW REFUND RPC (Full or Partial refund on cancellation/dispute)
CREATE OR REPLACE FUNCTION public.refund_escrow(
  p_task_id UUID,
  p_refund_amount NUMERIC(14,2),
  p_reason TEXT,
  p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task public.tasks%ROWTYPE;
  v_wallet public.wallets%ROWTYPE;
  v_bal_before NUMERIC(14,2);
  v_bal_after NUMERIC(14,2);
BEGIN
  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  v_wallet := public.get_or_create_wallet(v_task.poster_id, v_task.currency);
  IF v_wallet.escrow_balance < p_refund_amount THEN
    RAISE EXCEPTION 'Refund amount exceeds escrow held';
  END IF;

  v_bal_before := v_wallet.available_balance;
  v_bal_after := v_bal_before + p_refund_amount;

  UPDATE public.wallets
  SET
    escrow_balance = escrow_balance - p_refund_amount,
    available_balance = v_bal_after,
    updated_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_ledger (
    wallet_id,
    user_id,
    entry_type,
    amount,
    currency,
    task_id,
    idempotency_key,
    balance_before,
    balance_after,
    reference_info
  )
  VALUES (
    v_wallet.id,
    v_task.poster_id,
    'escrow_refund',
    p_refund_amount,
    v_task.currency,
    p_task_id,
    p_idempotency_key,
    v_bal_before,
    v_bal_after,
    jsonb_build_object('reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'refunded', p_refund_amount, 'new_available', v_bal_after);
END;
$$;

-- 10. DEPOSIT MONEY RPC (Top up wallet balance via payment adapter)
CREATE OR REPLACE FUNCTION public.deposit_to_wallet(
  p_user_id UUID,
  p_amount NUMERIC(14,2),
  p_currency VARCHAR(10),
  p_provider payment_gateway_provider,
  p_gateway_tx_id VARCHAR(150),
  p_idempotency_key VARCHAR(128)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
  v_bal_before NUMERIC(14,2);
  v_bal_after NUMERIC(14,2);
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Deposit amount must be positive';
  END IF;

  -- Record payment transaction
  INSERT INTO public.payment_transactions (
    user_id,
    provider,
    gateway_tx_id,
    amount,
    currency,
    status,
    payload
  )
  VALUES (
    p_user_id,
    p_provider,
    p_gateway_tx_id,
    p_amount,
    p_currency,
    'succeeded',
    jsonb_build_object('idempotency_key', p_idempotency_key)
  )
  ON CONFLICT (gateway_tx_id) DO NOTHING;

  -- Lock and update wallet
  v_wallet := public.get_or_create_wallet(p_user_id, p_currency);
  v_bal_before := v_wallet.available_balance;
  v_bal_after := v_bal_before + p_amount;

  UPDATE public.wallets
  SET
    available_balance = v_bal_after,
    updated_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_ledger (
    wallet_id,
    user_id,
    entry_type,
    amount,
    currency,
    idempotency_key,
    balance_before,
    balance_after,
    reference_info
  )
  VALUES (
    v_wallet.id,
    p_user_id,
    'deposit',
    p_amount,
    p_currency,
    p_idempotency_key,
    v_bal_before,
    v_bal_after,
    jsonb_build_object('provider', p_provider, 'gateway_tx_id', p_gateway_tx_id)
  );

  RETURN jsonb_build_object('success', true, 'deposited', p_amount, 'new_balance', v_bal_after);
END;
$$;

-- 11. REQUEST WITHDRAWAL RPC
CREATE OR REPLACE FUNCTION public.request_wallet_withdrawal(
  p_amount NUMERIC(14,2),
  p_provider payment_gateway_provider,
  p_account_title VARCHAR(150),
  p_account_number VARCHAR(100),
  p_bank_name VARCHAR(100) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_wallet public.wallets%ROWTYPE;
  v_withdrawal_id UUID;
  v_bal_before NUMERIC(14,2);
  v_bal_after NUMERIC(14,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount < 500 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is PKR 500';
  END IF;

  v_wallet := public.get_or_create_wallet(v_user_id, 'PKR');
  v_bal_before := v_wallet.available_balance;

  IF v_bal_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;

  v_bal_after := v_bal_before - p_amount;

  -- Deduct from wallet immediately to prevent double-spending
  UPDATE public.wallets
  SET
    available_balance = v_bal_after,
    updated_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO public.withdrawals (
    user_id,
    wallet_id,
    amount,
    currency,
    provider,
    account_title,
    account_number,
    bank_name,
    status
  )
  VALUES (
    v_user_id,
    v_wallet.id,
    p_amount,
    'PKR',
    p_provider,
    p_account_title,
    p_account_number,
    p_bank_name,
    'pending'
  )
  RETURNING id INTO v_withdrawal_id;

  INSERT INTO public.wallet_ledger (
    wallet_id,
    user_id,
    entry_type,
    amount,
    currency,
    idempotency_key,
    balance_before,
    balance_after,
    reference_info
  )
  VALUES (
    v_wallet.id,
    v_user_id,
    'withdrawal',
    p_amount,
    'PKR',
    'wd_' || v_withdrawal_id::text,
    v_bal_before,
    v_bal_after,
    jsonb_build_object('withdrawal_id', v_withdrawal_id, 'provider', p_provider)
  );

  RETURN v_withdrawal_id;
END;
$$;

-- 12. RLS SECURITY POLICIES
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wallet" ON public.wallets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users read own ledger" ON public.wallet_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users read and create own withdrawals" ON public.withdrawals
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own payment transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
