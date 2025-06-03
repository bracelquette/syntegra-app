import { z } from "zod";

// ==================== ENUMS ====================
export const AttemptStatusEnum = z.enum([
  "started",
  "in_progress",
  "completed",
  "abandoned",
  "expired",
]);

// ==================== REQUEST SCHEMAS ====================

// Start Test Attempt Request Schema
export const StartTestAttemptRequestSchema = z.object({
  test_id: z.string().uuid("Invalid test ID format"),
  session_code: z.string().min(1, "Session code is required").optional(), // Optional if taking test independently
  browser_info: z
    .object({
      user_agent: z.string(),
      screen_width: z.number().optional(),
      screen_height: z.number().optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

// Update Test Attempt Request Schema
export const UpdateTestAttemptRequestSchema = z.object({
  status: AttemptStatusEnum.optional(),
  questions_answered: z.number().min(0).optional(),
  time_spent: z.number().min(0).optional(), // in seconds
  browser_info: z
    .object({
      user_agent: z.string(),
      screen_width: z.number().optional(),
      screen_height: z.number().optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

// Finish Test Attempt Request Schema
export const FinishTestAttemptRequestSchema = z.object({
  time_spent: z.number().min(0), // Total time spent in seconds
  questions_answered: z.number().min(0),
  completion_type: z
    .enum(["completed", "abandoned", "expired"])
    .default("completed"),
  final_browser_info: z
    .object({
      user_agent: z.string(),
      screen_width: z.number().optional(),
      screen_height: z.number().optional(),
      timezone: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

// Path Parameter Schemas
export const GetAttemptByIdRequestSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID format"),
});

export const UpdateAttemptByIdRequestSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID format"),
});

export const FinishAttemptByIdRequestSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID format"),
});

// ==================== RESPONSE SCHEMAS ====================

// Test Attempt Data Schema
export const TestAttemptDataSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  test_id: z.string().uuid(),
  session_test_id: z.string().uuid().nullable(),
  start_time: z.date(),
  end_time: z.date().nullable(),
  actual_end_time: z.date().nullable(),
  status: AttemptStatusEnum,
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  browser_info: z.record(z.any()).nullable(),
  attempt_number: z.number(),
  time_spent: z.number().nullable(), // in seconds
  questions_answered: z.number(),
  total_questions: z.number().nullable(),
  created_at: z.date(),
  updated_at: z.date(),

  // Populated fields
  test: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      category: z.string(),
      module_type: z.string(),
      time_limit: z.number(), // in minutes
      total_questions: z.number(),
      icon: z.string().nullable(),
      card_color: z.string().nullable(),
      instructions: z.string().nullable(),
    })
    .optional(),

  session: z
    .object({
      id: z.string().uuid(),
      session_name: z.string(),
      session_code: z.string(),
      target_position: z.string(),
    })
    .nullable()
    .optional(),

  // Computed fields
  time_remaining: z.number().optional(), // in seconds
  progress_percentage: z.number().optional(),
  can_continue: z.boolean().optional(),
  is_expired: z.boolean().optional(),
});

// Start Test Attempt Response Schema
export const StartTestAttemptResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestAttemptDataSchema,
  timestamp: z.string(),
});

// Get Test Attempt Response Schema
export const GetTestAttemptResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestAttemptDataSchema,
  timestamp: z.string(),
});

// Update Test Attempt Response Schema
export const UpdateTestAttemptResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestAttemptDataSchema,
  timestamp: z.string(),
});

// Finish Test Attempt Response Schema
export const FinishTestAttemptResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    attempt: TestAttemptDataSchema,
    result: z
      .object({
        id: z.string().uuid(),
        raw_score: z.number().nullable(),
        scaled_score: z.number().nullable(),
        percentile: z.number().nullable(),
        grade: z.string().nullable(),
        is_passed: z.boolean().nullable(),
        completion_percentage: z.number(),
        calculated_at: z.date(),
      })
      .optional(), // Result might not be immediately available
    next_test: z
      .object({
        id: z.string().uuid(),
        name: z.string(),
        category: z.string(),
        module_type: z.string(),
        sequence: z.number(),
      })
      .nullable()
      .optional(), // Next test in session if applicable
  }),
  timestamp: z.string(),
});

// Error response schema
export const AttemptErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const AttemptErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(AttemptErrorDetailSchema).optional(),
  timestamp: z.string(),
});

// ==================== TYPE EXPORTS ====================
export type AttemptStatus = z.infer<typeof AttemptStatusEnum>;

export type StartTestAttemptRequest = z.infer<
  typeof StartTestAttemptRequestSchema
>;
export type StartTestAttemptResponse = z.infer<
  typeof StartTestAttemptResponseSchema
>;
export type UpdateTestAttemptRequest = z.infer<
  typeof UpdateTestAttemptRequestSchema
>;
export type UpdateAttemptByIdRequest = z.infer<
  typeof UpdateAttemptByIdRequestSchema
>;
export type UpdateTestAttemptResponse = z.infer<
  typeof UpdateTestAttemptResponseSchema
>;
export type FinishTestAttemptRequest = z.infer<
  typeof FinishTestAttemptRequestSchema
>;
export type FinishAttemptByIdRequest = z.infer<
  typeof FinishAttemptByIdRequestSchema
>;
export type FinishTestAttemptResponse = z.infer<
  typeof FinishTestAttemptResponseSchema
>;
export type GetAttemptByIdRequest = z.infer<typeof GetAttemptByIdRequestSchema>;
export type GetTestAttemptResponse = z.infer<
  typeof GetTestAttemptResponseSchema
>;
export type AttemptErrorResponse = z.infer<typeof AttemptErrorResponseSchema>;
export type TestAttemptData = z.infer<typeof TestAttemptDataSchema>;
export type AttemptErrorDetail = z.infer<typeof AttemptErrorDetailSchema>;

// ==================== DATABASE TYPES ====================
export type CreateTestAttemptDB = {
  user_id: string;
  test_id: string;
  session_test_id: string | null;
  start_time: Date;
  end_time: Date | null;
  status: AttemptStatus;
  ip_address: string | null;
  user_agent: string | null;
  browser_info: Record<string, any> | null;
  attempt_number: number;
  total_questions: number | null;
};

export type UpdateTestAttemptDB = {
  status?: AttemptStatus;
  end_time?: Date | null;
  actual_end_time?: Date | null;
  time_spent?: number | null;
  questions_answered?: number;
  browser_info?: Record<string, any> | null;
  updated_at: Date;
};

// ==================== UTILITY TYPES ====================

// For frontend display
export type AttemptCardData = {
  id: string;
  test_name: string;
  test_category: string;
  status: AttemptStatus;
  start_time: Date;
  time_spent: number | null;
  progress_percentage: number;
  can_continue: boolean;
  is_expired: boolean;
};

// For test taking interface
export type AttemptSessionData = {
  attempt_id: string;
  test_id: string;
  test_name: string;
  time_limit: number; // in minutes
  time_remaining: number; // in seconds
  current_question: number;
  total_questions: number;
  progress_percentage: number;
  can_pause: boolean;
  auto_submit: boolean;
};

// ==================== VALIDATION HELPERS ====================

// Check if attempt can be continued
export function canContinueAttempt(attempt: {
  status: AttemptStatus;
  end_time: Date | null;
  start_time: Date;
  test: { time_limit: number };
}): boolean {
  if (attempt.status === "completed" || attempt.status === "expired") {
    return false;
  }

  if (attempt.end_time) {
    const now = new Date();
    return now <= attempt.end_time;
  }

  // Check if time limit exceeded
  const now = new Date();
  const timeLimitMs = attempt.test.time_limit * 60 * 1000; // Convert minutes to ms
  const elapsedMs = now.getTime() - attempt.start_time.getTime();

  return elapsedMs < timeLimitMs;
}

// Check if attempt is expired
export function isAttemptExpired(attempt: {
  status: AttemptStatus;
  end_time: Date | null;
  start_time: Date;
  test: { time_limit: number };
}): boolean {
  if (attempt.status === "expired") {
    return true;
  }

  if (attempt.end_time) {
    const now = new Date();
    return now > attempt.end_time;
  }

  // Check if time limit exceeded
  const now = new Date();
  const timeLimitMs = attempt.test.time_limit * 60 * 1000;
  const elapsedMs = now.getTime() - attempt.start_time.getTime();

  return elapsedMs >= timeLimitMs;
}

// Calculate time remaining in seconds
export function getAttemptTimeRemaining(attempt: {
  end_time: Date | null;
  start_time: Date;
  test: { time_limit: number };
}): number {
  const now = new Date();

  if (attempt.end_time) {
    const diff = attempt.end_time.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 1000));
  }

  // Calculate based on time limit
  const timeLimitMs = attempt.test.time_limit * 60 * 1000;
  const elapsedMs = now.getTime() - attempt.start_time.getTime();
  const remainingMs = timeLimitMs - elapsedMs;

  return Math.max(0, Math.floor(remainingMs / 1000));
}

// Calculate progress percentage
export function calculateAttemptProgress(attempt: {
  questions_answered: number;
  total_questions: number | null;
}): number {
  if (!attempt.total_questions || attempt.total_questions === 0) {
    return 0;
  }

  return Math.round(
    (attempt.questions_answered / attempt.total_questions) * 100
  );
}

// Generate next attempt number for user
export function getNextAttemptNumber(
  previousAttempts: { attempt_number: number }[]
): number {
  if (previousAttempts.length === 0) {
    return 1;
  }

  const maxAttemptNumber = Math.max(
    ...previousAttempts.map((a) => a.attempt_number)
  );
  return maxAttemptNumber + 1;
}

// ==================== CONSTANTS ====================
export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  started: "Started",
  in_progress: "In Progress",
  completed: "Completed",
  abandoned: "Abandoned",
  expired: "Expired",
};

export const ATTEMPT_STATUS_COLORS: Record<AttemptStatus, string> = {
  started: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  abandoned: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
};

// Maximum attempts allowed per test (configurable)
export const MAX_ATTEMPTS_PER_TEST = 3;

// Auto-save interval for attempt progress (in seconds)
export const ATTEMPT_AUTO_SAVE_INTERVAL = 30;

// Warning threshold for remaining time (in seconds)
export const TIME_WARNING_THRESHOLD = 300; // 5 minutes
