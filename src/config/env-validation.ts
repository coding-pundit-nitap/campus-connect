import { z } from "zod";

/**
 * Environment variables schema for validation
 * Ensures all required environment variables are present and valid
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
  AUTH_URL: z.string().url("AUTH_URL must be a valid URL"),

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
  NEXT_PUBLIC_MINIO_ENDPOINT: z
    .string()
    .url("NEXT_PUBLIC_MINIO_ENDPOINT must be a valid URL"),

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
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
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

  // Check for production environment without HTTPS
  if (process.env.NODE_ENV === "production") {
    if (process.env.AUTH_URL?.startsWith("http://")) {
      warnings.push("AUTH_URL should use HTTPS in production");
    }


    if (process.env.NEXT_PUBLIC_MINIO_ENDPOINT?.startsWith("http://")) {
      warnings.push(
        "NEXT_PUBLIC_MINIO_ENDPOINT should use HTTPS in production"
      );
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Security warnings:");
    warnings.forEach((warning) => {
      console.warn(`  - ${warning}`);
    });


    if (process.env.NODE_ENV === "production") {
      console.error("❌ Security warnings found in production environment");
      process.exit(1);
    }
  }
}


export type Environment = z.infer<typeof envSchema>;
