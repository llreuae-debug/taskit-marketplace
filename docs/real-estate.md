# TaskIt ⚡ — Real Estate Marketplace Backend & 3-Tier Verification Architecture

## 1. Overview
Marketplace B within TaskIt provides a dedicated, high-performance property ecosystem where members can buy, sell, rent, and discover properties while sharing the member identity, notifications, and chat infrastructure of TaskIt.

## 2. 15 Real Estate Categories
1. `buy-property`
2. `sell-property`
3. `rent-property`
4. `find-property`
5. `residential`
6. `commercial`
7. `plots-land`
8. `houses`
9. `apartments`
10. `shops`
11. `offices`
12. `buildings`
13. `agricultural-land`
14. `new-projects` (New Developments)
15. `agent-services` (Verified Agency Services)

## 3. Supported Listing Types & Pakistani Size Units
- **Listing Types**: `for_sale`, `for_rent`, `wanted_to_buy`, `wanted_to_rent`, `commercial_sale`, `commercial_rental`, `plot_sale`, `new_project`, `development_project`.
- **Property Size Units**: `marla` (225 sq ft), `kanal` (4,500 sq ft), `sq_ft`, `sq_yd` (9 sq ft), `acres` (43,560 sq ft), `sq_m` (10.764 sq ft).
- **Conditional Fields**: Bedrooms, bathrooms, and covered area are validated only on residential structures (houses, apartments, penthouses, villas) and strictly exempted on plots, commercial land, agricultural land, and shops.

## 4. 3-Tier Verification Architecture
The platform clearly separates and verifies:
1. **Tier 1 — Member Identity Verified**: Validates that the property publisher has an approved government ID and live selfie via KYC (`is_kyc_approved()`).
2. **Tier 2 — Property Documents Reviewed**: Verifies that ownership records (title deed, allotment letter, or authorized agent representation agreement) are submitted to private storage.
3. **Tier 3 — Verified Property Listing**: Admin-approved badge (`verified_listing = TRUE`) surfaced across property discovery cards and details.

## 5. Privacy & Security
- **Address Privacy**: If `hide_exact_address` is enabled, the street address is masked from the public and revealed only to the property owner or upon authorized inquiry confirmation.
- **Private Document Vault**: Private storage bucket `property-documents` is restricted by RLS to the property owner and authorized platform administrators. Public users never have direct URL access to ownership documents.
- **Inquiry & Viewing System**:
  - Inquiries automatically provision a contextual chat room (`chats.property_inquiry_id`) in the shared messaging system.
  - Viewing appointments validate future timestamps and update scheduled statuses (`pending`, `confirmed`, `completed`).
- **Financial Separation Guardrail**: Property purchases and booking transactions are strictly separated from the task escrow engine.
