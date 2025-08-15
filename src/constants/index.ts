export const USER_ROLES = {
  CUSTOMER: "customer",
  STAFF: "staff",
  ADMIN: "admin",
} as const;

export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN_LENGTH: "Password must be at least 6 characters long",
  PASSWORD_MAX_LENGTH: "Password must be at most 100 characters long",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  LOGIN_FAILED: "Invalid email or password",
} as const;

export const FORM_FIELD_NAMES = {
  EMAIL: "email",
  PASSWORD: "password",
  CONFIRM_PASSWORD: "confirmPassword",
  NAME: "name",
  PHONE: "phone",
} as const;
