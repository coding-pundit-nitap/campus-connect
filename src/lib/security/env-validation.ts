import { z } from "zod";

/**
 * Environment Validation Module
 * Ensures all required environment variables are present and valid with security checks
 */

const envSchema = z.object({
  // Next.js
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Authentication
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long"),
  AUTH_URL: z.url("AUTH_URL must be a valid URL"),

  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid database URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid database URL"),

  // MinIO S3-Compatible Storage
  MINIO_ROOT_USER: z
    .string()
    .min(3, "MINIO_ROOT_USER must be at least 3 characters"),
  MINIO_ROOT_PASSWORD: z
    .string()
    .min(8, "MINIO_ROOT_PASSWORD must be at least 8 characters"),
  NEXT_PUBLIC_MINIO_BUCKET: z.string().min(1, "MINIO_BUCKET is required"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .min(8, "AWS_SECRET_ACCESS_KEY must be at least 8 characters"),
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  MINIO_ENDPOINT: z.string().url("MINIO_ENDPOINT must be a valid URL"),
  NEXT_PUBLIC_MINIO_ENDPOINT: z.url(
    "NEXT_PUBLIC_MINIO_ENDPOINT must be a valid URL"
  ),

  // Application
  NEXT_PUBLIC_API_URL: z.string().default("/api"),
});

/**
 * Validated and typed environment variables
 */
let _env: z.infer<typeof envSchema> | undefined;

export function getEnv(): z.infer<typeof envSchema> {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

/**
 * Validate environment variables on startup
 * This should be called early in the application lifecycle
 */
export function validateEnvironment(): void {
  try {
    envSchema.parse(process.env);
    console.log("✅ Environment variables validated successfully");
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error instanceof z.ZodError) {
      z.treeifyError(error).errors.forEach((err) => {
        console.error(`  -  ${err}`);
      });
    }
    process.exit(1);
  }
}

/**
 * Security warnings for development environment
 */
export function checkSecurityWarnings(): void {
  const warnings: string[] = [];
  const criticalIssues: string[] = [];

  // Check for weak secrets
  if (process.env.AUTH_SECRET === "your-super-secret-for-auth") {
    warnings.push("AUTH_SECRET is using the default example value");
  }

  if (process.env.MINIO_ROOT_PASSWORD === "minioadmin") {
    warnings.push("MINIO_ROOT_PASSWORD is using the default insecure value");
  }

  if (process.env.AWS_SECRET_ACCESS_KEY === "minioadmin") {
    warnings.push("AWS_SECRET_ACCESS_KEY is using the default insecure value");
  }

  // Check for production environment security
  if (process.env.NODE_ENV === "production") {
    if (process.env.AUTH_URL?.startsWith("http://")) {
      criticalIssues.push("AUTH_URL should use HTTPS in production");
    }

    // Allow HTTP MinIO endpoint for local production testing
    // In real production deployment, this should use HTTPS
    if (
      process.env.NEXT_PUBLIC_MINIO_ENDPOINT?.startsWith("http://") &&
      !process.env.NEXT_PUBLIC_MINIO_ENDPOINT.includes("localhost") &&
      !process.env.NEXT_PUBLIC_MINIO_ENDPOINT.includes("127.0.0.1")
    ) {
      criticalIssues.push(
        "NEXT_PUBLIC_MINIO_ENDPOINT should use HTTPS in production"
      );
    }

    // Check secret strength in production
    if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 64) {
      criticalIssues.push(
        "AUTH_SECRET should be at least 64 characters in production"
      );
    }

    // Check for common weak passwords
    const weakPasswords = ["password", "123456", "admin", "secret"];
    if (
      weakPasswords.some((weak) =>
        process.env.MINIO_ROOT_PASSWORD?.includes(weak)
      )
    ) {
      criticalIssues.push(
        "MINIO_ROOT_PASSWORD appears to contain common weak patterns"
      );
    }
  }

  // Additional security checks
  checkSecretEntropy();
  checkEnvironmentLeakage();

  if (criticalIssues.length > 0) {
    console.error("🚨 CRITICAL SECURITY ISSUES:");
    criticalIssues.forEach((issue) => {
      console.error(`  - ${issue}`);
    });

    if (process.env.NODE_ENV === "production") {
      console.error(
        "❌ Critical security issues found in production environment"
      );
      process.exit(1);
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Security warnings:");
    warnings.forEach((warning) => {
      console.warn(`  - ${warning}`);
    });
  }

  if (criticalIssues.length === 0 && warnings.length === 0) {
    console.log("✅ Security checks passed");
  }
}

/**
 * Check entropy of secret values
 */
function checkSecretEntropy(): void {
  const secrets = [
    { name: "AUTH_SECRET", value: process.env.AUTH_SECRET },
    { name: "MINIO_ROOT_PASSWORD", value: process.env.MINIO_ROOT_PASSWORD },
    { name: "AWS_SECRET_ACCESS_KEY", value: process.env.AWS_SECRET_ACCESS_KEY },
  ];

  secrets.forEach(({ name, value }) => {
    if (value && calculateEntropy(value) < 3.0) {
      console.warn(
        `⚠️  ${name} has low entropy (randomness). Consider using a more random value.`
      );
    }
  });
}

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(str: string): number {
  const len = str.length;
  const frequencies: Record<string, number> = {};

  // Count character frequencies
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Calculate entropy
  let entropy = 0;
  for (const freq of Object.values(frequencies)) {
    const probability = freq / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Check for potential environment variable leakage
 */
function checkEnvironmentLeakage(): void {
  const sensitivePatterns = [/password/i, /secret/i, /key/i, /token/i, /auth/i];

  // Check if any public environment variables contain sensitive information
  const publicVars = Object.keys(process.env).filter((key) =>
    key.startsWith("NEXT_PUBLIC_")
  );

  publicVars.forEach((varName) => {
    if (sensitivePatterns.some((pattern) => pattern.test(varName))) {
      console.warn(
        `⚠️  Public environment variable ${varName} may contain sensitive information`
      );
    }
  });
}

/**
 * Environment-specific security configuration
 */
export function getSecurityConfig() {
  const env = getEnv();

  return {
    isProduction: env.NODE_ENV === "production",
    isDevelopment: env.NODE_ENV === "development",
    isTest: env.NODE_ENV === "test",

    // Security settings based on environment
    enforceHTTPS: env.NODE_ENV === "production",
    enableCSP: env.NODE_ENV === "production",
    strictCookies: env.NODE_ENV === "production",
    enableHSTS: env.NODE_ENV === "production",

    // Rate limiting
    rateLimitStrict: env.NODE_ENV === "production",

    // Logging
    verboseLogging: env.NODE_ENV === "development",
    enableSecurityHeaders: true,
  };
}

/**
 * Validate specific environment configuration for security features
 */
export function validateSecurityEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const env = getEnv();

    // Database security checks
    if (
      env.DATABASE_URL.includes("password=") &&
      env.DATABASE_URL.includes("password=password")
    ) {
      errors.push("Database contains weak password");
    }

    // MinIO security checks
    if (env.MINIO_ROOT_USER === "admin") {
      warnings.push("Using default MinIO username");
    }

    // Auth security checks
    if (env.AUTH_SECRET.length < 32) {
      errors.push("AUTH_SECRET is too short");
    }

    // URL security checks
    if (env.NODE_ENV === "production") {
      if (!env.AUTH_URL.startsWith("https://")) {
        errors.push("AUTH_URL must use HTTPS in production");
      }

      if (
        !env.NEXT_PUBLIC_MINIO_ENDPOINT.startsWith("https://") &&
        !env.NEXT_PUBLIC_MINIO_ENDPOINT.includes("localhost") &&
        !env.NEXT_PUBLIC_MINIO_ENDPOINT.includes("127.0.0.1")
      ) {
        errors.push("MINIO_ENDPOINT must use HTTPS in production");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Environment validation failed: ${error}`],
      warnings: [],
    };
  }
}

export type Environment = z.infer<typeof envSchema>;
export type SecurityConfig = ReturnType<typeof getSecurityConfig>;
