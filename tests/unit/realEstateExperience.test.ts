import {
  createPropertyInquiry,
  schedulePropertyViewing,
  getBuyerInquiries,
  getBuyerViewings,
  getSellerProperties,
  getSellerInquiries,
  getSellerViewings,
  updateViewingStatus,
  respondToInquiry,
  getSellerAnalytics,
  getPropertyProjects,
  __resetRealEstateStore,
} from '../../src/features/realEstate/realEstateService';

describe('Phase 8 — Buyer & Seller Portals, Viewing Lifecycle & Projects', () => {
  const buyerId = 'usr-buyer-test-8';
  const sellerId = 'usr-seller-1'; // Owner of prop-demo-1
  const propertyId = 'prop-demo-1';

  beforeEach(() => {
    __resetRealEstateStore();
  });

  test('Buyer submits inquiry with purchase offer and tracks in Buyer Hub', async () => {
    const inquiry = await createPropertyInquiry(
      propertyId,
      buyerId,
      'I am interested in this DHA Phase 6 house and offering PKR 9.2 Crore.',
      92000000
    );

    expect(inquiry.id).toBeDefined();
    expect(inquiry.buyer_id).toBe(buyerId);
    expect(inquiry.seller_id).toBe(sellerId);
    expect(inquiry.offer_price).toBe(92000000);
    expect(inquiry.status).toBe('offer_submitted');

    // Buyer retrieves their active inquiries
    const buyerInqs = await getBuyerInquiries(buyerId);
    expect(buyerInqs.length).toBeGreaterThanOrEqual(1);
    expect(buyerInqs.some((i) => i.id === inquiry.id)).toBe(true);

    // Seller receives the lead in Seller Hub
    const sellerInqs = await getSellerInquiries(sellerId);
    expect(sellerInqs.some((i) => i.id === inquiry.id)).toBe(true);
  });

  test('Viewing appointment lifecycle: schedule, confirm, reschedule and cancel', async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    const viewing = await schedulePropertyViewing(
      propertyId,
      buyerId,
      futureDate,
      null,
      'Family visiting on weekend afternoon.'
    );

    expect(viewing.id).toBeDefined();
    expect(viewing.status).toBe('pending');
    expect(viewing.scheduled_at).toBe(futureDate);
    expect(viewing.seller_id).toBe(sellerId);

    // Buyer sees appointment in schedule
    const buyerViews = await getBuyerViewings(buyerId);
    expect(buyerViews.some((v) => v.id === viewing.id)).toBe(true);

    // Seller confirms viewing
    const confirmed = await updateViewingStatus(viewing.id, 'confirmed');
    expect(confirmed.status).toBe('confirmed');

    // Rescheduling with updated future date
    const rescheduledDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    const rescheduled = await updateViewingStatus(viewing.id, 'rescheduled', rescheduledDate);
    expect(rescheduled.status).toBe('rescheduled');
    expect(rescheduled.scheduled_at).toBe(rescheduledDate);

    // Cancellation
    const cancelled = await updateViewingStatus(viewing.id, 'cancelled');
    expect(cancelled.status).toBe('cancelled');
  });

  test('Seller offer negotiation: accept and reject decisions', async () => {
    const inq = await createPropertyInquiry(
      propertyId,
      buyerId,
      'Offering PKR 90,000,000 cash payment with quick token deposit.',
      90000000
    );
    expect(inq.status).toBe('offer_submitted');

    // Seller accepts offer
    const accepted = await respondToInquiry(inq.id, 'accepted');
    expect(accepted.status).toBe('accepted');

    // Seller rejects or counters offer
    const rejectedInq = await createPropertyInquiry(
      propertyId,
      'usr-buyer-lowball',
      'Offering PKR 60,000,000.',
      60000000
    );
    const rejected = await respondToInquiry(rejectedInq.id, 'rejected');
    expect(rejected.status).toBe('rejected');
  });

  test('Seller analytics KPI aggregation aggregates active listings, views, and leads', async () => {
    // Generate an inquiry and viewing for sellerId
    await createPropertyInquiry(propertyId, buyerId, 'Interested in touring the house.', 93000000);
    const futureDate = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
    await schedulePropertyViewing(propertyId, buyerId, futureDate);

    const stats = await getSellerAnalytics(sellerId);
    expect(stats.totalListings).toBeGreaterThanOrEqual(1);
    expect(stats.activeListings).toBeGreaterThanOrEqual(1);
    expect(stats.totalViews).toBeGreaterThanOrEqual(1000); // prop-demo-1 has 1420 views
    expect(stats.totalInquiries).toBeGreaterThanOrEqual(1);
    expect(stats.totalViewings).toBeGreaterThanOrEqual(1);
  });

  test('Discovers official master-planned projects with developer verification', async () => {
    const projects = await getPropertyProjects();
    expect(projects.length).toBeGreaterThanOrEqual(1);

    const [firstProject] = projects;
    expect(firstProject.project_name).toBe('Al-Noor Orchard High-Tech City');
    expect(firstProject.developer_name).toBe('Al-Jalil Developers');
    expect(firstProject.city).toBe('Lahore');
    expect(firstProject.is_verified_project).toBe(true);
    expect(firstProject.price_from).toBe(3500000);
    expect(firstProject.total_units).toBe(1200);
  });
});
