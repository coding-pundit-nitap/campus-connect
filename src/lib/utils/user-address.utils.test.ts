import { describe, expect, it } from "vitest";

import type { UserAddress } from "@/generated/client";

import userAddressUIService, {
  userAddressUIService as named,
} from "./user-address.utils";

const address = (overrides: Partial<UserAddress> = {}) =>
  ({
    id: "a1",
    label: "Hostel",
    is_default: false,
    ...overrides,
  }) as UserAddress;

describe("userAddressUIService", () => {
  it("exports one singleton", () => {
    expect(userAddressUIService).toBe(named);
  });

  it.each([
    [1, false],
    [2, true],
    [0, true],
  ])("canDeleteAddress with %i address(es) -> %s", (count, expected) => {
    const all = Array.from({ length: count }, (_, i) =>
      address({ id: `a${i}` })
    );

    expect(userAddressUIService.canDeleteAddress(address(), all)).toBe(
      expected
    );
  });

  it("warns that a new default will be chosen when deleting the default", () => {
    expect(
      userAddressUIService.getDeleteConfirmationMessage(
        address({ is_default: true })
      )
    ).toBe(
      'Are you sure you want to delete your default address "Hostel"? Another address will be set as default.'
    );
  });

  it("asks a plain confirmation for non-default addresses", () => {
    expect(userAddressUIService.getDeleteConfirmationMessage(address())).toBe(
      'Are you sure you want to delete the address "Hostel"?'
    );
  });
});
