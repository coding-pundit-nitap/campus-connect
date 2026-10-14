import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("dotenv/config", () => ({}));

const ORIGINAL_ENV = { ...process.env };

async function loadEnv() {
  vi.resetModules();
  return (await import("./env.js")).env;
}

describe("worker env", () => {
  const setEnv = (vars: Record<string, string>) => {
    process.env = vars as NodeJS.ProcessEnv;
  };

  beforeEach(() => {
    setEnv({});
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("applies defaults when variables are unset", async () => {
    const env = await loadEnv();

    expect(env).toMatchObject({
      NODE_ENV: "development",
      DATABASE_URL: "",
      LOG_LEVEL: "info",
      REDIS_URL: "redis://redis:6379",
      REDIS_HOST: "redis",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      MINIO_ENDPOINT: "http://localhost:9000",
      AWS_REGION: "us-east-1",
      NEXT_PUBLIC_MINIO_BUCKET: "campus-connect",
    });
  });

  it("reads values from process.env", async () => {
    setEnv({
      NODE_ENV: "production",
      REDIS_URL: "redis://cache:6380",
      VAPID_SUBJECT: "mailto:a@b.c",
    });

    const env = await loadEnv();

    expect(env).toMatchObject({
      NODE_ENV: "production",
      REDIS_URL: "redis://cache:6380",
      VAPID_SUBJECT: "mailto:a@b.c",
    });
  });

  it("throws on an invalid NODE_ENV", async () => {
    setEnv({ NODE_ENV: "qa" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadEnv()).rejects.toThrow(
      "Invalid worker environment variables"
    );
    expect(error).toHaveBeenCalledWith(
      "❌ Invalid worker environment variables:",
      expect.anything()
    );
  });
});
