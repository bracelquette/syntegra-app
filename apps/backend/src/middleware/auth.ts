import { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import {
  verifyToken,
  validateSession,
  updateSessionLastUsed,
  toAuthUserData,
} from "../lib/auth";
import { getDbFromEnv, users, isDatabaseConfigured } from "../db";
import { getEnv, type CloudflareBindings } from "../lib/env";
import {
  type ErrorResponse,
  type AuthContext,
  type JWTPayload,
  AUTH_ERROR_CODES,
} from "shared-types";

// Extend Hono Context untuk include auth data
declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

// ==================== AUTHENTICATION MIDDLEWARE ====================

/**
 * Middleware untuk authenticate user berdasarkan JWT token
 */
export async function authenticateUser(
  c: Context<{ Bindings: CloudflareBindings }>,
  next: Next
) {
  try {
    // Check database configuration
    if (!isDatabaseConfigured(c.env)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Database not configured",
        errors: [
          {
            field: "database",
            message: "DATABASE_URL is not configured",
            code: "DATABASE_NOT_CONFIGURED",
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 503);
    }

    // Get authorization header
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Authentication required",
        errors: [
          {
            field: "authorization",
            message: "Bearer token is required",
            code: AUTH_ERROR_CODES.UNAUTHORIZED,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Get environment and database
    const env = getEnv(c);
    const db = getDbFromEnv(c.env);

    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    // Verify JWT token
    let payload: JWTPayload;
    try {
      payload = verifyToken(token, env.JWT_SECRET);
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid token",
        errors: [
          {
            field: "token",
            message: "Token is invalid or expired",
            code: AUTH_ERROR_CODES.INVALID_TOKEN,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    // Validate session in database
    const isValidSession = await validateSession(db, payload.session_id);
    if (!isValidSession) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Session not found or expired",
        errors: [
          {
            field: "session",
            message: "Session is invalid or has expired",
            code: AUTH_ERROR_CODES.SESSION_NOT_FOUND,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    // Get user data from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "User not found",
        errors: [
          {
            field: "user",
            message: "User associated with token not found",
            code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    // Check if user is active
    if (!user.is_active) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Account is inactive",
        errors: [
          {
            field: "account",
            message: "Your account has been deactivated",
            code: AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    // Update session last used (non-blocking)
    updateSessionLastUsed(db, payload.session_id).catch(console.error);

    // Set auth context
    const authContext: AuthContext = {
      user: toAuthUserData(user),
      session_id: payload.session_id,
    };

    c.set("auth", authContext);
    await next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    const errorResponse: ErrorResponse = {
      success: false,
      message: "Authentication failed",
      errors: [
        {
          message: "Internal authentication error",
          code: "AUTH_ERROR",
        },
      ],
      timestamp: new Date().toISOString(),
    };

    return c.json(errorResponse, 500);
  }
}

// ==================== AUTHORIZATION MIDDLEWARE ====================

/**
 * Middleware untuk authorize berdasarkan role
 */
export function requireRole(...allowedRoles: ("admin" | "participant")[]) {
  return async (c: Context<{ Bindings: CloudflareBindings }>, next: Next) => {
    const auth = c.get("auth");

    if (!auth) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Authentication required",
        errors: [
          {
            field: "authentication",
            message: "User must be authenticated to access this resource",
            code: AUTH_ERROR_CODES.UNAUTHORIZED,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    if (!allowedRoles.includes(auth.user.role)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Insufficient permissions",
        errors: [
          {
            field: "role",
            message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
            code: AUTH_ERROR_CODES.FORBIDDEN,
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 403);
    }

    await next();
  };
}

/**
 * Middleware khusus untuk admin only - PARTICIPANTS WILL GET 403 FORBIDDEN
 */
export const requireAdmin = requireRole("admin");

/**
 * Middleware khusus untuk participant only
 */
export const requireParticipant = requireRole("participant");

/**
 * Middleware untuk resource yang bisa diakses admin atau owner
 */
export function requireAdminOrOwner(
  getUserIdFromParams: (c: Context) => string
) {
  return async (c: Context<{ Bindings: CloudflareBindings }>, next: Next) => {
    const auth = c.get("auth");

    if (!auth) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Authentication required",
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 401);
    }

    // Admin bisa akses semua
    if (auth.user.role === "admin") {
      await next();
      return;
    }

    // User hanya bisa akses resource milik sendiri
    const targetUserId = getUserIdFromParams(c);
    if (auth.user.id === targetUserId) {
      await next();
      return;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message: "Access denied",
      errors: [
        {
          field: "authorization",
          message: "You can only access your own resources",
          code: AUTH_ERROR_CODES.FORBIDDEN,
        },
      ],
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 403);
  };
}

// ==================== OPTIONAL AUTHENTICATION ====================

/**
 * Middleware untuk optional authentication
 * Jika token ada dan valid, set auth context
 * Jika tidak ada atau invalid, lanjut tanpa auth
 */
export async function optionalAuth(
  c: Context<{ Bindings: CloudflareBindings }>,
  next: Next
) {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No auth provided, continue without auth
      await next();
      return;
    }

    if (!isDatabaseConfigured(c.env)) {
      // Database not configured, continue without auth
      await next();
      return;
    }

    const token = authHeader.substring(7);
    const env = getEnv(c);
    const db = getDbFromEnv(c.env);

    if (!env.JWT_SECRET) {
      await next();
      return;
    }

    try {
      const payload = verifyToken(token, env.JWT_SECRET);
      const isValidSession = await validateSession(db, payload.session_id);

      if (isValidSession) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, payload.sub))
          .limit(1);

        if (user && user.is_active) {
          const authContext: AuthContext = {
            user: toAuthUserData(user),
            session_id: payload.session_id,
          };
          c.set("auth", authContext);

          // Update session last used (non-blocking)
          updateSessionLastUsed(db, payload.session_id).catch(console.error);
        }
      }
    } catch (error) {
      // Token invalid, continue without auth
      console.warn("Optional auth failed:", error);
    }

    await next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Continue without auth on any error
    await next();
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get current authenticated user
 */
export function getCurrentUser(c: Context): AuthContext["user"] | null {
  const auth = c.get("auth");
  return auth?.user || null;
}

/**
 * Get current session ID
 */
export function getCurrentSessionId(c: Context): string | null {
  const auth = c.get("auth");
  return auth?.session_id || null;
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(c: Context): boolean {
  const user = getCurrentUser(c);
  return user?.role === "admin";
}

/**
 * Check if current user is participant
 */
export function isCurrentUserParticipant(c: Context): boolean {
  const user = getCurrentUser(c);
  return user?.role === "participant";
}

/**
 * Check if current user owns resource
 */
export function isCurrentUserOwner(c: Context, userId: string): boolean {
  const user = getCurrentUser(c);
  return user?.id === userId;
}
