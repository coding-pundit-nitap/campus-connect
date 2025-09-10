import { NextRequest } from "next/server";

/**
 * CSRF Protection Module
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
    return (
      origin === expectedOrigin ||
      (process.env.NODE_ENV !== "production" && origin === expectedOriginHttp)
    );
  }

  // Check referer header as fallback
  if (referer) {
    return (
      referer.startsWith(expectedOrigin) ||
      (process.env.NODE_ENV !== "production" &&
        referer.startsWith(expectedOriginHttp))
    );
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
export function withCSRFProtection<R>(
  handler: (request: NextRequest, ...args: unknown[]) => R
) {
  return function (request: NextRequest, ...args: unknown[]): R {
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

/**
 * Enhanced CSRF protection with additional security measures
 */
export class EnhancedCSRFProtection {
  private readonly tokenLifetime: number;
  private readonly maxTokensPerUser: number;
  private readonly userTokens = new Map<
    string,
    Array<{ token: string; created: number }>
  >();

  constructor(
    tokenLifetime = 30 * 60 * 1000, // 30 minutes
    maxTokensPerUser = 5
  ) {
    this.tokenLifetime = tokenLifetime;
    this.maxTokensPerUser = maxTokensPerUser;
  }

  /**
   * Generate a new CSRF token for a user
   */
  generateToken(user_id: string): string {
    const token = generateCSRFToken();
    const created = Date.now();

    // Get existing tokens for user
    let tokens = this.userTokens.get(user_id) || [];

    // Remove expired tokens
    tokens = tokens.filter((t) => created - t.created < this.tokenLifetime);

    // Add new token
    tokens.push({ token, created });

    // Keep only the most recent tokens
    if (tokens.length > this.maxTokensPerUser) {
      tokens = tokens.slice(-this.maxTokensPerUser);
    }

    this.userTokens.set(user_id, tokens);
    return token;
  }

  /**
   * Validate a CSRF token for a user
   */
  validateToken(user_id: string, token: string): boolean {
    const tokens = this.userTokens.get(user_id);
    if (!tokens) return false;

    const now = Date.now();

    // Check if token exists and is not expired
    const validToken = tokens.find(
      (t) => t.token === token && now - t.created < this.tokenLifetime
    );

    if (validToken) {
      // Remove used token (one-time use)
      this.userTokens.set(
        user_id,
        tokens.filter((t) => t.token !== token)
      );
      return true;
    }

    return false;
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Date.now();

    for (const [user_id, tokens] of this.userTokens.entries()) {
      const validTokens = tokens.filter(
        (t) => now - t.created < this.tokenLifetime
      );

      if (validTokens.length === 0) {
        this.userTokens.delete(user_id);
      } else {
        this.userTokens.set(user_id, validTokens);
      }
    }
  }

  /**
   * Get token statistics
   */
  getStats(): {
    totalUsers: number;
    totalTokens: number;
    avgTokensPerUser: number;
  } {
    const totalUsers = this.userTokens.size;
    const totalTokens = Array.from(this.userTokens.values()).reduce(
      (sum, tokens) => sum + tokens.length,
      0
    );

    return {
      totalUsers,
      totalTokens,
      avgTokensPerUser: totalUsers > 0 ? totalTokens / totalUsers : 0,
    };
  }
}

// Export singleton instance for enhanced CSRF protection
export const enhancedCSRF = new EnhancedCSRFProtection();

// Cleanup expired tokens every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => enhancedCSRF.cleanup(), 5 * 60 * 1000);
}
