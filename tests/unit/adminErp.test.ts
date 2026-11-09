import {
  getPendingKycSubmissions,
  adminReviewKyc,
  __resetKycQueue,
} from '../../src/features/kyc/kycService';
import {
  adminReviewProperty,
  getPropertiesFeed,
  __resetRealEstateStore,
} from '../../src/features/realEstate/realEstateService';
import {
  submitTaskDispute,
  getOpenDisputes,
  resolveTaskDispute,
  __resetExecutionStore,
} from '../../src/features/execution/executionService';
import {
  requestWithdrawal,
  getAllWithdrawals,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
  getPlatformFinancialStats,
  depositToWallet,
  __resetFinancialStore,
} from '../../src/features/wallet/walletService';

describe('Phase 9 — Admin ERP Operations, Dispute Arbitration & Verification', () => {
  const adminId = 'usr-admin-super';

  beforeEach(() => {
    __resetKycQueue();
    __resetRealEstateStore();
    __resetExecutionStore();
    __resetFinancialStore();
  });

  test('Module 3: KYC Verification Queue allows approving and rejecting submissions', async () => {
    const queue = await getPendingKycSubmissions();
    expect(queue.length).toBeGreaterThanOrEqual(1);

    const firstKyc = queue[0];
    expect(firstKyc.status).toBe('under_review');
    expect(firstKyc.id_number_masked).toContain('*');

    // Admin approves KYC
    const approval = await adminReviewKyc(firstKyc.id, adminId, 'approved');
    expect(approval.success).toBe(true);
    expect(approval.status).toBe('approved');

    // Verify removed from pending queue
    const remainingQueue = await getPendingKycSubmissions();
    expect(remainingQueue.some((k) => k.id === firstKyc.id)).toBe(false);
  });

  test('Module 11: Real Estate 3-Tier Verification grants verified listing and reviewed badges', async () => {
    const properties = await getPropertiesFeed();
    const targetProp = properties[0];

    const result = await adminReviewProperty(targetProp.id, 'verified', true);
    expect(result).toBe(true);

    const updatedFeed = await getPropertiesFeed();
    const updatedProp = updatedFeed.find((p) => p.id === targetProp.id);
    expect(updatedProp?.verified_listing).toBe(true);
    expect(updatedProp?.documents_reviewed).toBe(true);
    expect(updatedProp?.verification_status).toBe('verified');
  });

  test('Module 6: Task Disputes Arbiter resolves open disputes with full release or refund', async () => {
    const dispute = await submitTaskDispute(
      'task-demo-1',
      'poster-1',
      'Tasker did not arrive at car parts shop.',
      'Tasker was unresponsive for 3 hours past agreed window.'
    );

    const openDisputes = await getOpenDisputes();
    expect(openDisputes.length).toBeGreaterThanOrEqual(1);
    expect(openDisputes.some((d) => d.id === dispute.id)).toBe(true);

    // Admin resolves dispute in favor of refunding poster
    const resolved = await resolveTaskDispute(dispute.id, 'refund_to_poster', 'Valid claim backed by GPS timestamps');
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolution_type).toBe('full_refund');

    // Removed from open disputes
    const openAfter = await getOpenDisputes();
    expect(openAfter.some((d) => d.id === dispute.id)).toBe(false);
  });

  test('Module 9: Payout & Withdrawal reconciliation approves payout and logs reference', async () => {
    const userId = 'usr-payout-candidate';
    await depositToWallet(userId, 5000, 'jazzcash', 'Initial balance for testing payout');

    const withdrawal = await requestWithdrawal(
      userId,
      2500,
      'jazzcash',
      'Ali Khan',
      '03001234567'
    );
    expect(withdrawal.status).toBe('pending');

    const allWithdrawals = await getAllWithdrawals();
    expect(allWithdrawals.some((w) => w.id === withdrawal.id)).toBe(true);

    // Admin approves payout
    const approved = await adminApproveWithdrawal(withdrawal.id, 'JC-TXN-887192');
    expect(approved.status).toBe('completed');
    expect(approved.admin_notes).toContain('JC-TXN-887192');
  });

  test('Module 1: Platform executive financial stats computes pending liabilities', async () => {
    const userId = 'usr-payout-candidate-2';
    await depositToWallet(userId, 10000, 'easypaisa', 'Test deposit');
    await requestWithdrawal(userId, 3000, 'easypaisa', 'Zahid Hussain', '03129876543');

    const stats = await getPlatformFinancialStats();
    expect(stats.totalWithdrawalsPending).toBeGreaterThanOrEqual(3000);
    expect(stats.totalTransactionsCount).toBeGreaterThanOrEqual(2);
  });
});
