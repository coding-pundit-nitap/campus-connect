// Account status: suspended / banned users lose access. Rules A31-A33, A39, A40.
import { describe, expect, it } from "vitest";

import { suspendUserAction } from "../../../../src/actions/admin/user-actions";
import { auth } from "../../../../src/auth";
import { createUser } from "../../../factories";
import { asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

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

describe("RULE A31: a suspended or banned user cannot start a session", () => {
  it.each(["SUSPENDED", "BANNED"] as const)(
    "RULE A31: session creation for a %s user is refused",
    async (status) => {
      const user = await createUser({ status });

      await expect(beforeSessionCreate({ userId: user.id })).rejects.toThrow(
        status === "SUSPENDED" ? /suspended/ : /banned/
      );
    }
  );

  it("RULE A31: session creation for an active user is allowed unchanged", async () => {
    const user = await createUser();
    const session = { userId: user.id };

    await expect(beforeSessionCreate(session)).resolves.toEqual({
      data: session,
    });
  });
});

describe("RULE A32: suspending a user signs them out everywhere", () => {
  it("RULE A32: suspendUserAction deletes every session of the target and no one else's", async () => {
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

describe("RULE A33/A39/A40: open questions", () => {
  it.todo(
    "RULE A33: a user suspended or banned while holding a session cookie is refused by actions at once — code currently trusts the better-auth cookie cache (src/auth.ts session.cookieCache maxAge 5 min), so actions keep working for up to 5 minutes after suspendUserAction deleted the sessions; needs product decision (accept the window, or check status in authUtils.getUserData)"
  );
  it.todo(
    "RULE A39: src/app/(protected)/layout.tsx renders the admin shell only for admins — code ignores the boolean returned by authUtils.isAdmin() (only a throw is handled); proxy (A3) still blocks /admin and every admin action re-checks, so this is defence in depth; CROSS-SCOPE (fix: `if (!(await authUtils.isAdmin())) unauthorized();`)"
  );
  it.todo(
    "RULE A40: a user cannot set their own shop_id through better-auth's POST /api/auth/update-user — src/auth.ts user.additionalFields.shop_id has no `input: false` (role and status do), so any signed-in user can link themselves to an existing shop that has no owner; src/hooks/ui/useShopForm.ts:48 relies on that client call to refresh the session after createShopAction (which already links the owner server-side); needs decision: add `input: false` and refresh the session another way"
  );
});
