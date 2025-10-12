import { NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";

import { auth as middleware } from "@/auth";
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "@/rbac";

export default middleware(async (req: NextAuthRequest) => {
  try {
    const { nextUrl } = req;
    const path = nextUrl.pathname;
    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = apiAuthPrefix.some((p) => path.startsWith(p));
    const isPublicRoute = publicRoutes.some((p) => path.startsWith(p));
    const isAuthRoute = authRoutes.some((p) => path.startsWith(p));

    let response: NextResponse;

    if (isApiAuthRoute || isPublicRoute) {
      // Always allow access to API auth routes and public routes
      response = NextResponse.next();
    } else if (isAuthRoute && isLoggedIn) {
      // Redirect logged-in users away from auth routes to the default redirect path
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = DEFAULT_LOGIN_REDIRECT;
      response = NextResponse.redirect(redirectUrl);
    } else if (!isAuthRoute && !isLoggedIn) {
      // Redirect unauthenticated users trying to access protected routes to login
      const redirectUrl = nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      response = NextResponse.redirect(redirectUrl);
    } else {
      // Allow access in all other cases (e.g., logged-in users accessing non-auth routes)
      response = NextResponse.next();
    }

    return response;
  } catch (error) {
    console.error("[MIDDLEWARE ERROR]:", error);
    const errorResponse = NextResponse.next();
    return errorResponse;
  }
});

// Export matcher config for Next.js middleware
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
