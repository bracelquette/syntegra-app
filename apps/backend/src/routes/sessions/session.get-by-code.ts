import { Context } from "hono";
import { eq } from "drizzle-orm";
import {
  getDbFromEnv,
  testSessions,
  sessionModules,
  tests,
  isDatabaseConfigured,
} from "../../db";
import { getEnv, type CloudflareBindings } from "../../lib/env";
import {
  type GetSessionByCodeRequest,
  type GetSessionByCodeResponse,
  type SessionErrorResponse,
  isSessionActive,
  isSessionExpired,
  getTimeRemaining,
} from "shared-types";

export async function getSessionByCodeHandler(
  c: Context<{ Bindings: CloudflareBindings }>
) {
  try {
    // Check if database is configured first
    if (!isDatabaseConfigured(c.env)) {
      const errorResponse: SessionErrorResponse = {
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

    // Get path parameters (already validated by zValidator)
    const { sessionCode } = c.req.param() as GetSessionByCodeRequest;

    // Get database connection
    const env = getEnv(c);
    const db = getDbFromEnv(c.env);

    // Find session by code
    const [session] = await db
      .select({
        id: testSessions.id,
        session_name: testSessions.session_name,
        session_code: testSessions.session_code,
        start_time: testSessions.start_time,
        end_time: testSessions.end_time,
        target_position: testSessions.target_position,
        description: testSessions.description,
        location: testSessions.location,
        status: testSessions.status,
        allow_late_entry: testSessions.allow_late_entry,
        auto_expire: testSessions.auto_expire,
      })
      .from(testSessions)
      .where(eq(testSessions.session_code, sessionCode))
      .limit(1);

    // Check if session exists
    if (!session) {
      const errorResponse: SessionErrorResponse = {
        success: false,
        message: "Session not found",
        errors: [
          {
            field: "sessionCode",
            message: `Test session with code "${sessionCode}" not found`,
            code: "SESSION_NOT_FOUND",
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 404);
    }

    // Calculate session status
    const now = new Date();
    const isActive = isSessionActive({
      start_time: session.start_time,
      end_time: session.end_time,
      status: session.status || "draft",
    });
    const isExpired = isSessionExpired({
      end_time: session.end_time,
      status: session.status || "draft",
    });
    const timeRemaining = getTimeRemaining(session.end_time);

    // Check if session is accessible
    let isAccessible = false;
    let accessMessage = "";

    if (session.status === "cancelled") {
      accessMessage = "This test session has been cancelled.";
    } else if (session.status === "draft") {
      accessMessage =
        "This test session is not yet active. Please check back later.";
    } else if (isExpired) {
      accessMessage =
        "This test session has expired and is no longer available.";
    } else if (!isActive && !session.allow_late_entry) {
      if (now < session.start_time) {
        const minutesUntilStart = Math.floor(
          (session.start_time.getTime() - now.getTime()) / (1000 * 60)
        );
        if (minutesUntilStart > 60) {
          const hoursUntilStart = Math.floor(minutesUntilStart / 60);
          accessMessage = `Test session will start in ${hoursUntilStart} hour(s). Please come back at the scheduled time.`;
        } else {
          accessMessage = `Test session will start in ${minutesUntilStart} minute(s). Please come back at the scheduled time.`;
        }
      } else {
        accessMessage =
          "This test session is no longer accepting new participants.";
      }
    } else if (session.status === "active") {
      isAccessible = true;
      if (isActive) {
        const remainingHours = Math.floor(timeRemaining / 60);
        const remainingMinutes = timeRemaining % 60;
        if (remainingHours > 0) {
          accessMessage = `Test session is active. Time remaining: ${remainingHours}h ${remainingMinutes}m`;
        } else {
          accessMessage = `Test session is active. Time remaining: ${remainingMinutes} minutes`;
        }
      } else if (session.allow_late_entry && timeRemaining > 0) {
        isAccessible = true;
        accessMessage = "Late entry is allowed for this session.";
      }
    } else {
      accessMessage = "Test session is not currently available.";
    }

    // Get session modules with test details
    const sessionModulesWithTests = await db
      .select({
        module_id: sessionModules.id,
        sequence: sessionModules.sequence,
        is_required: sessionModules.is_required,
        test_id: tests.id,
        test_name: tests.name,
        test_category: tests.category,
        test_module_type: tests.module_type,
        test_time_limit: tests.time_limit,
        test_icon: tests.icon,
        test_card_color: tests.card_color,
      })
      .from(sessionModules)
      .innerJoin(tests, eq(sessionModules.test_id, tests.id))
      .where(eq(sessionModules.session_id, session.id))
      .orderBy(sessionModules.sequence);

    // Transform session modules for response
    const sessionModulesForResponse = sessionModulesWithTests.map((module) => ({
      sequence: module.sequence,
      test: {
        id: module.test_id,
        name: module.test_name,
        category: module.test_category,
        module_type: module.test_module_type,
        time_limit: module.test_time_limit,
        icon: module.test_icon,
        card_color: module.test_card_color,
      },
      is_required: module.is_required ?? true,
    }));

    // Prepare response data
    const responseData = {
      id: session.id,
      session_name: session.session_name,
      session_code: session.session_code,
      start_time: session.start_time,
      end_time: session.end_time,
      target_position: session.target_position || "",
      description: session.description,
      location: session.location,
      status: (session.status || "draft") as any,
      is_active: isAccessible,
      is_expired: isExpired,
      time_remaining: timeRemaining,
      session_modules: sessionModulesForResponse,
    };

    const response: GetSessionByCodeResponse = {
      success: true,
      message: isAccessible
        ? `Test session for ${session.target_position} is ready to start`
        : accessMessage,
      data: responseData,
      timestamp: new Date().toISOString(),
    };

    // Log session access attempt
    console.log(
      `📋 Session access attempt: ${sessionCode} (${session.session_name}) - ${isAccessible ? "ALLOWED" : "DENIED"} - ${accessMessage}`
    );

    // Return appropriate status code based on accessibility
    const statusCode = isAccessible
      ? 200
      : session.status === "cancelled"
        ? 410 // Gone
        : isExpired
          ? 410 // Gone
          : !isActive
            ? 425 // Too Early
            : 200; // Default to 200 for other cases

    return c.json(response, statusCode);
  } catch (error) {
    console.error("Error getting session by code:", error);

    // Get environment for error handling
    const env = getEnv(c);

    // Handle specific database errors
    if (error instanceof Error) {
      // Handle database connection errors
      if (
        error.message.includes("database") ||
        error.message.includes("connection")
      ) {
        const errorResponse: SessionErrorResponse = {
          success: false,
          message: "Database connection error",
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 503);
      }

      // Handle invalid session code format
      if (error.message.includes("invalid input syntax")) {
        const errorResponse: SessionErrorResponse = {
          success: false,
          message: "Invalid session code format",
          errors: [
            {
              field: "sessionCode",
              message: "Session code format is invalid",
              code: "INVALID_SESSION_CODE",
            },
          ],
          timestamp: new Date().toISOString(),
        };
        return c.json(errorResponse, 400);
      }
    }

    // Generic error response
    const errorResponse: SessionErrorResponse = {
      success: false,
      message: "Failed to retrieve session",
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
