// middleware.ts
import { createClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/signin", "/api/cron", "/auth/callback"];

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const { supabase } = createClient(request);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && pathname !== "/signin") {
      // Redirect to signin if not authenticated
      const signInUrl = new URL("/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }

    if (user && pathname === "/signin") {
      // Redirect to home if already authenticated
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  } catch (error) {
    console.error("Middleware auth check failed:", error);
    // On error, redirect to signin for protected routes
    if (!isPublicRoute) {
      const signInUrl = new URL("/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
