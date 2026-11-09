# TaskIt ⚡ — System Architecture & Foundation Documentation

## 1. Platform Overview
**TaskIt ⚡** ("Just TaskIt. ⚡") combines two major marketplaces into a single unified application across **Android, iOS, and Web**:
- **Marketplace A — Task Marketplace ⚡**: Local & digital tasks with atomic row-locked task acceptance and escrow protection.
- **Marketplace B — Real Estate Marketplace 🏡**: Property discovery, buying, selling, renting, inquiries, viewing appointments, and 3-tier verification.

## 2. Phase 1 Foundation Stack
- **Framework**: Expo SDK 52 + React Native 0.76 + React Native Web + Expo Router v4
- **Styling & Theme**: NativeWind v4 + Design Tokens ([tokens.ts](file:///Users/dilnawaz/Task%20It/src/theme/tokens.ts))
  - Primary Violet: `#7C3AED`
  - Lime Accent: `#A3E635`
  - Coral Accent: `#FF5C7A`
  - Dark Surface: `#0F0F14` | Light Surface: `#FAFAFC`
- **Internationalization (15 Languages + RTL)**:
  - Configured in [src/i18n/index.ts](file:///Users/dilnawaz/Task%20It/src/i18n/index.ts) and [src/i18n/languages.ts](file:///Users/dilnawaz/Task%20It/src/i18n/languages.ts)
  - Languages: `en`, `ur`, `ar`, `hi`, `bn`, `zh`, `es`, `fr`, `pt`, `ru`, `id`, `tr`, `de`, `fa`, `sw`
  - Automatic RTL layout direction for Urdu (`ur`), Arabic (`ar`), and Persian (`fa`).
- **Database Foundation**:
  - Migration [00001_foundation_and_shared.sql](file:///Users/dilnawaz/Task%20It/supabase/migrations/00001_foundation_and_shared.sql) defines `profiles`, `user_roles`, `kyc_documents`, `notifications`, `chats`, `messages`, `ratings`, `user_reports`, `blocked_users`, `app_settings`, and `audit_logs` with strict Row-Level Security (RLS).
