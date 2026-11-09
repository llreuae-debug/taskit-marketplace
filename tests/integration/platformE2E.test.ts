import {
  evaluateKycAccessGate,
} from '../../src/features/kyc/validation';
import {
  submitMemberKycApplication,
  adminReviewKyc,
  __resetKycQueue,
} from '../../src/features/kyc/kycService';
import {
  createNewTask,
  acceptTaskAtomic,
  getTaskById,
  __resetMockStore,
} from '../../src/features/tasks/taskService';
import {
  submitTaskProof,
  completeTask,
  submitTaskRating,
  submitTaskDispute,
  resolveTaskDispute,
  __resetExecutionStore,
} from '../../src/features/execution/executionService';
import {
  depositToWallet,
  holdTaskEscrow,
  releaseTaskEscrow,
  requestWithdrawal,
  adminApproveWithdrawal,
  getUserWallet,
  __resetFinancialStore,
} from '../../src/features/wallet/walletService';
import {
  createPropertyListing,
  adminReviewProperty,
  getPropertiesFeed,
  togglePropertyFavourite,
  createPropertyInquiry,
  schedulePropertyViewing,
  updateViewingStatus,
  respondToInquiry,
  compareProperties,
  __resetRealEstateStore,
} from '../../src/features/realEstate/realEstateService';

describe('TaskIt ⚡ — End-to-End Platform Integration (Tasks + Real Estate)', () => {
  const posterId = 'usr-e2e-poster';
  const taskerId = 'usr-e2e-tasker';
  const buyerId = 'usr-e2e-buyer';
  const adminId = 'usr-e2e-admin';

  beforeEach(() => {
    __resetKycQueue();
    __resetMockStore();
    __resetExecutionStore();
    __resetFinancialStore();
    __resetRealEstateStore();
  });

  test('Complete Cross-Marketplace E2E Lifecycle: KYC -> Task Escrow & Proof -> Real Estate Verification & Offer', async () => {
    // -------------------------------------------------------------------------
    // STEP 1: Single Account Identity & KYC Gating
    // -------------------------------------------------------------------------
    const initialGate = evaluateKycAccessGate('post_task', 'pending');
    expect(initialGate.allowed).toBe(false);
    expect(initialGate.reason).toContain('verification (KYC) must be Approved');

    // Member submits 5-step KYC
    const kycResult = await submitMemberKycApplication(posterId, {
      primaryPhone: '+923001234567',
      primaryOtpVerified: true,
      fullName: 'Muhammad Usman Khan',
      dateOfBirth: '1990-05-12',
      country: 'Pakistan',
      city: 'Lahore',
      area: 'Gulberg III',
      fullAddress: 'Flat 4, Main Boulevard Gulberg, Lahore',
      documentType: 'cnic',
      idNumber: '3520112345671',
      latitude: 31.5204,
      longitude: 74.3587,
      frontImageUri: 'file://mock/front.jpg',
      selfieImageUri: 'file://mock/selfie.jpg',
      consentAccepted: true,
    });
    expect(kycResult.status).toBe('under_review');

    // Admin reviews and approves KYC in ERP
    const kycReview = await adminReviewKyc(kycResult.kycId, adminId, 'approved');
    expect(kycReview.status).toBe('approved');

    const approvedGate = evaluateKycAccessGate('post_task', 'approved');
    expect(approvedGate.allowed).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 2: Task Marketplace Execution with Dual Escrow & Completion Proof
    // -------------------------------------------------------------------------
    // Poster deposits funds into wallet
    await depositToWallet(posterId, 5000, 'jazzcash', 'Task escrow deposit');
    const posterWalletBefore = await getUserWallet(posterId, 'PKR');
    expect(posterWalletBefore.available_balance).toBe(5000);

    // Poster creates Car Parts Finder task
    const task = await createNewTask(posterId, {
      categoryId: 'cat-1',
      title: 'Find Honda Civic 2021 Left Headlight in Montgomery Road',
      description: 'Need original LED headlight unit in pristine condition.',
      locationType: 'physical_pickup_dropoff',
      taskCharges: 2000,
      expenseBudget: 1000,
      currency: 'PKR',
      pickupAddress: 'Montgomery Road, Lahore',
      dropoffAddress: 'Gulberg III, Lahore',
      deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      acceptanceMethod: 'instant',
      photos: [],
    });
    expect(task.id).toBeDefined();
    expect(task.service_fee).toBe(200); // 10% fee
    expect(task.tasker_amount).toBe(1800);

    // Lock Escrow for task (PKR 2,000 + PKR 1,000 budget = 3,000)
    const escrowHold = await holdTaskEscrow(task.id, posterId);
    expect(escrowHold.success).toBe(true);
    expect(escrowHold.escrowHeld).toBe(3000);

    const posterWalletEscrow = await getUserWallet(posterId, 'PKR');
    expect(posterWalletEscrow.available_balance).toBe(2000);
    expect(posterWalletEscrow.escrow_balance).toBe(3000);

    // Verified Tasker accepts the task atomically
    const acceptRes = await acceptTaskAtomic(task.id, taskerId);
    expect(acceptRes.success).toBe(true);
    expect(acceptRes.completion_code).toBeDefined(); // 4-digit verification code

    const refreshedTask = await getTaskById(task.id);
    expect(refreshedTask?.status).toBe('accepted');
    expect(refreshedTask?.tasker_id).toBe(taskerId);

    // Tasker submits photo proof of purchase and delivery
    const proof = await submitTaskProof(
      task.id,
      taskerId,
      ['https://images.unsplash.com/mock-headlight.jpg'],
      [],
      'Purchased genuine Honda OEM headlight unit. Inspected with video and handed over.'
    );
    expect(proof.id).toBeDefined();
    expect(proof.proof_photos).toHaveLength(1);

    // Tasker completes task using the 4-digit code
    const completion = await completeTask(task.id, taskerId, acceptRes.completion_code);
    expect(completion.success).toBe(true);
    expect(completion.status).toBe('completed');

    // Poster confirms completion and releases escrow
    const release = await releaseTaskEscrow(task.id);
    expect(release.success).toBe(true);
    expect(release.platformFee).toBe(200);

    // Tasker available balance receives tasker reward (1800 + 1000 budget = 2800)
    const taskerWallet = await getUserWallet(taskerId, 'PKR');
    expect(taskerWallet.available_balance).toBe(2800);

    // Mutual rating
    const ratingSubmitted = await submitTaskRating(task.id, posterId, 5, 'Flawless parts finding service!');
    expect(ratingSubmitted).toBe(true);

    // Tasker withdraws earnings to JazzCash
    const withdrawal = await requestWithdrawal(taskerId, 2500, 'jazzcash', 'Hamza Malik', '03001234567');
    expect(withdrawal.status).toBe('pending');

    // Admin approves payout in ERP
    const approvedWithdrawal = await adminApproveWithdrawal(withdrawal.id, 'JC-TXN-998822');
    expect(approvedWithdrawal.status).toBe('completed');

    // -------------------------------------------------------------------------
    // STEP 3: Real Estate Marketplace (3-Tier Badging, Offer & Viewing)
    // -------------------------------------------------------------------------
    // The same verified member lists a property for sale
    const property = await createPropertyListing(posterId, {
      title: '5 Marla Luxury Modern House in DHA Phase 9 Prism',
      description: 'Brand new 3-bedroom designer house ready for immediate possession.',
      listingType: 'for_sale',
      propertyType: 'house',
      price: 17500000,
      currency: 'PKR',
      city: 'Lahore',
      area: 'DHA Phase 9 Prism',
      landSize: 5,
      sizeUnit: 'marla',
      bedrooms: 3,
      bathrooms: 4,
      hideExactAddress: true,
      documentPaths: ['property-docs/registry-1.pdf'],
    });
    expect(property.id).toBeDefined();
    expect(property.verification_status).toBe('pending_review');

    // Admin inspects title deed and approves 3-tier badge
    const badgeApproved = await adminReviewProperty(property.id, 'verified', true);
    expect(badgeApproved).toBe(true);

    // Buyer searches properties
    const lahoreFeed = await getPropertiesFeed({ city: 'Lahore', listingType: 'for_sale' });
    expect(lahoreFeed.some((p) => p.id === property.id)).toBe(true);

    // Buyer saves property to favourites
    const favResult = await togglePropertyFavourite(property.id, buyerId);
    expect(favResult).toBe(true);

    // Buyer schedules physical site inspection
    const appointmentDate = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
    const viewing = await schedulePropertyViewing(property.id, buyerId, appointmentDate, null, 'Visiting with architect.');
    expect(viewing.status).toBe('pending');

    // Seller confirms viewing
    const confirmedViewing = await updateViewingStatus(viewing.id, 'confirmed');
    expect(confirmedViewing.status).toBe('confirmed');

    // Buyer submits official purchase offer
    const offer = await createPropertyInquiry(property.id, buyerId, 'Offering PKR 1.7 Crore cash payment.', 17000000);
    expect(offer.status).toBe('offer_submitted');
    expect(offer.offer_price).toBe(17000000);

    // Seller accepts offer
    const acceptedOffer = await respondToInquiry(offer.id, 'accepted');
    expect(acceptedOffer.status).toBe('accepted');

    // Buyer compares property with another listing
    const comparison = await compareProperties([property.id, 'prop-demo-1']);
    expect(comparison).toHaveLength(2);
  });
});
