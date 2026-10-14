import { mockOf } from "@tests/helpers";
import { beforeEach, describe, expect, it, type Mocked } from "vitest";

import { BrandRepository } from "@/repositories/brand.repository";

import { BrandServices } from "./brand.service";

describe("BrandServices", () => {
  let repo: Mocked<BrandRepository>;
  let service: BrandServices;

  beforeEach(() => {
    repo = mockOf<BrandRepository>();
    service = new BrandServices(repo);
  });

  it.each(["cleanupEmptyBrands", "cleanupAllEmptyBrands"] as const)(
    "%s returns the deleted brand ids",
    async (method) => {
      repo.deleteEmptyBrands.mockResolvedValue(["b1"]);

      await expect(service[method]()).resolves.toEqual(["b1"]);
    }
  );

  it.each(["cleanupEmptyBrands", "cleanupAllEmptyBrands"] as const)(
    "%s returns [] when the repository fails",
    async (method) => {
      repo.deleteEmptyBrands.mockRejectedValue(new Error("db"));

      await expect(service[method]()).resolves.toEqual([]);
    }
  );

  it("deleteBrandIfEmpty forwards the repository result", async () => {
    repo.deleteIfEmpty.mockResolvedValue(true);

    await expect(service.deleteBrandIfEmpty("b1")).resolves.toBe(true);
    expect(repo.deleteIfEmpty).toHaveBeenCalledWith("b1");
  });

  it("deleteBrandIfEmpty returns false on failure", async () => {
    repo.deleteIfEmpty.mockRejectedValue(new Error("db"));

    await expect(service.deleteBrandIfEmpty("b1")).resolves.toBe(false);
  });

  it("getActiveBrands returns the brands", async () => {
    repo.getActiveBrands.mockResolvedValue([{ id: "b1" }] as never);

    await expect(service.getActiveBrands()).resolves.toEqual([{ id: "b1" }]);
  });

  it("getActiveBrands returns [] on failure", async () => {
    repo.getActiveBrands.mockRejectedValue(new Error("db"));

    await expect(service.getActiveBrands()).resolves.toEqual([]);
  });
});
