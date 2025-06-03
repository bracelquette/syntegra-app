import { Hono } from "hono";
import { api } from "./routes/api";
import type { CloudflareBindings } from "./lib/env";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Mount API routes
app.route("/api/v1", api);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Syntegra Psikotes API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/v1/health",
      auth: {
        login: "POST /api/v1/auth/login",
        logout: "POST /api/v1/auth/logout",
        refresh: "POST /api/v1/auth/refresh",
        me: "GET /api/v1/auth/me",
      },
      users: {
        create: "POST /api/v1/users",
        list: "GET /api/v1/users",
        get: "GET /api/v1/users/:id",
        update: "PUT /api/v1/users/:id",
        delete: "DELETE /api/v1/users/:id",
        schema: "GET /api/v1/users/schema",
        adminStatus: "GET /api/v1/users/admin-status",
        bulk: {
          validateCsv: "POST /api/v1/users/bulk/validate-csv",
          createFromCsv: "POST /api/v1/users/bulk/csv",
          createFromJson: "POST /api/v1/users/bulk/json",
        },
        stats: "GET /api/v1/users/stats/summary",
      },
      tests: {
        create: "POST /api/v1/tests",
        list: "GET /api/v1/tests",
        get: "GET /api/v1/tests/:id",
        update: "PUT /api/v1/tests/:id",
        delete: "DELETE /api/v1/tests/:id",
        schema: "GET /api/v1/tests/schema",
        analytics: "GET /api/v1/tests/:id/analytics",
        stats: "GET /api/v1/tests/stats/summary",
        categories: "GET /api/v1/tests/categories/:moduleType",
      },
    },
  });
});

export default app;
