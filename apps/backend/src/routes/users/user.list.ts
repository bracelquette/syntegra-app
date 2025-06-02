import { Context } from "hono";
import { and, or, eq, like, gte, lte, count, asc, desc } from "drizzle-orm";
import { getDbFromEnv, users, isDatabaseConfigured } from "../../db";
import { getEnv, type CloudflareBindings } from "../../lib/env";
import {
  type GetUsersRequest,
  type GetUsersResponse,
  type ErrorResponse,
  type PaginationMeta,
} from "shared-types";

export async function getUsersListHandler(
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

    // Get query parameters (sudah divalidasi di middleware)
    const queryParams = c.req.query() as unknown as GetUsersRequest;

    // Get database connection
    const env = getEnv(c);
    const db = getDbFromEnv(c.env);

    // Build where conditions
    const conditions = [];

    // Search functionality - search across name, email, nik
    if (queryParams.search) {
      const searchTerm = `%${queryParams.search}%`;
      conditions.push(
        or(
          like(users.name, searchTerm),
          like(users.email, searchTerm),
          like(users.nik, searchTerm),
          like(users.phone, searchTerm)
        )
      );
    }

    // Role filter
    if (queryParams.role) {
      conditions.push(eq(users.role, queryParams.role));
    }

    // Gender filter
    if (queryParams.gender) {
      conditions.push(eq(users.gender, queryParams.gender));
    }

    // Religion filter
    if (queryParams.religion) {
      conditions.push(eq(users.religion, queryParams.religion));
    }

    // Education filter
    if (queryParams.education) {
      conditions.push(eq(users.education, queryParams.education));
    }

    // Active status filter
    if (queryParams.is_active !== undefined) {
      conditions.push(eq(users.is_active, queryParams.is_active));
    }

    // Province filter
    if (queryParams.province) {
      conditions.push(eq(users.province, queryParams.province));
    }

    // Regency filter
    if (queryParams.regency) {
      conditions.push(eq(users.regency, queryParams.regency));
    }

    // Date range filters
    if (queryParams.created_from) {
      conditions.push(
        gte(users.created_at, new Date(queryParams.created_from))
      );
    }

    if (queryParams.created_to) {
      conditions.push(lte(users.created_at, new Date(queryParams.created_to)));
    }

    // Combine all conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = totalResult.count;

    // Calculate pagination
    const page = queryParams.page;
    const limit = queryParams.limit;
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Build sorting
    const validSortColumns = {
      id: users.id,
      nik: users.nik,
      name: users.name,
      email: users.email,
      role: users.role,
      gender: users.gender,
      phone: users.phone,
      created_at: users.created_at,
      updated_at: users.updated_at,
    };

    const sortColumn =
      validSortColumns[queryParams.sort_by as keyof typeof validSortColumns] ||
      users.created_at;
    const sortDirection = queryParams.sort_order === "asc" ? asc : desc;

    // Get users with pagination and sorting
    const usersList = await db
      .select({
        id: users.id,
        nik: users.nik,
        name: users.name,
        role: users.role,
        email: users.email,
        gender: users.gender,
        phone: users.phone,
        birth_place: users.birth_place,
        birth_date: users.birth_date,
        religion: users.religion,
        education: users.education,
        address: users.address,
        province: users.province,
        regency: users.regency,
        district: users.district,
        village: users.village,
        postal_code: users.postal_code,
        profile_picture_url: users.profile_picture_url,
        is_active: users.is_active,
        created_at: users.created_at,
        updated_at: users.updated_at,
        created_by: users.created_by,
        updated_by: users.updated_by,
      })
      .from(users)
      .where(whereClause)
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset(offset);

    // Prepare pagination meta
    const meta: PaginationMeta = {
      current_page: page,
      per_page: limit,
      total: total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    };

    // Prepare success response
    const response: GetUsersResponse = {
      success: true,
      message: `Successfully retrieved ${usersList.length} users`,
      data: usersList.map((user) => ({
        id: user.id,
        nik: user.nik,
        name: user.name,
        role: user.role,
        email: user.email,
        gender: user.gender,
        phone: user.phone,
        birth_place: user.birth_place,
        birth_date: user.birth_date,
        religion: user.religion,
        education: user.education,
        address: user.address,
        province: user.province,
        regency: user.regency,
        district: user.district,
        village: user.village,
        postal_code: user.postal_code,
        profile_picture_url: user.profile_picture_url,
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        updated_at: user.updated_at,
        created_by: user.created_by,
        updated_by: user.updated_by,
      })),
      meta,
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 200);
  } catch (error) {
    console.error("Error fetching users:", error);

    // Get environment for error handling
    const env = getEnv(c);

    // Handle specific database errors
    if (error instanceof Error) {
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

      // Handle invalid query errors
      if (
        error.message.includes("invalid") ||
        error.message.includes("syntax")
      ) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: "Invalid query parameters",
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 400);
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
