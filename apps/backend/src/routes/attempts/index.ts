import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CloudflareBindings } from "@/lib/env";
import {
  StartTestAttemptRequestSchema,
  GetAttemptByIdRequestSchema,
  UpdateAttemptByIdRequestSchema,
  UpdateTestAttemptRequestSchema,
  FinishAttemptByIdRequestSchema,
  FinishTestAttemptRequestSchema,
  type AttemptErrorResponse,
} from "shared-types";
import { startTestAttemptHandler } from "./attempt.start";
import { getTestAttemptHandler } from "./attempt.get";
import { updateTestAttemptHandler } from "./attempt.update";
import { finishTestAttemptHandler } from "./attempt.finish";
import { authenticateUser, requireParticipant } from "@/middleware/auth";
import { generalApiRateLimit } from "@/middleware/rateLimiter";

const attemptRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== TEST ATTEMPT ROUTES (Participant only) ====================

// Start Test Attempt
attemptRoutes.post(
  "/start",
  generalApiRateLimit,
  authenticateUser,
  requireParticipant, // Custom middleware to ensure user is participant
  zValidator("json", StartTestAttemptRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: AttemptErrorResponse = {
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
  startTestAttemptHandler
);

// Get Test Attempt Details
attemptRoutes.get(
  "/:attemptId",
  generalApiRateLimit,
  authenticateUser,
  requireParticipant,
  zValidator("param", GetAttemptByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: AttemptErrorResponse = {
        success: false,
        message: "Invalid attempt ID parameter",
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
  getTestAttemptHandler
);

// Update Test Attempt (pause/resume, progress update)
attemptRoutes.put(
  "/:attemptId",
  generalApiRateLimit,
  authenticateUser,
  requireParticipant,
  zValidator("param", UpdateAttemptByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: AttemptErrorResponse = {
        success: false,
        message: "Invalid attempt ID parameter",
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
  zValidator("json", UpdateTestAttemptRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: AttemptErrorResponse = {
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
  updateTestAttemptHandler
);

// Finish Test Attempt
attemptRoutes.post(
  "/:attemptId/finish",
  generalApiRateLimit,
  authenticateUser,
  requireParticipant,
  zValidator("param", FinishAttemptByIdRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: AttemptErrorResponse = {
        success: false,
        message: "Invalid attempt ID parameter",
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
  zValidator("json", FinishTestAttemptRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: AttemptErrorResponse = {
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
  finishTestAttemptHandler
);

// ==================== UTILITY ROUTES ====================

// Get Attempt Status Labels (for frontend)
attemptRoutes.get(
  "/utils/status-options",
  generalApiRateLimit,
  authenticateUser,
  requireParticipant,
  async (c) => {
    try {
      const { ATTEMPT_STATUS_LABELS, ATTEMPT_STATUS_COLORS } = await import(
        "shared-types"
      );

      const response = {
        success: true,
        message: "Attempt status options retrieved successfully",
        data: {
          statuses: Object.entries(ATTEMPT_STATUS_LABELS).map(
            ([value, label]) => ({
              value,
              label,
              color:
                ATTEMPT_STATUS_COLORS[
                  value as keyof typeof ATTEMPT_STATUS_COLORS
                ],
            })
          ),
        },
        timestamp: new Date().toISOString(),
      };

      return c.json(response, 200);
    } catch (error) {
      console.error("Error getting attempt status options:", error);
      const errorResponse: AttemptErrorResponse = {
        success: false,
        message: "Failed to retrieve status options",
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 500);
    }
  }
);

// ==================== ERROR HANDLERS ====================
attemptRoutes.onError((err, c) => {
  console.error("Test attempt routes error:", err);

  const errorResponse: AttemptErrorResponse = {
    success: false,
    message: "Test attempt route error",
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

export { attemptRoutes };
