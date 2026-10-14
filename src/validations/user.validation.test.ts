import { omit } from "@tests/helpers/lib/builders";
import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  updateUserAddressSchema,
  updateUserSchema,
  userAddressSchema,
} from "./user.validation";

describe("updateUserSchema", () => {
  it.each([[{}], [{ name: "Asha" }], [{ phone: "999" }]])(
    "accepts %j",
    (input) => {
      expect(updateUserSchema.safeParse(input).success).toBe(true);
    }
  );

  it("rejects a short name", () => {
    expect(
      updateUserSchema.safeParse({ name: "As" }).error?.issues[0]?.message
    ).toBe("Name must be at least 3 characters long");
  });
});

describe("userAddressSchema", () => {
  const valid = { label: "Home", room_number: "1", building: "A" };

  it("defaults is_default to false", () => {
    expect(userAddressSchema.parse(valid).is_default).toBe(false);
  });

  it("accepts a building id instead of a name", () => {
    const rest = omit(valid, "building");

    expect(
      userAddressSchema.safeParse({ ...rest, building_id: "b" }).success
    ).toBe(true);
  });

  it.each([
    [{ building: " " }, "building_id", "Building details are required"],
    [{ label: "" }, "label", "Label is required"],
    [{ room_number: "" }, "room_number", "Room/Apartment number is required"],
  ])("rejects %j", (patch, path, message) => {
    expect(
      userAddressSchema.safeParse({ ...valid, ...patch }).error?.issues[0]
    ).toMatchObject({ path: [path], message });
  });
});

describe("updateUserAddressSchema", () => {
  it("requires an id", () => {
    const base = { label: "Home", room_number: "1", building: "A" };

    expect(updateUserAddressSchema.safeParse(base).success).toBe(false);
    expect(
      updateUserAddressSchema.safeParse({ ...base, id: "a1" }).success
    ).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "old",
    newPassword: "secret1",
    confirmPassword: "secret1",
  };

  it("accepts matching passwords", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [
      { currentPassword: "" },
      "currentPassword",
      "Current password is required",
    ],
    [
      { newPassword: "short", confirmPassword: "short" },
      "newPassword",
      "New password must be at least 6 characters long",
    ],
    [
      { confirmPassword: "different" },
      "confirmPassword",
      "Passwords do not match",
    ],
  ])("rejects %j", (patch, path, message) => {
    expect(
      changePasswordSchema.safeParse({ ...valid, ...patch }).error?.issues[0]
    ).toMatchObject({ path: [path], message });
  });
});
