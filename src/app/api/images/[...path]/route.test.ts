import { makeRequest, routeParams } from "@tests/helpers";
import { overrideEnv } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function S3Client() {
    return { send };
  }),
  GetObjectCommand: vi.fn(function GetObjectCommand(input: unknown) {
    return { input };
  }),
}));

import { GetObjectCommand } from "@aws-sdk/client-s3";

import { OPTIONS } from "./options";
import { GET } from "./route";

const call = () =>
  GET(makeRequest("/api/images/bucket/a/b.png"), {
    ...routeParams({ path: ["bucket", "a", "b.png"] }),
  });

const body = (bytes: number[]) => ({
  transformToByteArray: vi.fn(async () => new Uint8Array(bytes)),
});

describe("GET /api/images/[...path]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("streams the object with its content type and cache headers", async () => {
    send.mockResolvedValue({ Body: body([1, 2, 3]), ContentType: "image/png" });

    const res = await call();

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: "a/b.png",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual([1, 2, 3]);
  });

  it("falls back to application/octet-stream without a content type", async () => {
    send.mockResolvedValue({ Body: body([0]) });

    const res = await call();

    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
  });

  it("returns 500 when S3 returns no body", async () => {
    send.mockResolvedValue({});

    const res = await call();

    expect(res.status).toBe(500);
    expect(await res.text()).toBe("Internal server error");
  });

  it("returns 404 when the key does not exist", async () => {
    send.mockRejectedValue(
      Object.assign(new Error("x"), { name: "NoSuchKey" })
    );

    const res = await call();

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Image not found");
  });
});

describe("bucket selection", () => {
  it("falls back to the campus-connect bucket when none is configured", async () => {
    vi.resetModules();
    const { env } = await import("@/config/env.config");
    const restore = overrideEnv(env, { NEXT_PUBLIC_MINIO_BUCKET: "" });
    try {
      const route = await import("./route");
      const s3 = await import("@aws-sdk/client-s3");
      send.mockResolvedValue({ Body: body([0]) });

      await route.GET(makeRequest("/api/images/x/y.png"), {
        ...routeParams({ path: ["x", "y.png"] }),
      });

      expect(s3.GetObjectCommand).toHaveBeenLastCalledWith({
        Bucket: "campus-connect",
        Key: "y.png",
      });
    } finally {
      restore();
    }
  });
});

describe("OPTIONS /api/images/[...path]", () => {
  it("answers the CORS preflight with 204", async () => {
    const res = await OPTIONS();

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, HEAD, OPTIONS"
    );
  });
});
