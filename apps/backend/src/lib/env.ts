import { z } from "zod";

// Schema untuk environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_SECRET: z.string().min(1, "JWT secret is required"),
  FRONTEND_URL: z.string().url("Invalid frontend URL"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Cloudflare Workers Environment Bindings
export interface CloudflareBindings {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
  CORS_ORIGIN?: string;
}

// Function untuk validate environment variables
export function validateEnv(env: CloudflareBindings): Env {
  try {
    return envSchema.parse(env);
  } catch (error) {
    console.error("Environment validation failed:", error);
    throw new Error("Invalid environment configuration");
  }
}

// Helper function untuk get environment
export function getEnv(c: any): Env {
  return validateEnv(c.env);
}
