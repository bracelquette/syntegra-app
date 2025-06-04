import { Context } from "hono";
import { eq, and, count, sql, desc, gte, lte } from "drizzle-orm";
import {
  getDbFromEnv,
  users,
  testAttempts,
  tests,
  testSessions,
  sessionParticipants,
  sessionModules,
  auditLogs,
} from "@/db";
import { type CloudflareBindings } from "@/lib/env";
import {
  type GetParticipantDashboardResponse,
  type DashboardErrorResponse,
  type GetParticipantDashboardQuery,
  type ProfileCompletion,
  type ParticipantTestSummary,
  type ParticipantSessionSummary,
  type UpcomingSession,
  type ParticipantRecentActivity,
  calculateProfileCompletion,
  formatActivityForDisplay,
  QUICK_ACTIONS,
  DASHBOARD_LIMITS,
} from "shared-types";

export async function getParticipantDashboardHandler(
  c: Context<{ Bindings: CloudflareBindings; Variables: { user: any } }>
): Promise<Response> {
  try {
    const db = getDbFromEnv(c.env);
    const user = c.var.user; // From auth middleware
    const rawQuery = c.req.query();

    // Validate that user is a participant
    if (user.role !== "participant") {
      const errorResponse: DashboardErrorResponse = {
        success: false,
        message: "Access denied. Participant access required.",
        errors: [
          {
            field: "user_role",
            message: "Only participants can access participant dashboard",
            code: "FORBIDDEN",
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 403);
    }

    const queryParams: GetParticipantDashboardQuery = {
      include_upcoming_sessions: rawQuery.include_upcoming_sessions !== "false",
      include_profile_completion:
        rawQuery.include_profile_completion !== "false",
      include_recent_activity: rawQuery.include_recent_activity !== "false",
    };

    // Get full user data for profile completion calculation
    const [fullUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!fullUser) {
      const errorResponse: DashboardErrorResponse = {
        success: false,
        message: "User not found",
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 404);
    }

    // Calculate profile completion
    let profileCompletion: ProfileCompletion | null = null;
    if (queryParams.include_profile_completion) {
      profileCompletion = calculateProfileCompletion(fullUser);
    }

    // Get test summary statistics (NO SCORES/RESULTS)
    const testSummary = await getParticipantTestSummary(db, user.id);

    // Get session summary
    const sessionSummary = await getParticipantSessionSummary(db, user.id);

    // Get upcoming sessions
    let upcomingSessions: UpcomingSession[] = [];
    if (queryParams.include_upcoming_sessions) {
      upcomingSessions = await getUpcomingSessions(db, user.id);
    }

    // Get recent activity
    let recentActivity: ParticipantRecentActivity[] = [];
    if (queryParams.include_recent_activity) {
      recentActivity = await getParticipantRecentActivity(db, user.id);
    }

    // Determine quick actions based on profile completion and test status
    const quickActions = [];
    if (profileCompletion && profileCompletion.completion_percentage < 80) {
      quickActions.push(QUICK_ACTIONS.PARTICIPANT[0]); // Complete profile
    }
    if (upcomingSessions.length > 0) {
      quickActions.push(QUICK_ACTIONS.PARTICIPANT[1]); // View schedule
    }
    quickActions.push(QUICK_ACTIONS.PARTICIPANT[2]); // Test guide

    const response: GetParticipantDashboardResponse = {
      success: true,
      message: "Participant dashboard data retrieved successfully",
      data: {
        user: {
          id: fullUser.id,
          name: fullUser.name,
          email: fullUser.email,
          nik: fullUser.nik,
          role: fullUser.role,
          last_login: fullUser.last_login?.toISOString() || null,
          profile_picture_url: fullUser.profile_picture_url,
        },
        profile_completion: profileCompletion || {
          completion_percentage: 0,
          total_fields: 0,
          completed_fields: 0,
          missing_fields: [],
          suggestions: [],
        },
        test_summary: testSummary,
        session_summary: sessionSummary,
        upcoming_sessions: upcomingSessions,
        recent_activity: recentActivity,
        quick_actions: quickActions,
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 200);
  } catch (error) {
    console.error("Error getting participant dashboard:", error);

    const errorResponse: DashboardErrorResponse = {
      success: false,
      message: "Failed to retrieve participant dashboard data",
      errors: [
        {
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          code: "INTERNAL_ERROR",
        },
      ],
      timestamp: new Date().toISOString(),
    };

    return c.json(errorResponse, 500);
  }
}

// Helper function to get participant test summary (NO SCORES/RESULTS)
async function getParticipantTestSummary(
  db: any,
  userId: string
): Promise<ParticipantTestSummary> {
  // Get all active tests
  const [totalActiveTests] = await db
    .select({ count: count() })
    .from(tests)
    .where(eq(tests.status, "active"));

  // Get user's attempts
  const userAttempts = await db
    .select({
      test_id: testAttempts.test_id,
      status: testAttempts.status,
      time_spent: testAttempts.time_spent,
      start_time: testAttempts.start_time,
      end_time: testAttempts.end_time,
    })
    .from(testAttempts)
    .where(eq(testAttempts.user_id, userId));

  // Calculate test statistics
  const completedTests = userAttempts.filter(
    (attempt: any) => attempt.status === "completed"
  ).length;

  const inProgressTests = userAttempts.filter(
    (attempt: any) =>
      attempt.status === "started" || attempt.status === "in_progress"
  ).length;

  const expiredTests = userAttempts.filter(
    (attempt: any) => attempt.status === "expired"
  ).length;

  const uniqueTestsAttempted = new Set(userAttempts.map((a: any) => a.test_id))
    .size;
  const availableTests = totalActiveTests.count;
  const notStartedTests = Math.max(0, availableTests - uniqueTestsAttempted);

  // Calculate time spent (in minutes)
  const totalTimeSpent = Math.round(
    userAttempts.reduce(
      (sum: any, attempt: any) => sum + (attempt.time_spent || 0),
      0
    ) / 60
  );

  const averageTimePerTest =
    completedTests > 0 ? Math.round(totalTimeSpent / completedTests) : 0;

  const completionRate =
    availableTests > 0
      ? Math.round((completedTests / availableTests) * 100)
      : 0;

  return {
    total_tests: availableTests,
    available_tests: availableTests,
    completed_tests: completedTests,
    in_progress_tests: inProgressTests,
    not_started_tests: notStartedTests,
    expired_tests: expiredTests,
    total_time_spent_minutes: totalTimeSpent,
    average_time_per_test_minutes: averageTimePerTest,
    completion_rate_percentage: completionRate,
  };
}

// Helper function to get participant session summary
async function getParticipantSessionSummary(
  db: any,
  userId: string
): Promise<ParticipantSessionSummary> {
  // Get sessions the user is part of
  const userSessions = await db
    .select({
      session_id: sessionParticipants.session_id,
      status: sessionParticipants.status,
      session: testSessions,
    })
    .from(sessionParticipants)
    .leftJoin(testSessions, eq(sessionParticipants.session_id, testSessions.id))
    .where(eq(sessionParticipants.user_id, userId));

  const now = new Date();

  const totalSessions = userSessions.length;

  const activeSessions = userSessions.filter(
    (item: any) =>
      item.session &&
      item.session.status === "active" &&
      now >= item.session.start_time &&
      now <= item.session.end_time
  ).length;

  const completedSessions = userSessions.filter(
    (item: any) =>
      item.session &&
      (item.session.status === "completed" || now > item.session.end_time)
  ).length;

  const upcomingSessions = userSessions.filter(
    (item: any) =>
      item.session &&
      item.session.status === "active" &&
      now < item.session.start_time
  ).length;

  const expiredSessions = userSessions.filter(
    (item: any) =>
      item.session &&
      (item.session.status === "expired" ||
        (item.session.status === "active" && now > item.session.end_time))
  ).length;

  return {
    total_sessions: totalSessions,
    active_sessions: activeSessions,
    completed_sessions: completedSessions,
    upcoming_sessions: upcomingSessions,
    expired_sessions: expiredSessions,
  };
}

// Helper function to get upcoming sessions
async function getUpcomingSessions(
  db: any,
  userId: string
): Promise<UpcomingSession[]> {
  const now = new Date();

  const upcomingSessionsData = await db
    .select({
      session: testSessions,
      participant: sessionParticipants,
    })
    .from(sessionParticipants)
    .leftJoin(testSessions, eq(sessionParticipants.session_id, testSessions.id))
    .where(
      and(
        eq(sessionParticipants.user_id, userId),
        eq(testSessions.status, "active"),
        gte(testSessions.start_time, now)
      )
    )
    .orderBy(testSessions.start_time)
    .limit(DASHBOARD_LIMITS.UPCOMING_SESSIONS);

  // Get test count for each session
  const sessionIds = upcomingSessionsData.map((item: any) => item.session.id);
  const sessionTestCounts = await Promise.all(
    sessionIds.map(async (sessionId: any) => {
      const [testCount] = await db
        .select({ count: count() })
        .from(sessionModules)
        .where(eq(sessionModules.session_id, sessionId));
      return { sessionId, count: testCount.count };
    })
  );

  const sessions: UpcomingSession[] = upcomingSessionsData.map((item: any) => {
    const session = item.session;
    const testCount =
      sessionTestCounts.find((tc: any) => tc.sessionId === session.id)?.count ||
      0;

    // Estimate duration based on test count (rough estimate)
    const estimatedDuration = testCount * 60; // 60 minutes per test

    // Check if user can access the session
    const canAccess =
      now >= new Date(session.start_time.getTime() - 30 * 60 * 1000) && // 30 minutes before
      now <= session.end_time;

    const accessUrl = canAccess ? `/test/${session.session_code}` : null;

    return {
      id: session.id,
      session_name: session.session_name,
      session_code: session.session_code,
      start_time: session.start_time.toISOString(),
      end_time: session.end_time.toISOString(),
      target_position: session.target_position,
      location: session.location,
      test_count: testCount,
      estimated_duration_minutes: estimatedDuration,
      status: session.status,
      can_access: canAccess,
      access_url: accessUrl,
    };
  });

  return sessions;
}

// Helper function to get participant recent activity
async function getParticipantRecentActivity(
  db: any,
  userId: string
): Promise<ParticipantRecentActivity[]> {
  // Get recent audit logs for the user
  const recentLogs = await db
    .select({
      action: auditLogs.action,
      entity: auditLogs.entity,
      created_at: auditLogs.created_at,
      new_values: auditLogs.new_values,
    })
    .from(auditLogs)
    .where(eq(auditLogs.user_id, userId))
    .orderBy(desc(auditLogs.created_at))
    .limit(DASHBOARD_LIMITS.RECENT_ACTIVITY);

  // Also get recent test attempts
  const recentAttempts = await db
    .select({
      id: testAttempts.id,
      status: testAttempts.status,
      start_time: testAttempts.start_time,
      test: tests,
    })
    .from(testAttempts)
    .leftJoin(tests, eq(testAttempts.test_id, tests.id))
    .where(eq(testAttempts.user_id, userId))
    .orderBy(desc(testAttempts.start_time))
    .limit(5);

  const activities: ParticipantRecentActivity[] = [];

  // Add test activities
  recentAttempts.forEach((attempt: any) => {
    if (!attempt.test) return;

    const activityType =
      attempt.status === "completed" ? "test_completed" : "test_started";

    const { title, description } = formatActivityForDisplay(activityType, {
      test_name: attempt.test.name,
    });

    activities.push({
      type: activityType,
      title,
      description,
      timestamp: attempt.start_time.toISOString(),
      metadata: {
        test_id: attempt.test.id,
        test_name: attempt.test.name,
        attempt_id: attempt.id,
      },
    });
  });

  // Add audit log activities (login, etc.)
  recentLogs.forEach((log: any) => {
    if (log.action === "login" || log.action === "authenticate") {
      const { title, description } = formatActivityForDisplay("login");

      activities.push({
        type: "login",
        title,
        description,
        timestamp: log.created_at.toISOString(),
        metadata: {},
      });
    }
  });

  // Sort by timestamp and limit
  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, DASHBOARD_LIMITS.RECENT_ACTIVITY);
}
