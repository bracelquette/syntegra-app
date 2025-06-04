import { createFileRoute } from "@tanstack/react-router";
import { RegisterFormAdmin } from "~/components/register-form-admin";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/admin/register")({
  head: () => ({
    meta: [
      ...seo({
        title: "Daftar Admin | Syntegra Psikotes",
        description:
          "Daftar sebagai administrator untuk mengelola sistem psikotes digital Syntegra.",
        keywords:
          "daftar admin, administrator, syntegra psikotes, sistem manajemen",
      }),
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <RegisterFormAdmin />
      </div>
    </div>
  );
}
