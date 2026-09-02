import { describe, expect, it } from "vitest";

import {
  addUserAddress,
  deleteUserAddress,
  updateUser,
  updateUserAddress,
} from "@/actions/user";
import { ForbiddenError } from "@/lib/custom-error";

import { createUser, createUserAddress } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("User Actions", () => {
  describe("updateUser", () => {
    it("throws if anonymous", async () => {
      await asAnonymous();
      await expect(
        updateUser({ name: "New Name", phone: "1234567890" })
      ).rejects.toThrow(); // UnauthorizedError or unAuthenticated() throw
    });

    it("updates user profile", async () => {
      const user = await createUser();
      await asUser(user);

      await updateUser({ name: "Updated Name", phone: "9876543210" });

      const dbUser = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser?.name).toBe("Updated Name");
      expect(dbUser?.phone).toBe("9876543210");
    });
  });

  describe("addUserAddress", () => {
    it("adds a new address for the user", async () => {
      const user = await createUser();
      await asUser(user);

      // Need a valid building id from reference data, standard setup usually has some or we can create it
      const building = await testPrisma.building.create({
        data: { id: "test-building", name: "Test Building" },
      });

      await addUserAddress({
        building: "Test Building",
        room_number: "404",
        label: "Home",
        is_default: false,
      });

      const addresses = await testPrisma.userAddress.findMany({
        where: { user_id: user.id },
      });
      expect(addresses).toHaveLength(1);
      expect(addresses[0].room_number).toBe("404");
      expect(addresses[0].label).toBe("Home");
    });
  });

  describe("updateUserAddress", () => {
    it("updates address and respects ownership", async () => {
      const user = await createUser();
      await asUser(user);

      await testPrisma.building.create({
        data: { id: "test-bld", name: "Test Building" },
      });

      const address = await createUserAddress({
        user_id: user.id,
        building_id: "test-bld",
      });

      await updateUserAddress({
        id: address.id,
        building: "New Building",
        room_number: "505",
        label: "Home",
        is_default: false,
      });

      const dbAddress = await testPrisma.userAddress.findUnique({
        where: { id: address.id },
      });
      expect(dbAddress?.room_number).toBe("505");
      expect(dbAddress?.building).toBe("New Building");
    });

    it("throws Forbidden if attempting to update another users address", async () => {
      const otherUser = await createUser();

      await testPrisma.building.create({
        data: { id: "test-bld", name: "Test Building" },
      });
      const address = await createUserAddress({
        user_id: otherUser.id,
        building_id: "test-bld",
      });

      const me = await createUser();
      await asUser(me);

      await expect(
        updateUserAddress({
          id: address.id,
          building: "My Building",
          room_number: "999",
          label: "Home",
          is_default: false,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("deleteUserAddress", () => {
    it("deletes address successfully", async () => {
      const user = await createUser();
      await asUser(user);

      await testPrisma.building.create({
        data: { id: "test-bld", name: "Test Building" },
      });

      const address = await createUserAddress({
        user_id: user.id,
        building_id: "test-bld",
      });

      await deleteUserAddress(address.id);

      const dbAddress = await testPrisma.userAddress.findUnique({
        where: { id: address.id },
      });
      expect(dbAddress).toBeNull();
    });

    it("throws Forbidden if not owner", async () => {
      const otherUser = await createUser();
      
      await testPrisma.building.create({
        data: { id: "test-bld", name: "Test Building" },
      });
      const address = await createUserAddress({
        user_id: otherUser.id,
        building_id: "test-bld",
      });

      const me = await createUser();
      await asUser(me);

      await expect(deleteUserAddress(address.id)).rejects.toThrow(ForbiddenError);
    });
  });
});
