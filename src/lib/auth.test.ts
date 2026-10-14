import { describe, expect, it } from "vitest";

import { handleActionError, hashPassword, verifyPassword } from "./auth";

describe("handleActionError", () => {
  it("returns the message of an Error", () => {
    expect(handleActionError(new Error("boom"))).toBe("boom");
  });

  it("returns a thrown string as-is", () => {
    expect(handleActionError("plain failure")).toBe("plain failure");
  });

  it.each([[{ code: 1 }], [null], [undefined], [42]])(
    "falls back to the default message for %j",
    (error) => {
      expect(handleActionError(error)).toBe("An unexpected error occurred");
    }
  );

  it("uses a caller-supplied default message", () => {
    expect(handleActionError({}, "Login failed")).toBe("Login failed");
  });
});

describe("hashPassword / verifyPassword", () => {
  it("produces a base64 hash of salt + derived key (48 bytes)", async () => {
    const hash = await hashPassword("S3cret!pw");

    expect(atob(hash)).toHaveLength(48);
  });

  it("salts every hash so identical passwords differ", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same"),
      hashPassword("same"),
    ]);

    expect(a).not.toBe(b);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("S3cret!pw");

    await expect(verifyPassword("S3cret!pw", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("S3cret!pw");

    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("rejects a hash whose stored key has the wrong length", async () => {
    const shortHash = btoa("x".repeat(20));

    await expect(verifyPassword("anything", shortHash)).resolves.toBe(false);
  });

  it("returns false instead of throwing for a non-base64 hash", async () => {
    await expect(verifyPassword("anything", "%%%not-base64%%%")).resolves.toBe(
      false
    );
  });
});
