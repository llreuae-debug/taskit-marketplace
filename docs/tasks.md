# TaskIt ⚡ — Task Marketplace Core & Atomic Row-Locking Architecture

## 1. Overview
The Task Marketplace allows verified members to post tasks with transparent pricing and deadlines, while other verified members can discover, accept, complete, and receive payments.

## 2. Configurable Categories
14 initial categories with custom field support:
1. `car-parts-finder` (Vehicle Make & Model custom field)
2. `delivery-courier` (Package size custom field)
3. `grocery-shopping`
4. `pharmacy-pickup` (Prescription required custom field)
5. `documents-banking`
6. `queue-line-standing`
7. `repairs-handyman`
8. `cleaning`
9. `moving-lifting`
10. `pet-care`
11. `online-digital`
12. `photography-video`
13. `gifts-surprises`
14. `anything-else`

## 3. 4-Screen Post a Task Flow
- **Screen 1**: Category selection & dynamic category custom fields.
- **Screen 2**: Task title (min 5, max 150), description (min 10), voice note simulator, up to 5 photos.
- **Screen 3**: Location setup:
  - `physical_single`: Single location address.
  - `physical_pickup_dropoff`: Pickup address and Drop-off address.
  - `online`: Remote digital task.
- **Screen 4**: Pricing (min PKR 100), optional expense budget, future deadline, acceptance method (`instant`, `offer_only`, `both`), and transparent escrow breakdown (e.g. PKR 1,000 -> 10% Platform Fee PKR 100 -> Tasker Receives PKR 900).

## 4. Atomic PostgreSQL Task Acceptance
Implemented in RPC `accept_task(p_task_id UUID)` in `supabase/migrations/00003_task_marketplace.sql`:
- **KYC Verification**: Strictly validates `public.is_kyc_approved(v_tasker_id)`.
- **Atomic Row Locking**: Executes `SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE NOWAIT`.
- **Single Tasker Guarantee**: If two taskers click "Accept" concurrently, the first acquires the exclusive row lock, transitions status to `accepted`, and generates a 4-digit completion code. The second transaction immediately aborts and fails with `"Task is no longer open for acceptance"`.
- **Poster Protection**: Posters are blocked from accepting their own tasks.
- **Audit Logging**: Logs immutable `TASK_ACCEPTED_ATOMIC` event in `public.audit_logs`.

## 5. Feed Discovery & Filtering
- Supported views: **List View** ([`TaskCard`](file:///Users/dilnawaz/Task%20It/src/features/tasks/components/TaskCard.tsx)) and **Radar Map View** ([`TaskMapView`](file:///Users/dilnawaz/Task%20It/src/features/tasks/components/TaskMapView.tsx)).
- Search by keyword across title, description, and location.
- Category chips, Price min/max, Location type, and Distance (Haversine calculation).
- Sorting by newest, price low-to-high, price high-to-low, urgent deadline, and nearest distance.
