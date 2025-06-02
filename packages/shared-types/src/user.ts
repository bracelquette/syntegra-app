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
export const CreateUserRequestSchema = z.object({
  nik: z
    .string()
    .min(16, "NIK must be exactly 16 characters")
    .max(16, "NIK must be exactly 16 characters"),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  role: RoleEnum.default("participant"),
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
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
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type UserData = z.infer<typeof UserDataSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

// ==================== DATABASE TYPES ====================
export type CreateUserDB = {
  nik: string;
  name: string;
  role: Role;
  email: string;
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
  created_by: string | null;
  updated_by: string | null;
};
