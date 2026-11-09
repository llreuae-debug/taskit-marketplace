# TaskIt ⚡ — Real Estate Buyer & Seller Experience Architecture

**Status:** Completed & Tested (Phase 8)  
**Deliverables:**
- **Buyer Hub (`app/real-estate/buyer-dashboard.tsx`):** Active inquiries, purchase offer statuses, physical viewing calendar, saved shortcuts, and comparison launcher.
- **Seller & Agent Hub (`app/real-estate/seller-dashboard.tsx`):** Portfolio performance KPI ribbon, active listing controls, viewing requests manager (Confirm / Reschedule / Cancel), and lead negotiation inbox.
- **New Housing Projects Portal (`app/properties/projects.tsx`):** Master-planned communities, government NOC badges, payment plan brochure download, and direct developer booking inquiries.
- **Service API (`src/features/realEstate/realEstateService.ts`):** Operations for buyer/seller inquiries, appointment management, offer accept/counter/reject, and portfolio analytics.
- **Test Suite (`tests/unit/realEstateExperience.test.ts`):** 5 automated test cases verifying the full lifecycle.

---

## 1. Buyer Experience Workflow
Members actively searching for real estate can manage all their prospective transactions from the **Buyer Hub**:
1. **Inquiries & Offers Tracker:**
   - Displays real-time status of each submitted message and formal purchase offer (`new`, `offer_submitted`, `accepted`, `rejected`, `countered`).
   - Transparent display of original asking price vs. submitted buyer offer in Pakistani Rupees (formatted in Lac / Crore).
   - In-app routing to full property specifications and direct seller chat.
2. **Viewing Inspection Appointments:**
   - Real-time calendar schedule of confirmed, pending, and rescheduled appointments.
   - Exact physical location display with notes left by buyer for the property visit.
3. **Shortcuts:** One-tap access to Saved Properties and Side-by-Side Property Comparison.

---

## 2. Seller & Landlord Hub Workflow
Property owners and certified real estate agents can run their portfolio efficiently:
1. **Portfolio KPI Ribbon:**
   - Aggregated metrics: Total Listed, Active Listings, Total Public Views, Total Incoming Inquiries/Leads.
2. **Listings Portfolio Management:**
   - Status indicators (`active`, `under_offer`, `sold`, `archived`).
   - 3-tier verification badge review indicator (`⚡ Verified Listing`, `📑 Docs Reviewed`).
   - Views, inquiries, and favourites counters for each property.
3. **Viewing Request Manager:**
   - Immediate action buttons to **Confirm** or **Reject** inspection requests from buyers.
   - Timestamp and buyer notes display.
4. **Negotiation & Lead Inbox:**
   - Review incoming messages and purchase offers.
   - One-tap **Accept Offer** or **Decline Offer** with automatic status synchronization.

---

## 3. New Housing & Commercial Projects
Showcases large-scale master developments (e.g. Al-Noor Orchard, Eighteen Islamabad, smart cities):
- Official government approval / LDA / CDA / RDA NOC badges (`⚡ Approved Scheme`).
- Flexible installment plan details with starting prices.
- Total units and construction progress status.
- One-tap brochure delivery and direct developer booking inquiries.

---

## 4. Verification & Testing
Validated via automated unit test suite `tests/unit/realEstateExperience.test.ts`:
- Inquiry submission with purchase offer tracking.
- Viewing appointment scheduling, confirmation, rescheduling, and cancellation.
- Seller offer acceptance and rejection transitions.
- Seller analytics KPI aggregation.
- Master project metadata and developer verification.
