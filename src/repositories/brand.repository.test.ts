import { describeNamedEntityRepository } from "@tests/helpers/repositories/named-entity-suite";

import { BrandRepository } from "./brand.repository";

describeNamedEntityRepository("BrandRepository", "brand", (client) => {
  const repo = new BrandRepository(client);
  return {
    findById: (id, o) => (o ? repo.findById(id, o) : repo.findById(id)),
    findByName: (n, o) => (o ? repo.findByName(n, o) : repo.findByName(n)),
    search: (t, l) => repo.searchBrand(t, l),
    findOrCreate: (n) => repo.findOrCreate(n),
    deleteEmpty: () => repo.deleteEmptyBrands(),
    deleteIfEmpty: (id) => repo.deleteIfEmpty(id),
    getActive: () => repo.getActiveBrands(),
    findUnique: (a) => repo.findUnique(a as never),
    findMany: (a) => repo.findMany(a as never),
    create: (a) => repo.create(a as never),
    update: (i, d, o) => repo.update(i as never, d as never, o as never),
    delete: (i) => repo.delete(i as never),
    count: (a) => repo.count(a as never),
  };
});
