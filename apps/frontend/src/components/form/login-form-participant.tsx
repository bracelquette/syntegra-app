"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

// Form validation schema
const loginSchema = z.object({
  nik: z
    .string()
    .min(1, "NIK tidak boleh kosong")
    .length(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  email: z
    .string()
    .min(1, "Email tidak boleh kosong")
    .email("Format email tidak valid"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginFormParticipant({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showNIK, setShowNIK] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearErrors();

      toast.success("Login berhasil!", {
        description: `Selamat datang ${data.email}`,
      });
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle specific error cases
      if (error.message.includes("NIK atau email")) {
        setError("nik", {
          type: "manual",
          message: "NIK atau email tidak ditemukan",
        });
        setError("email", {
          type: "manual",
          message: "NIK atau email tidak ditemukan",
        });
      } else if (error.message.includes("NIK")) {
        setError("nik", {
          type: "manual",
          message: error.message,
        });
      } else if (error.message.includes("email")) {
        setError("email", {
          type: "manual",
          message: error.message,
        });
      } else {
        toast.error("Login gagal", {
          description: error.message || "Terjadi kesalahan saat login",
        });
      }
    }
  };

  const isLoading = isSubmitting;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium hover:opacity-80 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <Image
                  src="/images/syntegra-logo.jpg"
                  width={200}
                  height={200}
                  alt="Syntegra Services Logo"
                  className="w-20 h-20 md:w-40 md:h-40 object-contain"
                  priority
                />
              </div>
              <span className="sr-only">Syntegra Services</span>
            </Link>
            <h1 className="text-xl font-bold">
              Selamat Datang di Syntegra Services
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Masuk untuk mengakses psikotes Anda
            </p>
            <div className="text-center text-sm">
              Belum memiliki akun?{" "}
              <Link
                href="/participant/register"
                className="underline underline-offset-4 text-primary hover:text-primary/80"
              >
                Daftar
              </Link>
            </div>
          </div>

          {/* Global Error Display */}
          {errors.root && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>
                {errors.root.message || "Terjadi kesalahan saat login"}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* NIK Field */}
            <div className="grid gap-2">
              <Label htmlFor="nik" className="text-sm font-medium">
                Nomor Induk Kependudukan (NIK)
              </Label>
              <div className="relative">
                <Input
                  id="nik"
                  type={showNIK ? "text" : "password"}
                  placeholder="1234567890123456"
                  disabled={isLoading}
                  {...register("nik")}
                  className={cn(
                    "pr-10",
                    errors.nik && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNIK(!showNIK)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showNIK ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.nik && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.nik.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                disabled={isLoading}
                {...register("email")}
                className={cn(
                  errors.email && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <Link href="/">
              <span className="relative z-10 bg-background px-2 text-muted-foreground hover:underline hover:text-primary transition-colors">
                Kembali ke Home
              </span>
            </Link>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              Kesulitan masuk?{" "}
              <button
                type="button"
                onClick={() => {
                  toast.info("Bantuan Login", {
                    description:
                      "Hubungi admin untuk bantuan atau pastikan NIK dan email sudah terdaftar",
                  });
                }}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Klik di sini
              </button>
            </p>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        <p className="text-xs text-muted-foreground">
          © 2025 Syntegra Services. Dikembangkan oleh{" "}
          <a
            href="https://oknum.studio"
            className="text-emerald-700 font-bold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Oknum.Studio
          </a>
        </p>
      </div>
    </div>
  );
}
