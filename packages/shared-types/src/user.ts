import { z } from "zod";

// ==================== ENUMS ====================
export const RoleEnum = z.enum(["admin", "participant"]);
export const GenderEnum = z.enum(["male", "female"]);
export const ReligionEnum = z.enum([
  "islam",
  "kristen",
  "katolik",
  "hindu",
  "buddha",
  "konghucu",
  "other",
]);
export const EducationEnum = z.enum([
  "sd",
  "smp",
  "sma",
  "diploma",
  "s1",
  "s2",
  "s3",
  "other",
]);

// ==================== REQUEST SCHEMAS ====================
export const CreateUserRequestSchema = z
  .object({
    nik: z
      .string()
      .min(16, "NIK must be exactly 16 characters")
      .max(16, "NIK must be exactly 16 characters"),
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    role: RoleEnum.default("participant"),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email is too long"),
    // Password only required for admin users
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
      )
      .optional(),
    gender: GenderEnum,
    phone: z
      .string()
      .min(1, "Phone is required")
      .max(20, "Phone number is too long"),
    birth_place: z.string().max(100, "Birth place is too long").optional(),
    birth_date: z.string().datetime().optional(),
    religion: ReligionEnum.optional(),
    education: EducationEnum.optional(),
    address: z.string().optional(),
    province: z.string().max(100, "Province is too long").optional(),
    regency: z.string().max(100, "Regency is too long").optional(),
    district: z.string().max(100, "District is too long").optional(),
    village: z.string().max(100, "Village is too long").optional(),
    postal_code: z.string().max(10, "Postal code is too long").optional(),
    profile_picture_url: z
      .string()
      .url("Invalid URL format")
      .max(500, "URL is too long")
      .optional(),
    created_by: z.string().uuid("Invalid UUID format").optional(),
  })
  .refine(
    (data) => {
      // Password is required for admin users
      if (data.role === "admin" && !data.password) {
        return false;
      }
      // Password should not be provided for participant users
      if (data.role === "participant" && data.password) {
        return false;
      }
      return true;
    },
    {
      message:
        "Password is required for admin users and should not be provided for participants",
      path: ["password"],
    }
  );

// Get Users Request Schema (Query Parameters)
export const GetUsersRequestSchema = z.object({
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
  role: RoleEnum.optional(),
  gender: GenderEnum.optional(),
  religion: ReligionEnum.optional(),
  education: EducationEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  province: z.string().optional(),
  regency: z.string().optional(),

  // Date filters
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),

  // Sorting
  sort_by: z
    .enum([
      "name",
      "email",
      "created_at",
      "updated_at",
      "nik",
      "role",
      "birth_date",
    ])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

// Get User By ID Request Schema (Path Parameters)
export const GetUserByIdRequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

// ==================== UPDATE USER SCHEMAS ====================
export const UpdateUserRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name is too long")
      .optional(),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email is too long")
      .optional(),
    gender: GenderEnum.optional(),
    phone: z
      .string()
      .min(1, "Phone is required")
      .max(20, "Phone number is too long")
      .optional(),
    birth_place: z.string().max(100, "Birth place is too long").optional(),
    birth_date: z.string().datetime().optional(),
    religion: ReligionEnum.optional(),
    education: EducationEnum.optional(),
    address: z.string().optional(),
    province: z.string().max(100, "Province is too long").optional(),
    regency: z.string().max(100, "Regency is too long").optional(),
    district: z.string().max(100, "District is too long").optional(),
    village: z.string().max(100, "Village is too long").optional(),
    postal_code: z.string().max(10, "Postal code is too long").optional(),
    profile_picture_url: z
      .string()
      .url("Invalid URL format")
      .max(500, "URL is too long")
      .optional(),
    // Admin only fields
    is_active: z.boolean().optional(),
    role: RoleEnum.optional(),
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

// Update User By ID Request Schema (Path Parameters)
export const UpdateUserByIdRequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

// ==================== DELETE USER SCHEMAS ====================

// Delete User By ID Request Schema (Path Parameters)
export const DeleteUserByIdRequestSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

// ==================== RESPONSE SCHEMAS ====================
export const UserDataSchema = z.object({
  id: z.string().uuid(),
  nik: z.string(),
  name: z.string(),
  role: RoleEnum,
  email: z.string().email(),
  gender: GenderEnum,
  phone: z.string(),
  birth_place: z.string().nullable(),
  birth_date: z.date().nullable(),
  religion: ReligionEnum.nullable(),
  education: EducationEnum.nullable(),
  address: z.string().nullable(),
  province: z.string().nullable(),
  regency: z.string().nullable(),
  district: z.string().nullable(),
  village: z.string().nullable(),
  postal_code: z.string().nullable(),
  profile_picture_url: z.string().nullable(),
  is_active: z.boolean(),
  email_verified: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
});

export const CreateUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: UserDataSchema,
  timestamp: z.string(),
});

// Get User By ID Response Schema
export const GetUserByIdResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: UserDataSchema,
  timestamp: z.string(),
});

// Pagination Meta Schema
export const PaginationMetaSchema = z.object({
  current_page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_next_page: z.boolean(),
  has_prev_page: z.boolean(),
});

// Get Users Response Schema
export const GetUsersResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(UserDataSchema),
  meta: PaginationMetaSchema,
  timestamp: z.string(),
});

// Update User Response Schema
export const UpdateUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: UserDataSchema,
  timestamp: z.string(),
});

// Delete User Response Schema
export const DeleteUserResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    deleted_at: z.string().datetime(),
  }),
  timestamp: z.string(),
});

export const ErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(ErrorDetailSchema).optional(),
  timestamp: z.string(),
});

// ==================== TYPE EXPORTS ====================
export type Role = z.infer<typeof RoleEnum>;
export type Gender = z.infer<typeof GenderEnum>;
export type Religion = z.infer<typeof ReligionEnum>;
export type Education = z.infer<typeof EducationEnum>;

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type GetUsersRequest = z.infer<typeof GetUsersRequestSchema>;
export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
export type GetUserByIdRequest = z.infer<typeof GetUserByIdRequestSchema>;
export type GetUserByIdResponse = z.infer<typeof GetUserByIdResponseSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UpdateUserByIdRequest = z.infer<typeof UpdateUserByIdRequestSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
export type DeleteUserByIdRequest = z.infer<typeof DeleteUserByIdRequestSchema>;
export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type UserData = z.infer<typeof UserDataSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

// ==================== DATABASE TYPES ====================
export type CreateUserDB = {
  nik: string;
  name: string;
  role: Role;
  email: string;
  password?: string | null; // Only for admin users
  gender: Gender;
  phone: string;
  birth_place: string | null;
  birth_date: Date | null;
  religion: Religion | null;
  education: Education | null;
  address: string | null;
  province: string | null;
  regency: string | null;
  district: string | null;
  village: string | null;
  postal_code: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  login_attempts: number;
  created_by: string | null;
  updated_by: string | null;
};

export type UpdateUserDB = {
  name?: string;
  email?: string;
  gender?: Gender;
  phone?: string;
  birth_place?: string | null;
  birth_date?: Date | null;
  religion?: Religion | null;
  education?: Education | null;
  address?: string | null;
  province?: string | null;
  regency?: string | null;
  district?: string | null;
  village?: string | null;
  postal_code?: string | null;
  profile_picture_url?: string | null;
  is_active?: boolean;
  role?: Role;
  updated_at: Date;
  updated_by?: string | null;
};
