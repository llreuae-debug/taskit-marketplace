# TaskIt ⚡ — Real Estate Frontend Architecture & Implementation

**Status:** Completed & Tested (Phase 7)  
**Deliverables:**
- Single portal with List, Grid, and Map view modes (`app/(tabs)/real-estate.tsx`)
- 7-Step Publishing Wizard (`app/properties/create.tsx`)
- Full Property Details with 3-tier verification badges (`app/properties/[id].tsx`)
- Inquiry & viewing appointment modals with shared chat integration
- Side-by-side comparison engine (`app/properties/compare.tsx`)
- Saved / Favourite properties management (`app/properties/saved.tsx`)
- UI components: `PropertyCard.tsx`, `PropertyFilterBar.tsx`, `PropertyMapView.tsx`

---

## 1. Portal Architecture & Multi-Mode Views
The Real Estate portal (`app/(tabs)/real-estate.tsx`) gives members seamless access to properties across Pakistan with three interactive view modes:
- **List Mode:** Compact layout highlighting price, size, Marla/Kanal metrics, and verified badge.
- **Grid Mode:** Rich visual photography cards with high-impact badges and amenity icons.
- **Map Mode (`PropertyMapView`):** Interactive radar pins that cluster properties geographically while strictly respecting `hide_exact_address` privacy rules (obscuring street coordinates for sensitive listings).

### Filter Bar (`PropertyFilterBar`)
- Quick Buy vs. Rent toggles.
- 15 category pills (Buy, Rent, Commercial, Plots & Land, Houses, Apartments, etc.).
- Filter modal with city selector (Lahore, Karachi, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan), price range sliders, size range, bedroom counters, and verified-only filter.

---

## 2. 7-Step Publishing Wizard (`app/properties/create.tsx`)
Designed to handle both simple residential listings and complex commercial/land assets:
1. **Listing Type & Purpose:** 9 listing types (For Sale, For Rent, New Project, Commercial Sale/Rent, etc.).
2. **Property Category & Nature:** 15 property categories (House, Apartment, Plot, Shop, Land, etc.).
3. **Basic Details & Pricing:** Title (min 5 chars), detailed description (min 15 chars), price, currency (PKR default).
4. **Conditional Specifications:**
   - Residential properties strictly enforce bedroom & bathroom counts.
   - Plots, commercial buildings, and agricultural land automatically skip residential room validations.
   - Size input with Pakistani and international unit normalizations (`marla`, `kanal`, `sq_ft`, `sq_yd`, `acres`, `sq_m`).
5. **Location & Address Privacy:**
   - City, Area/Sector, Society name.
   - Optional exact street address with toggle `hide_exact_address` to protect high-profile properties.
6. **Amenities & Features:** Tag selector (Central AC, Solar System, Backup Generator, Elevator, Gated Community, Security Staff, Servant Quarters, etc.).
7. **Media, Documents & Verification Upload:**
   - Multi-photo gallery upload (up to 20 images).
   - Ownership documentation upload (Fard, Registry, Allotment letter) to private `property-documents` bucket for 3-tier admin review.

---

## 3. Detail View & Buyer Actions (`app/properties/[id].tsx`)
- **3-Tier Verification Badges:**
  1. *Owner KYC Verified* (User identity vetted via CNIC / Passport)
  2. *Documents Reviewed* (Title deed / allotment vetted by admin)
  3. *Verified Listing ⚡* (Physical inspection or certified agency badge)
- **Direct Engagement Workflows:**
  - **Inquiry / Offer Submission:** Direct message with optional counter-offer price; hooks into Supabase realtime chat.
  - **Viewing Scheduler:** Direct appointment booking for future inspection dates.
  - **Saved Favourites:** Single-tap toggle persisting to member's watchlist.
  - **Compare CTA:** One-tap addition to comparison matrix.

---

## 4. Side-by-Side Comparison Matrix (`app/properties/compare.tsx`)
Enables buyers and investors to evaluate up to 4 listings simultaneously:
- Normalized price comparison.
- Land size and calculated price per square foot (using standardized 225 sq ft / Marla and 4500 sq ft / Kanal ratios).
- Room specifications and furnishing status.
- Verification tier comparison.

---

## 5. Verification & Testing
Validated via automated unit test suite `tests/unit/realEstateFrontend.test.ts` (10 passing test cases):
- 7-step wizard validation and conditional specs.
- Price and title character enforcement.
- Privacy mask verification (`hide_exact_address`).
- Size conversions and comparison matrix metrics.
- Favourites state toggles.
