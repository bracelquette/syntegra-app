import { createFileRoute } from "@tanstack/react-router";
import { LoginFormAdmin } from "~/components/login-form-admin";
import { seo } from "~/utils/seo";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      ...seo({
        title: "Login Admin | Syntegra Psikotes",
        description:
          "Masuk sebagai administrator untuk mengelola sistem psikotes digital Syntegra.",
        keywords:
          "login admin, administrator, syntegra psikotes, sistem manajemen",
      }),
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginFormAdmin />
      </div>
    </div>
  );
}
