// M1: `UserAddressRepository.setDefault` checked ownership *before* opening
// its `$transaction`, but the transaction's own `tx.userAddress.update`
// still targeted `where: { id: address_id }` alone - the ownership
// guarantee lived only in that pre-check, making the write TOCTOU-adjacent
// rather than atomic. Fixed by folding `user_id` into the final update's
// `where` too, so the database itself enforces the boundary regardless of
// what did or didn't change between the check and the write.
//
// This is a unit test (mocked prisma client), not an integration test:
// with everything running single-threaded and awaited in sequence, there
// is no way to force a real race between the pre-check and the transaction
// through the public API - the only way to observe whether the guarantee
// is atomic (query-level) or advisory (app-level-only) is to assert on the
// exact `where` argument the transactional update is called with.
import { describe, expect, it, vi } from "vitest";

import type { prisma } from "@/lib/prisma";
import { UserAddressRepository } from "@/repositories/user-address.repository";

function buildFakePrismaClient(
  existingAddress: { id: string; user_id: string } | null
) {
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const update = vi.fn().mockResolvedValue({ id: "addr-1", is_default: true });
  const findUnique = vi.fn().mockResolvedValue(existingAddress);

  type FakeTx = {
    userAddress: { updateMany: typeof updateMany; update: typeof update };
  };

  const tx: FakeTx = {
    userAddress: { updateMany, update },
  };

  const transaction = vi.fn(async (callback: (tx: FakeTx) => unknown) =>
    callback(tx)
  );

  const fakeClient = {
    userAddress: { findUnique },
    $transaction: transaction,
  };

  return { fakeClient, updateMany, update, findUnique, transaction };
}

describe("UserAddressRepository.setDefault - M1 (atomic ownership scoping)", () => {
  it("scopes the transactional update by BOTH address id and user id, not id alone", async () => {
    const { fakeClient, update } = buildFakePrismaClient({
      id: "addr-1",
      user_id: "user-1",
    });

    const repo = new UserAddressRepository(
      fakeClient as unknown as typeof prisma
    );
    await repo.setDefault("user-1", "addr-1");

    expect(update).toHaveBeenCalledTimes(1);
    const [args] = update.mock.calls[0] as [{ where: Record<string, unknown> }];
    // The regression this guards: `where` used to be `{ id: "addr-1" }`
    // alone. Assert user_id is present, not merely that id is - a where
    // clause missing user_id would still satisfy a weaker `toMatchObject`
    // check against just `{ id: "addr-1" }`.
    expect(args.where).toEqual({ id: "addr-1", user_id: "user-1" });
  });

  it("never opens the transaction (and so never gets a chance to write) when the pre-check ownership fails", async () => {
    const { fakeClient, transaction } = buildFakePrismaClient({
      id: "addr-1",
      user_id: "victim",
    });

    const repo = new UserAddressRepository(
      fakeClient as unknown as typeof prisma
    );
    const result = await repo.setDefault("attacker", "addr-1");

    expect(result).toBeNull();
    expect(transaction).not.toHaveBeenCalled();
  });
});
