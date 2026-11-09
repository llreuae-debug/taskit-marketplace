-- ====================================================================================
-- TASKIT ⚡ — SEED DATA (supabase/seed.sql)
-- Unified Task Marketplace + Real Estate Buy & Sell Platform
-- Production-Grade Demonstration Data across Pakistan (Lahore, Karachi, Islamabad)
-- ====================================================================================

-- 1. Ensure Task Categories Exist
INSERT INTO task_categories (id, slug, name_en, name_ur, icon, base_price, sort_order, is_active)
VALUES
  ('tcat-1', 'car-parts-finder', 'Car Parts Finder', 'گاڑیوں کے اسپیئر پارٹس تلاش', '🚗', 1000, 1, true),
  ('tcat-2', 'delivery-courier', 'Delivery / Courier', 'ڈلیوری اور کورئیر', '📦', 500, 2, true),
  ('tcat-3', 'grocery-shopping', 'Grocery & Shopping', 'گروسری اور خریداری', '🛒', 600, 3, true),
  ('tcat-4', 'pharmacy-pickup', 'Pharmacy Pickup', 'فارمیسی سے ادویات', '💊', 400, 4, true),
  ('tcat-5', 'documents-banking', 'Documents & Banking', 'دستاویزات اور بینکنگ', '🏦', 800, 5, true),
  ('tcat-6', 'queue-standing', 'Queue / Line Standing', 'قطار میں کھڑے ہونا', '⏳', 700, 6, true),
  ('tcat-7', 'repairs-handyman', 'Repairs & Handyman', 'مرمت اور ہینڈی مین', '🔧', 1200, 7, true),
  ('tcat-8', 'cleaning', 'Cleaning & Housekeeping', 'صفائی ستھرائی', '🧹', 1500, 8, true),
  ('tcat-9', 'moving-lifting', 'Moving & Lifting', 'سامان کی منتقلی اور لوڈنگ', '📦', 2000, 9, true),
  ('tcat-10', 'pet-care', 'Pet Care & Walking', 'پالتو جانوروں کی دیکھ بھال', '🐾', 800, 10, true),
  ('tcat-11', 'online-digital', 'Online / Digital Tasks', 'آن لائن اور ڈیجیٹل خدمات', '💻', 1000, 11, true),
  ('tcat-12', 'photography-video', 'Photography & Video', 'فوٹوگرافی اور ویڈیو', '📷', 3000, 12, true),
  ('tcat-13', 'gifts-surprises', 'Gifts & Surprises', 'تحائف اور سرپرائزز', '🎁', 1000, 13, true),
  ('tcat-14', 'anything-else', 'Anything Else', 'دیگر تمام ٹاسکس', '⚡', 500, 14, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Ensure Real Estate Categories Exist
INSERT INTO property_categories (id, slug, name_en, name_ur, icon, sort_order, is_active)
VALUES
  ('pcat-1', 'buy-property', 'Buy Property', 'پراپرٹی خریدیں', '🔑', 1, true),
  ('pcat-2', 'sell-property', 'Sell Property', 'پراپرٹی فروخت کریں', '🏷️', 2, true),
  ('pcat-3', 'rent-property', 'Rent Property', 'کرائے پر دیں یا لیں', '🏢', 3, true),
  ('pcat-4', 'find-property', 'Find a Property', 'پراپرٹی تلاش کریں', '🔍', 4, true),
  ('pcat-5', 'residential', 'Residential Property', 'رہائشی پراپرٹی', '🏡', 5, true),
  ('pcat-6', 'commercial', 'Commercial Property', 'کمرشل پراپرٹی', '🏬', 6, true),
  ('pcat-7', 'plots-land', 'Plots & Land', 'پلاٹس اور اراضی', '📐', 7, true),
  ('pcat-8', 'houses', 'Houses', 'مکانات اور ولاز', '🏠', 8, true),
  ('pcat-9', 'apartments', 'Apartments', 'اپارٹمنٹس اور فلیٹس', '🏢', 9, true),
  ('pcat-10', 'shops', 'Shops', 'دکانیں', '🏪', 10, true),
  ('pcat-11', 'offices', 'Offices', 'دفاتر', '💼', 11, true),
  ('pcat-12', 'buildings', 'Buildings', 'مکمل عمارتیں', '🏛️', 12, true),
  ('pcat-13', 'agricultural-land', 'Agricultural Land', 'زرعی اراضی', '🌾', 13, true),
  ('pcat-14', 'new-projects', 'New Projects & Developments', 'نئے ہاؤسنگ پراجیکٹس', '🌆', 14, true),
  ('pcat-15', 'agent-services', 'Property Agent Services', 'پراپرٹی ایجنٹ سروسز', '🤝', 15, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Verified Profiles
INSERT INTO profiles (
  id, phone, full_name, guardian_name, date_of_birth, gender,
  country, city, area, full_address, kyc_status, is_verified_tasker,
  is_verified_agent, tasker_rating, seller_rating, completed_tasks_count
) VALUES
  ('usr-seller-1', '+923001111111', 'Haji Tariq Mahmood', 'Chaudhry Bashir Ahmad', '1975-06-15', 'male', 'Pakistan', 'Lahore', 'DHA Phase 6', 'House 42, Sector B, DHA Phase 6', 'approved', false, false, 5.0, 4.9, 0),
  ('usr-seller-2', '+923002222222', 'Zeeshan Real Estate Agency', 'Zeeshan Qureshi', '1985-08-20', 'male', 'Pakistan', 'Islamabad', 'Sector F-10', 'Office 12, Silver Oaks Towers, F-10', 'approved', false, true, 5.0, 5.0, 0),
  ('usr-tasker-1', '+923003333333', 'Hamza Malik', 'Malik Akhtar', '1996-03-12', 'male', 'Pakistan', 'Lahore', 'Johar Town', 'Plaza 15, G-1 Market, Johar Town', 'approved', true, false, 4.95, 5.0, 48),
  ('usr-poster-1', '+923004444444', 'Sara Ahmed', 'Ahmed Raza', '1998-11-25', 'female', 'Pakistan', 'Lahore', 'Gulberg III', 'Apartment 4B, Mall 1, Gulberg III', 'approved', false, false, 5.0, 5.0, 12),
  ('usr-admin-1', '+923005555555', 'Fatima Noor (Admin)', 'Muhammad Noor', '1992-01-10', 'female', 'Pakistan', 'Islamabad', 'Blue Area', 'Floor 8, Telecom Tower, Blue Area', 'approved', false, false, 5.0, 5.0, 0)
ON CONFLICT (id) DO UPDATE SET kyc_status = 'approved';

-- 4. Seed Wallets
INSERT INTO wallets (id, user_id, currency, available_balance, escrow_balance, total_balance)
VALUES
  ('wal-seller-1', 'usr-seller-1', 'PKR', 50000, 0, 50000),
  ('wal-tasker-1', 'usr-tasker-1', 'PKR', 34200, 0, 34200),
  ('wal-poster-1', 'usr-poster-1', 'PKR', 18500, 3500, 22000),
  ('wal-admin-1', 'usr-admin-1', 'PKR', 250000, 0, 250000)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Real Estate Listings
INSERT INTO properties (
  id, owner_id, category_id, title, description, listing_type, property_type,
  price, currency, country, city, area, society, street_address, hide_exact_address,
  land_size, size_unit, covered_area, bedrooms, bathrooms, floors, parking_spaces,
  furnishing_status, construction_status, ownership_status, is_agent_listing,
  verification_status, documents_reviewed, verified_listing, listing_status,
  views_count, inquiries_count, favourites_count
) VALUES
  (
    'prop-demo-1', 'usr-seller-1', 'pcat-8',
    'Brand New 1 Kanal Designer House in DHA Phase 6',
    'Luxurious modern 1 Kanal house with 5 master bedrooms, imported spanish tiles, double height ceiling, swimming pool, servant quarters and solar backup.',
    'for_sale', 'house', 95000000, 'PKR', 'Pakistan', 'Lahore', 'DHA Phase 6', 'DHA Lahore',
    'House 42, Sector B, DHA Phase 6', false, 1, 'kanal', 5500, 5, 6, 2, 3,
    'semi_furnished', 'ready', 'freehold', false, 'verified', true, true, 'active',
    1420, 28, 45
  ),
  (
    'prop-demo-2', 'usr-seller-2', 'pcat-9',
    'Luxury 3-Bed High-Rise Apartment in F-10 Islamabad',
    'Corner 3-bedroom apartment on 9th floor with Margalla hills view, dedicated basement parking, high-speed elevators, and round-the-clock security.',
    'for_rent', 'apartment', 180000, 'PKR', 'Pakistan', 'Islamabad', 'Sector F-10', 'CDA Islamabad',
    'Silver Oaks Towers, F-10', false, 2400, 'sq_ft', 2400, 3, 4, 1, 2,
    'furnished', 'ready', 'freehold', true, 'verified', true, true, 'active',
    890, 19, 32
  ),
  (
    'prop-demo-3', 'usr-seller-1', 'pcat-7',
    '10 Marla Prime Residential Plot in Bahria Town Sector C',
    'Direct owner 10 Marla plot located on 40ft road, adjacent to park and grand mosque. Possession and utility charges paid.',
    'plot_sale', 'plot_residential', 18500000, 'PKR', 'Pakistan', 'Lahore', 'Bahria Town', 'Bahria Town Lahore',
    'Plot 312, Sector C', true, 10, 'marla', NULL, NULL, NULL, NULL, NULL,
    'unfurnished', 'ready', 'freehold', false, 'verified', true, true, 'active',
    540, 12, 19
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Property Projects
INSERT INTO property_projects (
  id, developer_id, project_name, developer_name, description, city,
  location_address, latitude, longitude, construction_status, total_units,
  price_from, price_to, currency, is_verified_project
) VALUES
  (
    'proj-demo-1', 'usr-seller-2', 'Al-Noor Orchard High-Tech City', 'Al-Jalil Developers',
    'LDA-approved master planned development featuring smart villas, golf resort, and commercial boulevard.',
    'Lahore', 'Sharaqpur Road, near M-2 Motorway', 31.6025, 74.1205, 'under_construction',
    1200, 3500000, 25000000, 'PKR', true
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Tasks
INSERT INTO tasks (
  id, poster_id, category_id, title, description, task_type,
  task_charges, expense_budget, service_fee, tasker_amount, currency,
  city, pickup_location, dropoff_location, deadline, acceptance_method, status
) VALUES
  (
    'tsk-demo-1', 'usr-poster-1', 'tcat-1',
    'Find Toyota Corolla 2018 Side Mirror in Montgomery Road',
    'Need genuine left side powered retractable mirror with indicator for silver 2018 Altis. Inspect condition and verify with photos before purchasing.',
    'pickup_delivery', 1500, 8000, 150, 1350, 'PKR', 'Lahore',
    '{"address": "Montgomery Road Auto Market, Lahore", "latitude": 31.5580, "longitude": 74.3260}',
    '{"address": "Mall 1, Main Boulevard Gulberg, Lahore", "latitude": 31.5115, "longitude": 74.3485}',
    NOW() + INTERVAL '12 hours', 'instant', 'open'
  ),
  (
    'tsk-demo-2', 'usr-poster-1', 'tcat-7',
    'AC Inverter PCB Board Diagnosis & Capacitor Replacement',
    'Gree 1.5 ton split AC outdoor unit fan runs but compressor trips with error E6. Need skilled HVAC technician.',
    'single_location', 2500, 1500, 250, 2250, 'PKR', 'Lahore',
    '{"address": "Block H, Gulberg II, Lahore", "latitude": 31.5200, "longitude": 74.3500}',
    NULL,
    NOW() + INTERVAL '24 hours', 'instant', 'open'
  )
ON CONFLICT (id) DO NOTHING;
