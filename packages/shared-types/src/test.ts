import { z } from "zod";

// ==================== ENUMS ====================
export const ModuleTypeEnum = z.enum([
  "intelligence",
  "personality",
  "aptitude",
  "interest",
  "projective",
  "cognitive",
]);

export const CategoryEnum = z.enum([
  "wais",
  "mbti",
  "wartegg",
  "riasec",
  "kraepelin",
  "pauli",
  "big_five",
  "papi_kostick",
  "dap",
  "raven",
  "epps",
  "army_alpha",
  "htp",
  "disc",
  "iq",
  "eq",
]);

export const TestStatusEnum = z.enum(["active", "inactive", "archived"]);

// ==================== REQUEST SCHEMAS ====================

// Get Tests Request Schema (Query Parameters)
export const GetTestsRequestSchema = z.object({
  // Pagination
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .min(1)
    .max(100, "Limit must be between 1 and 100")
    .default(10),

  // Search
  search: z.string().optional(), // Search by name or description

  // Filters
  module_type: ModuleTypeEnum.optional(),
  category: CategoryEnum.optional(),
  status: TestStatusEnum.optional(),

  // Time limit range filters
  time_limit_min: z.coerce
    .number()
    .min(0, "Time limit must be positive")
    .optional(),
  time_limit_max: z.coerce
    .number()
    .min(0, "Time limit must be positive")
    .optional(),

  // Question count filters
  total_questions_min: z.coerce
    .number()
    .min(0, "Questions count must be positive")
    .optional(),
  total_questions_max: z.coerce
    .number()
    .min(0, "Questions count must be positive")
    .optional(),

  // Date filters
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Sorting
  sort_by: z
    .enum([
      "name",
      "category",
      "module_type",
      "time_limit",
      "total_questions",
      "display_order",
      "created_at",
      "updated_at",
    ])
    .default("display_order"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

// Get Test By ID Request Schema (Path Parameters)
export const GetTestByIdRequestSchema = z.object({
  testId: z.string().uuid("Invalid test ID format"),
});

// ==================== RESPONSE SCHEMAS ====================

export const TestDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  module_type: ModuleTypeEnum,
  category: CategoryEnum,
  time_limit: z.number(), // in minutes
  icon_url: z.string().nullable(),
  card_color: z.string().nullable(),
  test_prerequisites: z.array(z.string().uuid()).nullable(),
  display_order: z.number(),
  subcategory: z.array(z.string()).nullable(),
  total_questions: z.number(),
  passing_score: z.number().nullable(),
  status: TestStatusEnum,
  instructions: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
});

// Get Test By ID Response Schema
export const GetTestByIdResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestDataSchema,
  timestamp: z.string(),
});

// Pagination Meta Schema (reuse from user.ts if needed)
export const TestPaginationMetaSchema = z.object({
  current_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_next_page: z.boolean(),
  has_prev_page: z.boolean(),
});

// Get Tests Response Schema
export const GetTestsResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(TestDataSchema),
  meta: TestPaginationMetaSchema,
  filters: z
    .object({
      module_types: z.array(ModuleTypeEnum),
      categories: z.array(CategoryEnum),
      statuses: z.array(TestStatusEnum),
      time_limit_range: z.object({
        min: z.number(),
        max: z.number(),
      }),
      questions_count_range: z.object({
        min: z.number(),
        max: z.number(),
      }),
    })
    .optional(),
  timestamp: z.string(),
});

// Test Statistics Schema (for dashboard)
export const TestStatsSchema = z.object({
  total_tests: z.number(),
  active_tests: z.number(),
  inactive_tests: z.number(),
  archived_tests: z.number(),
  by_module_type: z.record(z.string(), z.number()),
  by_category: z.record(z.string(), z.number()),
  avg_time_limit: z.number(),
  avg_questions_count: z.number(),
});

export const GetTestStatsResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestStatsSchema,
  timestamp: z.string(),
});

// Error response schema (reuse from user.ts)
export const TestErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const TestErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(TestErrorDetailSchema).optional(),
  timestamp: z.string(),
});

// ==================== TYPE EXPORTS ====================
export type ModuleType = z.infer<typeof ModuleTypeEnum>;
export type Category = z.infer<typeof CategoryEnum>;
export type TestStatus = z.infer<typeof TestStatusEnum>;

export type GetTestsRequest = z.infer<typeof GetTestsRequestSchema>;
export type GetTestsResponse = z.infer<typeof GetTestsResponseSchema>;
export type GetTestByIdRequest = z.infer<typeof GetTestByIdRequestSchema>;
export type GetTestByIdResponse = z.infer<typeof GetTestByIdResponseSchema>;
export type TestPaginationMeta = z.infer<typeof TestPaginationMetaSchema>;
export type TestErrorResponse = z.infer<typeof TestErrorResponseSchema>;
export type TestData = z.infer<typeof TestDataSchema>;
export type TestErrorDetail = z.infer<typeof TestErrorDetailSchema>;
export type TestStats = z.infer<typeof TestStatsSchema>;
export type GetTestStatsResponse = z.infer<typeof GetTestStatsResponseSchema>;

// ==================== DATABASE TYPES ====================
export type CreateTestDB = {
  name: string;
  description: string | null;
  module_type: ModuleType;
  category: Category;
  time_limit: number;
  icon_url: string | null;
  card_color: string | null;
  test_prerequisites: string[] | null;
  display_order: number;
  subcategory: string[] | null;
  total_questions: number;
  passing_score: number | null;
  status: TestStatus;
  instructions: string | null;
  created_by: string | null;
  updated_by: string | null;
};

export type UpdateTestDB = {
  name?: string;
  description?: string | null;
  module_type?: ModuleType;
  category?: Category;
  time_limit?: number;
  icon_url?: string | null;
  card_color?: string | null;
  test_prerequisites?: string[] | null;
  display_order?: number;
  subcategory?: string[] | null;
  total_questions?: number;
  passing_score?: number | null;
  status?: TestStatus;
  instructions?: string | null;
  updated_at: Date;
  updated_by?: string | null;
};

// ==================== UTILITY TYPES ====================

// For frontend display
export type TestCardData = {
  id: string;
  name: string;
  description: string | null;
  module_type: ModuleType;
  category: Category;
  time_limit: number;
  icon_url: string | null;
  card_color: string | null;
  total_questions: number;
  display_order: number;
  status: TestStatus;
};

// For session creation
export type TestSelectionData = {
  id: string;
  name: string;
  category: Category;
  module_type: ModuleType;
  time_limit: number;
  total_questions: number;
  test_prerequisites: string[] | null;
  is_required: boolean;
  weight: number;
};

// Filter options for frontend
export type TestFilterOptions = {
  module_types: { value: ModuleType; label: string }[];
  categories: { value: Category; label: string }[];
  statuses: { value: TestStatus; label: string }[];
};

// ==================== CONSTANTS ====================
export const TEST_MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  intelligence: "Intelligence",
  personality: "Personality",
  aptitude: "Aptitude",
  interest: "Interest",
  projective: "Projective",
  cognitive: "Cognitive",
};

export const TEST_CATEGORY_LABELS: Record<Category, string> = {
  wais: "WAIS (Wechsler Adult Intelligence Scale)",
  mbti: "MBTI (Myers-Briggs Type Indicator)",
  wartegg: "Wartegg Drawing Test",
  riasec: "RIASEC (Holland Test)",
  kraepelin: "Kraepelin Test",
  pauli: "Pauli Test",
  big_five: "Big Five Personality",
  papi_kostick: "PAPI Kostick",
  dap: "DAP (Draw-A-Person)",
  raven: "Raven's Progressive Matrices",
  epps: "EPPS (Edwards Personal Preference Schedule)",
  army_alpha: "Army Alpha Test",
  htp: "HTP (House-Tree-Person)",
  disc: "DISC Assessment",
  iq: "IQ Test",
  eq: "EQ (Emotional Intelligence)",
};

export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};
