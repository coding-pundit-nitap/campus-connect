import { asMock, overrideEnv } from "@tests/helpers/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("better-auth", () => ({
  betterAuth: vi.fn((options: unknown) => ({ options })),
}));
vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(() => "prisma-adapter"),
}));
vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);

type AuthOptions = {
  database: unknown;
  baseURL: string;
  emailAndPassword: { enabled: boolean };
  trustedOrigins: string[];
  socialProviders: { google: { clientId: string; prompt: string } };
  databaseHooks: {
    session: {
      create: { before: (s: { userId: string }) => Promise<unknown> };
    };
  };
  user: { additionalFields: Record<string, { defaultValue?: unknown }> };
  defaultCookieAttributes: { sameSite: string; secure: boolean };
};

let restoreEnv: () => void = () => {};

/** Fresh auth module built under the given env overrides. */
async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  const { env } = await import("@/config/env.config");
  restoreEnv = overrideEnv(env, overrides);
  const { auth } = await import("./auth");
  const { prisma } = await import("@/lib/prisma");
  const { prismaAdapter } = await import("better-auth/adapters/prisma");
  return {
    env,
    options: (auth as unknown as { options: AuthOptions }).options,
    db: asMock(prisma),
    prisma,
    prismaAdapter: vi.mocked(prismaAdapter),
  };
}

describe("auth configuration", () => {
  afterEach(() => restoreEnv());

  it("uses the prisma adapter, Google sign-in and no passwords", async () => {
    const { env, options, prisma, prismaAdapter } = await load();

    expect(prismaAdapter).toHaveBeenCalledWith(prisma, {
      provider: "postgresql",
    });
    expect(options.database).toBe("prisma-adapter");
    expect(options.baseURL).toBe(env.BETTER_AUTH_URL);
    expect(options.emailAndPassword.enabled).toBe(false);
    expect(options.trustedOrigins).toEqual([env.NEXT_PUBLIC_APP_URL]);
    expect(options.socialProviders.google).toMatchObject({
      clientId: env.GOOGLE_CLIENT_ID,
      prompt: "select_account",
    });
    expect(options.user.additionalFields.role.defaultValue).toBe("USER");
    expect(options.user.additionalFields.status.defaultValue).toBe("ACTIVE");
  });

  it("trusts no origins without an app URL", async () => {
    const { options } = await load({ NEXT_PUBLIC_APP_URL: "" });

    expect(options.trustedOrigins).toEqual([]);
  });

  it.each([
    ["test", "https://x", "lax", false],
    ["production", "http://x", "lax", false],
    ["production", undefined, "lax", undefined],
    ["production", "https://x", "none", true],
  ])(
    "cookies for NODE_ENV=%s and BETTER_AUTH_URL=%s are sameSite=%s secure=%s",
    async (NODE_ENV, BETTER_AUTH_URL, sameSite, secure) => {
      const { options } = await load({ NODE_ENV, BETTER_AUTH_URL });

      expect(options.defaultCookieAttributes).toEqual({ sameSite, secure });
    }
  );
});

describe("session.create.before hook", () => {
  let before: AuthOptions["databaseHooks"]["session"]["create"]["before"];
  let db: Awaited<ReturnType<typeof load>>["db"];

  beforeEach(async () => {
    ({
      options: {
        databaseHooks: {
          session: {
            create: { before },
          },
        },
      },
      db,
    } = await load());
  });
  afterEach(() => restoreEnv());

  it.each([{ status: "ACTIVE" }, null])(
    "lets the session through for user %o",
    async (user) => {
      db.user.findUnique.mockResolvedValue(user);
      const session = { userId: "u1" };

      await expect(before(session)).resolves.toEqual({ data: session });
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "u1" },
        select: { status: true },
      });
    }
  );

  it.each([
    ["SUSPENDED", "Your account has been suspended. Please contact support."],
    ["BANNED", "Your account has been banned."],
  ])("rejects %s users", async (status, message) => {
    db.user.findUnique.mockResolvedValue({ status });

    await expect(before({ userId: "u1" })).rejects.toThrow(message);
  });
});
