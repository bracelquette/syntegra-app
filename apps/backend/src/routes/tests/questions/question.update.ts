import { Context } from "hono";
import { type CloudflareBindings } from "@/lib/env";
import { type QuestionErrorResponse } from "shared-types";

export async function updateQuestionHandler(
  c: Context<{ Bindings: CloudflareBindings }>
) {
  const errorResponse: QuestionErrorResponse = {
    success: false,
    message: "Update question not implemented yet",
    timestamp: new Date().toISOString(),
  };
  return c.json(errorResponse, 501);
}
