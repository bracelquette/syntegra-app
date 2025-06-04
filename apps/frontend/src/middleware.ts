import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get tokens from cookies or headers
  const accessToken =
    request.cookies.get("access_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/admin/login",
    "/participant/login",
    "/admin/register",
    "/participant/register",
    "/about",
    "/contact",
  ];

  // Admin-only routes
  const adminRoutes = [
    "/admin/dashboard",
    "/admin/users",
    "/admin/tests",
    "/admin/sessions",
    "/admin/reports",
  ];

  // Participant-only routes
  const participantRoutes = ["/participant/dashboard", "/participant/test"];

  // Allow access to public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!accessToken) {
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (participantRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/participant/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
