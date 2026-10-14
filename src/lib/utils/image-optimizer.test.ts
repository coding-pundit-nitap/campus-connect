import { beforeEach, describe, expect, it, vi } from "vitest";

type Pipeline = {
  metadata: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>;
  jpeg: ReturnType<typeof vi.fn>;
  webp: ReturnType<typeof vi.fn>;
  toBuffer: ReturnType<typeof vi.fn>;
};

const sharpMock = vi.hoisted(() => {
  const pipeline = {} as Pipeline;
  const reset = () => {
    pipeline.metadata = vi.fn().mockResolvedValue({});
    pipeline.resize = vi.fn(() => pipeline);
    pipeline.jpeg = vi.fn(() => pipeline);
    pipeline.webp = vi.fn(() => pipeline);
    pipeline.toBuffer = vi.fn().mockResolvedValue(Buffer.from("out"));
  };
  reset();
  return { pipeline, reset, sharp: vi.fn(() => pipeline) };
});

vi.mock("sharp", () => ({ default: sharpMock.sharp }));

import {
  convertToWebP,
  getCompressionRatio,
  getImageMetadata,
  IMAGE_SIZES,
  isValidImage,
  optimizeForMobile,
  optimizeForOpenGraph,
  optimizeForProductDetail,
  optimizeForThumbnail,
  optimizeImage,
} from "./image-optimizer";

const input = Buffer.from("input-bytes");
const p = sharpMock.pipeline;

describe("image-optimizer", () => {
  beforeEach(() => {
    sharpMock.reset();
    sharpMock.sharp.mockClear();
  });

  describe("optimizeImage", () => {
    it("re-encodes small JPEGs without resizing", async () => {
      p.metadata.mockResolvedValue({ width: 800, format: "jpeg" });

      const out = await optimizeImage(input);

      expect(sharpMock.sharp).toHaveBeenCalledWith(input);
      expect(p.resize).not.toHaveBeenCalled();
      expect(p.jpeg).toHaveBeenCalledWith({ quality: 90, mozjpeg: true });
      expect(out).toEqual(Buffer.from("out"));
    });

    it.each([
      ["a larger JPEG", { width: 3000, format: "jpeg" }],
      ["a small PNG", { width: 100, format: "png" }],
      ["unknown dimensions", {}],
    ])("resizes and progressively encodes %s", async (_label, metadata) => {
      p.metadata.mockResolvedValue(metadata);

      await optimizeImage(input);

      expect(p.resize).toHaveBeenCalledWith(1200, null, {
        fit: "inside",
        position: "center",
        withoutEnlargement: true,
      });
      expect(p.jpeg).toHaveBeenCalledWith({
        quality: 90,
        mozjpeg: true,
        progressive: true,
      });
    });

    it("resizes by height alone when width is disabled", async () => {
      p.metadata.mockResolvedValue({ width: 100, format: "jpeg" });

      await optimizeImage(input, { width: null, height: 300, fit: "cover" });

      expect(p.resize).toHaveBeenCalledWith(
        null,
        300,
        expect.objectContaining({ fit: "cover" })
      );
    });

    it("skips resizing when neither dimension is set", async () => {
      await optimizeImage(input, { width: null, height: null, quality: 70 });

      expect(p.resize).not.toHaveBeenCalled();
      expect(p.jpeg).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 70, progressive: true })
      );
    });

    it("returns the original buffer when sharp fails", async () => {
      p.metadata.mockRejectedValue(new Error("corrupt"));

      await expect(optimizeImage(input)).resolves.toBe(input);
    });
  });

  it.each([
    [optimizeForOpenGraph, IMAGE_SIZES.OG, "cover"],
    [optimizeForProductDetail, IMAGE_SIZES.DETAIL, "inside"],
    [optimizeForThumbnail, IMAGE_SIZES.THUMBNAIL, "cover"],
    [optimizeForMobile, IMAGE_SIZES.MOBILE, "inside"],
  ] as const)("%o applies its preset", async (fn, size, fit) => {
    p.metadata.mockResolvedValue({ width: 5000, format: "png" });

    await fn(input);

    expect(p.resize).toHaveBeenCalledWith(
      size.width,
      size.height,
      expect.objectContaining({ fit })
    );
    expect(p.jpeg).toHaveBeenCalledWith(
      expect.objectContaining({ quality: size.quality })
    );
  });

  describe("getImageMetadata", () => {
    it("returns dimensions, format, alpha and byte size", async () => {
      p.metadata.mockResolvedValue({
        width: 10,
        height: 20,
        format: "png",
        hasAlpha: true,
      });

      await expect(getImageMetadata(input)).resolves.toEqual({
        width: 10,
        height: 20,
        format: "png",
        size: input.length,
        hasAlpha: true,
      });
    });

    it("returns null when the image cannot be read", async () => {
      p.metadata.mockRejectedValue(new Error("bad"));

      await expect(getImageMetadata(input)).resolves.toBeNull();
    });
  });

  it.each([
    [1000, 250, 75],
    [1000, 1000, 0],
    [3, 2, 33],
  ])("compression ratio of %i -> %i is %i%%", (a, b, expected) => {
    expect(getCompressionRatio(a, b)).toBe(expected);
  });

  describe("isValidImage", () => {
    it("is true when metadata can be read", async () => {
      await expect(isValidImage(input)).resolves.toBe(true);
    });

    it("is false when sharp rejects the buffer", async () => {
      p.metadata.mockRejectedValue(new Error("bad"));

      await expect(isValidImage(input)).resolves.toBe(false);
    });
  });

  describe("convertToWebP", () => {
    it("encodes WebP with the default quality", async () => {
      await expect(convertToWebP(input)).resolves.toEqual(Buffer.from("out"));
      expect(p.webp).toHaveBeenCalledWith({ quality: 85, effort: 6 });
    });

    it("accepts a custom quality", async () => {
      await convertToWebP(input, 50);

      expect(p.webp).toHaveBeenCalledWith({ quality: 50, effort: 6 });
    });

    it("returns the original buffer on failure", async () => {
      p.toBuffer.mockRejectedValue(new Error("bad"));

      await expect(convertToWebP(input)).resolves.toBe(input);
    });
  });
});
