import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma, Role } from "@/generated/client";
import type { prisma } from "@/lib/prisma";
import { UserRepository } from "@/repositories/user.repository";

function buildFakePrismaClient() {
  const findUnique = vi.fn().mockResolvedValue({ id: "user-1" });
  const findMany = vi.fn().mockResolvedValue([{ id: "user-1" }]);
  const create = vi.fn().mockResolvedValue({ id: "user-1" });
  const update = vi.fn().mockResolvedValue({ id: "user-1" });
  const deleteMock = vi.fn().mockResolvedValue({ id: "user-1" });
  const count = vi.fn().mockResolvedValue(1);
  const deleteManySessions = vi.fn().mockResolvedValue({ count: 1 });

  const fakeClient = {
    user: {
      findUnique,
      findMany,
      create,
      update,
      delete: deleteMock,
      count,
    },
    session: {
      deleteMany: deleteManySessions,
    },
  };

  return {
    fakeClient,
    findUnique,
    findMany,
    create,
    update,
    deleteMock,
    count,
    deleteManySessions,
  };
}

describe("UserRepository (Unit)", () => {
  let fakeClient: ReturnType<typeof buildFakePrismaClient>["fakeClient"];
  let repo: UserRepository;
  let spies: ReturnType<typeof buildFakePrismaClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    spies = buildFakePrismaClient();
    fakeClient = spies.fakeClient;
    repo = new UserRepository(fakeClient as unknown as typeof prisma);
  });

  describe("findAdmins", () => {
    it("finds users with ADMIN role", async () => {
      await repo.findAdmins();
      expect(spies.findMany).toHaveBeenCalledTimes(1);
      expect(spies.findMany.mock.calls[0][0]).toEqual({
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
      expect(spies.findUnique).toHaveBeenCalledTimes(1);
      expect(spies.findUnique.mock.calls[0][0]).toEqual({
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
      expect(spies.findUnique).toHaveBeenCalledTimes(1);
      expect(spies.findUnique.mock.calls[0][0]).toEqual({
        select: { id: true },
        where: { is_active: true, email: "test@example.com" },
      });
    });
  });

  describe("findUnique", () => {
    it("delegates", async () => {
      await repo.findUnique({ where: { id: "user-1" } });
      expect(spies.findUnique).toHaveBeenCalledTimes(1);
      expect(spies.findUnique.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
      });
    });
  });

  describe("findMany", () => {
    it("delegates", async () => {
      await repo.findMany({ take: 10 });
      expect(spies.findMany).toHaveBeenCalledTimes(1);
      expect(spies.findMany.mock.calls[0][0]).toEqual({ take: 10 });
    });
  });

  describe("create", () => {
    it("delegates", async () => {
      await repo.create({
        data: { email: "test@example.com" },
      } as Prisma.UserCreateArgs);
      expect(spies.create).toHaveBeenCalledTimes(1);
      expect(spies.create.mock.calls[0][0]).toEqual({
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
      expect(spies.update).toHaveBeenCalledTimes(1);
      expect(spies.update.mock.calls[0][0]).toEqual({
        include: { profile: true },
        where: { is_active: true, id: "user-1" },
        data: { name: "Test" },
      });
    });

    it("delegates when args object passed", async () => {
      await repo.update({ where: { id: "user-1" }, data: { name: "Test" } });
      expect(spies.update).toHaveBeenCalledTimes(1);
      expect(spies.update.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
        data: { name: "Test" },
      });
    });
  });

  describe("delete", () => {
    it("scopes by id when id is string", async () => {
      await repo.delete("user-1");
      expect(spies.deleteMock).toHaveBeenCalledTimes(1);
      expect(spies.deleteMock.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
      });
    });

    it("delegates when args object passed", async () => {
      await repo.delete({ where: { id: "user-1" } });
      expect(spies.deleteMock).toHaveBeenCalledTimes(1);
      expect(spies.deleteMock.mock.calls[0][0]).toEqual({
        where: { id: "user-1" },
      });
    });
  });

  describe("count", () => {
    it("delegates", async () => {
      await repo.count({ where: { emailVerified: true } });
      expect(spies.count).toHaveBeenCalledTimes(1);
      expect(spies.count.mock.calls[0][0]).toEqual({
        where: { emailVerified: true },
      });
    });
  });

  describe("deleteAllSessions", () => {
    it("deletes sessions for user", async () => {
      await repo.deleteAllSessions("user-1");
      expect(spies.deleteManySessions).toHaveBeenCalledTimes(1);
      expect(spies.deleteManySessions.mock.calls[0][0]).toEqual({
        where: { userId: "user-1" },
      });
    });
  });
});
