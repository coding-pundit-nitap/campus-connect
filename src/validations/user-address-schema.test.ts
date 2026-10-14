import { describe, expect, it } from "vitest";

import { addressSchema } from "./user-address-schema";

const valid = { label: "Hostel", room_number: "101", is_default: false };

describe("addressSchema", () => {
  it.each([[{ building_id: "b-1" }], [{ building: "Block A" }]])(
    "accepts an address with %j",
    (patch) => {
      expect(addressSchema.safeParse({ ...valid, ...patch }).success).toBe(
        true
      );
    }
  );

  it.each([[{}], [{ building: "   " }], [{ building_id: "" }]])(
    "requires a building (%j)",
    (patch) => {
      expect(
        addressSchema.safeParse({ ...valid, ...patch }).error?.issues[0]
      ).toMatchObject({
        path: ["building_id"],
        message: "Building is required",
      });
    }
  );

  it.each([
    [{ label: "" }, "Label is required"],
    [{ room_number: "" }, "Room number is required"],
  ])("rejects %j", (patch, message) => {
    expect(
      addressSchema.safeParse({ ...valid, building: "A", ...patch }).error
        ?.issues[0]?.message
    ).toBe(message);
  });
});
