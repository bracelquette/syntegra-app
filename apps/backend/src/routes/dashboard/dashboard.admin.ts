import { Context } from "hono";
import { eq, and, count, sql, desc, gte, lte, avg } from "drizzle-orm";
import {
  getDbFromEnv,
  users,
  testAttempts,
  tests,
  testSessions,
  sessionParticipants,
  testResults,
  auditLogs,
} from "@/db";
import { type CloudflareBindings } from "@/lib/env";
import {
  type GetAdminDashboardResponse,
  type DashboardErrorResponse,
  type GetAdminDashboardQuery,
  type SystemStats,
  type UserStats,
  type DashboardTestStats,
  type DashboardSessionStats,
  type AdminRecentActivity,
  type PerformanceMetrics,
  type TrendData,
  getDateRangeForPeriod,
  formatActivityForDisplay,
  DASHBOARD_LIMITS,
} from "shared-types";

export async function getAdminDashboardHandler(
  c: Context<{ Bindings: CloudflareBindings; Variables: { user: any } }>
): Promise<Response> {
  try {
    const db = getDbFromEnv(c.env);
    const user = c.var.user; // From auth middleware
    const rawQuery = c.req.query();

    // Validate that user is an admin
    if (user.role !== "admin") {
      const errorResponse: DashboardErrorResponse = {
        success: false,
        message: "Access denied. Admin privileges required.",
        errors: [
          {
            field: "user_role",
            message: "Only administrators can access admin dashboard",
            code: "FORBIDDEN",
          },
        ],
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, 403);
    }

    const queryParams: GetAdminDashboardQuery = {
      period: (rawQuery.period as any) || "month",
      include_activity: rawQuery.include_activity !== "false",
      include_trends: rawQuery.include_trends !== "false",
      activity_limit: Math.min(
        parseInt(rawQuery.activity_limit) || 10,
        DASHBOARD_LIMITS.RECENT_ACTIVITY
      ),
      date_from: rawQuery.date_from,
      date_to: rawQuery.date_to,
    };

    const { from, to } =
      rawQuery.date_from && rawQuery.date_to
        ? { from: new Date(rawQuery.date_from), to: new Date(rawQuery.date_to) }
        : getDateRangeForPeriod(queryParams.period);

    // Get system overview statistics
    const systemOverview = await getSystemStats(db);

    // Get user statistics for the period
    const userStatistics = await getUserStats(db, from, to);

    // Get test statistics for the period
    const testStatistics = await getTestStats(db, from, to);

    // Get session statistics for the period
    const sessionStatistics = await getSessionStats(db, from, to);

    // Get recent activity
    let recentActivity: AdminRecentActivity[] = [];
    if (queryParams.include_activity) {
      recentActivity = await getAdminRecentActivity(
        db,
        queryParams.activity_limit
      );
    }

    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics(db);

    // Get trend data
    let trendData: TrendData | undefined;
    if (queryParams.include_trends) {
      trendData = await getTrendData(db, from, to, queryParams.period);
    }

    // Generate alerts based on system state
    const alerts = await generateSystemAlerts(db, systemOverview);

    const response: GetAdminDashboardResponse = {
      success: true,
      message: "Admin dashboard data retrieved successfully",
      data: {
        system_overview: systemOverview,
        user_statistics: userStatistics,
        test_statistics: testStatistics,
        session_statistics: sessionStatistics,
        recent_activity: recentActivity,
        performance_metrics: performanceMetrics,
        trend_data: trendData,
        alerts,
      },
      period: queryParams.period,
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 200);
  } catch (error) {
    console.error("Error getting admin dashboard:", error);

    const errorResponse: DashboardErrorResponse = {
      success: false,
      message: "Failed to retrieve admin dashboard data",
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

// Helper function to get system statistics
async function getSystemStats(db: any): Promise<SystemStats> {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalUsers] = await db.select({ count: count() }).from(users);

  const [activeUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.is_active, true), gte(users.last_login, last24Hours)));

  const [newUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.created_at, last24Hours));

  const [totalSessions] = await db
    .select({ count: count() })
    .from(testSessions);

  const [activeSessions] = await db
    .select({ count: count() })
    .from(testSessions)
    .where(
      and(
        eq(testSessions.status, "active"),
        lte(testSessions.start_time, now),
        gte(testSessions.end_time, now)
      )
    );

  const [totalTests] = await db.select({ count: count() }).from(tests);

  const [activeTests] = await db
    .select({ count: count() })
    .from(tests)
    .where(eq(tests.status, "active"));

  const [totalAttempts] = await db
    .select({ count: count() })
    .from(testAttempts);

  const [completedAttempts] = await db
    .select({ count: count() })
    .from(testAttempts)
    .where(eq(testAttempts.status, "completed"));

  const [totalResults] = await db.select({ count: count() }).from(testResults);

  return {
    total_users: totalUsers.count,
    active_users: activeUsers.count,
    new_users_this_period: newUsers.count,
    total_sessions: totalSessions.count,
    active_sessions: activeSessions.count,
    total_tests: totalTests.count,
    active_tests: activeTests.count,
    total_attempts: totalAttempts.count,
    completed_attempts: completedAttempts.count,
    total_results: totalResults.count,
  };
}

// Helper function to get user statistics
async function getUserStats(db: any, from: Date, to: Date): Promise<UserStats> {
  const [totalParticipants] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "participant"));

  const [totalAdmins] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "admin"));

  const [newRegistrations] = await db
    .select({ count: count() })
    .from(users)
    .where(and(gte(users.created_at, from), lte(users.created_at, to)));

  const [activeUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        gte(users.last_login, from),
        lte(users.last_login, to),
        eq(users.is_active, true)
      )
    );

  // Get top active users
  const topActiveUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      last_activity: users.last_login,
      total_attempts: count(testAttempts.id),
    })
    .from(users)
    .leftJoin(testAttempts, eq(users.id, testAttempts.user_id))
    .where(eq(users.role, "participant"))
    .groupBy(users.id, users.name, users.email, users.last_login)
    .orderBy(desc(count(testAttempts.id)))
    .limit(DASHBOARD_LIMITS.TOP_USERS);

  // Get user growth trend (last 7 days)
  const userGrowthTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [dayCount] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(gte(users.created_at, dayStart), lte(users.created_at, dayEnd))
      );

    userGrowthTrend.push({
      date: dayStart.toISOString().split("T")[0],
      count: dayCount.count,
    });
  }

  return {
    total_participants: totalParticipants.count,
    total_admins: totalAdmins.count,
    new_registrations_this_period: newRegistrations.count,
    active_users_this_period: activeUsers.count,
    top_active_users: topActiveUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      total_attempts: user.total_attempts,
      last_activity:
        user.last_activity?.toISOString() || new Date().toISOString(),
    })),
    user_growth_trend: userGrowthTrend,
  };
}

// Helper function to get test statistics
async function getTestStats(
  db: any,
  from: Date,
  to: Date
): Promise<DashboardTestStats> {
  const [totalAttempts] = await db
    .select({ count: count() })
    .from(testAttempts)
    .where(
      and(gte(testAttempts.start_time, from), lte(testAttempts.start_time, to))
    );

  const [completedAttempts] = await db
    .select({ count: count() })
    .from(testAttempts)
    .where(
      and(
        gte(testAttempts.start_time, from),
        lte(testAttempts.start_time, to),
        eq(testAttempts.status, "completed")
      )
    );

  const averageCompletionRate =
    totalAttempts.count > 0
      ? Math.round((completedAttempts.count / totalAttempts.count) * 100)
      : 0;

  // Get average score from test results
  const [avgScoreResult] = await db
    .select({
      avg_score: avg(sql`CAST(${testResults.scaled_score} AS DECIMAL)`),
    })
    .from(testResults)
    .where(
      and(
        gte(testResults.calculated_at, from),
        lte(testResults.calculated_at, to)
      )
    );

  const averageScore = avgScoreResult.avg_score
    ? Math.round(Number(avgScoreResult.avg_score))
    : 0;

  // Get most popular tests
  const mostPopularTests = await db
    .select({
      id: tests.id,
      name: tests.name,
      category: tests.category,
      attempt_count: count(testAttempts.id),
    })
    .from(tests)
    .leftJoin(testAttempts, eq(tests.id, testAttempts.test_id))
    .where(
      and(gte(testAttempts.start_time, from), lte(testAttempts.start_time, to))
    )
    .groupBy(tests.id, tests.name, tests.category)
    .orderBy(desc(count(testAttempts.id)))
    .limit(DASHBOARD_LIMITS.POPULAR_TESTS);

  // Calculate completion rate and average score for each popular test
  const popularTestsWithStats = await Promise.all(
    mostPopularTests.map(async (test: any) => {
      const [testCompletedAttempts] = await db
        .select({ count: count() })
        .from(testAttempts)
        .where(
          and(
            eq(testAttempts.test_id, test.id),
            eq(testAttempts.status, "completed"),
            gte(testAttempts.start_time, from),
            lte(testAttempts.start_time, to)
          )
        );

      const [testAvgScore] = await db
        .select({
          avg_score: avg(sql`CAST(${testResults.scaled_score} AS DECIMAL)`),
        })
        .from(testResults)
        .where(
          and(
            eq(testResults.test_id, test.id),
            gte(testResults.calculated_at, from),
            lte(testResults.calculated_at, to)
          )
        );

      const completionRate =
        test.attempt_count > 0
          ? Math.round((testCompletedAttempts.count / test.attempt_count) * 100)
          : 0;

      const avgScore = testAvgScore.avg_score
        ? Math.round(Number(testAvgScore.avg_score))
        : 0;

      return {
        id: test.id,
        name: test.name,
        category: test.category,
        attempt_count: test.attempt_count,
        completion_rate: completionRate,
        average_score: avgScore,
      };
    })
  );

  // Get completion trend (last 7 days)
  const completionTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [dayTotal] = await db
      .select({ count: count() })
      .from(testAttempts)
      .where(
        and(
          gte(testAttempts.start_time, dayStart),
          lte(testAttempts.start_time, dayEnd)
        )
      );

    const [dayCompleted] = await db
      .select({ count: count() })
      .from(testAttempts)
      .where(
        and(
          gte(testAttempts.start_time, dayStart),
          lte(testAttempts.start_time, dayEnd),
          eq(testAttempts.status, "completed")
        )
      );

    completionTrend.push({
      date: dayStart.toISOString().split("T")[0],
      completed: dayCompleted.count,
      total: dayTotal.count,
    });
  }

  return {
    total_attempts_this_period: totalAttempts.count,
    completed_attempts_this_period: completedAttempts.count,
    average_completion_rate: averageCompletionRate,
    average_score: averageScore,
    most_popular_tests: popularTestsWithStats,
    completion_trend: completionTrend,
  };
}

// Helper function to get session statistics
async function getSessionStats(
  db: any,
  from: Date,
  to: Date
): Promise<DashboardSessionStats> {
  const now = new Date();

  const [sessionsThisPeriod] = await db
    .select({ count: count() })
    .from(testSessions)
    .where(
      and(gte(testSessions.created_at, from), lte(testSessions.created_at, to))
    );

  const [activeSessions] = await db
    .select({ count: count() })
    .from(testSessions)
    .where(
      and(
        eq(testSessions.status, "active"),
        lte(testSessions.start_time, now),
        gte(testSessions.end_time, now)
      )
    );

  const [completedSessions] = await db
    .select({ count: count() })
    .from(testSessions)
    .where(
      and(
        gte(testSessions.created_at, from),
        lte(testSessions.created_at, to),
        eq(testSessions.status, "completed")
      )
    );

  const [totalParticipants] = await db
    .select({ count: count() })
    .from(sessionParticipants)
    .leftJoin(testSessions, eq(sessionParticipants.session_id, testSessions.id))
    .where(
      and(gte(testSessions.created_at, from), lte(testSessions.created_at, to))
    );

  // Calculate average session duration
  const sessionsWithDuration = await db
    .select({
      start_time: testSessions.start_time,
      end_time: testSessions.end_time,
    })
    .from(testSessions)
    .where(
      and(
        gte(testSessions.created_at, from),
        lte(testSessions.created_at, to),
        eq(testSessions.status, "completed")
      )
    );

  const averageSessionDuration =
    sessionsWithDuration.length > 0
      ? Math.round(
          sessionsWithDuration.reduce((sum: any, session: any) => {
            const duration =
              session.end_time.getTime() - session.start_time.getTime();
            return sum + duration / (1000 * 60); // Convert to minutes
          }, 0) / sessionsWithDuration.length
        )
      : 0;

  // Get upcoming sessions
  const upcomingSessions = await db
    .select({
      id: testSessions.id,
      session_name: testSessions.session_name,
      start_time: testSessions.start_time,
      max_participants: testSessions.max_participants,
      participant_count: count(sessionParticipants.id),
    })
    .from(testSessions)
    .leftJoin(
      sessionParticipants,
      eq(testSessions.id, sessionParticipants.session_id)
    )
    .where(
      and(eq(testSessions.status, "active"), gte(testSessions.start_time, now))
    )
    .groupBy(
      testSessions.id,
      testSessions.session_name,
      testSessions.start_time,
      testSessions.max_participants
    )
    .orderBy(testSessions.start_time)
    .limit(DASHBOARD_LIMITS.UPCOMING_ADMIN_SESSIONS);

  return {
    sessions_this_period: sessionsThisPeriod.count,
    active_sessions: activeSessions.count,
    completed_sessions: completedSessions.count,
    total_participants_this_period: totalParticipants.count,
    average_session_duration_minutes: averageSessionDuration,
    upcoming_sessions: upcomingSessions.map((session: any) => ({
      id: session.id,
      session_name: session.session_name,
      start_time: session.start_time.toISOString(),
      participant_count: session.participant_count,
      max_participants: session.max_participants,
    })),
  };
}

// Helper function to get admin recent activity
async function getAdminRecentActivity(
  db: any,
  limit: number
): Promise<AdminRecentActivity[]> {
  const recentLogs = await db
    .select({
      action: auditLogs.action,
      entity: auditLogs.entity,
      user_id: auditLogs.user_id,
      created_at: auditLogs.created_at,
      new_values: auditLogs.new_values,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.created_at))
    .limit(limit);

  // Get user names for the activities
  const userIds = [
    ...new Set(recentLogs.map((log: any) => log.user_id).filter(Boolean)),
  ];
  const usersData = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(sql`${users.id} IN ${userIds}`);

  const userMap = new Map(usersData.map((user: any) => [user.id, user.name]));

  const activities: AdminRecentActivity[] = recentLogs.map((log: any) => {
    let activityType: any = "login"; // default
    let title = "System Activity";
    let description = `${log.action} on ${log.entity}`;

    // Map audit actions to activity types
    if (log.action === "login" || log.action === "authenticate") {
      activityType = "login";
      const { title: actTitle, description: actDesc } =
        formatActivityForDisplay("login");
      title = actTitle;
      description = actDesc;
    } else if (log.action === "create" && log.entity === "user") {
      activityType = "user_registered";
      const userName = log.new_values?.name || "Unknown User";
      const { title: actTitle, description: actDesc } =
        formatActivityForDisplay("user_registered", {
          user_name: userName,
          role: log.new_values?.role || "participant",
        });
      title = actTitle;
      description = actDesc;
    } else if (log.action === "create" && log.entity === "session") {
      activityType = "session_created";
      const sessionName = log.new_values?.session_name || "New Session";
      const { title: actTitle, description: actDesc } =
        formatActivityForDisplay("session_created", {
          session_name: sessionName,
        });
      title = actTitle;
      description = actDesc;
    }

    return {
      type: activityType,
      title,
      description,
      user_id: log.user_id || undefined,
      user_name: log.user_id ? userMap.get(log.user_id) : undefined,
      timestamp: log.created_at.toISOString(),
      metadata: log.new_values || {},
    };
  });

  return activities;
}

// Helper function to get performance metrics
async function getPerformanceMetrics(db: any): Promise<PerformanceMetrics> {
  const startTime = Date.now();

  // Simple database query to measure response time
  await db.select({ count: count() }).from(users).limit(1);

  const queryTime = Date.now() - startTime;

  // Mock performance metrics (in a real implementation, these would come from monitoring tools)
  return {
    server_response_time_ms: Math.random() * 100 + 50, // 50-150ms
    database_query_time_ms: queryTime,
    active_connections: Math.floor(Math.random() * 50) + 10, // 10-60 connections
    error_rate_percentage: Math.random() * 2, // 0-2% error rate
    uptime_percentage: 99.9 - Math.random() * 0.8, // 99.1-99.9% uptime
    storage_usage_mb: Math.floor(Math.random() * 1000) + 500, // 500-1500MB
    bandwidth_usage_mb: Math.floor(Math.random() * 100) + 20, // 20-120MB
  };
}

// Helper function to get trend data
async function getTrendData(
  db: any,
  from: Date,
  to: Date,
  period: string
): Promise<TrendData> {
  // This is a simplified implementation
  // In a real system, you'd want more sophisticated trend analysis

  const userRegistrations = [];
  const testAttemptsData: any[] = [];
  const sessionActivities = [];

  // Generate data for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = dayStart.toISOString().split("T")[0];

    // User registrations
    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(gte(users.created_at, dayStart), lte(users.created_at, dayEnd))
      );

    userRegistrations.push({ date: dateStr, count: userCount.count });

    // Test attempts
    const [attemptCount] = await db
      .select({ count: count() })
      .from(testAttempts)
      .where(
        and(
          gte(testAttempts.start_time, dayStart),
          lte(testAttempts.start_time, dayEnd)
        )
      );

    testAttemptsData.push({ date: dateStr, count: attemptCount.count });

    // Session activities
    const [sessionsCreated] = await db
      .select({ count: count() })
      .from(testSessions)
      .where(
        and(
          gte(testSessions.created_at, dayStart),
          lte(testSessions.created_at, dayEnd)
        )
      );

    const [sessionsCompleted] = await db
      .select({ count: count() })
      .from(testSessions)
      .where(
        and(
          gte(testSessions.end_time, dayStart),
          lte(testSessions.end_time, dayEnd),
          eq(testSessions.status, "completed")
        )
      );

    sessionActivities.push({
      date: dateStr,
      sessions_created: sessionsCreated.count,
      sessions_completed: sessionsCompleted.count,
    });
  }

  return {
    period_label: `Last 7 days`,
    user_registrations: userRegistrations,
    test_attempts: testAttemptsData,
    session_activities: sessionActivities,
  };
}

// Helper function to generate system alerts
async function generateSystemAlerts(
  db: any,
  systemStats: SystemStats
): Promise<any[]> {
  const alerts = [];
  const now = new Date();

  // Low active users alert
  if (systemStats.active_users < systemStats.total_users * 0.1) {
    alerts.push({
      id: "low_active_users",
      type: "warning",
      title: "Low User Activity",
      message: `Only ${systemStats.active_users} out of ${systemStats.total_users} users are active in the last 24 hours.`,
      timestamp: now.toISOString(),
      action_url: "/admin/users",
    });
  }

  // No active sessions alert
  if (systemStats.active_sessions === 0) {
    alerts.push({
      id: "no_active_sessions",
      type: "info",
      title: "No Active Sessions",
      message: "There are currently no active test sessions running.",
      timestamp: now.toISOString(),
      action_url: "/admin/sessions/create",
    });
  }

  // High completion rate (good news)
  const completionRate =
    systemStats.total_attempts > 0
      ? (systemStats.completed_attempts / systemStats.total_attempts) * 100
      : 0;

  if (completionRate > 80) {
    alerts.push({
      id: "high_completion_rate",
      type: "success",
      title: "High Test Completion Rate",
      message: `${Math.round(completionRate)}% of test attempts are completed successfully.`,
      timestamp: now.toISOString(),
    });
  }

  return alerts.slice(0, DASHBOARD_LIMITS.ALERTS);
}
