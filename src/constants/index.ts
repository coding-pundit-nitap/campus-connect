/**
 * Validation error message constants for consistent user feedback.
 *
 * This constant object centralizes all validation error messages used throughout
 * the application's forms and validation logic. It ensures consistent messaging
 * across different components and provides a single source of truth for error
 * text that can be easily maintained and localized.
 *
 * @constant {Object} VALIDATION_MESSAGES
 * @property {string} EMAIL_REQUIRED - Error message when email field is empty
 * @property {string} EMAIL_INVALID - Error message for malformed email addresses
 * @property {string} PASSWORD_REQUIRED - Error message when password field is empty
 * @property {string} PASSWORD_MIN_LENGTH - Error message for passwords that are too short
 * @property {string} PASSWORD_MAX_LENGTH - Error message for passwords that are too long
 * @property {string} GENERIC_ERROR - Generic fallback error message for unexpected failures
 * @property {string} LOGIN_FAILED - Error message for failed authentication attempts
 *
 * @example
 * ```typescript
 * // Use in form validation schemas
 * const emailValidation = z.string()
 *   .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
 *   .email(VALIDATION_MESSAGES.EMAIL_INVALID);
 *
 * // Display error in components
 * {error && <ErrorMessage>{VALIDATION_MESSAGES.LOGIN_FAILED}</ErrorMessage>}
 * ```
 *
 * @see {@link loginSchema} for validation schema implementation
 * @see {@link SharedFormProps} for form error handling
 * @since 1.0.0
 */
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN_LENGTH: "Password must be at least 6 characters long",
  PASSWORD_MAX_LENGTH: "Password must be at most 100 characters long",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  LOGIN_FAILED: "Invalid email or password",
} as const;

/**
 * Form field name constants for consistent form field identification.
 *
 * This constant object provides standardized field names used across all forms
 * in the application. It ensures consistency in form field naming, prevents
 * typos in field references, and provides type safety when working with form
 * data structures and validation schemas.
 *
 * @constant {Object} FORM_FIELD_NAMES
 * @property {string} EMAIL - Field name for email input fields
 * @property {string} PASSWORD - Field name for password input fields
 * @property {string} CONFIRM_PASSWORD - Field name for password confirmation fields
 * @property {string} NAME - Field name for user name input fields
 * @property {string} PHONE - Field name for phone number input fields
 *
 * @example
 * ```typescript
 * // Use in form schemas
 * const formSchema = z.object({
 *   [FORM_FIELD_NAMES.EMAIL]: z.string().email(),
 *   [FORM_FIELD_NAMES.PASSWORD]: z.string().min(6),
 * });
 *
 * // Use in form field configurations
 * const loginFields = [
 *   { name: FORM_FIELD_NAMES.EMAIL, label: "Email", type: "email" },
 *   { name: FORM_FIELD_NAMES.PASSWORD, label: "Password", type: "password" }
 * ];
 * ```
 *
 * @see {@link FormFieldConfig} for form field configuration structure
 * @see {@link SharedFormProps} for form component implementation
 * @since 1.0.0
 */
export const FORM_FIELD_NAMES = {
  EMAIL: "email",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
  NAME: "name",
  PHONE: "phone",
} as const;
