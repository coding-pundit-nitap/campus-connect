/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines route access patterns and authentication requirements for the medcare application
 */

export const publicRoutes: string[] = ["/", "/help"];

// Routes related to authentication (login, register, error pages).
// These routes redirect logged-in users to the default redirect path.
export const authRoutes = ["/login", "/register", "/error"];

// API routes that handle authentication processes. These are always accessible.
export const apiAuthPrefix = ["/api/auth"];

// Routes accessible only to users with a shop (sellers).
export const staffPrefix = ["/staff"]; // Example: /staff/dashboard, /staff/products

// Routes accessible only to users without a shop (consumers).
export const consumerPrefix = ["/consumer"]; // Example: /consumer/orders

// Default page to redirect to after successful login.
export const DEFAULT_LOGIN_REDIRECT = "/";
