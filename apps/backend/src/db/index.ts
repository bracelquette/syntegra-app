import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Function to create database connection for Cloudflare Workers
export function createDatabase(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// For development environments where process.env is available
let db: ReturnType<typeof createDatabase> | null = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!db) {
    db = createDatabase(databaseUrl);
  }
  return db;
}

// For Cloudflare Workers - accepts environment from context
export function getDbFromEnv(env: { DATABASE_URL: string }) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  return createDatabase(env.DATABASE_URL);
}

// Export schema for use in other parts of the application
export * from "./schema";

// Export types for convenience
export type Database = ReturnType<typeof createDatabase>;
