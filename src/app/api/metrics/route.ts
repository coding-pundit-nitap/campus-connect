import { NextRequest, NextResponse } from "next/server";
import type { Counter, Histogram, Registry } from "prom-client";

import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
const log = createLogger("route");

let register: Registry | null = null;
export let httpRequestDuration: Histogram | null = null;
export let httpRequestTotal: Counter | null = null;
export let authenticationAttempts: Counter | null = null;
export let activeUsers: Counter | null = null;
export let databaseQueryDuration: Histogram | null = null;

let initialized = false;

async function initializeMetrics() {
  if (initialized || process.env.NODE_ENV !== "production") return;
  initialized = true;

  try {
    const promClient = await import("prom-client");

    register = promClient.register;
    promClient.collectDefaultMetrics({ register });

    httpRequestDuration = new promClient.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      registers: [register],
    });

    httpRequestTotal = new promClient.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [register],
    });

    authenticationAttempts = new promClient.Counter({
      name: "authentication_attempts_total",
      help: "Total number of authentication attempts",
      labelNames: ["status", "method"],
      registers: [register],
    });

    activeUsers = new promClient.Counter({
      name: "active_users_total",
      help: "Total number of active users",
      labelNames: ["role"],
      registers: [register],
    });

    databaseQueryDuration = new promClient.Histogram({
      name: "database_query_duration_seconds",
      help: "Duration of database queries in seconds",
      labelNames: ["operation", "model"],
      registers: [register],
    });

    log.debug("[Metrics] Prometheus metrics initialized for production");
  } catch (error) {
    log.error({ err: error }, "[Metrics] Failed to initialize Prometheus:");
    initialized = false;
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return jsonResponse(
      { error: "Metrics endpoint only available in production" },
      404
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  log.debug(`[Metrics] Request from: ${forwardedFor}, ${realIp}`);

  try {
    await initializeMetrics();

    if (!register) {
      return jsonResponse({ error: "Metrics not initialized" }, 500);
    }

    const metrics = await register.metrics();

    return new NextResponse(metrics, {
      headers: {
        "Content-Type": register.contentType,
      },
    });
  } catch (error) {
    log.error({ err: error }, "[Metrics] Error generating metrics:");
    return jsonResponse({ error: "Failed to generate metrics" }, 500);
  }
}

export function trackAuthAttempt(status: "success" | "failed", method: string) {
  if (process.env.NODE_ENV === "production" && authenticationAttempts) {
    authenticationAttempts.inc({ status, method });
  }
}

export function trackActiveUser(role: string) {
  if (process.env.NODE_ENV === "production" && activeUsers) {
    activeUsers.inc({ role });
  }
}

export function trackDatabaseQuery(
  operation: string,
  model: string,
  duration: number
) {
  if (process.env.NODE_ENV === "production" && databaseQueryDuration) {
    databaseQueryDuration.observe({ operation, model }, duration);
  }
}
