import {
  depositInputSchema,
  withdrawalInputSchema,
  escrowOperationSchema,
  refundOperationSchema,
} from '../../src/features/wallet/validation';
import {
  getPaymentAdapter,
  PAYMENT_ADAPTERS,
} from '../../src/features/wallet/paymentAdapters';
import {
  getUserWallet,
  getWalletLedger,
  depositToWallet,
  holdTaskEscrow,
  releaseTaskEscrow,
  refundTaskEscrow,
  requestWithdrawal,
  __resetFinancialStore,
} from '../../src/features/wallet/walletService';
import {
  createNewTask,
  acceptTaskAtomic,
  __resetMockStore,
} from '../../src/features/tasks/taskService';

describe('Phase 5 — Task Financial Engine & Immutable Ledger', () => {
  beforeEach(() => {
    __resetFinancialStore();
    __resetMockStore();
  });

  test('validates deposit and withdrawal schemas with provider-specific rules', () => {
    // Deposit schema
    expect(
      depositInputSchema.safeParse({
        amount: 1000,
        provider: 'jazzcash',
      }).success
    ).toBe(true);
    expect(
      depositInputSchema.safeParse({
        amount: 50, // < 100 PKR fails
        provider: 'jazzcash',
      }).success
    ).toBe(false);

    // Withdrawal schema
    expect(
      withdrawalInputSchema.safeParse({
        amount: 1500,
        provider: 'jazzcash',
        accountTitle: 'Muhammad Ali',
        accountNumber: '03001234567',
      }).success
    ).toBe(true);

    // Withdrawal < 500 PKR fails
    expect(
      withdrawalInputSchema.safeParse({
        amount: 200,
        provider: 'jazzcash',
        accountTitle: 'Muhammad Ali',
        accountNumber: '03001234567',
      }).success
    ).toBe(false);

    // Bank transfer requires bankName
    expect(
      withdrawalInputSchema.safeParse({
        amount: 2000,
        provider: 'bank_transfer',
        accountTitle: 'Muhammad Ali',
        accountNumber: 'PK92MEZN00012345678901',
      }).success
    ).toBe(false);

    expect(
      withdrawalInputSchema.safeParse({
        amount: 2000,
        provider: 'bank_transfer',
        accountTitle: 'Muhammad Ali',
        accountNumber: 'PK92MEZN00012345678901',
        bankName: 'Meezan Bank Ltd',
      }).success
    ).toBe(true);
  });

  test('provides pluggable payment gateway adapters for JazzCash, Easypaisa, Bank and Stripe', async () => {
    expect(Object.keys(PAYMENT_ADAPTERS)).toHaveLength(4);

    const jc = getPaymentAdapter('jazzcash');
    const jcRes = await jc.initiateDeposit(1000, 'PKR', 'user-1');
    expect(jcRes.txId).toMatch(/^jc_tx_/);
    expect(jcRes.instructions).toContain('MPIN');

    const ep = getPaymentAdapter('easypaisa');
    const epRes = await ep.initiateDeposit(1000, 'PKR', 'user-1');
    expect(epRes.txId).toMatch(/^ep_tx_/);

    const bank = getPaymentAdapter('bank_transfer');
    const bankRes = await bank.initiateDeposit(5000, 'PKR', 'user-1');
    expect(bankRes.instructions).toContain('IBAN');

    const stripe = getPaymentAdapter('stripe');
    const stripeRes = await stripe.initiateDeposit(5000, 'PKR', 'user-1');
    expect(stripeRes.paymentUrl).toContain('stripe.com');
  });

  test('executes complete double-entry escrow cycle (Deposit -> Hold -> Release -> Platform Fee)', async () => {
    const posterId = 'poster-finance-1';
    const taskerId = 'tasker-finance-1';

    // 1. Initial Deposit
    await depositToWallet(posterId, 5000, 'jazzcash');
    const w1 = await getUserWallet(posterId);
    expect(w1.available_balance).toBe(5000);
    expect(w1.escrow_balance).toBe(0);

    // 2. Create Task (Reward 1000, Expense Budget 200, Service Fee 100, Tasker Receives 900)
    const task = await createNewTask(posterId, {
      categoryId: 'cat-2',
      title: 'Deliver urgent documents to bank',
      description: 'Pick up file and deliver to bank branch.',
      locationType: 'physical_single',
      locationAddress: 'Mall Road, Lahore',
      taskCharges: 1000,
      expenseBudget: 200,
      deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      acceptanceMethod: 'instant',
      photos: [],
      customData: {},
    });

    await acceptTaskAtomic(task.id, taskerId);

    // 3. Hold Escrow: 1000 + 200 = 1200 PKR
    const holdRes = await holdTaskEscrow(task.id, posterId);
    expect(holdRes.escrowHeld).toBe(1200);

    const wPosterAfterHold = await getUserWallet(posterId);
    expect(wPosterAfterHold.available_balance).toBe(3800); // 5000 - 1200
    expect(wPosterAfterHold.escrow_balance).toBe(1200);

    // 4. Mark Task Completed to enable Release
    task.status = 'completed';

    // 5. Release Escrow
    const releaseRes = await releaseTaskEscrow(task.id);
    expect(releaseRes.taskerCredited).toBe(1100); // 900 reward + 200 expenses
    expect(releaseRes.platformFee).toBe(100); // 10%

    // Verify Poster Balances
    const wPosterFinal = await getUserWallet(posterId);
    expect(wPosterFinal.escrow_balance).toBe(0);
    expect(wPosterFinal.available_balance).toBe(3800);

    // Verify Tasker Balances
    const wTaskerFinal = await getUserWallet(taskerId);
    expect(wTaskerFinal.available_balance).toBe(1100);

    // Verify Immutable Ledger Audit Entries
    const posterLedger = await getWalletLedger(posterId);
    expect(posterLedger.some((e) => e.entry_type === 'escrow_hold' && e.amount === 1200)).toBe(true);
    expect(posterLedger.some((e) => e.entry_type === 'platform_fee' && e.amount === 100)).toBe(true);

    const taskerLedger = await getWalletLedger(taskerId);
    expect(taskerLedger.some((e) => e.entry_type === 'escrow_release' && e.amount === 1100)).toBe(true);
  });

  test('refunds escrow held on task cancellation or dispute', async () => {
    const posterId = 'poster-refund-1';
    await depositToWallet(posterId, 3000, 'easypaisa');

    const task = await createNewTask(posterId, {
      categoryId: 'cat-8',
      title: 'Living room deep cleaning',
      description: 'Deep clean sofas and carpet.',
      locationType: 'physical_single',
      locationAddress: 'Gulberg 2, Lahore',
      taskCharges: 1500,
      deadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      acceptanceMethod: 'instant',
      photos: [],
      customData: {},
    });

    await holdTaskEscrow(task.id, posterId);
    const wAfterHold = await getUserWallet(posterId);
    expect(wAfterHold.available_balance).toBe(1500);
    expect(wAfterHold.escrow_balance).toBe(1500);

    // Refund escrow
    const refundRes = await refundTaskEscrow(task.id, 1500, 'Tasker failed to arrive');
    expect(refundRes.refunded).toBe(1500);
    expect(refundRes.newAvailable).toBe(3000);

    const wAfterRefund = await getUserWallet(posterId);
    expect(wAfterRefund.available_balance).toBe(3000);
    expect(wAfterRefund.escrow_balance).toBe(0);

    const ledger = await getWalletLedger(posterId);
    expect(ledger.some((e) => e.entry_type === 'escrow_refund' && e.amount === 1500)).toBe(true);
  });

  test('processes payout withdrawals and prevents overdrafts', async () => {
    const taskerId = 'tasker-wd-1';
    await depositToWallet(taskerId, 2500, 'bank_transfer');

    // Valid withdrawal
    const wd = await requestWithdrawal(
      taskerId,
      1000,
      'jazzcash',
      'Bilal Ahmed',
      '03009876543'
    );
    expect(wd.id).toBeTruthy();
    expect(wd.status).toBe('pending');

    const w = await getUserWallet(taskerId);
    expect(w.available_balance).toBe(1500); // 2500 - 1000

    // Overdraft withdrawal must fail
    await expect(
      requestWithdrawal(taskerId, 3000, 'jazzcash', 'Bilal Ahmed', '03009876543')
    ).rejects.toThrow(/Insufficient available balance/);
  });
});
