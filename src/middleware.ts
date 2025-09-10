import { NextRequest, NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";

import { auth as middleware } from "@/auth";
import { addSecurityHeaders, rateLimit } from "@/middleware/security";
import {
  apiAuthPrefix,
  authRoutes,
  consumerPrefix,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
  staffPrefix,
} from "@/rbac";

const roleBasedPrefixes: {
  prefixes: string[];
  isStaff: boolean;
}[] = [
  { prefixes: staffPrefix, isStaff: true },
  { prefixes: consumerPrefix, isStaff: false },
];

export default middleware((req: NextAuthRequest) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth);

  // Apply rate limiting to all routes
  if (!rateLimit(req)) {
    return addSecurityHeaders(
      new NextResponse("Too Many Requests", { status: 429 })
    );
  }

  // Allow unauthenticated access to API auth and public routes
  if (
    apiAuthPrefix.some((p) => path.startsWith(p)) ||
    publicRoutes.some((p) => path.startsWith(p))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // In development, allow any route once authenticated
  if (process.env.NODE_ENV !== "production" && isLoggedIn) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Prevent logged-in users from accessing auth pages
  if (authRoutes.some((p) => path.startsWith(p))) {
    if (isLoggedIn) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
      );
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Handle role-based protected prefixes
  for (const { prefixes, isStaff } of roleBasedPrefixes) {
    if (prefixes.some((p) => path.startsWith(p))) {
      // Redirect unauthenticated
      if (!isLoggedIn) {
        return addSecurityHeaders(redirectToLogin(req));
      }
      // Insufficient role
      if (!!req.auth?.user.shop_id !== isStaff) {
        return addSecurityHeaders(
          NextResponse.redirect(new URL("/unauthorized", nextUrl))
        );
      }
      return addSecurityHeaders(NextResponse.next());
    }
  }

  // Catch-all: protect remaining routes
  if (!isLoggedIn) {
    return addSecurityHeaders(redirectToLogin(req));
  }

  // Default allow with security headers
  return addSecurityHeaders(NextResponse.next());
});

// Utility to redirect to login with callback
function redirectToLogin(req: NextRequest) {
  const { nextUrl } = req;
  const loginUrl = new URL("/login", nextUrl);
  loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

// Export matcher config for Next.js middleware
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
