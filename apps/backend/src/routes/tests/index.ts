import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CloudflareBindings } from "../../lib/env";
import {
  GetTestsRequestSchema,
  GetTestByIdRequestSchema,
  type TestErrorResponse,
} from "shared-types";
import { getTestsListHandler } from "./test.list";
import { getTestByIdHandler } from "./test.get";
import { getTestStatsHandler } from "./test.stats";
import { authenticateUser, requireAdmin } from "../../middleware/auth";
import { generalApiRateLimit } from "../../middleware/rateLimiter";

const testRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== PROTECTED ROUTES (Admin Only) ====================

// Get All Tests Endpoint (ADMIN ONLY)
testRoutes.get(
  "/",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // Second: Verify user is admin (participants will get 403 Forbidden)
  zValidator("query", GetTestsRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: TestErrorResponse = {
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
  getTestsListHandler
);

// Get Single Test (ADMIN ONLY)
testRoutes.get(
  "/:testId",
  generalApiRateLimit, // General rate limiting
  authenticateUser, // First: Verify user is authenticated
  requireAdmin, // Second: Verify user is admin
  zValidator("param", GetTestByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: TestErrorResponse = {
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
  getTestByIdHandler
);

// ==================== STATISTICS ROUTES (Admin only) ====================

// Get Test Statistics
testRoutes.get(
  "/stats/summary",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  getTestStatsHandler
);

// ==================== UTILITY ROUTES (Admin only) ====================

// Get Test Filter Options (for frontend dropdowns)
testRoutes.get(
  "/filters/options",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  async (c) => {
    try {
      // Import here to avoid circular dependencies
      const {
        TEST_MODULE_TYPE_LABELS,
        TEST_CATEGORY_LABELS,
        TEST_STATUS_LABELS,
      } = await import("shared-types");

      const filterOptions = {
        success: true,
        message: "Filter options retrieved successfully",
        data: {
          module_types: Object.entries(TEST_MODULE_TYPE_LABELS).map(
            ([value, label]) => ({
              value,
              label,
            })
          ),
          categories: Object.entries(TEST_CATEGORY_LABELS).map(
            ([value, label]) => ({
              value,
              label,
            })
          ),
          statuses: Object.entries(TEST_STATUS_LABELS).map(
            ([value, label]) => ({
              value,
              label,
            })
          ),
        },
        timestamp: new Date().toISOString(),
      };

      return c.json(filterOptions, 200);
    } catch (error) {
      console.error("Error getting filter options:", error);
      const errorResponse: TestErrorResponse = {
        success: false,
        message: "Failed to retrieve filter options",
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 500);
    }
  }
);

// ==================== FUTURE ROUTES (Placeholder) ====================

// Create Test (Admin only) - Future implementation
testRoutes.post(
  "/",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  async (c) => {
    const errorResponse: TestErrorResponse = {
      success: false,
      message: "Test creation not implemented yet",
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 501);
  }
);

// Update Test (Admin only) - Future implementation
testRoutes.put(
  "/:testId",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  async (c) => {
    const errorResponse: TestErrorResponse = {
      success: false,
      message: "Test update not implemented yet",
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 501);
  }
);

// Delete Test (Admin only) - Future implementation
testRoutes.delete(
  "/:testId",
  generalApiRateLimit,
  authenticateUser,
  requireAdmin,
  async (c) => {
    const errorResponse: TestErrorResponse = {
      success: false,
      message: "Test deletion not implemented yet",
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 501);
  }
);

// ==================== ERROR HANDLERS ====================
testRoutes.onError((err, c) => {
  console.error("Test routes error:", err);

  const errorResponse: TestErrorResponse = {
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
