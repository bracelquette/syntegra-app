import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CloudflareBindings } from "../../lib/env";
import {
  CreateUserRequestSchema,
  GetUsersRequestSchema,
  type ErrorResponse,
} from "shared-types";
import { createUserHandler } from "./user.create";
import { getUsersListHandler } from "./user.list";
import { getUserSchemaHandler } from "./user.schema";
import {
  authenticateUser,
  requireAdmin,
  requireRole,
  optionalAuth,
} from "../../middleware/auth";
import {
  userRegistrationRateLimit,
  generalApiRateLimit,
  loginRateLimit,
  passwordChangeRateLimit,
} from "../../middleware/rateLimiter";

const userRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== PUBLIC ROUTES ====================

// Get User Schema Endpoint (public untuk dokumentasi)
userRoutes.get(
  "/schema",
  generalApiRateLimit, // General rate limiting
  getUserSchemaHandler
);

// Create User Endpoint (PUBLIC - untuk self-registration participant & admin creation)
userRoutes.post(
  "/",
  userRegistrationRateLimit, // 5 registrations per hour per IP
  optionalAuth, // Optional auth to detect if admin is creating user
  zValidator("json", CreateUserRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Validation failed",
        errors: result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 400);
    }
  }),
  createUserHandler
);

// ==================== PROTECTED ROUTES ====================

// Get All Users Endpoint (ADMIN ONLY - Participants NOT allowed)
userRoutes.get(
  "/",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // Second: Verify user is admin (participants will get 403 Forbidden)
  zValidator("query", GetUsersRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid query parameters",
        errors: result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 400);
    }
  }),
  getUsersListHandler
);

// ==================== INDIVIDUAL USER ROUTES ====================

// Get Single User (Admin atau user sendiri)
userRoutes.get(
  "/:userId",
  authenticateUser,
  requireRole("admin", "participant"), // Both roles can access but with restrictions
  async (c, next) => {
    // Implementation untuk get single user akan dibuat terpisah
    // Untuk sekarang return not implemented
    return c.json(
      {
        success: false,
        message: "Get single user not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// Update User (Admin atau user sendiri)
userRoutes.put(
  "/:userId",
  authenticateUser,
  requireRole("admin", "participant"), // Both roles can access but with restrictions
  async (c, next) => {
    // Implementation untuk update user akan dibuat terpisah
    // Untuk sekarang return not implemented
    return c.json(
      {
        success: false,
        message: "Update user not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// Delete User (Admin only)
userRoutes.delete(
  "/:userId",
  authenticateUser,
  requireAdmin, // Only admin can delete users
  async (c, next) => {
    // Implementation untuk delete user akan dibuat terpisah
    // Untuk sekarang return not implemented
    return c.json(
      {
        success: false,
        message: "Delete user not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// ==================== BULK OPERATIONS (Admin only) ====================

// Bulk Create Users
userRoutes.post("/bulk", authenticateUser, requireAdmin, async (c, next) => {
  // Implementation untuk bulk create akan dibuat terpisah
  return c.json(
    {
      success: false,
      message: "Bulk create users not implemented yet",
      timestamp: new Date().toISOString(),
    },
    501
  );
});

// Bulk Update Users
userRoutes.put("/bulk", authenticateUser, requireAdmin, async (c, next) => {
  // Implementation untuk bulk update akan dibuat terpisah
  return c.json(
    {
      success: false,
      message: "Bulk update users not implemented yet",
      timestamp: new Date().toISOString(),
    },
    501
  );
});

// ==================== USER STATISTICS (Admin only) ====================

// Get User Statistics
userRoutes.get(
  "/stats/summary",
  authenticateUser,
  requireAdmin,
  async (c, next) => {
    // Implementation untuk user statistics akan dibuat terpisah
    return c.json(
      {
        success: false,
        message: "User statistics not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// ==================== ERROR HANDLERS ====================
userRoutes.onError((err, c) => {
  console.error("User routes error:", err);

  const errorResponse: ErrorResponse = {
    success: false,
    message: "User route error",
    ...(c.env.NODE_ENV === "development" && {
      errors: [
        {
          message: err.message,
          code: "ROUTE_ERROR",
        },
      ],
    }),
    timestamp: new Date().toISOString(),
  };

  return c.json(errorResponse, 500);
});

export { userRoutes };
