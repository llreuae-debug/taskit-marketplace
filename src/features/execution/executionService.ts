import { supabase, isSupabaseConfigured } from '../../services/supabase';
import {
  TaskProof,
  TimeExtensionRequest,
  TaskDispute,
  SosAlert,
  TaskRating,
  TaskChatMessage,
} from '../../types/execution';
import { TaskStatus } from '../../types/tasks';
import { getTaskById } from '../tasks/taskService';

// In-Memory stores for development, mock tests, and offline resilience
let mockProofsStore: TaskProof[] = [];
let mockExtensionsStore: TimeExtensionRequest[] = [];
let mockDisputesStore: TaskDispute[] = [];
let mockSosStore: SosAlert[] = [];
let mockRatingsStore: TaskRating[] = [];
let mockChatMessagesStore: TaskChatMessage[] = [
  {
    id: 'msg-1',
    chat_id: 'chat-task-demo-1',
    task_id: 'task-demo-1',
    sender_id: 'poster-1',
    sender_name: 'Usman Tariq',
    content_type: 'text',
    body: 'Hello! Please make sure to check the electrical socket on the mirror before purchasing.',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg-2',
    chat_id: 'chat-task-demo-1',
    task_id: 'task-demo-1',
    sender_id: 'usr_tasker_demo',
    sender_name: 'Ali Raza',
    content_type: 'text',
    body: 'Assalam-o-Alaikum, yes I am at Montgomery Road right now and testing the motorized movement.',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

/**
 * 1. Update task execution status (e.g. from 'accepted' to 'in_progress')
 */
export async function updateTaskExecutionStatus(
  taskId: string,
  newStatus: TaskStatus,
  note?: string
): Promise<{ success: boolean; status: TaskStatus }> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('update_task_execution_status', {
      p_task_id: taskId,
      p_new_status: newStatus,
      p_note: note || null,
    });
    if (error) throw new Error(error.message);
    return data as { success: boolean; status: TaskStatus };
  }

  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');
  if (task.status !== 'accepted' && newStatus === 'in_progress') {
    throw new Error(`Cannot transition from ${task.status} to ${newStatus}`);
  }

  task.status = newStatus;
  task.started_at = new Date().toISOString();
  return { success: true, status: newStatus };
}

/**
 * 2. Submit task proof (Tasker submits photos, receipts, notes)
 */
export async function submitTaskProof(
  taskId: string,
  taskerId: string,
  proofPhotos: string[],
  receiptPhotos: string[] = [],
  notes?: string | null
): Promise<TaskProof> {
  if (proofPhotos.length === 0) {
    throw new Error('At least one proof photo is required');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('submit_task_proof', {
      p_task_id: taskId,
      p_proof_photos: proofPhotos,
      p_receipt_photos: receiptPhotos,
      p_notes: notes || null,
    });
    if (error) throw new Error(error.message);
  }

  const task = await getTaskById(taskId);
  if (task) {
    task.status = 'submitted';
    task.submitted_at = new Date().toISOString();
    task.auto_approval_deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  }

  const proof: TaskProof = {
    id: `proof-${Date.now()}`,
    task_id: taskId,
    tasker_id: taskerId,
    proof_photos: proofPhotos,
    receipt_photos: receiptPhotos,
    notes: notes || null,
    submitted_at: new Date().toISOString(),
    approved_at: null,
    rejected_at: null,
    auto_approved: false,
  };

  mockProofsStore.push(proof);
  return proof;
}

/**
 * 3. Complete task (via 4-digit code by tasker OR direct approval by poster)
 */
export async function completeTask(
  taskId: string,
  callerId: string,
  enteredCode?: string
): Promise<{ success: boolean; status: string; completed_at: string }> {
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('complete_task', {
      p_task_id: taskId,
      p_entered_code: enteredCode || null,
    });
    if (error) throw new Error(error.message);
    return data as { success: boolean; status: string; completed_at: string };
  }

  // Caller is Tasker: requires matching 4-digit code
  if (callerId === task.tasker_id) {
    if (!enteredCode || enteredCode !== (task.completion_code || '1234')) {
      throw new Error('Invalid 4-digit completion code');
    }
  } else if (callerId !== task.poster_id) {
    throw new Error('Unauthorized to complete this task');
  }

  task.status = 'completed';
  task.completed_at = new Date().toISOString();

  // Approve proofs
  mockProofsStore.forEach((p) => {
    if (p.task_id === taskId && !p.approved_at) {
      p.approved_at = new Date().toISOString();
    }
  });

  return {
    success: true,
    status: 'completed',
    completed_at: task.completed_at,
  };
}

/**
 * 4. Request time extension
 */
export async function requestTimeExtension(
  taskId: string,
  taskerId: string,
  additionalMinutes: number,
  reason: string
): Promise<TimeExtensionRequest> {
  if (additionalMinutes <= 0 || additionalMinutes > 1440) {
    throw new Error('Extension must be between 1 and 1440 minutes');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('request_time_extension', {
      p_task_id: taskId,
      p_additional_minutes: additionalMinutes,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);
  }

  const req: TimeExtensionRequest = {
    id: `ext-${Date.now()}`,
    task_id: taskId,
    tasker_id: taskerId,
    additional_minutes: additionalMinutes,
    reason,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  mockExtensionsStore.push(req);
  return req;
}

/**
 * 5. Respond to time extension (Poster approves or rejects)
 */
export async function respondTimeExtension(
  requestId: string,
  callerId: string,
  approved: boolean
): Promise<boolean> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('respond_time_extension', {
      p_request_id: requestId,
      p_approved: approved,
    });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  const req = mockExtensionsStore.find((r) => r.id === requestId);
  if (!req) throw new Error('Extension request not found');

  req.status = approved ? 'approved' : 'rejected';
  req.responded_at = new Date().toISOString();

  if (approved) {
    const task = await getTaskById(req.task_id);
    if (task) {
      const currentDeadline = new Date(task.deadline).getTime();
      task.deadline = new Date(currentDeadline + req.additional_minutes * 60 * 1000).toISOString();
    }
  }

  return true;
}

/**
 * 6. Submit task dispute
 */
export async function submitTaskDispute(
  taskId: string,
  callerId: string,
  reason: string,
  description: string,
  evidencePhotos: string[] = []
): Promise<TaskDispute> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('submit_task_dispute', {
      p_task_id: taskId,
      p_reason: reason,
      p_description: description,
      p_evidence_photos: evidencePhotos,
    });
    if (error) throw new Error(error.message);
  }

  const task = await getTaskById(taskId);
  if (task) {
    task.status = 'disputed';
    task.disputed_at = new Date().toISOString();
  }

  const dispute: TaskDispute = {
    id: `disp-${Date.now()}`,
    task_id: taskId,
    raised_by: callerId,
    reason,
    description,
    evidence_photos: evidencePhotos,
    status: 'open',
    created_at: new Date().toISOString(),
  };

  mockDisputesStore.push(dispute);
  return dispute;
}

/**
 * 7. Trigger SOS alert
 */
export async function triggerSosAlert(
  taskId: string,
  userId: string,
  latitude: number,
  longitude: number,
  notes?: string | null
): Promise<SosAlert> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('trigger_sos_alert', {
      p_task_id: taskId,
      p_latitude: latitude,
      p_longitude: longitude,
      p_notes: notes || null,
    });
    if (error) throw new Error(error.message);
  }

  const alert: SosAlert = {
    id: `sos-${Date.now()}`,
    task_id: taskId,
    user_id: userId,
    latitude,
    longitude,
    notes: notes || null,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  mockSosStore.push(alert);
  return alert;
}

/**
 * 8. Submit rating
 */
export async function submitTaskRating(
  taskId: string,
  reviewerId: string,
  score: number,
  comment?: string | null
): Promise<boolean> {
  if (score < 1 || score > 5) {
    throw new Error('Rating score must be between 1 and 5');
  }

  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');
  if (task.status !== 'completed' && task.status !== 'rated') {
    throw new Error('Ratings can only be given for completed tasks');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('submit_task_rating', {
      p_task_id: taskId,
      p_score: score,
      p_comment: comment || null,
    });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  const isPoster = reviewerId === task.poster_id;
  const revieweeId = isPoster ? task.tasker_id || 'tasker-1' : task.poster_id;

  const rating: TaskRating = {
    context_type: 'task',
    reference_id: taskId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    score,
    comment: comment || null,
    created_at: new Date().toISOString(),
  };

  mockRatingsStore.push(rating);
  task.status = 'rated';
  return true;
}

/**
 * 9. Chat Messages
 */
export async function getTaskMessages(taskId: string): Promise<TaskChatMessage[]> {
  return mockChatMessagesStore.filter((m) => m.task_id === taskId);
}

export async function sendTaskMessage(
  taskId: string,
  senderId: string,
  senderName: string,
  body: string,
  contentType: TaskChatMessage['content_type'] = 'text',
  mediaUrl?: string | null
): Promise<TaskChatMessage> {
  const msg: TaskChatMessage = {
    id: `msg-${Date.now()}`,
    chat_id: `chat-${taskId}`,
    task_id: taskId,
    sender_id: senderId,
    sender_name: senderName,
    content_type: contentType,
    body,
    media_url: mediaUrl,
    created_at: new Date().toISOString(),
  };

  mockChatMessagesStore.push(msg);
  return msg;
}

export function __resetExecutionStore() {
  mockProofsStore = [];
  mockExtensionsStore = [];
  mockDisputesStore = [];
  mockSosStore = [];
  mockRatingsStore = [];
}
