import { Context } from "hono";
import { type CloudflareBindings } from "@/lib/env";
import { type QuestionErrorResponse } from "shared-types";

export async function bulkCreateQuestionsHandler(
  c: Context<{ Bindings: CloudflareBindings }>
) {
  const errorResponse: QuestionErrorResponse = {
    success: false,
    message: "Bulk create questions not implemented yet",
    timestamp: new Date().toISOString(),
  };
  return c.json(errorResponse, 501);
}
