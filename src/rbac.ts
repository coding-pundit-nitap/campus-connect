/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines route access patterns and authentication requirements for the campus-connect application
 */

export const publicRoutes: string[] = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/shops",
  "/shops/:shop_id",
  "/product/:product_id",
];

// Routes related to authentication (login, register, error pages).
// These routes redirect logged-in users to the default redirect path.
export const authRoutes = ["/error"];

// API routes that handle authentication processes. These are always accessible.
export const apiAuthPrefix = ["/api/auth"];

// Admin-only routes that require ADMIN role
export const adminRoutes: string[] = [
  "/admin",
  "/admin/:path",
  "/admin/:path/:subpath",
];

// Default page to redirect to after successful login.
export const DEFAULT_LOGIN_REDIRECT = "/";
