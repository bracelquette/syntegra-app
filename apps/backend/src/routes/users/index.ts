import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type CloudflareBindings } from "../../lib/env";
import {
  CreateUserRequestSchema,
  GetUsersRequestSchema,
  type ErrorResponse,
} from "shared-types";
import { createUserHandler } from "./user.create";
import { getUsersListHandler } from "./user.list";
import { getUserSchemaHandler } from "./user.schema";

const userRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== GET ALL USERS ENDPOINT ====================
userRoutes.get(
  "/",
  zValidator("query", GetUsersRequestSchema, (result, c) => {
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: "Invalid query parameters",
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
  getUsersListHandler
);

// ==================== CREATE USER ENDPOINT ====================
userRoutes.post(
  "/",
  zValidator("json", CreateUserRequestSchema, (result, c) => {
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
  createUserHandler
);

// ==================== GET USER SCHEMA ENDPOINT ====================
userRoutes.get("/schema", getUserSchemaHandler);

// ==================== ERROR HANDLERS ====================
userRoutes.onError((err, c) => {
  console.error("User routes error:", err);

  const errorResponse: ErrorResponse = {
    success: false,
    message: "User route error",
    ...(c.env.NODE_ENV === "development" && {
      errors: [
        {
          message: err.message,
          code: "ROUTE_ERROR",
        },
      ],
    }),
    timestamp: new Date().toISOString(),
  };

  return c.json(errorResponse, 500);
});

export { userRoutes };
