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

// ==================== BASE USER TYPES ====================
export const UserSchema = z.object({
  id: z.string().uuid(),
  nik: z.string().max(20),
  name: z.string().max(255),
  role: RoleEnum,
  email: z.string().email().max(255),
  gender: GenderEnum,
  phone: z.string().max(20),
  birth_place: z.string().max(100).optional().nullable(),
  birth_date: z.date().optional().nullable(),
  religion: ReligionEnum.optional().nullable(),
  education: EducationEnum.optional().nullable(),
  address: z.string().optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  regency: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  village: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(10).optional().nullable(),
  profile_picture_url: z.string().url().max(500).optional().nullable(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

// ==================== CREATE USER TYPES ====================
export const CreateUserRequestSchema = z.object({
  nik: z
    .string()
    .min(1, "NIK is required")
    .max(20, "NIK must be at most 20 characters")
    .regex(/^[0-9]+$/, "NIK must contain only numbers"),

  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  role: RoleEnum.default("participant"),

  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be at most 255 characters")
    .toLowerCase(),

  gender: GenderEnum,

  phone: z
    .string()
    .min(1, "Phone is required")
    .max(20, "Phone must be at most 20 characters")
    .regex(/^[+]?[0-9\s\-()]+$/, "Phone must be a valid phone number"),

  birth_place: z
    .string()
    .max(100, "Birth place must be at most 100 characters")
    .optional(),

  birth_date: z
    .string()
    .datetime("Invalid date format. Use ISO 8601 format")
    .transform((str) => new Date(str))
    .optional(),

  religion: ReligionEnum.optional(),

  education: EducationEnum.optional(),

  address: z.string().optional(),

  province: z
    .string()
    .max(100, "Province must be at most 100 characters")
    .optional(),

  regency: z
    .string()
    .max(100, "Regency must be at most 100 characters")
    .optional(),

  district: z
    .string()
    .max(100, "District must be at most 100 characters")
    .optional(),

  village: z
    .string()
    .max(100, "Village must be at most 100 characters")
    .optional(),

  postal_code: z
    .string()
    .max(10, "Postal code must be at most 10 characters")
    .regex(/^[0-9]+$/, "Postal code must contain only numbers")
    .optional(),

  profile_picture_url: z
    .string()
    .url("Invalid URL format")
    .max(500, "Profile picture URL must be at most 500 characters")
    .optional(),

  created_by: z.string().uuid("Invalid creator ID").optional(),
});

// ==================== RESPONSE TYPES ====================
export const UserResponseSchema = UserSchema.omit({
  created_by: true,
  updated_by: true,
}).extend({
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

export const CreateUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: UserResponseSchema,
  timestamp: z.string(),
});

// ==================== ERROR TYPES ====================
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
        code: z.string().optional(),
      })
    )
    .optional(),
  timestamp: z.string(),
});

// ==================== TYPE EXPORTS ====================
export type Role = z.infer<typeof RoleEnum>;
export type Gender = z.infer<typeof GenderEnum>;
export type Religion = z.infer<typeof ReligionEnum>;
export type Education = z.infer<typeof EducationEnum>;

export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ==================== DATABASE INSERT TYPE ====================
export type CreateUserDB = Omit<
  User,
  "id" | "created_at" | "updated_at" | "is_active"
> & {
  is_active?: boolean;
};
