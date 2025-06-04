"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function LoginFormParticipant({
  className,
  ...props
}: React.ComponentProps<"div">) {
  let isLoading = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
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
            </a>
            <h1 className="text-xl font-bold">
              Selamat Datang di Syntegra Services
            </h1>
            <div className="text-center text-sm">
              Belum memiliki akun?{" "}
              <Link
                href="/participant/register"
                className="underline underline-offset-4"
              >
                Daftar
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="nik">Nomor Induk Kependudukan</Label>
              <Input
                id="nik"
                type="number"
                placeholder=""
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@user.com"
                required
                disabled={isLoading}
              />
            </div>
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
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <Link href="/">
              <span className="relative z-10 bg-background px-2 text-muted-foreground hover:underline">
                Kembali ke Home
              </span>
            </Link>
          </div>
        </div>
      </form>

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
