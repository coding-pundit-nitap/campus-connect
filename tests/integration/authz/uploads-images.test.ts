// Uploads (POST /api/upload) and the image proxy (GET /api/images/...).
// Upload: raster images only, no traversal, server-chosen key.
// Proxy: public, no traversal, only raster images rendered inline.
import { S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as GET_IMAGE } from "../../../src/app/api/images/[...path]/route";
import { POST as POST_UPLOAD } from "../../../src/app/api/upload/route";
import { createUser } from "../../factories";
import { jsonReq, params, req } from "../../helpers/authz";
import { asAnonymous, asUser } from "../../setup/auth";

const upload = (body: Record<string, unknown>) =>
  POST_UPLOAD(jsonReq("/api/upload", "POST", body));

const PNG = { fileName: "photo.png", fileType: "image/png", fileSize: 2048 };

describe("uploads accept only raster images under a server-chosen key", () => {
  it("a signed-in user gets a presigned URL for a PNG, under the requested folder, with a random name", async () => {
    asUser(await createUser());
    const first = await upload({ ...PNG, prefix: "profile-images" });
    const second = await upload({ ...PNG, prefix: "profile-images" });
    expect(first.status).toBe(200);

    const a = (await first.json()).data.objectKey as string;
    const b = (await second.json()).data.objectKey as string;
    expect(a).toMatch(/^profile-images\/[0-9a-f-]{36}\.png$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain("photo");
  });

  it.each([
    ["SVG (can carry script)", "logo.svg", "image/svg+xml"],
    ["HTML", "page.html", "text/html"],
    ["JavaScript", "x.js", "application/javascript"],
    ["PDF", "doc.pdf", "application/pdf"],
    ["image type with a script extension", "x.php", "image/png"],
  ])(
    "%s is rejected with 400 and no URL is issued",
    async (_label, fileName, fileType) => {
      asUser(await createUser());
      const res = await upload({ fileName, fileType, fileSize: 100 });
      expect(res.status).toBe(400);
      expect(await res.text()).not.toContain("presignedUrl");
    }
  );

  it.each(["../photo.png", "a/../../photo.png", "dir/photo.png"])(
    "file name %s (path syntax) is rejected with 400",
    async (fileName) => {
      asUser(await createUser());
      const res = await upload({ ...PNG, fileName });
      expect(res.status).toBe(400);
    }
  );

  it.each([
    "..",
    "../shop-images",
    "shop-images/other-shop",
    "a\\b",
    "/abs",
    "",
  ])("upload folder %j (path syntax) is rejected with 400", async (prefix) => {
    asUser(await createUser());
    const res = await upload({ ...PNG, prefix });
    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain("presignedUrl");
  });

  it("files over the size limit are rejected with 400", async () => {
    asUser(await createUser());
    const res = await upload({ ...PNG, fileSize: 6 * 1024 * 1024 });
    expect(res.status).toBe(400);
  });
});

function stubS3(contentType: string | undefined) {
  return vi.spyOn(S3Client.prototype, "send").mockImplementation((async () => ({
    ContentType: contentType,
    Body: {
      transformToByteArray: async () => new Uint8Array([1, 2, 3]),
    },
  })) as never);
}

const getImage = (path: string[]) =>
  GET_IMAGE(req(`/api/images/${path.join("/")}`), params({ path }));

describe("the image proxy", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serves a stored PNG to an anonymous visitor with its image type", async () => {
    const send = stubS3("image/png");
    asAnonymous();

    const res = await getImage(["test-bucket", "shop-images", "a.png"]);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each([
    [["test-bucket", "..", "other-bucket", "secret.png"]],
    [["test-bucket", "shop-images", "..", "..", "x"]],
    [["test-bucket", ".", "a.png"]],
    [["test-bucket", "a\\..\\b.png"]],
    [["test-bucket"]],
  ])(
    "traversal path %j is rejected with 400 before storage is touched",
    async (path) => {
      const send = stubS3("image/png");
      const res = await getImage(path);
      expect(res.status).toBe(400);
      expect(send).not.toHaveBeenCalled();
    }
  );

  it.each(["text/html", "image/svg+xml", "application/javascript", undefined])(
    "an object stored as %s is never rendered inline (served as an attachment)",
    async (contentType) => {
      stubS3(contentType);
      const res = await getImage(["test-bucket", "general", "x.png"]);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/octet-stream");
      expect(res.headers.get("content-disposition")).toBe("attachment");
    }
  );
});
