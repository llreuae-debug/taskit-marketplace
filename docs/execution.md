# TaskIt ⚡ — Task Execution Lifecycle, Proofs & Safety Architecture

## 1. Lifecycle Progression
A task in the Task Marketplace progresses through strict sequential states:
```
DRAFT → OPEN → ACCEPTED → IN_PROGRESS → SUBMITTED → COMPLETED → RATED
                  ↓           ↓             ↓           ↓
              CANCELLED    DISPUTED      DISPUTED    DISPUTED
```

## 2. Status Transitions & Actions
- **`open` → `accepted`**:
  - Exclusive row locking via `accept_task(p_task_id)`.
  - Only one verified tasker can accept.
  - Generates secure 4-digit completion code (`0000`–`9999`) assigned to the poster.
- **`accepted` → `in_progress`**:
  - Tasker taps "On My Way / Mark Started" (`update_task_execution_status`).
  - Sets `started_at = NOW()`, notifies poster.
- **`in_progress` → `submitted`**:
  - Tasker uploads completion proof photos & store receipts (`submit_task_proof`).
  - Stored in private `task-proofs` Supabase Storage bucket.
  - Automatically sets `auto_approval_deadline = NOW() + INTERVAL '24 hours'`.
- **`submitted` → `completed`**:
  - **Method A (Completion Code)**: Tasker enters poster's 4-digit code (`complete_task(p_task_id, p_entered_code)`).
  - **Method B (Poster Approval)**: Poster approves submitted proof in one tap.
  - Proofs marked approved, tasker `tasks_completed_count` incremented.
- **`completed` → `rated`**:
  - Both poster and tasker rate each other 1–5 stars with review text (`submit_task_rating`).
  - Automatically recalculates dynamic average ratings (`poster_rating` / `tasker_rating`).

## 3. Safety, Disputes & Emergency Extensions
- **Time Extension Requests**:
  - Tasker requests additional time (15 min to 24 hr) with reason (`request_time_extension`).
  - Poster receives notification and can approve or reject (`respond_time_extension`).
  - Approving dynamically extends task `deadline`.
- **Dispute Resolution Infrastructure**:
  - Either participant can file a dispute with evidence photos (`submit_task_dispute`).
  - Transitions task to `disputed`, locks escrow, alerts platform admins.
- **Emergency SOS Dispatch**:
  - High-priority SOS alert button with instant GPS coordinates (`trigger_sos_alert`).
  - Dispatches coordinates to emergency contacts & audit logs.
- **In-Task Realtime Chat**:
  - Contextual chat room linked to `task_id` for coordination, photos, voice notes, and location updates.
