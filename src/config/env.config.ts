import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(3000),
  NEXT_PUBLIC_APP_URL: z.string().default("https://connect.nitap.ac.in"),
  NEXT_PUBLIC_API_URL: z.string().default("/api"),
  NODE_ENV: z
    .enum(["development", "test", "production", "staging"])
    .default("development"),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_REGION: z.string().min(1),
  MINIO_ENDPOINT: z.string().min(1).default("http://localhost:9000"),
  MINIO_DOCKER_ENDPOINT: z.string().min(1).default("http://minio:9000"),
  NEXT_PUBLIC_MINIO_ENDPOINT: z.string().min(1),
  NEXT_PUBLIC_MINIO_BUCKET: z.string(),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  SMTP_HOST: z.string().min(1).default("smtp.gmail.com"),
  SMTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(587),
  SMTP_USER: z.email(),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.email().default("codingclub@nitap.ac.in"),

  MAX_SSE_CONNECTIONS_PER_USER: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(3),
  SSE_CONNECTION_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(300),
  SSE_HEARTBEAT_INTERVAL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(15000),
  SSE_REPLAY_USER_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(200),
  SSE_REPLAY_BROADCAST_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(100),

  DEFAULT_PAGE_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(10),
  MAX_PAGE_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(100),
  MAX_FILE_SIZE_MB: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(5),
  PRESIGNED_URL_EXPIRY: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(300),
  MAX_UNREAD_NOTIFICATIONS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(100),
  DEFAULT_NOTIFICATION_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(20),
  LOG_LEVEL: z.string().default("log"),
  REDIS_URL: z.string().default("redis://redis:6379"),
  REDIS_HOST: z.string().default("redis"),
});

export const env = envSchema.parse(process.env);

export const environment = {
  minioBaseUrl: `/api/images/${env.NEXT_PUBLIC_MINIO_BUCKET || "campus-connect"}`,
};
