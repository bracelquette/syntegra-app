import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { getEnv, type CloudflareBindings } from "../lib/env";
import { userRoutes } from "./users";

const api = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware
api.use("*", logger());
api.use("*", prettyJSON());

// CORS configuration
api.use(
  "*",
  cors({
    origin: (origin, c) => {
      // Handle environment variables gracefully
      let allowedOrigins: string[];
      try {
        const env = getEnv(c);
        allowedOrigins = [
          env.FRONTEND_URL,
          env.CORS_ORIGIN,
          "http://localhost:3000", // Development
          "http://localhost:5173", // Vite dev server
        ].filter((url): url is string => Boolean(url));
      } catch (error) {
        // Fallback for development when env vars are not configured
        console.warn(
          "Environment variables not configured, using development defaults"
        );
        allowedOrigins = [
          "http://localhost:3000", // Development
          "http://localhost:5173", // Vite dev server
        ];
      }

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

// API versioning and routes
api.route("/users", userRoutes);

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
