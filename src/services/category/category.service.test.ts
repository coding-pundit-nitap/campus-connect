import { mockOf } from "@tests/helpers";
import { beforeEach, describe, expect, it, type Mocked } from "vitest";

import { CategoryRepository } from "@/repositories/category.repository";

import { CategoryServices } from "./category.service";

describe("CategoryServices", () => {
  let repo: Mocked<CategoryRepository>;
  let service: CategoryServices;

  beforeEach(() => {
    repo = mockOf<CategoryRepository>();
    service = new CategoryServices(repo);
  });

  it.each(["cleanupEmptyCategories", "cleanupAllEmptyCategories"] as const)(
    "%s returns the deleted category ids",
    async (method) => {
      repo.deleteEmptyCategories.mockResolvedValue(["b1"]);

      await expect(service[method]()).resolves.toEqual(["b1"]);
    }
  );

  it.each(["cleanupEmptyCategories", "cleanupAllEmptyCategories"] as const)(
    "%s returns [] when the repository fails",
    async (method) => {
      repo.deleteEmptyCategories.mockRejectedValue(new Error("db"));

      await expect(service[method]()).resolves.toEqual([]);
    }
  );

  it("deleteCategoryIfEmpty forwards the repository result", async () => {
    repo.deleteIfEmpty.mockResolvedValue(true);

    await expect(service.deleteCategoryIfEmpty("b1")).resolves.toBe(true);
    expect(repo.deleteIfEmpty).toHaveBeenCalledWith("b1");
  });

  it("deleteCategoryIfEmpty returns false on failure", async () => {
    repo.deleteIfEmpty.mockRejectedValue(new Error("db"));

    await expect(service.deleteCategoryIfEmpty("b1")).resolves.toBe(false);
  });

  it("getActiveCategories returns the categories", async () => {
    repo.getActiveCategories.mockResolvedValue([{ id: "b1" }] as never);

    await expect(service.getActiveCategories()).resolves.toEqual([
      { id: "b1" },
    ]);
  });

  it("getActiveCategories returns [] on failure", async () => {
    repo.getActiveCategories.mockRejectedValue(new Error("db"));

    await expect(service.getActiveCategories()).resolves.toEqual([]);
  });
});
