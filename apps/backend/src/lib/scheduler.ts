import { getDbFromEnv, testSessions, testAttempts } from "@/db";
import { eq, and, sql, lte } from "drizzle-orm";
import type { CloudflareBindings } from "./env";

/**
 * Auto-update session statuses based on current time
 * Runs every 3 minutes to check for status changes
 */
export async function updateSessionStatuses(
  env: CloudflareBindings
): Promise<void> {
  try {
    console.log("🔄 Starting session status update job...");

    const db = getDbFromEnv(env);
    const now = new Date();

    // ===== UPDATE DRAFT → ACTIVE =====
    // Find draft sessions where start_time has passed
    const draftToActiveResult = await db
      .update(testSessions)
      .set({
        status: "active",
        updated_at: now,
      })
      .where(
        and(eq(testSessions.status, "draft"), lte(testSessions.start_time, now))
      )
      .returning({
        id: testSessions.id,
        session_name: testSessions.session_name,
      });

    if (draftToActiveResult.length > 0) {
      console.log(
        `✅ Updated ${draftToActiveResult.length} sessions from DRAFT → ACTIVE`
      );
      draftToActiveResult.forEach((session) => {
        console.log(`   - ${session.session_name} (${session.id})`);
      });
    }

    // ===== UPDATE ACTIVE → EXPIRED/COMPLETED =====
    // Find active sessions where end_time has passed
    const activeExpiredSessions = await db
      .select({
        id: testSessions.id,
        session_name: testSessions.session_name,
        session_code: testSessions.session_code,
      })
      .from(testSessions)
      .where(
        and(eq(testSessions.status, "active"), lte(testSessions.end_time, now))
      );

    for (const session of activeExpiredSessions) {
      // Check if session has any test attempts
      const [attemptCount] = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(testAttempts)
        .where(eq(testAttempts.session_test_id, session.id));

      const hasAttempts = (attemptCount?.count || 0) > 0;
      const newStatus = hasAttempts ? "completed" : "expired";

      // Update session status
      await db
        .update(testSessions)
        .set({
          status: newStatus,
          updated_at: now,
        })
        .where(eq(testSessions.id, session.id));

      console.log(
        `✅ Updated session ${session.session_name} (${session.session_code}) from ACTIVE → ${newStatus.toUpperCase()}`
      );
    }

    console.log(
      `🎯 Session status update job completed at ${now.toISOString()}`
    );
  } catch (error) {
    console.error("❌ Error in session status update job:", error);
    // Don't throw - let the scheduler continue
  }
}

/**
 * Schedule function to run background jobs
 * This will be called from cron trigger or scheduled event
 */
export async function runScheduledJobs(env: CloudflareBindings): Promise<void> {
  console.log("🚀 Running scheduled background jobs...");

  // Run session status updates
  await updateSessionStatuses(env);

  console.log("✨ All scheduled jobs completed");
}

/**
 * Simple in-memory scheduler for development
 * In production, use Cloudflare Cron Triggers
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export function startDevScheduler(env: CloudflareBindings): void {
  if (schedulerInterval) {
    console.log("⚠️  Scheduler already running");
    return;
  }

  console.log("🚀 Starting development scheduler (3-minute intervals)...");

  // Run immediately on start
  runScheduledJobs(env);

  // Schedule to run every 3 minutes (180,000 ms)
  schedulerInterval = setInterval(
    () => {
      runScheduledJobs(env);
    },
    3 * 60 * 1000
  );

  console.log("✅ Development scheduler started");
}

export function stopDevScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("🛑 Development scheduler stopped");
  }
}
