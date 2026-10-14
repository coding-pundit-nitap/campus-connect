import { describeNamedEntityRepository } from "@tests/helpers/repositories/named-entity-suite";

import { CategoryRepository } from "./category.repository";

describeNamedEntityRepository("CategoryRepository", "category", (client) => {
  const repo = new CategoryRepository(client);
  return {
    findById: (id, o) => (o ? repo.findById(id, o) : repo.findById(id)),
    findByName: (n, o) => (o ? repo.findByName(n, o) : repo.findByName(n)),
    search: (t, l) => repo.searchCategory(t, l),
    findOrCreate: (n) => repo.findOrCreate(n),
    deleteEmpty: () => repo.deleteEmptyCategories(),
    deleteIfEmpty: (id) => repo.deleteIfEmpty(id),
    getActive: () => repo.getActiveCategories(),
    findUnique: (a) => repo.findUnique(a as never),
    findMany: (a) => repo.findMany(a as never),
    create: (a) => repo.create(a as never),
    update: (i, d, o) => repo.update(i as never, d as never, o as never),
    delete: (i) => repo.delete(i as never),
    count: (a) => repo.count(a as never),
  };
});
