import { z } from "zod";

// ==================== ENUMS ====================
export const SessionStatusEnum = z.enum([
  "draft",
  "active",
  "expired",
  "completed",
  "cancelled",
]);

// ==================== SESSION REQUEST SCHEMAS ====================

// Session Module Schema (for tests in a session)
export const SessionModuleSchema = z.object({
  test_id: z.string().uuid("Invalid test ID format"),
  sequence: z.number().min(1, "Sequence must be at least 1"),
  is_required: z.boolean().default(true),
  weight: z.number().min(0.1).max(10).default(1.0), // Weight for scoring
});

// Create Session Request Schema
export const CreateSessionRequestSchema = z
  .object({
    session_name: z
      .string()
      .min(1, "Session name is required")
      .max(255, "Session name is too long"),
    session_code: z
      .string()
      .min(3, "Session code must be at least 3 characters")
      .max(50, "Session code is too long")
      .regex(
        /^[A-Za-z0-9-_]+$/,
        "Session code can only contain letters, numbers, hyphens, and underscores"
      )
      .optional(), // If not provided, will be auto-generated
    start_time: z.string().datetime("Invalid start time format"),
    end_time: z.string().datetime("Invalid end time format"),
    target_position: z
      .string()
      .min(1, "Target position is required")
      .max(100, "Target position is too long"),
    max_participants: z
      .number()
      .min(1, "Max participants must be at least 1")
      .max(1000, "Max participants cannot exceed 1000")
      .optional(),
    description: z.string().max(1000, "Description is too long").optional(),
    location: z.string().max(255, "Location is too long").optional(),
    proctor_id: z.string().uuid("Invalid proctor ID format").optional(),
    auto_expire: z.boolean().default(true),
    allow_late_entry: z.boolean().default(false),
    session_modules: z
      .array(SessionModuleSchema)
      .min(1, "At least one test module is required")
      .max(20, "Maximum 20 test modules allowed"),
  })
  .refine(
    (data) => {
      const startTime = new Date(data.start_time);
      const endTime = new Date(data.end_time);
      return endTime > startTime;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  )
  .refine(
    (data) => {
      const startTime = new Date(data.start_time);
      const now = new Date();
      return startTime > now;
    },
    {
      message: "Start time must be in the future",
      path: ["start_time"],
    }
  )
  .refine(
    (data) => {
      // Check for duplicate sequences in session modules
      const sequences = data.session_modules.map((module) => module.sequence);
      const uniqueSequences = new Set(sequences);
      return sequences.length === uniqueSequences.size;
    },
    {
      message: "Session modules must have unique sequence numbers",
      path: ["session_modules"],
    }
  )
  .refine(
    (data) => {
      // Check for duplicate test IDs in session modules
      const testIds = data.session_modules.map((module) => module.test_id);
      const uniqueTestIds = new Set(testIds);
      return testIds.length === uniqueTestIds.size;
    },
    {
      message: "Session modules cannot contain duplicate tests",
      path: ["session_modules"],
    }
  );

// Update Session Request Schema
export const UpdateSessionRequestSchema = z
  .object({
    session_name: z
      .string()
      .min(1, "Session name is required")
      .max(255, "Session name is too long")
      .optional(),
    start_time: z.string().datetime("Invalid start time format").optional(),
    end_time: z.string().datetime("Invalid end time format").optional(),
    target_position: z
      .string()
      .min(1, "Target position is required")
      .max(100, "Target position is too long")
      .optional(),
    max_participants: z
      .number()
      .min(1, "Max participants must be at least 1")
      .max(1000, "Max participants cannot exceed 1000")
      .optional(),
    description: z.string().max(1000, "Description is too long").optional(),
    location: z.string().max(255, "Location is too long").optional(),
    proctor_id: z.string().uuid("Invalid proctor ID format").optional(),
    auto_expire: z.boolean().optional(),
    allow_late_entry: z.boolean().optional(),
    status: SessionStatusEnum.optional(),
    session_modules: z
      .array(SessionModuleSchema)
      .min(1, "At least one test module is required")
      .max(20, "Maximum 20 test modules allowed")
      .optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided for update
      const hasAtLeastOneField = Object.values(data).some(
        (value) => value !== undefined
      );
      return hasAtLeastOneField;
    },
    {
      message: "At least one field must be provided for update",
      path: ["root"],
    }
  );

// Get Sessions Request Schema (Query Parameters)
export const GetSessionsRequestSchema = z.object({
  // Pagination
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .min(1)
    .max(100, "Limit must be between 1 and 100")
    .default(10),

  // Search
  search: z.string().optional(), // Search by session name, code, or target position

  // Filters
  status: SessionStatusEnum.optional(),
  target_position: z.string().optional(),
  proctor_id: z.string().uuid("Invalid proctor ID format").optional(),

  // Date filters
  start_date_from: z.string().datetime().optional(),
  start_date_to: z.string().datetime().optional(),
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Sorting
  sort_by: z
    .enum([
      "session_name",
      "session_code",
      "start_time",
      "end_time",
      "target_position",
      "status",
      "created_at",
      "updated_at",
    ])
    .default("start_time"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

// Path Parameter Schemas
export const GetSessionByIdRequestSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
});

export const UpdateSessionByIdRequestSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
});

export const DeleteSessionByIdRequestSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
});

export const GetSessionByCodeRequestSchema = z.object({
  sessionCode: z.string().min(1, "Session code is required"),
});

// ==================== RESPONSE SCHEMAS ====================

// Session Module Data Schema (for response)
export const SessionModuleDataSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  test_id: z.string().uuid(),
  sequence: z.number(),
  is_required: z.boolean(),
  weight: z.number(),
  created_at: z.date(),
  // Test details (populated from join)
  test: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      category: z.string(),
      module_type: z.string(),
      time_limit: z.number(),
      total_questions: z.number(),
      icon: z.string().nullable(),
      card_color: z.string().nullable(),
    })
    .optional(),
});

// Session Data Schema
export const SessionDataSchema = z.object({
  id: z.string().uuid(),
  session_name: z.string(),
  session_code: z.string(),
  start_time: z.date(),
  end_time: z.date(),
  target_position: z.string(),
  max_participants: z.number().nullable(),
  current_participants: z.number(),
  status: SessionStatusEnum,
  description: z.string().nullable(),
  location: z.string().nullable(),
  proctor_id: z.string().uuid().nullable(),
  auto_expire: z.boolean(),
  allow_late_entry: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),

  // Populated fields
  session_modules: z.array(SessionModuleDataSchema).optional(),
  proctor: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),

  // Computed fields
  is_active: z.boolean().optional(),
  is_expired: z.boolean().optional(),
  time_remaining: z.number().optional(), // in minutes
  participant_link: z.string().optional(), // Full URL for participants
});

// Create Session Response Schema
export const CreateSessionResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: SessionDataSchema,
  timestamp: z.string(),
});

// Update Session Response Schema
export const UpdateSessionResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: SessionDataSchema,
  timestamp: z.string(),
});

// Delete Session Response Schema
export const DeleteSessionResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    session_name: z.string(),
    session_code: z.string(),
    deleted_at: z.string().datetime(),
  }),
  timestamp: z.string(),
});

// Get Session By ID Response Schema
export const GetSessionByIdResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: SessionDataSchema,
  timestamp: z.string(),
});

// Get Session By Code Response Schema (for participants)
export const GetSessionByCodeResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    session_name: z.string(),
    session_code: z.string(),
    start_time: z.date(),
    end_time: z.date(),
    target_position: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    status: SessionStatusEnum,
    is_active: z.boolean(),
    is_expired: z.boolean(),
    time_remaining: z.number(), // in minutes
    session_modules: z.array(
      z.object({
        sequence: z.number(),
        test: z.object({
          id: z.string().uuid(),
          name: z.string(),
          category: z.string(),
          module_type: z.string(),
          time_limit: z.number(),
          icon: z.string().nullable(),
          card_color: z.string().nullable(),
        }),
        is_required: z.boolean(),
      })
    ),
  }),
  timestamp: z.string(),
});

// Pagination Meta Schema
export const SessionPaginationMetaSchema = z.object({
  current_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_next_page: z.boolean(),
  has_prev_page: z.boolean(),
});

// Get Sessions Response Schema
export const GetSessionsResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(SessionDataSchema),
  meta: SessionPaginationMetaSchema,
  filters: z
    .object({
      statuses: z.array(SessionStatusEnum),
      target_positions: z.array(z.string()),
      proctors: z.array(
        z.object({
          id: z.string().uuid(),
          name: z.string(),
          email: z.string(),
        })
      ),
    })
    .optional(),
  timestamp: z.string(),
});

// Session Statistics Schema
export const SessionStatsSchema = z.object({
  total_sessions: z.number(),
  active_sessions: z.number(),
  expired_sessions: z.number(),
  completed_sessions: z.number(),
  draft_sessions: z.number(),
  cancelled_sessions: z.number(),
  by_status: z.record(z.string(), z.number()),
  by_target_position: z.record(z.string(), z.number()),
  total_participants: z.number(),
  avg_participants_per_session: z.number(),
  // Additional time-based statistics
  today_sessions: z.number(),
  week_sessions: z.number(),
  month_sessions: z.number(),
});

export const GetSessionStatsResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: SessionStatsSchema,
  timestamp: z.string(),
});

// Error response schema
export const SessionErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const SessionErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(SessionErrorDetailSchema).optional(),
  timestamp: z.string(),
});

// ==================== TYPE EXPORTS ====================
export type SessionStatus = z.infer<typeof SessionStatusEnum>;
export type SessionModule = z.infer<typeof SessionModuleSchema>;
export type SessionModuleData = z.infer<typeof SessionModuleDataSchema>;

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>;
export type UpdateSessionByIdRequest = z.infer<
  typeof UpdateSessionByIdRequestSchema
>;
export type UpdateSessionResponse = z.infer<typeof UpdateSessionResponseSchema>;
export type DeleteSessionByIdRequest = z.infer<
  typeof DeleteSessionByIdRequestSchema
>;
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>;
export type GetSessionsRequest = z.infer<typeof GetSessionsRequestSchema>;
export type GetSessionsResponse = z.infer<typeof GetSessionsResponseSchema>;
export type GetSessionByIdRequest = z.infer<typeof GetSessionByIdRequestSchema>;
export type GetSessionByIdResponse = z.infer<
  typeof GetSessionByIdResponseSchema
>;
export type GetSessionByCodeRequest = z.infer<
  typeof GetSessionByCodeRequestSchema
>;
export type GetSessionByCodeResponse = z.infer<
  typeof GetSessionByCodeResponseSchema
>;
export type SessionPaginationMeta = z.infer<typeof SessionPaginationMetaSchema>;
export type SessionErrorResponse = z.infer<typeof SessionErrorResponseSchema>;
export type SessionData = z.infer<typeof SessionDataSchema>;
export type SessionErrorDetail = z.infer<typeof SessionErrorDetailSchema>;
export type SessionStats = z.infer<typeof SessionStatsSchema>;
export type GetSessionStatsResponse = z.infer<
  typeof GetSessionStatsResponseSchema
>;

// ==================== DATABASE TYPES ====================
export type CreateSessionDB = {
  session_name: string;
  session_code: string;
  start_time: Date;
  end_time: Date;
  target_position: string;
  max_participants: number | null;
  description: string | null;
  location: string | null;
  proctor_id: string | null;
  auto_expire: boolean;
  allow_late_entry: boolean;
  status: SessionStatus;
  created_by: string | null;
  updated_by: string | null;
};

export type UpdateSessionDB = {
  session_name?: string;
  start_time?: Date;
  end_time?: Date;
  target_position?: string;
  max_participants?: number | null;
  description?: string | null;
  location?: string | null;
  proctor_id?: string | null;
  auto_expire?: boolean;
  allow_late_entry?: boolean;
  status?: SessionStatus;
  updated_at: Date;
  updated_by?: string | null;
};

export type CreateSessionModuleDB = {
  session_id: string;
  test_id: string;
  sequence: number;
  is_required: boolean;
  weight: string; // Stored as string in database (numeric type)
};

// ==================== UTILITY TYPES ====================

// For frontend display
export type SessionCardData = {
  id: string;
  session_name: string;
  session_code: string;
  start_time: Date;
  end_time: Date;
  target_position: string;
  status: SessionStatus;
  current_participants: number;
  max_participants: number | null;
  is_active: boolean;
  is_expired: boolean;
  time_remaining: number; // in minutes
};

// For participant access
export type SessionAccessData = {
  id: string;
  session_name: string;
  session_code: string;
  target_position: string;
  is_accessible: boolean;
  access_message: string;
  session_modules: Array<{
    sequence: number;
    test_name: string;
    test_category: string;
    time_limit: number;
    is_required: boolean;
  }>;
};

// Filter options for frontend
export type SessionFilterOptions = {
  statuses: { value: SessionStatus; label: string }[];
  target_positions: { value: string; label: string }[];
  proctors: { value: string; label: string }[];
};

// ==================== VALIDATION HELPERS ====================

// Generate unique session code
export function generateSessionCode(
  sessionName: string,
  targetPosition: string
): string {
  const namePrefix = sessionName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const positionPrefix = targetPosition
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `${namePrefix}${positionPrefix}-${timestamp}-${random}`;
}

// Check if session is currently active
export function isSessionActive(session: {
  start_time: Date;
  end_time: Date;
  status: SessionStatus;
}): boolean {
  const now = new Date();
  return (
    session.status === "active" &&
    now >= session.start_time &&
    now <= session.end_time
  );
}

// Check if session is expired
export function isSessionExpired(session: {
  end_time: Date;
  status: SessionStatus;
}): boolean {
  const now = new Date();
  return (
    session.status === "expired" ||
    (session.status === "active" && now > session.end_time)
  );
}

// Calculate time remaining in minutes
export function getTimeRemaining(endTime: Date): number {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60)));
}

// Generate participant access link
export function generateParticipantLink(
  sessionCode: string,
  baseUrl: string = ""
): string {
  return `${baseUrl}/psikotes/${sessionCode}`;
}

// ==================== CONSTANTS ====================
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  draft: "Draft",
  active: "Active",
  expired: "Expired",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-yellow-100 text-yellow-800",
};

// Common target positions
export const COMMON_TARGET_POSITIONS = [
  "Security",
  "Staff",
  "Manager",
  "Supervisor",
  "Operator",
  "Admin",
  "Executive",
  "Analyst",
  "Coordinator",
  "Specialist",
];

// Session duration presets (in hours)
export const SESSION_DURATION_PRESETS = [
  { label: "1 Hour", hours: 1 },
  { label: "2 Hours", hours: 2 },
  { label: "3 Hours", hours: 3 },
  { label: "4 Hours", hours: 4 },
  { label: "Half Day (4 Hours)", hours: 4 },
  { label: "Full Day (8 Hours)", hours: 8 },
];
