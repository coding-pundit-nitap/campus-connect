import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma, Role } from "@/generated/client";
import { UserRepository } from "@/repositories/user.repository";

describe("UserRepository (Unit)", () => {
  let prisma: PrismaMock;
  let repo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    prisma.user.findMany.mockResolvedValue([{ id: "user-1" }]);
    repo = new UserRepository(asPrisma(prisma));
  });

  describe("findAdmins", () => {
    it("finds users with ADMIN role", async () => {
      await expect(repo.findAdmins()).resolves.toEqual([{ id: "user-1" }]);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany.mock.calls[0][0]).toEqual({
        where: { role: Role.ADMIN },
      });
    });
  });

  describe("findById", () => {
    it("scopes by id", async () => {
      await repo.findById("user-1", {
        include: { profile: true },
        where: { is_active: true } as Prisma.UserWhereInput,
      } as unknown as Omit<Prisma.UserFindUniqueArgs, "where">);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique.mock.calls[0][0]).toEqual({
        include: { profile: true },
        where: { is_active: true, id: "user-1" },
      });
    });
  });

  describe("findByEmail", () => {
    it("scopes by email", async () => {
      await repo.findByEmail("test@example.com", {
        select: { id: true },
        where: { is_active: true } as Prisma.UserWhereInput,
      } as unknown as Omit<Prisma.UserFindUniqueArgs, "where">);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique.mock.calls[0][0]).toEqual({
        select: { id: true },
        where: { is_active: true, email: "test@example.com" },
      });
    });
  });

  describe("findUnique", () => {
    it("delegates", async () => {
      await repo.findUnique({ where: { id: "user-1" } });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
      });
    });
  });

  describe("findMany", () => {
    it("delegates", async () => {
      await repo.findMany({ take: 10 });
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany.mock.calls[0][0]).toEqual({ take: 10 });
    });
  });

  describe("create", () => {
    it("delegates", async () => {
      await repo.create({
        data: { email: "test@example.com" },
      } as Prisma.UserCreateArgs);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create.mock.calls[0][0]).toEqual({
        data: { email: "test@example.com" },
      });
    });
  });

  describe("update", () => {
    it("scopes by id when id is string", async () => {
      await repo.update("user-1", { name: "Test" }, {
        where: { is_active: true } as Prisma.UserWhereInput,
        include: { profile: true },
      } as unknown as Omit<Prisma.UserUpdateArgs, "where" | "data">);
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(prisma.user.update.mock.calls[0][0]).toEqual({
        include: { profile: true },
        where: { is_active: true, id: "user-1" },
        data: { name: "Test" },
      });
    });

    it("delegates when args object passed", async () => {
      await repo.update({ where: { id: "user-1" }, data: { name: "Test" } });
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(prisma.user.update.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
        data: { name: "Test" },
      });
    });
  });

  describe("delete", () => {
    it("scopes by id when id is string", async () => {
      await repo.delete("user-1");
      expect(prisma.user.delete).toHaveBeenCalledTimes(1);
      expect(prisma.user.delete.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
      });
    });

    it("delegates when args object passed", async () => {
      await repo.delete({ where: { id: "user-1" } });
      expect(prisma.user.delete).toHaveBeenCalledTimes(1);
      expect(prisma.user.delete.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
      });
    });
  });

  describe("count", () => {
    it("delegates", async () => {
      await repo.count({ where: { emailVerified: true } });
      expect(prisma.user.count).toHaveBeenCalledTimes(1);
      expect(prisma.user.count.mock.calls[0][0]).toEqual({
        where: { emailVerified: true },
      });
    });
  });

  describe("deleteAllSessions", () => {
    it("deletes sessions for user", async () => {
      await repo.deleteAllSessions("user-1");
      expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.session.deleteMany.mock.calls[0][0]).toEqual({
        where: { userId: "user-1" },
      });
    });
  });

  describe("scoped finders without options", () => {
    it("findById queries by id only and returns the row", async () => {
      await expect(repo.findById("user-1")).resolves.toEqual({ id: "user-1" });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });

    it("findByEmail queries by email only", async () => {
      await repo.findByEmail("a@b.c");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "a@b.c" },
      });
    });

    it("findById cannot be redirected by a caller where.id", async () => {
      await repo.findById("user-1", {
        where: { id: "victim" },
      } as unknown as Omit<Prisma.UserFindUniqueArgs, "where">);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });

    it("update without options or data sends an empty data object", async () => {
      await repo.update(
        "user-1",
        undefined as unknown as Prisma.UserUpdateInput
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {},
      });
    });
  });
});
