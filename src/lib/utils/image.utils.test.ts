import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const load = async () => (await import("./image.utils")).ImageUtils;

describe("ImageUtils", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("with a configured bucket", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_MINIO_BUCKET", "bucket");
    });

    it.each([
      ["/api/images/bucket/shops/a.png", "shops/a.png"],
      ["shops/a.png", "shops/a.png"],
      ["/api/images/other/a.png", "/api/images/other/a.png"],
    ])("extractImageKey(%s) -> %s", async (value, expected) => {
      const ImageUtils = await load();

      expect(ImageUtils.extractImageKey(value)).toBe(expected);
    });

    it.each<[string | null | undefined, string]>([
      [undefined, "/placeholders/placeholder.png"],
      [null, "/placeholders/placeholder.png"],
      ["", "/placeholders/placeholder.png"],
      ["placeholder", "/placeholders/placeholder.png"],
      ["http://cdn/x.png", "http://cdn/x.png"],
      ["https://cdn/x.png", "https://cdn/x.png"],
      ["shops/a.png", "/api/images/bucket/shops/a.png"],
    ])("getImageUrl(%j) -> %s", async (key, expected) => {
      const ImageUtils = await load();

      expect(ImageUtils.getImageUrl(key)).toBe(expected);
    });

    it("processImageKeyForSubmission strips the URL prefix", async () => {
      const ImageUtils = await load();

      expect(
        ImageUtils.processImageKeyForSubmission(
          "/api/images/bucket/k.png",
          "fallback"
        )
      ).toBe("k.png");
    });

    it("processImageKeyForSubmission uses the fallback if extraction throws", async () => {
      const ImageUtils = await load();
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(ImageUtils, "extractImageKey").mockImplementation(() => {
        throw new Error("bad");
      });

      expect(ImageUtils.processImageKeyForSubmission("x", "fallback")).toBe(
        "fallback"
      );
    });
  });

  it("defaults to the campus-connect bucket", async () => {
    vi.stubEnv("NEXT_PUBLIC_MINIO_BUCKET", "");
    const ImageUtils = await load();

    expect(ImageUtils.getImageUrl("a.png")).toBe(
      "/api/images/campus-connect/a.png"
    );
  });
});
