import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CloudflareBindings } from "../../lib/env";
import {
  CreateTestRequestSchema,
  GetTestsRequestSchema,
  GetTestByIdRequestSchema,
  UpdateTestRequestSchema,
  UpdateTestByIdRequestSchema,
  DeleteTestByIdRequestSchema,
  type ErrorResponse,
} from "shared-types";
import { createTestHandler } from "./test.create";
import { getTestSchemaHandler } from "./test.schema";
import {
  authenticateUser,
  requireAdmin,
  requireRole,
} from "../../middleware/auth";
import { generalApiRateLimit } from "../../middleware/rateLimiter";

const testRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== PUBLIC ROUTES ====================

// Get Test Schema Endpoint (public for documentation)
testRoutes.get(
  "/schema",
  generalApiRateLimit, // General rate limiting
  getTestSchemaHandler
);

// ==================== PROTECTED ROUTES ====================

// Create Test Endpoint (ADMIN ONLY)
testRoutes.post(
  "/",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // Second: Verify user is admin
  zValidator("json", CreateTestRequestSchema, (result, c) => {
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
  createTestHandler
);

// Get All Tests Endpoint (ADMIN ONLY for now)
testRoutes.get(
  "/",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // Second: Verify user is admin (participants may get limited access later)
  zValidator("query", GetTestsRequestSchema, (result, c) => {
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
  async (c) => {
    // Placeholder for get tests list handler
    return c.json(
      {
        success: false,
        message: "Get tests list not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// ==================== INDIVIDUAL TEST ROUTES ====================

// Get Single Test (Admin can access any test, participants might get limited access later)
testRoutes.get(
  "/:testId",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // For now admin only, will expand to participants with restrictions later
  zValidator("param", GetTestByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid test ID parameter",
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
  async (c) => {
    // Placeholder for get test by ID handler
    return c.json(
      {
        success: false,
        message: "Get test by ID not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// Update Test (Admin only)
testRoutes.put(
  "/:testId",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // Only admin can update tests
  zValidator("param", UpdateTestByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid test ID parameter",
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
  zValidator("json", UpdateTestRequestSchema, (result, c) => {
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
  async (c) => {
    // Placeholder for update test handler
    return c.json(
      {
        success: false,
        message: "Update test not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// Delete Test (Admin only) - SOFT DELETE IMPLEMENTATION
testRoutes.delete(
  "/:testId",
  generalApiRateLimit, // General rate limiting
  authenticateUser,
  requireAdmin, // Only admin can delete tests
  zValidator("param", DeleteTestByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid test ID parameter",
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
  async (c) => {
    // Placeholder for delete test handler
    return c.json(
      {
        success: false,
        message: "Delete test not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// ==================== TEST STATISTICS (Admin only) ====================

// Get Test Statistics
testRoutes.get(
  "/stats/summary",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  async (c) => {
    // Placeholder implementation for test statistics
    return c.json(
      {
        success: false,
        message: "Test statistics not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// Get Test Analytics by ID
testRoutes.get(
  "/:testId/analytics",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  zValidator("param", GetTestByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid test ID parameter",
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
  async (c) => {
    // Placeholder for test analytics handler
    return c.json(
      {
        success: false,
        message: "Test analytics not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// ==================== TEST CATEGORIES & MODULE TYPES ====================

// Get Available Categories by Module Type
testRoutes.get(
  "/categories/:moduleType",
  generalApiRateLimit,
  authenticateUser,
  requireRole("admin", "participant"), // Both can access this for reference
  async (c) => {
    // This will be implemented when needed for frontend forms
    return c.json(
      {
        success: false,
        message: "Get categories by module type not implemented yet",
        timestamp: new Date().toISOString(),
      },
      501
    );
  }
);

// ==================== ERROR HANDLERS ====================
testRoutes.onError((err, c) => {
  console.error("Test routes error:", err);

  const errorResponse: ErrorResponse = {
    success: false,
    message: "Test route error",
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

export { testRoutes };
