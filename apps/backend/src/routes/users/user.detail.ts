import { Context } from "hono";
import { CloudflareBindings } from "@/lib/env";

export async function getUserByIdHandler(
  c: Context<{ Bindings: CloudflareBindings }>
) {
  return c.json({
    message: "User Detail",
    todo: "Buat API untuk mendapatkan detail user",
  });
}
