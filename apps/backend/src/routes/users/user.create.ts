import { Context } from "hono";
import { eq, or } from "drizzle-orm";
import { getDbFromEnv, users, isDatabaseConfigured } from "../../db";
import { getEnv, type CloudflareBindings } from "../../lib/env";
import { hashPassword, requiresPassword } from "../../lib/auth";
import {
  type CreateUserRequest,
  type CreateUserResponse,
  type ErrorResponse,
  type CreateUserDB,
} from "shared-types";

export async function createUserHandler(
  c: Context<{ Bindings: CloudflareBindings }>
) {
  try {
    // Check if database is configured first
    if (!isDatabaseConfigured(c.env)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Database not configured",
        errors: [
          {
            field: "database",
            message:
              "DATABASE_URL is not configured. Please set your Neon database connection string in wrangler.jsonc",
            code: "DATABASE_NOT_CONFIGURED",
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 503);
    }

    // Get validated data from request
    const data = (await c.req.json()) as CreateUserRequest & {
      password?: string;
    };

    // Check if user is authenticated (admin) or self-registering
    const auth = c.get("auth");
    const isAdminCreation = auth && auth.user.role === "admin";
    const isSelfRegistration = !auth;

    // Get database connection
    const env = getEnv(c);
    const db = getDbFromEnv(c.env);

    // Validation logic based on creation type
    if (isAdminCreation) {
      // Admin creating user - can create both admin and participant
      console.log(
        `Admin ${auth.user.email} creating user with role: ${data.role}`
      );

      if (data.role === "admin") {
        // Admin creating another admin - password required
        if (!data.password) {
          const errorResponse: ErrorResponse = {
            success: false,
            message: "Password is required for admin users",
            errors: [
              {
                field: "password",
                message: "Admin users must have a password",
                code: "PASSWORD_REQUIRED",
              },
            ],
            timestamp: new Date().toISOString(),
          };
          return c.json(errorResponse, 400);
        }

        // Validate password strength
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (data.password.length < 8 || !passwordRegex.test(data.password)) {
          const errorResponse: ErrorResponse = {
            success: false,
            message: "Password does not meet requirements",
            errors: [
              {
                field: "password",
                message:
                  "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
                code: "PASSWORD_TOO_WEAK",
              },
            ],
            timestamp: new Date().toISOString(),
          };
          return c.json(errorResponse, 400);
        }
      } else if (data.password) {
        // Admin creating participant with password - not allowed
        const errorResponse: ErrorResponse = {
          success: false,
          message: "Participants cannot have passwords",
          errors: [
            {
              field: "password",
              message:
                "Participant users authenticate using NIK and email only",
              code: "PASSWORD_NOT_ALLOWED",
            },
          ],
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 400);
      }
    } else if (isSelfRegistration) {
      // Self-registration - only allow participant role
      if (data.role === "admin") {
        const errorResponse: ErrorResponse = {
          success: false,
          message: "Cannot self-register as admin",
          errors: [
            {
              field: "role",
              message: "Self-registration is only allowed for participant role",
              code: "INVALID_ROLE_FOR_SELF_REGISTRATION",
            },
          ],
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 400);
      }

      if (data.password) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: "Password not allowed for participant registration",
          errors: [
            {
              field: "password",
              message: "Participants authenticate using NIK and email only",
              code: "PASSWORD_NOT_ALLOWED",
            },
          ],
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 400);
      }

      // Force role to participant for self-registration
      data.role = "participant";
      console.log(`Self-registration for participant: ${data.email}`);
    }

    // Check if NIK or email already exists
    const existingUser = await db
      .select({
        nik: users.nik,
        email: users.email,
      })
      .from(users)
      .where(or(eq(users.nik, data.nik), eq(users.email, data.email)))
      .limit(1);

    if (existingUser.length > 0) {
      const conflictField = existingUser[0].nik === data.nik ? "NIK" : "email";
      const errorResponse: ErrorResponse = {
        success: false,
        message: `User with this ${conflictField} already exists`,
        errors: [
          {
            field: conflictField.toLowerCase(),
            message: `${conflictField} is already taken`,
            code: "UNIQUE_CONSTRAINT",
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 409);
    }

    // Hash password if provided (for admin users only)
    let hashedPassword: string | null = null;
    if (data.password && data.role === "admin") {
      hashedPassword = await hashPassword(data.password);
    }

    // Prepare data for database insertion
    const insertData: CreateUserDB & { password?: string | null } = {
      nik: data.nik,
      name: data.name,
      role: data.role,
      email: data.email,
      password: hashedPassword,
      gender: data.gender,
      phone: data.phone,
      birth_place: data.birth_place || null,
      birth_date: data.birth_date ? new Date(data.birth_date) : null,
      religion: data.religion || null,
      education: data.education || null,
      address: data.address || null,
      province: data.province || null,
      regency: data.regency || null,
      district: data.district || null,
      village: data.village || null,
      postal_code: data.postal_code || null,
      profile_picture_url: data.profile_picture_url || null,
      created_by: isAdminCreation ? auth.user.id : null,
      updated_by: isAdminCreation ? auth.user.id : null,
      is_active: true,
      email_verified: data.role === "admin", // Admin accounts are pre-verified
      login_attempts: 0,
    };

    // Insert user into database
    const [newUser] = await db.insert(users).values(insertData).returning();

    if (!newUser) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Failed to create user",
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 500);
    }

    // Prepare success response (exclude sensitive data)
    const responseData = {
      id: newUser.id,
      nik: newUser.nik,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      gender: newUser.gender,
      phone: newUser.phone,
      birth_place: newUser.birth_place,
      birth_date: newUser.birth_date,
      religion: newUser.religion,
      education: newUser.education,
      address: newUser.address,
      province: newUser.province,
      regency: newUser.regency,
      district: newUser.district,
      village: newUser.village,
      postal_code: newUser.postal_code,
      profile_picture_url: newUser.profile_picture_url,
      is_active: newUser.is_active ?? true,
      email_verified: newUser.email_verified ?? false,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      created_by: newUser.created_by,
      updated_by: newUser.updated_by,
    };

    const creationType = isAdminCreation
      ? "Admin creation"
      : "Self-registration";
    const response: CreateUserResponse = {
      success: true,
      message: `${creationType}: ${data.role === "admin" ? "Admin" : "Participant"} user created successfully`,
      data: responseData,
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 201);
  } catch (error) {
    console.error("Error creating user:", error);

    // Get environment for error handling
    const env = getEnv(c);

    // Handle specific database errors
    if (error instanceof Error) {
      // Handle unique constraint violations
      if (error.message.includes("unique constraint")) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: "User with this NIK or email already exists",
          errors: [
            {
              message: "Unique constraint violation",
              code: "UNIQUE_CONSTRAINT",
            },
          ],
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 409);
      }

      // Handle database connection errors
      if (
        error.message.includes("database") ||
        error.message.includes("connection")
      ) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: "Database connection error",
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 503);
      }

      // Handle password hashing errors
      if (
        error.message.includes("hash") ||
        error.message.includes("password")
      ) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: "Failed to process password",
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 500);
      }
    }

    // Generic error response
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Internal server error",
      ...(env.NODE_ENV === "development" && {
        errors: [
          {
            message: error instanceof Error ? error.message : "Unknown error",
            code: "INTERNAL_ERROR",
          },
        ],
      }),
      timestamp: new Date().toISOString(),
    };

    return c.json(errorResponse, 500);
  }
}
