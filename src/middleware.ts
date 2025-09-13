import { NextResponse } from "next/server";
import { NextAuthRequest } from "next-auth";

import { auth as middleware } from "@/auth";
import { addSecurityHeaders } from "@/lib/security";
import {
  apiAuthPrefix,
  authRoutes,
  consumerPrefix,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
  staffPrefix,
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
      response = NextResponse.next();
    } else if (isAuthRoute) {
      if (isLoggedIn) {
        response = NextResponse.redirect(
          new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)
        );
      } else {
        response = NextResponse.next();
      }
    } else if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      const isStaff = !!req.auth?.user?.shop_id;
      const isStaffRoute = staffPrefix.some((p) => path.startsWith(p));
      const isConsumerRoute = consumerPrefix.some((p) => path.startsWith(p));

      if (isStaffRoute && !isStaff) {
        response = NextResponse.redirect(new URL("/unauthorized", nextUrl));
      } else if (isConsumerRoute && isStaff) {
        response = NextResponse.redirect(new URL("/unauthorized", nextUrl));
      } else {
        response = NextResponse.next();
      }
    }

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("[MIDDLEWARE ERROR]:", error);
    const errorResponse = NextResponse.next();
    return addSecurityHeaders(errorResponse);
  }
});

// Export matcher config for Next.js middleware
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
