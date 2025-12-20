import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  adminRoutes,
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "@/rbac";

export async function proxy(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { nextUrl } = req;
    const path = nextUrl.pathname;
    const isLoggedIn = !!session?.user;
    const userRole = session?.user?.role;
    const isApiAuthRoute = apiAuthPrefix.some((p) => path.startsWith(p));
    const isPublicRoute =
      path === "/" || publicRoutes.some((p) => path.startsWith(p));
    const isAuthRoute = authRoutes.some((p) => path.startsWith(p));
    const isAdminRoute = adminRoutes.some((p) => path.startsWith(p));
    const isApiRoute = path.startsWith("/api/");
    let response: NextResponse;

    if (isApiAuthRoute || isPublicRoute || isApiRoute) {
      // Always allow access to API auth routes and public routes
      response = NextResponse.next();
    } else if (isAuthRoute && isLoggedIn) {
      // Redirect logged-in users away from auth routes to the default redirect path
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = DEFAULT_LOGIN_REDIRECT;
      response = NextResponse.redirect(redirectUrl);
    } else if (isAdminRoute) {
      // Admin routes require both authentication and ADMIN role
      if (!isLoggedIn) {
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        response = NextResponse.redirect(redirectUrl);
      } else if (userRole !== "ADMIN") {
        // Redirect non-admin users to homepage with error
        const redirectUrl = nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("error", "unauthorized");
        response = NextResponse.redirect(redirectUrl);
      } else {
        response = NextResponse.next();
      }
    } else if (!isAuthRoute && !isLoggedIn) {
      // Redirect unauthenticated users trying to access protected routes to login
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      response = NextResponse.redirect(redirectUrl);
    } else {
      // Allow access in all other cases (e.g., logged-in users accessing non-auth routes)
      response = NextResponse.next();
    }

    return response;
  } catch (error) {
    console.error("[PROXY ERROR]:", error);
    return NextResponse.next();
  }
}

// Export matcher config for Next.js proxy
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
