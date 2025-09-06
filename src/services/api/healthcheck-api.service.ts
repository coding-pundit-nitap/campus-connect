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
  checkDatabase = async (): Promise<DatabaseStatus> => {
    try {
      const response = await axiosInstance.get<
        ActionResponse<HealthCheckPayload>
      >("/health/database", { timeout: 10000 });

      const payload = response.data;

      if (payload.success && payload.data) {
        return {
          status: "healthy",
          latency: payload.data.latency,
          details: payload.details,
        };
      }

      return {
        status: "unhealthy",
        details: payload.details || "API returned a non-success response.",
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === "ECONNABORTED" || !error.response) {
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
}

export const healthCheckAPIService = new HealthCheckAPIService();

export default healthCheckAPIService;
