import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { describe, expect, it, type Mock, vi } from "vitest";

import {
  cleanupOrphanedFiles,
  createKeyReferenceChecker,
  createS3KeyStore,
  type OrphanCleanupDeps,
  parseCliArgs,
} from "./orphaned-files.js";

type LogFn = (...data: unknown[]) => void;

async function* keysOf(keys: string[]): AsyncGenerator<string> {
  yield* keys;
}

function makeDeps(
  keys: string[],
  referenced: string[] = []
): OrphanCleanupDeps & {
  deleteFile: Mock<(key: string) => Promise<void>>;
  console: { log: Mock<LogFn>; error: Mock<LogFn> };
} {
  return {
    listKeys: () => keysOf(keys),
    isKeyReferenced: vi.fn(async (key: string) => referenced.includes(key)),
    deleteFile: vi.fn(async (_key: string) => undefined),
    bucketName: "bucket",
    batchSize: 100,
    console: { log: vi.fn<LogFn>(), error: vi.fn<LogFn>() },
  };
}

const logged = (deps: ReturnType<typeof makeDeps>) =>
  deps.console.log.mock.calls.map(([line]) => String(line));

describe("parseCliArgs", () => {
  it.each([
    [["node", "script"], false],
    [["node", "script", "--dry-run"], true],
    [["node", "script", "--verbose", "--dry-run"], true],
    [["--dry-run", "script"], false],
  ])("parses %j as dryRun=%s", (argv, dryRun) => {
    expect(parseCliArgs(argv)).toEqual({ dryRun });
  });
});

describe("cleanupOrphanedFiles", () => {
  it("reports orphans without deleting anything in dry-run mode", async () => {
    const deps = makeDeps(["a.png", "b.png", "c.png"], ["b.png"]);

    const result = await cleanupOrphanedFiles(true, deps);

    expect(result).toEqual({
      totalFilesScanned: 3,
      orphanedCount: 2,
      deletedCount: 0,
      errorCount: 0,
    });
    expect(deps.deleteFile).not.toHaveBeenCalled();
    expect(logged(deps)).toEqual(
      expect.arrayContaining([
        "   Mode: DRY RUN",
        "   Bucket: bucket",
        "   Batch size: 100",
        "   🔸 Orphaned: a.png",
        "   🔸 Orphaned: c.png",
        "   Files scanned: 3",
        "   Orphaned files: 2",
      ])
    );
    expect(logged(deps)).not.toContain("   Deleted: 0");
  });

  it("deletes only unreferenced keys in live mode", async () => {
    const deps = makeDeps(["a.png", "b.png"], ["b.png"]);

    const result = await cleanupOrphanedFiles(false, deps);

    expect(deps.deleteFile.mock.calls).toEqual([["a.png"]]);
    expect(result).toEqual({
      totalFilesScanned: 2,
      orphanedCount: 1,
      deletedCount: 1,
      errorCount: 0,
    });
    expect(logged(deps)).toEqual(
      expect.arrayContaining([
        "   Mode: LIVE",
        "   ✓ Deleted: a.png",
        "   Deleted: 1",
        "   Errors: 0",
      ])
    );
  });

  it.each([
    ["an Error", new Error("access denied"), "access denied"],
    ["a non-Error value", "timeout", "timeout"],
  ])(
    "counts and logs delete failures thrown as %s, then continues",
    async (_label, thrown, text) => {
      const deps = makeDeps(["a.png", "b.png"]);
      deps.deleteFile.mockRejectedValueOnce(thrown);

      const result = await cleanupOrphanedFiles(false, deps);

      expect(result).toMatchObject({ deletedCount: 1, errorCount: 1 });
      expect(deps.console.error).toHaveBeenCalledWith(
        `   ✗ Failed: a.png - ${text}`
      );
    }
  );

  it("logs progress every 100 scanned files", async () => {
    const keys = Array.from({ length: 200 }, (_, i) => `k${i}`);
    const deps = makeDeps(keys, keys);

    await cleanupOrphanedFiles(true, deps);

    const progress = logged(deps).filter((l) => l.includes("Scanned "));
    expect(progress).toEqual([
      "   Scanned 100 files...",
      "   Scanned 200 files...",
    ]);
  });

  it("handles an empty bucket", async () => {
    const deps = makeDeps([]);

    await expect(cleanupOrphanedFiles(false, deps)).resolves.toEqual({
      totalFilesScanned: 0,
      orphanedCount: 0,
      deletedCount: 0,
      errorCount: 0,
    });
  });

  it("propagates listing failures", async () => {
    const deps = makeDeps([]);
    deps.listKeys = async function* () {
      throw new Error("bucket missing");
    };

    await expect(cleanupOrphanedFiles(true, deps)).rejects.toThrow(
      "bucket missing"
    );
  });
});

describe("createS3KeyStore", () => {
  it("pages through the bucket and yields only defined keys", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        Contents: [{ Key: "a" }, { Key: undefined }, { Key: "b" }],
        NextContinuationToken: "t1",
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Contents: [{ Key: "c" }] });
    const store = createS3KeyStore({ send }, "bucket", 2);

    const keys: string[] = [];
    for await (const key of store.listKeys()) keys.push(key);

    expect(keys).toEqual(["a", "b"]);
    expect(send).toHaveBeenCalledTimes(2);
    const [first, second] = send.mock.calls.map(([cmd]) => cmd);
    expect(first).toBeInstanceOf(ListObjectsV2Command);
    expect(first.input).toEqual({
      Bucket: "bucket",
      ContinuationToken: undefined,
      MaxKeys: 2,
    });
    expect(second.input).toMatchObject({ ContinuationToken: "t1" });
  });

  it("deletes an object by key", async () => {
    const send = vi.fn();
    const store = createS3KeyStore({ send }, "bucket", 2);

    await store.deleteFile("a.png");

    const [cmd] = send.mock.calls[0];
    expect(cmd).toBeInstanceOf(DeleteObjectCommand);
    expect(cmd.input).toEqual({ Bucket: "bucket", Key: "a.png" });
  });
});

describe("createKeyReferenceChecker", () => {
  const db = (shop: number, product: number, user: number) => ({
    shop: { count: vi.fn().mockResolvedValue(shop) },
    product: { count: vi.fn().mockResolvedValue(product) },
    user: { count: vi.fn().mockResolvedValue(user) },
  });

  it("queries shop images, shop QR codes, products and user avatars", async () => {
    const client = db(0, 0, 0);

    await createKeyReferenceChecker(client as never)("k");

    expect(client.shop.count).toHaveBeenCalledWith({
      where: { OR: [{ image_key: "k" }, { qr_image_key: "k" }] },
    });
    expect(client.product.count).toHaveBeenCalledWith({
      where: { image_key: "k" },
    });
    expect(client.user.count).toHaveBeenCalledWith({ where: { image: "k" } });
  });

  it.each([
    [[1, 0, 0], true],
    [[0, 1, 0], true],
    [[0, 0, 1], true],
    [[0, 0, 0], false],
  ])("counts %j mean referenced=%s", async ([s, p, u], expected) => {
    await expect(
      createKeyReferenceChecker(db(s, p, u) as never)("k")
    ).resolves.toBe(expected);
  });
});
