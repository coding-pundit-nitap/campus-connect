/**
 * Response types module for the college connect application.
 *
 * This module provides standardized response interfaces and utility functions for
 * consistent API responses, authentication flows, health checks, and file uploads.
 * It ensures type safety and uniform error handling across the application.
 *
 */

/**
 * Generic response interface for API actions.
 *
 * Provides a standardized structure for all API responses including success/error
 * status, optional data payload, and descriptive details. Supports generic typing
 * for flexible data handling across different endpoints and operations.
 *
 * @template T - The type of data returned in successful responses
 *
 */
export interface ActionResponse<T = unknown> {
  /** Indicates if the operation was successful */
  success: boolean;
  /** Indicates if an error occurred during the operation */
  error: boolean;
  /** Optional data payload returned on successful operations */
  data?: T;
  /** Human-readable description of the operation result */
  details: string;
}

/**
 * Response interface for authentication operations.
 *
 * Provides a simplified response structure specifically for authentication
 * workflows including login, logout, registration, and token validation.
 * Focuses on success status and descriptive messaging without data payload.
 *
 */
export interface AuthResponse {
  /** Indicates if the authentication operation was successful */
  success: boolean;
  /** Human-readable description of the authentication result */
  details: string;
}

/**
 * Response interface for health check operations.
 *
 * Provides system status information for monitoring and diagnostics.
 * Used by health check endpoints to report application and service availability,
 * database connectivity, and overall system health status.
 *
 */
export interface HealthCheckResponse {
  /** System status indicator - 'ok' for healthy, 'error' for issues */
  status: "ok" | "error";
  /** Detailed description of the system status */
  details: string;
}

/**
 * Response interface for file upload operations.
 *
 * Contains metadata and access information for successfully uploaded files.
 * Provides essential file details including URLs, identifiers, and file
 * characteristics for subsequent file management and retrieval operations.
 *
 */
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

/**
 * Creates a standardized success response.
 *
 * Utility function for generating consistent success responses across the application.
 * Automatically sets success flags and provides optional data payload with
 * customizable success messages for improved user experience.
 *
 * @template T - The type of data to include in the response
 *
 * @param data - The data payload to include in the response
 * @param details - Optional success message (defaults to "Operation completed successfully")
 * @returns A properly formatted success response
 *
 */
export const createSuccessResponse = <T>(
  data: T,
  details: string = "Operation completed successfully"
): ActionResponse<T> => ({
  success: true,
  error: false,
  data,
  details,
});

/**
 * Creates a standardized error response.
 *
 * Utility function for generating consistent error responses across the application.
 * Automatically sets error flags and provides customizable error messages
 * for improved error handling and user feedback.
 *
 * @param details - Optional error message (defaults to "An error occurred")
 * @returns A properly formatted error response
 *
 */
export const createErrorResponse = (
  details: string = "An error occurred"
): ActionResponse => ({
  success: false,
  error: true,
  details,
});

/**
 * Creates a standardized authentication response.
 *
 * Utility function for generating consistent authentication responses across
 * login, logout, registration, and token validation endpoints. Provides
 * clear success/failure indication with descriptive messaging.
 *
 * @param success - Boolean indicating if the authentication operation succeeded
 * @param details - Descriptive message about the authentication result
 * @returns A properly formatted authentication response
 *
 */
export const createAuthResponse = (
  success: boolean,
  details: string
): AuthResponse => ({
  success,
  details,
});

/**
 * Creates a standardized health check response.
 *
 * Utility function for generating consistent health check responses for
 * monitoring and diagnostic endpoints. Provides system status indication
 * with detailed information about application health and service availability.
 *
 * @param status - System status ('ok' for healthy, 'error' for issues)
 * @param details - Detailed description of the system status
 * @returns A properly formatted health check response
 *
 */
export const createHealthResponse = (
  status: "ok" | "error",
  details: string
): HealthCheckResponse => ({
  status,
  details,
});
