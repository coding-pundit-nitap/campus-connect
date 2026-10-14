import { makeRequest, readJson } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { userRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET, PUT } from "./route";

const auth = vi.mocked(authUtils);
const users = vi.mocked(userRepository);

describe("GET /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserData.mockResolvedValue({ email: "a@b.c" } as never);
  });

  it("returns the user with addresses", async () => {
    users.findByEmail.mockResolvedValue({ id: "u1", addresses: [] } as never);

    expect(await readJson(await GET())).toEqual({
      status: 200,
      body: { id: "u1", addresses: [] },
    });
    expect(users.findByEmail).toHaveBeenCalledWith("a@b.c", {
      include: { addresses: true },
    });
  });

  it("returns 500 when lookup fails", async () => {
    users.findByEmail.mockRejectedValue(new Error("db"));

    expect(await readJson(await GET())).toEqual({
      status: 500,
      body: { error: "Internal error" },
    });
  });
});

describe("PUT /api/users/me", () => {
  const put = (body: unknown) =>
    PUT(makeRequest("/api/users/me", { method: "PUT", body }));

  beforeEach(() => {
    vi.clearAllMocks();
    auth.getUserId.mockResolvedValue("u1");
  });

  it("updates the user with the validated fields", async () => {
    users.update.mockResolvedValue({ id: "u1", name: "Alice" } as never);

    expect(await readJson(await put({ name: "Alice", extra: 1 }))).toEqual({
      status: 200,
      body: { id: "u1", name: "Alice" },
    });
    expect(users.update).toHaveBeenCalledWith("u1", { name: "Alice" });
  });

  it("returns 400 for invalid fields", async () => {
    const res = await put({ name: "Al" });

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid fields");
    expect(users.update).not.toHaveBeenCalled();
  });

  it("returns 500 when the update fails", async () => {
    users.update.mockRejectedValue(new Error("db"));

    expect((await put({ name: "Alice" })).status).toBe(500);
  });
});
