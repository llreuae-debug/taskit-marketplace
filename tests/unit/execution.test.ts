import {
  taskProofSchema,
  completionCodeSchema,
  timeExtensionSchema,
  taskDisputeSchema,
  taskRatingSchema,
  sosAlertSchema,
} from '../../src/features/execution/validation';
import {
  updateTaskExecutionStatus,
  submitTaskProof,
  completeTask,
  requestTimeExtension,
  respondTimeExtension,
  submitTaskDispute,
  triggerSosAlert,
  submitTaskRating,
  getTaskMessages,
  sendTaskMessage,
  __resetExecutionStore,
} from '../../src/features/execution/executionService';
import {
  createNewTask,
  acceptTaskAtomic,
  __resetMockStore,
  getTaskById,
} from '../../src/features/tasks/taskService';

describe('Phase 4 — Task Execution, Proofs, Completion & Safety', () => {
  beforeEach(() => {
    __resetMockStore();
    __resetExecutionStore();
  });

  test('validates execution input schemas (proof, 4-digit code, extension, dispute, rating, SOS)', () => {
    // 4-Digit Completion Code
    expect(completionCodeSchema.safeParse('1234').success).toBe(true);
    expect(completionCodeSchema.safeParse('123').success).toBe(false);
    expect(completionCodeSchema.safeParse('abcd').success).toBe(false);
    expect(completionCodeSchema.safeParse('12345').success).toBe(false);

    // Proof photos
    expect(
      taskProofSchema.safeParse({
        taskId: 't-1',
        proofPhotos: ['https://proof.jpg'],
        receiptPhotos: [],
        notes: 'Fixed pipe',
      }).success
    ).toBe(true);
    expect(
      taskProofSchema.safeParse({
        taskId: 't-1',
        proofPhotos: [], // empty fails
      }).success
    ).toBe(false);

    // Time extension
    expect(
      timeExtensionSchema.safeParse({
        taskId: 't-1',
        additionalMinutes: 60,
        reason: 'Traffic jam on highway',
      }).success
    ).toBe(true);
    expect(
      timeExtensionSchema.safeParse({
        taskId: 't-1',
        additionalMinutes: 10, // < 15 fails
        reason: 'Short delay',
      }).success
    ).toBe(false);

    // Dispute schema
    expect(
      taskDisputeSchema.safeParse({
        taskId: 't-1',
        reason: 'Damaged item',
        description: 'The tasker broke the mirror during delivery.',
      }).success
    ).toBe(true);
    expect(
      taskDisputeSchema.safeParse({
        taskId: 't-1',
        reason: 'Bad',
        description: 'Short', // < 10 chars fails
      }).success
    ).toBe(false);

    // Rating schema
    expect(taskRatingSchema.safeParse({ taskId: 't-1', score: 5, comment: 'Great job!' }).success).toBe(true);
    expect(taskRatingSchema.safeParse({ taskId: 't-1', score: 6 }).success).toBe(false);
    expect(taskRatingSchema.safeParse({ taskId: 't-1', score: 0 }).success).toBe(false);

    // SOS schema
    expect(sosAlertSchema.safeParse({ taskId: 't-1', latitude: 31.5204, longitude: 74.3587 }).success).toBe(true);
  });

  test('executes complete task lifecycle: ACCEPTED -> IN_PROGRESS -> SUBMITTED -> COMPLETED -> RATED', async () => {
    // 1. Create task
    const task = await createNewTask('poster-usr-1', {
      categoryId: 'cat-7',
      title: 'Fix washing machine drain pump',
      description: 'Machine is showing E2 error code and not draining water.',
      locationType: 'physical_single',
      locationAddress: 'DHA Phase 5, Lahore',
      taskCharges: 2000,
      deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      acceptanceMethod: 'instant',
      photos: [],
      customData: {},
    });
    expect(task.status).toBe('open');

    // 2. Accept task
    const acceptRes = await acceptTaskAtomic(task.id, 'tasker-usr-2');
    expect(acceptRes.status).toBe('accepted');
    const completionCode = acceptRes.completion_code || '1234';

    // 3. Mark Started / In Progress
    const progressRes = await updateTaskExecutionStatus(task.id, 'in_progress', 'On my way');
    expect(progressRes.status).toBe('in_progress');

    // 4. Submit Proof
    const proof = await submitTaskProof(
      task.id,
      'tasker-usr-2',
      ['https://proof.jpg/pump_replaced.jpg'],
      ['https://receipt.jpg/pump_store.jpg'],
      'Pump replaced with new original part'
    );
    expect(proof.id).toBeTruthy();
    const taskAfterProof = await getTaskById(task.id);
    expect(taskAfterProof?.status).toBe('submitted');

    // 5. Completion with invalid code fails
    await expect(completeTask(task.id, 'tasker-usr-2', '0000')).rejects.toThrow(/Invalid 4-digit/);

    // Completion with correct 4-digit code succeeds
    const compRes = await completeTask(task.id, 'tasker-usr-2', completionCode);
    expect(compRes.status).toBe('completed');
    const taskAfterComp = await getTaskById(task.id);
    expect(taskAfterComp?.status).toBe('completed');

    // 6. Submit mutual rating
    const rated = await submitTaskRating(task.id, 'poster-usr-1', 5, 'Fast and very professional work!');
    expect(rated).toBe(true);
    const taskAfterRated = await getTaskById(task.id);
    expect(taskAfterRated?.status).toBe('rated');
  });

  test('manages deadline extension requests and poster approvals', async () => {
    const originalDeadline = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const task = await createNewTask('poster-usr-10', {
      categoryId: 'cat-2',
      title: 'Courier document delivery',
      description: 'Deliver file to bank before cutoff time.',
      locationType: 'physical_single',
      locationAddress: 'Gulberg 3, Lahore',
      taskCharges: 1000,
      deadline: originalDeadline,
      acceptanceMethod: 'instant',
      photos: [],
      customData: {},
    });

    await acceptTaskAtomic(task.id, 'tasker-usr-20');

    // Tasker requests 60 mins extension
    const ext = await requestTimeExtension(task.id, 'tasker-usr-20', 60, 'Long queue at bank counter');
    expect(ext.status).toBe('pending');
    expect(ext.additional_minutes).toBe(60);

    // Poster approves extension
    const approved = await respondTimeExtension(ext.id, 'poster-usr-10', true);
    expect(approved).toBe(true);
    expect(ext.status).toBe('approved');

    // Verify task deadline was extended
    const updatedTask = await getTaskById(task.id);
    expect(new Date(updatedTask!.deadline).getTime()).toBeGreaterThan(
      new Date(originalDeadline).getTime()
    );
  });

  test('handles emergency SOS dispatch and dispute submission', async () => {
    const task = await createNewTask('poster-usr-30', {
      categoryId: 'cat-1',
      title: 'Car breakdown assistance',
      description: 'Flat tyre on ring road.',
      locationType: 'physical_single',
      locationAddress: 'Ring Road Lahore',
      taskCharges: 1200,
      deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      acceptanceMethod: 'instant',
      photos: [],
      customData: {},
    });

    // SOS alert
    const sos = await triggerSosAlert(task.id, 'member-sos-1', 31.47, 74.38, 'Near Toll plaza');
    expect(sos.id).toBeTruthy();
    expect(sos.status).toBe('active');
    expect(sos.latitude).toBe(31.47);

    // Dispute
    const dispute = await submitTaskDispute(
      task.id,
      'poster-usr-30',
      'Incomplete service',
      'Tasker left without completing the wheel change.'
    );
    expect(dispute.id).toBeTruthy();
    expect(dispute.status).toBe('open');
    const disputedTask = await getTaskById(task.id);
    expect(disputedTask?.status).toBe('disputed');
  });

  test('sends and retrieves real-time in-task chat messages', async () => {
    const msg = await sendTaskMessage(
      'task-demo-1',
      'usr-tester',
      'Hamza',
      'I am waiting outside the shop.'
    );
    expect(msg.id).toBeTruthy();
    expect(msg.body).toBe('I am waiting outside the shop.');

    const allMsgs = await getTaskMessages('task-demo-1');
    expect(allMsgs.some((m) => m.body === 'I am waiting outside the shop.')).toBe(true);
  });
});
