import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { getEnv, type CloudflareBindings } from "../lib/env";

const api = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware
api.use("*", logger());
api.use("*", prettyJSON());

// CORS configuration
api.use(
  "*",
  cors({
    origin: (origin, c) => {
      const env = getEnv(c);
      const allowedOrigins = [
        env.FRONTEND_URL,
        env.CORS_ORIGIN,
        "http://localhost:3000", // Development
        "http://localhost:5173", // Vite dev server
      ].filter(Boolean);

      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
  })
);

// Health check endpoint
api.get("/health", (c) => {
  return c.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || "development",
  });
});

// API versioning and routes
// api.route("/api/v1", userRoutes);

// 404 handler for API routes
api.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "API endpoint not found",
      path: c.req.path,
    },
    404
  );
});

// Global error handler
api.onError((err, c) => {
  console.error("API Error:", err);

  return c.json(
    {
      success: false,
      message: "Internal server error",
      ...(c.env.NODE_ENV === "development" && {
        error: err.message,
        stack: err.stack,
      }),
    },
    500
  );
});

export { api };
