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
export const CreateTestRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Test name is required")
    .max(255, "Test name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  module_type: ModuleTypeEnum,
  category: CategoryEnum,
  time_limit: z
    .number()
    .min(1, "Time limit must be at least 1 minute")
    .max(1440, "Time limit cannot exceed 24 hours"), // max 24 hours in minutes
  icon_url: z
    .string()
    .url("Invalid icon URL format")
    .max(500, "Icon URL is too long")
    .optional(),
  card_color: z
    .string()
    .max(100, "Card color is too long")
    .regex(
      /^(from-\w+-\d{2,3}\s+to-\w+-\d{2,3}|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|\w+)$/,
      "Invalid card color format. Use Tailwind gradient classes (e.g., 'from-green-500 to-emerald-600') or hex colors"
    )
    .optional(),
  test_prerequisites: z
    .array(z.string().uuid("Invalid test ID format"))
    .max(10, "Maximum 10 prerequisites allowed")
    .optional(),
  display_order: z
    .number()
    .min(0, "Display order cannot be negative")
    .max(9999, "Display order is too large")
    .default(0),
  subcategory: z
    .array(z.string().min(1, "Subcategory cannot be empty"))
    .max(2, "Maximum 2 subcategories allowed")
    .optional(),
  total_questions: z
    .number()
    .min(0, "Total questions cannot be negative")
    .max(1000, "Maximum 1000 questions allowed")
    .default(0),
  passing_score: z
    .number()
    .min(0, "Passing score cannot be negative")
    .max(100, "Passing score cannot exceed 100")
    .optional(),
  status: TestStatusEnum.default("active"),
  instructions: z.string().max(5000, "Instructions are too long").optional(),
});

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
  search: z.string().optional(),

  // Filters
  module_type: ModuleTypeEnum.optional(),
  category: CategoryEnum.optional(),
  status: TestStatusEnum.optional(),

  // Date filters
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Sorting
  sort_by: z
    .enum([
      "name",
      "created_at",
      "updated_at",
      "module_type",
      "category",
      "time_limit",
      "display_order",
      "total_questions",
    ])
    .default("display_order"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),

  // Include related data
  include_questions: z.coerce.boolean().default(false),
  include_stats: z.coerce.boolean().default(false),
});

// Get Test By ID Request Schema (Path Parameters)
export const GetTestByIdRequestSchema = z.object({
  testId: z.string().uuid("Invalid test ID format"),
});

// ==================== UPDATE TEST SCHEMAS ====================
export const UpdateTestRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, "Test name is required")
      .max(255, "Test name is too long")
      .optional(),
    description: z.string().max(1000, "Description is too long").optional(),
    module_type: ModuleTypeEnum.optional(),
    category: CategoryEnum.optional(),
    time_limit: z
      .number()
      .min(1, "Time limit must be at least 1 minute")
      .max(1440, "Time limit cannot exceed 24 hours")
      .optional(),
    icon_url: z
      .string()
      .url("Invalid icon URL format")
      .max(500, "Icon URL is too long")
      .optional(),
    card_color: z
      .string()
      .max(100, "Card color is too long")
      .regex(
        /^(from-\w+-\d{2,3}\s+to-\w+-\d{2,3}|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|\w+)$/,
        "Invalid card color format"
      )
      .optional(),
    test_prerequisites: z
      .array(z.string().uuid("Invalid test ID format"))
      .max(10, "Maximum 10 prerequisites allowed")
      .optional(),
    display_order: z
      .number()
      .min(0, "Display order cannot be negative")
      .max(9999, "Display order is too large")
      .optional(),
    subcategory: z
      .array(z.string().min(1, "Subcategory cannot be empty"))
      .max(2, "Maximum 2 subcategories allowed")
      .optional(),
    total_questions: z
      .number()
      .min(0, "Total questions cannot be negative")
      .max(1000, "Maximum 1000 questions allowed")
      .optional(),
    passing_score: z
      .number()
      .min(0, "Passing score cannot be negative")
      .max(100, "Passing score cannot exceed 100")
      .optional(),
    status: TestStatusEnum.optional(),
    instructions: z.string().max(5000, "Instructions are too long").optional(),
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

// Update Test By ID Request Schema (Path Parameters)
export const UpdateTestByIdRequestSchema = z.object({
  testId: z.string().uuid("Invalid test ID format"),
});

// ==================== DELETE TEST SCHEMAS ====================
export const DeleteTestByIdRequestSchema = z.object({
  testId: z.string().uuid("Invalid test ID format"),
});

// ==================== RESPONSE SCHEMAS ====================
export const TestDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  module_type: ModuleTypeEnum,
  category: CategoryEnum,
  time_limit: z.number(),
  icon_url: z.string().nullable(),
  card_color: z.string().nullable(),
  test_prerequisites: z.array(z.string()).nullable(),
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

// Extended test data with statistics
export const TestDataWithStatsSchema = TestDataSchema.extend({
  stats: z
    .object({
      total_attempts: z.number(),
      total_completions: z.number(),
      completion_rate: z.number(),
      average_score: z.number().nullable(),
      average_time_taken: z.number().nullable(),
    })
    .optional(),
});

// Create Test Response Schema
export const CreateTestResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestDataSchema,
  timestamp: z.string(),
});

// Get Test By ID Response Schema
export const GetTestByIdResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestDataWithStatsSchema,
  timestamp: z.string(),
});

// Update Test Response Schema
export const UpdateTestResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: TestDataSchema,
  timestamp: z.string(),
});

// Delete Test Response Schema
export const DeleteTestResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    name: z.string(),
    deleted_at: z.string().datetime(),
  }),
  timestamp: z.string(),
});

// Test Schema Response (for documentation/validation)
export const TestSchemaResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    create_schema: z.any(),
    update_schema: z.any(),
    enums: z.object({
      module_types: z.array(z.string()),
      categories: z.array(z.string()),
      statuses: z.array(z.string()),
    }),
  }),
  timestamp: z.string(),
});

// ==================== TYPE EXPORTS ====================
export type ModuleType = z.infer<typeof ModuleTypeEnum>;
export type Category = z.infer<typeof CategoryEnum>;
export type TestStatus = z.infer<typeof TestStatusEnum>;

export type CreateTestRequest = z.infer<typeof CreateTestRequestSchema>;
export type CreateTestResponse = z.infer<typeof CreateTestResponseSchema>;
export type GetTestsRequest = z.infer<typeof GetTestsRequestSchema>;
export type GetTestByIdRequest = z.infer<typeof GetTestByIdRequestSchema>;
export type GetTestByIdResponse = z.infer<typeof GetTestByIdResponseSchema>;
export type UpdateTestRequest = z.infer<typeof UpdateTestRequestSchema>;
export type UpdateTestByIdRequest = z.infer<typeof UpdateTestByIdRequestSchema>;
export type UpdateTestResponse = z.infer<typeof UpdateTestResponseSchema>;
export type DeleteTestByIdRequest = z.infer<typeof DeleteTestByIdRequestSchema>;
export type DeleteTestResponse = z.infer<typeof DeleteTestResponseSchema>;
export type TestSchemaResponse = z.infer<typeof TestSchemaResponseSchema>;
export type TestData = z.infer<typeof TestDataSchema>;
export type TestDataWithStats = z.infer<typeof TestDataWithStatsSchema>;

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

// ==================== VALIDATION HELPERS ====================

/**
 * Get available module types
 */
export const getModuleTypes = (): ModuleType[] => {
  return ModuleTypeEnum.options;
};

/**
 * Get available categories
 */
export const getCategories = (): Category[] => {
  return CategoryEnum.options;
};

/**
 * Get available test statuses
 */
export const getTestStatuses = (): TestStatus[] => {
  return TestStatusEnum.options;
};

/**
 * Get categories by module type
 */
export const getCategoriesByModuleType = (
  moduleType: ModuleType
): Category[] => {
  const categoryMap: Record<ModuleType, Category[]> = {
    intelligence: ["wais", "raven", "army_alpha", "iq"],
    personality: ["mbti", "big_five", "epps", "disc"],
    aptitude: ["kraepelin", "pauli"],
    interest: ["riasec"],
    projective: ["wartegg", "dap", "htp"],
    cognitive: ["eq"],
  };

  return categoryMap[moduleType] || [];
};

/**
 * Validate if category matches module type
 */
export const validateCategoryForModuleType = (
  category: Category,
  moduleType: ModuleType
): boolean => {
  const validCategories = getCategoriesByModuleType(moduleType);
  return validCategories.includes(category);
};

/**
 * Get default time limits by category (in minutes)
 */
export const getDefaultTimeLimitByCategory = (category: Category): number => {
  const timeLimits: Record<Category, number> = {
    wais: 90, // 1.5 hours
    mbti: 30, // 30 minutes
    wartegg: 45, // 45 minutes
    riasec: 20, // 20 minutes
    kraepelin: 15, // 15 minutes
    pauli: 10, // 10 minutes
    big_five: 25, // 25 minutes
    papi_kostick: 35, // 35 minutes
    dap: 30, // 30 minutes
    raven: 40, // 40 minutes
    epps: 35, // 35 minutes
    army_alpha: 50, // 50 minutes
    htp: 40, // 40 minutes
    disc: 20, // 20 minutes
    iq: 60, // 1 hour
    eq: 30, // 30 minutes
  };

  return timeLimits[category] || 30; // default 30 minutes
};

/**
 * Get recommended card colors by category
 */
export const getRecommendedCardColorByCategory = (
  category: Category
): string => {
  const colorMap: Record<Category, string> = {
    wais: "from-blue-500 to-indigo-600",
    mbti: "from-purple-500 to-pink-600",
    wartegg: "from-green-500 to-emerald-600",
    riasec: "from-yellow-500 to-orange-600",
    kraepelin: "from-red-500 to-rose-600",
    pauli: "from-red-400 to-red-600",
    big_five: "from-indigo-500 to-purple-600",
    papi_kostick: "from-cyan-500 to-blue-600",
    dap: "from-green-400 to-green-600",
    raven: "from-gray-500 to-slate-600",
    epps: "from-pink-500 to-rose-600",
    army_alpha: "from-orange-500 to-red-600",
    htp: "from-emerald-500 to-teal-600",
    disc: "from-violet-500 to-purple-600",
    iq: "from-blue-400 to-blue-600",
    eq: "from-teal-500 to-cyan-600",
  };

  return colorMap[category] || "from-gray-500 to-gray-600";
};
