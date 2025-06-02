import { Hono } from "hono";
import { api } from "./routes/api";
import type { CloudflareBindings } from "./lib/env";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Mount API routes
app.route("/", api);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Syntegra Psikotes API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/v1/health",
      users: {
        create: "POST /api/v1/users",
        schema: "GET /api/v1/users/schema",
      },
    },
  });
});

export default app;
