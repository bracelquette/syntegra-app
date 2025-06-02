import { Context } from "hono";
import { eq, or } from "drizzle-orm";
import { getDbFromEnv, users, isDatabaseConfigured } from "../../db";
import { getEnv, type CloudflareBindings } from "../../lib/env";
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

    // Get validated data from request (sudah divalidasi di middleware)
    const data = (await c.req.json()) as CreateUserRequest;

    // Get database connection
    const env = getEnv(c);
    const db = getDbFromEnv(c.env);

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

    // Prepare data for database insertion
    const insertData: CreateUserDB = {
      nik: data.nik,
      name: data.name,
      role: data.role,
      email: data.email,
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
      created_by: data.created_by || null,
      updated_by: data.created_by || null,
      is_active: true,
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

    // Prepare success response
    const response: CreateUserResponse = {
      success: true,
      message: "User created successfully",
      data: {
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
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
        created_by: newUser.created_by,
        updated_by: newUser.updated_by,
      },
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
