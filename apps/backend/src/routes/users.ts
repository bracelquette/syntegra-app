import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { getDbFromEnv, users } from "@/db";
import { type CloudflareBindings } from "@/lib/env";

// Generate Zod schemas from Drizzle schema
const selectUserSchema = createSelectSchema(users);
const insertUserSchema = createInsertSchema(users, {
  // Override specific fields for better validation using functions
  nik: (schema) => schema.min(1, "NIK is required").max(20, "NIK too long"),
  name: (schema) => schema.min(1, "Name is required").max(255, "Name too long"),
  email: (schema) =>
    schema.email("Invalid email format").max(255, "Email too long"),
  phone: (schema) =>
    schema.min(1, "Phone is required").max(20, "Phone too long"),
  birth_date: (schema) => schema.optional(),
  postal_code: (schema) => schema.max(10, "Postal code too long").optional(),
});

// Create request schema (exclude auto-generated fields) with type assertion
const createUserSchema = insertUserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_active: true,
}) as unknown as z.ZodType<any>;

// Response schemas
const createUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.record(z.any()).optional(), // Use z.record for flexibility
});

const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

// Manual type definitions to avoid drizzle-zod inference issues
type CreateUserRequest = {
  nik: string;
  name: string;
  email: string;
  role?: "admin" | "participant";
  gender: "male" | "female";
  phone: string;
  birth_place?: string;
  birth_date?: Date;
  religion?:
    | "islam"
    | "kristen"
    | "katolik"
    | "hindu"
    | "buddha"
    | "konghucu"
    | "other";
  education?: "sd" | "smp" | "sma" | "diploma" | "s1" | "s2" | "s3" | "other";
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  postal_code?: string;
  profile_picture_url?: string;
  created_by?: string;
  updated_by?: string;
};
type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post(
  "/users",
  zValidator("json", createUserSchema as any), // Type assertion to bypass constraint
  async (c) => {
    try {
      const db = getDbFromEnv(c.env);
      const userData = c.req.valid("json");

      // Check if NIK already exists
      const existingNik = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.nik, userData.nik))
        .limit(1);

      if (existingNik.length > 0) {
        return c.json<ErrorResponse>(
          {
            success: false,
            message: "User creation failed",
            errors: [
              {
                field: "nik",
                message: "NIK already exists",
              },
            ],
          },
          409
        );
      }

      // Check if email already exists
      const existingEmail = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingEmail.length > 0) {
        return c.json<ErrorResponse>(
          {
            success: false,
            message: "User creation failed",
            errors: [
              {
                field: "email",
                message: "Email already exists",
              },
            ],
          },
          409
        );
      }

      // Prepare user data for insertion
      const userInsertData = {
        ...userData,
        birth_date: userData.birth_date ? new Date(userData.birth_date) : null,
        is_active: true,
      };

      // Insert new user
      const [newUser] = await db
        .insert(users)
        .values(userInsertData)
        .returning();

      // Remove sensitive fields from response
      const { created_by, updated_by, ...safeUserData } = newUser;

      return c.json<CreateUserResponse>(
        {
          success: true,
          message: "User created successfully",
          data: safeUserData,
        },
        201
      );
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle specific database errors
      if (error instanceof Error) {
        // PostgreSQL unique constraint violation
        if (error.message.includes("unique constraint")) {
          let field = "unknown";
          let message = "Duplicate value detected";

          if (error.message.includes("nik")) {
            field = "nik";
            message = "NIK already exists";
          } else if (error.message.includes("email")) {
            field = "email";
            message = "Email already exists";
          }

          return c.json<ErrorResponse>(
            {
              success: false,
              message: "User creation failed",
              errors: [{ field, message }],
            },
            409
          );
        }

        // Other database errors
        if (
          error.message.includes("database") ||
          error.message.includes("connection")
        ) {
          return c.json<ErrorResponse>(
            {
              success: false,
              message: "Database connection error",
            },
            503
          );
        }
      }

      // Generic server error
      return c.json<ErrorResponse>(
        {
          success: false,
          message: "Internal server error",
        },
        500
      );
    }
  }
);

// Additional endpoint to get user creation schema (useful for frontend form generation)
app.get("/users/schema", (c) => {
  return c.json({
    success: true,
    message: "User creation schema retrieved successfully",
    data: {
      enums: {
        role: ["admin", "participant"],
        gender: ["male", "female"],
        religion: [
          "islam",
          "kristen",
          "katolik",
          "hindu",
          "buddha",
          "konghucu",
          "other",
        ],
        education: ["sd", "smp", "sma", "diploma", "s1", "s2", "s3", "other"],
      },
    },
  });
});

export { app as userRoutes };
export type { CreateUserRequest, CreateUserResponse, ErrorResponse };
