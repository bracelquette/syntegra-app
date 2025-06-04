"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function LoginFormAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  let error = "";
  let isLoading = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Selamat datang Admin!</h1>
                <p className="text-balance text-muted-foreground">
                  Masuk ke akun Admin Anda
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="test@admin.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline text-muted-foreground"
                    onClick={(e) => e.preventDefault()}
                  >
                    Lupa kata sandi?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="admin123"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-3">
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

                <div className="mt-3 after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <Link href="/">
                    <span className="bg-background text-muted-foreground relative z-10 px-2">
                      Kembali ke Home
                    </span>
                  </Link>
                </div>
              </div>

              <div className="text-center text-sm">
                Tidak memiliki akun?{" "}
                <Link
                  href="/admin/register"
                  className="underline underline-offset-4 text-muted-foreground"
                >
                  Daftar Admin
                </Link>
              </div>
            </div>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="flex flex-col items-center justify-center h-full">
              <Image
                src="/images/syntegra-clear-logo.png"
                width={200}
                height={200}
                alt="Syntegra Services Logo"
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
                priority
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Sistem Psikotes Digital
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
