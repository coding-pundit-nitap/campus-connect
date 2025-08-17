/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines route access patterns and authentication requirements for the medcare application
 */

// Routes that can be accessed without authentication
export const publicRoutes: string[] = ["/"];

// Routes related to authentication (login, register, error pages)
// These routes are accessible to unauthenticated users
export const authRoutes = ["/login", "/register", "/error"];

// API routes that handle authentication processes
export const apiAuthPrefix = ["/api/auth"];

// Routes accessible only to users with staff role
export const staffPrefix = ["/staff"];

// Routes accessible only to users with consumer role
export const consumerPrefix = ["/consumer"];

// Default page to redirect to after successful login
export const DEFAULT_LOGIN_REDIRECT = "/";
