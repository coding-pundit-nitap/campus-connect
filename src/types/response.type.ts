export interface ActionResponse<T = unknown> {
  success: boolean;
  error: boolean;
  data?: T;
  details: string;
}

export interface AuthResponse {
  success: boolean;
  details: string;
}

export interface HealthCheckResponse {
  status: "ok" | "error";
  details: string;
}

export interface FileUploadResponse {
  url: string;
  publicId: string;
  resourceType: string;
  size: number;
}

export const createSuccessResponse = <T>(
  data: T,
  details: string = "Operation completed successfully",
): ActionResponse<T> => ({
  success: true,
  error: false,
  data,
  details,
});

export const createErrorResponse = (
  details: string = "An error occurred",
): ActionResponse => ({
  success: false,
  error: true,
  details,
});

export const createAuthResponse = (
  success: boolean,
  details: string,
): AuthResponse => ({
  success,
  details,
});

export const createHealthResponse = (
  status: "ok" | "error",
  details: string,
): HealthCheckResponse => ({
  status,
  details,
});
