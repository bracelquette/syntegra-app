import { Context } from "hono";
import { type CloudflareBindings } from "../../lib/env";
import {
  CreateTestRequestSchema,
  UpdateTestRequestSchema,
  getModuleTypes,
  getCategories,
  getTestStatuses,
  type TestSchemaResponse,
} from "shared-types";

export async function getTestSchemaHandler(
  c: Context<{ Bindings: CloudflareBindings }>
) {
  try {
    const response: TestSchemaResponse = {
      success: true,
      message: "Test schema retrieved successfully",
      data: {
        create_schema: CreateTestRequestSchema,
        update_schema: UpdateTestRequestSchema,
        enums: {
          module_types: getModuleTypes(),
          categories: getCategories(),
          statuses: getTestStatuses(),
        },
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 200);
  } catch (error) {
    console.error("Error getting test schema:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve test schema",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}
