import { NextRequest } from "next/server";

/**
 * CSRF Protection Utilities
 * Provides Cross-Site Request Forgery protection for state-changing operations
 */

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Buffer.from(buffer).toString("base64url");
}

/**
 * Validate CSRF token from request headers or body
 */
export function validateCSRFToken(
  request: NextRequest,
  expectedToken: string
): boolean {
  // Check for CSRF token in various locations
  const headerToken = request.headers.get("x-csrf-token");
  const formToken = request.headers.get("x-requested-with");
  
  // For API routes, we primarily use the header
  if (headerToken && headerToken === expectedToken) {
    return true;
  }
  
  // Additional validation for XMLHttpRequest
  if (formToken === "XMLHttpRequest") {
    return true; // SameSite cookies provide CSRF protection for AJAX
  }
  
  return false;
}

/**
 * Check if request is same-origin to prevent CSRF
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  
  if (!host) {
    return false;
  }
  
  const expectedOrigin = `https://${host}`;
  const expectedOriginHttp = `http://${host}`;
  
  // Check origin header
  if (origin) {
    return origin === expectedOrigin || 
           (process.env.NODE_ENV !== "production" && origin === expectedOriginHttp);
  }
  
  // Check referer header as fallback
  if (referer) {
    return referer.startsWith(expectedOrigin) || 
           (process.env.NODE_ENV !== "production" && referer.startsWith(expectedOriginHttp));
  }
  
  return false;
}

/**
 * Validate that the request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const protectedMethods = ["POST", "PUT", "DELETE", "PATCH"];
  return protectedMethods.includes(method.toUpperCase());
}

/**
 * CSRF protection middleware for API routes
 */
export function withCSRFProtection<T extends any[], R>(
  handler: (request: NextRequest, ...args: any[]) => R
) {
  return function(request: NextRequest, ...args: any[]): R {
    // Skip CSRF for safe methods
    if (!requiresCSRFProtection(request.method)) {
      return handler(request, ...args);
    }
    
    // Check same-origin
    if (!isSameOrigin(request)) {
      throw new Error("CSRF: Invalid origin");
    }
    
    // For production, you might want to implement token-based CSRF
    // For now, we rely on SameSite cookies and origin validation
    
    return handler(request, ...args);
  };
}

/**
 * Double Submit Cookie CSRF protection
 * Generates a token that must be included in both cookie and header/form
 */
export class DoubleSubmitCSRF {
  private static readonly COOKIE_NAME = "__csrf-token";
  
  static generateToken(): string {
    return generateCSRFToken();
  }
  
  static setCookieHeader(token: string): string {
    const options = [
      `${this.COOKIE_NAME}=${token}`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${30 * 60}`, // 30 minutes
    ];
    
    // Remove Secure flag in development
    if (process.env.NODE_ENV !== "production") {
      const secureIndex = options.indexOf("Secure");
      if (secureIndex > -1) {
        options.splice(secureIndex, 1);
      }
    }
    
    return options.join("; ");
  }
  
  static validateToken(request: NextRequest): boolean {
    const cookieToken = this.extractCookieToken(request);
    const headerToken = request.headers.get("x-csrf-token");
    
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    return cookieToken === headerToken;
  }
  
  private static extractCookieToken(request: NextRequest): string | null {
    const cookies = request.headers.get("cookie");
    if (!cookies) {
      return null;
    }
    
    const match = cookies.match(new RegExp(`${this.COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : null;
  }
}