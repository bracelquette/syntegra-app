import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CloudflareBindings } from "../../lib/env";
import {
  AdminLoginRequestSchema,
  ParticipantLoginRequestSchema,
  RefreshTokenRequestSchema,
  ChangePasswordRequestSchema,
  LogoutRequestSchema,
  type ErrorResponse,
} from "shared-types";
import {
  adminLoginHandler,
  participantLoginHandler,
  refreshTokenHandler,
  logoutHandler,
  getProfileHandler,
  changePasswordHandler,
} from "./auth.handlers";
import { authenticateUser, requireAdmin } from "../../middleware/auth";

const authRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================

// Admin Login Endpoint
authRoutes.post(
  "/admin/login",
  zValidator("json", AdminLoginRequestSchema, (result, c) => {
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
  adminLoginHandler
);

// Participant Login Endpoint
authRoutes.post(
  "/participant/login",
  zValidator("json", ParticipantLoginRequestSchema, (result, c) => {
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
  participantLoginHandler
);

// Refresh Token Endpoint
authRoutes.post(
  "/refresh",
  zValidator("json", RefreshTokenRequestSchema, (result, c) => {
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
  refreshTokenHandler
);

// ==================== PROTECTED ROUTES (AUTH REQUIRED) ====================

// Get Current User Profile
authRoutes.get("/me", authenticateUser, getProfileHandler);

// Logout (current session)
authRoutes.post(
  "/logout",
  authenticateUser,
  zValidator("json", LogoutRequestSchema.optional(), (result, c) => {
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
  logoutHandler
);

// Change Password (Admin only)
authRoutes.put(
  "/change-password",
  authenticateUser,
  requireAdmin,
  zValidator("json", ChangePasswordRequestSchema, (result, c) => {
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
  changePasswordHandler
);

// ==================== UTILITY ROUTES ====================

// Health check for auth service
authRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Authentication service is healthy",
    timestamp: new Date().toISOString(),
    endpoints: {
      admin_login: "POST /auth/admin/login",
      participant_login: "POST /auth/participant/login",
      refresh_token: "POST /auth/refresh",
      profile: "GET /auth/me",
      logout: "POST /auth/logout",
      change_password: "PUT /auth/change-password",
    },
  });
});

// ==================== ERROR HANDLERS ====================
authRoutes.onError((err, c) => {
  console.error("Auth routes error:", err);

  const errorResponse: ErrorResponse = {
    success: false,
    message: "Authentication error",
    ...(c.env.NODE_ENV === "development" && {
      errors: [
        {
          message: err.message,
          code: "AUTH_ROUTE_ERROR",
        },
      ],
    }),
    timestamp: new Date().toISOString(),
  };

  return c.json(errorResponse, 500);
});

export { authRoutes };
