/**
 * IP Detection and Validation Module
 * Provides utilities for extracting and validating client IP addresses
 */

import { NextRequest } from "next/server";

/**
 * Extract client IP address from request headers
 * Enhanced for Docker environments and various proxy configurations
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP in order of preference
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const xClientIp = request.headers.get("x-client-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  const trueClientIp = request.headers.get("true-client-ip"); // Cloudflare Enterprise

  // Handle forwarded-for chain (comma-separated)
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    // Return the first non-internal IP
    for (const ip of ips) {
      if (isValidIP(ip) && !isInternalIP(ip)) {
        return ip;
      }
    }
    // If all are internal, return the first valid one
    for (const ip of ips) {
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Check other headers in order of trustworthiness
  if (trueClientIp && isValidIP(trueClientIp)) return trueClientIp;
  if (cfConnectingIp && isValidIP(cfConnectingIp)) return cfConnectingIp;
  if (xRealIp && isValidIP(xRealIp)) return xRealIp;
  if (xClientIp && isValidIP(xClientIp)) return xClientIp;

  // Fallback to connection remote address
  // NextRequest doesn't have a direct ip property, so we'll use "unknown" as final fallback
  // In Edge Runtime, connection info is not available
  return "unknown";
}

/**
 * Check if an IP address is internal/private
 */
export function isInternalIP(ip: string): boolean {
  if (!ip || ip === "unknown") return false;

  // Remove IPv6 prefix if present
  const cleanIp = ip.replace(/^::ffff:/, "");

  const internalRanges = [
    /^127\./, // 127.0.0.0/8 (localhost)
    /^10\./, // 10.0.0.0/8 (private)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (private)
    /^192\.168\./, // 192.168.0.0/16 (private)
    /^169\.254\./, // 169.254.0.0/16 (link-local)
    /^::1$/, // IPv6 localhost
    /^fc00:/, // IPv6 unique local
    /^fe80:/, // IPv6 link-local
    /^0\.0\.0\.0$/, // Invalid IP
  ];

  return internalRanges.some((range) => range.test(cleanIp));
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;

  // IPv4 validation
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) return true;

  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  if (ipv6Regex.test(ip)) return true;

  // IPv6 with IPv4 suffix
  const ipv6WithIpv4Regex =
    /^::ffff:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv6WithIpv4Regex.test(ip)) return true;

  return false;
}

/**
 * Get the geolocation region for an IP (simplified)
 * In production, you might want to use a proper geolocation service
 */
export function getIPRegion(ip: string): string {
  if (isInternalIP(ip)) return "internal";

  // This is a simplified example
  // In production, integrate with services like MaxMind, ipinfo.io, etc.
  return "unknown";
}

/**
 * Check if IP is from a known VPN/proxy provider
 * This is a simplified example - in production use dedicated services
 */
export function isVPNOrProxy(ip: string): boolean {
  if (isInternalIP(ip)) return false;

  // For now, return false - implement with actual VPN detection service
  return false;
}

/**
 * Rate limiting key generator based on IP with fallbacks
 */
export function generateRateLimitKey(
  request: NextRequest,
  prefix = "rate_limit"
): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  // For internal IPs, also include user agent for better differentiation
  if (isInternalIP(ip)) {
    const userAgentHash = Buffer.from(userAgent).toString("base64").slice(0, 8);
    return `${prefix}:${ip}:${userAgentHash}`;
  }

  return `${prefix}:${ip}`;
}
