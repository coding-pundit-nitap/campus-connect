import { AxiosError } from "axios";

import axiosInstance from "@/lib/axios";
import { ActionResponse } from "@/types";

export interface DatabaseStatus {
  status: "healthy" | "unhealthy" | "unreachable";
  latency?: number;
  details: string;
}

interface HealthCheckPayload {
  status: "healthy";
  latency: number;
}

class HealthCheckAPIService {
  private consecutiveFailures = 0;
  private lastFailureTime?: number;
  private readonly maxFailures = 5;
  private readonly backoffDuration = 60000;

  checkDatabase = async (): Promise<DatabaseStatus> => {
    if (this.consecutiveFailures >= this.maxFailures) {
      const now = Date.now();
      if (
        this.lastFailureTime &&
        now - this.lastFailureTime < this.backoffDuration
      ) {
        return {
          status: "unreachable",
          details: `Health check temporarily disabled due to ${this.consecutiveFailures} consecutive failures. Will retry after cooldown.`,
        };
      } else {
        // Reset after backoff period
        this.consecutiveFailures = 0;
        this.lastFailureTime = undefined;
      }
    }

    try {
      const response = await axiosInstance.get<
        ActionResponse<HealthCheckPayload>
      >("/health/database", {
        timeout: 5000,
      });

      const payload = response.data;

      if (payload.success && payload.data) {
        this.consecutiveFailures = 0;
        this.lastFailureTime = undefined;

        return {
          status: "healthy",
          latency: payload.data.latency,
          details: payload.details,
        };
      }

      this.recordFailure();
      return {
        status: "unhealthy",
        details: payload.details || "API returned a non-success response.",
      };
    } catch (error) {
      this.recordFailure();

      if (error instanceof AxiosError) {
        if (
          error.code === "ECONNABORTED" ||
          error.name === "TimeoutError" ||
          !error.response
        ) {
          return {
            status: "unreachable",
            details:
              "The server could not be reached (timeout or network error).",
          };
        }
        if (error.response?.status === 503) {
          return {
            status: "unhealthy",
            details: "The database is currently unavailable.",
          };
        }
      }
      return {
        status: "unhealthy",
        details: "An unknown error occurred during the health check.",
      };
    }
  };

  private recordFailure() {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
  }

  // Allow manual reset of circuit breaker
  resetCircuitBreaker() {
    this.consecutiveFailures = 0;
    this.lastFailureTime = undefined;
  }
}

export const healthCheckAPIService = new HealthCheckAPIService();

export default healthCheckAPIService;
