// Account status: suspended / banned users lose access.
import { describe, expect, it } from "vitest";

import { suspendUserAction } from "../../../src/actions/admin/user-actions";
import { deleteAddressAction } from "../../../src/actions/user-addresses/user-address-actions";
import { auth } from "../../../src/auth";
import { createUser } from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

type BeforeSessionCreate = (session: {
  userId: string;
}) => Promise<{ data: unknown }>;

// The real hook (the integration setup only stubs auth.api.getSession).
const beforeSessionCreate = auth.options.databaseHooks!.session!.create!
  .before as unknown as BeforeSessionCreate;

let sessionSeq = 0;
const sessionFor = (userId: string) => {
  const n = ++sessionSeq;
  return testPrisma.session.create({
    data: {
      id: `sess-status-${n}`,
      token: `token-status-${n}`,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
};

describe("a suspended or banned user cannot start a session", () => {
  it.each(["SUSPENDED", "BANNED"] as const)(
    "session creation for a %s user is refused",
    async (status) => {
      const user = await createUser({ status });

      await expect(beforeSessionCreate({ userId: user.id })).rejects.toThrow(
        status === "SUSPENDED" ? /suspended/ : /banned/
      );
    }
  );

  it("session creation for an active user is allowed unchanged", async () => {
    const user = await createUser();
    const session = { userId: user.id };

    await expect(beforeSessionCreate(session)).resolves.toEqual({
      data: session,
    });
  });
});

describe("suspending a user signs them out everywhere", () => {
  it("suspendUserAction deletes every session of the target and no one else's", async () => {
    const admin = await createUser({ role: "ADMIN" });
    const target = await createUser();
    const bystander = await createUser();
    await sessionFor(target.id);
    await sessionFor(target.id);
    await sessionFor(bystander.id);
    asUser(admin);

    await suspendUserAction(target.id, "spam");

    const count = (userId: string) =>
      testPrisma.session.count({ where: { userId } });
    expect(await count(target.id)).toBe(0);
    expect(await count(bystander.id)).toBe(1);
  });
});

describe("a suspended or banned user is cut off at once", () => {
  it.each(["SUSPENDED", "BANNED"] as const)(
    "a %s user still holding a session is refused by actions and nothing changes",
    async (status) => {
      const user = await createUser({ status });
      asUser(user);

      await expect(deleteAddressAction("any-id")).rejects.toMatchObject({
        name: "UnauthenticatedError",
      });
    }
  );
});

describe("shop ownership is server-managed", () => {
  it("better-auth's update-user cannot set shop_id (it would claim another shop)", () => {
    expect(auth.options.user!.additionalFields!.shop_id.input).toBe(false);
  });
});
