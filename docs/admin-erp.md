# TaskIt ⚡ — Admin ERP & Governance Architecture (`/admin`)

**Status:** Completed & Tested (Phase 9)  
**Deliverables:**
- Unified Administrative ERP Portal (`app/admin/index.tsx`)
- 24-Module Governance System covering both Marketplace A (Tasks) and Marketplace B (Real Estate)
- Executive Health & System KPIs Overview
- Live KYC Verification Queue (1-click Approve / Reject with private storage paths)
- Real Estate 3-Tier Verification Queue (Physical inspection & document deed approval)
- Task Disputes Arbitration Desk (Evidence review, escrow release or poster refund)
- Financial Ledger & Payout Reconciliations (JazzCash, Easypaisa, Raast, Bank Transfer)
- Automated Unit Tests: `tests/unit/adminErp.test.ts` (5 test suites)

---

## 1. 24 Operational Modules Directory
The TaskIt Administration ERP covers the complete enterprise marketplace lifecycle:
1. **Executive Overview:** High-level platform health, escrow balances, and operational counts.
2. **Member Management:** Role assignments (`member`, `tasker`, `agent`, `admin`, `super_admin`), activity logs, and account suspensions.
3. **KYC Verification Queue:** Vetting government-issued CNIC, National ID, Passport, and driving licences against live camera selfies.
4. **Task Operations:** Oversight of tasks across all lifecycle states (`open`, `accepted`, `in_progress`, `submitted`, `completed`, `cancelled`).
5. **Task Categories & Custom Fields:** Dynamic schema engine for custom category requirements (e.g. car part VIN numbers, grocery item lists).
6. **Task Disputes Arbiter:** Independent judicial arbiter for contested tasks; authority to execute full refunds, escrow releases, or split payouts.
7. **Escrow Wallets Management:** Double-entry ledger oversight ensuring balances match immutable ledger records.
8. **Payment Gateway Reconciliations:** Real-time health monitoring of JazzCash, Easypaisa, Raast, and Stripe adapters.
9. **Payouts & Withdrawals Queue:** Multi-channel payout dispatch with automated ledger deduction and anti-tamper triggers.
10. **Real Estate Listings:** Portfolio oversight across 9 listing types (For Sale, For Rent, Commercial, Plots, etc.).
11. **Property 3-Tier Verification:** Awarding verified badges based on title deed inspection (`verified_listing: true`, `documents_reviewed: true`).
12. **Real Estate Categories:** Managing 15 property categories with multilingual Urdu/English slugs.
13. **Property Reports & Flags:** Rapid review of user-reported misleading listings or fraudulent pricing.
14. **Property Leads & Inquiries:** System-wide monitoring of buyer-seller interactions.
15. **Housing Schemes & Master Projects:** Managing government-approved (LDA, CDA, RDA) new developments and installment schemes.
16. **Featured & Promoted Listings:** Sponsorship slot configuration and homepage carousel controls.
17. **Agency Subscription Packages:** Agent tier entitlements, listing quotas, and agency branding.
18. **Monetization & Commission Rules:** Platform service fee configurations (10% task fee, real estate lead fees).
19. **Push & In-App Notifications:** Broadcast and targeted member messaging via Expo Notifications.
20. **Multilingual Strings & Locales:** Oversight of 15 localized dictionary files and RTL layout adaptations.
21. **Platform Analytics & KPIs:** Granular cohort analysis, transaction velocities, and geographical heatmaps.
22. **Administrator Roles & RBAC:** Server-enforced role-based access control preventing privilege escalation.
23. **Security & Immutable Audit Logs:** Append-only audit logging of all sensitive administrative actions.
24. **System Settings & Maintenance Mode:** Emergency kill-switches, maintenance mode, and backup configurations.

---

## 2. Verification & Testing
Validated via automated unit test suite `tests/unit/adminErp.test.ts`:
- **Module 3:** KYC verification approval and rejection state transitions.
- **Module 11:** Granting verified listing badges and document approval for real estate.
- **Module 6:** Task dispute arbitration with full poster refund or tasker release.
- **Module 9:** Payout approval with transaction reference code logging.
- **Module 1:** Executive KPI calculation for pending liabilities.
