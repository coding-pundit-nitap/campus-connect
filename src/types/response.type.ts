/**
 * Response types module for the college connect application.
 *
 * This module provides standardized response interfaces and utility functions for
 * consistent API responses, authentication flows, health checks, and file uploads.
 * It ensures type safety and uniform error handling across the application.
 *
 * @example
 * ```typescript
 * // Create success response
 * const response = createSuccessResponse(
 *   { id: '123', name: 'John' },
 *   'User created successfully'
 * );
 *
 * // Create error response
 * const errorResponse = createErrorResponse('Validation failed');
 *
 * // Create auth response
 * const authResponse = createAuthResponse(true, 'Login successful');
 * ```
 *
 * @since 1.0.0
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
 * @example
 * ```typescript
 * // User creation response
 * const userResponse: ActionResponse<User> = {
 *   success: true,
 *   error: false,
 *   data: { id: '123', name: 'John Doe', email: 'john@college.edu' },
 *   details: 'User created successfully'
 * };
 *
 * // Error response
 * const errorResponse: ActionResponse = {
 *   success: false,
 *   error: true,
 *   details: 'Email already exists'
 * };
 * ```
 *
 * @see {@link createSuccessResponse} for creating success responses
 * @see {@link createErrorResponse} for creating error responses
 *
 * @since 1.0.0
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
 * @example
 * ```typescript
 * // Successful login
 * const loginResponse: AuthResponse = {
 *   success: true,
 *   details: 'Login successful. Welcome back!'
 * };
 *
 * // Failed authentication
 * const failedAuth: AuthResponse = {
 *   success: false,
 *   details: 'Invalid credentials provided'
 * };
 * ```
 *
 * @see {@link createAuthResponse} for creating auth responses
 *
 * @since 1.0.0
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
 * @example
 * ```typescript
 * // Healthy system
 * const healthyResponse: HealthCheckResponse = {
 *   status: 'ok',
 *   details: 'All systems operational'
 * };
 *
 * // System error
 * const errorResponse: HealthCheckResponse = {
 *   status: 'error',
 *   details: 'Database connection failed'
 * };
 * ```
 *
 * @see {@link createHealthResponse} for creating health check responses
 *
 * @since 1.0.0
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
 * @example
 * ```typescript
 * // Image upload response
 * const uploadResponse: FileUploadResponse = {
 *   url: 'https://cloudinary.com/image/upload/v123/sample.jpg',
 *   publicId: 'sample_abc123',
 *   resourceType: 'image',
 *   size: 1024576
 * };
 *
 * // Document upload response
 * const docResponse: FileUploadResponse = {
 *   url: 'https://storage.com/docs/report.pdf',
 *   publicId: 'report_xyz789',
 *   resourceType: 'raw',
 *   size: 2048000
 * };
 * ```
 *
 * @since 1.0.0
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
 * @example
 * ```typescript
 * // User creation success
 * const userResponse = createSuccessResponse(
 *   { id: '123', name: 'John Doe' },
 *   'User account created successfully'
 * );
 *
 * // Simple success without custom message
 * const simpleResponse = createSuccessResponse({ count: 42 });
 *
 * // Array data response
 * const listResponse = createSuccessResponse(
 *   [{ id: '1' }, { id: '2' }],
 *   'Products retrieved successfully'
 * );
 * ```
 *
 * @see {@link ActionResponse} for response structure
 * @see {@link createErrorResponse} for error response creation
 *
 * @since 1.0.0
 */
export const createSuccessResponse = <T>(
  data: T,
  details: string = "Operation completed successfully",
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
 * @example
 * ```typescript
 * // Validation error
 * const validationError = createErrorResponse(
 *   'Email format is invalid'
 * );
 *
 * // Database error
 * const dbError = createErrorResponse(
 *   'Failed to save user data'
 * );
 *
 * // Generic error with default message
 * const genericError = createErrorResponse();
 * ```
 *
 * @see {@link ActionResponse} for response structure
 * @see {@link createSuccessResponse} for success response creation
 *
 * @since 1.0.0
 */
export const createErrorResponse = (
  details: string = "An error occurred",
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
 * @example
 * ```typescript
 * // Successful login
 * const loginSuccess = createAuthResponse(
 *   true,
 *   'Welcome back! Login successful.'
 * );
 *
 * // Failed login attempt
 * const loginFailed = createAuthResponse(
 *   false,
 *   'Invalid email or password'
 * );
 *
 * // Token validation success
 * const tokenValid = createAuthResponse(
 *   true,
 *   'Access token is valid'
 * );
 * ```
 *
 * @see {@link AuthResponse} for response structure
 *
 * @since 1.0.0
 */
export const createAuthResponse = (
  success: boolean,
  details: string,
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
 * @example
 * ```typescript
 * // Healthy system
 * const healthySystem = createHealthResponse(
 *   'ok',
 *   'All services running normally'
 * );
 *
 * // Database connection issue
 * const dbIssue = createHealthResponse(
 *   'error',
 *   'Database connection timeout'
 * );
 *
 * // Partial service degradation
 * const degraded = createHealthResponse(
 *   'error',
 *   'Email service temporarily unavailable'
 * );
 * ```
 *
 * @see {@link HealthCheckResponse} for response structure
 *
 * @since 1.0.0
 */
export const createHealthResponse = (
  status: "ok" | "error",
  details: string,
): HealthCheckResponse => ({
  status,
  details,
});
