import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production", "staging"])
    .default("development"),
  DATABASE_URL: z.string().default(""),
  LOG_LEVEL: z.string().default("info"),
  REDIS_URL: z.string().default("redis://redis:6379"),
  REDIS_HOST: z.string().default("redis"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  ALERT_EMAIL_FROM: z.string().default(""),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default(""),
  MINIO_ENDPOINT: z.string().default("http://localhost:9000"),
  AWS_ACCESS_KEY_ID: z.string().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().default(""),
  AWS_REGION: z.string().default("us-east-1"),
  NEXT_PUBLIC_MINIO_BUCKET: z.string().default("campus-connect"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid worker environment variables:",
    parsed.error.format()
  );
  throw new Error("Invalid worker environment variables");
}

export const env = parsed.data;
