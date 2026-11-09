import { TaskStatus } from './tasks';

export interface TaskProof {
  id: string;
  task_id: string;
  tasker_id: string;
  proof_photos: string[];
  receipt_photos: string[];
  notes?: string | null;
  submitted_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  auto_approved: boolean;
}

export interface TimeExtensionRequest {
  id: string;
  task_id: string;
  tasker_id: string;
  additional_minutes: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  responded_at?: string | null;
}

export interface TaskDispute {
  id: string;
  task_id: string;
  raised_by: string;
  reason: string;
  description: string;
  evidence_photos: string[];
  status: 'open' | 'investigating' | 'resolved';
  resolution_type?: 'full_refund' | 'full_release' | 'split_settlement' | 'cancelled' | null;
  refund_amount?: number;
  payout_amount?: number;
  created_at: string;
}

export interface SosAlert {
  id: string;
  task_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  notes?: string | null;
  status: 'active' | 'resolved';
  created_at: string;
}

export interface TaskRating {
  context_type: 'task';
  reference_id: string;
  reviewer_id: string;
  reviewee_id: string;
  score: number;
  comment?: string | null;
  created_at: string;
}

export interface TaskChatMessage {
  id: string;
  chat_id: string;
  task_id: string;
  sender_id: string;
  sender_name: string;
  content_type: 'text' | 'image' | 'voice' | 'location' | 'system';
  body: string;
  media_url?: string | null;
  created_at: string;
}
