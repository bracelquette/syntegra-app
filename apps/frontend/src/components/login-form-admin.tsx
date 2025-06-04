import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Link } from "@tanstack/react-router";

export function LoginFormAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Selamat datang Admin!</h1>
                <p className="text-balance text-muted-foreground">
                  Masuk ke akun Admin Anda
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  <Link to="/">Kembali Ke Beranda</Link>
                </span>
              </div>

              <div className="text-center text-sm">
                Belum punya akun?{" "}
                <a href="#" className="underline underline-offset-4">
                  Daftar
                </a>
              </div>
            </div>
          </form>
          <div className="relative flex items-center justify-center bg-muted p-8">
            <div className="flex flex-col items-center justify-center h-full">
              <img
                src="/images/syntegra-clear-logo.png"
                alt="Image"
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
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
