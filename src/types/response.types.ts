export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
}
export interface ActionResponse<T = unknown> {
  /** Indicates if the operation was successful */
  success: boolean;
  /** Indicates if an error occurred during the operation */
  error: boolean;
  /** Optional data payload returned on successful operations */
  data: T;
  /** Human-readable description of the operation result */
  details: string;
}

export interface xyz<T = unknown> {
  success: boolean;
  data: T;
}

export interface AuthResponse {
  /** Indicates if the authentication operation was successful */
  success: boolean;
  details: string;
}

export interface HealthCheckResponse {
  /** System status indicator - 'ok' for healthy, 'error' for issues */
  status: "ok" | "error";
  details: string;
}

export interface FileUploadResponse {
  /** Public URL for accessing the uploaded file */
  url: string;
  /** Unique public identifier for the uploaded file */
  publicId: string;
  /** Type of resource (image, video, raw, etc.) */
  resourceType: string;
  /** File size in bytes */
  size: number;
}

export const createSuccessResponse = <T>(
  data: T,
  details: string = "Operation completed successfully"
): ActionResponse<T> => ({
  success: true,
  error: false,
  data,
  details,
});

export const createErrorResponse = (
  details: string = "An error occurred"
): ActionResponse => ({
  success: false,
  error: true,
  details,
  data: null,
});

export const createAuthResponse = (
  success: boolean,
  details: string
): AuthResponse => ({
  success,
  details,
});

export const createHealthResponse = (
  status: "ok" | "error",
  details: string
): HealthCheckResponse => ({
  status,
  details,
});
